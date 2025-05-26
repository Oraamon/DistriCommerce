import React, { useState, useEffect } from 'react';
import { Alert, Button, Card, Col, Container, ListGroup, Row, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import CartService from '../services/CartService';
import axios from 'axios';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [stockLevels, setStockLevels] = useState({});
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        // Verificar se estamos em modo de demonstração
        const isDemoMode = CartService.isDemoMode();
        setDemoMode(isDemoMode);
        
        // Se não estamos em modo de demonstração, verificar autenticação
        if (!isDemoMode) {
          const isAuthenticated = AuthService.isAuthenticated();
          if (!isAuthenticated) {
            navigate('/login');
            return;
          }
        }
        
        // Buscar itens do carrinho usando o CartService
        const items = await CartService.getCartItems();
        setCartItems(items);
        
        // Buscar níveis de estoque para cada produto
        const stockData = {};
        for (const item of items) {
          try {
            const response = await axios.get(`/api/products/${item.productId || item.id}`);
            stockData[item.productId || item.id] = response.data.quantity;
          } catch (err) {
            console.error(`Erro ao buscar estoque para o produto ${item.productId || item.id}:`, err);
            stockData[item.productId || item.id] = 0;
          }
        }
        setStockLevels(stockData);
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar carrinho:', err);
        setError('Erro ao carregar o carrinho. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    fetchCartItems();
  }, [navigate]);
  
  const handleRemoveItem = async (itemId) => {
    try {
      await CartService.removeItem(itemId);
      // Atualizar apenas o item removido
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
      
      // Atualizar o header com a nova contagem do carrinho
      const event = new CustomEvent('cart-updated');
      window.dispatchEvent(event);
    } catch (err) {
      console.error('Erro ao remover item:', err);
      setError('Erro ao remover item. Por favor, tente novamente.');
    }
  };
  
  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    // Verificar estoque disponível
    const productId = cartItems.find(item => item.id === itemId)?.productId || itemId;
    const availableStock = stockLevels[productId];
    
    if (availableStock !== undefined && newQuantity > availableStock) {
      setError(`Estoque insuficiente. Apenas ${availableStock} unidades disponíveis.`);
      return;
    }
    
    try {
      await CartService.updateItemQuantity(itemId, newQuantity);
      
      // Atualizar apenas o item modificado
      setCartItems(prevItems => prevItems.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
      
      // Atualizar o header com a nova contagem do carrinho
      const event = new CustomEvent('cart-updated');
      window.dispatchEvent(event);
    } catch (err) {
      console.error('Erro ao atualizar quantidade:', err);
      setError('Erro ao atualizar quantidade. Por favor, tente novamente.');
    }
  };
  
  const handleCheckout = () => {
    // Verificar se há estoque suficiente para todos os itens
    const outOfStockItems = cartItems.filter(item => {
      const productId = item.productId || item.id;
      return stockLevels[productId] < item.quantity;
    });
    
    if (outOfStockItems.length > 0) {
      const itemNames = outOfStockItems.map(item => item.name).join(", ");
      setError(`Estoque insuficiente para: ${itemNames}. Por favor, ajuste as quantidades.`);
      return;
    }
    
    if (demoMode) {
      // Redirecionar para o checkout em modo demo
      navigate('/checkout-demo');
      return;
    }
    navigate('/checkout');
  };
  
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };
  
  if (loading) return <p>Carregando carrinho...</p>;
  
  return (
    <Container>
      <h2 className="my-4">
        Meu Carrinho
        {demoMode && <Badge bg="warning" text="dark" className="ms-2">Modo de Demonstração</Badge>}
      </h2>
      
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      
      {demoMode && (
        <Alert variant="info" className="mb-3">
          <Alert.Heading>Modo de Demonstração Ativo</Alert.Heading>
          <p>
            Você está usando o carrinho em modo de demonstração. Neste modo, os itens são armazenados localmente 
            e não são enviados para o servidor. Para uma experiência completa, faça login.
          </p>
        </Alert>
      )}
      
      {cartItems.length === 0 ? (
        <div className="text-center my-5">
          <p>Seu carrinho está vazio.</p>
          <Link to="/" className="btn btn-primary">Continuar Comprando</Link>
        </div>
      ) : (
        <>
          <Row>
            <Col md={8}>
              <ListGroup variant="flush">
                {cartItems.map(item => (
                  <ListGroup.Item key={`${item.id}-${item.productId}`}>
                    <Row className="align-items-center">
                      <Col md={2}>
                        <img 
                          src={item.imageUrl || 'https://placehold.co/100x100'} 
                          alt={item.name}
                          className="img-fluid rounded"
                        />
                      </Col>
                      <Col md={4}>
                        <h5>{item.name}</h5>
                        <p className="text-muted">R$ {item.price.toFixed(2)}</p>
                        {stockLevels[item.productId || item.id] !== undefined && (
                          <small className={stockLevels[item.productId || item.id] < item.quantity ? "text-danger" : "text-success"}>
                            {stockLevels[item.productId || item.id] < item.quantity 
                              ? `Estoque insuficiente (${stockLevels[item.productId || item.id]} disponíveis)`
                              : `Em estoque: ${stockLevels[item.productId || item.id]} unidades`}
                          </small>
                        )}
                      </Col>
                      <Col md={3}>
                        <div className="d-flex align-items-center">
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="mx-2">{item.quantity}</span>
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </Col>
                      <Col md={2}>
                        <p>R$ {(item.price * item.quantity).toFixed(2)}</p>
                      </Col>
                      <Col md={1}>
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          ×
                        </Button>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Body>
                  <Card.Title>Resumo do Pedido</Card.Title>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <Row>
                        <Col>Items:</Col>
                        <Col className="text-end">
                          {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <Row>
                        <Col>Total:</Col>
                        <Col className="text-end">
                          <strong>R$ {calculateTotal()}</strong>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  </ListGroup>
                  <Button 
                    variant="primary" 
                    className="w-100 mt-3"
                    onClick={handleCheckout}
                    disabled={cartItems.some(item => stockLevels[item.productId || item.id] < item.quantity)}
                  >
                    {demoMode ? 'Finalizar Compra (Demo)' : 'Finalizar Compra'}
                  </Button>
                  {cartItems.some(item => stockLevels[item.productId || item.id] < item.quantity) && (
                    <div className="mt-2 text-center text-danger">
                      <small>Alguns itens estão com estoque insuficiente</small>
                    </div>
                  )}
                  {demoMode && (
                    <div className="mt-2 text-center text-muted">
                      <small>Modo de demonstração: Pagamento simulado</small>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <div className="my-4">
            <Link to="/" className="btn btn-outline-primary">
              Continuar Comprando
            </Link>
          </div>
        </>
      )}
    </Container>
  );
};

export default Cart; 