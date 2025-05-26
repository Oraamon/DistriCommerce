import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Badge, Card, Container, Table, Spinner, Button, Form, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthService from '../services/AuthService';

const AdminOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();
  
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = AuthService.getAuthToken();
      const user = AuthService.getCurrentUser();
      
      if (!token || !user) {
        navigate('/login');
        return;
      }
      
      // Verificar se o usuário é admin
      if (!user.roles || !user.roles.includes('ROLE_ADMIN')) {
        navigate('/');
        return;
      }
      
      let ordersList = [];
      
      try {
        // Buscar todos os pedidos (endpoint para admin)
        const response = await axios.get('/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        ordersList = response.data;
      } catch (apiError) {
        console.error("Erro ao buscar pedidos da API:", apiError);
        setError('Erro ao carregar os pedidos. Por favor, tente novamente.');
      }
      
      // Ordenar por data, mais recentes primeiro
      ordersList.sort((a, b) => new Date(b.orderDate || b.createdAt) - new Date(a.orderDate || a.createdAt));
      
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
      
      if (isNaN(date.getTime())) {
        return 'Data indisponível';
      }
      
      const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' };
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
      case 'PROCESSING':
        return 'primary';
      case 'SHIPPED':
        return 'info';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
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
      case 'PROCESSING':
        return 'Em Processamento';
      case 'SHIPPED':
        return 'Em Rota de Entrega';
      case 'DELIVERED':
        return 'Entregue';
      case 'CANCELLED':
        return 'Cancelado';
      case 'RETURNED':
        return 'Devolvido';
      default:
        return status;
    }
  };
  
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = AuthService.getAuthToken();
      
      await axios.put(`/api/orders/${orderId}/status`, null, {
        params: { status: newStatus },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Atualizar a lista após a mudança de status
      fetchOrders();
      
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      setError('Erro ao atualizar o status do pedido. Por favor, tente novamente.');
    }
  };
  
  const handleUpdateStatus = (orderId, currentStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    if (nextStatus) {
      updateOrderStatus(orderId, nextStatus);
    }
  };
  
  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'PENDING':
        return 'CONFIRMED';
      case 'CONFIRMED':
        return 'PROCESSING';
      case 'PROCESSING':
        return 'SHIPPED';
      case 'SHIPPED':
        return 'DELIVERED';
      default:
        return null;
    }
  };
  
  const filteredOrders = statusFilter 
    ? orders.filter(order => order.status === statusFilter)
    : orders;
  
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
        <h2>Gerenciamento de Pedidos</h2>
        <Button variant="outline-primary" onClick={handleRefresh}>
          <i className="bi bi-arrow-clockwise"></i> Atualizar
        </Button>
      </div>
      
      {error && (
        <Alert variant="danger">{error}</Alert>
      )}
      
      <Row className="mb-4">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Filtrar por Status</Form.Label>
            <Form.Select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos os pedidos</option>
              <option value="PENDING">Pendente</option>
              <option value="CONFIRMED">Confirmado</option>
              <option value="PROCESSING">Em Processamento</option>
              <option value="SHIPPED">Em Rota de Entrega</option>
              <option value="DELIVERED">Entregue</option>
              <option value="CANCELLED">Cancelado</option>
              <option value="RETURNED">Devolvido</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      
      {filteredOrders.length === 0 ? (
        <Card className="text-center p-4">
          <Card.Body>
            <Card.Title>Nenhum pedido encontrado</Card.Title>
            <Card.Text>
              Não há pedidos com os critérios de filtro selecionados.
            </Card.Text>
          </Card.Body>
        </Card>
      ) : (
        <Table responsive striped bordered hover>
          <thead>
            <tr>
              <th>Pedido #</th>
              <th>Cliente</th>
              <th>Data</th>
              <th>Total</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.userId}</td>
                <td>{formatDate(order.orderDate || order.createdAt)}</td>
                <td>R$ {order.totalAmount ? order.totalAmount.toFixed(2) : order.totalPrice ? order.totalPrice.toFixed(2) : '0.00'}</td>
                <td>
                  <Badge bg={getStatusBadgeVariant(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Link 
                      to={`/admin/orders/${order.id}`} 
                      className="btn btn-sm btn-outline-primary"
                    >
                      Detalhes
                    </Link>
                    
                    {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && order.status !== 'RETURNED' && (
                      <Button 
                        variant="sm btn-outline-success"
                        onClick={() => handleUpdateStatus(order.id, order.status)}
                      >
                        Avançar Status
                      </Button>
                    )}
                    
                    {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                      <Button 
                        variant="sm btn-outline-danger"
                        onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default AdminOrderList; 