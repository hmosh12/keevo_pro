import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Filter, 
  Download, 
  AlertTriangle,
  X,
  Package,
  History,
  ArrowRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api';
import { cn } from '../lib/utils';

interface DamagedEntry {
  id: number;
  date: string;
  productName: string;
  sku: string;
  quantity: number;
  cost: number;
  reason: string;
  location: string;
}

export default function Damaged({ isRTL, products, user, damagedItems, refreshData }: { isRTL: boolean, products: any[], user: any, damagedItems: any[], refreshData: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  const [damagedForm, setDamagedForm] = useState({
    productName: '',
    sku: '',
    quantity: '',
    cost: '',
    reason: '',
    location: 'Main Warehouse',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredDamaged = damagedItems.filter(d => 
    d.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRecordDamaged = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;

    const selectedProduct = products.find(p => p.name === damagedForm.productName);
    const qty = parseInt(damagedForm.quantity) || 0;

    const newDamaged = {
      date: damagedForm.date,
      productName: damagedForm.productName,
      sku: damagedForm.sku,
      quantity: qty,
      cost: parseFloat(damagedForm.cost) || 0,
      reason: damagedForm.reason,
      location: damagedForm.location,
      createdAt: new Date().toISOString()
    };

    try {
      await api.generic.create(user.companyId, 'damaged_items', newDamaged);
      
      // Update stock if product found
      if (selectedProduct) {
        await api.products.update(user.companyId, selectedProduct.id, {
          stock: (selectedProduct.stock || 0) - qty
        });
      }

      setShowModal(false);
      setDamagedForm({
        productName: '',
        sku: '',
        quantity: '',
        cost: '',
        reason: '',
        location: 'Main Warehouse',
        date: new Date().toISOString().split('T')[0]
      });
      refreshData();
    } catch (err) {
      console.error('Error recording damaged item:', err);
    }
  };

  const handleDeleteDamaged = async (id: any) => {
    if (!user?.companyId || !window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this record?')) return;
    
    try {
      await api.generic.delete(user.companyId, 'damaged_items', String(id));
      refreshData();
    } catch (err) {
      console.error('Error deleting damaged item:', err);
    }
  };

  const totalLoss = filteredDamaged.reduce((sum, d) => sum + (d.cost * d.quantity), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder={isRTL ? 'البحث في التوالف...' : 'Search damaged items...'}
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
          className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all"
        >
          <Plus size={18} />
          <span>{isRTL ? 'تسجيل تالف' : 'Record Damaged'}</span>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Trash2 size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">{isRTL ? 'إجمالي الخسائر' : 'Total Loss Value'}</p>
          <h3 className="text-2xl font-bold text-slate-800">${totalLoss.toFixed(2)}</h3>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">{isRTL ? 'عدد القطع التالفة' : 'Total Damaged Units'}</p>
          <h3 className="text-2xl font-bold text-slate-800">{filteredDamaged.reduce((sum, d) => sum + d.quantity, 0)}</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Package size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">{isRTL ? 'أكثر موقع تضرر' : 'Most Affected Location'}</p>
          <h3 className="text-2xl font-bold text-slate-800">{isRTL ? 'المعرض' : 'Showroom'}</h3>
        </div>
      </div>

      {/* Damaged Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'التاريخ' : 'Date'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'المنتج' : 'Product'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'الكمية' : 'Qty'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'التكلفة' : 'Cost'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'الموقع' : 'Location'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'السبب' : 'Reason'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDamaged.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-500">{item.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700">{item.productName}</span>
                      <span className="text-[10px] font-mono text-slate-400">{item.sku}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">{item.quantity}</td>
                  <td className="px-6 py-4 font-bold text-rose-600">${(item.cost * item.quantity).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.location}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Damaged Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-600 text-white">
                <h3 className="text-xl font-bold">{isRTL ? 'تسجيل تالف جديد' : 'Record New Damaged Item'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRecordDamaged} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'المنتج' : 'Product'}</label>
                    <input 
                      required
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      value={damagedForm.productName}
                      onChange={(e) => setDamagedForm({...damagedForm, productName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'وحدة حفظ المخزون (SKU)' : 'SKU'}</label>
                    <input 
                      required
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      value={damagedForm.sku}
                      onChange={(e) => setDamagedForm({...damagedForm, sku: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'التاريخ' : 'Date'}</label>
                    <input 
                      required
                      type="date"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      value={damagedForm.date}
                      onChange={(e) => setDamagedForm({...damagedForm, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'الكمية' : 'Quantity'}</label>
                    <input 
                      required
                      type="number"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      value={damagedForm.quantity}
                      onChange={(e) => setDamagedForm({...damagedForm, quantity: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'التكلفة للقطعة' : 'Cost per Unit'}</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      value={damagedForm.cost}
                      onChange={(e) => setDamagedForm({...damagedForm, cost: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'الموقع' : 'Location'}</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      value={damagedForm.location}
                      onChange={(e) => setDamagedForm({...damagedForm, location: e.target.value})}
                    >
                      <option value="Main Warehouse">{isRTL ? 'المستودع الرئيسي' : 'Main Warehouse'}</option>
                      <option value="Showroom">{isRTL ? 'المعرض' : 'Showroom'}</option>
                      <option value="Branch A">{isRTL ? 'فرع أ' : 'Branch A'}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">{isRTL ? 'السبب' : 'Reason'}</label>
                    <textarea 
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all min-h-[100px]"
                      value={damagedForm.reason}
                      onChange={(e) => setDamagedForm({...damagedForm, reason: e.target.value})}
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
                    className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all"
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
