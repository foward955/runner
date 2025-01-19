// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub(crate) mod file;
pub(crate) mod js_run;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            js_run::greet,
            file::rename_file,
            file::write_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
