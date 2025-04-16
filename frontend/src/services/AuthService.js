import axios from 'axios';

class AuthService {
  login(username, password) {
    return axios.post('/api/auth/login', { username, password })
      .then(response => {
        if (response.data) {
          localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
      });
  }

  logout() {
    localStorage.removeItem('user');
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

  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }
}

export default new AuthService(); 