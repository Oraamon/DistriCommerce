import React, { useState, useEffect } from 'react';
import { Alert, Badge, Card, Container, Table } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await axios.get('/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setOrders(response.data);
        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar os pedidos. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [navigate]);
  
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
  
  if (loading) return <p>Carregando pedidos...</p>;
  
  return (
    <Container className="py-4">
      <h2 className="mb-4">Meus Pedidos</h2>
      
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