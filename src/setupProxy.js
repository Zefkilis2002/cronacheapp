const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://localhost:5000',
            changeOrigin: true,
            pathRewrite: {
                // Manteniamo /api, quindi non serve riscrivere nulla se il backend si aspetta /api/...
                // Se il backend si aspettasse solo /generate-bio invece di /api/generate-bio, dovremmo usare '^/api': ''
            },
        })
    );

    app.use(
        '/proxy-image',
        createProxyMiddleware({
            target: 'http://localhost:5000',
            changeOrigin: true,
        })
    );
};
