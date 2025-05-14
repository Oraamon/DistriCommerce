import React, { useState, useEffect } from 'react';
import { Container, Card, Alert, Button, Spinner, ListGroup, Badge, Row, Col } from 'react-bootstrap';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import PaymentService from '../services/PaymentService';
import axios from 'axios';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar se temos um orderId na URL ou usar o último pedido do localStorage
    const orderIdToUse = orderId || getLastOrderId();
    
    if (!orderIdToUse) {
      setError('Não foi possível encontrar informações do pedido.');
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        
        // Tentar obter detalhes do pedido da API
        try {
          const orderResponse = await axios.get(`/api/orders/${orderIdToUse}`);
          setOrderDetails(orderResponse.data);
          console.log('Detalhes do pedido:', orderResponse.data);
        } catch (orderErr) {
          console.error('Erro ao buscar detalhes do pedido:', orderErr);
          // Usar dados do último pedido do localStorage como fallback
          const lastOrder = JSON.parse(localStorage.getItem('lastOrder') || '{}');
          if (lastOrder && lastOrder.number) {
            setOrderDetails(lastOrder);
          }
        }
        
        // Obter status do pagamento
        try {
          const payment = await PaymentService.checkPaymentStatus(`order/${orderIdToUse}`);
          setPaymentStatus(payment);
        } catch (paymentErr) {
          console.error('Erro ao verificar status do pagamento:', paymentErr);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao processar detalhes do pedido:', err);
        setError('Ocorreu um erro ao carregar os detalhes do pedido.');
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, navigate]);

  // Função para obter o ID do último pedido do localStorage
  const getLastOrderId = () => {
    const lastOrder = JSON.parse(localStorage.getItem('lastOrder') || '{}');
    return lastOrder.number;
  };

  const getStatusBadge = () => {
    // Se temos detalhes do pedido, usamos o status do pedido
    if (orderDetails && orderDetails.status) {
      const status = orderDetails.status;
      
      switch (status) {
        case 'CONFIRMED':
          return <Alert variant="success">Status do Pedido: Confirmado</Alert>;
        case 'PENDING':
          return <Alert variant="warning">Status do Pedido: Pendente</Alert>;
        case 'SHIPPED':
          return <Alert variant="info">Status do Pedido: Enviado</Alert>;
        case 'DELIVERED':
          return <Alert variant="success">Status do Pedido: Entregue</Alert>;
        case 'CANCELLED':
          return <Alert variant="danger">Status do Pedido: Cancelado</Alert>;
        default:
          return <Alert variant="info">Status do Pedido: {status}</Alert>;
      }
    }
    
    // Fallback: Usar o status do pagamento
    if (!paymentStatus) return null;

    let badgeClass = 'info';
    let statusText = 'Processando';

    switch (paymentStatus.status?.toUpperCase()) {
      case 'APPROVED':
        badgeClass = 'success';
        statusText = 'Aprovado';
        break;
      case 'COMPLETED':
        badgeClass = 'success';
        statusText = 'Concluído';
        break;
      case 'REJECTED':
        badgeClass = 'danger';
        statusText = 'Rejeitado';
        break;
      case 'FAILED':
        badgeClass = 'danger';
        statusText = 'Falhou';
        break;
      case 'PENDING':
        badgeClass = 'warning';
        statusText = 'Pendente';
        break;
      default:
        badgeClass = 'info';
        statusText = 'Processando';
    }

    return <Alert variant={badgeClass}>Status do Pagamento: {statusText}</Alert>;
  };

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'Data indisponível';
    
    try {
      const date = new Date(dateString);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return 'Data indisponível';
      }
      
      return date.toLocaleString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data indisponível';
    }
  };

  return (
    <Container className="my-5">
      <Card className="p-4 shadow">
        <Card.Body>
          <div className="text-center mb-4">
            <Card.Title as="h2">Pedido Realizado com Sucesso!</Card.Title>
            {orderDetails && (
              <Badge bg="success" className="p-2 mt-2">Pedido #{orderDetails.id || orderDetails.number}</Badge>
            )}
          </div>
          
          {loading ? (
            <div className="text-center my-4">
              <Spinner animation="border" />
              <p className="mt-2">Carregando detalhes do pedido...</p>
            </div>
          ) : error ? (
            <Alert variant="warning">{error}</Alert>
          ) : (
            <>
              {getStatusBadge()}
              
              {orderDetails && (
                <div className="my-4">
                  <h4>Detalhes do Pedido</h4>
                  <Row className="mb-3">
                    <Col md={6}>
                      <p><strong>Data do Pedido:</strong> {formatDate(orderDetails.createdAt || orderDetails.date)}</p>
                      <p><strong>Total:</strong> R$ {typeof orderDetails.totalAmount === 'number' ? 
                        orderDetails.totalAmount.toFixed(2) : orderDetails.total}</p>
                      <p><strong>Método de Pagamento:</strong> {orderDetails.paymentMethod || paymentStatus?.paymentMethod || 'Não disponível'}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Endereço de Entrega:</strong> {orderDetails.deliveryAddress || 'Não disponível'}</p>
                      {orderDetails.trackingNumber && (
                        <p><strong>Código de Rastreamento:</strong> {orderDetails.trackingNumber}</p>
                      )}
                    </Col>
                  </Row>
                  
                  <h4 className="mt-4">Itens do Pedido</h4>
                  <ListGroup variant="flush" className="mt-3">
                    {(orderDetails.items || []).map((item, index) => (
                      <ListGroup.Item key={index} className="py-3">
                        <Row className="align-items-center">
                          <Col md={6}>
                            <h5>{item.productName || item.name || item.product?.name || 'Produto'}</h5>
                            {item.description && (
                              <small className="text-muted d-block mb-1">{item.description}</small>
                            )}
                          </Col>
                          <Col md={2} className="text-center">
                            <span className="fw-bold">Qtd: {item.quantity}</span>
                          </Col>
                          <Col md={2} className="text-end">
                            <span>R$ {(item.price || 0).toFixed(2)}</span>
                          </Col>
                          <Col md={2} className="text-end">
                            <strong>R$ {item.subtotal?.toFixed(2) || ((item.price || 0) * item.quantity).toFixed(2)}</strong>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                  
                  <div className="text-end mt-3">
                    <h5>Total: R$ {typeof orderDetails.totalAmount === 'number' ? 
                      orderDetails.totalAmount.toFixed(2) : typeof orderDetails.total === 'number' ? 
                      orderDetails.total.toFixed(2) : orderDetails.total || '0.00'}</h5>
                  </div>
                </div>
              )}
              
              {!orderDetails && paymentStatus && (
                <div className="my-3">
                  <h4>Informações de Pagamento</h4>
                  <p><strong>Método de Pagamento:</strong> {paymentStatus.paymentMethod}</p>
                  {paymentStatus.transactionId && (
                    <p><strong>ID da Transação:</strong> {paymentStatus.transactionId}</p>
                  )}
                  {paymentStatus.paymentDate && (
                    <p><strong>Data do Pagamento:</strong> {formatDate(paymentStatus.paymentDate)}</p>
                  )}
                  {paymentStatus.amount && (
                    <p><strong>Valor:</strong> R$ {parseFloat(paymentStatus.amount).toFixed(2)}</p>
                  )}
                </div>
              )}
            </>
          )}
          
          <div className="mt-4 text-center">
            <Link to="/orders">
              <Button variant="primary" className="me-3">Ver Meus Pedidos</Button>
            </Link>
            <Link to="/">
              <Button variant="outline-primary">Continuar Comprando</Button>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderSuccess; 