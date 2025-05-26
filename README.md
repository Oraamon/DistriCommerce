# E-commerce Microservices

Sistema de e-commerce distribuído usando arquitetura de microserviços com Spring Boot, RabbitMQ, PostgreSQL, MongoDB e monitoramento completo.

## 🏗️ Arquitetura

### Microserviços
- **Product Service** (8081) - Gerenciamento de produtos (MongoDB)
- **Order Service** (8082) - Gerenciamento de pedidos (PostgreSQL)
- **Payment Service** (8083) - Processamento de pagamentos (PostgreSQL)
- **Notification Service** (8086) - Sistema de notificações (PostgreSQL)
- **Eureka Server** (8761) - Service Discovery

### Infraestrutura
- **PostgreSQL** (5432) - Banco de dados relacional
- **MongoDB** (27017) - Banco de dados NoSQL
- **RabbitMQ** (5672/15672) - Message Broker
- **Prometheus** (9090) - Coleta de métricas
- **Grafana** (3001) - Visualização de métricas

## 🚀 Como Executar

### Pré-requisitos
- Docker e Docker Compose
- Java 17+
- Maven 3.6+
- Node.js (para testes de carga)

### Execução Local
```bash
# Clonar o repositório
git clone <repository-url>
cd Ecomerce

# Iniciar todos os serviços
docker-compose up -d

# Aguardar serviços iniciarem (cerca de 2 minutos)
# Verificar status
docker-compose ps
```

### Portas dos Serviços

| Serviço               | Porta  | URL Health Check                          |
|-----------------------|--------|-------------------------------------------|
| Product Service       | 8081   | http://localhost:8081/actuator/health     |
| Order Service         | 8082   | http://localhost:8082/actuator/health     |
| Payment Service       | 8083   | http://localhost:8083/actuator/health     |
| Cart Service          | 8084   | http://localhost:8084/actuator/health     |
| User Service          | 8085   | http://localhost:8085/actuator/health     |
| Notification Service  | 8086   | http://localhost:8086/actuator/health     |
| Eureka Server         | 8761   | http://localhost:8761/actuator/health     |
| Gateway Service       | 8090   | http://localhost:8090/actuator/health     |
| PostgreSQL            | 5432   | -                                         |
| MongoDB               | 27017  | -                                         |
| RabbitMQ              | 5672   | http://localhost:15672 (Admin UI)        |
| Prometheus            | 9090   | http://localhost:9090                     |
| Grafana               | 3001   | http://localhost:3001 (admin/admin)      |

### Verificar Saúde dos Serviços
```bash
curl http://localhost:8081/actuator/health  # Product Service
curl http://localhost:8082/actuator/health  # Order Service
curl http://localhost:8083/actuator/health  # Payment Service
curl http://localhost:8086/actuator/health  # Notification Service
```

## 📊 Monitoramento

### Prometheus
- **URL**: http://localhost:9090
- **Métricas**: Coleta automática de métricas dos microserviços
- **Targets**: Todos os serviços expostos via `/actuator/prometheus`

### Grafana
- **URL**: http://localhost:3001
- **Login**: admin/admin
- **Dashboard**: Microservices Monitoring (pré-configurado)
- **Métricas disponíveis**:
  - Requisições HTTP por segundo
  - Tempos de resposta (percentis 50 e 95)
  - Uso de memória JVM
  - Conexões de banco de dados

## 🔄 CI/CD

### GitHub Actions
O projeto inclui pipelines automatizados:

#### CI Pipeline (`.github/workflows/ci.yml`)
- **Trigger**: Push/PR para main/develop
- **Etapas**:
  - Testes unitários de todos os serviços
  - Build das aplicações
  - Build das imagens Docker
  - Testes de integração

#### CD Pipeline (`.github/workflows/cd.yml`)
- **Trigger**: Após sucesso do CI
- **Etapas**:
  - Build e empacotamento
  - Criação de artefatos Docker
  - Deploy para staging
  - Testes de smoke

### Executar Localmente
```bash
# Executar testes
cd payment-service && mvn test
cd ../order-service && mvn test
cd ../notification-service && mvn test
cd ../product-service && mvn test

# Build completo
docker-compose build
```

## ☸️ Kubernetes (Minikube)

### Configuração
```bash
# Configurar Minikube
chmod +x scripts/setup-minikube.sh
./scripts/setup-minikube.sh
```

### Deploy Manual
```bash
# Criar namespace
kubectl apply -f k8s/namespace.yml

# Deploy PostgreSQL
kubectl apply -f k8s/postgres.yml

# Deploy Payment Service
kubectl apply -f k8s/payment-service.yml

# Verificar pods
kubectl get pods -n ecommerce

# Port-forward para acesso local
kubectl port-forward -n ecommerce service/payment-service 8083:8083
```

### Recursos Kubernetes
- **Namespace**: ecommerce
- **Deployments**: Com health checks e resource limits
- **Services**: ClusterIP para comunicação interna
- **HPA**: Auto-scaling baseado em CPU/memória
- **PVC**: Persistent volumes para bancos de dados

## 🧪 Testes de Carga

### Configuração
```bash
# Instalar Artillery
cd load-tests
npm install
```

### Executar Testes
```bash
# Script automatizado
chmod +x scripts/run-load-tests.sh
./scripts/run-load-tests.sh

# Ou manualmente
cd load-tests
npm run test:payment    # Teste do Payment Service
npm run test:order      # Teste do Order Service
npm run test:product    # Teste do Product Service
npm run test:stress     # Teste de estresse
```

### Tipos de Teste
- **Carga Normal**: 5-20 req/s por 5-8 minutos
- **Teste de Estresse**: Até 200 req/s com picos
- **Cenários**: 
  - Processamento de pagamentos
  - Criação de pedidos
  - Consulta de produtos
  - Health checks

## 📈 Métricas e Alertas

### Métricas Principais
- **Performance**: Latência, throughput, taxa de erro
- **Recursos**: CPU, memória, conexões DB
- **Negócio**: Pagamentos processados, pedidos criados
- **Infraestrutura**: Status dos serviços, filas RabbitMQ

### Dashboards Grafana
- **Microservices Overview**: Visão geral de todos os serviços
- **JVM Metrics**: Métricas específicas da JVM
- **Database Metrics**: Conexões e performance do banco
- **RabbitMQ Metrics**: Filas e mensagens

## 🔧 Configuração de Desenvolvimento

### Variáveis de Ambiente
```bash
# PostgreSQL
POSTGRES_URL=jdbc:postgresql://localhost:5432/ecommerce
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ecommerce

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin123

# Eureka
EUREKA_URL=http://localhost:8761/eureka/
```

### Profiles Spring
- **default**: Desenvolvimento local
- **docker**: Execução em containers
- **k8s**: Execução no Kubernetes

## 🐛 Troubleshooting

### Problemas Comuns
1. **Serviços não iniciam**: Verificar logs com `docker-compose logs <service>`
2. **Notificações não funcionam**: Verificar configuração RabbitMQ
3. **Métricas não aparecem**: Verificar endpoints `/actuator/prometheus`
4. **Testes de carga falham**: Verificar se serviços estão rodando

### Logs
```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f payment-service

# Ver logs do Kubernetes
kubectl logs -f deployment/payment-service -n ecommerce
```

## 📚 Documentação Adicional

- [Arquitetura de Microserviços](docs/architecture.md)
- [Guia de Monitoramento](docs/monitoring.md)
- [Configuração CI/CD](docs/cicd.md)
- [Testes de Performance](docs/performance.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes. 