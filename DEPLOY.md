# Despliegue (MVP)

## Variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `RIOT_API_KEY` | Sí | Clave de la API Riot (solo servidor). Producción: clave de **producción** tras aprobación en el Developer Portal. |
| `NEXT_PUBLIC_ADSENSE_SLOT` | No | ID de unidad display de AdSense cuando exista en consola. |
| `NEXT_PUBLIC_HOME_DISPLAY_TZ` | No | Zona horaria para fechas (por defecto `Europe/Madrid`). |

## Hosting

Despliega en cualquier plataforma compatible con Next.js 15 (p. ej. Vercel). Configura `RIOT_API_KEY` en el panel de variables de entorno **sin** prefijo `NEXT_PUBLIC_`.

**HTTPS:** obligatorio para producción y para la verificación del dominio en el [Developer Portal de Riot](https://developer.riotgames.com/).

## Ads

- Ruta estática `GET /ads.txt` ya expone la línea del publisher actual.
- Tras crear unidades en AdSense, asigna `NEXT_PUBLIC_ADSENSE_SLOT` y revisa que el script del cliente en `app/layout.tsx` coincida con tu `ca-pub-…`.
