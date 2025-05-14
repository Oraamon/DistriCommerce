#!/bin/bash

# Função para exibir a ajuda
show_help() {
    echo "Uso: $0 [opções]"
    echo ""
    echo "Inicia os serviços do E-commerce em containers Docker."
    echo ""
    echo "Opções:"
    echo "  -h, --help        Mostra esta mensagem de ajuda"
    echo "  -d, --dev         Inicia em modo de desenvolvimento (com volumes mapeados)"
    echo "  -p, --prod        Inicia em modo de produção"
    echo "  -r, --rebuild     Reconstrói as imagens antes de iniciar os serviços"
    echo "  -c, --clean       Remove containers, volumes e redes antes de iniciar"
    echo ""
    echo "Exemplos:"
    echo "  $0 -d             Inicia em modo de desenvolvimento"
    echo "  $0 -p -r          Inicia em modo de produção reconstruindo imagens"
    echo "  $0 -c -d          Limpa ambiente e inicia em modo de desenvolvimento"
}

# Valores padrão
MODE="dev"
REBUILD=false
CLEAN=false

# Processa parâmetros da linha de comando
while [ "$1" != "" ]; do
    case $1 in
        -h | --help )    show_help
                         exit 0
                         ;;
        -d | --dev )     MODE="dev"
                         ;;
        -p | --prod )    MODE="prod"
                         ;;
        -r | --rebuild ) REBUILD=true
                         ;;
        -c | --clean )   CLEAN=true
                         ;;
        * )              echo "Opção desconhecida: $1"
                         show_help
                         exit 1
    esac
    shift
done

# Se modo de limpeza foi solicitado
if [ "$CLEAN" = true ]; then
    echo "🧹 Limpando ambiente Docker..."
    docker-compose down -v
    echo "✅ Ambiente limpo!"
fi

# Comandos para iniciar os serviços
if [ "$MODE" = "dev" ]; then
    echo "🚀 Iniciando serviços em modo de desenvolvimento..."
    if [ "$REBUILD" = true ]; then
        docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d --build
    else
        docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
    fi
else
    echo "🚀 Iniciando serviços em modo de produção..."
    if [ "$REBUILD" = true ]; then
        docker-compose up -d --build
    else
        docker-compose up -d
    fi
fi

echo "✅ Serviços iniciados!"
echo ""
echo "Acessos:"
echo "🌐 Frontend:           http://localhost:3000"
echo "🌐 API Gateway:        http://localhost:8090"
echo "🌐 Eureka:             http://localhost:8761"
echo "🌐 RabbitMQ Admin:     http://localhost:15672 (guest/guest)"
echo "🌐 Prometheus:         http://localhost:9090"
echo "🌐 Grafana:            http://localhost:3001"

# Verifica se os serviços estão prontos
echo ""
echo "⏳ Verificando saúde dos serviços (pode levar alguns minutos)..."

wait_for_service() {
    SERVICE=$1
    URL=$2
    MAX_RETRIES=30
    RETRY=0
    
    while [ $RETRY -lt $MAX_RETRIES ]; do
        STATUS=$(curl -s -o /dev/null -w '%{http_code}' $URL || echo "000")
        
        if [ "$STATUS" = "200" ]; then
            echo "✅ $SERVICE está pronto!"
            return 0
        fi
        
        RETRY=$((RETRY+1))
        echo "⏳ Aguardando $SERVICE... ($RETRY/$MAX_RETRIES)"
        sleep 5
    done
    
    echo "❌ $SERVICE não está respondendo após $MAX_RETRIES tentativas."
    return 1
}

wait_for_service "Eureka Server" "http://localhost:8761/actuator/health"
wait_for_service "API Gateway" "http://localhost:8090/actuator/health"
wait_for_service "Product Service" "http://localhost:8081/actuator/health"
wait_for_service "Order Service" "http://localhost:8082/actuator/health"
wait_for_service "Payment Service" "http://localhost:8083/actuator/health"
wait_for_service "Frontend" "http://localhost:3000"

echo ""
echo "✨ Sistema E-commerce pronto para uso!" 