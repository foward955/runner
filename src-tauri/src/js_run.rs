use std::cell::RefCell;
use std::env::current_dir;
use std::io::{BufRead, Read};
use std::os::windows::process::CommandExt;
use std::rc::Rc;
use std::sync::mpsc::channel;
use std::sync::Mutex;
use std::time::Duration;

use deno_core::error::OpError;
use deno_core::v8::IsolateHandle;
use deno_core::RuntimeOptions;

use deno_core::{extension, op2, JsRuntime};
use serde::Deserialize;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, Runtime};

use crate::app_state::{check_js_running, reset_app_state, set_new_running};
use crate::AppState;

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
pub(crate) async fn run_js_by_deno_core(path: String) -> ConsoleResult {
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
pub(crate) async fn run_js_script<R: Runtime>(app: AppHandle<R>, path: String) {
    if check_js_running(app.clone()) {
        println!("cmd not finish, not execute new script.");
        return;
    }

    const CREATE_NO_WINDOW: u32 = 0x08000000;

    match std::process::Command::new("deno")
        .arg("--allow-import")
        .arg(path.as_str())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
    {
        Ok(mut cmd) => {
            set_new_running(app.clone());

            let app_stdout_handle = app.clone();
            let app_stderr_handle = app.clone();

            let stdout = cmd.stdout.take().unwrap();
            let stderr = cmd.stderr.take().unwrap();

            let mut terminate = false;

            let stdout_handle = std::thread::spawn(move || {
                let reader = std::io::BufReader::new(stdout);

                // 将输出逐行写入文件
                for line_result in reader.lines() {
                    let state = app_stdout_handle.state::<Mutex<AppState>>();
                    let state = state.lock().unwrap();

                    if state.exit_js_run {
                        let _ = cmd.kill();
                        terminate = true;
                        println!("cmd terminated.");
                        break;
                    }

                    match line_result {
                        Ok(line) => {
                            app_stdout_handle.emit("console-message", line).unwrap();
                        }
                        Err(_) => {
                            let _ = cmd.kill();
                            terminate = true;
                            println!("cmd terminated.");
                        }
                    }
                }

                // finish read from the stdout
                app_stdout_handle.emit("console-finish", terminate).unwrap();
            });

            let stderr_handle = std::thread::spawn(move || {
                let mut reader = std::io::BufReader::new(stderr);

                let mut err = String::default();
                reader.read_to_string(&mut err).unwrap();

                app_stderr_handle.emit("console-message", err).unwrap();
                // finish read from the stdout
                app_stderr_handle.emit("console-finish", terminate).unwrap();
            });

            stdout_handle.join().unwrap();
            stderr_handle.join().unwrap();

            reset_app_state(app);
        }
        Err(_) => {}
    }
}

#[tauri::command]
pub(crate) fn terminate_run_js_script<R: Runtime>(app: AppHandle<R>) {
    let state = app.state::<Mutex<AppState>>();
    let mut state = state.lock().unwrap();

    if state.js_running {
        state.exit_js_run = true;
    }
}
