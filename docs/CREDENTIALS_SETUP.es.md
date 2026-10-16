# Credenciales: dónde conseguirlas y qué hacer

Guía para el dueño del proyecto. Las credenciales **solo van en archivos `.env` locales** o en los paneles de cada servicio (Render, Vercel, GitHub). Nunca se pegan en el chat, en issues ni en commits: `.env` está en `.gitignore` y GitHub tiene activada la protección contra secretos.

| Cuándo    | Servicio             | Variable(s)                                                            | Dónde se pone                    |
| --------- | -------------------- | ---------------------------------------------------------------------- | -------------------------------- |
| **Ahora** | Cloudinary           | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | `apps/api/.env`                  |
| Ya hecho  | JWT (local)          | `JWT_ACCESS_SECRET`                                                    | `apps/api/.env` (ya generado)    |
| Fase 7    | Neon (base de datos) | `DATABASE_URL`                                                         | Panel de Render                  |
| Fase 7    | Render (API)         | Todas las de `apps/api/.env.example` + Deploy Hook                     | Panel de Render + secreto GitHub |
| Fase 7    | Vercel (web)         | `VITE_*` de `apps/web/.env.example`                                    | Panel de Vercel                  |
| Fase 7    | GitHub Actions       | `RENDER_DEPLOY_HOOK_URL`, `JOB_SECRET`                                 | Settings → Secrets del repo      |

---

## 1. Cloudinary (necesario ahora, Fase 3)

Se usa para las imágenes de productos, logo y portada (públicas) y para los comprobantes de pago (privados).

1. Cree una cuenta gratis en <https://cloudinary.com/users/register_free>.
2. Entre a la consola: <https://console.cloudinary.com>.
3. **Cloud name**: en el **Dashboard**, arriba, bajo _Product Environment_. Tiene un botón para copiarlo.
4. **API Key y API Secret**: en el Dashboard pulse **Go to API Keys**, o en la barra izquierda **Settings (engranaje) → API Keys** (<https://console.cloudinary.com/app/settings/api-keys>).
   - Copie el **API Key**.
   - Para ver el **API Secret** pulse el ícono del ojo; puede pedirle su contraseña.
   - Si no ve la página, su usuario necesita rol _Admin_ o _Master admin_ (con cuenta propia ya lo tiene).
5. Abra `apps/api/.env` (no `.env.example`) y complete:

   ```bash
   CLOUDINARY_CLOUD_NAME=su-cloud-name
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=el-secreto-que-copio
   ```

6. Reinicie la API (`pnpm dev`). Sin estas variables la API funciona, pero subir imágenes responde `503` con un mensaje claro.

No hace falta crear _upload presets_: la API sube las imágenes firmadas desde el servidor.

## 2. JWT (ya está listo en local)

`apps/api/.env` ya tiene un `JWT_ACCESS_SECRET` aleatorio. Para producción (Fase 7) genere **otro distinto**:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

La API se niega a arrancar en producción si el secreto sigue siendo el valor de ejemplo (`change-me…`).

## 3. Para la Fase 7 (despliegue) — referencia

Cuando lleguemos a la Fase 7 se revisan los límites actuales de los planes gratis y se completa `docs/DEPLOYMENT.md`. Resumen de lo que usted tendrá que hacer:

### Neon (PostgreSQL)

1. Cree una cuenta en <https://neon.tech> y un proyecto (región cercana a Render, p. ej. US East).
2. En **Connect** copie la _connection string_ (`postgresql://…?sslmode=require`). Esa es `DATABASE_URL`.

### Render (API)

1. Cree una cuenta en <https://render.com> y conecte su GitHub.
2. **New → Web Service** con el repo `booth`. (Los comandos exactos de build/start quedarán en `docs/DEPLOYMENT.md`.)
3. En **Environment** agregue las variables de `apps/api/.env.example` con valores de producción: `NODE_ENV=production`, `TRUST_PROXY=2`, `DATABASE_URL` (Neon), `JWT_ACCESS_SECRET` (nuevo), `CORS_ORIGINS` y `WEB_PUBLIC_URL` (la URL de Vercel) y las de Cloudinary.
4. En **Settings → Deploy Hook** copie la URL: será el secreto `RENDER_DEPLOY_HOOK_URL` en GitHub.

### Vercel (web)

1. Cree una cuenta en <https://vercel.com> e importe el repo `booth` (carpeta raíz `apps/web`).
2. Agregue las variables de `apps/web/.env.example` (`VITE_API_BASE_URL=/api`, `VITE_PUBLIC_URL` con su dominio).
3. El archivo de configuración de Vercel con el _rewrite_ `/api/*` → Render lo dejo listo en el repo.

### GitHub (secretos para CI/CD)

En **github.com/keylorpineda/booth → Settings → Secrets and variables → Actions → New repository secret**:

- `RENDER_DEPLOY_HOOK_URL`: la URL del Deploy Hook de Render.
- `JOB_SECRET`: genere uno con el mismo comando del JWT; el mismo valor va también en Render.

---

## Qué me avisa a mí

Solo dígame "ya puse las credenciales de X". Yo no leo ni imprimo valores de `.env`; verifico que funcionen con pruebas (por ejemplo, subiendo una imagen de prueba) y le cuento el resultado.
