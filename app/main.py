from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, PlainTextResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
import uvicorn
import os

app = FastAPI(title="SuperApp", docs_url=None, redoc_url=None, openapi_url=None)

# Configurar templates (ruta absoluta para evitar problemas de cwd)
templates = Jinja2Templates(directory=os.path.join(os.path.dirname(__file__), "templates"))

# Montar estáticos para servir favicon y otros assets
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")), name="static")


# Ruta raíz
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
	return templates.TemplateResponse("home.html", {"request": request})


# Ruta de status simple de texto
@app.get("/status", response_class=PlainTextResponse)
async def status():
	return "on"


# Handler de 404: mostrar UI minimalista con enlace a inicio
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
	if exc.status_code == 404:
		return templates.TemplateResponse("404.html", {"request": request}, status_code=404)
	# Fallback para otros errores HTTP
	return PlainTextResponse(str(getattr(exc, "detail", "Error")), status_code=exc.status_code)


if __name__ == "__main__":
	uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
