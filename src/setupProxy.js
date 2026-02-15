const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://localhost:5000',
            changeOrigin: true,
            // Optional: Log proxy requests for debugging
            onProxyReq: (proxyReq, req, res) => {
                // console.log('[Proxy] Request:', req.method, req.url);
            },
            onError: (err, req, res) => {
                console.error('[Proxy] Error:', err);
            }
        })
    );

    // Also proxy /proxy-image if needed
    app.use(
        '/proxy-image',
        createProxyMiddleware({
            target: 'http://localhost:5000',
            changeOrigin: true,
        })
    );
};
