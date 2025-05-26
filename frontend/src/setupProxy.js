const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('Configurando proxy para /api -> http://gateway-service:8080/api');
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://gateway-service:8080',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req) => {
        console.log(`Proxying ${req.method} request:`, req.url);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('Erro ao se comunicar com o backend.');
      },
    })
  );
  
  app.use(
    '/payments',
    createProxyMiddleware({
      target: 'http://payment-service:8083/api/payments',
      changeOrigin: true,
      secure: false,
      pathRewrite: {'^/payments': ''},
      logLevel: 'debug',
      onProxyReq: (proxyReq, req) => {
        console.log(`Proxying payment ${req.method} request:`, req.url);
        proxyReq.setHeader('Content-Type', 'application/json');
      },
      onError: (err, req, res) => {
        console.error('Payment proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('Erro ao se comunicar com o serviço de pagamento.');
      },
    })
  );
}; 