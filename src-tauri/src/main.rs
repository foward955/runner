// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::cell::RefCell;
use std::rc::Rc;
use std::sync::mpsc::channel;
use std::time::Duration;

use deno_core::error::OpError;
use deno_core::serde_v8;
use deno_core::v8;
use deno_core::v8::IsolateHandle;
use deno_core::RuntimeOptions;

use deno_core::{extension, op2, JsRuntime};
use serde::Deserialize;
use serde::Serialize;

thread_local! {
    static MSG: RefCell<Vec<String>> = const {RefCell::new(vec![])}
}

#[op2]
#[string]
fn op_print_msg(#[string] s: String) -> Result<String, OpError> {
    MSG.with(|f| {
        let mut m = f.borrow_mut();
        m.push(format!("{}", s));
    });
    Ok(String::default())
}

extension!(
    runjs,
    ops = [op_print_msg],
    esm_entry_point = "ext:runjs/runtime.js",
    esm = [dir "scripts", "runtime.js"]
);

#[derive(Serialize, Deserialize)]
enum ConsoleResult {
    S(String),
    V(Vec<String>),
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(code: String) -> ConsoleResult {
    let (sx, rx) = channel();
    let (sx1, rx1) = channel();

    std::thread::spawn(move || {
        let main_module = deno_core::resolve_path(
            "scripts/runtime.js",
            std::env::current_dir().unwrap().as_path(),
        )
        .unwrap();

        let mut runtime = JsRuntime::new(RuntimeOptions {
            module_loader: Some(Rc::new(deno_core::FsModuleLoader)),
            extensions: vec![runjs::init_ops_and_esm()],
            ..Default::default()
        });

        let h = runtime.v8_isolate().thread_safe_handle();
        sx.send(h).unwrap();

        let x = async move {
            let mod_id = runtime.load_main_es_module(&main_module).await.unwrap();
            let result = runtime.mod_evaluate(mod_id);

            runtime.run_event_loop(Default::default()).await.unwrap();
            result.await.unwrap();
            match eval(&mut runtime, code) {
                Ok(_v) => {
                    MSG.with(|f| {
                        let m = f.take();

                        // m.push(v.to_string());

                        sx1.send(m).unwrap();
                    });
                }
                Err(_) => {}
            };
        };

        let t = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();

        t.block_on(x);

        // deno_core::futures::executor::block_on(
        //     runtime.run_event_loop(PollEventLoopOptions::default()),
        // )
        // .unwrap();
    });

    let monitor_handle = std::thread::spawn(move || {
        let h: IsolateHandle = rx.recv().unwrap();

        std::thread::sleep(Duration::from_secs(3));
        println!("时间已到，结束任务...");

        // extern "C" fn interrupt_fn(isolate: &mut v8::Isolate, _: *mut std::ffi::c_void) {
        //     let _ = isolate.terminate_execution();
        // }

        // h.request_interrupt(interrupt_fn, std::ptr::null_mut());

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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn eval(context: &mut JsRuntime, code: String) -> Result<serde_json::Value, String> {
    let res = context.execute_script("<anon>", code);
    match res {
        Ok(global) => {
            let scope = &mut context.handle_scope();
            let local = v8::Local::new(scope, global);
            // Deserialize a `v8` object into a Rust type using `serde_v8`,
            // in this case deserialize to a JSON `Value`.
            let deserialized_value = serde_v8::from_v8::<serde_json::Value>(scope, local);

            match deserialized_value {
                Ok(value) => Ok(value),
                Err(err) => Err(format!("Cannot deserialize value: {err:?}")),
            }
        }
        Err(err) => Err(format!("Evaling error: {err:?}")),
    }
}
