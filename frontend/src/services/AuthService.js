import axios from 'axios';

class AuthService {
  login(email, password) {
    return axios.post('/api/auth/login', { email, password })
      .then(response => {
        if (response.data) {
          // Exibe a estrutura da resposta para debug
          console.log('Login response:', response.data);
          
          // Guardar o objeto completo do usuário
          const userData = { ...response.data };
          
          // Criar campo name se não existir
          if (!userData.name) {
            if (userData.firstName && userData.lastName) {
              userData.name = `${userData.firstName} ${userData.lastName}`;
            } else if (userData.firstName) {
              userData.name = userData.firstName;
            } else if (userData.email) {
              userData.name = userData.email.split('@')[0];
            } else {
              userData.name = 'Usuário';
            }
          }
          
          // Garantir que temos um token
          if (!userData.token && userData.accessToken) {
            userData.token = userData.accessToken;
          } else if (!userData.token && !userData.accessToken) {
            userData.token = `simulated_token_${userData.id || 'user'}_${Date.now()}`;
            console.log('Criado token simulado:', userData.token);
          }
          
          // Se estivermos usando o admin@ecommerce.com, configuramos corretamente os papéis
          if (email === 'admin@ecommerce.com') {
            userData.roles = ['ROLE_ADMIN', 'ROLE_USER'];
          } else if (!userData.roles) {
            // Garantir que o usuário sempre tenha o papel de usuário padrão
            userData.roles = ['ROLE_USER'];
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

  register(firstName, lastName, email, password) {
    return axios.post('/api/auth/register', {
      firstName,
      lastName,
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
  
  isAdmin() {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Verificar se o usuário tem papel de admin
    return (
      (user.roles && user.roles.includes('ROLE_ADMIN')) ||
      user.role === 'ADMIN'
    );
  }
}

const authService = new AuthService();
export default authService; 