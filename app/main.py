from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, PlainTextResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.cors import CORSMiddleware
import uvicorn
import os

app = FastAPI(title="SuperApp", docs_url=None, redoc_url=None, openapi_url=None)

# Cargar variables de entorno desde app/.env si existe (sin dependencias externas)
def load_env_file(path):
    try:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        key, value = line.split("=", 1)
                        os.environ.setdefault(key.strip(), value.strip())
    except Exception:
        # Ignora errores de lectura del .env
        pass

load_env_file(os.path.join(os.path.dirname(__file__), ".env"))

# Middlewares de seguridad básicos
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1"])
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"], allow_credentials=True, allow_methods=["GET", "POST"], allow_headers=["*"])

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

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
