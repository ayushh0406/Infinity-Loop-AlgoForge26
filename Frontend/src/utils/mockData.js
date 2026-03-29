/**
 * Mock Data for TrustPool AI
 * All demo data centralized here
 */

export const PROFILES = {
  student: {
    id: 'student',
    name: 'Aditya Sharma',
    type: 'Student',
    icon: '🎓',
    score: 58,
    scoreRange: '45-65',
    loanAmount: 8000,
    maxLoan: 15000,
    rate: 14.5,
    tenure: 6,
    metrics: {
      avgIncome: 12400,
      billRatio: 78,
      consistency: 'Medium',
      activeDays: 15,
      failedTxns: 5,
      savingsRate: 8
    },
    shap: [
      { factor: 'Income Consistency', impact: 12, direction: 'positive' },
      { factor: 'Bill Payments', impact: 9, direction: 'positive' },
      { factor: 'UPI Activity', impact: 7, direction: 'positive' },
      { factor: 'Spending Volatility', impact: -14, direction: 'negative' },
      { factor: 'Failed Transactions', impact: -10, direction: 'negative' }
    ],
    scoreHistory: [
      { month: 'Oct', score: 42 },
      { month: 'Nov', score: 48 },
      { month: 'Dec', score: 51 },
      { month: 'Jan', score: 54 },
      { month: 'Feb', score: 55 },
      { month: 'Mar', score: 58 }
    ]
  },
  gig_worker: {
    id: 'gig_worker',
    name: 'Rahul Kumar',
    type: 'Gig Worker',
    icon: '🛺',
    score: 74,
    scoreRange: '65-80',
    loanAmount: 20000,
    maxLoan: 50000,
    rate: 11.5,
    tenure: 12,
    metrics: {
      avgIncome: 38400,
      billRatio: 94,
      consistency: 'High',
      activeDays: 22,
      failedTxns: 2,
      savingsRate: 18
    },
    shap: [
      { factor: 'Income Consistency', impact: 18, direction: 'positive' },
      { factor: 'Bill Payments', impact: 15, direction: 'positive' },
      { factor: 'UPI Activity', impact: 11, direction: 'positive' },
      { factor: 'Spending Volatility', impact: -8, direction: 'negative' },
      { factor: 'Failed Transactions', impact: -5, direction: 'negative' }
    ],
    scoreHistory: [
      { month: 'Oct', score: 62 },
      { month: 'Nov', score: 65 },
      { month: 'Dec', score: 68 },
      { month: 'Jan', score: 70 },
      { month: 'Feb', score: 72 },
      { month: 'Mar', score: 74 }
    ]
  },
  salaried: {
    id: 'salaried',
    name: 'Priya Menon',
    type: 'Salaried',
    icon: '💼',
    score: 89,
    scoreRange: '80-95',
    loanAmount: 50000,
    maxLoan: 100000,
    rate: 8.9,
    tenure: 24,
    metrics: {
      avgIncome: 85000,
      billRatio: 98,
      consistency: 'Very High',
      activeDays: 28,
      failedTxns: 0,
      savingsRate: 32
    },
    shap: [
      { factor: 'Income Consistency', impact: 24, direction: 'positive' },
      { factor: 'Bill Payments', impact: 22, direction: 'positive' },
      { factor: 'UPI Activity', impact: 18, direction: 'positive' },
      { factor: 'Spending Volatility', impact: -3, direction: 'negative' },
      { factor: 'Failed Transactions', impact: 0, direction: 'neutral' }
    ],
    scoreHistory: [
      { month: 'Oct', score: 82 },
      { month: 'Nov', score: 84 },
      { month: 'Dec', score: 85 },
      { month: 'Jan', score: 86 },
      { month: 'Feb', score: 88 },
      { month: 'Mar', score: 89 }
    ]
  }
};

