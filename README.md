# SuperApp

Aplicación FastAPI minimalista, contenerizada con Docker. Este README único y profesional reúne toda la información necesaria para desarrollo, producción, configuración, API, comandos y buenas prácticas.

## Resumen
- Stack: FastAPI + Uvicorn, plantillas Jinja, estáticos sencillos.
- Puertos: `8000` por defecto.
- Healthcheck: `GET /status`.
- Perfiles: `dev` (autoreload, bind mount) y `prod` (múltiples workers).

## Requisitos
- Docker Engine y Docker Compose (CLI moderno: `docker compose`).
- Alternativa sin Docker: Python 3.13 con `pip`.

## Arranque Rápido (Docker Compose)
```bash
# Desarrollo
docker compose --profile dev up -d --build

# Producción
docker compose --profile prod up -d --build

# Comprobación de salud
curl http://localhost:8000/status  # on

# Logs
docker compose logs -f app-dev   # desarrollo
docker compose logs -f app-prod  # producción

# Detener y limpiar
docker compose down
```

## Ejecución sin Docker (opcional)
```bash
# Instalar dependencias
python -m pip install -r requirements.txt

# Ejecutar (autoreload)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Configuración
- Variables:
  - `AI_API_URL`: URL base del backend de IA externo.
  - `ENVIRONMENT`: `development` o `production` (usado en Compose).
  - `UVICORN_WORKERS` (prod): número de workers (por defecto `2`).
- Ubicación de variables: `app/.env` (cargado al inicio) y/o `docker-compose.yml`.
- Ejemplo de `app/.env`:
```
MESSAGE_MAX_LENGTH=500
AI_API_URL="http://localhost:8011"
```

## API
- `GET /` → Renderiza HTML (Jinja) con la home.
- `GET /status` → Texto plano `on`.
- `POST /api/message` → Envía texto al backend de IA.
  - Request: `{ "message": "texto" }`
  - Respuesta: `{ "reply": "texto de respuesta" }`
  - Ejemplo:
```bash
curl -X POST "http://localhost:8000/api/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola"}'
```
- `GET /api/ai_status` → Verifica `AI_API_URL/status` y devuelve `{ ok: true|false }`.

## Estructura
```
app/
  main.py               # aplicación FastAPI
  templates/            # Jinja (home, base, 404, partials)
  static/               # assets (favicon, js)
Dockerfile.dev          # imagen para desarrollo
Dockerfile.prod         # imagen para producción
docker-compose.yml      # servicios dev/prod
pyproject.toml          # configuración de ruff y djlint
requirements.txt        # dependencias Python
```

## Desarrollo (dev)
- Perfil dev: autoreload y bind mount `.:/app`.
- Comandos útiles:
  - `docker compose ps` → procesos/puertos.
  - `docker compose restart app-dev` → reinicio rápido.
  - `docker compose exec app-dev sh` → shell en contenedor.
- Reconstrucción si cambian dependencias: `docker compose --profile dev build`.

## Producción (prod)
- Perfil prod: sin autoreload; workers configurables.
- Ajuste de workers:
```bash
docker compose --profile prod up -d --build
# override de ejemplo (sin Compose):
docker run --name superapp -p 8000:8000 -e ENVIRONMENT=production -e UVICORN_WORKERS=4 superapp:prod
```
- Buenas prácticas: usar reverse proxy (TLS y cabeceras), gestionar secretos fuera de la imagen, observabilidad y escaneo de dependencias.

## Lint y Formato
- HTML/Jinja (djlint):
  - Verificación: `python -m djlint app/templates --profile jinja --check`
  - Formateo: `python -m djlint app/templates --profile jinja --reformat`
  - Configuración: `[tool.djlint]` en `pyproject.toml`.
- Python (Ruff):
  - Verificación: `ruff check .`
  - Formateo: `ruff format .` o `ruff --fix .`
- Nota: El proyecto no incluye linting para JavaScript por diseño. Si se requiere en el futuro, se puede integrar ESLint.

## Troubleshooting
- `AI_API_URL` no configurada → `503 AI backend URL not configured`.
- Backend IA sin respuesta → `503 AI backend unreachable/empty reply`.
- Puerto ocupado → mapear otro: `-p 8080:8000` y usar `http://localhost:8080/`.
- Autoreload no activa en dev → verificar volumen `.:/app` y perfil `dev`.

## Licencia
Proyecto con fines educativos y base de referencia.
