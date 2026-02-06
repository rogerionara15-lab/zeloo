
export interface PaymentRequest {
  method: 'PIX' | 'CARD' | 'BOLETO';
  amount: number;
  gateway?: 'MERCADO_PAGO' | 'PAGSEGURO' | 'STRIPE' | 'ASAAS';
  customer: {
    name: string;
    email: string;
    document: string;
    address: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  pixPayload?: string;
  pixQrCode?: string;
  status: 'PENDING' | 'PAID' | 'ERROR';
  message: string;
}

const paymentService = {
  process: async (data: PaymentRequest): Promise<PaymentResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const txId = `ZLO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        if (data.method === 'PIX') {
          resolve({
            success: true,
            transactionId: txId,
            pixPayload: `00020126580014BR.GOV.BCB.PIX0136${txId}5204000053039865405${data.amount}.005802BR5913Zeloo_Cloud6008SAO_PAULO62070503***6304E21D`,
            pixQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=PIX_ZELOO_${txId}`,
            status: 'PENDING',
            message: 'Cobrança PIX gerada. Aguardando pagamento.',
          });
        } else {
          // Cartão aprova direto para facilitar o teste de fluxo positivo
          resolve({
            success: true,
            transactionId: txId,
            status: 'PAID',
            message: 'Pagamento via Cartão aprovado com sucesso!',
          });
        }
      }, 1200);
    });
  },

  verifyStatus: async (txId: string): Promise<'PAID' | 'PENDING'> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simula verificação no banco de dados do gateway
        resolve('PENDING'); 
      }, 1000);
    });
  }
};

export default paymentService;
