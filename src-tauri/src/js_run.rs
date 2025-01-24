use std::cell::RefCell;
use std::env::current_dir;
use std::io::Read;
use std::rc::Rc;
use std::sync::mpsc::channel;
use std::time::Duration;

use deno_core::error::OpError;
use deno_core::v8::IsolateHandle;
use deno_core::RuntimeOptions;

use deno_core::{extension, op2, JsRuntime};
use serde::Deserialize;
use serde::Serialize;
use tauri::Emitter;

use crate::APP_HANDLE;

thread_local! {
    static MSG: RefCell<Vec<String>> = const {RefCell::new(vec![])}
}

static RUNTIME_SNAPSHOT: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/RUNJS_SNAPSHOT.bin"));

#[op2]
#[string]
fn op_print_msg(#[string] s: String) -> Result<String, OpError> {
    println!("op_print_msg: {}", s);

    MSG.with(|f| {
        let mut m = f.borrow_mut();
        m.push(format!("{}", s));
    });
    Ok(String::default())
}

extension!(runjs, ops = [op_print_msg],);

#[derive(Serialize, Deserialize)]
pub enum ConsoleResult {
    S(String),
    V(Vec<String>),
}

#[tauri::command]
pub(crate) async fn greet(path: String) -> ConsoleResult {
    let (sx, rx) = channel();
    let (sx1, rx1) = channel();

    std::thread::spawn(move || {
        let mut runtime = JsRuntime::new(RuntimeOptions {
            module_loader: Some(Rc::new(deno_core::FsModuleLoader)),
            startup_snapshot: Some(RUNTIME_SNAPSHOT),
            extensions: vec![runjs::init_ops()],
            ..Default::default()
        });

        let h = runtime.v8_isolate().thread_safe_handle();
        sx.send(h).unwrap();

        let x = async move {
            let cwd = current_dir().unwrap();

            let main_module = deno_core::resolve_url_or_path(&path, &cwd).unwrap();
            let mod_id = runtime.load_main_es_module(&main_module).await.unwrap();
            let result = runtime.mod_evaluate(mod_id);

            runtime.run_event_loop(Default::default()).await.unwrap();
            match result.await {
                Ok(_) => {
                    MSG.with(|f| {
                        sx1.send(f.take()).unwrap();
                    });
                }
                Err(_) => {
                    println!("error: {}", path);
                }
            };
        };

        let t = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();

        t.block_on(x);
    });

    let monitor_handle = std::thread::spawn(move || {
        let h: IsolateHandle = rx.recv().unwrap();

        std::thread::sleep(Duration::from_secs(3));
        println!("时间已到，结束任务...");

        h.terminate_execution();
    });

    monitor_handle.join().unwrap();

    match rx1.recv() {
        Ok(x) => {
            if x.is_empty() {
                ConsoleResult::S(String::default())
            } else {
                if x.len() == 1 {
                    ConsoleResult::S(x[0].clone())
                } else {
                    ConsoleResult::V(x)
                }
            }
        }
        Err(_) => ConsoleResult::S(String::default()),
    }
}

#[tauri::command]
pub(crate) async fn run_js_script(path: String) {
    let command = subprocess::Exec::cmd("deno")
        .arg("--allow-import")
        .arg(path.as_str());

    let mut p = command
        .stdout(subprocess::Redirection::Pipe)
        .popen()
        .unwrap();

    if let Some(status) = p.wait_timeout(Duration::from_secs(3)).unwrap() {
        match p.stdout.take() {
            Some(mut f) => {
                let mut s = String::default();
                f.read_to_string(&mut s).unwrap();

                match APP_HANDLE.lock() {
                    Ok(mut handle_guard) => match handle_guard.as_mut() {
                        Some(handle) => {
                            handle.emit("console-message", s).unwrap();
                        }
                        None => {}
                    },
                    Err(_) => {}
                }
            }
            None => {}
        }
        println!("process finished as {:?}", status);
    } else {
        p.terminate().unwrap();
        p.wait().unwrap();
        println!("process killed");
    }
}
