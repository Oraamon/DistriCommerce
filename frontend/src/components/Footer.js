import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-3 mt-auto">
      <Container className="text-center">
        <p className="mb-0">© {new Date().getFullYear()} E-commerce. Todos os direitos reservados.</p>
      </Container>
    </footer>
  );
};

export default Footer; 