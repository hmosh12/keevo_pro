import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  RotateCcw, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft,
  X,
  FileText,
  User,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api';
import { cn } from '../lib/utils';

interface ReturnEntry {
  id: string;
  date: string;
  type: 'Sale' | 'Purchase';
  customerSupplier: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
  items: any[];
}

export default function Returns({ isRTL, user, returns, refreshData }: { isRTL: boolean, user: any, returns: any[], refreshData: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  const [returnForm, setReturnForm] = useState({
    type: 'Sale' as 'Sale' | 'Purchase',
    customerSupplier: '',
    reason: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredReturns = returns.filter(r => 
    r.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customerSupplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;

    const newReturn = {
      date: returnForm.date,
      type: returnForm.type,
      customerSupplier: returnForm.customerSupplier,
      amount: parseFloat(returnForm.amount) || 0,
      status: 'Pending',
      reason: returnForm.reason,
      items: [],
      createdAt: new Date().toISOString()
    };

    try {
      await api.generic.create(user.companyId, 'returns', newReturn);
      setShowModal(false);
      setReturnForm({
        type: 'Sale',
        customerSupplier: '',
        reason: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });
      refreshData();
    } catch (err) {
      console.error('Error adding return:', err);
    }
  };

  const handleDeleteReturn = async (id: any) => {
    if (!user?.companyId || !window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا المرتجع؟' : 'Are you sure you want to delete this return?')) return;
    
    try {
      await api.generic.delete(user.companyId, 'returns', String(id));
      refreshData();
    } catch (err) {
      console.error('Error deleting return:', err);
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
              placeholder={isRTL ? 'البحث في المردودات...' : 'Search returns...'}
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
          <span>{isRTL ? 'إضافة مردود' : 'Add Return'}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <RotateCcw size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">{isRTL ? 'إجمالي المردودات' : 'Total Returns'}</p>
          <h3 className="text-2xl font-bold text-slate-800">{returns.length}</h3>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">{isRTL ? 'قيد الانتظار' : 'Pending Approval'}</p>
          <h3 className="text-2xl font-bold text-slate-800">{returns.filter(r => r.status === 'Pending').length}</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">{isRTL ? 'تمت الموافقة' : 'Approved'}</p>
          <h3 className="text-2xl font-bold text-slate-800">{returns.filter(r => r.status === 'Approved').length}</h3>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'المعرف' : 'ID'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'التاريخ' : 'Date'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'النوع' : 'Type'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'العميل/المورد' : 'Customer/Supplier'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'المبلغ' : 'Amount'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'الحالة' : 'Status'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'السبب' : 'Reason'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReturns.map((ret) => (
                <tr key={ret.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-indigo-600">{ret.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{ret.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {ret.type === 'Sale' ? (
                        <ArrowDownLeft size={14} className="text-rose-500" />
                      ) : (
                        <ArrowUpRight size={14} className="text-emerald-500" />
                      )}
                      <span className="text-sm font-medium text-slate-700">
                        {isRTL ? (ret.type === 'Sale' ? 'مردود مبيعات' : 'مردود مشتريات') : `${ret.type} Return`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium">{ret.customerSupplier}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">${ret.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                      ret.status === 'Approved' ? "bg-emerald-100 text-emerald-700" : 
                      ret.status === 'Pending' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {isRTL ? (
                        ret.status === 'Approved' ? 'مقبول' : 
                        ret.status === 'Pending' ? 'معلق' : 'مرفوض'
                      ) : ret.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{ret.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Return Modal */}
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
                <h3 className="text-xl font-bold">{isRTL ? 'إضافة مردود جديد' : 'Add New Return'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddReturn} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'النوع' : 'Type'}</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={returnForm.type}
                      onChange={(e) => setReturnForm({...returnForm, type: e.target.value as any})}
                    >
                      <option value="Sale">{isRTL ? 'مردود مبيعات' : 'Sale Return'}</option>
                      <option value="Purchase">{isRTL ? 'مردود مشتريات' : 'Purchase Return'}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'التاريخ' : 'Date'}</label>
                    <input 
                      required
                      type="date"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={returnForm.date}
                      onChange={(e) => setReturnForm({...returnForm, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'العميل / المورد' : 'Customer / Supplier'}</label>
                    <input 
                      required
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={returnForm.customerSupplier}
                      onChange={(e) => setReturnForm({...returnForm, customerSupplier: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'المبلغ' : 'Amount'}</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={returnForm.amount}
                      onChange={(e) => setReturnForm({...returnForm, amount: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'السبب' : 'Reason'}</label>
                    <textarea 
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[100px]"
                      value={returnForm.reason}
                      onChange={(e) => setReturnForm({...returnForm, reason: e.target.value})}
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
