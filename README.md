# Monitoría de Salas

Sistema web para consultar salas de cómputo abiertas y gestionar turnos de monitoría en Sede Central y Sede Lans.

## Requisitos

- [Node.js](https://nodejs.org) 20 o superior
- npm (viene con Node) o [Bun](https://bun.sh)

## Cómo correrlo

```sh
npm install
npm run dev
```

Con Bun:

```sh
bun install
bun run dev
```

Abre [http://localhost:3000](http://localhost:3000).

| Ruta | Qué ves |
| --- | --- |
| `/` | Salas abiertas ahora |
| `/coordinacion` | Panel de coordinación |
| `/monitor` | Panel del monitor |

## Otros comandos

```sh
npm run build
npm run preview
npm run lint
```

## Stack

- TanStack Start
- React
- TypeScript
- Tailwind CSS
