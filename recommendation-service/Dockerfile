FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Generate proto files
RUN chmod +x generate_protos.sh && ./generate_protos.sh

EXPOSE 50051

CMD ["python", "server.py"] 