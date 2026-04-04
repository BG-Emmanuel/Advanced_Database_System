const { v4: uuid } = require('uuid');

// ══════════════════════════════════════════════════════════════════════════════
// MTN Mobile Money Integration
// Docs: https://momodeveloper.mtn.com/docs
// ══════════════════════════════════════════════════════════════════════════════

class MTNMoMoService {
  constructor() {
    this.baseUrl   = process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
    this.primaryKey= process.env.MTN_MOMO_PRIMARY_KEY;
    this.env       = process.env.MTN_MOMO_ENVIRONMENT || 'sandbox';
    this.apiUserId = null;
    this.apiKey    = null;
    this.token     = null;
    this.tokenExpiry = null;
  }

  isConfigured() {
    return !!this.primaryKey;
  }

  // Step 1: Create API user (once during setup)
  async createApiUser() {
    if (!this.isConfigured()) throw new Error('MTN MoMo not configured');
    const referenceId = uuid();
    const response = await fetch(`${this.baseUrl}/v1_0/apiuser`, {
      method: 'POST',
      headers: {
        'X-Reference-Id': referenceId,
        'Ocp-Apim-Subscription-Key': this.primaryKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ providerCallbackHost: process.env.MTN_MOMO_CALLBACK_URL || 'https://buy237.cm' }),
    });
    if (!response.ok) throw new Error(`Failed to create API user: ${response.status}`);
    this.apiUserId = referenceId;
    return referenceId;
  }

  // Step 2: Get API key for the user
  async getApiKey() {
    if (!this.apiUserId) await this.createApiUser();
    const response = await fetch(`${this.baseUrl}/v1_0/apiuser/${this.apiUserId}/apikey`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': this.primaryKey },
    });
    if (!response.ok) throw new Error(`Failed to get API key: ${response.status}`);
    const data = await response.json();
    this.apiKey = data.apiKey;
    return data.apiKey;
  }

  // Step 3: Get access token
  async getToken() {
    // Return cached token if still valid
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }
    if (!this.apiUserId || !this.apiKey) await this.getApiKey();

    const credentials = Buffer.from(`${this.apiUserId}:${this.apiKey}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/collection/token/`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': this.primaryKey,
      },
    });
    if (!response.ok) throw new Error(`Failed to get token: ${response.status}`);
    const data = await response.json();
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 min buffer
    return this.token;
  }

  // Main: Request payment from customer phone
  async requestPayment({ amount, phone, orderId, description }) {
    if (!this.isConfigured()) {
      // Return mock success for development
      console.log(`[MTN MoMo SANDBOX] Payment request: ${amount} FCFA from ${phone} for order ${orderId}`);
      return {
        success: true,
        transactionId: `MOMO-SANDBOX-${uuid().substring(0,8).toUpperCase()}`,
        status: 'PENDING',
        message: 'Payment request sent. Customer will receive a prompt.',
        sandbox: true,
      };
    }

    try {
      const token = await this.getToken();
      const transactionId = uuid();

      const response = await fetch(`${this.baseUrl}/collection/v1_0/requesttopay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Reference-Id': transactionId,
          'X-Target-Environment': this.env,
          'Ocp-Apim-Subscription-Key': this.primaryKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: String(Math.round(amount)),
          currency: 'XAF',
          externalId: orderId,
          payer: { partyIdType: 'MSISDN', partyId: phone.replace(/\D/g, '') },
          payerMessage: description || 'Payment for Buy237 order',
          payeeNote: `Order ${orderId}`,
        }),
      });

      if (response.status === 202) {
        return { success: true, transactionId, status: 'PENDING', message: 'Payment prompt sent to customer phone.' };
      }
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Payment request failed: ${response.status}`);
    } catch (err) {
      console.error('MTN MoMo error:', err.message);
      throw err;
    }
  }

  // Check payment status
  async checkStatus(transactionId) {
    if (!this.isConfigured()) {
      return { status: 'SUCCESSFUL', financialTransactionId: transactionId };
    }
    try {
      const token = await this.getToken();
      const response = await fetch(`${this.baseUrl}/collection/v1_0/requesttopay/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': this.env,
          'Ocp-Apim-Subscription-Key': this.primaryKey,
        },
      });
      return await response.json();
    } catch (err) {
      throw new Error(`Failed to check status: ${err.message}`);
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Orange Money Integration
// Docs: https://developer.orange.com/apis/om-webpay-cm
// ══════════════════════════════════════════════════════════════════════════════

class OrangeMoneyService {
  constructor() {
    this.baseUrl     = process.env.ORANGE_MONEY_BASE_URL || 'https://api.orange.com/orange-money-webpay/cm/v1';
    this.merchantKey = process.env.ORANGE_MONEY_MERCHANT_KEY;
  }

  isConfigured() {
    return !!this.merchantKey;
  }

  async initiatePayment({ amount, phone, orderId, returnUrl }) {
    if (!this.isConfigured()) {
      console.log(`[Orange Money SANDBOX] Payment: ${amount} FCFA from ${phone} for order ${orderId}`);
      return {
        success: true,
        transactionId: `OM-SANDBOX-${uuid().substring(0,8).toUpperCase()}`,
        paymentUrl: null,
        status: 'PENDING',
        sandbox: true,
        message: 'Orange Money sandbox — configure ORANGE_MONEY_MERCHANT_KEY for production.',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/webpayment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.merchantKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_key: this.merchantKey,
          currency: 'XAF',
          order_id: orderId,
          amount: Math.round(amount),
          return_url: returnUrl || `${process.env.FRONTEND_URL}/orders/${orderId}?success=1`,
          cancel_url: `${process.env.FRONTEND_URL}/checkout`,
          notif_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/orange/callback`,
          lang: 'en',
          reference: `BUY237-${orderId}`,
        }),
      });
      const data = await response.json();
      if (data.status === '200') {
        return { success: true, transactionId: data.txnid, paymentUrl: data.payment_url, status: 'PENDING' };
      }
      throw new Error(data.message || 'Orange Money payment failed');
    } catch (err) {
      console.error('Orange Money error:', err.message);
      throw err;
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Export singleton instances
// ══════════════════════════════════════════════════════════════════════════════

exports.mtnMoMo    = new MTNMoMoService();
exports.orangeMoney = new OrangeMoneyService();
