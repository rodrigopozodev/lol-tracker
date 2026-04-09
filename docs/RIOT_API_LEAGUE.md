# API de desarrolladores Riot: League of Legends

Referencia de **endpoints HTTP de League of Legends** excluyendo TFT, VALORANT, Legends of Runeterra y Riftbound.  
Fuente de verdad: [Riot Developer Portal](https://developer.riotgames.com/) y [APIs](https://developer.riotgames.com/apis).  
Las rutas y parámetros pueden cambiar; comprueba siempre la documentación oficial antes de producción.

---

## Autenticación

Todas las peticiones llevan cabecera:

```http
X-Riot-Token: RGAPI-...
```

La clave **no** debe exponerse en el navegador: úsala solo en servidor (como en este proyecto con `RIOT_API_KEY`).

---

## Tipos de host (enrutamiento)

| Tipo | Hosts (ejemplo) | Uso |
|------|-----------------|-----|
| **Routing regional (cuenta)** | `europe.api.riotgames.com`, `americas.api.riotgames.com`, `asia.api.riotgames.com` | **account-v1** |
| **Plataforma de juego (shard)** | `{platform}.api.riotgames.com` p. ej. `euw1`, `na1`, `kr` | summoner, league, mastery, spectator, clash, status, champion rotations, league-exp |
| **Regional match** | Mismo grupo que routing: `europe`, `americas`, `asia` | **match-v5** (ids, partida, timeline) |

Mapeo típico de plataforma a cluster regional para **match-v5**:

- **americas**: `na1`, `br1`, `la1`, `la2`, `oc1`
- **europe**: `euw1`, `eun1`, `tr1`, `ru`
- **asia**: `kr`, `jp1`

---

## 1. account-v1 (Riot ID y PUUID)

**Host:** `https://{routing}.api.riotgames.com` (europe / americas / asia).

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| GET | `/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}` | Resuelve **Riot ID** a datos de cuenta (`puuid`, nombres). |
| GET | `/riot/account/v1/accounts/by-puuid/{puuid}` | Cuenta asociada a un **PUUID**. |
| GET | `/riot/account/v1/active-shards/by-game/lol/by-puuid/{puuid}` | Shard de LoL activo para ese PUUID (cuando aplica). |

`gameName` y `tagLine` deben ir codificados en URL si llevan caracteres especiales.

---

## 2. summoner-v4

**Host:** `https://{platform}.api.riotgames.com` (p. ej. `euw1`).

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| GET | `/lol/summoner/v4/summoners/by-puuid/{encryptedPUUID}` | Nivel, icono de invocador, etc. en ese shard. |
| GET | `/lol/summoner/v4/summoners/{encryptedSummonerId}` | Por id de invocador (legacy). |
| GET | `/lol/summoner/v4/summoners/by-name/{summonerName}` | Por nombre de invocador (menos recomendable; preferir cuenta + PUUID). |

---

## 3. league-v4 (ligas rankeadas por jugador y metadatos de liga)

**Host:** `https://{platform}.api.riotgames.com`.

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| GET | `/lol/league/v4/entries/by-puuid/{encryptedPUUID}` | Entradas **Solo/Flex** (tier, rank, LP, wins/losses) del jugador. |
| GET | `/lol/league/v4/entries/by-summoner/{encryptedSummonerId}` | Igual por id de invocador (legacy). |
| GET | `/lol/league/v4/leagues/{leagueId}` | Metadatos de una liga por id. |
| GET | `/lol/league/v4/challengerleagues/by-queue/{queue}` | Tabla **Challenger** de la cola (p. ej. `RANKED_SOLO_5x5`). |
| GET | `/lol/league/v4/grandmasterleagues/by-queue/{queue}` | Tabla **Grandmaster**. |
| GET | `/lol/league/v4/masterleagues/by-queue/{queue}` | Tabla **Master**. |

Colas habituales: `RANKED_SOLO_5x5`, `RANKED_FLEX_SR`.

---

## 4. league-exp-v4 (paginación por tier y división)

**Host:** `https://{platform}.api.riotgames.com`.

Útil para listar jugadores en un **tier/división** concreto (incluye paginación en ligas altas).

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| GET | `/lol/league-exp/v4/entries/{queue}/{tier}/{division}` | Entradas en la cola/tier/división; parámetro opcional `page` para paginar. |

En tiers ápex (p. ej. MASTER, GRANDMASTER, CHALLENGER) la división suele documentarse como `I`. Detalle en el portal oficial.

---

## 5. match-v5

**Host:** `https://{regionalCluster}.api.riotgames.com` donde `regionalCluster` es `europe`, `americas` o `asia` (no `euw1` en este segmento de URL).

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| GET | `/lol/match/v5/matches/by-puuid/{puuid}/ids` | Lista de **match IDs** (query: `start`, `count`, `queue`, `type`, `startTime`, `endTime` según doc). |
| GET | `/lol/match/v5/matches/{matchId}` | **Detalle** de la partida (`metadata` + `info` con participantes, items, runas, etc.). |
| GET | `/lol/match/v5/matches/{matchId}/timeline` | **Timeline** (eventos por minuto / estructura de frames). |

---

## 6. champion-mastery-v4

**Host:** `https://{platform}.api.riotgames.com`.

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| GET | `/lol/champion-mastery/v4/champion-masteries/by-puuid/{encryptedPUUID}` | Todas las maestrías del jugador (puntos, nivel, etc.). |
| GET | `/lol/champion-mastery/v4/champion-masteries/by-puuid/{encryptedPUUID}/by-champion/{championId}` | Maestría de **un** campeón. |
| GET | `/lol/champion-mastery/v4/scores/by-puuid/{encryptedPUUID}` | Puntuación total de maestría (agregado). |

---

## 7. spectator-v5 (partida en curso)

**Host:** `https://{platform}.api.riotgames.com`.

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| GET | `/lol/spectator/v5/active-games/by-summoner/{encryptedPUUID}` | Partida **activa** del jugador (nombre legacy en path; el identificador es PUUID). Si no está en partida → 404. |

---

## 8. lol-status-v4

**Host:** `https://{platform}.api.riotgames.com`.

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| GET | `/lol/status/v4/platform-data` | Estado del shard: incidencias, mensajes de servicio. |

---

## 9. champion-v3 (rotación gratis)

**Host:** `https://{platform}.api.riotgames.com`.

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| GET | `/lol/platform/v3/champion-rotations` | IDs de campeones en **rotación gratuita** y para cuentas nuevas. |

---

## 10. clash-v1

**Host:** `https://{platform}.api.riotgames.com`.

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| GET | `/lol/clash/v1/players/by-puuid/{puuid}` | Historial / participación Clash del jugador. |
| GET | `/lol/clash/v1/teams/{teamId}` | Equipo por id. |
| GET | `/lol/clash/v1/tournaments` | Lista de torneos (parámetros según doc). |
| GET | `/lol/clash/v1/tournaments/by-team/{teamId}` | Torneo asociado a un equipo. |
| GET | `/lol/clash/v1/tournaments/{tournamentId}` | Detalle de un torneo. |

---

## 11. lol-challenges-v1

**Host:** `https://{platform}.api.riotgames.com`.

Retos (challenges): configuración global, datos por jugador, percentiles, etc. Las rutas exactas y parámetros están en la ficha **lol-challenges-v1** del portal; suele incluir variantes como:

- Configuración de retos (`/lol/challenges/v1/challenges/...`)
- Datos de jugador por PUUID
- Percentiles

Consulta la referencia interactiva para no omitir query params obligatorios.

---

## 12. lol-rso-match-v1 (RSO)

Requiere **autenticación OAuth del jugador (RSO)** con Riot, no basta con la API key de aplicación. Útil para historial o datos ligados a la sesión del usuario con consentimiento. Detalle solo en documentación **RSO** del portal.

---

## 13. tournament-stub-v5 (entorno de pruebas)

**Host:** regional de torneos (según doc actual). Pensado para **probar** integración de torneos sin datos de producción.

Incluye creación de códigos de torneo falsos, registro de equipos simulados, etc. Ver paths en **tournament-stub-v5**.

---

## 14. tournament-v5 (torneos)

**Host:** según documentación de **Tournaments**. Requiere acceso de **torneo** aprobado por Riot; no está disponible para cualquier clave genérica.

---

## Datos estáticos (complemento, no es la API de partidas)

- **Data Dragon** (assets, versiones, JSON de campeones, items): útil junto a la API pero es otro sistema (`ddragon.leagueoflegends.com`).  
- **Community Dragon**: datos comunitarios ampliados.

---

## Respuestas y errores habituales

| Código | Significado típico |
|--------|--------------------|
| 200 | OK |
| 400 | Parámetros incorrectos |
| 401 / 403 | API key ausente, expirada o sin permiso |
| 404 | Recurso no existe (ej. invocador o partida) |
| 429 | Rate limit; usar `Retry-After` y backoff |
| 5xx | Error temporal en Riot |

Las claves **de desarrollo** caducan cada 24 horas; en producción usa **production key** según políticas del portal.

---

## Uso en este repositorio (League Tracker)

Rutas internas que encapsulan parte de la API anterior:

| Ruta app | Equivale aproximado en Riot |
|----------|------------------------------|
| `GET /api/riot/account` | account-v1 + summoner-v4 |
| `GET /api/riot/league` | league-v4 `entries/by-puuid` |
| `GET /api/riot/matches` | match-v5 ids + detalle por id |
| `GET /api/riot/match` | match-v5 `matches/{matchId}` |
| `GET /api/riot/masteries` | champion-mastery-v4 |

Implementación: carpeta `app/api/riot/` y cliente `lib/riot/riotFetch.ts`.

---

## Cumplimiento

- [Términos de la API](https://developer.riotgames.com/terms)  
- [Políticas generales](https://developer.riotgames.com/policies/general)  
- [Límites de peticiones](https://developer.riotgames.com/rate-limiting.html)

Este documento es informativo y no sustituye el asesoramiento legal ni la documentación oficial.