export const LEDGER_BLOCKS = [
  {
    id: 'BLK_0042',
    type: 'LOAN_DISBURSED',
    amount: 20000,
    userId: 'user_74f2',
    timestamp: '2024-03-28T14:23:00Z',
    prevHash: 'abc12def34gh56ij78kl90mn12op34qr',
    hash: 'def45abc67gh89ij01kl23mn45op67qr',
    status: 'verified'
  },
  {
    id: 'BLK_0041',
    type: 'REPAYMENT',
    amount: 3200,
    userId: 'user_22a1',
    timestamp: '2024-03-28T14:05:00Z',
    prevHash: 'xyz98wvu76ts54rq32po10nm87lk65ji',
    hash: 'abc12def34gh56ij78kl90mn12op34qr',
    status: 'verified'
  },
  {
    id: 'BLK_0040',
    type: 'DEPOSIT',
    amount: 25000,
    userId: 'user_89k3',
    timestamp: '2024-03-28T13:48:00Z',
    prevHash: 'mno45pqr67stu89vwx01yz23ab45cd67',
    hash: 'xyz98wvu76ts54rq32po10nm87lk65ji',
    status: 'verified'
  },
  {
    id: 'BLK_0039',
    type: 'SCORE_UPDATE',
    amount: null,
    userId: 'user_74f2',
    scoreChange: '+4',
    timestamp: '2024-03-28T13:30:00Z',
    prevHash: 'efg12hij34klm56nop78qrs90tuv12wx',
    hash: 'mno45pqr67stu89vwx01yz23ab45cd67',
    status: 'verified'
  },
  {
    id: 'BLK_0038',
    type: 'LOAN_DISBURSED',
    amount: 18000,
    userId: 'user_91c3',
    timestamp: '2024-03-28T12:55:00Z',
    prevHash: 'yz34ab56cd78ef90gh12ij34kl56mn78',
    hash: 'efg12hij34klm56nop78qrs90tuv12wx',
    status: 'verified'
  },
  {
    id: 'BLK_0037',
    type: 'REPAYMENT',
    amount: 5500,
    userId: 'user_45d7',
    timestamp: '2024-03-28T12:22:00Z',
    prevHash: 'op90qr12st34uv56wx78yz90ab12cd34',
    hash: 'yz34ab56cd78ef90gh12ij34kl56mn78',
    status: 'verified'
  },
  {
    id: 'BLK_0036',
    type: 'DEPOSIT',
    amount: 10000,
    userId: 'user_67f8',
    timestamp: '2024-03-28T11:45:00Z',
    prevHash: 'ef56gh78ij90kl12mn34op56qr78st90',
    hash: 'op90qr12st34uv56wx78yz90ab12cd34',
    status: 'verified'
  },
  {
    id: 'BLK_0035',
    type: 'LOAN_DISBURSED',
    amount: 12000,
    userId: 'user_23e9',
    timestamp: '2024-03-28T11:10:00Z',
    prevHash: 'uv12wx34yz56ab78cd90ef12gh34ij56',
    hash: 'ef56gh78ij90kl12mn34op56qr78st90',
    status: 'verified'
  },
  {
    id: 'BLK_0034',
    type: 'SCORE_UPDATE',
    amount: null,
    userId: 'user_91c3',
    scoreChange: '+7',
    timestamp: '2024-03-28T10:35:00Z',
    prevHash: 'kl78mn90op12qr34st56uv78wx90yz12',
    hash: 'uv12wx34yz56ab78cd90ef12gh34ij56',
    status: 'verified'
  },
  {
    id: 'BLK_0033',
    type: 'REPAYMENT',
    amount: 8200,
    userId: 'user_78g1',
    timestamp: '2024-03-28T09:58:00Z',
    prevHash: 'ab34cd56ef78gh90ij12kl34mn56op78',
    hash: 'kl78mn90op12qr34st56uv78wx90yz12',
    status: 'verified'
  },
  {
    id: 'BLK_0032',
    type: 'DEPOSIT',
    amount: 50000,
    userId: 'user_12h4',
    timestamp: '2024-03-28T09:20:00Z',
    prevHash: 'qr90st12uv34wx56yz78ab90cd12ef34',
    hash: 'ab34cd56ef78gh90ij12kl34mn56op78',
    status: 'verified'
  },
  {
    id: 'BLK_0031',
    type: 'LOAN_DISBURSED',
    amount: 15000,
    userId: 'user_56i2',
    timestamp: '2024-03-28T08:45:00Z',
    prevHash: 'gh56ij78kl90mn12op34qr56st78uv90',
    hash: 'qr90st12uv34wx56yz78ab90cd12ef34',
    status: 'verified'
  },
  {
    id: 'BLK_0030',
    type: 'REPAYMENT',
    amount: 4100,
    userId: 'user_89j5',
    timestamp: '2024-03-28T08:10:00Z',
    prevHash: 'wx12yz34ab56cd78ef90gh12ij34kl56',
    hash: 'gh56ij78kl90mn12op34qr56st78uv90',
    status: 'verified'
  },
  {
    id: 'BLK_0029',
    type: 'SCORE_UPDATE',
    amount: null,
    userId: 'user_23e9',
    scoreChange: '-2',
    timestamp: '2024-03-28T07:35:00Z',
    prevHash: 'mn78op90qr12st34uv56wx78yz90ab12',
    hash: 'wx12yz34ab56cd78ef90gh12ij34kl56',
    status: 'verified'
  },
  {
    id: 'BLK_0028',
    type: 'DEPOSIT',
    amount: 15000,
    userId: 'user_34k6',
    timestamp: '2024-03-28T06:55:00Z',
    prevHash: 'cd34ef56gh78ij90kl12mn34op56qr78',
    hash: 'mn78op90qr12st34uv56wx78yz90ab12',
    status: 'verified'
  },
  {
    id: 'BLK_0027',
    type: 'LOAN_DISBURSED',
    amount: 8000,
    userId: 'user_67l7',
    timestamp: '2024-03-28T06:20:00Z',
    prevHash: 'st90uv12wx34yz56ab78cd90ef12gh34',
    hash: 'cd34ef56gh78ij90kl12mn34op56qr78',
    status: 'verified'
  },
  {
    id: 'BLK_0026',
    type: 'REPAYMENT',
    amount: 6700,
    userId: 'user_90m8',
    timestamp: '2024-03-28T05:45:00Z',
    prevHash: 'ij56kl78mn90op12qr34st56uv78wx90',
    hash: 'st90uv12wx34yz56ab78cd90ef12gh34',
    status: 'verified'
  },
  {
    id: 'BLK_0025',
    type: 'DEPOSIT',
    amount: 30000,
    userId: 'user_12n9',
    timestamp: '2024-03-28T05:10:00Z',
    prevHash: 'yz12ab34cd56ef78gh90ij12kl34mn56',
    hash: 'ij56kl78mn90op12qr34st56uv78wx90',
    status: 'verified'
  },
  {
    id: 'BLK_0024',
    type: 'SCORE_UPDATE',
    amount: null,
    userId: 'user_45o0',
    scoreChange: '+5',
    timestamp: '2024-03-28T04:35:00Z',
    prevHash: 'op78qr90st12uv34wx56yz78ab90cd12',
    hash: 'yz12ab34cd56ef78gh90ij12kl34mn56',
    status: 'verified'
  },
  {
    id: 'BLK_0023',
    type: 'LOAN_DISBURSED',
    amount: 22000,
    userId: 'user_78p1',
    timestamp: '2024-03-28T04:00:00Z',
    prevHash: 'ef34gh56ij78kl90mn12op34qr56st78',
    hash: 'op78qr90st12uv34wx56yz78ab90cd12',
    status: 'verified'
  }
];

