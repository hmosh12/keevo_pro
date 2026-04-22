import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  ArrowRightLeft, 
  FileText,
  ChevronDown,
  Filter,
  Download,
  TrendingUp,
  Settings,
  Coins,
  Globe,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Shield,
  UserCheck,
  ShoppingCart,
  X,
  Trash2,
  RefreshCcw,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../lib/utils';

const accountTypes: Record<string, 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense'> = {
  'Cash': 'Asset',
  'Inventory': 'Asset',
  'Accounts Receivable': 'Asset',
  'Accounts Payable': 'Liability',
  'Owner\'s Equity': 'Equity',
  'Sales Revenue': 'Revenue',
  'Office Expenses': 'Expense',
  'Rent Expense': 'Expense',
  'Salaries Expense': 'Expense',
};

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  SAR: 'ر.س',
  EGP: 'ج.م',
  IQD: 'د.ع',
  AED: 'د.إ',
  KWD: 'د.ك',
  QAR: 'ر.ق',
  BHD: 'د.ب',
  OMR: 'ر.ع',
};

export default function Accounting({ 
  user, 
  isRTL, 
  currencySettings, 
  setCurrencySettings, 
  refreshData,
  sales = [],
  auditLogs = []
}: { 
  user: any, 
  isRTL: boolean, 
  currencySettings: any, 
  setCurrencySettings: any, 
  refreshData: () => void,
  sales?: any[],
  auditLogs?: any[]
}) {
  const [view, setView] = useState<'journal' | 'ledger' | 'reports' | 'audit' | 'settings'>('journal');
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<string | null>(null);

  // Stats calculation
  const totalSales = sales.reduce((acc, s) => acc + (s.total || 0), 0);
  const totalCount = sales.length;
  const avgSale = totalCount > 0 ? totalSales / totalCount : 0;
  
  const salesData = sales.reduce((acc: any[], sale) => {
    const period = new Date(sale.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    let existing = acc.find(d => d.period === period);
    if (!existing) {
      existing = { period, sales: 0, count: 0 };
      acc.push(existing);
    }
    existing.sales += sale.total;
    existing.count += 1;
    return acc;
  }, []).sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime()).slice(-7);

  useEffect(() => {
    if (!user?.companyId) return;

    const fetchEntries = async () => {
      try {
        const rawEntries = await api.generic.list(user.companyId, 'journal_entries');
        const flattenedEntries: any[] = [];
        
        rawEntries.forEach((entry: any) => {
          // Lines might be stored as JSON string in SQLite
          const lines = typeof entry.lines === 'string' ? JSON.parse(entry.lines) : (entry.lines || []);
          lines.forEach((line: any, index: number) => {
            flattenedEntries.push({
              id: `${entry.id}-${index}`,
              date: entry.date,
              description: entry.description,
              ref: entry.reference || 'N/A',
              account: line.account,
              debit: line.debit || 0,
              credit: line.credit || 0,
              entryId: entry.id
            });
          });
        });
        setEntries(flattenedEntries);
      } catch (err) {
        console.error('Error fetching journal entries:', err);
      }
    };

    fetchEntries();
  }, [user?.companyId]);

  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: 'Office Expenses',
    paymentMethod: 'Cash',
    reference: ''
  });
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    lines: [
      { account: '', debit: 0, credit: 0 },
      { account: '', debit: 0, credit: 0 }
    ]
  });

  const [rates, setRates] = useState(currencySettings.rates);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const handleUpdateRate = (curr: string, rate: number) => {
    const newRates = { ...rates, [curr]: rate };
    setRates(newRates);
    setCurrencySettings({ ...currencySettings, rates: newRates });
  };

  const addEntryLine = () => {
    setEntryForm({
      ...entryForm,
      lines: [...entryForm.lines, { account: '', debit: 0, credit: 0 }]
    });
  };

  const removeEntryLine = (index: number) => {
    if (entryForm.lines.length <= 2) return;
    const newLines = [...entryForm.lines];
    newLines.splice(index, 1);
    setEntryForm({ ...entryForm, lines: newLines });
  };

  const updateEntryLine = (index: number, field: string, value: any) => {
    const newLines = [...entryForm.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setEntryForm({ ...entryForm, lines: newLines });
  };

  const totalDebit = entryForm.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = entryForm.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert(isRTL ? 'يجب أن يتساوى المدين مع الدائن' : 'Debits must equal credits');
      return;
    }
    
    if (!user?.companyId) {
      alert(isRTL ? 'خطأ في تحديد الشركة' : 'Company ID not found');
      return;
    }

    try {
      const entryData = {
        ...entryForm,
        totalDebit,
        totalCredit,
        createdAt: new Date().toISOString(),
        createdBy: user.id
      };

      await api.generic.create(user.companyId, 'journal_entries', entryData);

      // Also create audit log
      await api.generic.create(user.companyId, 'audit_logs', {
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'create',
        entity: 'JournalEntry',
        entityId: entryForm.reference || 'N/A',
        details: `Created multi-line journal entry: ${entryForm.description}`
      });

      setShowEntryModal(false);
      setEntryForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        lines: [
          { account: '', debit: 0, credit: 0 },
          { account: '', debit: 0, credit: 0 }
        ]
      });
      refreshData();
      alert(isRTL ? 'تم حفظ القيد بنجاح' : 'Journal entry saved successfully');
    } catch (error) {
      console.error('Error saving journal entry:', error);
      alert(isRTL ? 'حدث خطأ أثناء حفظ القيد' : 'Error saving journal entry');
    }
  };
  
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !expenseForm.amount) return;

    const amount = parseFloat(expenseForm.amount);
    
    try {
      // Create a journal entry from the expense
      const entryData = {
        date: expenseForm.date,
        description: expenseForm.description,
        reference: expenseForm.reference,
        totalDebit: amount,
        totalCredit: amount,
        lines: [
          { account: expenseForm.category, debit: amount, credit: 0 },
          { account: expenseForm.paymentMethod, debit: 0, credit: amount }
        ],
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        type: 'Expense'
      };

      await api.generic.create(user.companyId, 'journal_entries', entryData);

      // Audit log
      await api.generic.create(user.companyId, 'audit_logs', {
        timestamp: new Date().toISOString(),
        user: user.email,
        action: 'create',
        entity: 'ExpenseEntry',
        entityId: expenseForm.reference || 'N/A',
        details: `Recorded expense: ${expenseForm.description} - ${amount}`
      });

      setShowExpenseModal(false);
      setExpenseForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        category: 'Office Expenses',
        paymentMethod: 'Cash',
        reference: ''
      });
      refreshData();
      alert(isRTL ? 'تم تسجيل المصروف بنجاح' : 'Expense recorded successfully');
    } catch (err) {
      console.error('Error recording expense:', err);
      alert(isRTL ? 'حدث خطأ أثناء تسجيل المصروف' : 'Error recording expense');
    }
  };

  const accountBalances = entries.reduce((acc, entry) => {
    if (!acc[entry.account]) acc[entry.account] = 0;
    const type = accountTypes[entry.account];
    if (type === 'Asset' || type === 'Expense') {
      acc[entry.account] += (entry.debit - entry.credit);
    } else {
      acc[entry.account] += (entry.credit - entry.debit);
    }
    return acc;
  }, {} as Record<string, number>);

  const getReportData = () => {
    const revenue = Object.entries(accountBalances)
      .filter(([acc]) => accountTypes[acc] === 'Revenue')
      .map(([name, balance]) => ({ name, balance: balance as number }));
    
    const expenses = Object.entries(accountBalances)
      .filter(([acc]) => accountTypes[acc] === 'Expense')
      .map(([name, balance]) => ({ name, balance: balance as number }));

    const assets = Object.entries(accountBalances)
      .filter(([acc]) => accountTypes[acc] === 'Asset')
      .map(([name, balance]) => ({ name, balance: balance as number }));

    const liabilities = Object.entries(accountBalances)
      .filter(([acc]) => accountTypes[acc] === 'Liability')
      .map(([name, balance]) => ({ name, balance: balance as number }));

    const equity = Object.entries(accountBalances)
      .filter(([acc]) => accountTypes[acc] === 'Equity')
      .map(([name, balance]) => ({ name, balance: balance as number }));

    const totalRevenue = revenue.reduce((sum, r) => sum + r.balance, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.balance, 0);
    const netIncome = totalRevenue - totalExpenses;

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.balance, 0);
    const totalEquity = equity.reduce((sum, e) => sum + e.balance, 0) + netIncome;

    return {
      revenue,
      expenses,
      totalRevenue,
      totalExpenses,
      netIncome,
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      netIncomeForEquity: netIncome
    };
  };

  const getTrialBalanceData = () => {
    const filteredEntries = entries.filter(entry => 
      entry.date >= dateRange.start && entry.date <= dateRange.end
    );

    const balances: Record<string, { debit: number, credit: number }> = {};

    filteredEntries.forEach(entry => {
      if (!balances[entry.account]) {
        balances[entry.account] = { debit: 0, credit: 0 };
      }
      balances[entry.account].debit += entry.debit;
      balances[entry.account].credit += entry.credit;
    });

    const trialBalance = Object.entries(balances).map(([name, { debit, credit }]) => ({
      name,
      debit,
      credit
    }));

    const totalDebits = trialBalance.reduce((sum, item) => sum + item.debit, 0);
    const totalCredits = trialBalance.reduce((sum, item) => sum + item.credit, 0);

    return { trialBalance, totalDebits, totalCredits };
  };

  const reportData = getReportData();
  const trialData = getTrialBalanceData();

  return (
    <div className="space-y-6">
      {/* Accounting Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-fit">
        <button 
          onClick={() => setView('journal')}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            view === 'journal' ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          {isRTL ? 'القيود اليومية' : 'Journal Entries'}
        </button>
        <button 
          onClick={() => setView('ledger')}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            view === 'ledger' ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          {isRTL ? 'دفتر الأستاذ' : 'General Ledger'}
        </button>
        <button 
          onClick={() => setView('reports')}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            view === 'reports' ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          {isRTL ? 'التقارير المالية' : 'Financial Reports'}
        </button>
        <button 
          onClick={() => setView('audit')}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            view === 'audit' ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          {isRTL ? 'سجل التدقيق' : 'Audit Log'}
        </button>
        <button 
          onClick={() => setView('settings')}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            view === 'settings' ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          <Settings size={18} />
        </button>
      </div>

      {view === 'journal' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder={isRTL ? 'البحث في القيود...' : 'Search entries...'}
                  className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
                <Calendar size={20} />
              </button>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-all border border-rose-100"
              >
                <ArrowDownRight size={18} />
                <span>{isRTL ? 'تسجيل مصروف' : 'Record Expense'}</span>
              </button>
              <button 
                onClick={() => setShowEntryModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                <Plus size={18} />
                <span>{isRTL ? 'قيد جديد' : 'New Entry'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'التاريخ' : 'Date'}</th>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'البيان' : 'Description'}</th>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'الحساب' : 'Account'}</th>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'مدين' : 'Debit'}</th>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'دائن' : 'Credit'}</th>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'العملة' : 'Currency'}</th>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'المرجع' : 'Reference'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.length > 0 ? entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500">{entry.date}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{entry.description}</td>
                      <td className="px-6 py-4">
                        <span className="text-indigo-600 font-semibold">{entry.account}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {entry.debit > 0 ? `${currencySettings.baseCurrency} ${entry.debit.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {entry.credit > 0 ? `${currencySettings.baseCurrency} ${entry.credit.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                          {currencySettings.baseCurrency}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">{entry.ref}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        <ArrowRightLeft size={48} className="mx-auto mb-4 opacity-20" />
                        <p>{isRTL ? 'لا توجد قيود يومية بعد' : 'No journal entries found yet'}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === 'ledger' && (
        <div className="space-y-6">
          {!selectedLedgerAccount ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(accountTypes).map((account) => {
                const balance = accountBalances[account] || 0;
                const type = accountTypes[account];
                return (
                  <div 
                    key={account}
                    onClick={() => setSelectedLedgerAccount(account)}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn(
                        "p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors",
                        type === 'Asset' ? "bg-emerald-50 text-emerald-600" :
                        type === 'Liability' ? "bg-rose-50 text-rose-600" :
                        type === 'Equity' ? "bg-amber-50 text-amber-600" :
                        type === 'Revenue' ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-600"
                      )}>
                        <FileText size={24} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-full uppercase tracking-wider">
                        {isRTL ? (
                          type === 'Asset' ? 'أصل' :
                          type === 'Liability' ? 'خصم' :
                          type === 'Equity' ? 'حقوق ملكية' :
                          type === 'Revenue' ? 'إيراد' : 'مصروف'
                        ) : type}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-1">{account}</h4>
                    <div className="flex items-baseline gap-2">
                      <span className={cn(
                        "text-2xl font-bold",
                        balance < 0 ? "text-rose-600" : balance > 0 ? "text-emerald-600" : "text-slate-400"
                      )}>
                        {currencySettings.baseCurrency} {Math.abs(balance).toFixed(2)}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {balance > 0 ? (isRTL ? 'مدين' : 'Debit') : balance < 0 ? (isRTL ? 'دائن' : 'Credit') : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setSelectedLedgerAccount(null)}
                  className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors"
                >
                  <ChevronDown size={20} className="rotate-90 rtl:-rotate-90" />
                  <span>{isRTL ? 'العودة لجميع الحسابات' : 'Back to All Accounts'}</span>
                </button>
                <div className="text-right">
                  <h3 className="text-xl font-bold text-slate-800">{selectedLedgerAccount}</h3>
                  <p className="text-sm text-slate-500">
                    {isRTL ? 'الرصيد الحالي:' : 'Current Balance:'} 
                    <span className={cn(
                      "ml-2 font-bold",
                      (accountBalances[selectedLedgerAccount] || 0) > 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {currencySettings.baseCurrency} {Math.abs(accountBalances[selectedLedgerAccount] || 0).toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left rtl:text-right">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-semibold">{isRTL ? 'التاريخ' : 'Date'}</th>
                        <th className="px-6 py-4 font-semibold">{isRTL ? 'البيان' : 'Description'}</th>
                        <th className="px-6 py-4 font-semibold">{isRTL ? 'مدين' : 'Debit'}</th>
                        <th className="px-6 py-4 font-semibold">{isRTL ? 'دائن' : 'Credit'}</th>
                        <th className="px-6 py-4 font-semibold">{isRTL ? 'الرصيد' : 'Balance'}</th>
                        <th className="px-6 py-4 font-semibold">{isRTL ? 'المرجع' : 'Reference'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        let runningBalance = 0;
                        const type = accountTypes[selectedLedgerAccount];
                        return entries
                          .filter(e => e.account === selectedLedgerAccount)
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map((entry) => {
                            if (type === 'Asset' || type === 'Expense') {
                              runningBalance += (entry.debit - entry.credit);
                            } else {
                              runningBalance += (entry.credit - entry.debit);
                            }
                            return (
                              <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-500">{entry.date}</td>
                                <td className="px-6 py-4 font-medium text-slate-700">{entry.description}</td>
                                <td className="px-6 py-4 font-bold text-emerald-600">
                                  {entry.debit > 0 ? `${currencySettings.baseCurrency} ${entry.debit.toFixed(2)}` : '-'}
                                </td>
                                <td className="px-6 py-4 font-bold text-rose-600">
                                  {entry.credit > 0 ? `${currencySettings.baseCurrency} ${entry.credit.toFixed(2)}` : '-'}
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-800">
                                  {currencySettings.baseCurrency} {Math.abs(runningBalance).toFixed(2)}
                                  <span className="text-[10px] ml-1 opacity-50">
                                    {runningBalance > 0 ? (isRTL ? 'مدين' : 'Dr') : runningBalance < 0 ? (isRTL ? 'دائن' : 'Cr') : ''}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-slate-400">{entry.ref}</td>
                              </tr>
                            );
                          });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'reports' && !activeReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 'income', title: isRTL ? 'قائمة الدخل' : 'Income Statement', icon: TrendingUp, desc: isRTL ? 'الأرباح والخسائر خلال فترة محددة' : 'Revenue and expenses over time' },
            { id: 'balance', title: isRTL ? 'الميزانية العمومية' : 'Balance Sheet', icon: FileText, desc: isRTL ? 'الأصول والخصوم وحقوق الملكية' : 'Assets, liabilities, and equity' },
            { id: 'sales', title: isRTL ? 'تقرير المبيعات' : 'Sales Report', icon: ShoppingCart, desc: isRTL ? 'تحليل المبيعات، المتوسط، والعدد' : 'Sales analysis, average, and volume' },
            { id: 'trial', title: isRTL ? 'ميزان المراجعة' : 'Trial Balance', icon: ArrowRightLeft, desc: isRTL ? 'ملخص لجميع أرصدة الحسابات' : 'Summary of all account balances' },
          ].map((report) => (
            <div 
              key={report.id} 
              onClick={() => setActiveReport(report.id)}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <report.icon size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-1">{report.title}</h4>
              <p className="text-sm text-slate-500 mb-6">{report.desc}</p>
              <button className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <span>{isRTL ? 'عرض التقرير' : 'View Report'}</span>
                <ChevronDown size={16} className="-rotate-90 rtl:rotate-90" />
              </button>
            </div>
          ))}
        </div>
      )}

      {view === 'reports' && activeReport === 'income' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setActiveReport(null)}
              className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors"
            >
              <ChevronDown size={20} className="rotate-90 rtl:-rotate-90" />
              <span>{isRTL ? 'العودة للتقارير' : 'Back to Reports'}</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
              <Download size={18} />
              <span>{isRTL ? 'تصدير PDF' : 'Export PDF'}</span>
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold text-slate-800">{isRTL ? 'قائمة الدخل' : 'Income Statement'}</h3>
              <p className="text-slate-500">{isRTL ? 'للفترة المنتهية في' : 'For the period ended'} {new Date().toLocaleDateString()}</p>
            </div>

            <div className="space-y-8">
              {/* Revenue Section */}
              <section>
                <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-indigo-50 pb-2">
                  {isRTL ? 'الإيرادات' : 'Revenue'}
                </h4>
                <div className="space-y-3">
                  {reportData.revenue.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-slate-600">{item.name}</span>
                      <span className="font-medium text-slate-800">{currencySettings.baseCurrency} {item.balance.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 font-bold text-slate-800">
                    <span>{isRTL ? 'إجمالي الإيرادات' : 'Total Revenue'}</span>
                    <span>{currencySettings.baseCurrency} {reportData.totalRevenue.toFixed(2)}</span>
                  </div>
                </div>
              </section>

              {/* Expenses Section */}
              <section>
                <h4 className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-4 border-b border-rose-50 pb-2">
                  {isRTL ? 'المصاريف' : 'Expenses'}
                </h4>
                <div className="space-y-3">
                  {reportData.expenses.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-slate-600">{item.name}</span>
                      <span className="font-medium text-slate-800">{currencySettings.baseCurrency} {item.balance.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 font-bold text-slate-800">
                    <span>{isRTL ? 'إجمالي المصاريف' : 'Total Expenses'}</span>
                    <span>({currencySettings.baseCurrency} {reportData.totalExpenses.toFixed(2)})</span>
                  </div>
                </div>
              </section>

              {/* Net Income Section */}
              <section className="pt-6 border-t-2 border-slate-200">
                <div className={cn(
                  "flex justify-between items-center p-4 rounded-2xl font-bold text-xl",
                  reportData.netIncome >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                )}>
                  <span>{isRTL ? 'صافي الدخل' : 'Net Income'}</span>
                  <span>{currencySettings.baseCurrency} {reportData.netIncome.toFixed(2)}</span>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {view === 'reports' && activeReport === 'balance' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setActiveReport(null)}
              className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors"
            >
              <ChevronDown size={20} className="rotate-90 rtl:-rotate-90" />
              <span>{isRTL ? 'العودة للتقارير' : 'Back to Reports'}</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
              <Download size={18} />
              <span>{isRTL ? 'تصدير PDF' : 'Export PDF'}</span>
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold text-slate-800">{isRTL ? 'الميزانية العمومية' : 'Balance Sheet'}</h3>
              <p className="text-slate-500">{isRTL ? 'كما في تاريخ' : 'As of'} {new Date().toLocaleDateString()}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Assets Column */}
              <div className="space-y-8">
                <section>
                  <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-indigo-50 pb-2">
                    {isRTL ? 'الأصول' : 'Assets'}
                  </h4>
                  <div className="space-y-3">
                    {reportData.assets.map((item) => (
                      <div key={item.name} className="flex justify-between items-center">
                        <span className="text-slate-600">{item.name}</span>
                        <span className="font-medium text-slate-800">{currencySettings.baseCurrency} {item.balance.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 font-bold text-slate-800 text-lg">
                      <span>{isRTL ? 'إجمالي الأصول' : 'Total Assets'}</span>
                      <span>{currencySettings.baseCurrency} {reportData.totalAssets.toFixed(2)}</span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Liabilities & Equity Column */}
              <div className="space-y-8">
                <section>
                  <h4 className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-4 border-b border-rose-50 pb-2">
                    {isRTL ? 'الخصوم' : 'Liabilities'}
                  </h4>
                  <div className="space-y-3">
                    {reportData.liabilities.map((item) => (
                      <div key={item.name} className="flex justify-between items-center">
                        <span className="text-slate-600">{item.name}</span>
                        <span className="font-medium text-slate-800">{currencySettings.baseCurrency} {item.balance.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 font-bold text-slate-800">
                      <span>{isRTL ? 'إجمالي الخصوم' : 'Total Liabilities'}</span>
                      <span>{currencySettings.baseCurrency} {reportData.totalLiabilities.toFixed(2)}</span>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4 border-b border-emerald-50 pb-2">
                    {isRTL ? 'حقوق الملكية' : 'Equity'}
                  </h4>
                  <div className="space-y-3">
                    {reportData.equity.map((item) => (
                      <div key={item.name} className="flex justify-between items-center">
                        <span className="text-slate-600">{item.name}</span>
                        <span className="font-medium text-slate-800">{currencySettings.baseCurrency} {item.balance.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center italic text-slate-500 text-sm">
                      <span>{isRTL ? 'صافي الدخل (الفترة الحالية)' : 'Net Income (Current Period)'}</span>
                      <span>{currencySettings.baseCurrency} {reportData.netIncomeForEquity.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 font-bold text-slate-800">
                      <span>{isRTL ? 'إجمالي حقوق الملكية' : 'Total Equity'}</span>
                      <span>{currencySettings.baseCurrency} {reportData.totalEquity.toFixed(2)}</span>
                    </div>
                  </div>
                </section>

                <section className="pt-4 border-t-2 border-slate-200">
                  <div className="flex justify-between items-center font-bold text-slate-800 text-lg">
                    <span>{isRTL ? 'إجمالي الخصوم وحقوق الملكية' : 'Total Liabilities & Equity'}</span>
                    <span>{currencySettings.baseCurrency} {(reportData.totalLiabilities + reportData.totalEquity).toFixed(2)}</span>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'reports' && activeReport === 'sales' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setActiveReport(null)}
              className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors"
            >
              <ChevronDown size={20} className="rotate-90 rtl:-rotate-90" />
              <span>{isRTL ? 'العودة للتقارير' : 'Back to Reports'}</span>
            </button>
            <div className="flex bg-white p-1 rounded-xl border border-slate-200">
              <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-sm">
                {isRTL ? 'أسبوعي' : 'Weekly'}
              </button>
              <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50">
                {isRTL ? 'شهري' : 'Monthly'}
              </button>
            </div>
          </div>

          {/* Sales Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <TrendingUp size={20} />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <ArrowUpRight size={12} />
                  +12.5%
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-1">{isRTL ? 'إجمالي المبيعات' : 'Total Sales'}</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {currencySettings.baseCurrency} {totalSales.toLocaleString()}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <BarChart3 size={20} />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <ArrowUpRight size={12} />
                  +5.2%
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-1">{isRTL ? 'متوسط قيمة البيع' : 'Average Sale Value'}</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {currencySettings.baseCurrency} {avgSale.toFixed(2)}
              </h3>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <ShoppingCart size={20} />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                  <ArrowDownRight size={12} />
                  -2.1%
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-1">{isRTL ? 'عدد المبيعات' : 'Number of Sales'}</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {totalCount} {isRTL ? 'عملية' : 'Transactions'}
              </h3>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h4 className="text-lg font-bold text-slate-800 mb-8">{isRTL ? 'اتجاه المبيعات' : 'Sales Trend'}</h4>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="period" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#4f46e5" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h4 className="text-lg font-bold text-slate-800 mb-8">{isRTL ? 'حجم العمليات' : 'Transaction Volume'}</h4>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="period" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#4f46e5" 
                      radius={[6, 6, 0, 0]} 
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'reports' && activeReport === 'trial' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button 
              onClick={() => setActiveReport(null)}
              className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors"
            >
              <ChevronDown size={20} className="rotate-90 rtl:-rotate-90" />
              <span>{isRTL ? 'العودة للتقارير' : 'Back to Reports'}</span>
            </button>
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="text-sm font-bold text-slate-700 outline-none bg-transparent"
                />
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="text-sm font-bold text-slate-700 outline-none bg-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-slate-800 mb-2">{isRTL ? 'ميزان المراجعة' : 'Trial Balance'}</h2>
              <p className="text-slate-500 font-medium">
                {isRTL ? 'للفترة من' : 'For the period from'} <span className="text-indigo-600 font-bold">{dateRange.start}</span> {isRTL ? 'إلى' : 'to'} <span className="text-indigo-600 font-bold">{dateRange.end}</span>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-100">
                    <th className="text-left rtl:text-right py-4 font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'الحساب' : 'Account'}</th>
                    <th className="text-right py-4 font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'مدين' : 'Debit'}</th>
                    <th className="text-right py-4 font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'دائن' : 'Credit'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {trialData.trialBalance.map((item) => (
                    <tr key={item.name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-bold text-slate-700">{item.name}</td>
                      <td className="py-4 text-right font-mono text-slate-600">
                        {item.debit > 0 ? `${currencySettings.baseCurrency} ${item.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="py-4 text-right font-mono text-slate-600">
                        {item.credit > 0 ? `${currencySettings.baseCurrency} ${item.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50/50">
                    <td className="py-6 font-black text-slate-800 text-lg uppercase">{isRTL ? 'الإجمالي' : 'Total'}</td>
                    <td className="py-6 text-right font-black text-indigo-600 text-lg">
                      {currencySettings.baseCurrency} {trialData.totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-6 text-right font-black text-indigo-600 text-lg">
                      {currencySettings.baseCurrency} {trialData.totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {Math.abs(trialData.totalDebits - trialData.totalCredits) > 0.01 && (
              <div className="mt-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
                <Shield size={20} />
                <p className="text-sm font-bold">
                  {isRTL 
                    ? 'تحذير: ميزان المراجعة غير متزن. يوجد فرق قدره ' 
                    : 'Warning: Trial balance is not balanced. Difference: '}
                  {currencySettings.baseCurrency} {Math.abs(trialData.totalDebits - trialData.totalCredits).toFixed(2)}
                </p>
              </div>
            )}
            
            {Math.abs(trialData.totalDebits - trialData.totalCredits) <= 0.01 && trialData.trialBalance.length > 0 && (
              <div className="mt-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600">
                <UserCheck size={20} />
                <p className="text-sm font-bold">
                  {isRTL ? 'ميزان المراجعة متزن تماماً.' : 'Trial balance is perfectly balanced.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'reports' && activeReport && !['sales', 'income', 'balance', 'trial'].includes(activeReport) && (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
          <button 
            onClick={() => setActiveReport(null)}
            className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors mb-8 mx-auto"
          >
            <ChevronDown size={20} className="rotate-90 rtl:-rotate-90" />
            <span>{isRTL ? 'العودة للتقارير' : 'Back to Reports'}</span>
          </button>
          <FileText size={64} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {isRTL ? 'هذا التقرير قيد التطوير' : 'Report Under Development'}
          </h3>
          <p className="text-slate-500">
            {isRTL ? 'سيتم تفعيل هذا التقرير في التحديث القادم' : 'This report will be available in the next update'}
          </p>
        </div>
      )}

      {view === 'audit' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder={isRTL ? 'البحث في السجل...' : 'Search logs...'}
                  className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
                <Filter size={20} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'الوقت' : 'Timestamp'}</th>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'المستخدم' : 'User'}</th>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'الإجراء' : 'Action'}</th>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'النوع' : 'Entity'}</th>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'المعرف' : 'ID'}</th>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'التفاصيل' : 'Details'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono">{log.timestamp}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                            {(log.userName || 'U').charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-700">{log.userName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                          log.action === 'create' ? "bg-emerald-100 text-emerald-700" : 
                          log.action === 'update' ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"
                        )}>
                          {isRTL ? (
                            log.action === 'create' ? 'إنشاء' : 
                            log.action === 'update' ? 'تعديل' : 'حذف'
                          ) : log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">{log.entityType}</td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">{log.entityId}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{log.details || log.changes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'settings' && (
        <div className="max-w-4xl space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Coins size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{isRTL ? 'إعدادات العملات' : 'Currency Settings'}</h3>
                  <p className="text-xs text-indigo-100">{isRTL ? 'إدارة العملات وأسعار الصرف العالمية' : 'Manage currencies and global exchange rates'}</p>
                </div>
              </div>
              <button 
                onClick={() => alert(isRTL ? 'جاري تحديث الأسعار بمحاكاة API...' : 'Updating rates via API mock...')}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/10"
              >
                <RefreshCcw size={16} />
                <span>{isRTL ? 'تحديث تلقائي' : 'Auto Update'}</span>
              </button>
            </div>
            
            <div className="p-8 space-y-10">
              {/* Base Currency Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Globe size={18} className="text-indigo-600" />
                    {isRTL ? 'العملة الأساسية للنظام' : 'System Base Currency'}
                  </label>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {isRTL 
                      ? 'سيتم عرض جميع التقارير والمبيعات بهذه العملة. تغيير العملة الأساسية سيعيد حساب كافة أسعار الصرف الأخرى تلقائياً.' 
                      : 'All reports and sales will be displayed in this currency. Changing the base currency will automatically recalculate all other exchange rates.'}
                  </p>
                  <div className="relative group">
                    <select 
                      value={currencySettings.baseCurrency}
                      onChange={(e) => {
                        const newBase = e.target.value;
                        const oldBase = currencySettings.baseCurrency;
                        const conversionRate = rates[newBase] || 1;
                        
                        // Re-calculate all rates relative to the new base
                        const newRates: Record<string, number> = {};
                        Object.entries(rates).forEach(([curr, rate]) => {
                          newRates[curr] = Number(( (rate as number) / conversionRate ).toFixed(4));
                        });
                        
                        // Ensure the new base is exactly 1
                        newRates[newBase] = 1;

                        setCurrencySettings({ 
                          ...currencySettings, 
                          baseCurrency: newBase,
                          rates: newRates
                        });
                        setRates(newRates);
                      }}
                      className="w-full p-4 pl-12 rtl:pr-12 rtl:pl-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold text-lg text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="USD">($) USD - United States Dollar</option>
                      <option value="EUR">(€) EUR - Euro</option>
                      <option value="SAR">(ر.س) SAR - Saudi Riyal</option>
                      <option value="EGP">(ج.م) EGP - Egyptian Pound</option>
                      <option value="IQD">(د.ع) IQD - Iraqi Dinar</option>
                      <option value="AED">(د.إ) AED - UAE Dirham</option>
                      <option value="KWD">(د.ك) KWD - Kuwaiti Dinar</option>
                      <option value="QAR">(ر.ق) QAR - Qatari Riyal</option>
                      <option value="BHD">(د.ب) BHD - Bahraini Dinar</option>
                      <option value="OMR">(ر.ع) OMR - Omani Rial</option>
                    </select>
                    <div className="absolute left-4 rtl:right-4 rtl:left-auto top-1/2 -translate-y-1/2 p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Coins size={18} />
                    </div>
                    <ChevronDown className="absolute right-4 rtl:left-4 rtl:right-auto top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">
                      {currencySettings.baseCurrency}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{isRTL ? 'العملة النشطة حالياً' : 'Current Active Base'}</h4>
                      <p className="text-xs text-slate-500">{isRTL ? 'يتم حفظ السجلات بـ' : 'Records stored in'} {currencySettings.baseCurrency}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm py-2 border-b border-indigo-100/50">
                      <span className="text-slate-500">{isRTL ? 'عدد العملات النشطة' : 'Active Currencies'}</span>
                      <span className="font-bold text-slate-800">{Object.keys(rates).length}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-indigo-100/50">
                      <span className="text-slate-500">{isRTL ? 'آخر تحديث' : 'Last Update'}</span>
                      <span className="font-bold text-slate-800">{new Date().toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-indigo-600 font-bold mt-2">
                      <Info size={14} />
                      <span>{isRTL ? 'تأكد من دقة الأسعار لتفادي فروقات التحويل' : 'Ensure accuracy to avoid FX differences'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exchange Rates Grid */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                    <ArrowRightLeft size={18} className="text-indigo-600" />
                    {isRTL ? 'جدول أسعار الصرف' : 'Exchange Rate Table'}
                  </label>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">{isRTL ? 'قيمة الوحدة' : 'Unit Value'}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                  {Object.entries(rates).map(([curr, rate]) => {
                    const isBase = curr === currencySettings.baseCurrency;
                    return (
                      <div 
                        key={curr} 
                        className={cn(
                          "p-4 rounded-2xl flex items-center justify-between transition-all group",
                          isBase 
                            ? "bg-indigo-600 text-white border-2 border-indigo-600 shadow-lg shadow-indigo-100" 
                            : "bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold",
                            isBase ? "bg-white/20" : "bg-slate-50 text-slate-600"
                          )}>
                            {currencySymbols[curr] || curr}
                          </div>
                          <div>
                            <span className={cn("font-bold block", isBase ? "text-white" : "text-slate-700")}>
                              {curr}
                              {isBase && <span className="ml-2 rtl:mr-2 text-[10px] bg-white text-indigo-600 px-1.5 py-0.5 rounded-md uppercase">{isRTL ? 'أساسية' : 'Base'}</span>}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {!isBase && (
                            <div className="text-right rtl:text-left">
                              <p className={cn("text-[10px] uppercase font-bold", isBase ? "text-indigo-100" : "text-slate-400")}>
                                1 {currencySettings.baseCurrency} ({currencySymbols[currencySettings.baseCurrency]}) =
                              </p>
                              <div className="relative">
                                <input 
                                  type="number"
                                  step="0.0001"
                                  value={rate as number}
                                  onChange={(e) => handleUpdateRate(curr, parseFloat(e.target.value))}
                                  className={cn(
                                    "w-32 px-3 py-2 rounded-xl text-lg font-bold outline-none transition-all",
                                    isBase 
                                      ? "bg-white/10 border-white/20 text-white cursor-not-allowed" 
                                      : "bg-slate-50 border border-slate-200 text-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                  )}
                                  disabled={isBase}
                                />
                              </div>
                            </div>
                          )}
                          {isBase && (
                            <span className="text-2xl font-black opacity-20">1.00</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      <AnimatePresence>
        {showExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-600 text-white">
                <div className="flex items-center gap-3">
                  <ArrowDownRight size={24} />
                  <h3 className="text-xl font-bold">{isRTL ? 'تسجيل مصروف' : 'Record Expense'}</h3>
                </div>
                <button onClick={() => setShowExpenseModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'البيان' : 'Description'}</label>
                    <input 
                      required
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'المبلغ' : 'Amount'}</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'التاريخ' : 'Date'}</label>
                    <input 
                      required
                      type="date"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'فئة المصروف' : 'Category (Account)'}</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                    >
                      {Object.keys(accountTypes).filter(acc => accountTypes[acc] === 'Expense').map(acc => (
                        <option key={acc} value={acc}>{acc}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'طريقة الدفع' : 'Payment Account'}</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={expenseForm.paymentMethod}
                      onChange={(e) => setExpenseForm({...expenseForm, paymentMethod: e.target.value})}
                    >
                      {Object.keys(accountTypes).filter(acc => accountTypes[acc] === 'Asset').map(acc => (
                        <option key={acc} value={acc}>{acc}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'المرجع' : 'Reference'}</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={expenseForm.reference}
                      onChange={(e) => setExpenseForm({...expenseForm, reference: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3.5 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all"
                  >
                    {isRTL ? 'تسجيل المصروف' : 'Record Expense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Journal Entry Modal */}
      <AnimatePresence>
        {showEntryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ArrowRightLeft size={24} />
                  <h3 className="text-xl font-bold">{isRTL ? 'قيد يومية جديد' : 'New Journal Entry'}</h3>
                </div>
                <button onClick={() => setShowEntryModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleEntrySubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{isRTL ? 'التاريخ' : 'Date'}</label>
                    <input 
                      required
                      type="date"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={entryForm.date}
                      onChange={(e) => setEntryForm({...entryForm, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">{isRTL ? 'البيان' : 'Description'}</label>
                    <input 
                      required
                      type="text"
                      placeholder={isRTL ? 'أدخل وصفاً للعملية...' : 'Enter entry description...'}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={entryForm.description}
                      onChange={(e) => setEntryForm({...entryForm, description: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'البنود' : 'Lines'}</h4>
                    <button 
                      type="button"
                      onClick={addEntryLine}
                      className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:text-indigo-700 transition-colors"
                    >
                      <Plus size={16} />
                      <span>{isRTL ? 'إضافة بند' : 'Add Line'}</span>
                    </button>
                  </div>

                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left rtl:text-right">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 font-semibold">{isRTL ? 'الحساب' : 'Account'}</th>
                          <th className="px-4 py-3 font-semibold w-32">{isRTL ? 'مدين' : 'Debit'}</th>
                          <th className="px-4 py-3 font-semibold w-32">{isRTL ? 'دائن' : 'Credit'}</th>
                          <th className="px-4 py-3 font-semibold w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {entryForm.lines.map((line, index) => (
                          <tr key={index} className="bg-white">
                            <td className="p-2">
                              <select 
                                required
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                value={line.account}
                                onChange={(e) => updateEntryLine(index, 'account', e.target.value)}
                              >
                                <option value="">{isRTL ? 'اختر الحساب' : 'Select Account'}</option>
                                {Object.keys(accountTypes).map(acc => (
                                  <option key={acc} value={acc}>{acc}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input 
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700"
                                value={line.debit || ''}
                                onChange={(e) => {
                                  updateEntryLine(index, 'debit', parseFloat(e.target.value) || 0);
                                  if (parseFloat(e.target.value) > 0) updateEntryLine(index, 'credit', 0);
                                }}
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700"
                                value={line.credit || ''}
                                onChange={(e) => {
                                  updateEntryLine(index, 'credit', parseFloat(e.target.value) || 0);
                                  if (parseFloat(e.target.value) > 0) updateEntryLine(index, 'debit', 0);
                                }}
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button 
                                type="button"
                                onClick={() => removeEntryLine(index)}
                                className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-30"
                                disabled={entryForm.lines.length <= 2}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50/50 font-bold border-t border-slate-100">
                        <tr>
                          <td className="px-4 py-3 text-right rtl:text-left text-slate-500 text-xs uppercase">{isRTL ? 'المجموع' : 'Totals'}</td>
                          <td className={cn(
                            "px-4 py-3 text-sm",
                            isBalanced ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {currencySettings.baseCurrency} {totalDebit.toFixed(2)}
                          </td>
                          <td className={cn(
                            "px-4 py-3 text-sm",
                            isBalanced ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {currencySettings.baseCurrency} {totalCredit.toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {!isBalanced && (
                    <p className="text-xs text-rose-600 font-bold flex items-center gap-1">
                      <ArrowRightLeft size={12} />
                      {isRTL ? 'القيد غير متزن. الفرق:' : 'Entry is not balanced. Difference:'} {currencySettings.baseCurrency} {Math.abs(totalDebit - totalCredit).toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowEntryModal(false)}
                    className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button 
                    type="submit"
                    disabled={!isBalanced || totalDebit === 0}
                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:shadow-none"
                  >
                    {isRTL ? 'حفظ القيد' : 'Save Entry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
