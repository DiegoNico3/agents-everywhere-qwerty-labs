# ACORDATE — Estado de integración

Actualiza este tablero cada 20–30 minutos y antes de cada integración. La
persona 5 es dueña del documento; cada responsable actualiza su propia fila.

## Leyenda

| Estado | Uso |
| --- | --- |
| `⬜ No iniciado` | No hay trabajo integrado todavía. |
| `🟡 En curso` | Se está construyendo; aún no cumple el criterio de salida. |
| `🟢 Integrado` | Está en la rama de integración y pasó su prueba acordada. |
| `🔴 Bloqueado` | Requiere una decisión, credencial o corrección externa. |

## Snapshot de auditoría — 2026-09-12

Corrección realizada sobre `origin/main@414e66d`. El build, typecheck y suite
offline pasan; health y los controles de autenticación fueron probados
localmente. La migración 009 ya está aplicada y las columnas y RPC de Supabase
responden según el contrato. Con el modelo Gemini configurado actualmente, una
prueba autenticada guardó una memoria y creó un reminder futuro en Supabase.

| Área | Responsable | Estado | Criterio para declarar “integrado” | Dependencia / bloqueo | Evidencia |
| --- | --- | --- | --- | --- | --- |
| Contratos de integración | P5 | 🟡 En curso | Documento aceptado por P1–P4. | Código y SQL unificados; falta registrar la aceptación explícita. | `acordate-contracts.md`; tests P2/P4. |
| Configuración segura | P5 | 🟡 En curso | Variables cargadas localmente y en deploy, sin secretos en Git. | Variables locales, `CRON_SECRET` y modo seco configurados; falta cargar secretos en Vercel. | `.env.example`; chequeo de Git. |
| Telegram y webhook | P1 | 🟡 En curso | Mensaje real entra y recibe respuesta; secreto inválido devuelve `401`. | El webhook autenticado crea el usuario y devuelve respuesta de agente en modo seco; falta URL HTTPS de Telegram. | Request local `401`; prueba E2E `200`. |
| Agente y tools | P2 | 🟡 En curso | Las cuatro tools siguen los contratos y manejan datos faltantes. | Gemini guarda memoria y crea reminder en la prueba real; falta demostrar búsqueda y completado con datos reales. | `npm run verify`; prueba E2E en modo seco. |
| Usuarios y memoria | P3 | 🟡 En curso | Guarda y busca sin filtrar datos entre usuarios. | Esquema, RPC y una memoria real verificados; falta prueba real de aislamiento entre dos usuarios. | Búsqueda de prueba `200`, `1` resultado, máximo `3`. |
| Reminders y scheduler | P4 | 🟡 En curso | Crea, envía una vez y completa un reminder. | El insert canónico también escribe `start_at` requerido por el esquema heredado; faltan entrega y cron desplegado. | Reminder real `pending`, futuro y con contexto; tests del scheduler. |
| Deploy / health | P5 | 🟡 En curso | URL HTTPS responde `GET /api/health`. | Ruta local aprobada; falta URL HTTPS/deploy. | `GET /api/health` local `200`. |
| Demo end-to-end | P5 | 🔴 Bloqueado | Checklist 2.1–2.5 aprobado. | Pendiente desplegar, configurar cron/webhook HTTPS y probar entrega/completado. | `acordate-qa-checklist.md`. |

## Registro de integración

Agregar una fila por intento; no borrar fallos. Esto evita que el equipo repita
diagnósticos ya realizados.

| Hora | Integración probada | Resultado | Próximo paso | Dueño |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |
| 2026-09-12 | Auditoría del primer corte sobre `origin/main@414e66d` | No aprobado: faltan health, rutas de scheduler y adaptadores; `npm ci` no instala por lockfile desactualizado. | Reparar primero lockfile y contratos, luego repetir 0.6 y 1.1–1.8 con evidencia. | P5 + P1–P4 |
| 2026-09-12 | Corrección de integración local | `npm run verify` pasó; health `200`, webhook sin secreto `401`, update autenticado ignorado `200`, scheduler sin secreto `401`. | Aplicar `supabase/009_acordate_contract_alignment.sql`, configurar cron y repetir la demo real. | P5 + P3 + P4 |
| 2026-09-12 | Migración y webhook con dependencias reales | Supabase expone las columnas y RPC de 009 (`200`); el webhook autenticado crea el usuario de prueba y alcanza Gemini. Gemini responde `429` por cuota diaria agotada; Telegram permanece en modo seco. | Habilitar cuota/clave de IA, desplegar y configurar webhook+cron HTTPS. | P5 + P2 + P3 |
| 2026-09-12 | Agente real con modelo alternativo | El webhook en modo seco guardó una memoria y creó un reminder `pending` futuro; se corrigió el adaptador para incluir `start_at` heredado. | Desplegar y probar scheduler/“Hecho” en URL HTTPS. | P5 + P1–P4 |

## Bloqueos que requieren decisión inmediata

| Bloqueo | Impacto | Dueño para resolver | Decisión / fecha |
| --- | --- | --- | --- |
| No hay proyecto/deploy de Vercel para Acordate. | No existe URL HTTPS para Telegram ni cron. | Equipo + P5 | Importar el repositorio, cargar variables de servidor y desplegar la rama elegida. |
