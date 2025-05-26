import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import random
import logging
import time

# Configuração de logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Variáveis de ambiente
MONGODB_URI = os.getenv('MONGO_URI', 'mongodb://mongodb:27017')
MONGODB_DB = os.getenv('MONGO_DB', 'ecommerce')

# Inicialização do Flask
app = Flask(__name__)
CORS(app)

# Conexão com MongoDB
try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    # Verificar conexão com o banco de dados
    client.server_info()  # vai levantar exceção se não conseguir conectar
    db = client[MONGODB_DB]
    products_collection = db['products']
    logger.info(f"Conectado ao MongoDB em {MONGODB_URI}")
except Exception as e:
    logger.error(f"Erro ao conectar ao MongoDB: {e}")
    client = None
    db = None
    products_collection = None

def get_all_products():
    """Recupera todos os produtos do banco de dados ou retorna produtos fictícios se falhar"""
    try:
        if products_collection is None:
            logger.warning("Coleção de produtos não disponível, usando produtos fictícios")
            return get_mock_products()
            
        products = list(products_collection.find())
        logger.info(f"Recuperados {len(products)} produtos do MongoDB")
        
        if not products:
            logger.warning("Nenhum produto encontrado no MongoDB, usando produtos fictícios")
            return get_mock_products()
            
        # Converter IDs para string para serialização JSON
        for product in products:
            if '_id' in product:
                product['id'] = str(product['_id'])
            
        return products
    except Exception as e:
        logger.error(f"Erro ao buscar produtos: {e}")
        return get_mock_products()

