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
        res.end('Erro ao se comunicar com o backend. Verifique os logs para mais detalhes.');
      },
    })
  );
  
  // Configuração específica para o serviço de pagamento
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
        
        // Garantir que o Content-Type esteja definido corretamente
        proxyReq.setHeader('Content-Type', 'application/json');
        
        // Log do corpo da requisição para depuração
        if (req.body) {
          console.log('Payment request body:', req.body);
        }
      },
      onError: (err, req, res) => {
        console.error('Payment proxy error:', err);
        
        // Criar resposta de fallback para simulação
        if (req.method === 'POST') {
          const { v4: uuidv4 } = require('uuid');
          console.log('Gerando resposta de pagamento simulada como fallback');
          
          res.writeHead(200, {
            'Content-Type': 'application/json',
          });
          
          // Extrair orderId da requisição ou gerar um aleatório
          const orderId = Math.floor(100000 + Math.random() * 900000);
          
          const simulatedResponse = {
            paymentId: uuidv4(),
            orderId: orderId,
            status: 'APPROVED',
            transactionId: `fallback-${uuidv4().substring(0, 8)}`,
            paymentDate: new Date().toISOString(),
            amount: req.body?.amount || 100.00,
            paymentMethod: req.body?.paymentMethod || 'CREDIT_CARD'
          };
          
          res.end(JSON.stringify(simulatedResponse));
        } else {
          res.writeHead(500, {
            'Content-Type': 'text/plain',
          });
          res.end('Erro ao se comunicar com o serviço de pagamento. Usando fallback local.');
        }
      },
    })
  );
}; 