import React, { useState, useEffect } from 'react';
import { Card, Container, Alert } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const OrderSuccess = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await axios.get(`/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setOrder(response.data);
        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar os detalhes do pedido. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, navigate]);
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };
  
  if (loading) return <p>Carregando detalhes do pedido...</p>;
  if (error) return <p className="text-danger">{error}</p>;
  
  return (
    <Container className="py-5">
      <Card className="text-center p-5 shadow-sm">
        <Alert variant="success" className="mb-4">
          <h1>Pedido Realizado com Sucesso!</h1>
          <p className="lead">Obrigado pela sua compra</p>
        </Alert>
        
        {order && (
          <div className="text-start my-4">
            <h4>Resumo do Pedido #{order.id}</h4>
            <p><strong>Data:</strong> {formatDate(order.createdAt)}</p>
            <p><strong>Total:</strong> R$ {order.totalPrice.toFixed(2)}</p>
            <p>
              <strong>Status:</strong>{' '}
              <span className="badge bg-primary">{order.status}</span>
            </p>
            
            <h5 className="mt-4">Informações de Entrega</h5>
            <p>
              {order.shippingAddress.street}, {order.shippingAddress.number}
              {order.shippingAddress.complement && `, ${order.shippingAddress.complement}`}
              <br />
              {order.shippingAddress.city} - {order.shippingAddress.state}
              <br />
              CEP: {order.shippingAddress.zipCode}
            </p>
            
            <h5 className="mt-4">Método de Pagamento</h5>
            <p>
              {order.payment?.method === 'credit_card' 
                ? 'Cartão de Crédito' 
                : order.payment?.method === 'boleto' 
                  ? 'Boleto Bancário'
                  : 'Pagamento processando'}
            </p>
          </div>
        )}
        
        <div className="mt-4">
          <Link to="/orders" className="btn btn-outline-primary me-3">
            Ver Meus Pedidos
          </Link>
          <Link to="/" className="btn btn-primary">
            Continuar Comprando
          </Link>
        </div>
      </Card>
    </Container>
  );
};

export default OrderSuccess; 