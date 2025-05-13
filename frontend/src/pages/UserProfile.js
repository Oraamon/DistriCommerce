import React, { useState, useEffect } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Tab, Tabs } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthService from '../services/AuthService';

const UserProfile = () => {
  // Estado para armazenar os dados do usuário e outros dados relacionados
  // eslint-disable-next-line no-unused-vars
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [addressForm, setAddressForm] = useState({
    street: '',
    number: '',
    complement: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false
  });
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = AuthService.getAuthToken();
        const userData = AuthService.getCurrentUser();
        
        if (!token || !userData) {
          console.log("Redirecionando para login - token ou userData é null");
          navigate('/login');
          return;
        }
        
        setUser(userData);
        setProfileForm({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || ''
        });
        
        // Tentar buscar endereços (se a API existir)
        try {
          const addressesResponse = await axios.get('/api/users/addresses', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          setAddresses(addressesResponse.data);
        } catch (addressErr) {
          console.log("Erro ao buscar endereços:", addressErr);
          // Sem tratamento de erro aqui, apenas log
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        setError('Erro ao carregar dados do perfil. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate]);
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm({
      ...profileForm,
      [name]: value
    });
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value
    });
  };
  
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm({
      ...addressForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/users/profile', profileForm, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSuccessMessage('Perfil atualizado com sucesso!');
    } catch (err) {
      setError('Erro ao atualizar perfil. Por favor, tente novamente.');
    }
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/users/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSuccessMessage('Senha atualizada com sucesso!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError('Erro ao atualizar senha. Verifique se a senha atual está correta.');
    }
  };
  
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/users/addresses', addressForm, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Atualiza a lista de endereços
      const addressesResponse = await axios.get('/api/users/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setAddresses(addressesResponse.data);
      setSuccessMessage('Endereço adicionado com sucesso!');
      
      // Limpa o formulário
      setAddressForm({
        street: '',
        number: '',
        complement: '',
        city: '',
        state: '',
        zipCode: '',
        isDefault: false
      });
    } catch (err) {
      setError('Erro ao adicionar endereço. Por favor, tente novamente.');
    }
  };
  
  const handleDeleteAddress = async (addressId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/users/addresses/${addressId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setAddresses(addresses.filter(address => address.id !== addressId));
      setSuccessMessage('Endereço removido com sucesso!');
    } catch (err) {
      setError('Erro ao remover endereço. Por favor, tente novamente.');
    }
  };
  
  const handleSetDefaultAddress = async (addressId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/users/addresses/${addressId}/default`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Atualiza a lista de endereços
      const addressesResponse = await axios.get('/api/users/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setAddresses(addressesResponse.data);
      setSuccessMessage('Endereço padrão atualizado!');
    } catch (err) {
      setError('Erro ao definir endereço padrão. Por favor, tente novamente.');
    }
  };
  
  if (loading) return <p>Carregando dados do perfil...</p>;
  
  return (
    <Container className="py-4">
      <h2 className="mb-4">Meu Perfil</h2>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
          {successMessage}
        </Alert>
      )}
      
      <Tabs className="mb-4" defaultActiveKey="profile">
        <Tab eventKey="profile" title="Perfil">
          <Card>
            <Card.Body>
              <Form onSubmit={handleProfileSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="name" 
                    value={profileForm.name} 
                    onChange={handleProfileChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control 
                    type="email" 
                    name="email" 
                    value={profileForm.email} 
                    onChange={handleProfileChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Telefone</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="phone" 
                    value={profileForm.phone} 
                    onChange={handleProfileChange}
                  />
                </Form.Group>
                
                <Button type="submit" variant="primary">
                  Atualizar Perfil
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="password" title="Alterar Senha">
          <Card>
            <Card.Body>
              <Form onSubmit={handlePasswordSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Senha Atual</Form.Label>
                  <Form.Control 
                    type="password" 
                    name="currentPassword" 
                    value={passwordForm.currentPassword} 
                    onChange={handlePasswordChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Nova Senha</Form.Label>
                  <Form.Control 
                    type="password" 
                    name="newPassword" 
                    value={passwordForm.newPassword} 
                    onChange={handlePasswordChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Confirmar Nova Senha</Form.Label>
                  <Form.Control 
                    type="password" 
                    name="confirmPassword" 
                    value={passwordForm.confirmPassword} 
                    onChange={handlePasswordChange}
                    required
                  />
                </Form.Group>
                
                <Button type="submit" variant="primary">
                  Atualizar Senha
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="addresses" title="Endereços">
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Meus Endereços</h5>
            </Card.Header>
            <Card.Body>
              {addresses.length === 0 ? (
                <p>Nenhum endereço cadastrado.</p>
              ) : (
                <Row>
                  {addresses.map(address => (
                    <Col md={6} key={address.id} className="mb-3">
                      <Card>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <address className="mb-0">
                                <strong>
                                  {address.street}, {address.number}
                                  {address.complement && `, ${address.complement}`}
                                </strong>
                                <br />
                                {address.city} - {address.state}
                                <br />
                                CEP: {address.zipCode}
                              </address>
                              
                              {address.isDefault && (
                                <Badge bg="success" className="mt-2">Endereço Padrão</Badge>
                              )}
                            </div>
                            
                            <div>
                              {!address.isDefault && (
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleSetDefaultAddress(address.id)}
                                >
                                  Definir como Padrão
                                </Button>
                              )}
                              
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteAddress(address.id)}
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Adicionar Novo Endereço</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleAddressSubmit}>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Rua</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="street" 
                        value={addressForm.street} 
                        onChange={handleAddressChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Número</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="number" 
                        value={addressForm.number} 
                        onChange={handleAddressChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Complemento</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="complement" 
                    value={addressForm.complement} 
                    onChange={handleAddressChange}
                  />
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Cidade</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="city" 
                        value={addressForm.city} 
                        onChange={handleAddressChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Estado</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="state" 
                        value={addressForm.state} 
                        onChange={handleAddressChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>CEP</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="zipCode" 
                        value={addressForm.zipCode} 
                        onChange={handleAddressChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="checkbox"
                    label="Definir como endereço padrão"
                    name="isDefault"
                    checked={addressForm.isDefault}
                    onChange={handleAddressChange}
                  />
                </Form.Group>
                
                <Button type="submit" variant="primary">
                  Adicionar Endereço
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default UserProfile; 