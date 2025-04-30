import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Form, Button, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import CartService from '../services/CartService';

const Header = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    const isAuthenticated = AuthService.isAuthenticated();
    const isDemoMode = CartService.isDemoMode();
    
    setDemoMode(isDemoMode);
    
    if (user && isAuthenticated) {
      setCurrentUser(user);
    }
    
    fetchCartItemCount();
    
    // Adiciona o listener para atualização do carrinho
    window.addEventListener('cart-updated', fetchCartItemCount);
    
    // Remove o listener quando o componente é desmontado
    return () => {
      window.removeEventListener('cart-updated', fetchCartItemCount);
    };
  }, []);

  const fetchCartItemCount = async () => {
    try {
      if (!AuthService.isAuthenticated() && !CartService.isDemoMode()) return;

      const count = await CartService.getCartItemCount();
      setCartItemCount(count);
    } catch (error) {
      console.error('Erro ao buscar contagem do carrinho:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?search=${searchTerm}`);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setCartItemCount(0);
    navigate('/login');
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          E-commerce
          {demoMode && <Badge bg="warning" text="dark" className="ms-2" style={{fontSize: '0.6rem'}}>DEMO</Badge>}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Página Inicial</Nav.Link>
            {currentUser && currentUser.role === 'ADMIN' && (
              <Nav.Link as={Link} to="/products/add">Adicionar Produto</Nav.Link>
            )}
          </Nav>
          <Form className="d-flex me-2" onSubmit={handleSearch}>
            <Form.Control
              type="search"
              placeholder="Buscar produtos..."
              className="me-2"
              aria-label="Buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline-light" type="submit">Buscar</Button>
          </Form>
          {currentUser ? (
            <>
              <Nav className="me-2">
                <Nav.Link as={Link} to="/cart" className="position-relative">
                  <i className="bi bi-cart"></i> Carrinho
                  {cartItemCount > 0 && (
                    <Badge 
                      pill 
                      bg="danger" 
                      className="position-absolute top-0 start-100 translate-middle"
                    >
                      {cartItemCount}
                    </Badge>
                  )}
                </Nav.Link>
              </Nav>
              <NavDropdown title={currentUser.name} id="basic-nav-dropdown">
                <NavDropdown.Item as={Link} to="/profile">Meu Perfil</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/orders">Meus Pedidos</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Sair</NavDropdown.Item>
              </NavDropdown>
            </>
          ) : (
            <Nav>
              {demoMode && (
                <Nav.Link as={Link} to="/cart" className="position-relative me-2">
                  <i className="bi bi-cart"></i> Carrinho Demo
                  {cartItemCount > 0 && (
                    <Badge 
                      pill 
                      bg="danger" 
                      className="position-absolute top-0 start-100 translate-middle"
                    >
                      {cartItemCount}
                    </Badge>
                  )}
                </Nav.Link>
              )}
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
              <Nav.Link as={Link} to="/register">Registrar</Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header; 