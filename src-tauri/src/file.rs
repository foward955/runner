#[tauri::command]
pub(crate) fn rename_file(old: String, to: String) -> bool {
    match std::fs::rename(old, to) {
        Ok(_) => true,
        Err(_) => false,
    }
}

#[tauri::command]
pub(crate) fn write_file(path: String, content: String) -> bool {
    match std::fs::write(path, content) {
        Ok(_) => true,
        Err(_) => false,
    }
}
