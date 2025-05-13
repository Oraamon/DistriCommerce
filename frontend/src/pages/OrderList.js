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
      
      const demoOrders = JSON.parse(localStorage.getItem('demo_orders') || '[]');
      
      if (demoOrders.length > 0 || isDemo) {
        console.log("OrderList - Usando dados de pedidos de demonstração");
        ordersList = demoOrders;
        
        if (ordersList.length === 0) {
          ordersList = [
            {
              id: 'order_' + (Date.now() - 86400000),
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              totalPrice: 456.78,
              status: 'processing'
            },
            {
              id: 'order_' + (Date.now() - 604800000),
              createdAt: new Date(Date.now() - 604800000).toISOString(),
              totalPrice: 123.45,
              status: 'delivered'
            }
          ];
        }
      } else {
        try {
          const response = await axios.get('/api/orders', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          ordersList = response.data;
        } catch (apiError) {
          console.error("Erro ao buscar pedidos da API:", apiError);
          if (demoOrders.length > 0) {
            ordersList = demoOrders;
          } else {
            throw apiError;
          }
        }
      }
      
      ordersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
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
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };
  
  const getStatusBadgeVariant = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  const getStatusText = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pendente';
      case 'processing':
        return 'Processando';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
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
                <td>{formatDate(order.createdAt)}</td>
                <td>R$ {order.totalPrice.toFixed(2)}</td>
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