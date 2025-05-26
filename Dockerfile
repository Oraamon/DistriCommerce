FROM nginx:alpine

# Copiar arquivos estáticos (se existirem)
COPY src/main/resources/static /usr/share/nginx/html

# Criar uma página index simples se não existir
RUN echo '<!DOCTYPE html><html><head><title>E-commerce Backend</title></head><body><h1>E-commerce Backend</h1><p>Backend services are running via microservices.</p></body></html>' > /usr/share/nginx/html/index.html

# Configuração básica do nginx
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://gateway-service:8080/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 