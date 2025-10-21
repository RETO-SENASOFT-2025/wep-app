# SuperApp

Aplicación FastAPI optimizada para ejecutarse con Docker.

## Requisitos

- Docker
- Docker Compose

## Ejecución con Docker

Para ejecutar la aplicación en entorno de desarrollo, simplemente ejecuta:

```bash
docker-compose up
```

La aplicación estará disponible en: http://localhost:8000

Para ejecutar en segundo plano:

```bash
docker-compose up -d
```

Para detener la aplicación:

```bash
docker-compose down
```

## Reconstrucción de la imagen

La imagen Docker está configurada para reconstruirse automáticamente solo cuando cambian los paquetes en requirements.txt, optimizando así el tiempo de desarrollo.
