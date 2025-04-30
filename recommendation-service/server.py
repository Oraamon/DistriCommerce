import os
import time
import grpc
import pandas as pd
import numpy as np
from concurrent import futures
from dotenv import load_dotenv
import py_eureka_client.eureka_client as eureka_client
from sklearn.metrics.pairwise import cosine_similarity
from flask import Flask, jsonify, request
from flask_cors import CORS

# Import the generated classes
import recommendation_pb2
import recommendation_pb2_grpc

# Load environment variables
load_dotenv()

# Constants
_ONE_DAY_IN_SECONDS = 60 * 60 * 24
MAX_WORKERS = 10
EUREKA_SERVER = os.getenv("EUREKA_SERVER", "http://localhost:8761/eureka/")
SERVICE_PORT = os.getenv("SERVICE_PORT", "50051")
SERVICE_NAME = "recommendation-service"
SERVICE_IP = os.getenv("SERVICE_IP", "localhost")
SERVICE_HOST = os.getenv("SERVICE_HOST", "localhost")

# Sample data (in production would come from a database)
# Format: product_id, product_name, category, price, feature1, feature2, feature3, ...
products_df = pd.DataFrame([
    {"id": "1", "name": "Smartphone Premium", "category": "Electronics", "price": 999.99, "feature1": 0.9, "feature2": 0.7, "feature3": 0.8},
    {"id": "2", "name": "Laptop Pro", "category": "Electronics", "price": 1299.99, "feature1": 0.8, "feature2": 0.9, "feature3": 0.7},
    {"id": "3", "name": "Wireless Headphones", "category": "Electronics", "price": 199.99, "feature1": 0.6, "feature2": 0.6, "feature3": 0.9},
    {"id": "4", "name": "Smartwatch", "category": "Electronics", "price": 249.99, "feature1": 0.7, "feature2": 0.5, "feature3": 0.6},
    {"id": "5", "name": "Coffee Maker", "category": "Home", "price": 79.99, "feature1": 0.2, "feature2": 0.3, "feature3": 0.1},
    {"id": "6", "name": "Blender", "category": "Home", "price": 49.99, "feature1": 0.3, "feature2": 0.2, "feature3": 0.2},
    {"id": "7", "name": "Toaster", "category": "Home", "price": 29.99, "feature1": 0.1, "feature2": 0.1, "feature3": 0.3},
    {"id": "8", "name": "Running Shoes", "category": "Sports", "price": 129.99, "feature1": 0.5, "feature2": 0.8, "feature3": 0.5},
    {"id": "9", "name": "Yoga Mat", "category": "Sports", "price": 39.99, "feature1": 0.4, "feature2": 0.7, "feature3": 0.4},
    {"id": "10", "name": "Dumbbell Set", "category": "Sports", "price": 149.99, "feature1": 0.6, "feature2": 0.9, "feature3": 0.6}
])

# Sample user purchase history data
# Format: user_id, product_id
user_purchases = pd.DataFrame([
    {"user_id": "user1", "product_id": "1"},
    {"user_id": "user1", "product_id": "3"},
    {"user_id": "user1", "product_id": "4"},
    {"user_id": "user2", "product_id": "2"},
    {"user_id": "user2", "product_id": "4"},
    {"user_id": "user3", "product_id": "5"},
    {"user_id": "user3", "product_id": "6"},
    {"user_id": "user3", "product_id": "7"},
    {"user_id": "user4", "product_id": "8"},
    {"user_id": "user4", "product_id": "9"},
    {"user_id": "user4", "product_id": "10"}
])

class RecommendationServicer(recommendation_pb2_grpc.RecommendationServiceServicer):
    """Provides methods that implement functionality of recommendation server."""

    def __init__(self):
        # Create a feature matrix for products (excluding id, name, category)
        self.feature_columns = ["feature1", "feature2", "feature3"]
        self.product_features = products_df[self.feature_columns].to_numpy()
        
        # Precompute similarity matrix
        self.similarity_matrix = cosine_similarity(self.product_features)

    def GetProductRecommendations(self, request, context):
        """Implements the GetProductRecommendations RPC method."""
        product_id = request.product_id
        max_results = min(request.max_results, 10)  # Cap at 10
        
        try:
            # Find the index of the product in our dataframe
            product_idx = products_df.index[products_df['id'] == product_id].tolist()[0]
            
            # Get similarities from the precomputed matrix
            product_similarities = self.similarity_matrix[product_idx]
            
            # Get indices of most similar products (excluding itself)
            similar_indices = np.argsort(product_similarities)[::-1][1:max_results+1]
            
            # Create response with similar products
            response = recommendation_pb2.ProductRecommendationResponse()
            
            for idx in similar_indices:
                product = recommendation_pb2.Product()
                product.id = products_df.iloc[idx]['id']
                product.name = products_df.iloc[idx]['name']
                product.score = float(product_similarities[idx])
                response.products.append(product)
                
            return response
            
        except (IndexError, KeyError):
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details(f"Product ID {product_id} not found")
            return recommendation_pb2.ProductRecommendationResponse()

    def GetUserRecommendations(self, request, context):
        """Implements the GetUserRecommendations RPC method."""
        user_id = request.user_id
        max_results = min(request.max_results, 10)  # Cap at 10
        
        try:
            # Get products the user has purchased
            user_product_ids = user_purchases[user_purchases['user_id'] == user_id]['product_id'].tolist()
            
            if not user_product_ids:
                context.set_code(grpc.StatusCode.NOT_FOUND)
                context.set_details(f"No purchase history for user {user_id}")
                return recommendation_pb2.ProductRecommendationResponse()
            
            # Get indices of these products
            user_product_indices = []
            for pid in user_product_ids:
                indices = products_df.index[products_df['id'] == pid].tolist()
                if indices:
                    user_product_indices.append(indices[0])
            
            # Calculate average product preferences
            user_profile = np.mean([self.product_features[idx] for idx in user_product_indices], axis=0)
            
            # Calculate similarity to all products
            user_similarities = cosine_similarity([user_profile], self.product_features)[0]
            
            # Get indices of most similar products (excluding already purchased)
            all_indices = np.argsort(user_similarities)[::-1]
            recommended_indices = []
            
            for idx in all_indices:
                product_id = products_df.iloc[idx]['id']
                if product_id not in user_product_ids:
                    recommended_indices.append(idx)
                    if len(recommended_indices) >= max_results:
                        break
            
            # Create response with recommended products
            response = recommendation_pb2.ProductRecommendationResponse()
            
            for idx in recommended_indices:
                product = recommendation_pb2.Product()
                product.id = products_df.iloc[idx]['id']
                product.name = products_df.iloc[idx]['name']
                product.score = float(user_similarities[idx])
                response.products.append(product)
                
            return response
            
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return recommendation_pb2.ProductRecommendationResponse()

