#!/bin/bash

echo "Verificando se containers antigos estão rodando..."
docker-compose -f docker-compose.dev.yml down

echo "Removendo volumes antigos..."
docker volume rm ecomerce_gradle-cache 2>/dev/null || true

echo "Construindo containers de desenvolvimento..."
docker-compose -f docker-compose.dev.yml build --no-cache

echo "Iniciando ambiente de desenvolvimento com hot-reload..."
docker-compose -f docker-compose.dev.yml up -d

echo "Verificando logs iniciais para garantir que tudo está funcionando..."
sleep 5
docker-compose -f docker-compose.dev.yml logs backend | tail -n 20

echo ""
echo "Ambiente de desenvolvimento iniciado!"
echo "- Frontend disponível em: http://localhost:3000"
echo "- Backend disponível em: http://localhost:8080"
echo "- Console H2 (banco de dados): http://localhost:8080/h2-console"
echo ""
echo "Mostrando logs (Ctrl+C para sair sem parar os containers):"
docker-compose -f docker-compose.dev.yml logs -f

echo ""
echo "Para parar o ambiente: docker-compose -f docker-compose.dev.yml down" 