export const POOL_STATS = {
  totalPool: 24000000, // ₹2.4 Cr
  apy: 12.1,
  activeLoans: 847,
  avgLoanSize: 18400,
  sparklineData: [
    { day: 'Mon', value: 2.1 },
    { day: 'Tue', value: 2.15 },
    { day: 'Wed', value: 2.22 },
    { day: 'Thu', value: 2.28 },
    { day: 'Fri', value: 2.35 },
    { day: 'Sat', value: 2.38 },
    { day: 'Sun', value: 2.40 }
  ],
  riskDistribution: {
    low: 67,
    medium: 28,
    high: 5
  }
};

export const ACTIVITY_FEED = [
  {
    id: 1,
    type: 'deposit',
    user: 'Ankit R.',
    userId: 'user_89k3',
    amount: 25000,
    time: '2 minutes ago'
  },
  {
    id: 2,
    type: 'loan',
    user: 'user_74f2',
    amount: 18000,
    time: '5 minutes ago'
  },
  {
    id: 3,
    type: 'deposit',
    user: 'Priya S.',
    userId: 'user_67f8',
    amount: 10000,
    time: '11 minutes ago'
  },
  {
    id: 4,
    type: 'repayment',
    user: 'user_22a1',
    amount: 3200,
    time: '18 minutes ago'
  },
  {
    id: 5,
    type: 'loan',
    user: 'user_91c3',
    amount: 12000,
    time: '31 minutes ago'
  },
  {
    id: 6,
    type: 'deposit',
    user: 'New Lender',
    userId: 'user_12h4',
    amount: 50000,
    time: '1 hour ago'
  },
  {
    id: 7,
    type: 'repayment',
    user: 'user_45d7',
    amount: 5500,
    time: '1.5 hours ago'
  },
  {
    id: 8,
    type: 'loan',
    user: 'user_23e9',
    amount: 15000,
    time: '2 hours ago'
  },
  {
    id: 9,
    type: 'deposit',
    user: 'Vikram M.',
    userId: 'user_34k6',
    amount: 15000,
    time: '2.5 hours ago'
  },
  {
    id: 10,
    type: 'repayment',
    user: 'user_78g1',
    amount: 8200,
    time: '3 hours ago'
  }
];

