import React, { useState, useEffect } from 'react';
import { Button, Card, Col, Container, Form, ListGroup, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CartService from '../services/CartService';
import AuthService from '../services/AuthService';
import PaymentService from '../services/PaymentService';

const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const navigate = useNavigate();
  
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    number: '',
    complement: '',
    city: '',
    state: '',
    zipCode: '',
  });
  
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const token = AuthService.getAuthToken();
        if (!token || !AuthService.isAuthenticated()) {
          navigate('/login');
          return;
        }
        
        const response = await axios.get('/api/cart', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': AuthService.getCurrentUser()?.id
          }
        });
        
        const cartData = response.data.items || response.data;
        if (!cartData || cartData.length === 0) {
          navigate('/cart');
          return;
        }
        
        setCartItems(cartData);
        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar o carrinho. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    fetchCartItems();
  }, [navigate]);
  
  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress({
      ...shippingAddress,
      [name]: value
    });
  };
  
  const handleCardInfoChange = (e) => {
    const { name, value } = e.target;
    setCardInfo({
      ...cardInfo,
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
  
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setOrderProcessing(true);
    
    try {
      const token = AuthService.getAuthToken();
      const isDemo = CartService.isDemoMode();
      
      let orderId;
      
      if (isDemo) {
        // Em modo de demonstração, criamos um pedido local
        console.log('Processando pedido em modo de demonstração');
        
        // Gerar um ID de pedido simulado
        orderId = 'order_' + Date.now();
        
        // Salvar o pedido no localStorage para persistência
        const existingOrders = JSON.parse(localStorage.getItem('demo_orders') || '[]');
        
        const newOrder = {
          id: orderId,
          createdAt: new Date().toISOString(),
          totalPrice: parseFloat(calculateTotal()),
          status: 'processing',
          items: cartItems.map(item => ({
            id: item.id,
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          shippingAddress,
          shippingPrice: calculateShipping(),
          payment: {
            method: paymentMethod,
            status: 'approved',
            transactionId: 'demo_txn_' + Math.random().toString(36).substring(2)
          }
        };
        
        existingOrders.push(newOrder);
        localStorage.setItem('demo_orders', JSON.stringify(existingOrders));
        
        // Limpar o carrinho em modo demo
        CartService.clearCart();
        
        // Atualizar o header com a nova contagem do carrinho
        const event = new CustomEvent('cart-updated');
        window.dispatchEvent(event);
        
        // Em modo demo, atualizar estoque diretamente
        try {
          console.log('Atualizando estoque em modo demo...');
          await PaymentService.updateProductStock(cartItems, 'decrease');
          console.log('Estoque atualizado com sucesso em modo demo');
        } catch (stockErr) {
          console.error('Erro ao atualizar estoque em modo demo:', stockErr);
        }
      } else {
        // Fluxo normal com API
        // Cria uma ordem no serviço de pedidos
        const orderResponse = await axios.post('/api/orders', {
          userId: AuthService.getCurrentUser()?.id || "anonymous",
          deliveryAddress: `${shippingAddress.street}, ${shippingAddress.number}, ${shippingAddress.complement}, ${shippingAddress.city} - ${shippingAddress.state}, ${shippingAddress.zipCode}`,
          items: cartItems.map(item => ({
            productId: item.productId || item.id,
            quantity: item.quantity
          })),
          paymentMethod: paymentMethod.toUpperCase()
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        orderId = orderResponse.data.id;
        console.log('Pedido criado com sucesso:', orderResponse.data);
        
        // Limpar o carrinho após criar o pedido
        await CartService.clearCart();
        
        // Atualizar o header com a nova contagem do carrinho
        const event = new CustomEvent('cart-updated');
        window.dispatchEvent(event);
      }
      
      // Sempre enviar para o RabbitMQ, mesmo em modo demo
      try {
        // Preparar o objeto de pagamento
        const paymentRequest = {
          orderId: orderId,
          userId: AuthService.getCurrentUser()?.id || "anonymous",
          amount: parseFloat(calculateTotal()),
          paymentMethod: paymentMethod,
          cardInfo: paymentMethod === 'credit_card' ? {
            cardNumber: cardInfo.cardNumber,
            cardName: cardInfo.cardName,
            expiryDate: cardInfo.expiryDate,
            cvv: cardInfo.cvv
          } : null,
          // Incluir os itens para permitir que o serviço de pagamento atualize o estoque
          orderItems: cartItems.map(item => ({
            productId: item.productId || item.id,
            quantity: item.quantity,
            price: item.price
          }))
        };
        
        console.log('Enviando solicitação de pagamento:', paymentRequest);
        
        // Enviar para o serviço de pagamento através do gateway
        const paymentResponse = await PaymentService.processPayment(paymentRequest);
        
        console.log('Resposta do processamento de pagamento:', paymentResponse);
      } catch (paymentErr) {
        console.error('Erro ao solicitar processamento de pagamento:', paymentErr);
        // Não vamos tratar como erro fatal, apenas registrar
      }
      
      // Redirecionar para página de sucesso
      navigate(`/orders/${orderId}/success`);
    } catch (err) {
      console.error('Erro ao processar pedido:', err);
      setError('Erro ao processar o pedido. Por favor, tente novamente.');
      setOrderProcessing(false);
    }
  };
  
  if (loading) return <p>Carregando dados do checkout...</p>;
  if (error) return <p className="text-danger">{error}</p>;
  
  return (
    <Container>
      <h2 className="my-4">Finalizar Compra</h2>
      
      <Form onSubmit={handleSubmitOrder}>
        <Row>
          <Col md={8}>
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Endereço de Entrega</Card.Title>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Rua</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="street" 
                        value={shippingAddress.street} 
                        onChange={handleShippingChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Número</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="number" 
                        value={shippingAddress.number} 
                        onChange={handleShippingChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Complemento</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="complement" 
                    value={shippingAddress.complement} 
                    onChange={handleShippingChange}
                  />
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Cidade</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="city" 
                        value={shippingAddress.city} 
                        onChange={handleShippingChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Estado</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="state" 
                        value={shippingAddress.state} 
                        onChange={handleShippingChange}
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
                        value={shippingAddress.zipCode} 
                        onChange={handleShippingChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            
            <Card>
              <Card.Body>
                <Card.Title>Método de Pagamento</Card.Title>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="radio"
                    id="credit-card"
                    label="Cartão de Crédito"
                    name="paymentMethod"
                    value="credit_card"
                    checked={paymentMethod === 'credit_card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <Form.Check
                    type="radio"
                    id="boleto"
                    label="Boleto Bancário"
                    name="paymentMethod"
                    value="boleto"
                    checked={paymentMethod === 'boleto'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                </Form.Group>
                
                {paymentMethod === 'credit_card' && (
                  <div>
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Número do Cartão</Form.Label>
                          <Form.Control 
                            type="text" 
                            name="cardNumber" 
                            value={cardInfo.cardNumber} 
                            onChange={handleCardInfoChange}
                            required={paymentMethod === 'credit_card'}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nome no Cartão</Form.Label>
                          <Form.Control 
                            type="text" 
                            name="cardName" 
                            value={cardInfo.cardName} 
                            onChange={handleCardInfoChange}
                            required={paymentMethod === 'credit_card'}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Data de Validade</Form.Label>
                          <Form.Control 
                            type="text" 
                            name="expiryDate" 
                            placeholder="MM/AA"
                            value={cardInfo.expiryDate} 
                            onChange={handleCardInfoChange}
                            required={paymentMethod === 'credit_card'}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>CVV</Form.Label>
                          <Form.Control 
                            type="text" 
                            name="cvv" 
                            value={cardInfo.cvv} 
                            onChange={handleCardInfoChange}
                            required={paymentMethod === 'credit_card'}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card>
              <Card.Body>
                <Card.Title>Resumo do Pedido</Card.Title>
                <ListGroup variant="flush">
                  {cartItems.map(item => (
                    <ListGroup.Item key={item.id}>
                      <Row>
                        <Col md={8}>
                          <p>{item.name} x {item.quantity}</p>
                        </Col>
                        <Col md={4} className="text-end">
                          <p>R$ {(item.price * item.quantity).toFixed(2)}</p>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                  
                  <ListGroup.Item>
                    <Row>
                      <Col>Subtotal:</Col>
                      <Col className="text-end">R$ {calculateSubtotal().toFixed(2)}</Col>
                    </Row>
                  </ListGroup.Item>
                  
                  <ListGroup.Item>
                    <Row>
                      <Col>Frete:</Col>
                      <Col className="text-end">R$ {calculateShipping().toFixed(2)}</Col>
                    </Row>
                  </ListGroup.Item>
                  
                  <ListGroup.Item>
                    <Row>
                      <Col><strong>Total:</strong></Col>
                      <Col className="text-end">
                        <strong>R$ {calculateTotal()}</strong>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                </ListGroup>
                
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 mt-3"
                  disabled={orderProcessing}
                >
                  {orderProcessing ? 'Processando...' : 'Finalizar Pedido'}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default Checkout; 