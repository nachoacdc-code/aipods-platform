import type { APIRoute } from 'astro';
import { hasSessionCookie } from '../../../lib/auth';
import { getSupabaseServiceClient, isSupabaseConfigured } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request, url }) => {
  if (!hasSessionCookie(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ reports: [], configured: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = getSupabaseServiceClient();
  const reportType = url.searchParams.get('type'); // 'weekly' or 'daily'
  const limit = parseInt(url.searchParams.get('limit') ?? '10', 10);

  let query = supabase
    .from('ceo_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (reportType) {
    query = query.eq('report_type', reportType);
  }

  const { data } = await query;

  return new Response(JSON.stringify({ reports: data ?? [], configured: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
