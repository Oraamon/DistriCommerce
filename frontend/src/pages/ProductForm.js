import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    quantity: ''
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchProduct = async () => {
        try {
          const response = await axios.get(`/api/products/${id}`);
          const product = response.data;
          setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price.toString(),
            imageUrl: product.imageUrl || '',
            quantity: product.quantity.toString()
          });
        } catch (err) {
          setError('Erro ao carregar dados do produto.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);
    setSubmitting(true);
    setError(null);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity, 10)
      };

      if (isEditMode) {
        await axios.put(`/api/products/${id}`, productData);
      } else {
        await axios.post('/api/products', productData);
      }

      navigate('/');
    } catch (err) {
      setError(`Erro ao ${isEditMode ? 'atualizar' : 'criar'} produto.`);
      console.error(err);
    } finally {
      setSubmitting(false);
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

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{isEditMode ? 'Editar Produto' : 'Adicionar Novo Produto'}</h1>
        <Link to="/" className="btn btn-outline-secondary">
          Cancelar
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="productName">
              <Form.Label>Nome do Produto</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Digite o nome do produto"
              />
              <Form.Control.Feedback type="invalid">
                Por favor, informe o nome do produto.
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="productDescription">
              <Form.Label>Descrição</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Digite a descrição do produto"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="productPrice">
              <Form.Label>Preço (R$)</Form.Label>
              <Form.Control
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
              />
              <Form.Control.Feedback type="invalid">
                Por favor, informe um preço válido.
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="productImageUrl">
              <Form.Label>URL da Imagem</Form.Label>
              <Form.Control
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://exemplo.com/imagem.jpg"
              />
              <Form.Control.Feedback type="invalid">
                Por favor, informe uma URL válida.
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="productStock">
              <Form.Label>Estoque</Form.Label>
              <Form.Control
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="0"
                placeholder="0"
              />
              <Form.Control.Feedback type="invalid">
                Por favor, informe uma quantidade válida.
              </Form.Control.Feedback>
            </Form.Group>

            <Button 
              variant="primary" 
              type="submit" 
              disabled={submitting}
              className="w-100"
            >
              {submitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  <span className="ms-2">Salvando...</span>
                </>
              ) : (
                isEditMode ? 'Atualizar Produto' : 'Adicionar Produto'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
};

export default ProductForm; 