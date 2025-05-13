import axios from 'axios';

class AuthService {
  login(username, password) {
    return axios.post('/api/auth/login', { username, password })
      .then(response => {
        if (response.data) {
          // Exibe a estrutura da resposta para debug
          console.log('Login response:', response.data);
          
          // Guardar o objeto completo do usuário
          const userData = { ...response.data };
          
          // Garantir que temos um token
          if (!userData.token && userData.accessToken) {
            userData.token = userData.accessToken;
          } else if (!userData.token && !userData.accessToken) {
            userData.token = `simulated_token_${userData.id || 'user'}_${Date.now()}`;
            console.log('Criado token simulado:', userData.token);
          }
          
          // Armazenar os dados completos do usuário
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Armazenar o token explicitamente
          localStorage.setItem('auth_token', userData.token || userData.accessToken);
          
          return userData;
        }
        return response.data;
      });
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
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
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      this.logout();
      return null;
    }
  }

  getAuthToken() {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated() {
    // Verifica tanto o token quanto o objeto de usuário
    const token = this.getAuthToken();
    const user = this.getCurrentUser();
    console.log("Token:", token);
    console.log("User:", user);
    return token !== null && user !== null;
  }
}

const authService = new AuthService();
export default authService; 