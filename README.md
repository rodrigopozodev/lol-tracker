# Pendientes de Arreglo

- [ ] Flujo de SMS: si el teléfono no se añade, no se redirige a verificación por SMS.
- [ ] futuros registros y loegeos con el riot acount

RUTA BASE DE DATOS

http://localhost:3000/api/admin/users


## 🎯 **Objetivo del proyecto**

Crear un sistema dentro de la app *Multi-search* que permita  **mostrar la evolución del rango y LP (League Points) de un jugador de League of Legends a lo largo del tiempo** , incluso aunque la API oficial de Riot  **no provea datos históricos directamente** .

La idea es construir una función que:

* Consuma el endpoint oficial `/lol/league/v4/entries/by-summoner/{summonerId}`.
* Guarde en una base de datos (por ejemplo Supabase) un **registro diario** del rango, división, LP, victorias y derrotas del jugador.
* Genere un **gráfico visual (línea o barras)** que muestre el progreso del jugador diario, semanal o mensual.

De esta forma, el sistema simula una API de histórico, almacenando snapshots periódicos que luego pueden graficarse como “Evolución de LP”.

---

## 🧠 **Prompt para pedírmelo más adelante**

> Quiero que me ayudes a implementar un sistema de seguimiento de rango (LP tracking) en mi app  *Multi-search* .
>
> El sistema debe obtener los LP actuales del jugador desde la API de Riot (`/lol/league/v4/entries/by-summoner/{summonerId}`) y guardarlos diariamente en una base de datos (por ejemplo, Supabase) junto con la fecha, tier, división, wins y losses.
>
> Luego quiero mostrar en mi frontend (Angular o React) un gráfico que muestre la evolución de LP en el tiempo (por día, semana o mes).
>
> Necesito que me des:
>
> * El esquema SQL completo de la tabla `rank_history`.
> * El código del cron job (en Node.js o Supabase Edge Function) que haga la inserción diaria.
> * El endpoint que devuelva el histórico de LP por jugador.
> * Y el código frontend para graficar la evolución (usando Recharts o Chart.js).
>
> El diseño debe seguir el estilo gamer moderno de *Multi-search* (colores oscuros, neón violeta, tipografía blanca).
>
