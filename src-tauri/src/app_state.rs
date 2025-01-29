use std::process::Child;

pub const CONSOLE_OUTPUT: &'static str = "console-output";
// pub const CONSOLE_CLEAR: &'static str = "console-clear";
pub const TOAST_OUTPUT: &'static str = "toast-output";

#[derive(Default)]
pub(crate) struct AppState {
    pub(crate) running_command: Option<Child>,
    pub(crate) terminated: bool,
}

impl AppState {
    pub(crate) fn terminate_command(&mut self) -> Result<(), std::io::Error> {
        if let Some(mut child) = self.running_command.take() {
            child.kill().and_then(|_| {
                self.terminated = true;
                Ok(())
            })
        } else {
            Ok(())
        }
    }

    pub(crate) fn terminated(&self) -> bool {
        self.terminated
    }

    pub(crate) fn run_new(&mut self, cmd: Child) {
        self.running_command = Some(cmd);
        self.terminated = false;
    }

    pub(crate) fn reset(&mut self) {
        self.running_command = None;
        self.terminated = false;
    }

    pub(crate) fn check_js_running(&self) -> bool {
        self.running_command.is_some()
    }
}
