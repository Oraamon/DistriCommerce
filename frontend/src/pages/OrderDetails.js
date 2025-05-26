import React, { useState, useEffect } from 'react';
import { Alert, Badge, Card, Col, Container, ListGroup, Row, Spinner, Button, Modal } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthService from '../services/AuthService';
import PaymentService from '../services/PaymentService';

const OrderDetails = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState(false);
  const [refundError, setRefundError] = useState(null);
  
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
  
  const handleRefund = async () => {
    setRefundLoading(true);
    setRefundError(null);
    
    try {
      // Fazer o pedido de reembolso com os itens para atualização de estoque
      const refundResponse = await PaymentService.requestRefund(order.id, {
        amount: order.totalAmount || order.total,
        items: order.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      });
      
      console.log('Reembolso processado:', refundResponse);
      setRefundSuccess(true);
      
      // Atualizar o status do pedido na interface
      setOrder({
        ...order,
        status: 'REFUNDED'
      });
    } catch (error) {
      console.error('Erro ao processar reembolso:', error);
      setRefundError('Falha ao processar o reembolso. Por favor, tente novamente.');
    } finally {
      setRefundLoading(false);
    }
  };
  
  const canRefund = order && 
    (order.status === 'COMPLETED' || order.status === 'CONFIRMED' || order.status === 'PENDING') &&
    order.payment?.status !== 'REFUNDED';
  
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
        <div className="d-flex align-items-center gap-3">
          <Badge bg={getStatusBadgeVariant(order.status)} className="fs-6 py-2 px-3">
            {getStatusText(order.status)}
          </Badge>
          
          {canRefund && (
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={() => setShowRefundModal(true)}
            >
              Solicitar Reembolso
            </Button>
          )}
        </div>
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
                        src={item.product?.images?.[0] || item.images?.[0] || 'https://via.placeholder.com/80'}
                        alt={item.productName || item.product?.name || item.name || 'Produto'}
                        className="img-fluid rounded"
                      />
                    </Col>
                    <Col md={6}>
                      <h6>{item.productName || item.product?.name || item.name || 'Produto'}</h6>
                      <p className="text-muted mb-0">
                        ID: {item.productId}
                      </p>
                      <small className="text-muted">
                        {(item.product?.description || item.description || '').substring(0, 100)}
                        {(item.product?.description || item.description || '').length > 100 ? '...' : ''}
                      </small>
                    </Col>
                    <Col md={2} className="text-center">
                      <span>x{item.quantity}</span>
                    </Col>
                    <Col md={2} className="text-end">
                      <span>R$ {(item.price || item.subtotal/item.quantity || 0).toFixed(2)}</span>
                      {item.subtotal && (
                        <p className="text-muted mb-0">
                          <small>Total: R$ {item.subtotal.toFixed(2)}</small>
                        </p>
                      )}
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
      
      {/* Modal de confirmação de reembolso */}
      <Modal show={showRefundModal} onHide={() => !refundLoading && setShowRefundModal(false)}>
        <Modal.Header closeButton={!refundLoading}>
          <Modal.Title>Confirmar Reembolso</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {refundLoading ? (
            <div className="text-center my-4">
              <Spinner animation="border" />
              <p className="mt-2">Processando reembolso...</p>
            </div>
          ) : refundSuccess ? (
            <Alert variant="success">
              Reembolso processado com sucesso. O estoque dos produtos foi atualizado.
            </Alert>
          ) : (
            <>
              <p>Tem certeza que deseja solicitar o reembolso deste pedido?</p>
              <p>Esta ação irá:</p>
              <ul>
                <li>Cancelar seu pedido</li>
                <li>Iniciar o processo de reembolso</li>
                <li>Devolver os itens ao estoque</li>
              </ul>
              {refundError && <Alert variant="danger">{refundError}</Alert>}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!refundLoading && !refundSuccess && (
            <>
              <Button variant="secondary" onClick={() => setShowRefundModal(false)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleRefund}>
                Confirmar Reembolso
              </Button>
            </>
          )}
          {refundSuccess && (
            <Button variant="primary" onClick={() => setShowRefundModal(false)}>
              Fechar
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OrderDetails; 