# Publicar Sabionautas en Vercel (un solo proyecto)

## Primera publicación

1. Sube el contenido de la carpeta **Sabionautas_Vercel** a la raíz de tu repositorio GitHub (debe verse `package.json`, `vercel.json`, `api/`, `server/` y `public/`).
2. En Vercel selecciona **Add New > Project**, importa ese repositorio y elige **Framework Preset: Other**.
3. En **Root Directory**, selecciona la carpeta que contiene `package.json` y `vercel.json`. Si subiste directamente su contenido a la raíz del repositorio, déjalo en `./`.
4. El archivo `vercel.json` configura `public/` como salida y dirige `/api/*` a una función Node.js. No necesitas crear otro proyecto ni instalar Express.
5. Haz clic en **Deploy**.
6. Verifica `https://TU-DOMINIO.vercel.app/api/status`: debe devolver JSON con `storageMode`.

## Muy importante: conservar partidas y sesiones

Sin almacenamiento externo, el despliegue sirve para una **demostración temporal**: en Vercel la memoria se reinicia y distintas instancias no comparten sesiones ni progreso. Para una demo que persista, crea una base **Upstash Redis** y configura en **Vercel > Project > Settings > Environment Variables**:

- `UPSTASH_REDIS_REST_URL`: URL REST de Upstash.
- `UPSTASH_REDIS_REST_TOKEN`: token REST de Upstash.

Estas variables deben ser **server-side**, no se colocan en `public/` ni en `vercel.json`. Vuelve a desplegar después de configurarlas. La API responderá `"storageMode":"upstash-redis"`.

> Nota: esta versión guarda todo el estado de la demostración en una única clave Redis. No incluye transacciones de concurrencia ni separación por escuelas. Es válida para demos pequeñas, no para uso institucional con muchos alumnos simultáneos. Para ese escenario, migra a PostgreSQL con tablas y controles por estudiante.

## Gemini (opcional)

Configura también:

- `GEMINI_API_KEY`: clave de Google AI Studio.
- `GEMINI_MODEL`: identificador de un modelo disponible en la cuenta.
- `TEACHER_PASSWORD`: contraseña propia del docente. **No uses el valor demo** para despliegues públicos.

La biblioteca de juegos y el tutor de respaldo funcionan sin configurar Gemini. No subas el archivo `.env` a GitHub ni al ZIP de despliegue.

## Comprobar

- `https://TU-DOMINIO.vercel.app/` debe mostrar la interfaz.
- `https://TU-DOMINIO.vercel.app/api/status` debe mostrar JSON (no HTML ni 404).
- Tras entrar como estudiante, comprueba que puedas abrir una misión.
- Si usas Redis, recarga, cambia de página y confirma que el progreso continúa.
- En local siguen funcionando `npm install`, `npm start` y `npm test`.

## Seguridad y alcance

Los accesos de Estudiante/Familia siguen siendo de demostración, sin verificación de identidad; no introduzcas datos personales de menores. Los límites de solicitudes basados en memoria son por instancia. Para una aplicación pública real se necesitan cuentas, permisos de clases, sesiones y límites distribuidos, base de datos transaccional y respaldo.
