from app.routes.auth_routes import router as auth_router
from app.routes.ble_ingestion_routes import router as ble_ingestion_router
from app.routes.dashboard_routes import router as dashboard_router

__all__ = ["auth_router", "ble_ingestion_router", "dashboard_router"]
