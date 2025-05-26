# E-commerce Microservices

Sistema de E-commerce distribuído utilizando uma arquitetura de microserviços em Spring Boot e Python.

## Arquitetura

O sistema é composto pelos seguintes serviços:

1. **API Gateway (Spring Cloud Gateway)**: Roteamento e balanceamento de carga
2. **Serviço de Produtos (Spring Boot + MongoDB)**: CRUD de produtos, busca e catálogo
3. **Serviço de Pedidos (Spring Boot + PostgreSQL)**: Processamento de pedidos e histórico
4. **Serviço de Pagamentos (Spring Boot + RabbitMQ)**: Integração com gateways de pagamento (assíncrono)
5. **Serviço de Carrinho (Spring Boot + PostgreSQL + RabbitMQ)**: Gerenciamento de carrinho de compras
6. **Serviço de Usuários (Spring Boot + JWT)**: Autenticação e perfil do cliente
7. **Serviço de Notificações (Spring Boot + RabbitMQ)**: Sistema de notificações
8. **Serviço de Recomendações (gRPC + ML (Python))**: Sistema de recomendação em tempo real
9. **Servidor Eureka**: Discovery Server para registro e descoberta de serviços

## Tecnologias Utilizadas

- **Spring Boot**: Framework para desenvolvimento de aplicações Java
- **Spring Cloud Gateway**: API Gateway para roteamento de requisições
- **Spring Cloud Netflix Eureka**: Descoberta de serviços
- **Spring Data JPA/MongoDB**: Persistência de dados
- **Spring Security + JWT**: Autenticação e autorização
- **RabbitMQ**: Comunicação assíncrona entre serviços
- **PostgreSQL**: Banco de dados relacional
- **MongoDB**: Banco de dados NoSQL
- **gRPC**: Framework para comunicação entre serviços
- **Python/scikit-learn**: Algoritmos de machine learning para recomendações
- **Prometheus**: Monitoramento e métricas
- **Grafana**: Visualização de métricas

## Requisitos

- Docker e Docker Compose
- JDK 17
- Maven
- Python 3.10 (para o serviço de recomendações)

## Como executar o projeto

### Pré-requisitos

- Docker e Docker Compose instalados
- Git

### Passos para execução

1. Clone o repositório:
   ```bash
   git clone [URL_DO_REPOSITÓRIO]
   cd Ecomerce
   ```

2. Execute o script de inicialização:
   ```bash
   chmod +x start-services.sh
   ./start-services.sh
   ```

   Ou execute diretamente com Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. Aguarde todos os serviços iniciarem (pode levar alguns minutos)

### Serviços e portas

| Serviço               | Porta  | Descrição                                 |
|-----------------------|--------|-------------------------------------------|
| Frontend              | 3000   | Interface de usuário React                |
| Backend Dev           | 8080   | Backend Spring Boot (desenvolvimento)    |
| Gateway API           | 8090   | Spring Cloud Gateway                      |
| Eureka Server         | 8761   | Registro e descoberta de serviços         |
| Serviço de Produtos   | 8081   | Catálogo e gerenciamento de produtos      |
| Serviço de Pedidos    | 8082   | Processamento e histórico de pedidos      |
| Serviço de Pagamentos | 8083   | Processamento de pagamentos               |
| Serviço de Carrinho   | 8084   | Gerenciamento de carrinho de compras      |
| Serviço de Usuários   | 8085   | Autenticação e gerenciamento de usuários  |
| Serviço de Notificações | 8086 | Sistema de notificações                   |
| Serviço Recomendações | 50051  | Sistema de recomendação com gRPC          |
| PostgreSQL            | 5432   | Banco de dados relacional                 |
| MongoDB               | 27017  | Banco de dados NoSQL                      |
| RabbitMQ              | 5672   | Mensageria (15672 para interface admin)   |
| Prometheus            | 9090   | Monitoramento e métricas                  |
| Grafana               | 3001   | Visualização de métricas                  |

### Parar os serviços

Para parar todos os serviços:

```bash
docker-compose down
```

Para parar e remover volumes (isso vai apagar todos os dados):

```bash
docker-compose down -v
```

## Endpoints Disponíveis

### Produtos (via API Gateway)

- `GET /api/products` - Lista todos os produtos
- `GET /api/products/{id}` - Obtém um produto por ID
- `GET /api/products/search?query=...` - Busca produtos por nome
- `GET /api/products/category/{category}` - Lista produtos por categoria
- `POST /api/products` - Cria um novo produto
- `PUT /api/products/{id}` - Atualiza um produto
- `DELETE /api/products/{id}` - Remove um produto

### Usuários (via API Gateway)

- `POST /api/auth/register` - Cadastra um novo usuário
- `POST /api/auth/login` - Autentica um usuário e retorna o token JWT
- `GET /api/users/{id}` - Obtém dados de um usuário (requer autenticação)
- `GET /api/users/{id}/addresses` - Lista endereços de um usuário (requer autenticação)
- `POST /api/users/{id}/addresses` - Adiciona um endereço a um usuário (requer autenticação)

### Carrinho (via API Gateway)

- `GET /api/cart/{userId}` - Obtém carrinho do usuário (requer autenticação)
- `POST /api/cart/{userId}/items` - Adiciona item ao carrinho (requer autenticação)
- `PUT /api/cart/{userId}/items/{itemId}` - Atualiza quantidade do item (requer autenticação)
- `DELETE /api/cart/{userId}/items/{itemId}` - Remove item do carrinho (requer autenticação)
- `DELETE /api/cart/{userId}` - Limpa carrinho (requer autenticação)

### Pedidos (via API Gateway)

- `POST /api/orders` - Cria um novo pedido (requer autenticação)
- `GET /api/orders/{id}` - Obtém um pedido por ID (requer autenticação)
- `GET /api/orders/user/{userId}` - Lista pedidos de um usuário (requer autenticação)

### Pagamentos (via API Gateway)

- `POST /api/payments` - Processa um pagamento (requer autenticação)
- `GET /api/payments/{id}` - Obtém dados de um pagamento (requer autenticação)
- `POST /api/payments/{id}/refund` - Solicita reembolso de um pagamento (requer autenticação)

### Recomendações (via gRPC)

O serviço de recomendações é acessado via gRPC na porta 50051.

## Acesso aos Serviços

- **Frontend**: http://localhost:3000
- **Backend Dev**: http://localhost:8080 (development mode)
- **API Gateway**: http://localhost:8090
- **Eureka Server**: http://localhost:8761
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001

## Monitoramento

Todos os serviços Spring Boot expõem endpoints Actuator para monitoramento em `/actuator/health`

## Comunicação entre Serviços

- **Síncrona**: REST via API Gateway e Eureka para descoberta de serviços
- **Assíncrona**: RabbitMQ para eventos entre serviços (pagamentos, notificações, carrinho)
- **gRPC**: Serviço de recomendações para alta performance

## Bancos de Dados

- **PostgreSQL**: Usado pelos serviços de pedidos, pagamentos, carrinho, usuários e notificações
- **MongoDB**: Usado pelo serviço de produtos e recomendações

## Funcionalidades Implementadas

- ✅ Descoberta de serviços com Eureka
- ✅ API Gateway com roteamento
- ✅ Comunicação assíncrona com RabbitMQ
- ✅ Persistência em PostgreSQL e MongoDB
- ✅ Sistema de carrinho de compras
- ✅ Processamento de pedidos
- ✅ Sistema de pagamentos
- ✅ Sistema de notificações
- ✅ Monitoramento com Prometheus e Grafana
- ✅ Health checks para todos os serviços 