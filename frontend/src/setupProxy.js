const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('Configurando proxy para /api -> http://backend:8080/api');
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://backend:8080',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api',
      },
      onProxyReq: (proxyReq, req) => {
        console.log(`Proxying ${req.method} request:`, req.url);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('Erro ao se comunicar com o backend. Verifique os logs para mais detalhes.');
      },
    })
  );
}; 