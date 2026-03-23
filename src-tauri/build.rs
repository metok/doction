use std::fs;
use std::path::Path;

fn main() {
    // Auto-load .env.local if it exists and env vars aren't already set
    let env_path = Path::new("../.env.local");
    if env_path.exists() {
        if let Ok(contents) = fs::read_to_string(env_path) {
            for line in contents.lines() {
                let line = line.trim();
                // Skip comments and empty lines
                if line.is_empty() || line.starts_with('#') {
                    continue;
                }
                // Strip "export " prefix if present
                let line = line.strip_prefix("export ").unwrap_or(line);
                if let Some((key, value)) = line.split_once('=') {
                    let key = key.trim();
                    let value = value.trim().trim_matches('"');
                    // Only set if not already in environment
                    if std::env::var(key).is_err() {
                        println!("cargo:rustc-env={}={}", key, value);
                    }
                }
            }
        }
    }

    // Rebuild if .env.local changes
    println!("cargo:rerun-if-changed=../.env.local");

    tauri_build::build()
}
