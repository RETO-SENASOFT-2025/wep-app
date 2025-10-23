# SuperApp

Aplicación FastAPI minimalista, contenerizada con Docker, orientada a simplicidad operacional y observabilidad.

- `GET /` → HTML renderizado con `Jinja2Templates`.
- `GET /status` → texto plano `on` para healthchecks.

## Resumen Ejecutivo

- Arquitectura: `FastAPI` + `Uvicorn` escuchando en `:8000`.
- Healthcheck: `GET /status` definido en `docker-compose.yml` para dev y prod.
- Perfiles de ejecución:
  - `dev`: autoreload y bind mount del código (`.:/app`).
  - `prod`: sin autoreload, `UVICORN_WORKERS` configurable.
- Variables clave: `ENVIRONMENT`, `UVICORN_WORKERS` (solo en producción).

## Arranque Rápido

```bash
# Desarrollo (Compose)
docker compose --profile dev up -d --build

# Producción (Compose)
docker compose --profile prod up -d --build

# Comprobación
curl http://localhost:8000/status   # devuelve: on
```

## Guías Detalladas

- Guía de Desarrollo: `README.dev.md`
- Guía de Producción: `README.prod.md`

## Estructura del Proyecto

- `app/main.py` → definición de rutas `/` y `/status`.
- `app/templates/home.html` → plantilla para `/`.
- `docker-compose.yml` → servicios `app-dev` y `app-prod` con healthcheck.
- `Dockerfile.dev` y `Dockerfile.prod` → imágenes por entorno.

## Mantenimiento

- Reconstrucción por cambios en dependencias:
  - Dev: `docker compose --profile dev build`
  - Prod: `docker compose --profile prod build`

## Licencia

Proyecto disponible para fines educativos y como base de referencia.
