# 🚀 Deploy en queue mode (escala + buffer) — Bot NODO

El workflow **`NODO - Bot Telegram (avanzado)`** ya tiene buffer Redis interno
(anti-duplicado + rate-limit). Para aguantar **mucha gente a la vez**, n8n debe correr
en **queue mode**: las consultas entran, se encolan en Redis y los *workers* las procesan
en paralelo. Esa cola **es** el buffer que pediste.

## Por qué queue mode
- Modo simple: ~23 req/s y empieza a fallar bajo pico.
- Queue mode: ~162 req/s con 0% de fallos (benchmark oficial n8n). El pico se absorbe en
  la cola; nadie se pierde, solo esperan su turno en orden.

## Pasos
1. Copia `.env.example` → `.env` y rellena (clave Postgres, `N8N_ENCRYPTION_KEY`, `WEBHOOK_URL`).
2. Levanta:
   ```bash
   docker compose -f docker-compose.queue.yml --env-file .env up -d
   ```
3. Escala workers según carga:
   ```bash
   docker compose -f docker-compose.queue.yml up -d --scale n8n-worker=3
   ```
4. Entra al editor (`:5678`), importa/abre el workflow, configura credenciales y **actívalo**.

## Notas importantes
- **Redis**: ya va con AOF (`appendonly`) + `noeviction` (obligatorio para BullMQ). Si se
  reinicia, la cola se recupera sola (pierde <=1s).
- **Telegram**: techo de salida **30 msg/s** por bot (1/s por chat). Los *updates* entrantes
  no cuentan. La cola amortigua; si algún día se queda corto → *Paid Broadcasts* (@BotFather,
  hasta 1000/s). El workflow responde **1 mensaje por consulta** para no malgastar ese techo.
- **El MISMO Redis** sirve para el queue mode y para el buffer interno del bot (dedup + rate-limit).
- **Ya estás en easypanel**: si prefieres no usar este compose, replica estos servicios como
  apps en easypanel (main, worker, webhook apuntando al mismo Postgres+Redis, misma
  `N8N_ENCRYPTION_KEY`). El compose es la referencia de qué variables y servicios hacen falta.
