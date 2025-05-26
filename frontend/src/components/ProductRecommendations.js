import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import RecommendationService from '../services/RecommendationService';
import CartService from '../services/CartService';
import AuthService from '../services/AuthService';

const ProductRecommendations = ({ title = "Recomendados para você", refreshInterval = 5 * 60 * 1000 }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  
  // Efeito para buscar recomendações ao montar o componente e periodicamente
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        let recommendedProducts = [];
        
        // Verificar se estamos em modo de demonstração
        const isDemoMode = CartService.isDemoMode();
        console.log('Modo de demonstração:', isDemoMode);
        setDemoMode(isDemoMode);
        
        // Tentar obter recomendações do usuário se estiver autenticado
        if (AuthService.isAuthenticated()) {
          console.log('Usuário autenticado, buscando recomendações do usuário');
          recommendedProducts = await RecommendationService.getUserRecommendations();
          console.log('Recomendações do usuário:', recommendedProducts);
        } else {
          console.log('Usuário não autenticado');
        }
        
        // Se não há recomendações ou em modo demo, usar recomendações simuladas
        if (recommendedProducts.length === 0 || isDemoMode) {
          console.log('Usando recomendações simuladas');
          recommendedProducts = RecommendationService.getSimulatedRecommendations();
          console.log('Recomendações simuladas:', recommendedProducts);
        }
        
        setProducts(recommendedProducts);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar recomendações:', err);
        setError('Não foi possível carregar as recomendações.');
        // Em caso de erro, tentar usar recomendações simuladas
        const simulatedProducts = RecommendationService.getSimulatedRecommendations();
        console.log('Usando recomendações simuladas após erro:', simulatedProducts);
        setProducts(simulatedProducts);
      } finally {
        setLoading(false);
      }
    };
    
    // Buscar recomendações inicialmente
    fetchRecommendations();
    
    // Configurar intervalo para atualizar periodicamente
    const intervalId = setInterval(fetchRecommendations, refreshInterval);
    
    // Limpar intervalo ao desmontar
    return () => clearInterval(intervalId);
  }, [refreshInterval]);
  
  const handleAddToCart = async (product) => {
    try {
      await CartService.addToCart(product.id, 1, product.price);
      
      // Atualizar contagem do carrinho
      const event = new CustomEvent('cart-updated');
      window.dispatchEvent(event);
      
      // Atualizar recomendações após adicionar ao carrinho
      const newRecommendations = demoMode 
        ? RecommendationService.getSimulatedRecommendations()
        : await RecommendationService.getProductRecommendations(product.id);
      
      setProducts(newRecommendations);
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
  
  if (error && products.length === 0) {
    return null; // Não mostrar nada em caso de erro e sem produtos
  }
  
  if (products.length === 0) {
    return null; // Não mostrar o componente se não houver produtos recomendados
  }
  
  return (
    <div className="my-4">
      <h4 className="mb-3">
        {title}
        {demoMode && <small className="text-muted ms-2">(Demonstração)</small>}
      </h4>
      <Row xs={2} md={4} className="g-4">
        {products.map((product) => (
          <Col key={product.id}>
            <Card className="h-100 recommendation-card">
              <Card.Img 
                variant="top" 
                src={product.images[0] || 'https://via.placeholder.com/300x200'} 
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

export default ProductRecommendations; 