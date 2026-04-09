# Objetivo del proyecto **League Tracker**

Construir una web **estilo OP.GG** para **League of Legends**: búsqueda por región y Riot ID, perfil con ranked (Solo/Flex), maestrías, historial reciente y detalle de partida, usando la **API oficial de Riot** con la clave **solo en servidor**.

**Éxito comercial y legal acordado:**

1. **Cumplir políticas de Riot** (clave de producción cuando haya tráfico público, sin exponer la key, términos legales claros, no parecer producto oficial de Riot).
2. **Monetización inicial con AdSense** (contenido y UX que cumplan políticas de Google).
3. **Más adelante:** funciones premium ligadas a datos de Riot solo **tras aprobación por escrito** de Riot; “quitar anuncios” como suscripción es la vía más alineada sin ese trámite extra.

El código base actual es un **MVP** funcional (Next.js 15). Este plan ordena lo que falta para producto serio en ~30 días.

---

# Hoja de ruta (orden recomendado, de arriba abajo)

Sigue la lista en este orden: primero base visual y home, luego monetización/layout, cuenta, calidad, y por último legal/API/infra.

1. [x] **Gama cromática y tema claro (negro + naranja)** — Tokens en `globals.css`, `layout`, header, footer, fondos, formularios y pantallas de invocador/políticas alineados (sin depender de púrpura oscuro heredado).
2. [ ] **Home — barra de búsqueda** — Hero con barra tipo píldora: región a la izquierda, separador, campo “Buscar” y placeholder Riot ID (`Nombre#TAG`).
3. [ ] **Home — autocomplete** — Hasta 5 sugerencias por similitud, sin distinguir mayúsculas; documentar estrategia ante límites de la API Riot (ver nota en § Diseño).
4. [ ] **Home — mensaje honesto** — En una pantalla: qué es la web, sin prometer producto oficial Riot.
5. [ ] **Home — rankings** — Top 100 “casi en tiempo real” bajo la búsqueda; al lado, Top 10 por campeón con buscador de campeones (métrica, datos y caché definidos).
6. [ ] **Publicidad — franjas laterales** — Desktop: columnas laterales para display; columna central sin anuncios entre datos del jugador; móvil con slots compatibles y sin tapar CTAs.
7. [ ] **Cuenta** — Registro e inicio de sesión: email + separador OR + botones sociales (Apple, Google, Facebook, Discord); actualizar privacidad/cookies al activar OAuth.
8. [x] **MVP estable** — Errores claros (404, 429, token inválido), estados de carga, UX móvil usable.
9. [ ] **SEO / meta** — OG por página; título dinámico en perfil (`gameName#tagLine`).
10. [ ] **Riot — desarrollo** — Solo clave **personal**; no promocionar URL pública masiva hasta **production key**.
11. [ ] **Riot — producción** — Dominio **HTTPS**, misma build que declare el Developer Portal, registro de producto y **Production API Key**.
12. [ ] **Riot — operación API** — Caché, respeto a rate limits, monitoring básico de 429 en logs; revisar coste de nuevas features.
13. [ ] **Legal** — Términos y privacidad (API Riot, AdSense, cookies/anuncios; sin datos de cuenta propios mientras no haya login).
14. [ ] **Legal — confianza** — Pie con descargo de afiliación Riot (mantener visible).
15. [ ] **AdSense — operativa** — Contenido y navegación alineados a políticas; `ads.txt`; unidades en consola y `NEXT_PUBLIC_ADSENSE_SLOT`; evitar clics accidentales en datos críticos.
16. [ ] **Infra** — Deploy (p. ej. Vercel) con `RIOT_API_KEY` solo en servidor; dominio; logs en producción; plan de backup si hay BD más adelante.
17. [ ] **Crecimiento** — Roadmap features gratuitas vs **paywall** que requiera correo a Riot; canal de soporte/contacto si crece el tráfico.

---

# Diseño (especificaciones)

Visión de **layout y marca** (referencia: barra píldora región + búsqueda; login multi-vía). La marca del producto es **tema claro con negro y naranja** (no el azul oscuro de capturas de referencia literales).

