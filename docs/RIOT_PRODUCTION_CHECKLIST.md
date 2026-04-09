# Checklist: clave de producción Riot

1. **Desarrollo local**  
   - Usa una clave *personal* en `.env.local` (`RIOT_API_KEY`).  
   - No enlaces la web pública ni promociones con tráfico real hasta tener **production key**.

2. **Sitio desplegable**  
   - Dominio HTTPS con la misma app que enviarás a revisión.  
   - Home que explique qué hace el producto en 1–2 pantallas.  
   - Enlaces visibles a **Términos** y **Privacidad** (`/policies/terms`, `/policies/privacy`).  
   - La clave Riot solo en variables de entorno del servidor (nunca en el cliente).

3. **Developer Portal**  
   - Registra el producto en [developer.riotgames.com](https://developer.riotgames.com/).  
   - Verifica la propiedad del dominio según el flujo del portal.  
   - Solicita la **Production API Key** con la URL pública.  
   - Después del OK, configura `RIOT_API_KEY` en producción con la clave de producción y abre el tráfico.

4. **Documentación Riot**  
   - [Production Key Applications](https://support-developer.riotgames.com/hc/en-us/articles/22801383038867-Production-Key-Applications)  
   - [API Terms](https://developer.riotgames.com/terms)  
   - [Rate limits](https://developer.riotgames.com/rate-limiting.html)
