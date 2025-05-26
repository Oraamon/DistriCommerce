import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthService from '../services/AuthService';

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = AuthService.isAuthenticated();
  const user = AuthService.getCurrentUser();
  const isAdmin = user && user.roles && user.roles.includes('ROLE_ADMIN');
  
  // Adicionar logs para diagnóstico
  useEffect(() => {
    console.log('AdminRoute - Rota:', location.pathname);
    console.log('AdminRoute - IsAuthenticated:', isAuthenticated);
    console.log('AdminRoute - IsAdmin:', isAdmin);
    console.log('AdminRoute - User:', user);
  }, [location.pathname, isAuthenticated, isAdmin, user]);
  
  // Verificar se o usuário está autenticado e é admin
  if (!isAuthenticated || !isAdmin) {
    console.log('AdminRoute - Redirecionando para home - usuário não é admin');
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default AdminRoute; 