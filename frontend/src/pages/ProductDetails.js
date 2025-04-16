import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Row, Col, Alert, Spinner, Modal } from 'react-bootstrap';
import axios from 'axios';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
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
                R$ {product.price}
              </Card.Text>
              <Card.Text className="fs-6 text-muted">
                Disponível: {product.stockQuantity} unidades
              </Card.Text>
              <Card.Text>{product.description}</Card.Text>
              
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
            </Card.Body>
          </Col>
        </Row>
      </Card>

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
    </>
  );
};

export default ProductDetails; 