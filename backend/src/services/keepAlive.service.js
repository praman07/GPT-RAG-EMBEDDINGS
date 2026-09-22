/**
 * Lightweight, zero-impact KeepAlive service to prevent backend free tier (Render/Railway/Koyeb)
 * from spinning down into cold sleep after inactivity.
 */

export const startKeepAliveService = () => {
    // Detect public service URL (Render automatically sets RENDER_EXTERNAL_URL)
    const publicUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL || process.env.CLIENT_URL || '';
    
    if (!publicUrl || publicUrl.includes('localhost') || publicUrl.includes('127.0.0.1')) {
        return;
    }

    const healthUrl = `${publicUrl.replace(/\/$/, '')}/api/health`;
    console.log(`[KeepAlive] Service initialized. Heartbeat ping enabled for ${healthUrl}`);

    // Ping every 14 minutes (Render puts free services to sleep after 15 minutes of inactivity)
    const FOURTEEN_MINUTES_MS = 14 * 60 * 1000;

    setInterval(async () => {
        try {
            const response = await fetch(healthUrl);
            if (response.ok) {
                console.log(`[KeepAlive] Heartbeat ping successful at ${new Date().toISOString()}`);
            }
        } catch (err) {
            console.warn(`[KeepAlive] Heartbeat ping notice:`, err.message);
        }
    }, FOURTEEN_MINUTES_MS);
};
