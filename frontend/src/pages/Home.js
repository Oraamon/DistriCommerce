import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthService from '../services/AuthService';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        console.log('Tentando buscar produtos...');
        const searchParams = new URLSearchParams(location.search);
        const searchTerm = searchParams.get('search');

        let response;
        if (searchTerm) {
          console.log(`Buscando produtos com termo: ${searchTerm}`);
          response = await axios.get(`/api/products/search?name=${searchTerm}`);
        } else {
          console.log('Buscando todos os produtos');
          response = await axios.get('/api/products');
        }
        
        console.log('Resposta recebida:', response.data);
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
                  src={product.imageUrl || 'https://via.placeholder.com/300x200'} 
                  alt={product.name}
                  className="product-image"
                />
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{product.name}</Card.Title>
                  <Card.Text className="text-truncate">{product.description}</Card.Text>
                  <Card.Text className="fw-bold text-primary">R$ {product.price}</Card.Text>
                  <div className="mt-auto">
                    <Link to={`/products/${product.id}`} className="w-100">
                      <Button variant="primary" className="w-100">Ver Detalhes</Button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </>
  );
};

export default Home; 