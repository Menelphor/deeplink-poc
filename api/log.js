export default async function handler(request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    let body = {};
    try {
        body = await request.json();
    } catch (_) {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { level = 'info', event, data } = body;

    const entry = {
        timestamp: new Date().toISOString(),
        level,
        event,
        data,
        userAgent: request.headers.get('user-agent') || null,
        ip: request.headers.get('x-forwarded-for') || null,
    };

    if (level === 'error') {
        console.error('[deeplink]', JSON.stringify(entry));
    } else if (level === 'warn') {
        console.warn('[deeplink]', JSON.stringify(entry));
    } else {
        console.log('[deeplink]', JSON.stringify(entry));
    }

    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
