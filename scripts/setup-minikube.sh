#!/bin/bash

echo "🚀 Configurando Minikube para o projeto E-commerce..."

# Verificar se minikube está instalado
if ! command -v minikube &> /dev/null; then
    echo "❌ Minikube não está instalado. Por favor, instale o Minikube primeiro."
    exit 1
fi

# Verificar se kubectl está instalado
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl não está instalado. Por favor, instale o kubectl primeiro."
    exit 1
fi

# Iniciar minikube com configurações adequadas
echo "🔧 Iniciando Minikube..."
minikube start --memory=8192 --cpus=4 --disk-size=20g --driver=docker

# Habilitar addons necessários
echo "📦 Habilitando addons..."
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard

# Configurar Docker para usar o registry do Minikube
echo "🐳 Configurando Docker registry..."
eval $(minikube docker-env)

# Criar namespace
echo "📁 Criando namespace..."
kubectl apply -f ../k8s/namespace.yml

# Aplicar configurações de infraestrutura
echo "🗄️ Aplicando configurações de banco de dados..."
kubectl apply -f ../k8s/postgres.yml

# Aguardar postgres estar pronto
echo "⏳ Aguardando PostgreSQL estar pronto..."
kubectl wait --for=condition=ready pod -l app=postgres -n ecommerce --timeout=300s

# Build das imagens Docker no contexto do Minikube
echo "🏗️ Construindo imagens Docker..."
cd ..
docker-compose build

# Aplicar configurações dos microserviços
echo "🚀 Aplicando configurações dos microserviços..."
kubectl apply -f k8s/payment-service.yml

# Verificar status dos pods
echo "📊 Verificando status dos pods..."
kubectl get pods -n ecommerce

# Configurar port-forward para acesso local
echo "🌐 Configurando port-forward..."
kubectl port-forward -n ecommerce service/payment-service 8083:8083 &

echo "✅ Configuração do Minikube concluída!"
echo "🎯 Acesse o dashboard do Minikube com: minikube dashboard"
echo "📊 Acesse o Prometheus em: http://localhost:9090"
echo "📈 Acesse o Grafana em: http://localhost:3001 (admin/admin)"
echo "💳 Acesse o Payment Service em: http://localhost:8083" 