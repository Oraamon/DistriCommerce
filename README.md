# Projeto E-commerce

Este é um projeto de e-commerce desenvolvido com:
- **Backend**: Spring Boot
- **Frontend**: React
- **Gerenciamento de Dependências**: Gradle Wrapper
- **Containerização**: Docker

## Requisitos

- Docker
- Docker Compose

## Estrutura do Projeto

- **Backend** (Spring Boot):
  - API RESTful
  - Banco de dados H2 em memória
  - Spring Data JPA
  - Spring Security

- **Frontend** (React):
  - React 18
  - React Router 6
  - Bootstrap 5
  - Axios para requisições HTTP

## Como Executar com Docker

1. Clone o repositório
2. Na raiz do projeto, execute:

```bash
docker-compose up -d
```

Este comando irá:
1. Construir as imagens Docker para o backend e frontend
2. Iniciar os contêineres em modo detached (segundo plano)
3. Configurar a rede entre os serviços

**Acessando a aplicação**:
- Frontend: http://localhost (porta 80)
- Backend API: http://localhost:8080/api
- Console H2 (banco de dados): http://localhost:8080/h2-console (JDBC URL: jdbc:h2:mem:ecommercedb)

Para parar todos os contêineres:
```bash
docker-compose down
```

## Desenvolvimento local (sem Docker)

### Compilar e Executar o Projeto Completo

```bash
./gradlew bootRun
```

Este comando irá:
1. Baixar as dependências do backend
2. Instalar as dependências do frontend
3. Compilar o frontend
4. Iniciar o servidor Spring Boot na porta 8080

### Executar Frontend e Backend Separadamente (Para Desenvolvimento)

**Backend:**
```bash
./gradlew bootRun
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

O frontend de desenvolvimento será iniciado na porta 3000: http://localhost:3000

## Funcionalidades

- Listagem de produtos
- Detalhes do produto
- Adicionar novo produto
- Editar produto existente
- Excluir produto
- Busca por nome de produto

## API Endpoints

- `GET /api/products`: Lista todos os produtos
- `GET /api/products/{id}`: Obtém detalhes de um produto específico
- `GET /api/products/search?name={termo}`: Busca produtos por nome
- `POST /api/products`: Cria um novo produto
- `PUT /api/products/{id}`: Atualiza um produto existente
- `DELETE /api/products/{id}`: Remove um produto 