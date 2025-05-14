import React, { useState, useEffect } from 'react';
import { Alert, Badge, Card, Col, Container, ListGroup, Row, Spinner } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthService from '../services/AuthService';

const OrderDetails = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // Usar o AuthService para obter o token
        const token = AuthService.getAuthToken();
        const user = AuthService.getCurrentUser();
        
        // Verificar se usuário está autenticado
        if (!token || !user) {
          console.log("OrderDetails - Redirecionando para login - token ou user ausente");
          navigate('/login');
          return;
        }
        
        // Verificar se há pedidos no localStorage (demo)
        const demoOrders = JSON.parse(localStorage.getItem('demo_orders') || '[]');
        const foundDemoOrder = demoOrders.find(order => order.id === orderId);
        
        if (foundDemoOrder) {
          console.log("OrderDetails - Usando dados de pedido demo:", foundDemoOrder);
          setOrder(foundDemoOrder);
          setLoading(false);
          return;
        }
        
        // Fazer a requisição real do pedido
        try {
          const response = await axios.get(`/api/orders/${orderId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          setOrder(response.data);
        } catch (apiError) {
          console.error("Erro ao buscar detalhes do pedido:", apiError);
          
          // Se estamos em ambiente de desenvolvimento, criar um pedido simulado
          if (process.env.NODE_ENV === 'development') {
            console.log("OrderDetails - Criando pedido de teste em desenvolvimento");
            setOrder({
              id: orderId,
              createdAt: new Date().toISOString(),
              status: 'processing',
              totalPrice: 456.78,
              items: [
                {
                  id: 1,
                  quantity: 2,
                  price: 99.99,
                  product: {
                    id: 'p1',
                    name: 'Produto de Teste',
                    description: 'Este é um produto de teste para desenvolvimento',
                    imageUrl: 'https://via.placeholder.com/80'
                  }
                },
                {
                  id: 2,
                  quantity: 1,
                  price: 256.80,
                  product: {
                    id: 'p2',
                    name: 'Outro Produto',
                    description: 'Descrição do outro produto de teste',
                    imageUrl: 'https://via.placeholder.com/80'
                  }
                }
              ],
              shippingAddress: {
                street: 'Rua de Teste',
                number: '123',
                complement: 'Apto 101',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01234-567'
              },
              payment: {
                method: 'credit_card',
                status: 'approved',
                transactionId: 'txn_' + Math.random().toString(36).substring(2)
              }
            });
          } else {
            throw apiError;
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Erro ao buscar detalhes do pedido:", err);
        setError('Erro ao carregar os detalhes do pedido. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, navigate]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Data indisponível';
    
    try {
      const date = new Date(dateString);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return 'Data indisponível';
      }
      
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return date.toLocaleDateString('pt-BR', options);
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data indisponível';
    }
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
  
  if (loading) return (
    <div className="text-center my-5">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Carregando...</span>
      </Spinner>
    </div>
  );
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
                <ListGroup.Item key={item.id || `item-${Math.random()}`}>
                  <Row className="align-items-center">
                    <Col md={2}>
                      <img 
                        src={item.product?.imageUrl || item.imageUrl || 'https://via.placeholder.com/80'}
                        alt={item.product?.name || item.name || 'Produto'}
                        className="img-fluid rounded"
                      />
                    </Col>
                    <Col md={6}>
                      <h6>{item.product?.name || item.name || 'Produto'}</h6>
                      <small className="text-muted">
                        {(item.product?.description || item.description || '').substring(0, 100)}
                        {(item.product?.description || item.description || '').length > 100 ? '...' : ''}
                      </small>
                    </Col>
                    <Col md={2} className="text-center">
                      <span>x{item.quantity}</span>
                    </Col>
                    <Col md={2} className="text-end">
                      <span>R$ {(item.price || 0).toFixed(2)}</span>
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
                  <span>{formatDate(order.createdAt || order.orderDate)}</span>
                </div>
              </ListGroup.Item>
              <ListGroup.Item>
                <div className="d-flex justify-content-between">
                  <span>Subtotal:</span>
                  <span>R$ {((order.totalPrice || order.totalAmount || 0) - (order.shippingPrice || 0)).toFixed(2)}</span>
                </div>
              </ListGroup.Item>
              <ListGroup.Item>
                <div className="d-flex justify-content-between">
                  <span>Frete:</span>
                  <span>R$ {(order.shippingPrice || 0).toFixed(2)}</span>
                </div>
              </ListGroup.Item>
              <ListGroup.Item>
                <div className="d-flex justify-content-between fw-bold">
                  <span>Total:</span>
                  <span>R$ {(order.totalPrice || order.totalAmount || 0).toFixed(2)}</span>
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