mod auth;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                app.deep_link().register("doction").map_err(|e| {
                    eprintln!("Failed to register deep link: {}", e);
                    e
                }).ok();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            auth::start_auth,
            auth::exchange_code,
            auth::get_access_token,
            auth::logout,
            auth::is_authenticated,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
