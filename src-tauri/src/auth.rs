use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use rand::Rng;
use sha2::{Digest, Sha256};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const STORE_PATH: &str = "auth.json";
const CLIENT_ID: &str = "YOUR_CLIENT_ID.apps.googleusercontent.com";
const CLIENT_SECRET: &str = "YOUR_CLIENT_SECRET";
const REDIRECT_URI: &str = "doction://auth/callback";
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

#[tauri::command]
pub async fn start_auth(app: AppHandle) -> Result<String, String> {
    let verifier = generate_code_verifier();
    let challenge = generate_code_challenge(&verifier);

    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    store.set("code_verifier", serde_json::json!(verifier));

    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?\
         client_id={}&\
         redirect_uri={}&\
         response_type=code&\
         scope={}&\
         code_challenge={}&\
         code_challenge_method=S256&\
         access_type=offline&\
         prompt=consent",
        CLIENT_ID,
        urlencoding::encode(REDIRECT_URI),
        urlencoding::encode(SCOPES),
        challenge
    );

    Ok(auth_url)
}

#[tauri::command]
pub async fn exchange_code(app: AppHandle, code: String) -> Result<AuthTokens, String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    let verifier = store
        .get("code_verifier")
        .and_then(|v| v.as_str().map(String::from))
        .ok_or("No code verifier found")?;

    let client = reqwest::Client::new();
    let response = client
        .post(GOOGLE_TOKEN_URL)
        .form(&[
            ("code", code.as_str()),
            ("client_id", CLIENT_ID),
            ("client_secret", CLIENT_SECRET),
            ("redirect_uri", REDIRECT_URI),
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
    Ok(())
}

#[tauri::command]
pub async fn is_authenticated(app: AppHandle) -> Result<bool, String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    Ok(store.get("tokens").is_some())
}
