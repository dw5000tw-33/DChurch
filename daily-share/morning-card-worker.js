const rosterOrigin = 'https://thll-priest-roster.dw5000-tw.workers.dev';
const headers = {
  'Access-Control-Allow-Origin': 'https://dw5000tw-33.github.io',
  'Cache-Control': 'no-store',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/date') return new Response(null, { status: 404 });
    if (request.method !== 'GET') return new Response(null, { status: 405, headers });
    const date = url.searchParams.get('date') || '';
    const parsed = new Date(date + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== date) {
      return Response.json({ error: 'Invalid date' }, { status: 400, headers });
    }
    try {
      const image = await env.MORNING_DB.prepare(`
        SELECT i.id
        FROM morning_card_settings s
        JOIN morning_month_days d ON d.schedule_set_id = s.active_schedule_set_id
        JOIN morning_images i ON i.id = d.image_id
        WHERE s.id = 1 AND d.month_day = ? AND i.active = 1 AND i.deleted_at IS NULL
      `).bind(date.slice(5)).first();
      return Response.json({
        date,
        imageUrl: image ? rosterOrigin + '/morning-library-images/' + image.id : null,
      }, { headers });
    } catch (error) {
      console.error('Morning card lookup failed', error);
      return Response.json({ error: 'Morning card lookup failed' }, { status: 503, headers });
    }
  },
};
