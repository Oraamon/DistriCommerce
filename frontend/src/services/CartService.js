import api from './api';
import AuthService from './AuthService';
import axios from 'axios';

class CartService {
  async getCartItems() {
    try {
      if (!AuthService.isAuthenticated()) {
        return [];
      }
      
      const token = AuthService.getAuthToken();
      const user = AuthService.getCurrentUser();
      const response = await axios.get('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': user.id
        }
      });
      
      return response.data.items || [];
    } catch (error) {
      console.error('Erro ao obter itens do carrinho:', error);
      return [];
    }
  }

  async getCartItemCount() {
    try {
      const items = await this.getCartItems();
      
      if (!items || items.length === 0) {
        return 0;
      }
      
      return items.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
      console.error('Erro ao obter contagem de itens do carrinho:', error);
      return 0;
    }
  }

  async addItem(product, quantity = 1) {
    try {
      if (!AuthService.isAuthenticated()) {
        throw new Error('Usuário não autenticado');
      }
      
      const token = AuthService.getAuthToken();
      const user = AuthService.getCurrentUser();
      const response = await axios.post('/api/cart/add', {
        productId: product.id,
        quantity: quantity,
        price: product.price
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': user.id
        }
      });
      
      window.dispatchEvent(new Event('cart-updated'));
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar item ao carrinho:', error);
      throw error;
    }
  }

  async addToCart(productId, quantity = 1, price = null) {
    try {
      if (!AuthService.isAuthenticated()) {
        throw new Error('Usuário não autenticado');
      }
      
      const token = AuthService.getAuthToken();
      const user = AuthService.getCurrentUser();
      
      // Garantir que productId seja string
      const stringProductId = productId.toString();
      
      // Se o preço não foi fornecido, buscar do produto
      let productPrice = price;
      if (!productPrice) {
        try {
          const productResponse = await axios.get(`/api/products/${stringProductId}`);
          productPrice = productResponse.data.price;
        } catch (err) {
          console.error('Erro ao buscar preço do produto:', err);
          throw new Error('Não foi possível obter o preço do produto');
        }
      }
      
      const response = await axios.post('/api/cart/add', {
        productId: stringProductId,
        quantity: parseInt(quantity, 10),
        price: parseFloat(productPrice)
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': user.id
        }
      });
      
      window.dispatchEvent(new Event('cart-updated'));
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar item ao carrinho:', error);
      throw error;
    }
  }

  async updateItemQuantity(productId, quantity) {
    try {
      if (!AuthService.isAuthenticated()) {
        throw new Error('Usuário não autenticado');
      }
      
      const token = AuthService.getAuthToken();
      const user = AuthService.getCurrentUser();
      
      if (quantity <= 0) {
        const response = await axios.delete(`/api/cart/${productId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': user.id
          }
        });
        
        window.dispatchEvent(new Event('cart-updated'));
        return response.data;
      } else {
        const response = await axios.put(`/api/cart/${productId}`, {
          quantity: quantity
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': user.id
          }
        });
        
        window.dispatchEvent(new Event('cart-updated'));
        return response.data;
      }
    } catch (error) {
      console.error('Erro ao atualizar quantidade do item:', error);
      throw error;
    }
  }

  async removeItem(productId) {
    return this.updateItemQuantity(productId, 0);
  }

  async clearCart() {
    try {
      if (!AuthService.isAuthenticated()) {
        throw new Error('Usuário não autenticado');
      }
      
      const token = AuthService.getAuthToken();
      const user = AuthService.getCurrentUser();
      const response = await axios.delete('/api/cart/clear', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Id': user.id
        }
      });
      
      window.dispatchEvent(new Event('cart-updated'));
      return response.data;
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      throw error;
    }
  }

  isDemoMode() {
    return false;
  }
}

export default new CartService(); 