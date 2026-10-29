mod lorekeep;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![lorekeep::open_lorekeep])
        .run(tauri::generate_context!())
        .expect("error while running Shelfmark");
}
