# E-commerce Microservices

Sistema de E-commerce distribuído utilizando uma arquitetura de microserviços em Spring Boot e Python.

## Arquitetura

O sistema é composto pelos seguintes serviços:

1. **API Gateway (Spring Cloud Gateway)**: Roteamento e balanceamento de carga
2. **Serviço de Produtos (Spring Boot + MongoDB)**: CRUD de produtos, busca e catálogo
3. **Serviço de Pedidos (Spring Boot + PostgreSQL)**: Processamento de pedidos e histórico
4. **Serviço de Pagamentos (Spring Boot + RabbitMQ)**: Integração com gateways de pagamento (assíncrono)
5. **Serviço de Usuários (Spring Boot + JWT)**: Autenticação e perfil do cliente
6. **Serviço de Recomendações (gRPC + ML (Python))**: Sistema de recomendação em tempo real
7. **Servidor Eureka**: Discovery Server para registro e descoberta de serviços

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

## Requisitos

- Docker e Docker Compose
- JDK 17
- Maven ou Gradle
- Python 3.10 (para o serviço de recomendações)

## Como executar o projeto completo

Este projeto de e-commerce é composto por múltiplos microserviços e um frontend React.

### Pré-requisitos

- Docker e Docker Compose instalados
- Git

### Passos para execução

1. Clone o repositório:
   ```bash
   git clone [URL_DO_REPOSITÓRIO]
   cd Ecomerce
   ```

2. Execute o Docker Compose:
   ```bash
   docker-compose up -d
   ```

   Este comando irá construir e iniciar todos os serviços:
   - Frontend (http://localhost)
   - Gateway API (http://localhost:8080)
   - Eureka Server (http://localhost:8761)
   - Serviço de Produtos
   - Serviço de Pedidos
   - Serviço de Pagamentos
   - Serviço de Usuários
   - Serviço de Recomendações
   - MongoDB
   - PostgreSQL
   - RabbitMQ

3. Acesse o aplicativo no navegador:
   ```
   http://localhost
   ```

### Para ambiente de desenvolvimento

Para executar o sistema em modo de desenvolvimento:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Serviços e portas

| Serviço               | Porta  | Descrição                                 |
|-----------------------|--------|-------------------------------------------|
| Frontend              | 80     | Interface de usuário em React             |
| Gateway API           | 8080   | Spring Cloud Gateway                      |
| Eureka Server         | 8761   | Registro e descoberta de serviços         |
| Serviço de Produtos   | 8081   | Catálogo e gerenciamento de produtos      |
| Serviço de Pedidos    | 8082   | Processamento e histórico de pedidos      |
| Serviço de Pagamentos | 8083   | Processamento de pagamentos               |
| Serviço de Usuários   | 8084   | Autenticação e gerenciamento de usuários  |
| Serviço Recomendações | 50051  | Sistema de recomendação com gRPC          |
| PostgreSQL            | 5432   | Banco de dados relacional                 |
| MongoDB               | 27017  | Banco de dados NoSQL                      |
| RabbitMQ              | 5672   | Mensageria (15672 para interface admin)   |

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

## Serviços Independentes

Cada serviço também pode ser acessado diretamente:

- API Gateway: http://localhost:8080
- Eureka Server: http://localhost:8761
- Serviço de Produtos: http://localhost:8081
- Serviço de Pedidos: http://localhost:8082
- Serviço de Pagamentos: http://localhost:8083
- Serviço de Usuários: http://localhost:8084
- Serviço de Recomendações (gRPC): localhost:50051
- RabbitMQ Management: http://localhost:15672 (guest/guest)

## Monitoramento

Todos os serviços expõem endpoints Actuator para monitoramento em `/actuator` 