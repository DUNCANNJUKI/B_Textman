// Scheduled job (pg_cron, every minute):
// - Finds messages stuck in "processing" longer than the threshold
// - Increments retry_count; if > max_retries marks them failed; otherwise re-queues
// - Logs every action into message_events with the previous device/client so we
//   can later see which device the message was reassigned from.
import { corsHeaders, json, adminClient } from "../_shared/utils.ts";

const STUCK_AFTER_MS = 3 * 60 * 1000; // 3 minutes in "processing" = stuck

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = adminClient();
  const cutoff = new Date(Date.now() - STUCK_AFTER_MS).toISOString();

  const { data: stuck } = await sb.from("messages")
    .select("id, client_id, device_id, retry_count, max_retries, processing_at, recipient")
    .eq("status", "processing")
    .lt("processing_at", cutoff)
    .limit(500);

  const requeued: any[] = [];
  const failed: any[] = [];
  const events: any[] = [];

  for (const m of stuck ?? []) {
    const nextRetry = (m.retry_count ?? 0) + 1;
    const exhausted = nextRetry > (m.max_retries ?? 3);

    if (exhausted) {
      await sb.from("messages").update({
        status: "failed",
        failed_at: new Date().toISOString(),
        error_message: "exceeded max retries while stuck in processing",
      }).eq("id", m.id);
      failed.push(m.id);
      events.push({
        message_id: m.id,
        event_type: "requeue.failed",
        payload: {
          reason: "max_retries_exceeded",
          previous_device_id: m.device_id,
          client_id: m.client_id,
          retry_count: nextRetry,
          processing_at: m.processing_at,
        },
      });
    } else {
      await sb.from("messages").update({
        status: "queued",
        device_id: null,
        processing_at: null,
        retry_count: nextRetry,
      }).eq("id", m.id);
      requeued.push(m.id);
      events.push({
        message_id: m.id,
        event_type: "requeue.scheduled",
        payload: {
          previous_device_id: m.device_id,
          client_id: m.client_id,
          retry_count: nextRetry,
          processing_at: m.processing_at,
        },
      });
    }
  }

  if (events.length) await sb.from("message_events").insert(events);

  return json({ ok: true, scanned: stuck?.length ?? 0, requeued: requeued.length, failed: failed.length, requeued_ids: requeued, failed_ids: failed });
});
