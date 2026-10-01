# Monitoría de Salas

Sistema web para consultar salas de cómputo abiertas y gestionar turnos de monitoría en Sede Central y Sede Lans.

## Requisitos

- [Node.js](https://nodejs.org) 20 o superior
- npm (viene con Node) o [Bun](https://bun.sh)

## Cómo correrlo

La web está en `frontend` y la API en `backend`.

```sh
cd frontend
bun install
bun run dev
```

En otra terminal:

```sh
cd backend
bun install
bun run start:dev
```

Desde la raíz también puedes usar `bun run dev` y `bun run api`.

La web queda en [http://localhost:3000](http://localhost:3000). La API queda en [http://localhost:3001](http://localhost:3001).

| Ruta | Qué ves |
| --- | --- |
| `/` | Salas abiertas ahora |
| `/coordinacion` | Panel de coordinación |
| `/monitor` | Panel del monitor |

## Otros comandos

Dentro de `frontend`:

```sh
bun run build
bun run preview
bun run lint
```

## Stack

- TanStack Start y React en `frontend`
- NestJS en `backend`
- TypeScript
- Tailwind CSS
- Supabase
