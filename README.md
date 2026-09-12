# Acordate

**Acordate** es un asistente personal por Telegram que convierte una conversación en seguimiento real: guarda los datos que la persona pide recordar, recupera ese contexto al crear un recordatorio, envía el aviso a la hora indicada y permite cerrarlo con “Hecho”.

Está pensado para personas que tienen que recordar trámites, documentos y tareas cotidianas sin volver a explicar el contexto. Telegram es esencial: el asistente reconoce al usuario y el chat desde el que llega cada mensaje, entrega el aviso en ese mismo lugar y conserva la memoria aislada por usuario.

## Flujo de la demo

1. La persona escribe: “Guardá que para retirar el certificado necesito cédula y comprobante”.
2. Acordate guarda esa memoria para esa cuenta de Telegram.
3. La persona pide: “Recordame retirar el certificado en 2 minutos”.
4. El agente recupera la memoria relevante y crea el recordatorio con ese contexto.
5. Un scheduler envía el aviso por Telegram cuando llega la hora.
6. La persona responde “Hecho” y Acordate marca el último recordatorio enviado como completado.

## Arquitectura

```text
Telegram -> webhook de Next.js -> agente Gemini + tools -> Supabase
    ^                                                     |
    |---------------- scheduler / recordatorio -----------|
```

- **Telegram Bot API** recibe mensajes y entrega respuestas y avisos.
- **Next.js + TypeScript** expone el webhook, health check y endpoint protegido del scheduler.
- **Gemini mediante AI SDK** interpreta la intención y llama herramientas validadas.
- **Supabase/PostgreSQL** persiste usuarios, memorias y recordatorios.

El modelo no escribe directamente en la base de datos. Las operaciones `saveMemory`, `searchMemory`, `createReminder` y `completeReminder` validan sus entradas y devuelven resultados estructurados.

## Ejecutar localmente

### Requisitos

- Node.js 22 o superior
- Un bot de Telegram creado con BotFather
- Una API key de Google AI Studio para Gemini
- Un proyecto de Supabase con acceso de service role

Cloná el repositorio e instalá las dependencias:

```bash
git clone https://github.com/<tu-usuario>/acordate.git
cd acordate
npm ci
cp .env.example .env
```

En Windows PowerShell, reemplazá el último comando por:

```powershell
Copy-Item .env.example .env
```

Completá estas variables en `.env`. No subas este archivo ni claves al repositorio.

```dotenv
GOOGLE_GENERATIVE_AI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash

TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_DRY_RUN=true

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
ACORDATE_PUBLIC_URL=
```

`TELEGRAM_DRY_RUN=true` permite probar el procesamiento del webhook localmente sin enviar mensajes al bot. Para una prueba real o despliegue, usá `false`.

### Base de datos

Abrí el SQL Editor de tu proyecto de Supabase y ejecutá las migraciones de la carpeta [`supabase/`](supabase/) en orden numérico (`001` a `009`). La migración `009_acordate_contract_alignment.sql` es necesaria para el contrato actual de memorias, recordatorios y scheduler.

### Iniciar y verificar

```bash
npm run verify
npm run dev:web
```

El servidor queda disponible en `http://127.0.0.1:3100`. Podés comprobar que está vivo en `GET /api/health`.

Para una prueba local del webhook, conservá `TELEGRAM_DRY_RUN=true` y enviá un update de ejemplo a `POST /api/telegram/webhook` con el header `X-Telegram-Bot-Api-Secret-Token` igual a `TELEGRAM_WEBHOOK_SECRET`. La respuesta incluye el texto que se habría enviado a Telegram.

## Conectar Telegram y el scheduler

Para recibir actualizaciones reales, desplegá la aplicación en una URL HTTPS, configurá `ACORDATE_PUBLIC_URL` y registrá el webhook:

```text
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<tu-dominio>/api/telegram/webhook&secret_token=<WEBHOOK_SECRET>
```

Configurá un cron externo para invocar `POST /api/internal/run-due-reminders` periódicamente (por ejemplo, cada minuto), con:

```text
Authorization: Bearer <CRON_SECRET>
```

Ese endpoint reclama recordatorios pendientes, envía cada aviso por Telegram y solo lo marca como `sent` después de una entrega exitosa. Sin la cabecera correcta responde `401`.

## Comprobaciones y límites

- `npm run verify` ejecuta typecheck y pruebas offline; no sustituye una prueba con Telegram, Gemini y Supabase configurados.
- El webhook rechaza solicitudes sin su secreto y responde `503` si faltan las credenciales necesarias.
- La memoria se consulta únicamente para el usuario de Telegram que la creó.
- “Hecho” solo completa el último recordatorio que ya fue enviado; no completa tareas pendientes ni de otros usuarios.
- El scheduler no reintenta automáticamente los envíos que fallan: los deja con estado `failed` para evitar duplicados silenciosos.

## Trabajo realizado durante el hackathon

El repositorio partió del starter kit **Agents, Everywhere**. El flujo propio de Acordate incorpora el canal de Telegram, el agente de memoria y recordatorios, las herramientas validadas, el almacenamiento en Supabase, el scheduler, los endpoints protegidos y sus pruebas de integración. Los contratos detallados están en [acordate-contracts.md](acordate-contracts.md).

## Tecnologías

Next.js, TypeScript, Telegram Bot API, Google Gemini, Vercel AI SDK, Supabase/PostgreSQL y Zod.
