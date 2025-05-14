import React, { useState, useEffect } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, ListGroup, Row, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import CartService from '../services/CartService';
import axios from 'axios';

const CheckoutDemo = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const navigate = useNavigate();
  
  // Dados do formulário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: 'credit_card',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: ''
  });
  
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        // Verificar se estamos em modo de demonstração
        const isDemoMode = CartService.isDemoMode();
        if (!isDemoMode) {
          navigate('/checkout');
          return;
        }
        
        // Buscar itens do carrinho
        const items = await CartService.getCartItems();
        if (!items || items.length === 0) {
          navigate('/cart');
          return;
        }
        
        setCartItems(items);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar carrinho para checkout:', err);
        setError('Erro ao carregar os itens do carrinho. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    fetchCartItems();
  }, [navigate]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const calculateShipping = () => {
    return 15.00; // Valor fixo para exemplo
  };
  
  const calculateTotal = () => {
    return (calculateSubtotal() + calculateShipping()).toFixed(2);
  };
  
  // Função para conectar ao websocket para receber atualizações de pagamento do RabbitMQ
  const listenForPaymentUpdates = (orderId) => {
    // URL do WebSocket para escutar atualizações de pagamento
    const wsUrl = `ws://${window.location.hostname}:${window.location.port}/api/ws/payments/${orderId}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Conexão estabelecida com o servidor de pagamentos');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === 'APPROVED') {
        setPaymentStatus('APPROVED');
        ws.close();
      } else if (data.status === 'REJECTED') {
        setPaymentStatus('REJECTED');
        setError('Pagamento rejeitado. Por favor, tente novamente com outro método de pagamento.');
        ws.close();
      }
    };
    
    ws.onerror = (error) => {
      console.error('Erro na conexão WebSocket:', error);
      // Fallback: verificar status por polling se WebSocket falhar
      startPaymentStatusPolling(orderId);
    };
    
    return ws;
  };
  
  // Função para verificar status de pagamento usando API de produção
  const startPaymentStatusPolling = (orderId) => {
    const pollingInterval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/payments/order/${orderId}`, {
          headers: {
            'Authorization': `Bearer demo-token`,
            'X-Demo-Mode': 'true'
          }
        });
        
        if (response.data.status === 'APPROVED') {
          setPaymentStatus('APPROVED');
          clearInterval(pollingInterval);
        } else if (response.data.status === 'REJECTED') {
          setPaymentStatus('REJECTED');
          setError('Pagamento rejeitado. Por favor, tente novamente com outro método de pagamento.');
          clearInterval(pollingInterval);
        }
      } catch (err) {
        console.error('Erro ao verificar status do pagamento:', err);
      }
    }, 3000); // Verificar a cada 3 segundos
    
    return pollingInterval;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessingOrder(true);
    
    try {
      // Gerar número de pedido aleatório
      const randomOrderNumber = Math.floor(100000 + Math.random() * 900000);
      setOrderNumber(randomOrderNumber);
      setPaymentStatus('PENDING');
      
      // Atualizar o estoque para cada item mesmo em modo demo
      try {
        // Obter token demo
        const demoToken = localStorage.getItem('demo_token') || 'demo-token';
        
        for (const item of cartItems) {
          await axios.put(`/api/products/${item.id}/stock?quantity=-${item.quantity}`, {}, {
            headers: {
              'Authorization': `Bearer ${demoToken}`,
              'X-Demo-Mode': 'true'
            }
          });
        }
      } catch (stockErr) {
        console.error('Erro ao atualizar estoque em modo demo:', stockErr);
      }
      
      // Enviar informações de pagamento para processamento
      const paymentRequest = {
        orderId: parseInt(randomOrderNumber.toString()),
        userId: "demo-user",
        amount: parseFloat(calculateTotal()),
        paymentMethod: formData.paymentMethod.toUpperCase()
      };
      
      try {
        // Use o endpoint de teste que sabemos que funciona via curl
        await axios.post('/api/payments', paymentRequest, {
          headers: {
            'Content-Type': 'application/json',
            'X-Demo-Mode': 'true',
            'Authorization': 'Bearer demo-token'
          }
        });
        
        // Iniciar a escuta por atualizações de pagamento
        const connection = listenForPaymentUpdates(randomOrderNumber.toString());
        
        // Simular uma resposta de aprovação após alguns segundos (apenas para demonstração)
        setTimeout(() => {
          setPaymentStatus('APPROVED');
          if (connection) {
            if (connection instanceof WebSocket) {
              connection.close();
            } else {
              clearInterval(connection);
            }
          }
          
          // Limpar o carrinho quando o pagamento for aprovado
          CartService.clearCart().then(() => {
            // Atualizar o header com a nova contagem do carrinho
            const event = new CustomEvent('cart-updated');
            window.dispatchEvent(event);
            
            // Mostrar sucesso após status de pagamento aprovado
            setOrderSuccess(true);
            setProcessingOrder(false);
          });
          
        }, 5000);
        
      } catch (paymentErr) {
        console.error('Erro ao processar pagamento em modo demo:', paymentErr);
        setError('Erro ao processar pagamento. Por favor, tente novamente.');
        setProcessingOrder(false);
        return;
      }
    } catch (err) {
      console.error('Erro ao processar pedido demo:', err);
      setError('Erro ao processar o pedido. Por favor, tente novamente.');
      setProcessingOrder(false);
    }
  };
  
  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" />
        <p className="mt-3">Carregando informações do checkout...</p>
      </Container>
    );
  }
  
  // Tela de espera de pagamento
  if (paymentStatus === 'PENDING') {
    return (
      <Container className="py-5">
        <Card className="text-center p-5 shadow-sm">
          <Alert variant="info" className="mb-4">
            <h1>Aguardando Confirmação de Pagamento</h1>
            <p className="lead">Seu pedido foi criado e estamos processando o pagamento</p>
            <Badge bg="warning" text="dark">DEMONSTRAÇÃO</Badge>
          </Alert>
          
          <div className="text-center my-4">
            <Spinner animation="border" variant="primary" style={{ width: '4rem', height: '4rem' }} />
            <h4 className="mt-4">Processando seu pagamento...</h4>
            <p>Não feche esta janela. Você será redirecionado automaticamente quando o pagamento for confirmado.</p>
          </div>
          
          <div className="text-start my-4">
            <h4>Resumo do Pedido #{orderNumber}</h4>
            <p><strong>Data:</strong> {new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Total:</strong> R$ {calculateTotal()}</p>
            <p>
              <strong>Status:</strong>{' '}
              <span className="badge bg-warning text-dark">Aguardando Pagamento</span>
            </p>
          </div>
        </Card>
      </Container>
    );
  }
  
  if (orderSuccess) {
    return (
      <Container className="py-5">
        <Card className="text-center p-5 shadow-sm">
          <Alert variant="success" className="mb-4">
            <h1>Pedido Realizado com Sucesso!</h1>
            <p className="lead">Obrigado pela sua compra no modo de demonstração</p>
            <Badge bg="warning" text="dark">DEMONSTRAÇÃO</Badge>
          </Alert>
          
          <div className="text-start my-4">
            <h4>Resumo do Pedido #{orderNumber}</h4>
            <p><strong>Data:</strong> {new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Total:</strong> R$ {calculateTotal()}</p>
            <p>
              <strong>Status:</strong>{' '}
              {paymentStatus === 'APPROVED' ? (
                <span className="badge bg-success">Pagamento Confirmado</span>
              ) : (
                <span className="badge bg-info">Processando (Demo)</span>
              )}
            </p>
            
            <h5 className="mt-4">Informações de Entrega</h5>
            <p>
              {formData.address}<br />
              {formData.city} - {formData.state}<br />
              CEP: {formData.zipCode}
            </p>
            
            <h5 className="mt-4">Método de Pagamento</h5>
            <p>
              {formData.paymentMethod === 'credit_card' 
                ? 'Cartão de Crédito (Simulado)' 
                : 'Boleto Bancário (Simulado)'}
            </p>
          </div>
          
          <div className="mt-4">
            <Link to="/" className="btn btn-primary">
              Continuar Comprando
            </Link>
          </div>
        </Card>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <h2 className="mb-3">
        Finalizar Compra 
        <Badge bg="warning" text="dark" className="ms-2">Modo de Demonstração</Badge>
      </h2>
      
      <Alert variant="info">
        <Alert.Heading>Modo de Demonstração</Alert.Heading>
        <p>
          Este é um checkout simulado. Nenhum pagamento real será processado e nenhum pedido real será criado.
          Os dados inseridos não serão armazenados no servidor.
        </p>
      </Alert>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col lg={8}>
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Informações de Entrega</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nome Completo</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Endereço</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
                
                <Row>
                  <Col md={5}>
                    <Form.Group className="mb-3">
                      <Form.Label>Cidade</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Estado</Form.Label>
                      <Form.Control
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>CEP</Form.Label>
                      <Form.Control
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Método de Pagamento</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="radio"
                    id="credit-card"
                    label="Cartão de Crédito"
                    name="paymentMethod"
                    value="credit_card"
                    checked={formData.paymentMethod === 'credit_card'}
                    onChange={handleInputChange}
                  />
                  <Form.Check
                    type="radio"
                    id="boleto"
                    label="Boleto Bancário"
                    name="paymentMethod"
                    value="boleto"
                    checked={formData.paymentMethod === 'boleto'}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                
                {formData.paymentMethod === 'credit_card' && (
                  <div className="mt-3">
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Número do Cartão</Form.Label>
                          <Form.Control
                            type="text"
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                            placeholder="0000 0000 0000 0000"
                            required={formData.paymentMethod === 'credit_card'}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nome no Cartão</Form.Label>
                          <Form.Control
                            type="text"
                            name="cardName"
                            value={formData.cardName}
                            onChange={handleInputChange}
                            required={formData.paymentMethod === 'credit_card'}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Validade</Form.Label>
                          <Form.Control
                            type="text"
                            name="cardExpiry"
                            value={formData.cardExpiry}
                            onChange={handleInputChange}
                            placeholder="MM/AA"
                            required={formData.paymentMethod === 'credit_card'}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>CVV</Form.Label>
                          <Form.Control
                            type="text"
                            name="cardCvv"
                            value={formData.cardCvv}
                            onChange={handleInputChange}
                            placeholder="123"
                            required={formData.paymentMethod === 'credit_card'}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}
                
                {formData.paymentMethod === 'boleto' && (
                  <Alert variant="secondary" className="mt-3">
                    <p className="mb-0">Após a confirmação do pedido, um boleto simulado será gerado.</p>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Resumo do Pedido</h5>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  {cartItems.map(item => (
                    <ListGroup.Item key={item.id}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <span>{item.name} </span>
                          <span className="text-muted">× {item.quantity}</span>
                        </div>
                        <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </ListGroup.Item>
                  ))}
                  
                  <ListGroup.Item>
                    <div className="d-flex justify-content-between">
                      <span>Subtotal</span>
                      <span>R$ {calculateSubtotal().toFixed(2)}</span>
                    </div>
                  </ListGroup.Item>
                  
                  <ListGroup.Item>
                    <div className="d-flex justify-content-between">
                      <span>Frete</span>
                      <span>R$ {calculateShipping().toFixed(2)}</span>
                    </div>
                  </ListGroup.Item>
                  
                  <ListGroup.Item>
                    <div className="d-flex justify-content-between fw-bold">
                      <span>Total</span>
                      <span>R$ {calculateTotal()}</span>
                    </div>
                  </ListGroup.Item>
                </ListGroup>
                
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="lg" 
                  className="w-100 mt-3"
                  disabled={processingOrder}
                >
                  {processingOrder ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />{' '}
                      Processando...
                    </>
                  ) : (
                    'Finalizar Compra'
                  )}
                </Button>
                <p className="text-center mt-2">
                  <small className="text-muted">
                    Este é um pagamento simulado no modo de demonstração.
                  </small>
                </p>
              </Card.Body>
            </Card>
            
            <div className="text-center">
              <Link to="/cart" className="btn btn-outline-secondary">
                Voltar ao Carrinho
              </Link>
            </div>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default CheckoutDemo; 