# Flask app for REST endpoints
app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-User-ID"]
    }
})

@app.route('/api/recommendations/products/<product_id>', methods=['GET'])
def get_product_recommendations(product_id):
    max_results = request.args.get('maxResults', default=4, type=int)
    
    try:
        product_idx = products_df.index[products_df['id'] == product_id].tolist()[0]
        product_similarities = cosine_similarity(products_df[["feature1", "feature2", "feature3"]].to_numpy())[product_idx]
        similar_indices = np.argsort(product_similarities)[::-1][1:max_results+1]
        
        recommendations = []
        for idx in similar_indices:
            product = products_df.iloc[idx]
            recommendations.append({
                'id': product['id'],
                'name': product['name'],
                'price': float(product['price']),
                'score': float(product_similarities[idx])
            })
        
        return jsonify(recommendations)
    except (IndexError, KeyError):
        return jsonify({'error': f'Product ID {product_id} not found'}), 404

@app.route('/api/recommendations/users', methods=['GET'])
def get_user_recommendations():
    user_id = request.headers.get('X-User-ID', 'user1')  # Default to user1 if not provided
    max_results = request.args.get('maxResults', default=4, type=int)
    
    try:
        user_product_ids = user_purchases[user_purchases['user_id'] == user_id]['product_id'].tolist()
        
        if not user_product_ids:
            return jsonify({'error': f'No purchase history for user {user_id}'}), 404
        
        user_product_indices = []
        for pid in user_product_ids:
            indices = products_df.index[products_df['id'] == pid].tolist()
            if indices:
                user_product_indices.append(indices[0])
        
        user_profile = np.mean([products_df[["feature1", "feature2", "feature3"]].to_numpy()[idx] for idx in user_product_indices], axis=0)
        user_similarities = cosine_similarity([user_profile], products_df[["feature1", "feature2", "feature3"]].to_numpy())[0]
        
        all_indices = np.argsort(user_similarities)[::-1]
        recommended_indices = []
        
        for idx in all_indices:
            product_id = products_df.iloc[idx]['id']
            if product_id not in user_product_ids:
                recommended_indices.append(idx)
                if len(recommended_indices) >= max_results:
                    break
        
        recommendations = []
        for idx in recommended_indices:
            product = products_df.iloc[idx]
            recommendations.append({
                'id': product['id'],
                'name': product['name'],
                'price': float(product['price']),
                'score': float(user_similarities[idx])
            })
        
        return jsonify(recommendations)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def register_with_eureka():
    """Register the service with Eureka server"""
    try:
        eureka_client.init(
            eureka_server=EUREKA_SERVER,
            app_name=SERVICE_NAME,
            instance_port=int(SERVICE_PORT),
            instance_host=SERVICE_IP
        )
        print(f"Registered with Eureka at {EUREKA_SERVER}")
    except Exception as e:
        print(f"Failed to register with Eureka: {e}")

def serve():
    """Start the gRPC server and register with Eureka"""
    # Create a gRPC server
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=MAX_WORKERS))
    recommendation_pb2_grpc.add_RecommendationServiceServicer_to_server(
        RecommendationServicer(), server)
    server.add_insecure_port(f'[::]:{SERVICE_PORT}')
    server.start()
    print(f"gRPC Server started on port {SERVICE_PORT}")
    
    # Register with Eureka
    register_with_eureka()
    
    # Start Flask app
    app.run(host='0.0.0.0', port=5001)
    
    try:
        while True:
            time.sleep(_ONE_DAY_IN_SECONDS)
    except KeyboardInterrupt:
        server.stop(0)

if __name__ == '__main__':
    serve() 