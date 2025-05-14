# Stage 1: Build do aplicativo
FROM node:18-alpine as build

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar código fonte e construir
COPY . .
RUN npm run build

# Stage 2: Imagem de produção otimizada com Nginx
FROM nginx:alpine

# Copiar arquivos de configuração do Nginx (se necessário)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar os arquivos gerados na etapa de build
COPY --from=build /app/build /usr/share/nginx/html

# Expor porta 80
EXPOSE 80

# Command para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"] 