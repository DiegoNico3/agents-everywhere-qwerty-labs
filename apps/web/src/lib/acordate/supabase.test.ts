import assert from "node:assert/strict";
import test from "node:test";
import { AcordateSupabaseStore } from "./supabase";

test("createReminder mirrors scheduled_at into legacy start_at", async () => {
  let payload: Record<string, unknown> | undefined;
  const scheduledAt = "2026-09-12T19:00:00.000Z";
  const store = new AcordateSupabaseStore(
    { restUrl: "https://example.supabase.co/rest/v1", serviceRoleKey: "service-key" },
    async (_input, init) => {
      payload = JSON.parse(String(init?.body));
      return Response.json([{
        id: "44444444-4444-4444-4444-444444444444",
        user_id: "11111111-1111-1111-1111-111111111111",
        title: "Revisar integración",
        scheduled_at: scheduledAt,
        status: "pending",
        context: "Confirmar la prueba.",
        source_memory_ids: ["22222222-2222-2222-2222-222222222222"],
        sent_at: null,
        completed_at: null,
        created_at: "2026-09-12T18:00:00.000Z",
      }]);
    },
  );

  const reminder = await store.createReminder({
    userId: "11111111-1111-1111-1111-111111111111",
    title: "Revisar integración",
    scheduledAt,
    context: "Confirmar la prueba.",
    sourceMemoryIds: ["22222222-2222-2222-2222-222222222222"],
    sourceMessageId: "telegram-1",
  });

  assert.equal(payload?.scheduled_at, scheduledAt);
  assert.equal(payload?.start_at, scheduledAt);
  assert.equal(reminder.status, "pending");
});
