import React, { useState } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote,
  Landmark,
  Smartphone,
  User,
  Tag,
  X,
  CheckCircle2,
  Printer,
  Download as DownloadIcon,
  Coins,
  ArrowDownLeft,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Fuse from 'fuse.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { api } from '../api';
import { cn } from '../lib/utils';

export default function POS({ 
  isRTL, 
  products, 
  currencySettings, 
  contacts,
  companyInfo,
  user,
  refreshData
}: { 
  isRTL: boolean, 
  products: any[], 
  currencySettings: any, 
  contacts: any[],
  companyInfo: any,
  user: any,
  refreshData: () => void
}) {
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank' | 'mobile'>('card');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState(currencySettings.baseCurrency);
  const [scanError, setScanError] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [discount, setDiscount] = useState({ type: 'percent' as 'percent' | 'fixed', value: '' });
  const [heldCarts, setHeldCarts] = useState<any[]>([]);

  const [showHeldCarts, setShowHeldCarts] = useState(false);
  const invoiceRef = React.useRef<HTMLDivElement>(null);

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !lastOrder) return;
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${lastOrder.invoiceNumber || 'invoice'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const fuse = React.useMemo(() => {
    return new Fuse(products, {
      keys: ['name', 'sku', 'barcode'],
      threshold: 0.3, // Lower is stricter, 0.3 is good for minor typos
      distance: 100,
    });
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    if (!debouncedSearchTerm.trim()) return products;
    
    // If it looks like a barcode (long number), try exact match first for speed/accuracy
    if (/^\d{8,14}$/.test(debouncedSearchTerm)) {
      const exactMatch = products.filter(p => p.barcode === debouncedSearchTerm || p.sku === debouncedSearchTerm);
      if (exactMatch.length > 0) return exactMatch;
    }

    return fuse.search(debouncedSearchTerm).map(result => result.item);
  }, [debouncedSearchTerm, products, fuse]);

  const exchangeRate = currencySettings.rates[selectedCurrency] || 1;

  const formatPrice = (price: number) => {
    return (price * exchangeRate).toFixed(2);
  };

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const discountAmount = discount.value 
    ? (discount.type === 'percent' 
        ? subtotal * (parseFloat(discount.value) / 100) 
        : parseFloat(discount.value))
    : 0;

  const tax = (subtotal - discountAmount) * 0.15; // 15% VAT
  const total = subtotal - discountAmount + tax;

  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const heldCart = {
      id: Date.now(),
      items: [...cart],
      customer: selectedCustomer ? contacts.find(c => c.id === selectedCustomer) : null,
      date: new Date().toLocaleTimeString()
    };
    setHeldCarts([...heldCarts, heldCart]);
    setCart([]);
    setSelectedCustomer(null);
    setDiscount({ type: 'percent', value: '' });
  };

  const resumeCart = (heldCart: any) => {
    setCart(heldCart.items);
    setSelectedCustomer(heldCart.customer?.id || null);
    setHeldCarts(heldCarts.filter(c => c.id !== heldCart.id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const product = products.find(p => 
        (p.barcode && p.barcode === searchTerm.trim()) || 
        (p.sku && p.sku.toLowerCase() === searchTerm.trim().toLowerCase())
      );

      if (product) {
        addToCart(product);
        setSearchTerm('');
        setScanError(false);
      } else {
        setScanError(true);
        setTimeout(() => setScanError(false), 2000);
      }
    }
  };

  const handleCompletePayment = async () => {
    if (!user?.companyId) return;

    const generateInvoiceNumber = () => {
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `INV-${datePart}-${randomPart}`;
    };

    const invoiceNumber = generateInvoiceNumber();

    const order = {
      invoiceNumber,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      subtotal,
      tax,
      total,
      discountAmount,
      customer: selectedCustomer ? contacts.find(c => c.id === selectedCustomer) : null,
      paymentMethod,
      currency: selectedCurrency,
      exchangeRate,
      date: new Date().toISOString(),
      cashierId: user.uid
    };

    try {
      // Save sale to SQLite API
      const result = await api.sales.create(user.companyId, order);
      
      // Update stock for each item using API
      for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          await api.products.update(user.companyId, String(item.id), {
            ...product,
            stock: newStock
          });
        }
      }

      setLastOrder({ ...order, id: result.id });
      setShowSuccess(true);
      setCart([]);
      if (refreshData) refreshData();
    } catch (err) {
      console.error('Error completing payment:', err);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* Products Grid */}
      <div className="flex-1 flex flex-col gap-6 min-h-0">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 rtl:right-4 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder={isRTL ? 'البحث عن منتج أو مسح الباركود...' : 'Search products or scan barcode...'}
              className={cn(
                "w-full pl-12 rtl:pr-12 rtl:pl-4 py-4 bg-white border rounded-2xl shadow-sm focus:ring-2 outline-none transition-all text-lg",
                scanError ? "border-rose-500 ring-2 ring-rose-200" : "border-slate-200 focus:ring-indigo-500"
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {scanError && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-6 left-4 text-xs font-bold text-rose-500"
              >
                {isRTL ? 'المنتج غير موجود!' : 'Product not found!'}
              </motion.p>
            )}
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-4 shadow-sm">
            <Coins size={20} className="text-indigo-600" />
            <select 
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
            >
              {Object.keys(currencySettings.rates).map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 rtl:pl-2 rtl:pr-0">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left rtl:text-right group"
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-slate-50">
                  <img 
                    src={product.image || 'https://picsum.photos/seed/product/200/200'} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h4 className="font-bold text-slate-800 mb-1 line-clamp-1">{product.name}</h4>
                <p className="text-indigo-600 font-bold">{selectedCurrency} {formatPrice(product.price)}</p>
              </button>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-400">
              <Search size={48} className="mx-auto mb-4 opacity-20" />
              <p>{isRTL ? 'لم يتم العثور على منتجات' : 'No products found'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart / Checkout */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-indigo-600" size={24} />
            <h3 className="text-lg font-bold text-slate-800">{isRTL ? 'السلة' : 'Cart'}</h3>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {cart.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {heldCarts.length > 0 && (
              <button 
                onClick={() => setShowHeldCarts(true)}
                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors relative"
                title={isRTL ? 'الطلبات المعلقة' : 'Held Carts'}
              >
                <History size={20} />
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {heldCarts.length}
                </span>
              </button>
            )}
            <button 
              onClick={handleHoldCart}
              disabled={cart.length === 0}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30"
              title={isRTL ? 'تعليق الطلب' : 'Hold Cart'}
            >
              <ArrowDownLeft size={20} />
            </button>
            <button onClick={() => setCart([])} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <User size={18} className="text-slate-400" />
            <select 
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={selectedCustomer || ''}
              onChange={(e) => setSelectedCustomer(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">{isRTL ? 'عميل نقدي' : 'Walk-in Customer'}</option>
              {contacts.filter(c => c.type === 'Customer').map(customer => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-slate-400" />
            <div className="flex-1 flex gap-1">
              <input 
                type="number"
                placeholder={isRTL ? 'خصم...' : 'Discount...'}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={discount.value}
                onChange={(e) => setDiscount({...discount, value: e.target.value})}
              />
              <button 
                onClick={() => setDiscount({...discount, type: discount.type === 'percent' ? 'fixed' : 'percent'})}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                {discount.type === 'percent' ? '%' : '$'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
              <ShoppingCart size={64} strokeWidth={1} />
              <p className="font-medium">{isRTL ? 'السلة فارغة' : 'Cart is empty'}</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 truncate">{item.name}</h4>
                  <p className="text-xs text-indigo-600 font-bold">{selectedCurrency} {formatPrice(item.price * item.quantity)}</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                  <button 
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-1 hover:bg-white rounded shadow-sm text-slate-600"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, 1)}
                    className="p-1 hover:bg-white rounded shadow-sm text-slate-600"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-500">
              <span>{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span>{selectedCurrency} {formatPrice(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-rose-500 font-medium">
                <span>{isRTL ? 'الخصم' : 'Discount'}</span>
                <span>-{selectedCurrency} {formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-slate-500">
              <span>{isRTL ? 'الضريبة (15%)' : 'Tax (15%)'}</span>
              <span>{selectedCurrency} {formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-slate-800 pt-2 border-t border-slate-200">
              <span>{isRTL ? 'الإجمالي' : 'Total'}</span>
              <span>{selectedCurrency} {formatPrice(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setPaymentMethod('cash')}
              className={cn(
                "flex flex-col items-center gap-2 p-3 border rounded-2xl transition-all group relative overflow-hidden",
                paymentMethod === 'cash' 
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md" 
                  : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              )}
            >
              <Banknote size={20} />
              <span className="text-xs font-bold">{isRTL ? 'نقدي' : 'Cash'}</span>
              {paymentMethod !== 'cash' && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] px-1 rounded-bl-lg font-bold">
                  {isRTL ? 'سريع' : 'FAST'}
                </div>
              )}
            </button>
            <button 
              onClick={() => setPaymentMethod('card')}
              className={cn(
                "flex flex-col items-center gap-2 p-3 border rounded-2xl transition-all group relative overflow-hidden",
                paymentMethod === 'card' 
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
                  : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
              )}
            >
              <CreditCard size={20} />
              <span className="text-xs font-bold">{isRTL ? 'بطاقة' : 'Card'}</span>
              {paymentMethod !== 'card' && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] px-1 rounded-bl-lg font-bold">
                  {isRTL ? 'موصى به' : 'REC'}
                </div>
              )}
            </button>
            <button 
              onClick={() => setPaymentMethod('bank')}
              className={cn(
                "flex flex-col items-center gap-2 p-3 border rounded-2xl transition-all group",
                paymentMethod === 'bank' 
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600"
              )}
            >
              <Landmark size={20} />
              <span className="text-xs font-bold">{isRTL ? 'تحويل بنكي' : 'Bank Transfer'}</span>
            </button>
            <button 
              onClick={() => setPaymentMethod('mobile')}
              className={cn(
                "flex flex-col items-center gap-2 p-3 border rounded-2xl transition-all group",
                paymentMethod === 'mobile' 
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600"
              )}
            >
              <Smartphone size={20} />
              <span className="text-xs font-bold">{isRTL ? 'دفع جوال' : 'Mobile Payment'}</span>
            </button>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={handleCompletePayment}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <span>{isRTL ? 'إتمام الدفع' : 'Complete Payment'}</span>
          </button>
        </div>
      </div>

      {/* Success Modal & Invoice */}
      <AnimatePresence>
        {showSuccess && lastOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden invoice-container"
            >
              <div 
                ref={invoiceRef}
                className="p-8 bg-white print:p-0"
              >
                <div className="text-center mb-8">
                  {companyInfo?.logo && (
                    <img 
                      src={companyInfo.logo} 
                      alt="Logo" 
                      className="w-16 h-16 mx-auto mb-3 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <h2 className="text-2xl font-bold text-slate-800">{companyInfo?.name || (isRTL ? 'شركة كيفو' : 'Keevo ERP')}</h2>
                  <p className="text-sm text-slate-500">{companyInfo?.address || (isRTL ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia')}</p>
                  {companyInfo?.deliveryNumber && (
                    <p className="text-sm text-slate-500">{isRTL ? 'هاتف:' : 'Tel:'} {companyInfo.deliveryNumber}</p>
                  )}
                  <div className="flex flex-col items-center gap-1 mt-4">
                    <div className="flex items-center justify-center gap-2 text-emerald-600">
                      <CheckCircle2 size={24} />
                      <span className="text-lg font-bold">{isRTL ? 'تمت العملية بنجاح' : 'Payment Successful'}</span>
                    </div>
                    <div className="flex flex-col gap-1 items-center">
                      <p className="text-sm font-black text-slate-800 tracking-wider">
                        {lastOrder.invoiceNumber}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">#{lastOrder.id}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>{isRTL ? 'التاريخ' : 'Date'}</span>
                    <span className="font-medium text-slate-800">{lastOrder.date}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>{isRTL ? 'طريقة الدفع' : 'Payment Method'}</span>
                    <span className="font-medium text-slate-800 uppercase">{lastOrder.paymentMethod}</span>
                  </div>
                  {lastOrder.customer && (
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>{isRTL ? 'العميل' : 'Customer'}</span>
                      <span className="font-medium text-slate-800">{lastOrder.customer.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>{isRTL ? 'العملة' : 'Currency'}</span>
                    <span className="font-medium text-slate-800 uppercase">{lastOrder.currency}</span>
                  </div>
                  <div className="border-t border-dashed border-slate-200 pt-4">
                    {lastOrder.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">{item.name} x{item.quantity}</span>
                        <span className="font-medium text-slate-800">{lastOrder.currency} {(item.price * lastOrder.exchangeRate * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
                      <span>{lastOrder.currency} {(lastOrder.subtotal * lastOrder.exchangeRate).toFixed(2)}</span>
                    </div>
                    {lastOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-rose-500">
                        <span>{isRTL ? 'الخصم' : 'Discount'}</span>
                        <span>-{lastOrder.currency} {(lastOrder.discountAmount * lastOrder.exchangeRate).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>{isRTL ? 'الضريبة' : 'Tax'}</span>
                      <span>{lastOrder.currency} {(lastOrder.tax * lastOrder.exchangeRate).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-slate-800 pt-2">
                      <span>{isRTL ? 'الإجمالي' : 'Total'}</span>
                      <span className="text-indigo-600">{lastOrder.currency} {(lastOrder.total * lastOrder.exchangeRate).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 no-print">
                  <button 
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    <Printer size={18} />
                    <span>{isRTL ? 'طباعة' : 'Print'}</span>
                  </button>
                  <button 
                    onClick={handleDownloadPDF}
                    className="flex items-center justify-center gap-2 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    <DownloadIcon size={18} />
                    <span>{isRTL ? 'تحميل PDF' : 'Download PDF'}</span>
                  </button>
                </div>

                <button 
                  onClick={() => setShowSuccess(false)}
                  className="w-full mt-4 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all no-print"
                >
                  {isRTL ? 'عملية جديدة' : 'New Transaction'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Held Carts Modal */}
      <AnimatePresence>
        {showHeldCarts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-500 text-white">
                <h3 className="text-xl font-bold">{isRTL ? 'الطلبات المعلقة' : 'Held Carts'}</h3>
                <button onClick={() => setShowHeldCarts(false)} className="text-white/80 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                {heldCarts.map((held) => (
                  <div key={held.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-amber-200 transition-all">
                    <div>
                      <p className="font-bold text-slate-800">{held.customer?.name || (isRTL ? 'عميل نقدي' : 'Walk-in')}</p>
                      <p className="text-xs text-slate-400">{held.date} • {held.items.length} {isRTL ? 'أصناف' : 'items'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setHeldCarts(heldCarts.filter(c => c.id !== held.id))}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          resumeCart(held);
                          setShowHeldCarts(false);
                        }}
                        className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-all"
                      >
                        {isRTL ? 'استعادة' : 'Resume'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
