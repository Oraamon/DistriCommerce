import React, { useState, useEffect } from 'react';
import { Container, Card, Alert, Button, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import PaymentService from '../services/PaymentService';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        setLoading(true);
        // Usar route padronizada no backend para buscar pagamento por orderId
        const payment = await PaymentService.checkPaymentStatus(`order/${orderId}`);
        setPaymentStatus(payment);
      } catch (err) {
        console.error('Erro ao verificar status do pagamento:', err);
        setError('Não foi possível verificar o status do pagamento neste momento.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      checkPaymentStatus();
    }
  }, [orderId]);

  const getStatusBadge = () => {
    if (!paymentStatus) return null;

    let badgeClass = 'info';
    let statusText = 'Processando';

    switch (paymentStatus.status?.toUpperCase()) {
      case 'APPROVED':
        badgeClass = 'success';
        statusText = 'Aprovado';
        break;
      case 'COMPLETED':
        badgeClass = 'success';
        statusText = 'Concluído';
        break;
      case 'REJECTED':
        badgeClass = 'danger';
        statusText = 'Rejeitado';
        break;
      case 'FAILED':
        badgeClass = 'danger';
        statusText = 'Falhou';
        break;
      case 'PENDING':
        badgeClass = 'warning';
        statusText = 'Pendente';
        break;
      default:
        badgeClass = 'info';
        statusText = 'Processando';
    }

    return <Alert variant={badgeClass}>Status do Pagamento: {statusText}</Alert>;
  };

  return (
    <Container className="my-5">
      <Card className="p-4 text-center shadow">
        <Card.Body>
          <Card.Title as="h2" className="mb-4">Pedido Realizado com Sucesso!</Card.Title>
          <Card.Text>
            Seu pedido de número <strong>{orderId}</strong> foi registrado em nosso sistema.
          </Card.Text>
          
          {loading ? (
            <div className="text-center my-4">
              <Spinner animation="border" />
              <p className="mt-2">Verificando status do pagamento...</p>
            </div>
          ) : error ? (
            <Alert variant="warning">{error}</Alert>
          ) : (
            <>
              {getStatusBadge()}
              
              {paymentStatus && (
                <div className="my-3 text-start">
                  <p><strong>Método de Pagamento:</strong> {paymentStatus.paymentMethod}</p>
                  {paymentStatus.transactionId && (
                    <p><strong>ID da Transação:</strong> {paymentStatus.transactionId}</p>
                  )}
                  {paymentStatus.paymentDate && (
                    <p><strong>Data do Pagamento:</strong> {new Date(paymentStatus.paymentDate).toLocaleString()}</p>
                  )}
                  {paymentStatus.amount && (
                    <p><strong>Valor:</strong> R$ {parseFloat(paymentStatus.amount).toFixed(2)}</p>
                  )}
                </div>
              )}
            </>
          )}
          
          <div className="mt-4">
            <Link to="/orders">
              <Button variant="primary" className="me-3">Ver Meus Pedidos</Button>
            </Link>
            <Link to="/">
              <Button variant="outline-primary">Continuar Comprando</Button>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderSuccess; 