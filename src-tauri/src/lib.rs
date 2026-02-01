mod recording;

use tauri::{AppHandle, Emitter, Manager, Runtime};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use std::sync::Mutex;

struct ShortcutStateWrapper(Mutex<Option<Shortcut>>);

#[tauri::command]
fn update_shortcut<R: Runtime>(app: AppHandle<R>, shortcut_str: String) -> Result<(), String> {
    println!("Updating shortcut to: {}", shortcut_str);
    let s: Shortcut = shortcut_str.parse().map_err(|e| format!("{}", e))?;

    let state = app.state::<ShortcutStateWrapper>();
    let mut current_shortcut = state.0.lock().unwrap();

    if let Some(old_s) = current_shortcut.take() {
        let _ = app.global_shortcut().unregister(old_s);
    }

    app.global_shortcut().register(s).map_err(|e| format!("{}", e))?;
    *current_shortcut = Some(s);

    Ok(())
}

#[tauri::command]
fn start_recording(app: AppHandle, device_name: Option<String>) -> Result<u64, String> {
    match recording::start_recording(device_name) {
        Ok(started_at) => {
            let _ = app.emit("recording-started", serde_json::json!({ "started_at_ms": started_at }));
            Ok(started_at)
        }
        Err(e) => {
            let _ = app.emit("recording-error", serde_json::json!({ "message": e.clone() }));
            Err(e)
        }
    }
}

#[tauri::command]
fn list_audio_devices() -> Result<Vec<String>, String> {
    recording::list_audio_devices()
}

#[tauri::command]
fn stop_recording(app: AppHandle) -> Result<serde_json::Value, String> {
    match recording::stop_recording() {
        Ok((path, duration)) => {
            let path_str = path.to_string_lossy().to_string();
            let _ = app.emit("recording-stopped", serde_json::json!({
                "path": path_str,
                "duration_ms": duration
            }));
            Ok(serde_json::json!({
                "path": path_str,
                "duration_ms": duration
            }))
        }
        Err(e) => {
            let _ = app.emit("recording-error", serde_json::json!({ "message": e.clone() }));
            Err(e)
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        let state = app.state::<ShortcutStateWrapper>();
                        let current_shortcut = state.0.lock().unwrap();
                        if let Some(s) = &*current_shortcut {
                            if shortcut == s {
                                // Toggle recording
                                let is_recording = recording::get_state().lock().is_recording;
                                if is_recording {
                                    let _ = stop_recording(app.clone());
                                } else {
                                    let _ = start_recording(app.clone(), None);
                                }
                            }
                        }
                    }
                })
                .build(),
        )
        .manage(ShortcutStateWrapper(Mutex::new(None)))
        .setup(move |app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_recording,
            stop_recording,
            update_shortcut,
            list_audio_devices
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
