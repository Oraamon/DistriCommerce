import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import RecommendationService from '../services/RecommendationService';
import CartService from '../services/CartService';

const RelatedProducts = ({ productId, title = "Produtos relacionados" }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!productId) return;
      
      setLoading(true);
      try {
        let relatedProducts;
        
        // Tenta buscar recomendações do backend
        try {
          relatedProducts = await RecommendationService.getProductRecommendations(productId);
        } catch (err) {
          console.error('Erro ao buscar produtos relacionados:', err);
          // Se falhar, usa recomendações simuladas
          relatedProducts = RecommendationService.getSimulatedRecommendations();
        }
        
        setProducts(relatedProducts);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar produtos relacionados:', err);
        setError('Não foi possível carregar produtos relacionados.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRelatedProducts();
  }, [productId]);
  
  const handleAddToCart = async (product) => {
    try {
      await CartService.addToCart(product.id, 1);
      
      // Atualizar contagem do carrinho
      const event = new CustomEvent('cart-updated');
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="text-center my-3">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }
  
  if (error || products.length === 0) {
    return null; // Não mostrar componente em caso de erro ou sem produtos
  }
  
  return (
    <div className="my-4">
      <h4 className="mb-3">{title}</h4>
      <Row xs={2} md={4} className="g-4">
        {products.map((product) => (
          <Col key={product.id}>
            <Card className="h-100 related-product-card">
              <Card.Img 
                variant="top" 
                src={product.imageUrl || 'https://via.placeholder.com/300x200'} 
                alt={product.name}
                style={{ height: '120px', objectFit: 'cover' }}
              />
              <Card.Body className="d-flex flex-column">
                <Card.Title className="h6 text-truncate">{product.name}</Card.Title>
                <Card.Text className="fw-bold text-primary">R$ {product.price.toFixed(2)}</Card.Text>
                <div className="mt-auto d-flex gap-2">
                  <Link to={`/products/${product.id}`} className="flex-grow-1">
                    <Button variant="outline-primary" size="sm" className="w-100">Ver</Button>
                  </Link>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                  >
                    <i className="bi bi-cart-plus"></i>
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default RelatedProducts; 