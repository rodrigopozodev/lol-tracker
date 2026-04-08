# Despliegue en VPS (uso personal)

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `RIOT_API_KEY` | Clave de la API de Riot (opcional si usas solo el fichero; ver abajo). **Las claves de desarrollo caducan cada 24 horas**: renueva en [developer.riotgames.com](https://developer.riotgames.com/). Si defines esta variable, **tiene prioridad** sobre el fichero guardado desde la web. |
| `SQLITE_PATH` | Ruta al fichero SQLite; por defecto `./data/app.db`. El directorio debe existir y ser escribible por el usuario del proceso Node. |
| `CRON_SECRET` | Secreto para `Authorization: Bearer` en `GET`/`POST` `/api/cron/refresh-accounts`. Opcional: el mismo valor en cabecera `X-Admin-Token` sirve para `POST` `/api/settings/riot-api-key` si no usas `RIOT_ALLOW_UNSAFE_KEY_UPDATE`. |
| `ADMIN_WRITE_SECRET` | Secreto para cabecera `X-Admin-Token` en `PUT` `/api/matchups/note`. También válido para `POST` `/api/settings/riot-api-key` (alternativa al modo unsafe). |
| `RIOT_ALLOW_UNSAFE_KEY_UPDATE` | Si es `true`, permite guardar la clave Riot desde la web **con un solo campo** sin token (solo recomendable en VPS personal / red privada). En `npm run dev` no hace falta: el servidor ya acepta guardado sin token. |
| `DEFAULT_RIOT_REGION` | Región por defecto (ej. `euw1`) cuando la búsqueda unificada no incluye URL OP.GG con región. |
| `APP_URL` | Opcional: URL pública si algún flujo la necesita. |

Ejemplo `.env` en el servidor:

```env
RIOT_API_KEY=RGAPI-...
SQLITE_PATH=/var/www/lol-tracker/data/app.db
CRON_SECRET=genera_un_string_largo_aleatorio
ADMIN_WRITE_SECRET=otro_string_largo_distinto
DEFAULT_RIOT_REGION=euw1
```

## Proceso Node

- **PM2** o **systemd** para `npm run start` (o `next start -p 3000` según `package.json`).
- Asegurar que el usuario del servicio puede crear/escribir el directorio de `SQLITE_PATH`.

## Cron (refresco horario)

Una vez por hora, llamar al endpoint interno con el secreto:

```bash
0 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://TU_DOMINIO/api/cron/refresh-accounts
```

Sustituir `TU_DOMINIO` y cargar `CRON_SECRET` en el entorno del cron (por ejemplo en el crontab: `CRON_SECRET=...` antes del comando, o un script wrapper que exporte la variable).

## Reverse proxy y TLS

- **Nginx** o **Caddy** delante de Node escuchando en `127.0.0.1:3000` (o el puerto que uses).
- Certificado TLS (Let's Encrypt) recomendado.

## Backup de SQLite

- Copiar periódicamente el fichero `app.db` (o el path de `SQLITE_PATH`) a otro volumen o máquina.
- Mejor hacer copia cuando la app esté en reposo o usar herramientas que soporten copia en caliente de SQLite; al menos backup diario del fichero completo.

## Clave Riot desde la web (sin editar `.env`)

- En `/home`, el panel **Actualizar clave API** guarda la clave en `data/riot_api_key.txt` (junto al SQLite).
- **Prioridad:** `RIOT_API_KEY` en el entorno, si existe, **sustituye** al fichero. Para usar solo lo guardado en la web, no definas `RIOT_API_KEY` en el servidor (o bórrala tras migrar).

## Git

- No versionar `data/*.db` ni `data/riot_api_key.txt`: está cubierto por `.gitignore` (`/data/`).
