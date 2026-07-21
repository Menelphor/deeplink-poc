export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { level = 'info', event, data } = req.body || {};

    const entry = {
        timestamp: new Date().toISOString(),
        level,
        event,
        data,
        userAgent: req.headers['user-agent'] || null,
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    };

    if (level === 'error') {
        console.error('[deeplink]', JSON.stringify(entry));
    } else if (level === 'warn') {
        console.warn('[deeplink]', JSON.stringify(entry));
    } else {
        console.log('[deeplink]', JSON.stringify(entry));
    }

    return res.status(200).json({ ok: true });
}
