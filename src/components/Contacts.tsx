import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  User, 
  Phone, 
  Mail, 
  MapPin, 
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  FileText,
  ShoppingCart,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api';
import { cn } from '../lib/utils';

interface PurchaseOrderItem {
  id: string;
  name: string;
  quantity: number;
  cost: number;
}

interface SalesOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  date: string;
  items: PurchaseOrderItem[];
  total: number;
  status: 'Draft' | 'Sent' | 'Received' | 'Cancelled';
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  date: string;
  items: SalesOrderItem[];
  total: number;
  status: 'Draft' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
}

export default function Contacts({ 
  isRTL, 
  products = [], 
  currencySettings, 
  contacts = [], 
  user,
  refreshData
}: { 
  isRTL: boolean, 
  products?: any[], 
  currencySettings?: any,
  contacts?: any[],
  user: any,
  refreshData: () => void
}) {
  const [filter, setFilter] = useState<'all' | 'Customer' | 'Supplier'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Paid'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    type: 'Customer' as 'Customer' | 'Supplier',
    phone: '',
    email: '',
    address: '',
    taxId: '',
    paymentMethod: '',
    creditPeriod: '',
    creditLimit: '',
    salesRep: '',
    category: ''
  });
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [detailTab, setDetailTab] = useState<'history' | 'orders' | 'supplier_info' | 'notes'>('history');
  const [localNotes, setLocalNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'Sale' | 'Purchase'>('all');
  const [txStatusFilter, setTxStatusFilter] = useState<'all' | 'Paid' | 'Pending'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Reset filters when contact changes
  useEffect(() => {
    setTxTypeFilter('all');
    setTxStatusFilter('all');
    setDetailTab('history');
    setExpandedOrderId(null);
    setDateRange({ start: '', end: '' });
    setLocalNotes(selectedContact?.notes || '');
  }, [selectedContact?.id]);

  // Fetch Purchase Orders and Sales Orders via API
  useEffect(() => {
    if (!user?.companyId) return;

    const fetchOrders = async () => {
      try {
        const [pos, sos] = await Promise.all([
          api.generic.list(user.companyId, 'purchase_orders'),
          api.generic.list(user.companyId, 'sales_orders')
        ]);
        setPurchaseOrders(pos);
        setSalesOrders(sos);
      } catch (err) {
        console.error('Error fetching orders:', err);
      }
    };
    fetchOrders();
  }, [user?.companyId]);

  const filteredContacts = contacts.filter(c => {
    const matchesType = filter === 'all' || c.type === filter;
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'Pending' && Math.abs(c.balance || 0) > 0.01) ||
      (statusFilter === 'Paid' && Math.abs(c.balance || 0) <= 0.01);

    return matchesType && matchesSearch && matchesStatus;
  });

  const handleAddContact = async () => {
    if (!newContact.name || !user?.companyId) return;
    
    try {
      await api.generic.create(user.companyId, 'contacts', {
        ...newContact,
        balance: 0,
        createdAt: new Date().toISOString()
      });
      setShowAddContactModal(false);
      setNewContact({
        name: '', type: 'Customer', phone: '', email: '', address: '', taxId: '',
        paymentMethod: '', creditPeriod: '', creditLimit: '', salesRep: '', category: ''
      });
      refreshData();
    } catch (err) {
      console.error('Error adding contact:', err);
    }
  };

  const handleCreateOrder = async () => {
    if (!user?.companyId || !selectedContact) return;

    try {
      if (selectedContact.type === 'Supplier') {
        const orderNumber = `PO-${Math.floor(1000 + Math.random() * 9000)}`;
        const total = orderItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
        
        await api.generic.create(user.companyId, 'purchase_orders', {
          orderNumber,
          supplierId: selectedContact.id,
          date: new Date().toISOString().split('T')[0],
          items: orderItems.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            cost: item.cost
          })),
          total,
          status: 'Draft'
        });
      } else {
        const orderNumber = `SO-${Math.floor(1000 + Math.random() * 9000)}`;
        const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        await api.generic.create(user.companyId, 'sales_orders', {
          orderNumber,
          customerId: selectedContact.id,
          date: new Date().toISOString().split('T')[0],
          items: orderItems.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          total,
          status: 'Draft'
        });
      }
      setShowOrderModal(false);
      setOrderItems([]);
      refreshData();
      // Re-fetch orders locally
      const [pos, sos] = await Promise.all([
        api.generic.list(user.companyId, 'purchase_orders'),
        api.generic.list(user.companyId, 'sales_orders')
      ]);
      setPurchaseOrders(pos);
      setSalesOrders(sos);
    } catch (err) {
      console.error('Error creating order:', err);
    }
  };

  const addToOrder = (product: any) => {
    const existing = orderItems.find(item => item.id === product.id);
    if (existing) {
      setOrderItems(orderItems.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setOrderItems([...orderItems, { 
        id: product.id, 
        name: product.name, 
        quantity: 1, 
        cost: product.cost || 0,
        price: product.price || 0
      }]);
    }
  };

  const updateOrderQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setOrderItems(orderItems.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const updateOrderCost = (id: string, cost: number) => {
    if (cost < 0) return;
    setOrderItems(orderItems.map(item => 
      item.id === id ? { ...item, cost } : item
    ));
  };

  const updateOrderStatus = async (orderId: string, newStatus: any) => {
    if (!user?.companyId) return;
    
    try {
      const collectionName = orderId.startsWith('PO-') ? 'purchase_orders' : 'sales_orders';
      const order = orderId.startsWith('PO-') 
        ? purchaseOrders.find(po => po.id === orderId)
        : salesOrders.find(so => so.id === orderId);
      
      if (order) {
        await api.generic.create(user.companyId, collectionName, {
          ...order,
          status: newStatus
        });
        refreshData();
      }
    } catch (err) {
      console.error('Error updating order status:', err);
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
              placeholder={isRTL ? 'البحث عن عميل أو مورد...' : 'Search contacts...'}
              className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-2.5 border rounded-xl transition-all",
              showFilters ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Filter size={20} />
          </button>
          <div className="flex bg-white p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setFilter('all')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                filter === 'all' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500"
              )}
            >
              {isRTL ? 'الكل' : 'All'}
            </button>
            <button 
              onClick={() => setFilter('Customer')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                filter === 'Customer' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500"
              )}
            >
              {isRTL ? 'عملاء' : 'Customers'}
            </button>
            <button 
              onClick={() => setFilter('Supplier')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                filter === 'Supplier' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500"
              )}
            >
              {isRTL ? 'موردون' : 'Suppliers'}
            </button>
          </div>
        </div>
        <button 
          onClick={() => setShowAddContactModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
        >
          <Plus size={18} />
          <span>{isRTL ? 'إضافة جهة اتصال' : 'Add Contact'}</span>
        </button>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-sm">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'نوع جهة الاتصال' : 'Contact Type'}</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                >
                  <option value="all">{isRTL ? 'الكل' : 'All'}</option>
                  <option value="Customer">{isRTL ? 'عملاء' : 'Customers'}</option>
                  <option value="Supplier">{isRTL ? 'موردون' : 'Suppliers'}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'الحالة المالية' : 'Financial Status'}</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">{isRTL ? 'الكل' : 'All'}</option>
                  <option value="Pending">{isRTL ? 'مستحق (عليه رصيد)' : 'Pending (Has Balance)'}</option>
                  <option value="Paid">{isRTL ? 'مسدد (رصيد صفر)' : 'Paid (Zero Balance)'}</option>
                </select>
              </div>
              {(filter !== 'all' || statusFilter !== 'all' || searchTerm !== '') && (
                <div className="sm:col-span-2 flex justify-end">
                  <button 
                    onClick={() => {
                      setFilter('all');
                      setStatusFilter('all');
                      setSearchTerm('');
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    {isRTL ? 'مسح التصفية' : 'Clear Filters'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredContacts.map((contact) => (
          <div 
            key={contact.id} 
            onClick={() => setSelectedContact(contact)}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg",
                  contact.type === 'Customer' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                )}>
                  {contact.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{contact.name}</h4>
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full",
                    contact.type === 'Customer' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {isRTL ? (contact.type === 'Customer' ? 'عميل' : 'مورد') : contact.type}
                  </span>
                </div>
              </div>
              <button className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-slate-500 text-sm">
                <Phone size={16} />
                <span>{contact.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 text-sm">
                <Mail size={16} />
                <span className="truncate">{contact.email}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">{isRTL ? 'الرصيد الحالي' : 'Current Balance'}</span>
                <span className={cn(
                  "font-bold",
                  contact.balance < 0 ? "text-rose-600" : contact.balance > 0 ? "text-emerald-600" : "text-slate-400"
                )}>
                  ${Math.abs(contact.balance).toFixed(2)}
                  {contact.balance < 0 && (isRTL ? ' (له)' : ' (Cr)')}
                  {contact.balance > 0 && (isRTL ? ' (عليه)' : ' (Dr)')}
                </span>
              </div>
              <button className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className={cn(
                "p-8 text-white flex items-center justify-between",
                selectedContact.type === 'Customer' ? "bg-emerald-600" : "bg-amber-600"
              )}>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center font-bold text-3xl backdrop-blur-sm">
                    {selectedContact.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{selectedContact.name}</h2>
                    <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm uppercase tracking-wider">
                      {isRTL ? (selectedContact.type === 'Customer' ? 'عميل' : 'مورد') : selectedContact.type}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedContact(null)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

                {/* Tabs for Detail View */}
                <div className="px-8 border-b border-slate-100 flex gap-8">
                  <button 
                    onClick={() => setDetailTab('history')}
                    className={cn(
                      "py-4 text-sm font-bold border-b-2 transition-all",
                      detailTab === 'history' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {isRTL ? 'السجل المالي' : 'Financial History'}
                  </button>
                  <button 
                    onClick={() => setDetailTab('orders')}
                    className={cn(
                      "py-4 text-sm font-bold border-b-2 transition-all",
                      detailTab === 'orders' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {selectedContact.type === 'Customer' 
                      ? (isRTL ? 'طلبات البيع' : 'Sales Orders')
                      : (isRTL ? 'طلبات الشراء' : 'Purchase Orders')}
                  </button>
                  <button 
                    onClick={() => setDetailTab('notes')}
                    className={cn(
                      "py-4 text-sm font-bold border-b-2 transition-all",
                      detailTab === 'notes' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {isRTL ? 'ملاحظات' : 'Notes'}
                  </button>
                  {selectedContact.type === 'Supplier' && (
                    <button 
                      onClick={() => setDetailTab('supplier_info')}
                      className={cn(
                        "py-4 text-sm font-bold border-b-2 transition-all",
                        detailTab === 'supplier_info' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {isRTL ? 'معلومات المورد' : 'Supplier Info'}
                    </button>
                  )}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {detailTab === 'history' ? (
                    <>
                      {/* Contact Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                            {isRTL ? 'معلومات الاتصال' : 'Contact Information'}
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-slate-700">
                              <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                <Phone size={18} />
                              </div>
                              <span className="font-medium">{selectedContact.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700">
                              <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                <Mail size={18} />
                              </div>
                              <span className="font-medium">{selectedContact.email}</span>
                            </div>
                            <div className="flex items-start gap-3 text-slate-700">
                              <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                <MapPin size={18} />
                              </div>
                              <span className="font-medium leading-relaxed">{selectedContact.address}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                            {isRTL ? 'الملخص المالي' : 'Financial Summary'}
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                              <span className="text-xs text-slate-500 block mb-1">{isRTL ? 'الرصيد الإجمالي' : 'Total Balance'}</span>
                              <div className={cn(
                                "text-2xl font-bold",
                                selectedContact.balance < 0 ? "text-rose-600" : selectedContact.balance > 0 ? "text-emerald-600" : "text-slate-400"
                              )}>
                                ${Math.abs(selectedContact.balance).toFixed(2)}
                                <span className="text-xs ml-2 font-medium opacity-70">
                                  {selectedContact.balance < 0 && (isRTL ? ' (له)' : ' (Cr)')}
                                  {selectedContact.balance > 0 && (isRTL ? ' (عليه)' : ' (Dr)')}
                                </span>
                              </div>
                            </div>

                            {/* Period Summary */}
                            {(dateRange.start || dateRange.end) && (
                              <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                <span className="text-xs text-indigo-600 font-bold block mb-1 uppercase tracking-wider">
                                  {isRTL ? 'ملخص الفترة المختارة' : 'Selected Period Summary'}
                                </span>
                                {(() => {
                                  const periodTxs = (selectedContact.transactions || []).filter((tx: any) => 
                                    (!dateRange.start || tx.date >= dateRange.start) &&
                                    (!dateRange.end || tx.date <= dateRange.end)
                                  );
                                  const totalIn = periodTxs.reduce((sum: number, tx: any) => sum + (tx.type === 'Sale' ? tx.amount : 0), 0);
                                  const totalOut = periodTxs.reduce((sum: number, tx: any) => sum + (tx.type === 'Purchase' ? tx.amount : 0), 0);
                                  const net = totalIn - totalOut;
                                  
                                  return (
                                    <div className="flex items-center justify-between mt-2">
                                      <div className="space-y-1">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">{isRTL ? 'صافي الحركة' : 'Net Activity'}</p>
                                        <p className={cn(
                                          "text-xl font-bold",
                                          net > 0 ? "text-emerald-600" : net < 0 ? "text-rose-600" : "text-slate-600"
                                        )}>
                                          ${Math.abs(net).toFixed(2)}
                                          <span className="text-[10px] ml-1">
                                            {net > 0 ? (isRTL ? 'زيادة' : 'In') : net < 0 ? (isRTL ? 'نقص' : 'Out') : ''}
                                          </span>
                                        </p>
                                      </div>
                                      <div className="text-right space-y-0.5">
                                        <p className="text-[10px] text-emerald-600 font-bold">+{totalIn.toFixed(2)}</p>
                                        <p className="text-[10px] text-rose-600 font-bold">-{totalOut.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Transaction History */}
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <History size={18} />
                            {isRTL ? 'آخر العمليات' : 'Recent Transactions'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Quick Filters */}
                            <div className="flex items-center gap-1 mr-2">
                              {[
                                { label: isRTL ? 'اليوم' : 'Today', days: 0 },
                                { label: isRTL ? '7 أيام' : '7d', days: 7 },
                                { label: isRTL ? '30 يوماً' : '30d', days: 30 }
                              ].map((preset) => (
                                <button
                                  key={preset.label}
                                  onClick={() => {
                                    const end = new Date().toISOString().split('T')[0];
                                    const start = new Date(Date.now() - preset.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                    setDateRange({ start, end });
                                  }}
                                  className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{isRTL ? 'من' : 'From'}</span>
                              <input 
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                                className="text-xs font-bold bg-transparent outline-none"
                              />
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{isRTL ? 'إلى' : 'To'}</span>
                              <input 
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                                className="text-xs font-bold bg-transparent outline-none"
                              />
                            </div>
                            <select 
                              value={txTypeFilter}
                              onChange={(e) => setTxTypeFilter(e.target.value as any)}
                              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="all">{isRTL ? 'كل الأنواع' : 'All Types'}</option>
                              <option value="Sale">{isRTL ? 'بيع' : 'Sale'}</option>
                              <option value="Purchase">{isRTL ? 'شراء' : 'Purchase'}</option>
                            </select>
                            <select 
                              value={txStatusFilter}
                              onChange={(e) => setTxStatusFilter(e.target.value as any)}
                              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="all">{isRTL ? 'كل الحالات' : 'All Status'}</option>
                              <option value="Paid">{isRTL ? 'مدفوع' : 'Paid'}</option>
                              <option value="Pending">{isRTL ? 'معلق' : 'Pending'}</option>
                            </select>
                            {(dateRange.start || dateRange.end) && (
                              <button 
                                onClick={() => setDateRange({ start: '', end: '' })}
                                className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                title={isRTL ? 'مسح التواريخ' : 'Clear Dates'}
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                          {(selectedContact.transactions || []).filter((tx: any) => 
                            (txTypeFilter === 'all' || tx.type === txTypeFilter) &&
                            (txStatusFilter === 'all' || tx.status === txStatusFilter) &&
                            (!dateRange.start || tx.date >= dateRange.start) &&
                            (!dateRange.end || tx.date <= dateRange.end)
                          ).length > 0 ? (
                            <table className="w-full text-left rtl:text-right">
                              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                                <tr>
                                  <th className="px-6 py-3 font-semibold">{isRTL ? 'التاريخ' : 'Date'}</th>
                                  <th className="px-6 py-3 font-semibold">{isRTL ? 'النوع' : 'Type'}</th>
                                  <th className="px-6 py-3 font-semibold">{isRTL ? 'المبلغ' : 'Amount'}</th>
                                  <th className="px-6 py-3 font-semibold">{isRTL ? 'الحالة' : 'Status'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {(selectedContact.transactions || [])
                                  .filter((tx: any) => 
                                    (txTypeFilter === 'all' || tx.type === txTypeFilter) &&
                                    (txStatusFilter === 'all' || tx.status === txStatusFilter) &&
                                    (!dateRange.start || tx.date >= dateRange.start) &&
                                    (!dateRange.end || tx.date <= dateRange.end)
                                  )
                                  .map((tx: any) => (
                                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-500">{tx.date}</td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-2">
                                        {tx.type === 'Sale' ? (
                                          <ArrowUpRight size={14} className="text-emerald-500" />
                                        ) : (
                                          <ArrowDownLeft size={14} className="text-rose-500" />
                                        )}
                                        <span className="text-sm font-medium text-slate-700">
                                          {isRTL ? (tx.type === 'Sale' ? 'بيع' : 'شراء') : tx.type}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-800">${tx.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                      <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                        tx.status === 'Paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                      )}>
                                        {isRTL ? (tx.status === 'Paid' ? 'مدفوع' : 'معلق') : tx.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="p-12 text-center text-slate-400">
                              <History size={48} className="mx-auto mb-4 opacity-20" />
                              <p>{isRTL ? 'لا توجد عمليات تطابق الفلتر' : 'No transactions match the filter'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : detailTab === 'orders' ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <FileText size={18} />
                          {selectedContact.type === 'Customer' 
                            ? (isRTL ? 'طلبات البيع' : 'Sales Orders')
                            : (isRTL ? 'طلبات الشراء' : 'Purchase Orders')}
                        </h3>
                        <button 
                          onClick={() => setShowOrderModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
                        >
                          <Plus size={14} />
                          <span>{isRTL ? 'طلب جديد' : 'New Order'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {selectedContact.type === 'Supplier' ? (
                          purchaseOrders.filter(po => po.supplierId === selectedContact.id).length > 0 ? (
                            purchaseOrders.filter(po => po.supplierId === selectedContact.id).map(po => (
                              <div key={po.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-indigo-200 transition-all group">
                                <div 
                                  onClick={() => setExpandedOrderId(expandedOrderId === po.id ? null : po.id)}
                                  className="p-4 flex items-center justify-between cursor-pointer"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                      <FileText size={20} />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-slate-800">{po.orderNumber}</h4>
                                      <p className="text-xs text-slate-400">{po.date}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-6">
                                    <div className="text-right" onClick={(e) => e.stopPropagation()}>
                                      <p className="text-sm font-bold text-slate-800">${po.total.toFixed(2)}</p>
                                      <select 
                                        value={po.status || 'Draft'}
                                        onChange={(e) => updateOrderStatus(po.id, e.target.value)}
                                        className={cn(
                                          "text-[10px] font-bold px-2 py-0.5 rounded-full outline-none border-none cursor-pointer",
                                          po.status === 'Received' ? "bg-emerald-100 text-emerald-700" : 
                                          po.status === 'Sent' ? "bg-blue-100 text-blue-700" : 
                                          po.status === 'Cancelled' ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"
                                        )}
                                      >
                                        <option value="Draft">{isRTL ? 'مسودة' : 'Draft'}</option>
                                        <option value="Sent">{isRTL ? 'مرسل' : 'Sent'}</option>
                                        <option value="Received">{isRTL ? 'مستلم' : 'Received'}</option>
                                        <option value="Cancelled">{isRTL ? 'ملغي' : 'Cancelled'}</option>
                                      </select>
                                    </div>
                                    <motion.div
                                      animate={{ rotate: expandedOrderId === po.id ? 90 : 0 }}
                                      className="text-slate-300 group-hover:text-indigo-600"
                                    >
                                      <ChevronRight size={20} className="rtl:rotate-180" />
                                    </motion.div>
                                  </div>
                                </div>
                                
                                <AnimatePresence>
                                  {expandedOrderId === po.id && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="border-t border-slate-50 bg-slate-50/50"
                                    >
                                      <div className="p-4 space-y-4">
                                        <table className="w-full text-xs">
                                          <thead>
                                            <tr className="text-slate-400 uppercase tracking-wider font-bold">
                                              <th className="text-left rtl:text-right pb-2">{isRTL ? 'الصنف' : 'Item'}</th>
                                              <th className="text-center pb-2">{isRTL ? 'الكمية' : 'Qty'}</th>
                                              <th className="text-right rtl:text-left pb-2">{isRTL ? 'السعر' : 'Price'}</th>
                                              <th className="text-right rtl:text-left pb-2">{isRTL ? 'المجموع' : 'Subtotal'}</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                            {po.items.map((item: any) => (
                                              <tr key={item.id}>
                                                <td className="py-2 font-medium text-slate-700">{item.name}</td>
                                                <td className="py-2 text-center text-slate-600">{item.quantity}</td>
                                                <td className="py-2 text-right rtl:text-left text-slate-600">${item.cost.toFixed(2)}</td>
                                                <td className="py-2 text-right rtl:text-left font-bold text-slate-800">${(item.cost * item.quantity).toFixed(2)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                          <tfoot>
                                            <tr className="border-t border-slate-200">
                                              <td colSpan={3} className="pt-3 font-bold text-slate-500 text-right rtl:text-left">{isRTL ? 'الإجمالي:' : 'Total:'}</td>
                                              <td className="pt-3 font-bold text-indigo-600 text-right rtl:text-left text-sm">${po.total.toFixed(2)}</td>
                                            </tr>
                                          </tfoot>
                                        </table>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))
                          ) : (
                            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                              <FileText size={48} className="mx-auto mb-4 opacity-20" />
                              <p>{isRTL ? 'لا توجد طلبات شراء' : 'No purchase orders'}</p>
                            </div>
                          )
                        ) : (
                          salesOrders.filter(so => so.customerId === selectedContact.id).length > 0 ? (
                            salesOrders.filter(so => so.customerId === selectedContact.id).map(so => (
                              <div key={so.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-indigo-200 transition-all group">
                                <div 
                                  onClick={() => setExpandedOrderId(expandedOrderId === so.id ? null : so.id)}
                                  className="p-4 flex items-center justify-between cursor-pointer"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                      <FileText size={20} />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-slate-800">{so.orderNumber}</h4>
                                      <p className="text-xs text-slate-400">{so.date}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-6">
                                    <div className="text-right" onClick={(e) => e.stopPropagation()}>
                                      <p className="text-sm font-bold text-slate-800">${so.total.toFixed(2)}</p>
                                      <select 
                                        value={so.status || 'Draft'}
                                        onChange={(e) => updateOrderStatus(so.id, e.target.value)}
                                        className={cn(
                                          "text-[10px] font-bold px-2 py-0.5 rounded-full outline-none border-none cursor-pointer",
                                          so.status === 'Delivered' ? "bg-emerald-100 text-emerald-700" : 
                                          so.status === 'Shipped' ? "bg-blue-100 text-blue-700" : 
                                          so.status === 'Confirmed' ? "bg-indigo-100 text-indigo-700" :
                                          so.status === 'Cancelled' ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"
                                        )}
                                      >
                                        <option value="Draft">{isRTL ? 'مسودة' : 'Draft'}</option>
                                        <option value="Confirmed">{isRTL ? 'مؤكد' : 'Confirmed'}</option>
                                        <option value="Shipped">{isRTL ? 'تم الشحن' : 'Shipped'}</option>
                                        <option value="Delivered">{isRTL ? 'تم التسليم' : 'Delivered'}</option>
                                        <option value="Cancelled">{isRTL ? 'ملغي' : 'Cancelled'}</option>
                                      </select>
                                    </div>
                                    <motion.div
                                      animate={{ rotate: expandedOrderId === so.id ? 90 : 0 }}
                                      className="text-slate-300 group-hover:text-indigo-600"
                                    >
                                      <ChevronRight size={20} className="rtl:rotate-180" />
                                    </motion.div>
                                  </div>
                                </div>

                                <AnimatePresence>
                                  {expandedOrderId === so.id && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="border-t border-slate-50 bg-slate-50/50"
                                    >
                                      <div className="p-4 space-y-4">
                                        <table className="w-full text-xs">
                                          <thead>
                                            <tr className="text-slate-400 uppercase tracking-wider font-bold">
                                              <th className="text-left rtl:text-right pb-2">{isRTL ? 'الصنف' : 'Item'}</th>
                                              <th className="text-center pb-2">{isRTL ? 'الكمية' : 'Qty'}</th>
                                              <th className="text-right rtl:text-left pb-2">{isRTL ? 'السعر' : 'Price'}</th>
                                              <th className="text-right rtl:text-left pb-2">{isRTL ? 'المجموع' : 'Subtotal'}</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                            {so.items.map((item: any) => (
                                              <tr key={item.id}>
                                                <td className="py-2 font-medium text-slate-700">{item.name}</td>
                                                <td className="py-2 text-center text-slate-600">{item.quantity}</td>
                                                <td className="py-2 text-right rtl:text-left text-slate-600">${item.price.toFixed(2)}</td>
                                                <td className="py-2 text-right rtl:text-left font-bold text-slate-800">${(item.price * item.quantity).toFixed(2)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                          <tfoot>
                                            <tr className="border-t border-slate-200">
                                              <td colSpan={3} className="pt-3 font-bold text-slate-500 text-right rtl:text-left">{isRTL ? 'الإجمالي:' : 'Total:'}</td>
                                              <td className="pt-3 font-bold text-indigo-600 text-right rtl:text-left text-sm">${so.total.toFixed(2)}</td>
                                            </tr>
                                          </tfoot>
                                        </table>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))
                          ) : (
                            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                              <FileText size={48} className="mx-auto mb-4 opacity-20" />
                              <p>{isRTL ? 'لا توجد طلبات بيع' : 'No sales orders'}</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ) : detailTab === 'supplier_info' ? (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                            {isRTL ? 'تفاصيل المورد' : 'Supplier Details'}
                          </h3>
                          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                            <div>
                              <span className="text-xs text-slate-400 block mb-1">{isRTL ? 'الاسم التجاري' : 'Business Name'}</span>
                              <p className="font-bold text-slate-800">{selectedContact.name}</p>
                            </div>
                            <div>
                              <span className="text-xs text-slate-400 block mb-1">{isRTL ? 'الرقم الضريبي' : 'Tax ID / VAT'}</span>
                              <p className="font-bold text-slate-800">{selectedContact.taxId || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-slate-400 block mb-1">{isRTL ? 'التصنيف' : 'Category'}</span>
                              <p className="font-bold text-indigo-600">{selectedContact.category || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                            {isRTL ? 'شروط الدفع' : 'Payment Terms'}
                          </h3>
                          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                            <div>
                              <span className="text-xs text-slate-400 block mb-1">{isRTL ? 'طريقة الدفع المفضلة' : 'Preferred Method'}</span>
                              <p className="font-bold text-slate-800">{selectedContact.paymentMethod || (isRTL ? 'غير محدد' : 'Not Specified')}</p>
                            </div>
                            <div>
                              <span className="text-xs text-slate-400 block mb-1">{isRTL ? 'فترة الائتمان' : 'Credit Period'}</span>
                              <p className="font-bold text-slate-800">{selectedContact.creditPeriod || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-slate-400 block mb-1">{isRTL ? 'حد الائتمان' : 'Credit Limit'}</span>
                              <p className="font-bold text-rose-600">${selectedContact.creditLimit || '0.00'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                          {isRTL ? 'معلومات التواصل الإضافية' : 'Additional Contact Info'}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <span className="text-xs text-slate-400 block mb-1">{isRTL ? 'مسؤول المبيعات' : 'Sales Rep'}</span>
                            <p className="text-sm font-bold text-slate-800">{selectedContact.salesRep || 'N/A'}</p>
                          </div>
                          <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <span className="text-xs text-slate-400 block mb-1">{isRTL ? 'الدعم الفني' : 'Support'}</span>
                            <p className="text-sm font-bold text-slate-800">Technical Team</p>
                            <p className="text-xs text-slate-500">support@globaltech.com</p>
                          </div>
                          <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <span className="text-xs text-slate-400 block mb-1">{isRTL ? 'الموقع الإلكتروني' : 'Website'}</span>
                            <p className="text-sm font-bold text-indigo-600">www.globaltech.com</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : detailTab === 'notes' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <FileText size={18} />
                          {isRTL ? 'ملاحظات جهة الاتصال' : 'Contact Notes'}
                        </h3>
                        {localNotes !== (selectedContact.notes || '') && (
                          <button 
                            onClick={async () => {
                              if (!user?.companyId || !selectedContact) return;
                              setIsSavingNotes(true);
                              try {
                                await api.generic.update(user.companyId, 'contacts', selectedContact.id, {
                                  notes: localNotes
                                });
                              } catch (err) {
                                console.error('Error saving notes:', err);
                              } finally {
                                setIsSavingNotes(false);
                              }
                            }}
                            disabled={isSavingNotes}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2"
                          >
                            {isSavingNotes ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ الملاحظات' : 'Save Notes')}
                          </button>
                        )}
                      </div>
                      
                      <div className="relative">
                        <textarea
                          placeholder={isRTL ? 'أضف ملاحظاتك هنا...' : 'Add your notes here...'}
                          className="w-full h-96 p-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 leading-relaxed resize-none"
                          value={localNotes}
                          onChange={(e) => setLocalNotes(e.target.value)}
                        />
                        <div className="absolute bottom-4 right-4 rtl:left-4 rtl:right-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/80 backdrop-blur-sm px-2 py-1 rounded">
                          {localNotes.length} {isRTL ? 'شخصية' : 'characters'}
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-400 flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        {isRTL ? 'يتم حفظ هذه الملاحظات في قاعدة البيانات للرجوع إليها مستقبلاً.' : 'These notes are saved in the database for future reference.'}
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <button className="py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-all">
                    {isRTL ? 'تعديل البيانات' : 'Edit Details'}
                  </button>
                  <button 
                    onClick={() => setShowOrderModal(true)}
                    className={cn(
                      "py-3.5 text-white rounded-xl font-bold shadow-lg transition-all",
                      selectedContact.type === 'Customer' ? "bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700" : "bg-amber-600 shadow-amber-100 hover:bg-amber-700"
                    )}
                  >
                    {isRTL ? (selectedContact.type === 'Customer' ? 'فاتورة بيع' : 'فاتورة شراء') : (selectedContact.type === 'Customer' ? 'New Sale' : 'New Purchase')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddContactModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
                <div className="flex items-center gap-3">
                  <User size={24} />
                  <h3 className="text-xl font-bold">{isRTL ? 'إضافة جهة اتصال جديدة' : 'Add New Contact'}</h3>
                </div>
                <button onClick={() => setShowAddContactModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button 
                    onClick={() => setNewContact({...newContact, type: 'Customer'})}
                    className={cn(
                      "py-2 rounded-lg text-sm font-bold transition-all",
                      newContact.type === 'Customer' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    {isRTL ? 'عميل' : 'Customer'}
                  </button>
                  <button 
                    onClick={() => setNewContact({...newContact, type: 'Supplier'})}
                    className={cn(
                      "py-2 rounded-lg text-sm font-bold transition-all",
                      newContact.type === 'Supplier' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    {isRTL ? 'مورد' : 'Supplier'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">{isRTL ? 'الاسم' : 'Name'}</label>
                    <input 
                      type="text"
                      value={newContact.name}
                      onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder={isRTL ? 'اسم جهة الاتصال' : 'Contact name'}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">{isRTL ? 'رقم الهاتف' : 'Phone'}</label>
                    <input 
                      type="text"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="+966..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">{isRTL ? 'البريد الإلكتروني' : 'Email'}</label>
                    <input 
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="example@mail.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">{isRTL ? 'العنوان' : 'Address'}</label>
                    <input 
                      type="text"
                      value={newContact.address}
                      onChange={(e) => setNewContact({...newContact, address: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder={isRTL ? 'العنوان الكامل' : 'Full address'}
                    />
                  </div>
                </div>

                {newContact.type === 'Supplier' && (
                  <div className="pt-6 border-t border-slate-100 space-y-6">
                    <h4 className="text-sm font-bold text-indigo-600 flex items-center gap-2">
                      <FileText size={18} />
                      {isRTL ? 'تفاصيل المورد الإضافية' : 'Additional Supplier Details'}
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">{isRTL ? 'الرقم الضريبي' : 'Tax ID / VAT'}</label>
                        <input 
                          type="text"
                          value={newContact.taxId}
                          onChange={(e) => setNewContact({...newContact, taxId: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">{isRTL ? 'التصنيف' : 'Category'}</label>
                        <input 
                          type="text"
                          value={newContact.category}
                          onChange={(e) => setNewContact({...newContact, category: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder={isRTL ? 'مثل: إلكترونيات' : 'e.g. Electronics'}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">{isRTL ? 'طريقة الدفع' : 'Payment Method'}</label>
                        <select 
                          value={newContact.paymentMethod}
                          onChange={(e) => setNewContact({...newContact, paymentMethod: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="">{isRTL ? 'اختر الطريقة' : 'Select Method'}</option>
                          <option value="Cash">{isRTL ? 'نقدي' : 'Cash'}</option>
                          <option value="Bank Transfer">{isRTL ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                          <option value="Check">{isRTL ? 'شيك' : 'Check'}</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">{isRTL ? 'فترة الائتمان' : 'Credit Period'}</label>
                        <input 
                          type="text"
                          value={newContact.creditPeriod}
                          onChange={(e) => setNewContact({...newContact, creditPeriod: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Net 30 Days"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">{isRTL ? 'حد الائتمان' : 'Credit Limit'}</label>
                        <input 
                          type="number"
                          value={newContact.creditLimit}
                          onChange={(e) => setNewContact({...newContact, creditLimit: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">{isRTL ? 'مسؤول المبيعات' : 'Sales Rep'}</label>
                        <input 
                          type="text"
                          value={newContact.salesRep}
                          onChange={(e) => setNewContact({...newContact, salesRep: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={() => setShowAddContactModal(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-all"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  onClick={handleAddContact}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  {isRTL ? 'حفظ' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Details Modal - Removed in favor of inline expansion */}

      {/* New Order Modal */}
      <AnimatePresence>
        {showOrderModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
                <div className="flex items-center gap-3">
                  <ShoppingCart size={24} />
                  <h3 className="text-xl font-bold">
                    {selectedContact.type === 'Customer' 
                      ? (isRTL ? 'إنشاء طلب بيع جديد' : 'Create New Sales Order')
                      : (isRTL ? 'إنشاء طلب شراء جديد' : 'Create New Purchase Order')}
                  </h3>
                </div>
                <button onClick={() => setShowOrderModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Product Selection */}
                <div className="flex-1 p-6 overflow-y-auto border-b lg:border-b-0 lg:border-e border-slate-100">
                  <div className="relative mb-6">
                    <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      placeholder={isRTL ? 'البحث عن منتج...' : 'Search products...'}
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(product => (
                      <button 
                        key={product.id}
                        onClick={() => addToOrder(product)}
                        className="p-4 bg-white border border-slate-100 rounded-2xl text-left rtl:text-right hover:border-indigo-200 hover:shadow-sm transition-all flex items-center gap-4"
                      >
                        <div className="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden flex-shrink-0">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{product.name}</h4>
                          <p className="text-xs text-indigo-600 font-bold">
                            ${(selectedContact.type === 'Supplier' ? product.cost : product.price).toFixed(2)}
                          </p>
                        </div>
                        <Plus size={16} className="text-slate-300" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="w-full lg:w-80 bg-slate-50 p-6 flex flex-col">
                  <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <ShoppingCart size={18} className="text-indigo-600" />
                    {isRTL ? 'ملخص الطلب' : 'Order Summary'}
                  </h4>
                  <div className="flex-1 overflow-y-auto space-y-4 mb-6">
                    {orderItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center gap-2 opacity-50">
                        <ShoppingCart size={48} strokeWidth={1} />
                        <p className="text-xs font-medium">{isRTL ? 'لم يتم اختيار منتجات' : 'No products selected'}</p>
                      </div>
                    ) : (
                      orderItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <input 
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateOrderQuantity(item.id, parseInt(e.target.value) || 1)}
                                className="w-12 px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <span className="text-[10px] text-slate-400">x</span>
                              {selectedContact.type === 'Supplier' ? (
                                <input 
                                  type="number"
                                  step="0.01"
                                  value={item.cost}
                                  onChange={(e) => updateOrderCost(item.id, parseFloat(e.target.value) || 0)}
                                  className="w-16 px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              ) : (
                                <span className="text-[10px] text-slate-400">
                                  ${item.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-600">
                              ${((selectedContact.type === 'Supplier' ? item.cost : item.price) * item.quantity).toFixed(2)}
                            </span>
                            <button 
                              onClick={() => setOrderItems(orderItems.filter(i => i.id !== item.id))}
                              className="text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="pt-4 border-t border-slate-200 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 font-bold">{isRTL ? 'الإجمالي' : 'Total'}</span>
                      <span className="text-xl font-bold text-indigo-600">
                        ${orderItems.reduce((sum, item) => sum + ((selectedContact.type === 'Supplier' ? item.cost : item.price) * item.quantity), 0).toFixed(2)}
                      </span>
                    </div>
                    <button 
                      disabled={orderItems.length === 0}
                      onClick={handleCreateOrder}
                      className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} />
                      <span>{isRTL ? 'حفظ الطلب' : 'Save Order'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
