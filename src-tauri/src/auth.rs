use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use rand::Rng;
use sha2::{Digest, Sha256};
use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader, Write};
use std::net::TcpListener;
use tauri::{AppHandle, Emitter};
use tauri_plugin_store::StoreExt;

const GOOGLE_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const STORE_PATH: &str = "auth.json";
const CLIENT_ID: &str = "GOOGLE_CLIENT_ID_PLACEHOLDER";
const CLIENT_SECRET: &str = "GOOGLE_CLIENT_SECRET_PLACEHOLDER";
const SCOPES: &str = "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/spreadsheets.readonly";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthTokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: u64,
    token_type: String,
}

fn generate_code_verifier() -> String {
    let mut rng = rand::thread_rng();
    let bytes: Vec<u8> = (0..32).map(|_| rng.gen()).collect();
    URL_SAFE_NO_PAD.encode(bytes)
}

fn generate_code_challenge(verifier: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(verifier.as_bytes());
    let result = hasher.finalize();
    URL_SAFE_NO_PAD.encode(result)
}

fn current_timestamp() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

/// Start OAuth flow: opens browser, starts localhost server to capture callback
#[tauri::command]
pub async fn start_auth(app: AppHandle) -> Result<(), String> {
    let verifier = generate_code_verifier();
    let challenge = generate_code_challenge(&verifier);

    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    store.set("code_verifier", serde_json::json!(verifier));

    // Bind to a random available port
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let redirect_uri = format!("http://localhost:{}", port);

    // Store redirect URI for token exchange
    store.set("redirect_uri", serde_json::json!(redirect_uri.clone()));

    let auth_url = format!(
        "{}?client_id={}&redirect_uri={}&response_type=code&scope={}&code_challenge={}&code_challenge_method=S256&access_type=offline&prompt=consent",
        GOOGLE_AUTH_URL,
        CLIENT_ID,
        urlencoding::encode(&redirect_uri),
        urlencoding::encode(SCOPES),
        challenge
    );

    // Open browser
    tauri_plugin_shell::ShellExt::shell(&app)
        .open(&auth_url, None)
        .map_err(|e| e.to_string())?;

    // Spawn blocking thread to wait for the OAuth callback
    let app_handle = app.clone();
    std::thread::spawn(move || {
        if let Err(e) = handle_oauth_callback(listener, app_handle) {
            eprintln!("OAuth callback error: {}", e);
        }
    });

    Ok(())
}

/// Blocking: wait for Google to redirect to our localhost server
fn handle_oauth_callback(listener: TcpListener, app: AppHandle) -> Result<(), String> {
    // Set a timeout so we don't block forever
    listener.set_nonblocking(false).map_err(|e| e.to_string())?;

    // Accept one connection
    let (mut stream, _) = listener.accept().map_err(|e| e.to_string())?;

    let mut reader = BufReader::new(stream.try_clone().map_err(|e| e.to_string())?);
    let mut request_line = String::new();
    reader.read_line(&mut request_line).map_err(|e| e.to_string())?;

    // Parse the code from GET /?code=...&scope=... HTTP/1.1
    let code = request_line
        .split_whitespace()
        .nth(1) // the path
        .and_then(|path| {
            url::form_urlencoded::parse(path.trim_start_matches("/?").as_bytes())
                .find(|(key, _)| key == "code")
                .map(|(_, value)| value.to_string())
        });

    let error = request_line
        .split_whitespace()
        .nth(1)
        .and_then(|path| {
            url::form_urlencoded::parse(path.trim_start_matches("/?").as_bytes())
                .find(|(key, _)| key == "error")
                .map(|(_, value)| value.to_string())
        });

    if let Some(error) = error {
        // Send error page
        let body = format!(
            "<html><body style='font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#191919;color:#f0f0f0'>\
             <div style='text-align:center'><h1>Authentication Failed</h1><p>Error: {}</p><p>You can close this window.</p></div></body></html>",
            error
        );
        let response = format!("HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\n\r\n{}", body.len(), body);
        stream.write_all(response.as_bytes()).ok();
        stream.flush().ok();

        let _ = app.emit("auth-error", error);
        return Ok(());
    }

    if let Some(code) = code {
        // Send success page immediately
        let body = "<html><body style='font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#191919;color:#f0f0f0'>\
                    <div style='text-align:center'><h1 style='color:#4f46e5'>✓ Signed in!</h1><p>You can close this window and return to Doction.</p></div></body></html>";
        let response = format!("HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\n\r\n{}", body.len(), body);
        stream.write_all(response.as_bytes()).ok();
        stream.flush().ok();
        drop(stream);

        // Exchange code for tokens (blocking)
        let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
        match rt.block_on(exchange_code_internal(&app, code)) {
            Ok(_) => {
                let _ = app.emit("auth-success", ());
            }
            Err(e) => {
                eprintln!("Token exchange failed: {}", e);
                let _ = app.emit("auth-error", e);
            }
        }
    } else {
        let body = "<html><body style='font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#191919;color:#f0f0f0'>\
                    <div style='text-align:center'><h1>Something went wrong</h1><p>No authorization code received.</p></div></body></html>";
        let response = format!("HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\n\r\n{}", body.len(), body);
        stream.write_all(response.as_bytes()).ok();
        stream.flush().ok();
    }

    Ok(())
}

