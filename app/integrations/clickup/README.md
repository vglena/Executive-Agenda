# ClickUp Integration — TypeScript Implementation

> Integración modular con la API de ClickUp v2 usando Personal API Token.
> Esta capa no contiene lógica de negocio — esa vive en `/agent/`.

---

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `types.ts` | Tipos TypeScript para Task, Space, Folder, List y inputs |
| `auth.ts` | Carga y valida `CLICKUP_API_TOKEN` desde el entorno |
| `client.ts` | Cliente HTTP reutilizable (`clickupGet`, `clickupPost`, `clickupPut`) |
| `task.service.ts` | Operaciones sobre tareas: crear, actualizar, obtener, listar |
| `project.service.ts` | Lectura de estructura: Spaces, Folders, Lists |
| `auth.md` | Documentación de autenticación con Personal API Token |
| `task_mapping.md` | Mapeo entre campos del agente y campos de ClickUp |
| `webhook_handler.md` | Procesamiento de eventos webhook de ClickUp |

---

## Configuración

### 1. Crear archivo `.env` en la raíz del proyecto

```env
CLICKUP_API_TOKEN=pk_XXXXXXXXXXXXXXXXXXXX
CLICKUP_TEAM_ID=XXXXXXXXX
```

- `CLICKUP_API_TOKEN` — **Obligatorio.** El sistema lanza error si no está presente.
- `CLICKUP_TEAM_ID` — Requerido solo para `getSpaces()`.

### 2. Obtener el token

1. Iniciar sesión en https://app.clickup.com
2. Ir a **Settings → Apps**
3. En **API Token**, hacer clic en **Generate**
4. Copiar el token y pegarlo en `.env`

---

## Uso

### Crear una tarea

```typescript
import { createTask } from "./task.service";

const task = await createTask("LIST_ID", {
  name: "Auditoría del sitio actual",
  description: "Revisar performance, SEO y accesibilidad del sitio vigente",
  priority: 1,                        // 1=urgente, 2=alta, 3=normal, 4=baja
  due_date: 1747353600000,            // timestamp en ms
  status: "pendiente",
});

console.log(task.id); // guardar en memory/active_projects.md
```

### Actualizar estado de una tarea

```typescript
import { updateTaskStatus } from "./task.service";

await updateTaskStatus("TASK_ID", "en progreso");
```

### Listar tareas de una lista

```typescript
import { listTasks } from "./task.service";

const tasks = await listTasks("LIST_ID", { include_closed: false });
tasks.forEach(t => console.log(t.id, t.name, t.status.status));
```

### Explorar la estructura del workspace

```typescript
import { getSpaces, getFolders, getLists } from "./project.service";

const spaces = await getSpaces();
const folders = await getFolders(spaces[0].id);
const lists = await getLists(folders[0].id);
```

---

## Arquitectura

```
operations_agent
      │
      ▼
agent/directives/clickup_task_creation.md   ← instrucciones del agente
      │
      ▼
app/integrations/clickup/task.service.ts    ← lógica de operaciones
      │
      ▼
app/integrations/clickup/client.ts          ← HTTP fetch wrapper
      │
      ▼
https://api.clickup.com/api/v2              ← API externa
```

---

## Límites y Notas

- Rate limit de ClickUp: **100 requests/minuto** por token
- Timeout por request: **10 segundos**
- Solo soporta **Personal API Token** (sin OAuth)
- Usa **ClickUp API v2** — documentación: https://clickup.com/api
- Las credenciales **nunca** se escriben en código fuente
