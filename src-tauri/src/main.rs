// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;

use once_cell::sync::Lazy;
use tauri::AppHandle;

pub(crate) mod file;
pub(crate) mod js_run;

pub(crate) static APP_HANDLE: Lazy<Mutex<Option<AppHandle>>> = Lazy::new(|| Mutex::new(None));

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();
            // 存储 AppHandle
            match APP_HANDLE.lock() {
                Ok(mut handle_guard) => {
                    *handle_guard = Some(handle.clone());
                }
                Err(_) => {}
            };

            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            js_run::greet,
            js_run::run_js_script,
            file::rename_file,
            file::write_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
