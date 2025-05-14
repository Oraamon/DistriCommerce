#!/bin/bash

echo "Verificando se containers antigos estão rodando..."
docker compose down

echo "Removendo volumes antigos..."
docker volume prune -f

echo "Construindo containers de desenvolvimento..."
docker compose build

echo "Iniciando ambiente de desenvolvimento com hot-reload..."
docker compose up -d

echo "Verificando logs iniciais para garantir que tudo está funcionando..."
sleep 5
docker compose logs backend | tail -n 20

echo ""
echo "Ambiente de desenvolvimento iniciado!"
echo "- Frontend disponível em: http://localhost:3000"
echo "- Backend disponível em: http://localhost:8080"
echo "- Console H2 (banco de dados): http://localhost:8080/h2-console"
echo ""
echo "Mostrando logs (Ctrl+C para sair sem parar os containers):"
docker compose logs -f

echo ""
echo "Para parar o ambiente: docker compose down" 