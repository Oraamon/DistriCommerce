import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthService from '../services/AuthService';

const AdminOrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
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
        
        const response = await axios.get(`/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setOrder(response.data);
        setNewStatus(response.data.status);
        setTrackingNumber(response.data.trackingNumber || '');
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar detalhes do pedido:', err);
        setError('Não foi possível carregar os detalhes do pedido. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, navigate]);
  
  const updateOrderStatus = async () => {
    try {
      setLoading(true);
      const token = AuthService.getAuthToken();
      
      await axios.put(`/api/orders/${orderId}/status`, null, {
        params: { status: newStatus },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Atualizar o objeto de pedido
      const response = await axios.get(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setOrder(response.data);
      setLoading(false);
      
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      setError('Erro ao atualizar o status do pedido. Por favor, tente novamente.');
      setLoading(false);
    }
  };
  
  const updateTrackingInfo = async () => {
    try {
      setLoading(true);
      const token = AuthService.getAuthToken();
      
      await axios.put(`/api/orders/${orderId}/tracking`, null, {
        params: { trackingNumber },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Atualizar o objeto de pedido
      const response = await axios.get(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setOrder(response.data);
      setLoading(false);
      
    } catch (error) {
      console.error('Erro ao atualizar informações de rastreamento:', error);
      setError('Erro ao atualizar informações de rastreamento. Por favor, tente novamente.');
      setLoading(false);
    }
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
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p>Carregando detalhes do pedido...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/admin/orders')}>
          Voltar para Lista de Pedidos
        </Button>
      </Container>
    );
  }
  
  if (!order) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Pedido não encontrado.
        </Alert>
        <Button variant="primary" onClick={() => navigate('/admin/orders')}>
          Voltar para Lista de Pedidos
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Detalhes do Pedido #{order.id}</h2>
        <Button variant="outline-primary" onClick={() => navigate('/admin/orders')}>
          Voltar para Lista de Pedidos
        </Button>
      </div>
      
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Informações do Pedido</h5>
              <Badge bg={getStatusBadgeVariant(order.status)}>
                {getStatusText(order.status)}
              </Badge>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>ID do Cliente:</strong> {order.userId}</p>
                  <p><strong>Data do Pedido:</strong> {formatDate(order.orderDate || order.createdAt)}</p>
                  <p><strong>Última Atualização:</strong> {formatDate(order.updatedAt)}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Valor Total:</strong> R$ {order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</p>
                  <p><strong>Método de Pagamento:</strong> {order.paymentMethod || 'Não especificado'}</p>
                  <p><strong>ID de Pagamento:</strong> {order.paymentId || 'Não disponível'}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Endereço de Entrega</h5>
            </Card.Header>
            <Card.Body>
              <p>{order.deliveryAddress || 'Endereço não disponível'}</p>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Itens do Pedido</h5>
            </Card.Header>
            <Card.Body>
              {order.items && order.items.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Quantidade</th>
                      <th>Preço Unitário</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.productName || `Produto #${item.productId}`}</td>
                        <td>{item.quantity}</td>
                        <td>R$ {item.price ? item.price.toFixed(2) : '0.00'}</td>
                        <td>R$ {(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Nenhum item encontrado para este pedido.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Gerenciamento de Status</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Status Atual</Form.Label>
                  <Form.Select 
                    value={newStatus} 
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="PENDING">Pendente</option>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="PROCESSING">Em Processamento</option>
                    <option value="SHIPPED">Em Rota de Entrega</option>
                    <option value="DELIVERED">Entregue</option>
                    <option value="CANCELLED">Cancelado</option>
                    <option value="RETURNED">Devolvido</option>
                  </Form.Select>
                </Form.Group>
                <Button 
                  variant="primary" 
                  onClick={updateOrderStatus}
                  disabled={newStatus === order.status}
                  className="w-100"
                >
                  Atualizar Status
                </Button>
              </Form>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Informações de Rastreamento</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Número de Rastreamento</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Digite o código de rastreamento" 
                    value={trackingNumber} 
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                </Form.Group>
                <Button 
                  variant="primary" 
                  onClick={updateTrackingInfo}
                  disabled={!trackingNumber.trim() || trackingNumber === order.trackingNumber}
                  className="w-100"
                >
                  Atualizar Rastreamento
                </Button>
              </Form>
              
              {order.trackingNumber && (
                <div className="mt-3">
                  <p><strong>Rastreamento Atual:</strong> {order.trackingNumber}</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminOrderDetails; 