use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, Runtime};

#[derive(Default)]
pub(crate) struct AppState {
    pub(crate) exit_js_run: bool,
    pub(crate) js_running: bool,
}

#[derive(Serialize, Clone, Copy)]
pub(crate) enum ToastType {
    Info,
}

#[derive(Serialize, Clone)]
struct ToastMessage {
    r#type: ToastType,
    msg: String,
}

impl ToastMessage {
    pub fn new(t: ToastType, msg: String) -> Self {
        Self { r#type: t, msg }
    }
}

pub(crate) fn check_js_running<R: Runtime>(app: AppHandle<R>) -> bool {
    let state = app.state::<Mutex<AppState>>();
    let state = state.lock().unwrap();

    if state.js_running {
        let _ = app.emit(
            "toast-message",
            ToastMessage::new(
                ToastType::Info,
                String::from("js script is running, please wait or stop old task."),
            ),
        );
        true
    } else {
        false
    }
}

pub(crate) fn set_new_running<R: Runtime>(app: AppHandle<R>) {
    let state = app.state::<Mutex<AppState>>();
    let mut state = state.lock().unwrap();

    state.js_running = true;

    // start running a new js script, clear before terminal
    app.emit("console-clear", true).unwrap();
}

pub(crate) fn reset_app_state<R: Runtime>(app: AppHandle<R>) {
    let state = app.state::<Mutex<AppState>>();
    let mut state = state.lock().unwrap();
    state.js_running = false;
    state.exit_js_run = false;
}
