class AddressService {
  async getAddressByCEP(cep) {
    try {
      const cleanCep = cep.replace(/\D/g, '');
      
      if (cleanCep.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
      }
      
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar CEP');
      }
      
      const data = await response.json();
      
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }
      
      return {
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        complement: data.complemento || ''
      };
    } catch (error) {
      console.error('Erro ao buscar endereço por CEP:', error);
      throw error;
    }
  }

  formatCEP(cep) {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length <= 5) {
      return cleanCep;
    }
    
    return `${cleanCep.slice(0, 5)}-${cleanCep.slice(5, 8)}`;
  }

  validateCEP(cep) {
    const cleanCep = cep.replace(/\D/g, '');
    return cleanCep.length === 8;
  }
}

export default new AddressService(); 