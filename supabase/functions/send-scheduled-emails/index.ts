// Supabase Edge Function — runs on a schedule (e.g. every 15 minutes via cron).
// Picks up outbox rows with status='queued' whose scheduled_for_iso is in the
// past, sends them via Resend, and marks them as 'sent'.
//
// Deploy: supabase functions deploy send-scheduled-emails
// Schedule: supabase functions create-cron "send-emails" "*/15 * * * *" \
//   --function-name send-scheduled-emails
//
// Required secrets (set via `supabase secrets set`):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_ADDRESS = "Blindfold <trips@blindfold.travel>";

Deno.serve(async () => {
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ skipped: "no RESEND_API_KEY" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const now = new Date().toISOString();
  const { data: due, error } = await supabase
    .from("outbox")
    .select("id, to, subject, body")
    .eq("status", "queued")
    .lte("scheduled_for_iso", now);

  if (error || !due?.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  for (const email of due) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: email.to,
          subject: email.subject,
          text: email.body,
        }),
      });
      if (res.ok) {
        await supabase.from("outbox").update({ status: "sent" }).eq("id", email.id);
        sent++;
      }
    } catch {
      // Skip and retry next run
    }
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
