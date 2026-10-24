use axum::{Json, Router, routing::get};
use serde::Serialize;
use std::{env, net::SocketAddr};
use tracing_subscriber::EnvFilter;

#[derive(Serialize)]
struct Health {
    status: &'static str,
    service: &'static str,
    version: &'static str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ServiceCapabilities {
    accounts: bool,
    synchronization: bool,
    precision_runner: bool,
    browser_exploration_requires_api: bool,
}

async fn health() -> Json<Health> {
    Json(Health {
        status: "ok",
        service: "seedatlas-api",
        version: env!("CARGO_PKG_VERSION"),
    })
}

async fn capabilities() -> Json<ServiceCapabilities> {
    Json(ServiceCapabilities {
        accounts: false,
        synchronization: false,
        precision_runner: false,
        browser_exploration_requires_api: false,
    })
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();
    let address: SocketAddr = env::var("SEEDATLAS_BIND")
        .unwrap_or_else(|_| "127.0.0.1:3001".to_owned())
        .parse()?;
    let application = Router::new()
        .route("/api/v1/health", get(health))
        .route("/api/v1/capabilities", get(capabilities));
    let listener = tokio::net::TcpListener::bind(address).await?;
    tracing::info!(%address, "SeedAtlas foundation API listening");
    axum::serve(listener, application)
        .with_graceful_shutdown(async {
            if let Err(error) = tokio::signal::ctrl_c().await {
                tracing::error!(%error, "Could not listen for shutdown signal");
            }
        })
        .await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn capabilities_do_not_advertise_unimplemented_services() {
        let Json(value) = capabilities().await;
        assert!(!value.accounts);
        assert!(!value.synchronization);
        assert!(!value.precision_runner);
        assert!(!value.browser_exploration_requires_api);
    }
}
