import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="text-center py-5">
      <Alert variant="warning">
        <Alert.Heading>Página não encontrada!</Alert.Heading>
        <p className="mb-4">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link to="/">
          <Button variant="primary">Voltar para a página inicial</Button>
        </Link>
      </Alert>
    </div>
  );
};

export default NotFound; 