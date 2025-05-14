#!/bin/bash

# Cores para melhor visualização
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando testes do serviço de pedidos...${NC}"

# 1. Testar endpoint de saúde
echo -e "\n${YELLOW}1. Testando endpoint de saúde...${NC}"
HEALTH_RESPONSE=$(curl -s -X GET http://localhost:8082/api/orders/test)
echo "Resposta: $HEALTH_RESPONSE"

if [[ $HEALTH_RESPONSE == *"success"* ]]; then
  echo -e "${GREEN}✓ Endpoint de saúde funcionando corretamente!${NC}"
else
  echo -e "${RED}✗ Endpoint de saúde não está respondendo corretamente!${NC}"
  exit 1
fi

# 2. Criar um novo pedido usando o endpoint simplificado
echo -e "\n${YELLOW}2. Criando um novo pedido...${NC}"
ORDER_RESPONSE=$(curl -s -X POST http://localhost:8082/api/orders/simple -H "Content-Type: application/json" -d '{
  "userId": "test-user-'$(date +%s)'",
  "deliveryAddress": "Rua de Teste, 123",
  "paymentMethod": "CREDIT_CARD",
  "items": [
    {
      "productId": "test-product-'$(date +%s)'",
      "quantity": 2
    }
  ]
}')

echo "Resposta: $ORDER_RESPONSE"

# Extrair ID do pedido
ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [[ ! -z "$ORDER_ID" ]]; then
  echo -e "${GREEN}✓ Pedido criado com sucesso! ID: $ORDER_ID${NC}"
else
  echo -e "${RED}✗ Falha ao criar pedido!${NC}"
  exit 1
fi

# 3. Obter pedido pelo ID
echo -e "\n${YELLOW}3. Buscando pedido pelo ID $ORDER_ID...${NC}"
GET_ORDER_RESPONSE=$(curl -s -X GET http://localhost:8082/api/orders/$ORDER_ID)
echo "Resposta: $GET_ORDER_RESPONSE"

if [[ $GET_ORDER_RESPONSE == *"$ORDER_ID"* ]]; then
  echo -e "${GREEN}✓ Pedido encontrado com sucesso!${NC}"
else
  echo -e "${RED}✗ Falha ao buscar pedido pelo ID!${NC}"
  exit 1
fi

# 4. Atualizar status do pedido
echo -e "\n${YELLOW}4. Atualizando status do pedido para CONFIRMED...${NC}"
UPDATE_STATUS_RESPONSE=$(curl -s -X PUT "http://localhost:8082/api/orders/$ORDER_ID/status?status=CONFIRMED")
echo "Resposta: $UPDATE_STATUS_RESPONSE"

if [[ $UPDATE_STATUS_RESPONSE == *"CONFIRMED"* ]]; then
  echo -e "${GREEN}✓ Status do pedido atualizado com sucesso!${NC}"
else
  echo -e "${RED}✗ Falha ao atualizar status do pedido!${NC}"
fi

# 5. Adicionar número de rastreamento
echo -e "\n${YELLOW}5. Adicionando número de rastreamento...${NC}"
TRACKING_NUMBER="TR$(date +%s)"
UPDATE_TRACKING_RESPONSE=$(curl -s -X PUT "http://localhost:8082/api/orders/$ORDER_ID/tracking?trackingNumber=$TRACKING_NUMBER")
echo "Resposta: $UPDATE_TRACKING_RESPONSE"

if [[ $UPDATE_TRACKING_RESPONSE == *"$TRACKING_NUMBER"* ]]; then
  echo -e "${GREEN}✓ Número de rastreamento adicionado com sucesso!${NC}"
else
  echo -e "${RED}✗ Falha ao adicionar número de rastreamento!${NC}"
fi

echo -e "\n${GREEN}Testes concluídos!${NC}" 