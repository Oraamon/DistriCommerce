import React, { useState, useEffect } from 'react';
import { Button, Card, Col, Container, Form, ListGroup, Row, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CartService from '../services/CartService';
import AuthService from '../services/AuthService';
import PaymentService from '../services/PaymentService';
import AddressService from '../services/AddressService';
import CreditCardForm from '../components/CreditCardForm';

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
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });
  
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [cepSuccess, setCepSuccess] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  const [showTestCards, setShowTestCards] = useState(false);
  
  const testCards = [
    {
      bankName: 'Visa Internacional',
      number: '4111 1111 1111 1111',
      name: 'TESTE VISA',
      expiry: '12/28',
      cvv: '123',
      brand: 'visa'
    },
    {
      bankName: 'Mastercard Internacional',
      number: '5555 5555 5555 4444',
      name: 'TESTE MASTERCARD',
      expiry: '12/28',
      cvv: '123',
      brand: 'mastercard'
    },
    {
      bankName: 'American Express',
      number: '3782 8224 6310 005',
      name: 'TESTE AMEX',
      expiry: '12/28',
      cvv: '1234',
      brand: 'amex'
    },
    {
      bankName: 'Nubank Roxinho',
      number: '5067 1234 5678 9012',
      name: 'TESTE NUBANK',
      expiry: '12/28',
      cvv: '123',
      brand: 'nubank'
    },
    {
      bankName: 'C6 Bank Amarelo',
      number: '6277 8012 3456 7890',
      name: 'TESTE C6 BANK',
      expiry: '12/28',
      cvv: '123',
      brand: 'c6bank'
    },
    {
      bankName: 'Bradesco Vermelho',
      number: '5078 1234 5678 9012',
      name: 'TESTE BRADESCO',
      expiry: '12/28',
      cvv: '123',
      brand: 'bradesco'
    },
    {
      bankName: 'Santander Vermelho',
      number: '4389 1234 5678 9012',
      name: 'TESTE SANTANDER',
      expiry: '12/28',
      cvv: '123',
      brand: 'santander'
    },
    {
      bankName: 'Itaú Laranja',
      number: '6062 8212 3456 7890',
      name: 'TESTE ITAU',
      expiry: '12/28',
      cvv: '123',
      brand: 'itau'
    }
  ];
  
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
  
  const handleCEPChange = async (e) => {
    const cep = e.target.value;
    const formattedCep = AddressService.formatCEP(cep);
    
    setShippingAddress({
      ...shippingAddress,
      zipCode: formattedCep
    });
    
    setCepError('');
    setCepSuccess('');
    
    if (AddressService.validateCEP(formattedCep)) {
      setCepLoading(true);
      
      try {
        const addressData = await AddressService.getAddressByCEP(formattedCep);
        
        setShippingAddress(prev => ({
          ...prev,
          street: addressData.street,
          neighborhood: addressData.neighborhood,
          city: addressData.city,
          state: addressData.state,
          complement: prev.complement || addressData.complement
        }));
        
        setCepSuccess('Endereço encontrado e preenchido automaticamente!');
        
        setTimeout(() => setCepSuccess(''), 3000);
        
      } catch (error) {
        setCepError(error.message);
        setTimeout(() => setCepError(''), 5000);
      } finally {
        setCepLoading(false);
      }
    }
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
    return 15.00;
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
        console.log('Processando pedido em modo de demonstração');
        
        orderId = 'order_' + Date.now();
        
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
          shippingAddress: {
            street: shippingAddress.street,
            number: shippingAddress.number,
            complement: shippingAddress.complement,
            neighborhood: shippingAddress.neighborhood,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zipCode: shippingAddress.zipCode
          },
          deliveryAddress: `${shippingAddress.street}, ${shippingAddress.number}${shippingAddress.complement ? ', ' + shippingAddress.complement : ''}, ${shippingAddress.neighborhood}, ${shippingAddress.city} - ${shippingAddress.state}, ${shippingAddress.zipCode}`,
          shippingPrice: calculateShipping(),
          payment: {
            method: paymentMethod,
            status: 'approved',
            transactionId: 'demo_txn_' + Math.random().toString(36).substring(2)
          }
        };
        
        existingOrders.push(newOrder);
        localStorage.setItem('demo_orders', JSON.stringify(existingOrders));
        
        CartService.clearCart();
        
        const event = new CustomEvent('cart-updated');
        window.dispatchEvent(event);
        
        try {
          console.log('Atualizando estoque em modo demo...');
          await PaymentService.updateProductStock(cartItems, 'decrease');
          console.log('Estoque atualizado com sucesso em modo demo');
        } catch (stockErr) {
          console.error('Erro ao atualizar estoque em modo demo:', stockErr);
        }
      } else {
        const fullAddress = `${shippingAddress.street}, ${shippingAddress.number}${shippingAddress.complement ? ', ' + shippingAddress.complement : ''}, ${shippingAddress.neighborhood}, ${shippingAddress.city} - ${shippingAddress.state}, ${shippingAddress.zipCode}`;
        
        const orderResponse = await axios.post('/api/orders', {
          userId: AuthService.getCurrentUser()?.id || "anonymous",
          deliveryAddress: fullAddress,
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
        
        await CartService.clearCart();
        
        const event = new CustomEvent('cart-updated');
        window.dispatchEvent(event);
      }
      
      try {
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
          orderItems: cartItems.map(item => ({
            productId: item.productId || item.id,
            quantity: item.quantity,
            price: item.price
          }))
        };
        
        console.log('Enviando solicitação de pagamento:', paymentRequest);
        
        const paymentResponse = await PaymentService.processPayment(paymentRequest);
        
        console.log('Resposta do processamento de pagamento:', paymentResponse);
      } catch (paymentErr) {
        console.error('Erro ao solicitar processamento de pagamento:', paymentErr);
      }
      
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
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>CEP</Form.Label>
                      <div className="position-relative">
                        <Form.Control 
                          type="text" 
                          name="zipCode" 
                          value={shippingAddress.zipCode} 
                          onChange={handleCEPChange}
                          placeholder="00000-000"
                          maxLength="9"
                          required
                        />
                        {cepLoading && (
                          <div className="position-absolute" style={{ top: '50%', right: '10px', transform: 'translateY(-50%)' }}>
                            <Spinner animation="border" size="sm" />
                          </div>
                        )}
                      </div>
                      {cepError && (
                        <div className="text-danger mt-1" style={{ fontSize: '0.875em' }}>
                          {cepError}
                        </div>
                      )}
                      {cepSuccess && (
                        <div className="text-success mt-1" style={{ fontSize: '0.875em' }}>
                          ✓ {cepSuccess}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
                
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
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Complemento</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="complement" 
                        value={shippingAddress.complement} 
                        onChange={handleShippingChange}
                        placeholder="Apartamento, bloco, etc."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Bairro</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="neighborhood" 
                        value={shippingAddress.neighborhood} 
                        onChange={handleShippingChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={8}>
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
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Estado</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="state" 
                        value={shippingAddress.state} 
                        onChange={handleShippingChange}
                        maxLength="2"
                        style={{ textTransform: 'uppercase' }}
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
                
                <Form.Group className="mb-4">
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
                    <Alert variant="info" className="mb-4">
                      <small>
                        <strong>💳 Teste com cartões reais:</strong> Use os cartões de teste fornecidos abaixo para simular diferentes bandeiras e bancos.
                      </small>
                    </Alert>
                    
                    <CreditCardForm 
                      cardInfo={cardInfo}
                      handleCardInfoChange={handleCardInfoChange}
                      testCards={testCards}
                      setTestCards={() => {}}
                      showTestCards={showTestCards}
                      setShowTestCards={setShowTestCards}
                    />
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