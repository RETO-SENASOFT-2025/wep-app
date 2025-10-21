# ----------------------------------------------------------------------------
# Imagen base de Python (estable) para FastAPI
# ----------------------------------------------------------------------------
FROM python:3.13.9

# ----------------------------------------------------------------------------
# Variables de entorno para comportamiento predecible de Python y pip
# ----------------------------------------------------------------------------
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on

# ----------------------------------------------------------------------------
# Directorio de trabajo
# ----------------------------------------------------------------------------
WORKDIR /app

# ----------------------------------------------------------------------------
# Dependencias del sistema necesarias para healthcheck (curl)
# ----------------------------------------------------------------------------
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# ----------------------------------------------------------------------------
# Instalar dependencias de Python aprovechando caché de Docker
# ----------------------------------------------------------------------------
COPY requirements.txt ./
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ----------------------------------------------------------------------------
# Copiar el código de la aplicación
# ----------------------------------------------------------------------------
COPY . .

# ----------------------------------------------------------------------------
# Comando por defecto: ejecutar la app con Uvicorn
# ----------------------------------------------------------------------------
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