## 1. Página principal — barra de búsqueda central

- [ ] **Hero** con barra **centrada** y forma de **píldora**: **izquierda** selector de **región** (“Región”, valor visible, caret); **separador** vertical; **derecha** campo “Buscar” con placeholder tipo `Nombre en el juego + #EUW`.
- [ ] **Autocomplete**: hasta **5** filas, nombres **más similares**, **case-insensitive** (p. ej. `ganster` → candidatos tipo `GansterYT#EUW`).
- [ ] **Nota API Riot:** no hay búsqueda global por subcadena; elegir e **documentar** estrategia (caché, historial local, índice, o alcance limitado).

## 2. Gama cromática — tema claro (negro y naranja)

- [x] **Base clara** (fondos claros, texto principal oscuro).
- [x] **Naranja** para acentos, CTAs y foco (token `--primary`).
- [x] **Negro / gris muy oscuro** para titulares y contraste (`--foreground`).
- [ ] **WCAG** — Revisión explícita de contraste en botones y enlaces tras cambios futuros de layout.

## 3. Registro e inicio de sesión

- [ ] Pantallas centradas: título, bienvenida, email + CTA, enlace secundario solo si aplica.
- [ ] Separador **OR** y botones circulares **Apple, Google, Facebook, Discord** (orden según backend).
- [ ] Privacidad/cookies al activar OAuth.

## 4. Anuncios — franjas laterales

- [ ] Laterales en viewport ancho; **sin** bloques publicitarios **entre** datos del invocador en la columna central.
- [ ] Móvil: slots permitidos; coherencia con § Monetización en la hoja de ruta.

## 5. Rankings bajo la barra

- [ ] **Top 100** con refresco casi en tiempo real (métrica definida).
- [ ] **Top 10** por campeón con autocomplete de campeones (Data Dragon / catálogo).
- [ ] Origen de datos, **caché** y límites de API documentados.

---

# División sugerida en **30 días** (4 semanas)

Ajusta fechas según tu disponibilidad; cada bloque asume trabajo iterativo, no solo “un día”.

## Semana 1 — Producto sólido en local y staging

- Tema claro y home (barra, textos); pulir buscador y perfil (errores, vacíos, 429).
- Probar varias regiones y Riot IDs límite (nombres raros, unranked, historial vacío).
- Opcional: meta/títulos, favicon, pequeñas mejoras de rendimiento.

## Semana 2 — Producción técnica y Riot

- Deploy en dominio con HTTPS; variables `RIOT_API_KEY` solo en servidor.
- Registrar producto en [developer.riotgames.com](https://developer.riotgames.com/) y preparar **misma URL** que revisará Riot.
- Completar [RIOT_PRODUCTION_CHECKLIST.md](RIOT_PRODUCTION_CHECKLIST.md): ToS/Privacy visibles, verificación de dominio.
- Solicitar **Production API Key** cuando el sitio esté “presentable”.

## Semana 3 — AdSense y pulido de confianza

- Solicitar / conectar **Google AdSense** si el sitio ya tiene contenido y tráfico mínimo aceptable.
- Configurar unidades y `ads.txt`; revisar consola de AdSense por avisos.
- Segunda pasada legal: cookies/publicidad si aplica; SEO on-page (títulos, descripciones, `robots.txt`).

## Semana 4 — Estabilizar, medir, planificar siguiente fase

- Monitorizar errores y 429 tras tráfico real; ajustar caché o límites de UI.
- Definir **qué no** cobrar sin escribir a Riot (ver [MONETIZACION_DATOS_RIOT.md](MONETIZACION_DATOS_RIOT.md)).
- Lista de features v2 priorizada por impacto y coste de API.

---

## Recordatorio rápido

| Objetivo | Acción clave |
|----------|---------------|
| Legal Riot | Production key + ToS + no suplantar a Riot |
| Ingresos | AdSense limpio + UX que no viola políticas |
| Premium sobre datos Riot | Trámite previo por escrito con Riot |

Este documento es una guía interna; no sustituye asesoramiento legal.
