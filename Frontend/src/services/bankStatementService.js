/**
 * Bank Statement Analysis Service
 * Frontend integration for RiBIT standard bank statement processing
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const bankStatementService = {
  /**
   * Upload and analyze bank statement (RiBIT JSON format)
   */
  async analyzeBankStatement(statementData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bank-statement/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statementData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Bank statement analyzed:', data);
      return data;
    } catch (error) {
      console.error('Error analyzing bank statement:', error);
      throw error;
    }
  },

  /**
   * Parse transaction narrative to identify merchant/category
   */
  parseNarration(narration) {
    const categories = {
      salary: /salary|payroll|ctc|monthly pay/i,
      investment: /mutual|stocks|sip|investment|trading/i,
      bill_payment: /electricity|water|gas|phone|broadband|utility/i,
      subscription: /netflix|prime|spotify|subscription|gym/i,
      food: /swiggy|zomato|food|restaurant|cafe/i,
      shopping: /amazon|flipkart|shoppers|store|mall/i,
      transfer: /transfer|trf|neft|imps|p2p/i,
      emi: /emi|loan|installment|repayment/i,
      withdrawal: /withdraw|atm|cash/i,
    };

    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(narration)) {
        return category;
      }
    }
    return 'other';
  },

  /**
   * Format transaction for display
   */
  formatTransaction(txn) {
    return {
      id: txn.txnId,
      date: new Date(txn.transactionTimestamp),
      amount: parseFloat(txn.amount),
      type: txn.type,
      mode: txn.mode,
      narration: txn.narration,
      category: this.parseNarration(txn.narration),
      balance: parseFloat(txn.currentBalance),
      reference: txn.reference,
    };
  },

  /**
   * Generate RiBIT request template
   */
  generateStatementTemplate() {
    return {
      header: {
        accountId: '',
        accountHolder: '',
        ifsc: '',
        accountType: 'SAVINGS',
        requestTimestamp: new Date().toISOString(),
      },
      transactions: [],
    };
  },

  /**
   * Validate RiBIT format
   */
  validateStatementFormat(statement) {
    const errors = [];

    if (!statement.header) {
      errors.push('Missing header object');
    } else {
      if (!statement.header.accountId) errors.push('Missing accountId');
      if (!statement.header.accountHolder) errors.push('Missing accountHolder');
    }

    if (!Array.isArray(statement.transactions)) {
      errors.push('Transactions must be an array');
    } else if (statement.transactions.length === 0) {
      errors.push('No transactions provided');
    } else {
      // Validate transaction structure
      statement.transactions.forEach((txn, idx) => {
        if (!txn.txnId) errors.push(`Transaction ${idx}: Missing txnId`);
        if (!txn.type) errors.push(`Transaction ${idx}: Missing type`);
        if (!txn.amount) errors.push(`Transaction ${idx}: Missing amount`);
        if (!txn.transactionTimestamp) errors.push(`Transaction ${idx}: Missing timestamp`);
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

export default bankStatementService;
