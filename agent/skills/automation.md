# Skill: Automation

## Propósito

Identificar y ejecutar tareas repetibles de forma mecánica, reduciendo el trabajo manual del agente y del usuario.

---

## Capacidades

- Identificar patrones de trabajo repetitivo
- Ejecutar scripts de sincronización con herramientas externas
- Encadenar operaciones mecánicas en flujos simples
- Validar resultados de operaciones automáticas
- Registrar historial de ejecuciones

---

## Inputs Requeridos

- Script o proceso a ejecutar (`agent/execution/`)
- Parámetros de la operación
- Credenciales de acceso (via variables de entorno)

---

## Outputs

- Resultado de la operación (éxito / error)
- Log de ejecución
- Confirmación para el agente solicitante

---

## Herramientas Compatibles

- Scripts en `agent/execution/`
- `app/integrations/clickup/client.md`
- Variables de entorno (`.env`)

---

## Límites

- Los scripts son mecánicos — no toman decisiones
- No ejecuta operaciones destructivas sin confirmación
- No inventa parámetros — requiere datos completos antes de ejecutar

---

## Reglas de Ejecución

1. Verificar que todos los parámetros estén disponibles antes de ejecutar
2. Registrar el resultado de cada ejecución
3. En caso de error, reportar con detalle completo — no ignorar silenciosamente
4. No reintentar automáticamente más de 2 veces
5. Operaciones que afectan datos externos requieren confirmación previa
