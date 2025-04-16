#!/bin/bash

echo "Parando os contêineres..."
docker-compose down

echo "Reconstruindo as imagens..."
docker-compose build --no-cache

echo "Iniciando os contêineres..."
docker-compose up -d

echo "Processo concluído! Acesse http://localhost para visualizar a aplicação." 