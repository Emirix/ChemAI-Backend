const supabase = require('../config/supabase');

const auditLogger = async (req, res, next) => {
    const start = Date.now();

    // Capture the original end function to calculate duration
    const oldEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = Date.now() - start;
        res.end = oldEnd;
        res.end(chunk, encoding);

        // We only exclude the log fetching itself IF it's a GET request to avoid infinite recursion in the dashboard
        // All other requests, including health checks and POST/PUT/DELETE to admin, will be logged.
        if (req.method === 'GET' && req.url.includes('/api/admin/logs')) {
            return;
        }

        // Extract user ID from token if present (even if not verified yet by auth middleware)
        let userId = req.user?.id;
        if (!userId) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                try {
                    const token = authHeader.split(' ')[1];
                    // JWT is Header.Payload.Signature - we just need the payload
                    const payloadBase64 = token.split('.')[1];
                    if (payloadBase64) {
                        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
                        userId = payload.sub; // Supabase uses 'sub' for user ID in JWT
                    }
                } catch (e) {
                    // Ignore decoding errors
                }
            }
        }

        const logData = {
            user_id: userId,
            method: req.method,
            path: req.url,
            // Deep clone body to avoid issues, and limit size if needed
            body: req.method !== 'GET' ? JSON.parse(JSON.stringify(req.body || {})) : null,
            query_params: req.query,
            ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            user_agent: req.headers['user-agent'],
            status_code: res.statusCode,
            duration_ms: duration
        };

        // Insert into Supabase asynchronously
        supabase.from('audit_logs').insert([logData]).then(({ error }) => {
            if (error) console.error('Error saving audit log:', error);
        });
    };

    next();
};


module.exports = auditLogger;
