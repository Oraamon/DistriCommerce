import axios from 'axios';
import AuthService from './AuthService';

const API_BASE_URL = 'http://localhost:5001';

class RecommendationService {
  async getProductRecommendations(productId, maxResults = 4) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/recommendations/products/${productId}?maxResults=${maxResults}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar recomendações de produto:', error);
      return [];
    }
  }

  async getUserRecommendations(maxResults = 4) {
    try {
      const token = AuthService.getAuthToken();
      if (!token) return [];

      const response = await axios.get(`${API_BASE_URL}/api/recommendations/users?maxResults=${maxResults}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar recomendações para o usuário:', error);
      return [];
    }
  }

  // Obtém recomendações simuladas quando o backend não está disponível
  getSimulatedRecommendations(maxResults = 4) {
    // Produtos fixos para simulação
    const demoProducts = [
      { id: '1', name: 'Smartphone Premium', price: 999.99, imageUrl: 'https://via.placeholder.com/300x200' },
      { id: '2', name: 'Laptop Pro', price: 1299.99, imageUrl: 'https://via.placeholder.com/300x200' },
      { id: '3', name: 'Wireless Headphones', price: 199.99, imageUrl: 'https://via.placeholder.com/300x200' },
      { id: '4', name: 'Smartwatch', price: 249.99, imageUrl: 'https://via.placeholder.com/300x200' },
      { id: '5', name: 'Coffee Maker', price: 79.99, imageUrl: 'https://via.placeholder.com/300x200' },
      { id: '6', name: 'Blender', price: 49.99, imageUrl: 'https://via.placeholder.com/300x200' },
      { id: '7', name: 'Toaster', price: 29.99, imageUrl: 'https://via.placeholder.com/300x200' },
      { id: '8', name: 'Running Shoes', price: 129.99, imageUrl: 'https://via.placeholder.com/300x200' },
    ];
    
    // Seleciona aleatoriamente alguns produtos
    const shuffled = [...demoProducts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, maxResults);
  }
}

const recommendationService = new RecommendationService();
export default recommendationService; 