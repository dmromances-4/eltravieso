# Bar Online (realtime)

Salas de chat, videollamada y cata entre bares. Usa **Socket.IO** en un proceso Node separado de Next.js.

## Arquitectura

```
Browser ──► Next.js (app/bar-online, /api/bar-online)
     │
     └──► Socket.IO server (server/realtime/index.ts :3001)
              │
              └──► Redis adapter (opcional, multi-instancia)
```

## Rutas

| Recurso | Ruta / comando |
|---------|----------------|
| Lobby | `/bar-online` |
| Sala | `/bar-online/[roomId]` |
| API sesiones | `GET/POST /api/bar-online` |
| Servidor dev | `npm run dev:ws` |
| Servidor prod | `npm run start:ws` |

Render inyecta `PORT` automáticamente; localmente usa `WS_PORT` (default 3001).

## Archivos clave

- `server/realtime/index.ts` — servidor Socket.IO
- `lib/realtime/useBarOnline.ts` — hook React (presencia, señales WebRTC)
- `lib/realtime/room-access.ts` — autorización de sala
- `components/bar-online/BarOnlineLobby.tsx`, `BarOnlineRoom.tsx`
- Modelo Prisma: `BarOnlineSession` (tipos: `CHAT`, `VIDEO_CALL`, `TASTING_EVENT`)

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_WS_URL` | URL pública del socket (ej. `http://localhost:3001`) |
| `WS_PORT` | Puerto local (default `3001`; Render usa `PORT`) |
| `REDIS_URL` | Adapter Redis; vacío = presencia en memoria (una instancia) |

## Desarrollo

Terminal 1: `npm run dev`  
Terminal 2: `npm run dev:ws`

Sin `REDIS_URL`, basta para desarrollo local en una máquina.

## Producción

- Desplegar el proceso WS aparte del frontend Next.js.
- Configurar `REDIS_URL` si hay más de una instancia del servidor realtime.
- Alinear `NEXT_PUBLIC_WS_URL` con la URL pública del servicio WS.

Ver [AGENTS.md — Bar Online](../AGENTS.md#bar-online-realtime).
