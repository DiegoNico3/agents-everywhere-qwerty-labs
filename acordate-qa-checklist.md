# ACORDATE — Checklist de integración y QA

Este checklist pertenece a la persona 5. No se marca una prueba como pasada
solo porque un componente responda: debe quedar evidencia verificable en la
columna correspondiente.

## Convenciones

| Estado | Significado |
| --- | --- |
| `⬜ Pendiente` | Aún no se probó o depende de otro módulo. |
| `🟡 Bloqueado` | No puede continuar; anotar dueño y causa. |
| `🟢 Pasó` | Resultado observado y evidencia guardada. |
| `🔴 Falló` | Se reprodujo un error; enlazar issue o registro. |

**Evidencia válida:** captura de Telegram sin secretos, ID de una fila de
Supabase, salida sanitizada del endpoint, o video breve. Nunca pegar tokens,
headers de autorización ni URLs con credenciales.

## Auditoría del primer corte — 2026-09-12

Se corrigió la integración local sobre `414e66d`. `npm ci` vuelve a ser
reproducible, `npm run verify` pasa y los endpoints locales devuelven los
resultados esperados. La migración `009_acordate_contract_alignment.sql` está
aplicada: las columnas canónicas y `search_memories_text` devuelven `200` en
una verificación sanitizada. El webhook autenticado en modo seco guardó una
memoria y creó un reminder de prueba futuro. La auditoría no leyó ni expuso
valores de secretos.

## 0. Prevuelo de integración

| # | Prueba | Responsable | Estado | Evidencia / notas |
| --- | --- | --- | --- | --- |
| 0.1 | `acordate-contracts.md` está aceptado por las personas 1–4. | P5 | 🟡 Bloqueado | La implementación se alineó al contrato; falta registrar la aceptación del equipo. |
| 0.2 | La rama de integración contiene los cambios requeridos, sin conflictos. | P5 | 🟢 Pasó | Esta rama contiene P1–P4 y las correcciones de integración, sin conflictos. |
| 0.3 | `.env` local contiene todas las variables de Acordate; no se versiona. | P5 | 🟢 Pasó | Telegram, Supabase, Gemini y `CRON_SECRET` están configurados localmente; `.env` está ignorado y Telegram queda en modo seco para pruebas locales. |
| 0.4 | Las variables equivalentes están cargadas en el entorno de Vercel/Supabase que corresponda. | P5 | 🟡 Bloqueado | No hay URL desplegada, acceso al entorno ni evidencia sanitizada para verificarlo. |
| 0.5 | `GET /api/health` en la URL desplegada devuelve `200` y no expone secretos. | P1 + P5 | 🟡 Bloqueado | Local: `GET /api/health` devolvió `200` con `{ ok: true, service: "acordate" }`. Falta desplegar y guardar la evidencia HTTPS. |
| 0.6 | El chequeo de tipos y las pruebas definidas por el proyecto pasan antes de desplegar. | P5 | 🟢 Pasó | `npm install --package-lock-only`, `npm ci` y `npm run verify` pasan. |

## 1. Pruebas por frontera

| # | Frontera | Caso y resultado esperado | Responsable | Estado | Evidencia / notas |
| --- | --- | --- | --- | --- | --- |
| 1.1 | Telegram → webhook | Un mensaje normal llega al endpoint, se identifica el chat y recibe una respuesta mock o real. | P1 | 🟡 Bloqueado | Prueba local autenticada creó el usuario, construyó el `AgentTurn` y devolvió respuesta del agente en modo seco. Falta endpoint HTTPS de Telegram. |
| 1.2 | Seguridad del webhook | Un request sin `X-Telegram-Bot-Api-Secret-Token` recibe `401`; no crea usuario, memoria ni reminder. | P1 + P5 | 🟢 Pasó | Prueba unitaria y request local sin header: `401`; el handler no se configura si falta el secreto. |
| 1.3 | Backend → agente | “Guardá que necesito cédula” produce la intención `saveMemory` con `userId` y `sourceMessageId`. | P2 | 🟢 Pasó | El webhook resuelve `users.id`, envía `sourceMessageId` y llama `runAcordateAgent`; pruebas del `AgentTurn` y agente mock pasan. |
| 1.4 | Agente → memoria | La tool guarda el contenido y devuelve un `memory.id` del mismo `userId`. | P2 + P3 | 🟢 Pasó | Prueba autenticada en modo seco guardó la memoria y una búsqueda sanitizada devolvió `1` resultado para el mismo usuario. |
| 1.5 | Memoria → agente | Una búsqueda relacionada devuelve, como máximo, tres memorias del usuario correcto. | P2 + P3 | 🟡 Bloqueado | La RPC canónica responde y el adaptador limita a 3; falta ejercitarla desde el agente real. |
| 1.6 | Agente → reminder | “Recordame … en 2 minutos” crea un reminder futuro `pending`, con `context` y `sourceMemoryIds`. | P2 + P4 | 🟡 Bloqueado | Prueba real creó un reminder `pending`, futuro y con contexto; se corrigió `start_at` heredado. Falta una prueba real que recupere memoria y complete `sourceMemoryIds`. |
| 1.7 | Scheduler → Telegram | Una pasada autorizada encuentra el reminder vencido, Telegram confirma el envío y el estado pasa a `sent` una sola vez. | P1 + P4 | 🟡 Bloqueado | Ruta protegida, claim atómico, SQL y secreto local listos; falta cron HTTPS y entrega real a Telegram. |
| 1.8 | “Hecho” → completado | El `AgentTurn` incluye el último reminder `sent`; la tool deja ese reminder en `completed`. | P1 + P2 + P4 | 🟡 Bloqueado | El webhook consulta el último `sent` solo para “Hecho”; falta una fila `sent` real tras la entrega del scheduler. |

