import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Card as BootstrapCard, Button } from 'react-bootstrap';
import './CreditCardForm.css';

const CreditCardForm = ({ cardInfo, handleCardInfoChange, testCards, setTestCards, showTestCards, setShowTestCards }) => {
  const [cardBrand, setCardBrand] = useState('');

  const detectCardBrand = (cardNumber) => {
    const number = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    if (/^6(?:011|5)/.test(number)) return 'discover';
    if (/^5067|^4011|^4312/.test(number)) return 'nubank';
    if (/^627780/.test(number)) return 'c6bank';
    if (/^5078/.test(number)) return 'bradesco';
    if (/^4389|^4514|^4532/.test(number)) return 'santander';
    if (/^606282/.test(number)) return 'itau';
    
    return '';
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    const brand = detectCardBrand(formatted);
    setCardBrand(brand);
    
    handleCardInfoChange({
      target: {
        name: 'cardNumber',
        value: formatted
      }
    });
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    handleCardInfoChange({
      target: {
        name: 'expiryDate',
        value: formatted
      }
    });
  };

  const useTestCard = (card) => {
    handleCardInfoChange({ target: { name: 'cardNumber', value: card.number } });
    handleCardInfoChange({ target: { name: 'cardName', value: card.name } });
    handleCardInfoChange({ target: { name: 'expiryDate', value: card.expiry } });
    handleCardInfoChange({ target: { name: 'cvv', value: card.cvv } });
    setCardBrand(card.brand);
  };

  useEffect(() => {
    const brand = detectCardBrand(cardInfo.cardNumber);
    setCardBrand(brand);
  }, [cardInfo.cardNumber]);

  return (
    <div className="credit-card-form">
      <div className="mb-4">
        <div className="credit-card-preview">
          <div className={`credit-card ${cardBrand}`}>
            <div className="card-background">
              <div className="card-brand-logo">
                {cardBrand && <span className={`brand-icon ${cardBrand}`}></span>}
              </div>
              <div className="card-number">
                {cardInfo.cardNumber || '•••• •••• •••• ••••'}
              </div>
              <div className="card-info">
                <div className="cardholder-name">
                  {cardInfo.cardName || 'NOME DO PORTADOR'}
                </div>
                <div className="expiry-date">
                  {cardInfo.expiryDate || 'MM/AA'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>Número do Cartão</Form.Label>
            <div className="card-input-wrapper">
              <Form.Control 
                type="text" 
                name="cardNumber" 
                value={cardInfo.cardNumber} 
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                required
                className="card-number-input"
              />
              {cardBrand && <span className={`input-brand-icon ${cardBrand}`}></span>}
            </div>
          </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>Nome no Cartão</Form.Label>
            <Form.Control 
              type="text" 
              name="cardName" 
              value={cardInfo.cardName} 
              onChange={handleCardInfoChange}
              placeholder="Como está no cartão"
              style={{ textTransform: 'uppercase' }}
              required
            />
          </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Data de Validade</Form.Label>
            <Form.Control 
              type="text" 
              name="expiryDate" 
              placeholder="MM/AA"
              value={cardInfo.expiryDate} 
              onChange={handleExpiryChange}
              maxLength="5"
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>CVV</Form.Label>
            <Form.Control 
              type="text" 
              name="cvv" 
              value={cardInfo.cvv} 
              onChange={handleCardInfoChange}
              placeholder="123"
              maxLength="4"
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <div className="test-cards-section">
        <Button 
          variant="outline-info" 
          size="sm" 
          onClick={() => setShowTestCards(!showTestCards)}
          className="mb-3"
        >
          {showTestCards ? 'Ocultar' : 'Mostrar'} Cartões de Teste
        </Button>
        
        {showTestCards && (
          <div className="test-cards-grid">
            <h6>Cartões para Teste:</h6>
            <Row>
              {testCards.map((card, index) => (
                <Col md={6} key={index} className="mb-2">
                  <div 
                    className={`test-card-item ${card.brand}`}
                    onClick={() => useTestCard(card)}
                  >
                    <div className="test-card-info">
                      <span className={`test-brand-icon ${card.brand}`}></span>
                      <div>
                        <div className="test-card-name">{card.bankName}</div>
                        <div className="test-card-number">{card.number}</div>
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditCardForm; 