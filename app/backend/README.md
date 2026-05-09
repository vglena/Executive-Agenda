# Backend

> Servidor y lógica de aplicación del sistema.

## Estado

Pendiente de implementación.

## Responsabilidades

- Orquestar llamadas al agente IA
- Gestionar sesiones de usuario
- Procesar webhooks de ClickUp
- Persistir datos de aplicación (no reemplaza la memoria del agente)

## Consideraciones

- El backend NO contiene lógica cognitiva del agente
- La lógica de gestión de proyectos vive en `/agent/`
- El backend es el puente entre la interfaz y el agente

## Tecnologías Sugeridas

- Python (FastAPI / Flask)
- O Node.js (Express / Fastify)
