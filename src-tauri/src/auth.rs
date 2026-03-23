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
const SCOPES: &str = "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/spreadsheets openid email profile";

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
<div class="brand"><img src="data:image/png;base64,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" alt="Doction" style="width:32px;height:32px;border-radius:8px"/><span>Doction</span></div>
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
