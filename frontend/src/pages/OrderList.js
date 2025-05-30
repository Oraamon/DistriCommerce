import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Badge, Card, Container, Table, Spinner, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthService from '../services/AuthService';
import CartService from '../services/CartService';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = AuthService.getAuthToken();
      const user = AuthService.getCurrentUser();
      const isDemo = CartService.isDemoMode();
      
      if (!token || !user) {
        console.log("OrderList - Redirecionando para login - token ou user ausente");
        navigate('/login');
        return;
      }
      
      let ordersList = [];
      
      try {
        const response = await axios.get(`/api/orders/user/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        ordersList = response.data;
      } catch (apiError) {
        console.error("Erro ao buscar pedidos da API:", apiError);
        setError('Erro ao carregar os pedidos. Por favor, tente novamente.');
      }
      
      ordersList.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
      
      setOrders(ordersList);
      setLoading(false);
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
      setError('Erro ao carregar os pedidos. Por favor, tente novamente.');
      setLoading(false);
    }
  }, [navigate]);
  
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchOrders();
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Data indisponível';
    
    try {
      const date = new Date(dateString);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return 'Data indisponível';
      }
      
      const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
      return date.toLocaleDateString('pt-BR', options);
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data indisponível';
    }
  };
  
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'CONFIRMED':
        return 'info';
      case 'SHIPPED':
        return 'primary';
      case 'DELIVERED':
        return 'success';
      case 'CANCELED':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'CONFIRMED':
        return 'Confirmado';
      case 'SHIPPED':
        return 'Enviado';
      case 'DELIVERED':
        return 'Entregue';
      case 'CANCELED':
        return 'Cancelado';
      default:
        return status;
    }
  };
  
  if (loading) return (
    <div className="text-center my-5">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Carregando...</span>
      </Spinner>
    </div>
  );
  
  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Meus Pedidos</h2>
        <Button variant="outline-primary" onClick={handleRefresh}>
          <i className="bi bi-arrow-clockwise"></i> Atualizar
        </Button>
      </div>
      
      {error && (
        <Alert variant="danger">{error}</Alert>
      )}
      
      {orders.length === 0 ? (
        <Card className="text-center p-4">
          <Card.Body>
            <Card.Title>Você ainda não tem pedidos</Card.Title>
            <Card.Text>
              Que tal dar uma olhada em nossos produtos?
            </Card.Text>
            <Link to="/" className="btn btn-primary">
              Ver Produtos
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <Table responsive striped bordered hover>
          <thead>
            <tr>
              <th>Pedido #</th>
              <th>Data</th>
              <th>Total</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{formatDate(order.orderDate || order.createdAt)}</td>
                <td>R$ {order.totalAmount ? order.totalAmount.toFixed(2) : order.totalPrice ? order.totalPrice.toFixed(2) : '0.00'}</td>
                <td>
                  <Badge bg={getStatusBadgeVariant(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                </td>
                <td>
                  <Link 
                    to={`/orders/${order.id}`} 
                    className="btn btn-sm btn-outline-primary"
                  >
                    Detalhes
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default OrderList; 