// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;

use app_state::AppState;
use tauri::Manager;

pub(crate) mod app_state;
pub(crate) mod file;
pub(crate) mod js_run;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));

            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            js_run::run_js_by_deno_core,
            js_run::run_js_script,
            js_run::terminate_run_js_script,
            file::rename_file,
            file::write_file,
            file::read_file,
            file::file_exist,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
