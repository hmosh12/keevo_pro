import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  Wallet,
  ArrowUpRight,
  Trash2,
  Edit,
  MoreVertical,
  Tag,
  FileText,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api';
import { cn } from '../lib/utils';

interface Expense {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
}

export default function Expenses({ isRTL, user, expenses, refreshData }: { isRTL: boolean, user: any, expenses: any[], refreshData: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: 'General',
    amount: '',
    paymentMethod: 'Cash',
    date: new Date().toISOString().split('T')[0],
    reference: ''
  });

  const categories = [
    { id: 'General', label: isRTL ? 'عام' : 'General' },
    { id: 'Rent', label: isRTL ? 'إيجار' : 'Rent' },
    { id: 'Utilities', label: isRTL ? 'مرافق' : 'Utilities' },
    { id: 'Salaries', label: isRTL ? 'رواتب' : 'Salaries' },
    { id: 'Marketing', label: isRTL ? 'تسويق' : 'Marketing' },
    { id: 'Office Supplies', label: isRTL ? 'أدوات مكتبية' : 'Office Supplies' },
    { id: 'Maintenance', label: isRTL ? 'صيانة' : 'Maintenance' },
  ];

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;

    const newExpense = {
      date: expenseForm.date,
      description: expenseForm.description,
      category: expenseForm.category,
      amount: parseFloat(expenseForm.amount) || 0,
      paymentMethod: expenseForm.paymentMethod,
      reference: expenseForm.reference,
      createdAt: new Date().toISOString()
    };

    try {
      await api.generic.create(user.companyId, 'expenses', newExpense);
      setShowModal(false);
      setExpenseForm({
        description: '',
        category: 'General',
        amount: '',
        paymentMethod: 'Cash',
        date: new Date().toISOString().split('T')[0],
        reference: ''
      });
      refreshData();
    } catch (err) {
      console.error('Error adding expense:', err);
    }
  };

  const handleDeleteExpense = async (id: any) => {
    if (!user?.companyId || !window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا المصروف؟' : 'Are you sure you want to delete this expense?')) return;
    
    try {
      await api.generic.delete(user.companyId, 'expenses', String(id));
      refreshData();
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder={isRTL ? 'البحث في المصروفات...' : 'Search expenses...'}
              className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={20} />
          </button>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          <Plus size={18} />
          <span>{isRTL ? 'إضافة مصروف' : 'Add Expense'}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Wallet size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">{isRTL ? 'إجمالي المصروفات' : 'Total Expenses'}</p>
          <h3 className="text-2xl font-bold text-slate-800">${totalExpenses.toFixed(2)}</h3>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Calendar size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">{isRTL ? 'مصروفات الشهر الحالي' : 'Current Month Expenses'}</p>
          <h3 className="text-2xl font-bold text-slate-800">${totalExpenses.toFixed(2)}</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Tag size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">{isRTL ? 'أكبر فئة مصروفات' : 'Top Expense Category'}</p>
          <h3 className="text-2xl font-bold text-slate-800">{isRTL ? 'إيجار' : 'Rent'}</h3>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'التاريخ' : 'Date'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'البيان' : 'Description'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'الفئة' : 'Category'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'المبلغ' : 'Amount'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'طريقة الدفع' : 'Payment'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'المرجع' : 'Reference'}</th>
                <th className="px-6 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-500">{expense.date}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{expense.description}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-rose-600">${expense.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{expense.paymentMethod}</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">{expense.reference || '-'}</td>
                  <td className="px-6 py-4 text-right rtl:text-left">
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
                <h3 className="text-xl font-bold">{isRTL ? 'إضافة مصروف جديد' : 'Add New Expense'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="p-6 space-y-4">
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
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'الفئة' : 'Category'}</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'طريقة الدفع' : 'Payment Method'}</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={expenseForm.paymentMethod}
                      onChange={(e) => setExpenseForm({...expenseForm, paymentMethod: e.target.value})}
                    >
                      <option value="Cash">{isRTL ? 'نقدي' : 'Cash'}</option>
                      <option value="Bank Transfer">{isRTL ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                      <option value="Card">{isRTL ? 'بطاقة' : 'Card'}</option>
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

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    {isRTL ? 'حفظ' : 'Save'}
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
