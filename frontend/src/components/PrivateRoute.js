import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthService from '../services/AuthService';
import CartService from '../services/CartService';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = AuthService.isAuthenticated();
  const isDemoMode = CartService.isDemoMode();
  
  // Permitir acesso para a rota do carrinho em modo de demonstração
  if (location.pathname === '/cart' && isDemoMode) {
    return children;
  }
  
  // Verificação normal de autenticação para outras rotas
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  return children;
};

export default PrivateRoute; 