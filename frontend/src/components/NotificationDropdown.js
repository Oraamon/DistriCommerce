import React, { useState, useEffect, useRef } from 'react';
import { NavDropdown, Badge, Spinner, Button } from 'react-bootstrap';
import NotificationService from '../services/NotificationService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    fetchUnreadCount();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const fetchUnreadCount = async () => {
    const count = await NotificationService.getUnreadNotificationCount();
    setUnreadCount(count);
  };
  
  const fetchNotifications = async () => {
    setLoading(true);
    const data = await NotificationService.getNotifications();
    setNotifications(data);
    setLoading(false);
  };
  
  const handleToggle = (isOpen) => {
    if (isOpen) {
      fetchNotifications();
    }
  };
  
  const handleMarkAsRead = async (id) => {
    await NotificationService.markNotificationAsRead(id);
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    fetchUnreadCount();
  };
  
  const handleMarkAllAsRead = async () => {
    await NotificationService.markAllNotificationsAsRead();
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };
  
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch (error) {
      return 'Data desconhecida';
    }
  };
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'CART_UPDATE':
        return 'bi-cart';
      case 'ORDER_STATUS':
        return 'bi-box';
      case 'PAYMENT_STATUS':
        return 'bi-credit-card';
      case 'SHIPPING_UPDATE':
        return 'bi-truck';
      default:
        return 'bi-bell';
    }
  };
  
  return (
    <NavDropdown 
      title={
        <span className="position-relative">
          <i className="bi bi-bell"></i>
          {unreadCount > 0 && (
            <Badge 
              pill 
              bg="danger" 
              className="position-absolute top-0 start-100 translate-middle"
            >
              {unreadCount}
            </Badge>
          )}
        </span>
      }
      id="notification-dropdown"
      align="end"
      onToggle={handleToggle}
      ref={dropdownRef}
    >
      <div className="notification-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
        <h6 className="mb-0">Notificações</h6>
        {unreadCount > 0 && (
          <Button 
            variant="link" 
            size="sm" 
            className="p-0 text-decoration-none"
            onClick={handleMarkAllAsRead}
          >
            Marcar todas como lidas
          </Button>
        )}
      </div>
      
      <div style={{ maxHeight: '350px', overflowY: 'auto', width: '320px' }}>
        {loading ? (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" />
            <p className="mb-0 mt-2">Carregando notificações...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-3">
            <i className="bi bi-inbox" style={{ fontSize: '1.5rem' }}></i>
            <p className="mb-0 mt-2">Nenhuma notificação</p>
          </div>
        ) : (
          notifications.map(notification => (
            <NavDropdown.Item 
              key={notification.id}
              className={notification.read ? '' : 'bg-light'}
              onClick={() => !notification.read && handleMarkAsRead(notification.id)}
            >
              <div className="d-flex align-items-start">
                <div className="me-2">
                  <i className={`bi ${getNotificationIcon(notification.type)}`}></i>
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between">
                    <p className="mb-0 fw-semibold">{notification.message}</p>
                    {!notification.read && (
                      <Badge pill bg="primary" className="ms-2">Novo</Badge>
                    )}
                  </div>
                  <small className="text-muted">{formatDate(notification.createdAt)}</small>
                </div>
              </div>
            </NavDropdown.Item>
          ))
        )}
      </div>
      
      <NavDropdown.Divider />
      <NavDropdown.Item href="/notifications" className="text-center">
        Ver todas as notificações
      </NavDropdown.Item>
    </NavDropdown>
  );
};

export default NotificationDropdown; 