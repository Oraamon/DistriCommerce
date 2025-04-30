import os
import grpc
from dotenv import load_dotenv

# Import the generated classes
import recommendation_pb2
import recommendation_pb2_grpc

# Load environment variables
load_dotenv()

# Constants
SERVICE_PORT = os.getenv("SERVICE_PORT", "50051")
SERVICE_HOST = os.getenv("SERVICE_HOST", "localhost")


def get_product_recommendations(stub, product_id, max_results=5):
    """Call the GetProductRecommendations RPC"""
    request = recommendation_pb2.ProductRecommendationRequest(
        product_id=product_id,
        max_results=max_results
    )
    try:
        response = stub.GetProductRecommendations(request)
        print(f"Product recommendations for product ID {product_id}:")
        for product in response.products:
            print(f" - {product.name} (ID: {product.id}, Score: {product.score:.4f})")
    except grpc.RpcError as e:
        print(f"RPC error: {e.details()}")


def get_user_recommendations(stub, user_id, max_results=5):
    """Call the GetUserRecommendations RPC"""
    request = recommendation_pb2.UserRecommendationRequest(
        user_id=user_id,
        max_results=max_results
    )
    try:
        response = stub.GetUserRecommendations(request)
        print(f"User recommendations for user ID {user_id}:")
        for product in response.products:
            print(f" - {product.name} (ID: {product.id}, Score: {product.score:.4f})")
    except grpc.RpcError as e:
        print(f"RPC error: {e.details()}")


def run():
    """Test client that calls both recommendation methods"""
    # Create a gRPC channel
    channel = grpc.insecure_channel(f'{SERVICE_HOST}:{SERVICE_PORT}')
    
    # Create a stub (client)
    stub = recommendation_pb2_grpc.RecommendationServiceStub(channel)
    
    # Test product recommendations
    get_product_recommendations(stub, "1", 3)
    print()
    get_product_recommendations(stub, "5", 3)
    print()
    
    # Test user recommendations
    get_user_recommendations(stub, "user1", 3)
    print()
    get_user_recommendations(stub, "user3", 3)
    print()
    
    # Test with invalid inputs
    get_product_recommendations(stub, "999", 3)  # Non-existent product
    print()
    get_user_recommendations(stub, "nonexistent", 3)  # Non-existent user


if __name__ == '__main__':
    run() 