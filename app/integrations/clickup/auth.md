# ClickUp Auth — Autenticación

> Gestión del acceso autenticado a la API de ClickUp.
> Este sistema usa Personal API Token porque el uso es de un único usuario.

---

## Método de Autenticación

**Personal API Token** — Sin OAuth, sin flujos de autorización.

El token se incluye como header en cada request:
```
Authorization: pk_XXXXXXXXXXXXXXXXXXXX
```

---

## Dónde Obtener el Token

1. Iniciar sesión en ClickUp: https://app.clickup.com
2. Ir a **Settings** → **Apps**
3. En la sección **API Token**, hacer clic en **Generate**
4. Copiar el token generado

---

## Configuración Segura

El token **nunca** se escribe en archivos de código o Markdown.
Se configura exclusivamente en variables de entorno:

```bash
# .env (nunca subir a git)
CLICKUP_API_TOKEN=pk_XXXXXXXXXXXXXXXXXXXX
CLICKUP_TEAM_ID=XXXXXXXXX
```

---

## Verificación del Token

Para verificar que el token es válido:

```http
GET https://api.clickup.com/api/v2/user
Authorization: {CLICKUP_API_TOKEN}
```

Respuesta esperada (200 OK):
```json
{
  "user": {
    "id": 123,
    "username": "nombre",
    "email": "email@dominio.com"
  }
}
```

Si retorna `401 Unauthorized`:
→ El token es inválido o fue revocado. Generar uno nuevo desde ClickUp Settings.

---

## Rotación del Token

Cuando el token es comprometido o expira:
1. Generar nuevo token en ClickUp Settings → Apps
2. Actualizar el valor de `CLICKUP_API_TOKEN` en `.env`
3. Reiniciar el sistema si está corriendo como servidor

---

## Seguridad

- No hardcodear el token en ningún archivo
- No incluir `.env` en el repositorio (verificar `.gitignore`)
- No loguear el token en logs del sistema
- Usar el token solo en headers — no en URLs ni body
