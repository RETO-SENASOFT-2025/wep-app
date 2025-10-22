# SuperApp — Producción

Guía de despliegue y operación en producción usando Docker.

## Objetivo

- Ejecutar sin autoreload, con múltiples workers (`UVICORN_WORKERS`).
- Healthcheck confiable a `GET /status`.
- Configuración clara de variables y buenas prácticas operativas.

## Prerrequisitos

- Docker Engine y Docker Compose (CLI moderno: `docker compose`).
- Acceso al puerto `8000` (o mapeo alternativo).

## Despliegue con Docker Compose (recomendado)

```bash
# Construir y arrancar en segundo plano con perfil prod
docker compose --profile prod up -d --build

# Ver logs en tiempo real
docker compose logs -f app-prod

# Detener y limpiar
docker compose down
```

- Perfil `prod`: Uvicorn sin autoreload; variables de entorno de producción.
- Acceso: `http://localhost:8000/` y `http://localhost:8000/status`.

## Despliegue sin Compose (alternativa)

```bash
# Construcción
docker build -f Dockerfile.prod -t superapp:prod .

# Ejecución (ejemplo con 4 workers)
docker run --name superapp -p 8000:8000 -e ENVIRONMENT=production -e UVICORN_WORKERS=4 superapp:prod
```

## Configuración y tuning

- `ENVIRONMENT=production`: modo de producción.
- `UVICORN_WORKERS`: número de procesos worker (por defecto `2`). Ajustar según CPU/latencia.
- Mapeo de puertos: `-p 80:8000` si se expone en HTTP estándar.

## Operación

- Estado: `curl http://localhost:8000/status` → `on`.
- Reinicio (Compose): `docker compose restart app-prod`.
- Procesos/puertos (Compose): `docker compose ps`.
- Shell dentro del contenedor: `docker compose exec app-prod sh`.

## Buenas prácticas

- Reverse proxy (Nginx/Traefik): TLS, cabeceras y routing.
- Secretos: no incluir en la imagen; usar variables de entorno o gestor de secretos.
- Observabilidad: integrar logs y healthchecks en el orquestador.
- Seguridad: escanear dependencias/imágenes en CI (Trivy, etc.).

## Estructura relevante

- `app/main.py`: rutas `/` y `/status`.
- `Dockerfile.prod`: Uvicorn con `--workers ${UVICORN_WORKERS}`.
- `docker-compose.yml`: servicio `app-prod` con healthcheck.
