#!/bin/bash

echo "🧪 Executando Testes de Carga do E-commerce..."

# Verificar se Artillery está instalado
if ! command -v artillery &> /dev/null; then
    echo "📦 Instalando Artillery..."
    cd load-tests
    npm install
    cd ..
fi

# Verificar se os serviços estão rodando
echo "🔍 Verificando se os serviços estão rodando..."

services=("8081" "8082" "8083" "8084")
service_names=("Product Service" "Order Service" "Payment Service" "Notification Service")

for i in "${!services[@]}"; do
    port=${services[$i]}
    name=${service_names[$i]}
    
    if curl -f http://localhost:$port/actuator/health > /dev/null 2>&1; then
        echo "✅ $name está rodando na porta $port"
    else
        echo "❌ $name não está respondendo na porta $port"
        echo "🚀 Iniciando serviços com Docker Compose..."
        docker-compose up -d
        echo "⏳ Aguardando serviços iniciarem..."
        sleep 60
        break
    fi
done

cd load-tests

echo "🎯 Executando teste de carga do Product Service..."
npm run test:product

echo "💳 Executando teste de carga do Payment Service..."
npm run test:payment

echo "📦 Executando teste de carga do Order Service..."
npm run test:order

echo "🔥 Executando teste de estresse..."
npm run test:stress

echo "📊 Gerando relatório consolidado..."
echo "=== RELATÓRIO DE TESTES DE CARGA ===" > load-test-report.txt
echo "Data: $(date)" >> load-test-report.txt
echo "Serviços testados: Product, Payment, Order, Notification" >> load-test-report.txt
echo "Tipos de teste: Carga normal e Teste de estresse" >> load-test-report.txt
echo "========================================" >> load-test-report.txt

echo "✅ Testes de carga concluídos!"
echo "📄 Relatório salvo em: load-tests/load-test-report.txt"
echo "📈 Verifique as métricas no Grafana: http://localhost:3001" 