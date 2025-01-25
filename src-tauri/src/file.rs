#[tauri::command]
pub(crate) fn rename_file(old: String, to: String) -> bool {
    match std::fs::rename(old, to) {
        Ok(_) => true,
        Err(_) => false,
    }
}

#[tauri::command]
pub(crate) fn file_exist(path: String) -> bool {
    match std::fs::exists(path) {
        Ok(s) => s,
        Err(_) => false,
    }
}

#[tauri::command]
pub(crate) fn read_file(path: String) -> Option<String> {
    match std::fs::read_to_string(path) {
        Ok(s) => Some(s),
        Err(_) => None,
    }
}

#[tauri::command]
pub(crate) fn write_file(path: String, content: String) -> bool {
    match std::fs::write(path, content) {
        Ok(_) => true,
        Err(_) => false,
    }
}
