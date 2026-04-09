# League Tracker

Aplicación web **Next.js 15** (TypeScript, Tailwind) para consultar perfiles de **League of Legends**: Riot ID + región, rango Solo/Flex, maestrías recientes, historial de partidas y vista detalle. Los datos provienen de la **API de desarrolladores de Riot** vía rutas servidor en `app/api/riot/`.

## Requisitos

- Node.js 20+
- Clave `RIOT_API_KEY` en **servidor** (nunca en el cliente). En local: copia [.env.example](.env.example) a `.env.local` y rellena la clave.

## Arranque

```bash
cp .env.example .env.local
# Edita .env.local y pon RIOT_API_KEY=tu_clave
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run dev` | Desarrollo (puerto 3000, Turbopack) |
| `npm run build` | Build de producción |
| `npm run start` | Servir build |
| `npm run lint` | ESLint |

## Estructura relevante

- `app/page.tsx` — Buscador
- `app/summoner/...` — Perfil y detalle de partida
- `app/api/riot/*` — Proxy a Riot (token solo aquí)
- `lib/riot/` — Cliente HTTP con backoff (`riotFetch`), routing regional, lógica de partidas
- `components/summoner/` — UI del flujo invocador

## Documentación

- [docs/README.md](docs/README.md) — Índice de documentación
- [docs/RIOT_API_LEAGUE.md](docs/RIOT_API_LEAGUE.md) — Endpoints LoL (referencia)
- [docs/RIOT_PRODUCTION_CHECKLIST.md](docs/RIOT_PRODUCTION_CHECKLIST.md) — Clave de producción
- [docs/MONETIZACION_DATOS_RIOT.md](docs/MONETIZACION_DATOS_RIOT.md) — Monetización y datos Riot
- [docs/PLAN_30_DIAS.md](docs/PLAN_30_DIAS.md) — Objetivo del proyecto, lista de éxito y plan 30 días
- [DEPLOY.md](DEPLOY.md) — Variables y despliegue

## Legal

League Tracker no está afiliado con Riot Games. Cumple los [términos de la API](https://developer.riotgames.com/terms). Textos legales en `/policies/terms` y `/policies/privacy`.
