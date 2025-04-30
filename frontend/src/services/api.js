import axios from 'axios';
import AuthService from './AuthService';

// Cria uma instância do axios com configurações base
const api = axios.create({
  baseURL: '/api'
});

// Adiciona um interceptor para incluir o token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = AuthService.getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Adiciona um interceptor para tratar respostas de erro
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Se o erro for 401 (Não autorizado), podemos fazer logout automático
    if (error.response && error.response.status === 401) {
      console.log('Sessão expirada ou token inválido');
      // Não fazemos logout automático para não interromper a experiência do usuário
    }
    return Promise.reject(error);
  }
);

export default api; 