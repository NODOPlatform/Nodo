# Bot de Telegram de NODO (n8n)

Bot de Telegram **sin LLM** que deja consultar la información de [NODO](https://nodoayuda.com)
(personas desaparecidas, refugios, hospitales, sangre, centros de acopio, campañas e info
verificada) leyendo su base de datos por la **API REST de Supabase** con la `anon key` (solo
lectura). Incluye **buffer en Redis** (anti-duplicados + rate-limit) y está pensado para
**n8n queue mode** (escala horizontal).

## Contenido del repo
```
workflows/nodo-telegram-avanzado.json   ← el flujo de n8n (importable)
docs/                                    ← guías (configuración, entrega, guía completa + PDF)
deploy/                                  ← docker-compose de queue mode + .env.example
```

## Cómo importar el flujo en n8n
1. n8n → **Workflows → Import from File** → elige `workflows/nodo-telegram-avanzado.json`.
2. Configura las **credenciales** (no vienen en el archivo, por seguridad):
   - **Telegram API** → token del bot de @BotFather.
   - **Header Auth** (`Name: apikey`, `Value:` la anon key de NODO) → nodo *Buscar en Supabase (NODO)*.
   - **Redis** → host/puerto/password (nodos *Redis: anti-duplicado* y *Redis: rate-limit*).
3. Edita la **1ª línea** del nodo *"Clasificar y decidir"* (`SUPABASE_BASE`) con la URL de Supabase de NODO.
4. **Activa** el workflow.

> Guía completa paso a paso: `docs/GUIA-COMPLETA-Bot-NODO.md` (o el PDF).
> Escalar a producción: `deploy/README-deploy.md`.

## Seguridad
Este repo **no contiene secretos**. El JSON del flujo solo referencia los *nombres* de las
credenciales; los tokens/keys se configuran en cada instancia de n8n y nunca se versionan.
El archivo `.env` (credenciales del deploy) está en `.gitignore`.

## Tecnología
n8n · Telegram Bot API · Supabase REST (anon key) · Redis. Sin modelos de IA de pago.
