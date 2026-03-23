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
const SCOPES: &str = "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/spreadsheets.readonly";

/// OAuth credentials injected at build time via environment variables.
/// Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET before building.
/// For local development: source .env.local && npm run tauri dev
fn client_id() -> &'static str {
    option_env!("GOOGLE_CLIENT_ID")
        .expect("GOOGLE_CLIENT_ID must be set at build time. Run: source .env.local && npm run tauri dev")
}

fn client_secret() -> &'static str {
    option_env!("GOOGLE_CLIENT_SECRET")
        .expect("GOOGLE_CLIENT_SECRET must be set at build time. Run: source .env.local && npm run tauri dev")
}

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
        client_id(),
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
        let body = format!(
            r#"<!DOCTYPE html><html><head><meta charset="utf-8"><title>Doction</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden">
<style>
body::before{{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 30% 20%,rgba(239,68,68,.08),transparent 60%),radial-gradient(ellipse at 70% 80%,rgba(239,68,68,.05),transparent 50%);pointer-events:none}}
.card{{position:relative;padding:3rem 4rem;border-radius:1.5rem;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);backdrop-filter:blur(20px);text-align:center;max-width:480px}}
.icon{{width:64px;height:64px;margin:0 auto 1.5rem;border-radius:50%;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);display:flex;align-items:center;justify-content:center;font-size:28px}}
h1{{font-size:1.75rem;font-weight:700;color:#f0f0f0;margin:0 0 .75rem;letter-spacing:-.02em}}
p{{color:#888;font-size:.9rem;margin:.25rem 0;line-height:1.6}}
.err{{color:#f87171;font-size:.8rem;margin-top:1rem;padding:.75rem 1rem;background:rgba(239,68,68,.08);border-radius:.75rem;border:1px solid rgba(239,68,68,.15);font-family:monospace;word-break:break-all}}
</style>
<div class="card">
<div class="icon">&#10005;</div>
<h1>Authentication Failed</h1>
<p>Something went wrong during sign-in.</p>
<div class="err">{}</div>
<p style="margin-top:1.5rem;color:#666">You can close this tab and try again.</p>
</div></body></html>"#,
            error
        );
        let response = format!("HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\n\r\n{}", body.len(), body);
        stream.write_all(response.as_bytes()).ok();
        stream.flush().ok();

        let _ = app.emit("auth-error", error);
        return Ok(());
    }

    if let Some(code) = code {
        let body = r#"<!DOCTYPE html><html><head><meta charset="utf-8"><title>Doction</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden">
<style>
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 30% 20%,rgba(79,70,229,.12),transparent 60%),radial-gradient(ellipse at 70% 80%,rgba(124,58,237,.08),transparent 50%);pointer-events:none;animation:drift 8s ease-in-out infinite alternate}
@keyframes drift{0%{transform:scale(1) rotate(0deg)}100%{transform:scale(1.1) rotate(2deg)}}
@keyframes fadeUp{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{0%{opacity:0;transform:scale(.8)}50%{transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}
@keyframes checkDraw{0%{stroke-dashoffset:24}100%{stroke-dashoffset:0}}
@keyframes ringPulse{0%{box-shadow:0 0 0 0 rgba(79,70,229,.3)}70%{box-shadow:0 0 0 20px rgba(79,70,229,0)}100%{box-shadow:0 0 0 0 rgba(79,70,229,0)}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
.card{position:relative;padding:3rem 4rem;border-radius:1.5rem;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);backdrop-filter:blur(20px);text-align:center;max-width:480px;animation:fadeUp .6s ease-out}
.card::before{content:'';position:absolute;inset:-1px;border-radius:1.5rem;padding:1px;background:linear-gradient(135deg,rgba(79,70,229,.3),transparent 40%,transparent 60%,rgba(124,58,237,.2));-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
.icon{width:72px;height:72px;margin:0 auto 1.5rem;border-radius:50%;background:linear-gradient(135deg,rgba(79,70,229,.15),rgba(124,58,237,.1));border:1px solid rgba(79,70,229,.25);display:flex;align-items:center;justify-content:center;animation:scaleIn .5s ease-out .2s both,ringPulse 2s ease-out .7s}
.icon svg{width:32px;height:32px}
.icon svg polyline{stroke:#818cf8;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;fill:none;stroke-dasharray:24;animation:checkDraw .4s ease-out .5s both}
h1{font-size:1.75rem;font-weight:700;color:#f0f0f0;margin:0 0 .5rem;letter-spacing:-.02em;animation:fadeUp .6s ease-out .3s both}
p{color:#888;font-size:.9rem;margin:0;line-height:1.6;animation:fadeUp .6s ease-out .4s both}
.brand{display:inline-flex;align-items:center;gap:.5rem;margin-top:2rem;padding:.5rem 1.25rem;border-radius:2rem;background:rgba(79,70,229,.08);border:1px solid rgba(79,70,229,.15);animation:fadeUp .6s ease-out .5s both}
.brand .logo{width:20px;height:20px;border-radius:5px;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff}
.brand span{font-size:.8rem;font-weight:500;background:linear-gradient(90deg,#818cf8,#a78bfa,#818cf8);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 3s linear infinite}
.particles{position:fixed;inset:0;pointer-events:none;overflow:hidden}
.particles div{position:absolute;width:2px;height:2px;background:rgba(129,140,248,.4);border-radius:50%;animation:float linear infinite}
@keyframes float{0%{transform:translateY(100vh) scale(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-10vh) scale(1);opacity:0}}
</style>
<div class="particles">
<div style="left:10%;animation-duration:6s;animation-delay:0s"></div>
<div style="left:20%;animation-duration:8s;animation-delay:1s"></div>
<div style="left:35%;animation-duration:7s;animation-delay:2s"></div>
<div style="left:50%;animation-duration:9s;animation-delay:.5s"></div>
<div style="left:65%;animation-duration:6s;animation-delay:3s"></div>
<div style="left:80%;animation-duration:8s;animation-delay:1.5s"></div>
<div style="left:90%;animation-duration:7s;animation-delay:2.5s"></div>
</div>
<div class="card">
<div class="icon"><svg viewBox="0 0 24 24"><polyline points="4 12 9 17 20 6"/></svg></div>
<h1>Signed in</h1>
<p>You can close this tab and return to the app.</p>
<div class="brand"><div class="logo">D</div><span>Doction</span></div>
</div></body></html>"#;
        let response = format!("HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\n\r\n{}", body.len(), body);
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
        let response = format!("HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\n\r\n{}", body.len(), body);
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
            ("client_id", client_id()),
            ("client_secret", client_secret()),
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
            ("client_id", client_id()),
            ("client_secret", client_secret()),
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
