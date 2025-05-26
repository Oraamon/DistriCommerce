#!/bin/bash

echo "🔄 Reiniciando serviços de notificação..."

echo "📦 Parando serviços..."
docker-compose stop notification-service payment-service order-service

echo "🏗️ Reconstruindo imagens..."
docker-compose build notification-service payment-service order-service

echo "🚀 Iniciando serviços..."
docker-compose up -d notification-service payment-service order-service

echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

echo "📊 Verificando status dos serviços..."
docker-compose ps notification-service payment-service order-service

echo "📋 Logs dos serviços (últimas 20 linhas):"
echo "=== NOTIFICATION SERVICE ==="
docker-compose logs --tail=20 notification-service

echo "=== PAYMENT SERVICE ==="
docker-compose logs --tail=20 payment-service

echo "=== ORDER SERVICE ==="
docker-compose logs --tail=20 order-service

echo "✅ Reinicialização concluída!"
echo "🔗 Para testar as notificações:"
echo "   1. Acesse o frontend: http://localhost:3000"
echo "   2. Realize um pagamento"
echo "   3. Verifique as notificações em: http://localhost:8086/api/notifications/user/1"
echo "   4. Monitore os logs: docker-compose logs -f notification-service" 