import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Row, Col, Alert, Spinner, Modal, Form, Toast, ToastContainer } from 'react-bootstrap';
import axios from 'axios';
import AuthService from '../services/AuthService';
import CartService from '../services/CartService';
import RelatedProducts from '../components/RelatedProducts';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setIsAuthenticated(!!user);
    setIsAdmin(user?.role === 'ADMIN');
    
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        setError('Erro ao carregar detalhes do produto.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/products/${id}`);
      setShowDeleteModal(false);
      navigate('/');
    } catch (err) {
      setError('Erro ao excluir produto.');
      console.error(err);
    }
  };
  
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setToastMessage('Você precisa fazer login para adicionar produtos ao carrinho.');
      setShowToast(true);
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    try {
      await CartService.addToCart(product.id, quantity);
      setToastMessage(`${quantity} unidade(s) de ${product.name} adicionado(s) ao carrinho!`);
      setShowToast(true);
      
      // Atualizar o header com a nova contagem do carrinho
      const event = new CustomEvent('cart-updated');
      window.dispatchEvent(event);
    } catch (error) {
      setToastMessage('Erro ao adicionar produto ao carrinho. Tente novamente.');
      setShowToast(true);
      console.error('Erro ao adicionar ao carrinho:', error);
    }
  };
  
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= product.quantity) {
      setQuantity(value);
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

  if (!product) {
    return <Alert variant="warning">Produto não encontrado.</Alert>;
  }

  return (
    <>
      <Row className="mb-4">
        <Col>
          <Link to="/" className="btn btn-outline-secondary">
            &larr; Voltar
          </Link>
        </Col>
      </Row>

      <Card>
        <Row className="g-0">
          <Col md={4}>
            <Card.Img 
              src={product.imageUrl || 'https://via.placeholder.com/300x400'} 
              alt={product.name} 
              className="img-fluid rounded-start"
            />
          </Col>
          <Col md={8}>
            <Card.Body>
              <Card.Title as="h1">{product.name}</Card.Title>
              <Card.Text className="fs-3 fw-bold text-primary">
                R$ {product.price.toFixed(2)}
              </Card.Text>
              <Card.Text className="fs-6 text-muted">
                Disponível: {product.quantity} unidades
              </Card.Text>
              <Card.Text>{product.description}</Card.Text>
              
              {product.quantity > 0 ? (
                <div className="mt-4">
                  <Form.Group as={Row} className="mb-3 align-items-center">
                    <Form.Label column sm={3}>Quantidade:</Form.Label>
                    <Col sm={3}>
                      <Form.Control
                        type="number"
                        min="1"
                        max={product.quantity}
                        value={quantity}
                        onChange={handleQuantityChange}
                      />
                    </Col>
                  </Form.Group>
                  
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="w-100 mb-3"
                    onClick={handleAddToCart}
                  >
                    Adicionar ao Carrinho
                  </Button>
                </div>
              ) : (
                <Alert variant="warning" className="mt-4">
                  Produto esgotado
                </Alert>
              )}
              
              {isAdmin && (
                <div className="d-flex gap-2 mt-4">
                  <Link to={`/products/edit/${product.id}`} className="btn btn-warning">
                    Editar
                  </Link>
                  <Button 
                    variant="danger" 
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Excluir
                  </Button>
                </div>
              )}
            </Card.Body>
          </Col>
        </Row>
      </Card>

      <RelatedProducts productId={id} />

      {/* Modal de confirmação de exclusão */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem certeza que deseja excluir o produto <strong>{product.name}</strong>?
          Esta ação não pode ser desfeita.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Excluir
          </Button>
        </Modal.Footer>
      </Modal>
      
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

export default ProductDetails; 