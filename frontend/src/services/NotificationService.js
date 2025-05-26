import axios from 'axios';
import AuthService from './AuthService';

class NotificationService {
  async getNotifications() {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) return [];
      
      const token = AuthService.getAuthToken();
      const response = await axios.get(`/api/notifications/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }
  }
  
  async getUnreadNotifications() {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) return [];
      
      const token = AuthService.getAuthToken();
      const response = await axios.get(`/api/notifications/user/${user.id}/unread`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar notificações não lidas:', error);
      return [];
    }
  }
  
  async getUnreadNotificationCount() {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) return 0;
      
      const token = AuthService.getAuthToken();
      const response = await axios.get(`/api/notifications/user/${user.id}/count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data.count;
    } catch (error) {
      console.error('Erro ao buscar contagem de notificações não lidas:', error);
      return 0;
    }
  }
  
  async markNotificationAsRead(notificationId) {
    try {
      const token = AuthService.getAuthToken();
      await axios.put(`/api/notifications/${notificationId}/read`, null, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
  }
  
  async markAllNotificationsAsRead() {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) return false;
      
      const token = AuthService.getAuthToken();
      await axios.put(`/api/notifications/user/${user.id}/read-all`, null, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      return false;
    }
  }

  async getUnreadCount(userId) {
    try {
      const response = await axios.get(`/api/notifications/user/${userId}/count`);
      return response.data.count;
    } catch (error) {
      console.error('Erro ao buscar contagem de notificações não lidas:', error);
      return 0;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService; 