## 2. Prueba end-to-end de la demo

Ejecutar en el mismo chat de Telegram y guardar una captura/clip continuo.

| Paso | Acción | Resultado esperado | Estado | Evidencia / notas |
| --- | --- | --- | --- | --- |
| 2.1 | Enviar: “Guardá que para retirar el certificado necesito cédula y comprobante.” | Acordate confirma que guardó la memoria; existe una fila en `memories`. | 🟡 Bloqueado | Flujo local en modo seco pasó con una memoria de prueba; falta probar el chat de Telegram desplegado. |
| 2.2 | Enviar: “Recordame retirar el certificado en 2 minutos.” | Recupera la memoria y confirma la fecha/hora del reminder; existe una fila `pending`. | 🟡 Bloqueado | Flujo local creó un reminder futuro; falta demostrar recuperación de memoria y probar el chat desplegado. |
| 2.3 | Esperar o ejecutar una pasada autorizada del scheduler cuando ya esté vencido. | Llega: “🔔 Recordatorio / Retirar certificado / Necesitás llevar cédula y comprobante.” | 🟡 Bloqueado | Ruta, claim atómico y tests están listos; falta cron HTTPS y entrega real controlada. |
| 2.4 | Enviar: “Hecho”. | Responde con confirmación y la misma fila queda `completed`. | 🟡 Bloqueado | El contexto `activeSentReminder` está conectado; falta generar un reminder `sent` desde el scheduler. |
| 2.5 | Enviar “Hecho” otra vez. | No cambia datos y explica que no hay recordatorio activo. | 🟡 Bloqueado | Depende de 2.4. |

## 3. Casos de seguridad, aislamiento y recuperación

| # | Caso | Resultado esperado | Responsable | Estado | Evidencia / notas |
| --- | --- | --- | --- | --- | --- |
| 3.1 | Usuario B pregunta por el certificado de Usuario A. | `searchMemory` no devuelve datos de A. | P3 + P5 | 🟡 Bloqueado | La RPC filtra por `match_user_id` y la suite cubre aislamiento; falta prueba contra dos usuarios reales. |
| 3.2 | Usuario pide “recordame mañana” sin hora. | El agente pide una hora; no se crea reminder. | P2 | 🟡 Bloqueado | La prueba con modelo mock pasa; falta probar ese rechazo con el agente real desplegado. |
| 3.3 | Scheduler intenta enviar y Telegram falla. | El reminder queda `failed`, no `sent`; el detalle técnico queda solo en logs. | P1 + P4 | 🟡 Bloqueado | La lógica y sus tests pasan con el repositorio integrado; falta prueba end-to-end controlada. |
| 3.4 | Llamada al scheduler sin `CRON_SECRET`. | Devuelve `401` y no procesa reminders. | P4 + P5 | 🟢 Pasó | Request local sin header devolvió `401`; la ruta no procesa nada antes de validar. |
| 3.5 | Revisión de repo y demo. | No hay `.env`, tokens, IDs privados ni trazas sensibles en Git, capturas o video. | P5 | 🟡 Bloqueado | El escaneo estático del árbol integrado no detectó patrones obvios y `.env` no está trackeado; faltan revisión del historial, capturas y video de demo. |

## Criterio para code freeze

Solo se entra en code freeze cuando 2.1–2.5 están `🟢 Pasó`, 3.1 y 3.2 pasan,
y hay al menos una evidencia de recuperación o error controlado (3.3 o 3.4).
Después: **bug → fix → repetir la prueba afectada → demo**. No se agregan
features nuevas.
