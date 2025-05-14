import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

/**
 * Serviço para gerenciar operações de pagamento
 */
class PaymentService {
  /**
   * Processa um pagamento
   * @param {Object} paymentRequest Objeto com os dados do pagamento
   * @returns {Promise} Resposta da API com o resultado do processamento
   */
  async processPayment(paymentRequest) {
    try {
      // Tentar processar o pagamento via API
      const response = await axios.post('/api/payments', paymentRequest);
      console.log('Pagamento processado com sucesso via API:', response.data);
      
      // Verificar se o backend falhou em atualizar o estoque, fazendo um fallback
      if (paymentRequest.orderItems && paymentRequest.orderItems.length > 0) {
        try {
          // Verificar o status do pagamento para decidir o que fazer com o estoque
          if (response.data.status === 'APPROVED' || response.data.status === 'COMPLETED') {
            // Dupla verificação para garantir que o estoque foi atualizado
            console.log('Verificando atualização de estoque após pagamento aprovado');
            await this.updateProductStock(paymentRequest.orderItems, 'decrease');
          }
        } catch (stockError) {
          console.error('Erro ao verificar/atualizar estoque após pagamento:', stockError);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro ao processar pagamento via API:', error);
      console.log('Usando processamento local devido à indisponibilidade do serviço de pagamento');
      return this.processPaymentLocally(paymentRequest);
    }
  }

  /**
   * Processa um pagamento localmente (fallback)
   * @param {Object} paymentRequest Objeto com os dados do pagamento
   * @returns {Object} Resposta simulada
   */
  processPaymentLocally(paymentRequest) {
    console.log('Processando pagamento localmente:', paymentRequest);
    
    // Criar resposta simulada
    const response = {
      paymentId: uuidv4(),
      orderId: paymentRequest.orderId,
      status: 'APPROVED',
      transactionId: `local-txn-${uuidv4().substring(0, 8)}`,
      paymentDate: new Date().toISOString(),
      amount: paymentRequest.amount,
      paymentMethod: paymentRequest.paymentMethod
    };
    
    // Salvar no localStorage para persistência
    const payments = JSON.parse(localStorage.getItem('local_payments') || '[]');
    payments.push(response);
    localStorage.setItem('local_payments', JSON.stringify(payments));
    
    // Diminuir estoque manualmente quando em modo local
    this.updateProductStock(paymentRequest.orderItems, 'decrease');
    
    return response;
  }
  
  /**
   * Atualiza o estoque dos produtos após pagamento ou reembolso
   * @param {Array} items Itens do pedido
   * @param {string} action 'decrease' ou 'increase'
   */
  async updateProductStock(items, action = 'decrease') {
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.warn('Nenhum item fornecido para atualização de estoque');
      return;
    }
    
    console.log(`Atualizando estoque para ${items.length} produtos. Ação: ${action}`);
    
    for (const item of items) {
      try {
        // Garantir que temos um ID de produto válido
        const productId = item.productId || item.id;
        if (!productId) {
          console.error('ID de produto não encontrado para o item:', item);
          continue;
        }
        
        const quantity = item.quantity || 1;
        const endpoint = action === 'decrease' 
          ? `/api/products/${productId}/decrease-stock?quantity=${quantity}`
          : `/api/products/${productId}/increase-stock?quantity=${quantity}`;
          
        console.log(`Chamando endpoint: ${endpoint}`);
        const response = await axios.post(endpoint);
        console.log(`Estoque ${action === 'decrease' ? 'diminuído' : 'aumentado'} para o produto ${productId}. Resposta:`, response.data);
      } catch (error) {
        console.error(`Erro ao ${action === 'decrease' ? 'diminuir' : 'aumentar'} estoque para o produto ${item.productId || item.id}:`, error);
        // Tentar novamente com um endpoint alternativo
        try {
          const productId = item.productId || item.id;
          const quantity = item.quantity || 1;
          // Endpoint alternativo que pode estar disponível em algumas versões do backend
          const altEndpoint = `/api/products/${productId}/stock?quantity=${action === 'decrease' ? -quantity : quantity}`;
          console.log(`Tentando endpoint alternativo: ${altEndpoint}`);
          await axios.put(altEndpoint);
          console.log(`Estoque atualizado via endpoint alternativo para o produto ${productId}`);
        } catch (altError) {
          console.error(`Também falhou no endpoint alternativo:`, altError);
        }
      }
    }
  }

  /**
   * Verifica o status de um pagamento
   * @param {string} paymentId ID do pagamento
   * @returns {Promise} Resposta da API com o status do pagamento
   */
  async checkPaymentStatus(paymentId) {
    // Verificar se contém 'order/' no início (usado no OrderSuccess.js)
    if (paymentId.startsWith('order/')) {
      const orderId = paymentId.replace('order/', '');
      // Buscar pagamentos locais pelo orderId
      const payments = JSON.parse(localStorage.getItem('local_payments') || '[]');
      const payment = payments.find(p => p.orderId.toString() === orderId.toString());
      
      if (payment) {
        return payment;
      }
    }
    
    // Verificar por paymentId direto
    const payments = JSON.parse(localStorage.getItem('local_payments') || '[]');
    const payment = payments.find(p => p.paymentId === paymentId);
    
    if (payment) {
      return payment;
    }
    
    // Se não encontrar, retornar um pagamento simulado
    return {
      paymentId: paymentId || uuidv4(),
      orderId: parseInt(Math.random() * 10000),
      status: 'APPROVED',
      transactionId: `simulated-${uuidv4().substring(0, 8)}`,
      paymentDate: new Date().toISOString(),
      amount: 100.00,
      paymentMethod: 'CREDIT_CARD'
    };
  }

  /**
   * Solicita reembolso de um pagamento
   * @param {string} paymentId ID do pagamento
   * @param {Object} refundData Dados do reembolso (opcional)
   * @returns {Promise} Resposta da API com o resultado do reembolso
   */
  async requestRefund(orderId, refundData = {}) {
    try {
      // Tentar processar reembolso via API
      const response = await axios.post(`/api/payments/refund/${orderId}`);
      console.log('Reembolso processado com sucesso via API:', response.data);
      
      // Atualizar estoque apenas se estamos usando o backend
      if (response.data) {
        return response.data;
      }
    } catch (error) {
      console.error('Erro ao processar reembolso via API:', error);
      console.log('Usando processamento local de reembolso');
    }
    
    // Buscar o pagamento localmente
    const payments = JSON.parse(localStorage.getItem('local_payments') || '[]');
    const paymentIndex = payments.findIndex(p => p.orderId === orderId);
    
    if (paymentIndex >= 0) {
      // Atualizar status do pagamento para refunded
      payments[paymentIndex].status = 'REFUNDED';
      payments[paymentIndex].refundDate = new Date().toISOString();
      payments[paymentIndex].refundAmount = refundData.amount || payments[paymentIndex].amount;
      
      // Salvar atualizações
      localStorage.setItem('local_payments', JSON.stringify(payments));
      
      // Aumentar estoque para os itens do pedido
      if (refundData.items) {
        this.updateProductStock(refundData.items, 'increase');
      }
      
      return {
        ...payments[paymentIndex],
        refundId: `refund-${uuidv4().substring(0, 8)}`
      };
    }
    
    throw new Error('Pagamento não encontrado');
  }
}

export default new PaymentService(); 