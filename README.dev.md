# SuperApp — Desarrollo

Guía operativa para ejecutar y trabajar con la aplicación en entorno de desarrollo usando Docker.

## Objetivo

- Iterar con recarga automática (`--reload`).
- Montar el código del host en el contenedor (bind mount).
- Disponer de un healthcheck estable vía `GET /status`.

## Prerrequisitos

- Docker Engine y Docker Compose (CLI moderno: `docker compose`).
- `curl` (opcional) para comprobaciones rápidas.

## Ejecución con Docker Compose (recomendado)

```bash
# Construir y arrancar en segundo plano con perfil dev
docker compose --profile dev up -d --build

# Ver logs en tiempo real
docker compose logs -f app-dev

# Detener y limpiar
docker compose down
```

- Perfil `dev`: monta `.:/app` y activa `--reload` en Uvicorn.
- Acceso: `http://localhost:8000/` y `http://localhost:8000/status`.
- Reconstrucción si cambian dependencias: `docker compose --profile dev build`.

## Ejecución sin Compose (alternativa)

```bash
# Construcción
docker build -f Dockerfile.dev -t superapp:dev .

# Ejecución (Bash/Mac/Linux)
docker run --name superapp-dev -p 8000:8000 -v "$(pwd)":/app -e ENVIRONMENT=development superapp:dev

# Ejecución (PowerShell)
docker run --name superapp-dev -p 8000:8000 -v ${PWD}:/app -e ENVIRONMENT=development superapp:dev
```

## Configuración y variables

- `ENVIRONMENT=development`: activa modo de desarrollo.
- `PYTHONDONTWRITEBYTECODE=1`: evita `.pyc`.
- `PYTHONUNBUFFERED=1`: logs sin buffer.
- Puerto: `8000` mapeado en el host (`-p 8000:8000`).

## Operación y comandos útiles

- Estado: `curl http://localhost:8000/status` → `on`.
- Reinicio (Compose): `docker compose restart app-dev`.
- Procesos/puertos (Compose): `docker compose ps`.
- Shell dentro del contenedor: `docker compose exec app-dev sh`.

## Troubleshooting

- Puerto ocupado: usar `-p 8080:8000` y `http://localhost:8080/`.
- Autoreload no activa: verificar volumen `.:/app` y perfil `dev`.
- Cambios en `requirements.txt`: reconstruir imagen de dev.
- Permisos de archivo en Windows: preferir PowerShell para el bind mount.