def get_mock_products():
    """Retorna produtos fictícios para quando o banco de dados não está disponível"""
    logger.info("Retornando produtos fictícios")
    return [
        {'id': '1', 'name': 'Smartphone Premium', 'price': 999.99, 'category': 'Eletrônicos', 'images': ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop']},
        {'id': '2', 'name': 'Laptop Ultra', 'price': 1299.99, 'category': 'Computadores', 'images': ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop']},
        {'id': '3', 'name': 'Fones de Ouvido Wireless', 'price': 199.99, 'category': 'Áudio', 'images': ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop']},
        {'id': '4', 'name': 'Smartwatch', 'price': 249.99, 'category': 'Wearables', 'images': ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&h=500&fit=crop']},
        {'id': '5', 'name': 'Cafeteira Automática', 'price': 79.99, 'category': 'Eletrodomésticos', 'images': ['https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&h=500&fit=crop']},
        {'id': '6', 'name': 'Liquidificador', 'price': 49.99, 'category': 'Eletrodomésticos', 'images': ['https://images.unsplash.com/photo-1584990347449-a2d4c2c044c9?w=500&h=500&fit=crop']},
        {'id': '7', 'name': 'Tênis de Corrida', 'price': 129.99, 'category': 'Esportes', 'images': ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop']},
        {'id': '8', 'name': 'Monitor 4K', 'price': 349.99, 'category': 'Computadores', 'images': ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&h=500&fit=crop']},
        {'id': '9', 'name': 'Câmera Digital', 'price': 449.99, 'category': 'Fotografia', 'images': ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=500&fit=crop']},
        {'id': '10', 'name': 'Teclado Mecânico', 'price': 89.99, 'category': 'Periféricos', 'images': ['https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&h=500&fit=crop']}
    ]

@app.route('/api/recommendations/products/<product_id>', methods=['GET'])
def get_product_recommendations(product_id):
    logger.info(f"Requisição de recomendações para produto ID: {product_id}")
    max_results = request.args.get('maxResults', default=4, type=int)
    
    try:
        # Buscar todos os produtos
        all_products = get_all_products()
        
        # Filtrar para não incluir o produto atual
        available_products = [p for p in all_products if str(p.get('id')) != product_id and str(p.get('_id', '')) != product_id]
        
        # Se não houver produtos suficientes, retorna o que tiver
        if len(available_products) <= max_results:
            recommendations = available_products
        else:
            # Seleciona produtos aleatoriamente (uma forma simples de "recomendação")
            recommendations = random.sample(available_products, max_results)
        
        # Formatar para o formato esperado pela UI
        formatted_recommendations = []
        for product in recommendations:
            formatted_recommendations.append({
                'id': str(product.get('id', product.get('_id', ''))),
                'name': product.get('name', 'Produto'),
                'price': float(product.get('price', 0)),
                'score': random.uniform(0.5, 1.0),  # Score aleatório entre 0.5 e 1.0
                'category': product.get('category', ''),
                'images': product.get('images', ['https://via.placeholder.com/300x200'])
            })
        
        logger.info(f"Retornando {len(formatted_recommendations)} recomendações")
        return jsonify(formatted_recommendations)
    except Exception as e:
        logger.error(f"Erro ao gerar recomendações: {e}")
        # Em caso de erro, retorna produtos fictícios
        mock_recs = [
            {'id': '2', 'name': 'Produto Recomendado 1', 'price': 99.99, 'score': 0.9, 'category': 'Eletrônicos', 'images': ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop']},
            {'id': '3', 'name': 'Produto Recomendado 2', 'price': 149.99, 'score': 0.8, 'category': 'Eletrônicos', 'images': ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop']},
            {'id': '4', 'name': 'Produto Recomendado 3', 'price': 199.99, 'score': 0.7, 'category': 'Eletrônicos', 'images': ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop']},
            {'id': '5', 'name': 'Produto Recomendado 4', 'price': 249.99, 'score': 0.6, 'category': 'Eletrônicos', 'images': ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&h=500&fit=crop']}
        ]
        return jsonify(mock_recs)

@app.route('/api/recommendations/users', methods=['GET'])
def get_user_recommendations():
    logger.info(f"Requisição de recomendações para usuário")
    max_results = request.args.get('maxResults', default=4, type=int)
    
    try:
        # Buscar todos os produtos
        all_products = get_all_products()
        
        # Se não houver produtos suficientes, retorna o que tiver
        if len(all_products) <= max_results:
            recommendations = all_products
        else:
            # Seleciona produtos aleatoriamente
            recommendations = random.sample(all_products, max_results)
        
        # Formatar para o formato esperado pela UI
        formatted_recommendations = []
        for product in recommendations:
            formatted_recommendations.append({
                'id': str(product.get('id', product.get('_id', ''))),
                'name': product.get('name', 'Produto'),
                'price': float(product.get('price', 0)),
                'score': random.uniform(0.5, 1.0),  # Score aleatório entre 0.5 e 1.0
                'category': product.get('category', ''),
                'images': product.get('images', ['https://via.placeholder.com/300x200'])
            })
        
        logger.info(f"Retornando {len(formatted_recommendations)} recomendações")
        return jsonify(formatted_recommendations)
    except Exception as e:
        logger.error(f"Erro ao gerar recomendações: {e}")
        # Em caso de erro, retorna produtos fictícios
        mock_recs = [
            {'id': '1', 'name': 'Produto Recomendado 1', 'price': 99.99, 'score': 0.9, 'category': 'Eletrônicos', 'images': ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop']},
            {'id': '2', 'name': 'Produto Recomendado 2', 'price': 149.99, 'score': 0.8, 'category': 'Eletrônicos', 'images': ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop']},
            {'id': '3', 'name': 'Produto Recomendado 3', 'price': 199.99, 'score': 0.7, 'category': 'Eletrônicos', 'images': ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop']},
            {'id': '4', 'name': 'Produto Recomendado 4', 'price': 249.99, 'score': 0.6, 'category': 'Eletrônicos', 'images': ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&h=500&fit=crop']}
        ]
        return jsonify(mock_recs)

def initialize_database():
    # Tentar conectar ao MongoDB várias vezes (retry pattern)
    max_retries = 5
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            logger.info(f"Tentando conectar ao MongoDB ({retry_count+1}/{max_retries})...")
            client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
            # Verificar conexão com o banco de dados
            client.server_info()
            db = client[MONGODB_DB]
            
            # Verificar se já existem produtos
            products_collection = db['products']
            existing_count = products_collection.count_documents({})
            
            if existing_count > 0:
                logger.info(f"Já existem {existing_count} produtos na coleção. Pulando a inicialização.")
                return
            
            # Inserir produtos de exemplo
            product_ids = products_collection.insert_many(sample_products).inserted_ids
            logger.info(f"Inseridos {len(product_ids)} produtos com sucesso!")
            
            # Mostrar os produtos inseridos
            for i, product_id in enumerate(product_ids):
                logger.info(f"Produto {i+1}: ID={product_id}, Nome={sample_products[i]['name']}")
            
            return
            
        except Exception as e:
            logger.error(f"Erro ao conectar/inicializar o MongoDB: {e}")
            retry_count += 1
            wait_time = 5 * retry_count  # Espera mais a cada tentativa
            logger.info(f"Tentando novamente em {wait_time} segundos...")
            time.sleep(wait_time)
    
    logger.error("Não foi possível conectar ao MongoDB após várias tentativas.")

if __name__ == '__main__':
    logger.info("Iniciando servidor Flask na porta 5001")
    initialize_database()
    app.run(host='0.0.0.0', port=5001, debug=True) 