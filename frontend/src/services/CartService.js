import api from './api';
import AuthService from './AuthService';
import axios from 'axios';

// Carrinho local para modo de demonstração
let demoCart = {
  items: [],
  count: 0
};

class CartService {
  getAuthToken() {
    const token = AuthService.getAuthToken();
    console.log('Token from AuthService:', token);
    return token;
  }

  // Verifica se estamos em modo de demonstração (sem backend funcional)
  isDemoMode() {
    return localStorage.getItem('demo_mode') === 'true';
  }

  // Ativa o modo de demonstração
  enableDemoMode() {
    localStorage.setItem('demo_mode', 'true');
    console.log('Modo de demonstração ativado');
  }

  async getCartItems() {
    if (this.isDemoMode()) {
      console.log('Usando carrinho em modo de demonstração');
      return demoCart.items;
    }

    const token = this.getAuthToken();
    if (!token) throw new Error('Usuário não autenticado');
    
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter itens do carrinho:', error);
      
      // Se receber 403, ativa o modo de demonstração
      if (error.response && (error.response.status === 403 || error.response.status === 401)) {
        this.enableDemoMode();
        return demoCart.items;
      }
      
      throw error;
    }
  }
  
  async getCartItemCount() {
    if (this.isDemoMode()) {
      return demoCart.count;
    }

    const token = this.getAuthToken();
    if (!token) return 0;
    
    try {
      const response = await api.get('/cart/count');
      return response.data.count;
    } catch (error) {
      console.error('Erro ao obter contagem do carrinho:', error);
      
      // Se receber 403, ativa o modo de demonstração
      if (error.response && (error.response.status === 403 || error.response.status === 401)) {
        this.enableDemoMode();
        return demoCart.count;
      }
      
      return 0;
    }
  }
  
  async addToCart(productId, quantity = 1) {
    if (this.isDemoMode()) {
      // Busca os detalhes do produto para adicionar ao carrinho de demonstração
      try {
        const response = await axios.get(`/api/products/${productId}`);
        const product = response.data;
        
        // Verifica se o produto já existe no carrinho
        const existingItem = demoCart.items.find(item => item.id === productId);
        
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          demoCart.items.push({
            id: productId,
            productId,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity
          });
        }
        
        demoCart.count += quantity;
        console.log('Produto adicionado ao carrinho de demonstração:', demoCart);
        
        return { success: true, message: 'Produto adicionado ao carrinho (modo de demonstração)' };
      } catch (error) {
        console.error('Erro ao adicionar ao carrinho de demonstração:', error);
        throw new Error('Erro ao adicionar produto ao carrinho de demonstração');
      }
    }

    const token = this.getAuthToken();
    if (!token) throw new Error('Usuário não autenticado');
    
    try {
      console.log('Enviando requisição para adicionar ao carrinho:', {
        productId,
        quantity,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Usar diretamente axios para depuração
      const response = await axios.post('/api/cart/items', 
        { productId, quantity },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          } 
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erro detalhado ao adicionar ao carrinho:', error.response || error);
      
      // Se receber 403, ativa o modo de demonstração e tenta adicionar localmente
      if (error.response && (error.response.status === 403 || error.response.status === 401)) {
        this.enableDemoMode();
        return this.addToCart(productId, quantity);
      }
      
      throw error;
    }
  }
  
  async updateCartItem(itemId, quantity) {
    if (this.isDemoMode()) {
      const item = demoCart.items.find(item => item.id === itemId);
      if (item) {
        const diff = quantity - item.quantity;
        item.quantity = quantity;
        demoCart.count += diff;
        return { success: true };
      }
      throw new Error('Item não encontrado no carrinho de demonstração');
    }

    const token = this.getAuthToken();
    if (!token) throw new Error('Usuário não autenticado');
    
    try {
      const response = await api.put(`/cart/items/${itemId}`, { quantity });
      return response.data;
    } catch (error) {
      if (error.response && (error.response.status === 403 || error.response.status === 401)) {
        this.enableDemoMode();
        return this.updateCartItem(itemId, quantity);
      }
      throw error;
    }
  }
  
  async removeCartItem(itemId) {
    if (this.isDemoMode()) {
      const itemIndex = demoCart.items.findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        const item = demoCart.items[itemIndex];
        demoCart.count -= item.quantity;
        demoCart.items.splice(itemIndex, 1);
        return true;
      }
      return false;
    }

    const token = this.getAuthToken();
    if (!token) throw new Error('Usuário não autenticado');
    
    try {
      await api.delete(`/cart/items/${itemId}`);
      return true;
    } catch (error) {
      if (error.response && (error.response.status === 403 || error.response.status === 401)) {
        this.enableDemoMode();
        return this.removeCartItem(itemId);
      }
      throw error;
    }
  }
  
  async clearCart() {
    if (this.isDemoMode()) {
      demoCart = { items: [], count: 0 };
      return true;
    }

    const token = this.getAuthToken();
    if (!token) throw new Error('Usuário não autenticado');
    
    try {
      await api.delete('/cart');
      return true;
    } catch (error) {
      if (error.response && (error.response.status === 403 || error.response.status === 401)) {
        this.enableDemoMode();
        return this.clearCart();
      }
      throw error;
    }
  }
}

const cartService = new CartService();
export default cartService; 