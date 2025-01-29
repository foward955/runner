use serde::Serialize;

#[derive(Serialize, Clone, Copy)]
pub enum MessageContainer {
    Console,
    Toast,
}

#[derive(Serialize, Clone, Copy)]
pub enum MessageType {
    Success,
    Warn,
    Info,
    Error,
}

#[derive(Serialize, Clone, Copy, Default)]
pub enum MessageAction {
    #[default]
    None,
    Clear,
}

#[derive(Serialize, Clone, Copy)]
pub struct Message<T: Serialize> {
    container: MessageContainer,
    r#type: MessageType,
    action: MessageAction,
    content: Option<T>,
}

impl<T: Serialize> Message<T> {
    pub fn new(
        container: MessageContainer,
        ty: MessageType,
        action: MessageAction,
        content: Option<T>,
    ) -> Self {
        Self {
            container,
            r#type: ty,
            action,
            content,
        }
    }

    pub fn new_console(ty: MessageType, content: Option<T>) -> Self {
        Self::new(MessageContainer::Console, ty, MessageAction::None, content)
    }

    pub fn new_toast(ty: MessageType, content: Option<T>) -> Self {
        Self::new(MessageContainer::Toast, ty, MessageAction::None, content)
    }

    pub fn console_clear(content: Option<T>) -> Self {
        Self::new(
            MessageContainer::Console,
            MessageType::Info,
            MessageAction::Clear,
            content,
        )
    }

    pub fn console_success(content: Option<T>) -> Self {
        Self::new_console(MessageType::Success, content)
    }
    pub fn console_warn(content: Option<T>) -> Self {
        Self::new_console(MessageType::Warn, content)
    }
    pub fn console_info(content: Option<T>) -> Self {
        Self::new_console(MessageType::Info, content)
    }
    pub fn console_error(content: Option<T>) -> Self {
        Self::new_console(MessageType::Error, content)
    }

    pub fn toast_success(content: Option<T>) -> Self {
        Self::new_toast(MessageType::Success, content)
    }
    pub fn toast_warn(content: Option<T>) -> Self {
        Self::new_toast(MessageType::Warn, content)
    }
    pub fn toast_info(content: Option<T>) -> Self {
        Self::new_toast(MessageType::Info, content)
    }
    pub fn toast_error(content: Option<T>) -> Self {
        Self::new_toast(MessageType::Error, content)
    }
}