export const IMPROVEMENT_TIPS = [
  {
    id: 1,
    step: 1,
    tip: 'Pay 2 more recurring bills via UPI',
    points: 8,
    timeline: '30 days'
  },
  {
    id: 2,
    step: 2,
    tip: 'Keep monthly income above ₹30,000',
    points: 6,
    timeline: 'next month'
  },
  {
    id: 3,
    step: 3,
    tip: 'Reduce cash withdrawals by 20%',
    points: 4,
    timeline: '45 days'
  }
];

export const CHAIN_STATS = {
  totalBlocks: 2847,
  integrity: 'valid',
  lastBlockTime: '34 seconds ago',
  totalValueRecorded: 420000000, // ₹4.2 Cr
  hashAlgorithm: 'SHA-256',
  avgBlockTime: '~47 seconds'
};

export const LANDING_STATS = [
  {
    value: 400000000,
    label: 'Credit-Invisible Indians',
    suffix: '+',
    formatAsNumber: true
  },
  {
    value: 230000000000,
    label: 'Unmet Credit Demand in India',
    prefix: '₹',
    formatAsIndian: true
  },
  {
    value: 74,
    label: 'Approval Rate',
    suffix: '%'
  },
  {
    value: 60,
    label: 'Score Generated',
    prefix: '< ',
    suffix: 's'
  }
];

export const COMPARISON_TABLE = {
  headers: ['Feature', 'CIBIL', 'Banks', 'TrustPool AI'],
  rows: [
    {
      feature: 'Data Required',
      cibil: '2yr credit history',
      banks: 'Bank statements',
      trustpool: '6mo UPI data'
    },
    {
      feature: 'Processing Time',
      cibil: 'Days',
      banks: 'Weeks',
      trustpool: '60 seconds'
    },
    {
      feature: 'Explainability',
      cibil: false,
      banks: false,
      trustpool: true
    },
    {
      feature: 'Inclusivity',
      cibil: 'Low',
      banks: 'Low',
      trustpool: 'High'
    },
    {
      feature: 'Transparency',
      cibil: false,
      banks: false,
      trustpool: true
    },
    {
      feature: 'Informal Workers',
      cibil: false,
      banks: false,
      trustpool: true
    }
  ]
};
