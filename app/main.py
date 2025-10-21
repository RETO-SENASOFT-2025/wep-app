from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, PlainTextResponse
from fastapi.templating import Jinja2Templates
import uvicorn
import os

app = FastAPI(title="SuperApp", docs_url=None, redoc_url=None, openapi_url=None)

# Configurar templates (ruta absoluta para evitar problemas de cwd)
templates = Jinja2Templates(directory=os.path.join(os.path.dirname(__file__), "templates"))


# Ruta raíz
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
	return templates.TemplateResponse("home.html", {"request": request})


# Ruta de status simple de texto
@app.get("/status", response_class=PlainTextResponse)
async def status():
	return "on"


if __name__ == "__main__":
	uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
