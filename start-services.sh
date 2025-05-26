#!/bin/bash

echo "Starting E-commerce Microservices..."

docker-compose down

echo "Building and starting all services..."
docker-compose up --build

echo "All services started successfully!"
echo ""
echo "Services available at:"
echo "- Frontend: http://localhost:3000 (connects to Gateway)"
echo "- Backend Dev: http://localhost:8080 (development mode)"
echo "- Gateway Service: http://localhost:8090"
echo "- Eureka Server: http://localhost:8761"
echo "- Product Service: http://localhost:8081"
echo "- Order Service: http://localhost:8082"
echo "- Payment Service: http://localhost:8083"
echo "- Cart Service: http://localhost:8084"
echo "- User Service: http://localhost:8085"
echo "- Notification Service: http://localhost:8086"
echo "- RabbitMQ Management: http://localhost:15672 (guest/guest)"
echo "- Prometheus: http://localhost:9090"
echo "- Grafana: http://localhost:3001" 