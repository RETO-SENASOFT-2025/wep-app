from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, PlainTextResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

import uvicorn
import os
import json
import urllib.request
import urllib.error
from pydantic import BaseModel

app = FastAPI(title="SuperApp", docs_url=None, redoc_url=None, openapi_url=None)


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
        pass


load_env_file(os.path.join(os.path.dirname(__file__), ".env"))


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

    return response


templates = Jinja2Templates(directory=os.path.join(os.path.dirname(__file__), "templates"))

app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")), name="static")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("home.html", {"request": request})


@app.get("/status", response_class=PlainTextResponse)
async def status():
    return "on"


@app.get("/api/status", response_class=JSONResponse)
async def api_status():
    return {"ok": True}


class MessagePayload(BaseModel):
    message: str
    chatId: int | None = None
    conversation_id: int | None = None


@app.post("/api/message")
async def api_message(payload: MessagePayload):
    msg = (payload.message or "").strip()
    if not msg:
        return {"reply": ""}

    ai_base = (os.environ.get("AI_API_URL", "") or "").strip().strip('"').strip("'")
    if not ai_base:
        raise HTTPException(status_code=503, detail="AI backend URL not configured")
    ask_path = (os.environ.get("AI_ASK_PATH", "/ask") or "/ask").strip()
    ask_url = ai_base.rstrip("/") + "/" + ask_path.lstrip("/")

    try:
        payload_body = {"texto": msg, "message": msg}
        req = urllib.request.Request(
            ask_url,
            data=json.dumps(payload_body).encode("utf-8"),
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            status_code = getattr(resp, "status", 200)
            if status_code != 200:
                raise HTTPException(status_code=503, detail="AI backend error")
            raw = resp.read()
            data = json.loads(raw.decode("utf-8"))
            reply = ""
            if isinstance(data, dict):
                for key in ("reply", "answer", "text", "message", "result"):
                    val = data.get(key)
                    if isinstance(val, str) and val.strip():
                        reply = val.strip()
                        break
            elif isinstance(data, str):
                reply = data.strip()
            if not reply:
                raise HTTPException(status_code=503, detail="AI backend empty reply")
            return {"reply": reply}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=503, detail="AI backend unreachable")


@app.get("/api/ai_status")
async def api_ai_status():
    ai_base = (os.environ.get("AI_API_URL", "") or "").strip().strip('"').strip("'")
    if not ai_base:
        return {"ok": False, "reason": "not_configured"}
    status_url = ai_base.rstrip("/") + "/status"
    try:
        req = urllib.request.Request(status_url, headers={"Accept": "application/json"}, method="GET")
        with urllib.request.urlopen(req, timeout=5) as resp:
            status_code = getattr(resp, "status", 200)
            return {"ok": status_code == 200}
    except urllib.error.HTTPError as e:
        return {"ok": False, "reason": f"http_{e.code}"}
    except Exception:
        return {"ok": False, "reason": "unreachable"}


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        return templates.TemplateResponse("404.html", {"request": request}, status_code=404)
    return PlainTextResponse(str(getattr(exc, "detail", "Error")), status_code=exc.status_code)


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)