/// Exchange authorization code for tokens
async fn exchange_code_internal(app: &AppHandle, code: String) -> Result<AuthTokens, String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;

    let verifier = store
        .get("code_verifier")
        .and_then(|v| v.as_str().map(String::from))
        .ok_or("No code verifier found")?;

    let redirect_uri = store
        .get("redirect_uri")
        .and_then(|v| v.as_str().map(String::from))
        .ok_or("No redirect URI found")?;

    let client = reqwest::Client::new();
    let response = client
        .post(GOOGLE_TOKEN_URL)
        .form(&[
            ("code", code.as_str()),
            ("client_id", CLIENT_ID),
            ("client_secret", CLIENT_SECRET),
            ("redirect_uri", redirect_uri.as_str()),
            ("grant_type", "authorization_code"),
            ("code_verifier", verifier.as_str()),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.map_err(|e| e.to_string())?;
        return Err(format!("Token exchange failed: {}", error_text));
    }

    let token_response: TokenResponse = response.json().await.map_err(|e| e.to_string())?;

    let tokens = AuthTokens {
        access_token: token_response.access_token,
        refresh_token: token_response.refresh_token,
        expires_at: current_timestamp() + token_response.expires_in,
    };

    store.set("tokens", serde_json::to_value(&tokens).map_err(|e| e.to_string())?);
    store.delete("code_verifier");
    store.delete("redirect_uri");

    Ok(tokens)
}

#[tauri::command]
pub async fn get_access_token(app: AppHandle) -> Result<String, String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    let tokens: AuthTokens = store
        .get("tokens")
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .ok_or("Not authenticated")?;

    if current_timestamp() + 300 > tokens.expires_at {
        if let Some(refresh_token) = &tokens.refresh_token {
            return refresh_access_token(app, refresh_token.clone()).await;
        }
        return Err("Token expired and no refresh token available".to_string());
    }

    Ok(tokens.access_token)
}

async fn refresh_access_token(app: AppHandle, refresh_token: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let response = client
        .post(GOOGLE_TOKEN_URL)
        .form(&[
            ("refresh_token", refresh_token.as_str()),
            ("client_id", CLIENT_ID),
            ("client_secret", CLIENT_SECRET),
            ("grant_type", "refresh_token"),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.map_err(|e| e.to_string())?;
        return Err(format!("Token refresh failed: {}", error_text));
    }

    let token_response: TokenResponse = response.json().await.map_err(|e| e.to_string())?;

    let tokens = AuthTokens {
        access_token: token_response.access_token.clone(),
        refresh_token: token_response.refresh_token.or(Some(refresh_token)),
        expires_at: current_timestamp() + token_response.expires_in,
    };

    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    store.set("tokens", serde_json::to_value(&tokens).map_err(|e| e.to_string())?);

    Ok(tokens.access_token)
}

#[tauri::command]
pub async fn logout(app: AppHandle) -> Result<(), String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    store.delete("tokens");
    store.delete("code_verifier");
    store.delete("redirect_uri");
    Ok(())
}

#[tauri::command]
pub async fn is_authenticated(app: AppHandle) -> Result<bool, String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    Ok(store.get("tokens").is_some())
}
