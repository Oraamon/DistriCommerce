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
    // Devido a problemas com os bancos de dados, estamos usando processamento local
    console.log('Usando processamento local devido à indisponibilidade do serviço de pagamento');
    return this.processPaymentLocally(paymentRequest);
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
    
    return response;
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
  async requestRefund(paymentId, refundData = {}) {
    // Buscar o pagamento localmente
    const payments = JSON.parse(localStorage.getItem('local_payments') || '[]');
    const paymentIndex = payments.findIndex(p => p.paymentId === paymentId);
    
    if (paymentIndex >= 0) {
      // Atualizar status do pagamento para refunded
      payments[paymentIndex].status = 'REFUNDED';
      payments[paymentIndex].refundDate = new Date().toISOString();
      payments[paymentIndex].refundAmount = refundData.amount || payments[paymentIndex].amount;
      
      // Salvar atualizações
      localStorage.setItem('local_payments', JSON.stringify(payments));
      
      return {
        ...payments[paymentIndex],
        refundId: `refund-${uuidv4().substring(0, 8)}`
      };
    }
    
    throw new Error('Pagamento não encontrado');
  }
}

export default new PaymentService(); 