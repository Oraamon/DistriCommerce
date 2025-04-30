import axios from 'axios';

class AuthService {
  login(username, password) {
    return axios.post('/api/auth/login', { username, password })
      .then(response => {
        if (response.data) {
          // Exibe a estrutura da resposta para debug
          console.log('Login response:', response.data);
          
          // Se o login for bem-sucedido, mas não retornar um token,
          // podemos criar um token simulado usando o ID do usuário como uma medida temporária
          const userData = { ...response.data };
          
          // Adiciona um token simulado se não existir (solução temporária)
          if (!userData.token && !userData.accessToken) {
            userData.token = `simulated_token_${userData.id}_${Date.now()}`;
            console.log('Criado token simulado:', userData.token);
          }
          
          // Armazena o objeto de usuário completo
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Armazena o token explicitamente
          localStorage.setItem('auth_token', userData.token || userData.accessToken);
          
          return userData;
        }
        return response.data;
      });
  }

  logout() {
    // Limpa os dados de autenticação
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    
    // Redireciona para a página de login
    window.location.href = '/login';
  }

  register(name, username, email, password) {
    return axios.post('/api/auth/register', {
      name,
      username,
      email,
      password
    });
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  }

  getAuthToken() {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated() {
    return this.getAuthToken() !== null;
  }
}

const authService = new AuthService();
export default authService; 