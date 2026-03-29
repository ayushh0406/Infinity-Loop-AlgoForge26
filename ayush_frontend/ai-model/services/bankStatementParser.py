"""
ReBIT Standard Bank Statement Parser
Processes RBI Account Aggregator JSON format for financial metrics extraction
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
from collections import defaultdict
import re
import json

class BankStatementParser:
    """
    Parses RBI AA (Account Aggregator) bank statement JSON (ReBIT standard)
    Extracts financial metrics and transaction patterns for trust scoring
    """
    
    # Transaction category patterns
    TRANSACTION_CATEGORIES = {
        'salary': r'(salary|payroll|ctc|monthly pay|wages|remuneration)',
        'investment': r'(mutual|stocks|sip|investment|trading)',
        'bill_payment': r'(electricity|water|gas|phone|broadband|internet|utility|bill)',
        'subscription': r'(netflix|prime|spotify|subscription|membership|gym)',
        'food_dining': r'(swiggy|zomato|food|restaurant|cafe|pizza|biryani)',
        'shopping': r'(amazon|flipkart|shoppers|store|mall|purchase|clothing)',
        'transfer': r'(transfer|trf|neft|imps|p2p)',
        'emi': r'(emi|loan|credit|installment|repayment)',
        'withdrawal': r'(withdraw|atm|cash|withdrawal)',
        'insurance': r'(insurance|premium|health|life|coverage)',
    }
    
    def __init__(self, bank_statement_json: Dict[str, Any]):
        """
        Initialize parser with ReBIT standard JSON
        
        Args:
            bank_statement_json: {
                "header": {"accountId": "...", "accountHolder": "...", "ifsc": "..."},
                "transactions": [transaction objects]
            }
        """
        self.header = bank_statement_json.get('header', {})
        self.transactions = bank_statement_json.get('transactions', [])
        self.period_start = None
        self.period_end = None
        self._parse_period()
    
    def _parse_period(self):
        """Extract period from transactions"""
        if self.transactions:
            dates = [self._parse_date(t.get('transactionTimestamp')) for t in self.transactions]
            dates = [d for d in dates if d]
            if dates:
                self.period_start = min(dates)
                self.period_end = max(dates)
    
    def _parse_date(self, date_string: str) -> datetime:
        """Parse ISO 8601 date string"""
        try:
            return datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        except:
            return None
    
    def _categorize_transaction(self, narration: str) -> str:
        """
        Categorize transaction based on narration (VPA/merchant string)
        
        Args:
            narration: Transaction narrative (e.g., "UPI-SWIGGY-PAY-@HDFC-23423")
        
        Returns:
            Category name
        """
        narration_lower = narration.lower()
        
        for category, pattern in self.TRANSACTION_CATEGORIES.items():
            if re.search(pattern, narration_lower):
                return category
        
        return 'other'
    
    def calculate_cashflow_metrics(self) -> Dict[str, Any]:
        """
        Calculate key cash flow metrics from transactions
        
        Returns: {
            'total_credits': float,
            'total_debits': float,
            'average_monthly_income': float,
            'average_monthly_spend': float,
            'savings_rate': float (0-100),
            'months_analyzed': int,
            'daily_balance_variance': float,
            'min_balance': float,
            'max_balance': float,
            'average_balance': float
        }
        """
        if not self.transactions:
            return {}
        
        total_credits = 0
        total_debits = 0
        balances = []
        monthly_credits = defaultdict(float)
        monthly_debits = defaultdict(float)
        
        for txn in self.transactions:
            amount = float(txn.get('amount', 0))
            txn_type = txn.get('type', '').upper()
            current_balance = float(txn.get('currentBalance', 0))
            txn_date = self._parse_date(txn.get('transactionTimestamp'))
            
            if current_balance:
                balances.append(current_balance)
            
            month_key = txn_date.strftime('%Y-%m') if txn_date else None
            
            if txn_type == 'CREDIT':
                total_credits += amount
                if month_key:
                    monthly_credits[month_key] += amount
            elif txn_type == 'DEBIT':
                total_debits += amount
                if month_key:
                    monthly_debits[month_key] += amount
        
        # Calculate monthly averages
        months_count = max(len(monthly_credits), len(monthly_debits), 1)
        avg_monthly_income = total_credits / months_count if months_count else 0
        avg_monthly_spend = total_debits / months_count if months_count else 0
        
        # Calculate savings rate
        total_net = total_credits - total_debits
        savings_rate = (total_net / total_credits * 100) if total_credits > 0 else 0
        savings_rate = max(0, min(100, savings_rate))  # Clamp 0-100
        
        # Balance variance
        if balances:
            balance_variance = max(balances) - min(balances) if len(balances) > 1 else 0
            avg_balance = sum(balances) / len(balances)
        else:
            balance_variance = 0
            avg_balance = 0
        
        return {
            'total_credits': round(total_credits, 2),
            'total_debits': round(total_debits, 2),
            'average_monthly_income': round(avg_monthly_income, 2),
            'average_monthly_spend': round(avg_monthly_spend, 2),
            'savings_rate': round(savings_rate, 2),
            'months_analyzed': months_count,
            'balance_variance': round(balance_variance, 2),
            'min_balance': round(min(balances), 2) if balances else 0,
            'max_balance': round(max(balances), 2) if balances else 0,
            'average_balance': round(avg_balance, 2),
        }
    
    def analyze_spending_patterns(self) -> Dict[str, Any]:
        """
        Analyze transaction patterns by category
        
        Returns: {
            'categories': {
                'category_name': {
                    'count': int,
                    'total_amount': float,
                    'percentage': float,
                    'avg_transaction': float,
                    'frequency': str (daily/weekly/monthly/rare)
                }
            },
            'top_categories': [list of top 3],
            'transaction_mode_breakdown': {'UPI': %, 'NEFT': %, ...}
        }
        """
        category_stats = defaultdict(lambda: {'count': 0, 'amount': 0, 'dates': []})
        mode_stats = defaultdict(int)
        total_debit_amount = 0
        
        for txn in self.transactions:
            if txn.get('type', '').upper() != 'DEBIT':
                continue
            
            narration = txn.get('narration', '')
            category = self._categorize_transaction(narration)
            amount = float(txn.get('amount', 0))
            mode = txn.get('mode', '').upper()
            txn_date = self._parse_date(txn.get('transactionTimestamp'))
            
            category_stats[category]['count'] += 1
            category_stats[category]['amount'] += amount
            category_stats[category]['dates'].append(txn_date)
            mode_stats[mode] += 1
            total_debit_amount += amount
        
        # Calculate frequency
        def get_frequency(dates: List[datetime]) -> str:
            if len(dates) < 2:
                return 'rare'
            date_diffs = []
            for i in range(1, len(dates)):
                diff = (dates[i] - dates[i-1]).days
                if diff > 0:
                    date_diffs.append(diff)
            
            if not date_diffs:
                return 'rare'
            avg_diff = sum(date_diffs) / len(date_diffs)
            
            if avg_diff <= 1:
                return 'daily'
            elif avg_diff <= 3:
                return 'every_few_days'
            elif avg_diff <= 7:
                return 'weekly'
            elif avg_diff <= 30:
                return 'monthly'
            else:
                return 'rare'
        
        # Build category breakdown
        categories_breakdown = {}
        for category, stats in category_stats.items():
            stats['dates'].sort()
            percentage = (stats['amount'] / total_debit_amount * 100) if total_debit_amount > 0 else 0
            categories_breakdown[category] = {
                'count': stats['count'],
                'total_amount': round(stats['amount'], 2),
                'percentage': round(percentage, 2),
                'avg_transaction': round(stats['amount'] / stats['count'], 2) if stats['count'] > 0 else 0,
                'frequency': get_frequency(stats['dates']),
            }
        
        # Top 3 categories by spending
        top_categories = sorted(
            categories_breakdown.items(),
            key=lambda x: x[1]['total_amount'],
            reverse=True
        )[:3]
        top_categories = [{'name': k, **v} for k, v in top_categories]
        
        # Transaction mode breakdown
        total_transactions = sum(mode_stats.values()) or 1
        mode_breakdown = {
            mode: round(count / total_transactions * 100, 2)
            for mode, count in mode_stats.items()
        }
        
        return {
            'categories': categories_breakdown,
            'top_categories': top_categories,
            'transaction_mode_breakdown': mode_breakdown,
        }
    
    def detect_regular_income(self) -> Dict[str, Any]:
        """
        Detect regular income sources (salary, etc.)
        
        Returns: {
            'has_regular_income': bool,
            'regular_income_amount': float,
            'income_frequency': str,
            'last_income_date': str (ISO),
            'income_sources': [list of identified sources],
            'income_stability_score': 0-100
        }
        """
        income_txns = []
        
        for txn in self.transactions:
            if txn.get('type', '').upper() != 'CREDIT':
                continue
            
            narration = txn.get('narration', '')
            amount = float(txn.get('amount', 0))
            txn_date = self._parse_date(txn.get('transactionTimestamp'))
            
            # Check if salary-like pattern
            if re.search(self.TRANSACTION_CATEGORIES['salary'], narration.lower()):
                income_txns.append({
                    'amount': amount,
                    'date': txn_date,
                    'narration': narration
                })
        
        if not income_txns:
            return {
                'has_regular_income': False,
                'regular_income_amount': 0,
                'income_frequency': 'none',
                'last_income_date': None,
                'income_sources': [],
                'income_stability_score': 0,
            }
        
        # Sort by date
        income_txns.sort(key=lambda x: x['date'])
        
        # Calculate frequency
        amounts = [t['amount'] for t in income_txns]
        avg_amount = sum(amounts) / len(amounts)
        
        # Check consistency (all within 10% of average)
        consistent_count = sum(1 for a in amounts if abs(a - avg_amount) / avg_amount < 0.1)
        consistency_score = (consistent_count / len(amounts) * 100) if amounts else 0
        
        # Frequency analysis
        dates = [t['date'] for t in income_txns if t['date']]
        frequency = 'irregular'
        if len(dates) > 1:
            date_diffs = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
            avg_days = sum(date_diffs) / len(date_diffs)
            
            if 20 <= avg_days <= 35:
                frequency = 'monthly'
            elif 3 <= avg_days <= 10:
                frequency = 'weekly'
            elif avg_days > 45:
                frequency = 'irregular'
        
        last_income_date = income_txns[-1]['date'].isoformat() if income_txns[-1]['date'] else None
        
        return {
            'has_regular_income': consistency_score > 70,
            'regular_income_amount': round(avg_amount, 2),
            'income_frequency': frequency,
            'last_income_date': last_income_date,
            'income_sources': list(set(t['narration'] for t in income_txns)),
            'income_stability_score': round(consistency_score, 2),
        }
    
    def detect_emi_patterns(self) -> Dict[str, Any]:
        """
        Detect EMI/loan repayment patterns
        
        Returns: {
            'has_emi': bool,
            'emi_transactions': [list of EMI txns],
            'monthly_emi_amount': float,
            'emi_count': int,
            'emi_regularity_score': 0-100
        }
        """
        emi_txns = []
        
        for txn in self.transactions:
            if txn.get('type', '').upper() != 'DEBIT':
                continue
            
            narration = txn.get('narration', '')
            if re.search(self.TRANSACTION_CATEGORIES['emi'], narration.lower()):
                emi_txns.append({
                    'amount': float(txn.get('amount', 0)),
                    'date': self._parse_date(txn.get('transactionTimestamp')),
                    'narration': narration,
                    'reference': txn.get('reference', '')
                })
        
        if not emi_txns:
            return {
                'has_emi': False,
                'emi_transactions': [],
                'monthly_emi_amount': 0,
                'emi_count': 0,
                'emi_regularity_score': 0,
            }
        
        # Group by reference to identify unique EMIs
        emi_groups = defaultdict(list)
        for txn in emi_txns:
            ref = txn['reference'] or txn['narration']
            emi_groups[ref].append(txn)
        
        # Calculate regularity for each EMI
        regularity_scores = []
        for ref, txns in emi_groups.items():
            if len(txns) > 1:
                amounts = [t['amount'] for t in txns]
                avg_amount = sum(amounts) / len(amounts)
                consistent = sum(1 for a in amounts if abs(a - avg_amount) / avg_amount < 0.05)
                score = (consistent / len(amounts) * 100)
                regularity_scores.append(score)
        
        avg_regularity = (sum(regularity_scores) / len(regularity_scores)) if regularity_scores else 0
        
        return {
            'has_emi': len(emi_groups) > 0,
            'emi_transactions': emi_txns,
            'monthly_emi_amount': round(sum(t['amount'] for t in emi_txns) / max(len(emi_txns), 1), 2),
            'emi_count': len(emi_txns),
            'emi_regularity_score': round(avg_regularity, 2),
        }
    
    def generate_comprehensive_report(self) -> Dict[str, Any]:
        """
        Generate comprehensive financial analysis report
        
        Returns: Complete financial profile for scoring model
        """
        return {
            'period': {
                'start': self.period_start.isoformat() if self.period_start else None,
                'end': self.period_end.isoformat() if self.period_end else None,
            },
            'account_info': self.header,
            'cashflow': self.calculate_cashflow_metrics(),
            'spending_patterns': self.analyze_spending_patterns(),
            'income': self.detect_regular_income(),
            'emi': self.detect_emi_patterns(),
        }


# Utility function for quick parsing
def parse_bank_statement(statement_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Quick parse function for ReBIT standard bank statement JSON
    
    Args:
        statement_json: Full ReBIT JSON response
    
    Returns:
        Comprehensive financial analysis report
    """
    parser = BankStatementParser(statement_json)
    return parser.generate_comprehensive_report()
