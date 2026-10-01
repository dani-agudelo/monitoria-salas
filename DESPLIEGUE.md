# Despliegue

Un solo repositorio. El backend se publica en Render y el frontend en Netlify. Cada servicio apunta a su carpeta.

Sube el repo a GitHub antes de empezar. No subas `backend/.env`: las claves van en el panel de cada servicio.

Publica primero la API. Netlify necesita su URL.

## Render (API)

1. Entra a [Render](https://dashboard.render.com) y elige **New → Web Service**.
2. Conecta el repositorio de GitHub.
3. Completa el servicio así:

| Campo | Valor |
| --- | --- |
| Root Directory | `backend` |
| Runtime | Node. Render usa Bun si ve `backend/bun.lock`. |
| Build Command | `bun install --production=false && bun run build` |
| Start Command | `bun run start:prod` |

`start:prod` ejecuta `node dist/main.js`. El script `start` es solo para desarrollo.

4. En **Environment** agrega:

| Variable | Valor |
| --- | --- |
| `SUPABASE_URL` | La URL del proyecto, en Supabase → Project Settings → API. |
| `SUPABASE_SECRET_KEY` | La secret key (`sb_secret_...`), en el mismo lugar. No uses la publishable key. |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` por ahora. Después del paso de Netlify, agrega la URL del sitio, separada por coma. |

No definas `PORT`. Render lo asigna y la API lo lee sola.

5. Crea el servicio y espera a que el deploy quede en verde.
6. Abre `https://tu-servicio.onrender.com/health`. Tiene que responder `{"ok":true}`. Esa URL, sin `/health` y sin barra final, es la de la API.

Si el build dice que no existe `bun`, en Environment agrega `BUN_VERSION` con `1.4.2` y vuelve a desplegar.

## Netlify (web)

1. Entra a [Netlify](https://app.netlify.com) y elige **Add new project → Import an existing project**.
2. Conecta el mismo repositorio.
3. El archivo `netlify.toml` de la raíz ya deja estos valores. Confírmalos y no los dupliques en el panel:

| Campo | Valor |
| --- | --- |
| Base directory | `frontend` |
| Build command | `bun run build` |
| Publish directory | `dist/client` |

La web no es un sitio estático. TanStack Start publica funciones de Netlify y los archivos de `dist/client`. El mismo archivo fija Node 22, que es el que pide el plugin de Netlify.

4. En **Site configuration → Environment variables** agrega:

| Variable | Valor |
| --- | --- |
| `VITE_API_URL` | La URL de Render, sin barra al final. Ejemplo: `https://tu-servicio.onrender.com` |

Esa variable se lee al compilar. Si la cambias, vuelve a desplegar el sitio.

5. Lanza el deploy. Cuando termine, copia la URL del sitio, por ejemplo `https://monitoria-de-salas.netlify.app`.

## Cerrar el enlace entre los dos

1. En Render, edita `CORS_ORIGINS` y deja los orígenes separados por coma, sin espacios de más:

```text
http://localhost:3000,http://127.0.0.1:3000,https://tu-sitio.netlify.app
```

Si Netlify también te da una URL de previsualización y quieres usarla, súmala en la misma lista.

2. Guarda. Render vuelve a desplegar la API.
3. Entra al sitio de Netlify e inicia sesión. Si el navegador bloquea las peticiones, la URL del sitio no está en `CORS_ORIGINS` o `VITE_API_URL` no apunta a Render.

## Comprobar

- `https://tu-servicio.onrender.com/health` responde `{"ok":true}`.
- La página pública del sitio muestra las salas abiertas.
- El ingreso de coordinación y de monitor llega a la API.

En el plan gratuito, Render duerme el servicio. La primera visita después de un rato puede tardar cerca de un minuto.
