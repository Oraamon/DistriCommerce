import React, { useState, useEffect } from 'react';
import { Alert, Badge, Card, Col, Container, ListGroup, Row } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const OrderDetails = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await axios.get(`/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setOrder(response.data);
        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar os detalhes do pedido. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, navigate]);
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
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
  
  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'credit_card':
        return 'Cartão de Crédito';
      case 'boleto':
        return 'Boleto Bancário';
      default:
        return method;
    }
  };
  
  if (loading) return <p>Carregando detalhes do pedido...</p>;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!order) return <Alert variant="warning">Pedido não encontrado</Alert>;
  
  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Pedido #{order.id}</h2>
        <Badge bg={getStatusBadgeVariant(order.status)} className="fs-6 py-2 px-3">
          {getStatusText(order.status)}
        </Badge>
      </div>
      
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Itens do Pedido</h5>
            </Card.Header>
            <ListGroup variant="flush">
              {order.items && order.items.map(item => (
                <ListGroup.Item key={item.id}>
                  <Row className="align-items-center">
                    <Col md={2}>
                      <img 
                        src={item.product?.imageUrl || 'https://via.placeholder.com/80'}
                        alt={item.product?.name}
                        className="img-fluid rounded"
                      />
                    </Col>
                    <Col md={6}>
                      <h6>{item.product?.name}</h6>
                      <small className="text-muted">
                        {item.product?.description?.substring(0, 100)}
                        {item.product?.description?.length > 100 ? '...' : ''}
                      </small>
                    </Col>
                    <Col md={2} className="text-center">
                      <span>x{item.quantity}</span>
                    </Col>
                    <Col md={2} className="text-end">
                      <span>R$ {item.price?.toFixed(2)}</span>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
          
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Entrega</h5>
                </Card.Header>
                <Card.Body>
                  {order.shippingAddress && (
                    <address>
                      {order.shippingAddress.street}, {order.shippingAddress.number}
                      {order.shippingAddress.complement && 
                        <span>, {order.shippingAddress.complement}</span>}
                      <br />
                      {order.shippingAddress.city} - {order.shippingAddress.state}
                      <br />
                      CEP: {order.shippingAddress.zipCode}
                    </address>
                  )}
                  
                  {order.tracking && (
                    <div className="mt-3">
                      <h6>Informações de Rastreio:</h6>
                      <p className="mb-0">Código: {order.tracking.code}</p>
                      <p>Transportadora: {order.tracking.carrier}</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Pagamento</h5>
                </Card.Header>
                <Card.Body>
                  {order.payment && (
                    <>
                      <p>
                        <strong>Método:</strong> {getPaymentMethodText(order.payment.method)}
                      </p>
                      <p>
                        <strong>Status:</strong> {order.payment.status}
                      </p>
                      {order.payment.transactionId && (
                        <p className="mb-0">
                          <strong>Transação:</strong> {order.payment.transactionId}
                        </p>
                      )}
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
        
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Resumo</h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <div className="d-flex justify-content-between">
                  <span>Data do Pedido:</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
              </ListGroup.Item>
              <ListGroup.Item>
                <div className="d-flex justify-content-between">
                  <span>Subtotal:</span>
                  <span>R$ {(order.totalPrice - order.shippingPrice).toFixed(2)}</span>
                </div>
              </ListGroup.Item>
              <ListGroup.Item>
                <div className="d-flex justify-content-between">
                  <span>Frete:</span>
                  <span>R$ {order.shippingPrice?.toFixed(2)}</span>
                </div>
              </ListGroup.Item>
              <ListGroup.Item>
                <div className="d-flex justify-content-between fw-bold">
                  <span>Total:</span>
                  <span>R$ {order.totalPrice?.toFixed(2)}</span>
                </div>
              </ListGroup.Item>
            </ListGroup>
          </Card>
          
          <div className="d-grid gap-2">
            <Link to="/orders" className="btn btn-outline-primary">
              Voltar para Meus Pedidos
            </Link>
            {order.status === 'pending' && (
              <button className="btn btn-outline-danger">
                Cancelar Pedido
              </button>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderDetails; 