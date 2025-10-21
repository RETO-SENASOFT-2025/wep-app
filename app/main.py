from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn
import os

app = FastAPI(title="SuperApp", docs_url=None, redoc_url=None, openapi_url=None)

# Montar archivos estáticos
# app.mount("/static", StaticFiles(directory="static"), name="static")

# Configurar templates
templates = Jinja2Templates(directory="templates")

# Importar routers
from app.routers import home

# Incluir routers
app.include_router(home.router)


# Ruta de status simple de texto
@app.get("/status", response_class=PlainTextResponse)
async def status():
	return "on"


if __name__ == "__main__":
	uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
