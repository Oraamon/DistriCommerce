import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Alert, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import AuthService from '../services/AuthService';
import CartService from '../services/CartService';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const searchParams = useSearchParams()[0];

  useEffect(() => {
    // Verificar se o usuário está autenticado e é admin
    const user = AuthService.getCurrentUser();
    setIsAuthenticated(AuthService.isAuthenticated());
    setIsAdmin(user && (user.role === 'ADMIN' || (user.roles && user.roles.includes('ROLE_ADMIN'))));
    

    
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const searchParams = new URLSearchParams(location.search);
        const searchTerm = searchParams.get('search');

        let response;
        if (searchTerm) {
          response = await axios.get(`/api/products/search?query=${searchTerm}`);
        } else {
          response = await axios.get('/api/products');
        }
        
        setProducts(response.data);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        setError('Erro ao carregar produtos. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [location.search]);

  const handleAddToCart = async (product) => {
    if (!AuthService.isAuthenticated()) {
      setToastMessage('Você precisa fazer login para adicionar produtos ao carrinho.');
      setShowToast(true);
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
    
    try {
      await CartService.addItem(product, 1);
      setToastMessage(`${product.name} adicionado ao carrinho!`);
      setShowToast(true);
      
      const event = new CustomEvent('cart-updated');
      window.dispatchEvent(event);
    } catch (error) {
      if (error.message === 'Usuário não autenticado') {
        setToastMessage('Sessão expirada. Por favor, faça login novamente.');
        setShowToast(true);
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setToastMessage('Erro ao adicionar produto ao carrinho. Tente novamente.');
        setShowToast(true);
      }
      console.error('Erro ao adicionar ao carrinho:', error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await axios.delete(`/api/products/${productId}`);
        // Atualizar a lista de produtos após a exclusão
        setProducts(products.filter(p => p.id !== productId));
        setToastMessage('Produto excluído com sucesso!');
        setShowToast(true);
      } catch (error) {
        setToastMessage('Erro ao excluir produto. Tente novamente.');
        setShowToast(true);
        console.error('Erro ao excluir produto:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <>
      <h1 className="mb-4">Produtos</h1>
      {products.length === 0 ? (
        <Alert variant="info">Nenhum produto encontrado.</Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {products.map((product) => (
            <Col key={product.id}>
              <Card className="h-100 product-card">
                <Card.Img 
                  variant="top" 
                  src={product.images[0] || 'https://via.placeholder.com/300x200'} 
                  alt={product.name}
                  className="product-image"
                />
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{product.name}</Card.Title>
                  <Card.Text className="text-truncate">{product.description}</Card.Text>
                  <Card.Text className="fw-bold text-primary">R$ {product.price.toFixed(2)}</Card.Text>
                  <div className="mt-auto d-flex gap-2">
                    <Link to={`/products/${product.id}`} className="flex-grow-1">
                      <Button variant="outline-primary" className="w-100">Ver Detalhes</Button>
                    </Link>
                    <Button 
                      variant="primary" 
                      onClick={() => handleAddToCart(product)}
                    >
                      <i className="bi bi-cart-plus"></i>
                    </Button>
                  </div>
                  
                  {isAdmin && (
                    <div className="mt-2 d-flex gap-2">
                      <Link to={`/products/edit/${product.id}`} className="flex-grow-1">
                        <Button variant="warning" className="w-100" size="sm">
                          <i className="bi bi-pencil"></i> Editar
                        </Button>
                      </Link>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      
      <ToastContainer position="bottom-end" className="p-3">
        <Toast 
          onClose={() => setShowToast(false)} 
          show={showToast} 
          delay={3000} 
          autohide
          bg="success"
          text="white"
        >
          <Toast.Header>
            <strong className="me-auto">E-commerce</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default Home; 