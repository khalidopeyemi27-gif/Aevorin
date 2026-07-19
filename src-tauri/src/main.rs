// AEVORIN Desktop Host — Tauri Entry Point
// This file launches the Node.js sidecar (Core Engine) and opens the WebView.
// Requires: rustc, cargo, tauri-cli
// Build: npm run tauri build

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::api::process::Command;

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            // Launch the Node.js Core Engine as a sidecar process
            let (mut _rx, _child) = Command::new_sidecar("aevorin-engine")
                .expect("Failed to create aevorin-engine sidecar")
                .spawn()
                .expect("Failed to spawn aevorin-engine sidecar");

            println!("[Tauri] AEVORIN Core Engine sidecar launched.");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running AEVORIN desktop application");
}
