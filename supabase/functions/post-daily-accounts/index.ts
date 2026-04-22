// Posts confirmed+paid bookings to accounts at end of day (runs nightly via pg_cron at 00:00 UTC).
// Stamps `posted_to_accounts_on` so the accountant view only sees them after midnight.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Yesterday's date (UTC) — anything confirmed+paid before today midnight gets posted
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayDate = today.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('booking_groups')
    .update({ posted_to_accounts_on: todayDate })
    .eq('status', 'confirmed')
    .not('paid_at', 'is', null)
    .is('posted_to_accounts_on', null)
    .lt('paid_at', today.toISOString())
    .select('id, voucher_no, grand_total');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ posted: data?.length ?? 0, vouchers: data?.map((d) => d.voucher_no) ?? [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
