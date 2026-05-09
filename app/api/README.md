# API

> Contratos y endpoints de la API del sistema.

## Estado

Pendiente de implementación.

## Endpoints Previstos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/agent/chat` | Enviar mensaje al agente principal |
| GET | `/api/projects` | Listar proyectos activos |
| POST | `/api/projects` | Crear nuevo proyecto |
| GET | `/api/projects/{id}` | Obtener detalle de proyecto |
| GET | `/api/projects/{id}/tasks` | Listar tareas del proyecto |
| POST | `/api/sync/clickup` | Forzar sincronización con ClickUp |
| GET | `/api/reports/weekly` | Obtener reporte semanal |

## Principios

- API RESTful con respuestas JSON
- Autenticación requerida en todos los endpoints
- El agente se activa via `/api/agent/chat`, no directamente por endpoints de datos
