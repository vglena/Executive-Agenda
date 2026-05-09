# ClickUp Client

> Implementación del cliente HTTP para la API de ClickUp v2.
> Este módulo gestiona todas las llamadas HTTP hacia ClickUp.

---

## Responsabilidades

- Construir requests hacia la API de ClickUp
- Manejar headers de autenticación
- Gestionar timeouts y reintentos básicos
- Retornar respuestas normalizadas

---

## Base URL

```
https://api.clickup.com/api/v2
```

---

## Headers Estándar

```python
headers = {
    "Authorization": os.environ["CLICKUP_API_TOKEN"],
    "Content-Type": "application/json"
}
```

---

## Implementación de Referencia (Python)

```python
import os
import time
import requests
from typing import Optional

CLICKUP_BASE_URL = "https://api.clickup.com/api/v2"
MAX_RETRIES = 2
RETRY_WAIT_SECONDS = 60
TIMEOUT_SECONDS = 10


class ClickUpClient:
    def __init__(self):
        self.token = os.environ.get("CLICKUP_API_TOKEN")
        if not self.token:
            raise ValueError("CLICKUP_API_TOKEN no está configurado en variables de entorno")
        self.headers = {
            "Authorization": self.token,
            "Content-Type": "application/json"
        }

    def get(self, path: str, params: Optional[dict] = None) -> dict:
        return self._request("GET", path, params=params)

    def post(self, path: str, body: dict) -> dict:
        return self._request("POST", path, json=body)

    def put(self, path: str, body: dict) -> dict:
        return self._request("PUT", path, json=body)

    def _request(self, method: str, path: str, **kwargs) -> dict:
        url = f"{CLICKUP_BASE_URL}{path}"
        attempt = 0

        while attempt <= MAX_RETRIES:
            try:
                response = requests.request(
                    method,
                    url,
                    headers=self.headers,
                    timeout=TIMEOUT_SECONDS,
                    **kwargs
                )

                if response.status_code == 200:
                    return {"success": True, "data": response.json()}

                if response.status_code == 429:
                    if attempt < MAX_RETRIES:
                        time.sleep(RETRY_WAIT_SECONDS)
                        attempt += 1
                        continue

                return {
                    "success": False,
                    "error_code": response.status_code,
                    "message": response.text
                }

            except requests.exceptions.Timeout:
                return {"success": False, "error_code": 408, "message": "Request timeout"}
            except requests.exceptions.ConnectionError:
                return {"success": False, "error_code": 503, "message": "No se pudo conectar con ClickUp"}

        return {"success": False, "error_code": 429, "message": "Rate limit superado después de reintentos"}
```

---

## Implementación de Referencia (JavaScript/Node.js)

```javascript
const CLICKUP_BASE_URL = 'https://api.clickup.com/api/v2';

class ClickUpClient {
  constructor() {
    const token = process.env.CLICKUP_API_TOKEN;
    if (!token) throw new Error('CLICKUP_API_TOKEN no configurado');
    this.headers = {
      'Authorization': token,
      'Content-Type': 'application/json'
    };
  }

  async get(path, params = {}) {
    const url = new URL(`${CLICKUP_BASE_URL}${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return this._request('GET', url.toString());
  }

  async post(path, body) {
    return this._request('POST', `${CLICKUP_BASE_URL}${path}`, body);
  }

  async put(path, body) {
    return this._request('PUT', `${CLICKUP_BASE_URL}${path}`, body);
  }

  async _request(method, url, body = null) {
    const options = { method, headers: this.headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) return { success: true, data };
    return { success: false, error_code: response.status, message: JSON.stringify(data) };
  }
}

module.exports = { ClickUpClient };
```

---

## Notas

- El cliente no persiste datos — solo ejecuta requests
- El manejo de errores semánticos (404, 400) es responsabilidad del script que llama al cliente
- Ver `auth.md` para detalles de autenticación
