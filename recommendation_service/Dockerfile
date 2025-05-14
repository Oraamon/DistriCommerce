FROM python:3.9-slim

WORKDIR /app

# Instalar dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Criar diretório protos
RUN mkdir -p protos

# Copiar os arquivos proto
COPY protos/recommendation.proto ./protos/

# Gerar código Python a partir do proto
RUN python -m grpc_tools.protoc -I./protos --python_out=. --grpc_python_out=. ./protos/recommendation.proto

# Copiar o restante dos arquivos
COPY . .

# Configurar variáveis de ambiente
ENV MONGO_URI=mongodb://mongodb:27017
ENV MONGO_DB=ecommerce

# Expor porta gRPC e Flask
EXPOSE 50051
EXPOSE 5001

CMD ["python", "server.py"] 