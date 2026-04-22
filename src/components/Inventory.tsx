import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Download,
  Barcode,
  X,
  Package,
  History,
  Image as ImageIcon,
  Upload,
  Camera,
  Maximize,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../api';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function Inventory({ isRTL, products, user, refreshData }: { isRTL: boolean, products: any[], user: any, refreshData: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    image: '',
    currency: 'USD',
    unit: 'pieces',
    location: 'Main Warehouse'
  });
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef<any>(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showDamagedModal, setShowDamagedModal] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: null as string | null,
    type: 'add' as 'add' | 'remove',
    quantity: '',
    reason: ''
  });
  const [damagedForm, setDamagedForm] = useState({
    productId: null as string | null,
    quantity: '',
    reason: 'Damaged' as 'Damaged' | 'Lost' | 'Expired',
    location: 'Main Warehouse',
    notes: ''
  });
  const [filters, setFilters] = useState({
    category: 'all',
    location: 'all',
    unit: 'all',
    stockLevel: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [managedCategories, setManagedCategories] = useState<any[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: '', name: '' });
  const [view, setView] = useState<'products' | 'history'>('products');
  const [stockAdjustments, setStockAdjustments] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.companyId) return;
    const fetchCats = async () => {
      try {
        const cats = await api.generic.list(user.companyId, 'categories');
        setManagedCategories(cats);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCats();
  }, [user?.companyId]);

  useEffect(() => {
    if (!user?.companyId || view !== 'history') return;
    const fetchHistory = async () => {
      try {
        const adjustments = await api.generic.list(user.companyId, 'stock_adjustments');
        setStockAdjustments(adjustments);
      } catch (err) {
        console.error('Error fetching adjustment history:', err);
      }
    };
    fetchHistory();
  }, [user?.companyId, view]);

  const categories = managedCategories.length > 0 
    ? managedCategories.map(c => c.name)
    : Array.from(new Set(products.map(p => p.category)));
  const locations = Array.from(new Set(products.map(p => p.location)));
  const units = Array.from(new Set(products.map(p => p.unit || 'pieces')));

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filters.category === 'all' || product.category === filters.category;
    const matchesLocation = filters.location === 'all' || product.location === filters.location;
    const matchesUnit = filters.unit === 'all' || product.unit === filters.unit;
    const matchesStock = filters.stockLevel === 'all' || (filters.stockLevel === 'low' && product.stock <= product.minStock);

    return matchesSearch && matchesCategory && matchesLocation && matchesUnit && matchesStock;
  });

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !categoryForm.name.trim()) return;

    try {
      // In SQLite migration, we'll use generic create (backend handles ID generation if not provided)
      await api.generic.create(user.companyId, 'categories', { 
        id: categoryForm.id || undefined, 
        name: categoryForm.name.trim() 
      });
      
      setCategoryForm({ id: '', name: '' });
      refreshData();
      // Re-fetch categories locally
      const cats = await api.generic.list(user.companyId, 'categories');
      setManagedCategories(cats);
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };

  const handleDeleteCategory = async (cat: any) => {
    if (!user?.companyId) return;
    
    const productsInCategory = products.filter(p => p.category === cat.name);
    if (productsInCategory.length > 0) {
      if (!window.confirm(isRTL 
        ? `هذا التصنيف مرتبط بـ ${productsInCategory.length} منتجات. هل أنت متأكد من الحذف؟` 
        : `This category is assigned to ${productsInCategory.length} products. Are you sure you want to delete it?`)) {
        return;
      }
    } else {
      if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا التصنيف؟' : 'Are you sure you want to delete this category?')) return;
    }

    try {
      await api.generic.delete(user.companyId, 'categories', String(cat.id));
      
      // Refresh local state and overall data
      const cats = await api.generic.list(user.companyId, 'categories');
      setManagedCategories(cats);
      refreshData();
    } catch (err) {
      console.error('Error deleting category:', err);
      alert(isRTL ? 'حدث خطأ أثناء حذف التصنيف' : 'Error deleting category');
    }
  };
  
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustmentForm.productId === null || !user?.companyId || !adjustmentForm.reason) return;
    
    const qty = parseInt(adjustmentForm.quantity) || 0;
    const multiplier = adjustmentForm.type === 'add' ? 1 : -1;
    
    const product = products.find(p => p.id === adjustmentForm.productId);
    if (!product) return;

    const newStock = Math.max(0, product.stock + (qty * multiplier));

    try {
      // Update product stock
      await api.products.update(user.companyId, String(product.id), {
        ...product,
        stock: newStock
      });

      // Record adjustment
      await api.generic.create(user.companyId, 'stock_adjustments', {
        date: new Date().toISOString(),
        productId: product.id,
        productName: product.name,
        type: adjustmentForm.type,
        quantity: qty,
        reason: adjustmentForm.reason,
        previousStock: product.stock,
        newStock: newStock,
        userId: user.uid
      });

      setShowAdjustmentModal(false);
      setAdjustmentForm({ productId: null, type: 'add', quantity: '', reason: '' });
      if (refreshData) refreshData();
    } catch (err) {
      console.error('Error adjusting stock:', err);
    }
  };

  const handleDamagedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!damagedForm.productId || !user?.companyId || !damagedForm.quantity) return;
    
    const qty = parseInt(damagedForm.quantity) || 0;
    const product = products.find(p => String(p.id) === String(damagedForm.productId));
    if (!product) return;

    const newStock = Math.max(0, product.stock - qty);

    try {
      // Update product stock
      await api.products.update(user.companyId, String(product.id), {
        ...product,
        stock: newStock
      });

      // Record damaged item
      await api.generic.create(user.companyId, 'damaged_items', {
        date: new Date().toISOString(),
        productId: product.id,
        productName: product.name,
        quantity: qty,
        reason: damagedForm.reason,
        location: damagedForm.location,
        notes: damagedForm.notes,
        cost: product.cost * qty,
        userId: user.uid
      });

      // Also record in stock adjustments for history
      await api.generic.create(user.companyId, 'stock_adjustments', {
        date: new Date().toISOString(),
        productId: product.id,
        productName: product.name,
        type: 'remove',
        quantity: qty,
        reason: `Loss: ${damagedForm.reason}`,
        previousStock: product.stock,
        newStock: newStock,
        userId: user.uid
      });

      setShowDamagedModal(false);
      setDamagedForm({ 
        productId: null, 
        quantity: '', 
        reason: 'Damaged', 
        location: 'Main Warehouse',
        notes: ''
      });
      if (refreshData) refreshData();
      alert(isRTL ? 'تم تسجيل التلف/الفقد بنجاح' : 'Damaged/Lost item recorded successfully');
    } catch (err) {
      console.error('Error recording damaged item:', err);
      alert(isRTL ? 'حدث خطأ أثناء التسجيل' : 'Error during recording');
    }
  };

  const handleExport = () => {
    const headers = isRTL 
      ? ['المعرف', 'الاسم', 'وحدة حفظ المخزون (SKU)', 'التصنيف', 'السعر', 'التكلفة', 'المخزون', 'الحد الأدنى']
      : ['ID', 'Name', 'SKU', 'Category', 'Price', 'Cost', 'Stock', 'Min Stock'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => [
        p.id,
        `"${p.name}"`,
        p.sku,
        p.category,
        p.price,
        p.cost,
        p.stock,
        p.minStock
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;

    let finalImage = productForm.image;

    // Generate image with Gemini if not provided
    if (!finalImage) {
      setIsGeneratingImage(true);
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: `Generate a professional, high-quality product photo for a product named "${productForm.name}" in the category "${productForm.category || 'General'}". The image should be clean, well-lit, and suitable for an e-commerce catalog.` }]
          }
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            finalImage = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (err) {
        console.error('Error generating image with Gemini:', err);
        // Fallback to picsum if Gemini fails
        finalImage = `https://picsum.photos/seed/${productForm.name}/400/400`;
      } finally {
        setIsGeneratingImage(false);
      }
    }

    const productData = {
      name: productForm.name,
      sku: productForm.sku || `SKU-${Math.floor(Math.random() * 10000)}`,
      barcode: productForm.barcode,
      category: productForm.category || 'General',
      price: parseFloat(productForm.price) || 0,
      cost: parseFloat(productForm.cost) || 0,
      currency: productForm.currency || 'USD',
      unit: productForm.unit || 'pieces',
      stock: parseInt(productForm.stock) || 0,
      minStock: parseInt(productForm.minStock) || 0,
      location: productForm.location || 'Main Warehouse',
      image: finalImage
    };

    try {
      if (modalMode === 'add') {
        await api.products.create(user.companyId, productData);
      } else if (modalMode === 'edit' && editingId !== null) {
        await api.products.update(user.companyId, editingId, productData);
      }
      setShowModal(false);
      resetForm();
      refreshData();
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      sku: '',
      barcode: '',
      category: '',
      price: '',
      cost: '',
      stock: '',
      minStock: '',
      image: '',
      currency: 'USD',
      unit: 'pieces',
      location: 'Main Warehouse'
    });
    setEditingId(null);
  };

  const generateBarcode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newBarcode = `BRC-${timestamp}${random}`;
    setProductForm({ ...productForm, barcode: newBarcode });
  };

  const handleEditClick = (product: any) => {
    setEditingId(String(product.id));
    setProductForm({
      name: product.name || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      category: product.category || '',
      price: (product.price || 0).toString(),
      cost: (product.cost || 0).toString(),
      stock: (product.stock || 0).toString(),
      minStock: (product.minStock || 0).toString(),
      image: product.image || '',
      currency: product.currency || 'USD',
      unit: product.unit || 'pieces',
      location: product.location || 'Main Warehouse'
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDeleteProduct = async (id: any) => {
    if (!user?.companyId || !window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Are you sure you want to delete this product?')) return;
    
    try {
      await api.products.delete(user.companyId, String(id));
      refreshData();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm({ ...productForm, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const startScanner = () => {
    setShowScanner(true);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error clearing scanner:", err);
      }
    }
    setShowScanner(false);
  };

  useEffect(() => {
    if (showScanner) {
      const timeoutId = setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          /* verbose= */ false
        );
        
        scannerRef.current = scanner;
        
        scanner.render((decodedText) => {
          setProductForm(prev => ({ ...prev, barcode: decodedText }));
          stopScanner();
        }, (error) => {
          // Soft errors like "QR code not found" are common and should be ignored
        });
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        // We handle clear in stopScanner to avoid race conditions with modal exit animation
      };
    }
  }, [showScanner]);

  return (
    <div className={cn("p-6 space-y-6", isRTL ? "font-['Cairo']" : "font-sans")} dir={isRTL ? "rtl" : "ltr"}>
      {/* View Toggle */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => setView('products')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            view === 'products' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Package size={18} />
          <span>{isRTL ? 'المنتجات' : 'Products'}</span>
        </button>
        <button 
          onClick={() => setView('history')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            view === 'history' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <History size={18} />
          <span>{isRTL ? 'سجل التعديلات' : 'Adjustment History'}</span>
        </button>
      </div>

      {view === 'products' ? (
        <>
          {/* Persistent Low Stock Notification */}
      <AnimatePresence>
        {lowStockProducts.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-rose-600 text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-lg shadow-rose-100">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm">
                    {isRTL 
                      ? `تنبيه: هناك ${lowStockProducts.length} منتجات منخفضة المخزون!` 
                      : `Alert: ${lowStockProducts.length} products are low on stock!`}
                  </p>
                  <p className="text-xs text-white/80">
                    {isRTL 
                      ? 'يرجى مراجعة المخزون وإعادة الطلب لتجنب النقص.' 
                      : 'Please review inventory and reorder to avoid stockouts.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSearchTerm('')} 
                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all"
              >
                {isRTL ? 'عرض الكل' : 'View All'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder={isRTL ? 'البحث عن منتج...' : 'Search products...'}
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
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setAdjustmentForm({ productId: null, type: 'add', quantity: '', reason: '' });
              setShowAdjustmentModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
          >
            <History size={18} />
            <span>{isRTL ? 'تعديل المخزون' : 'Stock Adjustment'}</span>
          </button>
          <button 
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
          >
            <Filter size={18} />
            <span>{isRTL ? 'إدارة التصنيفات' : 'Manage Categories'}</span>
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
          >
            <Download size={18} />
            <span>{isRTL ? 'تصدير' : 'Export'}</span>
          </button>
          <button 
            onClick={() => {
              setModalMode('add');
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <Plus size={18} />
            <span>{isRTL ? 'إضافة منتج' : 'Add Product'}</span>
          </button>
        </div>
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
            <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 shadow-sm">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'التصنيف' : 'Category'}</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                >
                  <option value="all">{isRTL ? 'جميع التصنيفات' : 'All Categories'}</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'الموقع' : 'Location'}</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                >
                  <option value="all">{isRTL ? 'جميع المواقع' : 'All Locations'}</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'وحدة القياس' : 'Unit'}</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={filters.unit}
                  onChange={(e) => setFilters({...filters, unit: e.target.value})}
                >
                  <option value="all">{isRTL ? 'جميع الوحدات' : 'All Units'}</option>
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'مستوى المخزون' : 'Stock Level'}</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={filters.stockLevel}
                  onChange={(e) => setFilters({...filters, stockLevel: e.target.value})}
                >
                  <option value="all">{isRTL ? 'الكل' : 'All'}</option>
                  <option value="low">{isRTL ? 'مخزون منخفض' : 'Low Stock'}</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={cn(
          "p-4 rounded-2xl flex items-center gap-4 border transition-all",
          lowStockProducts.length > 0 
            ? "bg-rose-50 border-rose-100 text-rose-900" 
            : "bg-emerald-50 border-emerald-100 text-emerald-900"
        )}>
          <div className={cn(
            "p-2 rounded-lg",
            lowStockProducts.length > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
          )}>
            {lowStockProducts.length > 0 ? <AlertTriangle size={20} /> : <Package size={20} />}
          </div>
          <div>
            <p className="text-sm font-bold">
              {isRTL ? 'حالة المخزون' : 'Stock Status'}
            </p>
            <p className={cn(
              "text-xs",
              lowStockProducts.length > 0 ? "text-rose-700" : "text-emerald-700"
            )}>
              {isRTL 
                ? (lowStockProducts.length > 0 
                    ? `هناك ${lowStockProducts.length} منتجات وصلت للحد الأدنى` 
                    : 'جميع المنتجات متوفرة بكميات جيدة')
                : (lowStockProducts.length > 0 
                    ? `${lowStockProducts.length} products are below minimum level` 
                    : 'All products are well stocked')}
            </p>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'المنتج' : 'Product'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'التصنيف' : 'Category'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'السعر' : 'Price'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'التكلفة' : 'Cost'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'المخزون' : 'Stock'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'الوحدة' : 'Unit'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'الموقع' : 'Location'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'الباركود' : 'Barcode'}</th>
                <th className="px-6 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    className={cn(
                      "hover:bg-slate-50 transition-colors group",
                      product.stock <= product.minStock && "bg-rose-50/30"
                    )}
                  >
                    <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                        <img 
                          src={product.image || 'https://picsum.photos/seed/product/200/200'} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{product.name}</span>
                        <span className="text-xs text-slate-400 font-mono">{product.sku}</span>
                      </div>
                    </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : product.currency === 'SAR' ? 'ر.س' : product.currency === 'EGP' ? 'ج.م' : product.currency === 'IQD' ? 'د.ع' : ''}
                      {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : product.currency === 'SAR' ? 'ر.س' : product.currency === 'EGP' ? 'ج.م' : product.currency === 'IQD' ? 'د.ع' : ''}
                      {product.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-bold",
                          product.stock <= product.minStock ? "text-rose-600" : "text-slate-700"
                        )}>
                          {product.stock}
                        </span>
                        {product.stock <= product.minStock && (
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {product.unit || 'pieces'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        {product.location || (isRTL ? 'المخزن الرئيسي' : 'Main Warehouse')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Barcode size={16} className="text-slate-400" />
                        <span className="text-xs font-mono text-slate-600">{product.barcode || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setAdjustmentForm({ ...adjustmentForm, productId: product.id });
                            setShowAdjustmentModal(true);
                          }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title={isRTL ? 'تعديل المخزون' : 'Adjust Stock'}
                        >
                          <Package size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            setDamagedForm({ ...damagedForm, productId: String(product.id) });
                            setShowDamagedModal(true);
                          }}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title={isRTL ? 'تبليغ عن تلف/فقد' : 'Report Damaged/Lost'}
                        >
                          <AlertTriangle size={18} />
                        </button>
                        <button 
                          onClick={() => handleEditClick(product)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={48} strokeWidth={1} className="opacity-20" />
                      <p>{isRTL ? 'لم يتم العثور على منتجات' : 'No products found'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">
              {isRTL ? 'سجل تعديلات المخزون' : 'Stock Adjustment History'}
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'التاريخ' : 'Date'}</th>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'المنتج' : 'Product'}</th>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'النوع' : 'Type'}</th>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'الكمية' : 'Qty'}</th>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'السبب' : 'Reason'}</th>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'قبل/بعد' : 'Before/After'}</th>
                    <th className="px-6 py-4 font-semibold">{isRTL ? 'المستخدم' : 'User'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockAdjustments.length > 0 ? (
                    stockAdjustments.map((adj) => (
                      <tr key={adj.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(adj.date).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-800 text-sm">{adj.productName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                            adj.type === 'add' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          )}>
                            {isRTL ? (adj.type === 'add' ? 'إضافة' : 'سحب') : adj.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {adj.type === 'add' ? '+' : '-'}{adj.quantity}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                            {adj.reason}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {adj.previousStock} → {adj.newStock}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {adj.userId === user.uid ? (isRTL ? 'أنا' : 'Me') : adj.userId.substring(0, 8)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <History size={48} strokeWidth={1} className="opacity-20" />
                          <p>{isRTL ? 'لا توجد تعديلات مسجلة' : 'No adjustments recorded yet'}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
                <div className="flex items-center gap-2">
                  <Package size={24} />
                  <h2 className="text-xl font-bold">
                    {modalMode === 'add' 
                      ? (isRTL ? 'إضافة منتج جديد' : 'Add New Product')
                      : (isRTL ? 'تعديل المنتج' : 'Edit Product')}
                  </h2>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="p-8">
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  {/* Image Upload Section */}
                  <div className="w-full md:w-48 space-y-4">
                    <label className="text-sm font-semibold text-slate-700 block text-center">
                      {isRTL ? 'صورة المنتج' : 'Product Image'}
                    </label>
                    <div className="relative group aspect-square">
                      <div className="w-full h-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex flex-col items-center justify-center text-slate-400 group-hover:border-indigo-400 group-hover:bg-indigo-50 transition-all">
                        {isGeneratingImage ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-bold text-indigo-600">{isRTL ? 'جاري التوليد...' : 'Generating...'}</span>
                          </div>
                        ) : productForm.image ? (
                          <img 
                            src={productForm.image} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <>
                            <Camera size={32} strokeWidth={1.5} className="mb-2" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{isRTL ? 'رفع صورة' : 'Upload'}</span>
                          </>
                        )}
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {productForm.image && (
                        <button 
                          type="button"
                          onClick={() => setProductForm({ ...productForm, image: '' })}
                          className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                      {isRTL ? 'يدعم JPG, PNG. الحد الأقصى 2 ميجا' : 'Supports JPG, PNG. Max 2MB'}
                    </p>
                  </div>

                  {/* Form Fields Section */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{isRTL ? 'اسم المنتج' : 'Product Name'}</label>
                      <input 
                        required
                        type="text"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{isRTL ? 'وحدة حفظ المخزون (SKU)' : 'SKU'}</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={productForm.sku}
                        onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{isRTL ? 'الباركود' : 'Barcode'}</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Barcode className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text"
                            className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={productForm.barcode}
                            onChange={(e) => setProductForm({...productForm, barcode: e.target.value})}
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={startScanner}
                          className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                          title={isRTL ? 'مسح الباركود' : 'Scan Barcode'}
                        >
                          <Camera size={20} />
                        </button>
                        <button 
                          type="button"
                          onClick={generateBarcode}
                          className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                          title={isRTL ? 'توليد باركود' : 'Generate Barcode'}
                        >
                          <Sparkles size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{isRTL ? 'التصنيف' : 'Category'}</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={productForm.category}
                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      >
                        <option value="">{isRTL ? 'اختر التصنيف' : 'Select Category'}</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{isRTL ? 'العملة' : 'Currency'}</label>
                      <select 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={productForm.currency}
                        onChange={(e) => setProductForm({...productForm, currency: e.target.value})}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="SAR">SAR (ر.س)</option>
                        <option value="EGP">EGP (ج.م)</option>
                        <option value="IQD">IQD (د.ع)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{isRTL ? 'وحدة القياس' : 'Unit'}</label>
                      <select 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={productForm.unit}
                        onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
                      >
                        <option value="pieces">{isRTL ? 'قطعة' : 'pieces'}</option>
                        <option value="kg">{isRTL ? 'كيلوجرام' : 'kg'}</option>
                        <option value="ltr">{isRTL ? 'لتر' : 'ltr'}</option>
                        <option value="box">{isRTL ? 'صندوق' : 'box'}</option>
                        <option value="set">{isRTL ? 'طقم' : 'set'}</option>
                        <option value="m">{isRTL ? 'متر' : 'm'}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{isRTL ? 'سعر البيع' : 'Sale Price'}</label>
                      <input 
                        required
                        type="number"
                        step="0.01"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={productForm.price}
                        onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{isRTL ? 'التكلفة' : 'Cost'}</label>
                      <input 
                        type="number"
                        step="0.01"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={productForm.cost}
                        onChange={(e) => setProductForm({...productForm, cost: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{isRTL ? 'الموقع' : 'Location'}</label>
                      <select 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={productForm.location}
                        onChange={(e) => setProductForm({...productForm, location: e.target.value})}
                      >
                        <option value="Main Warehouse">{isRTL ? 'المخزن الرئيسي' : 'Main Warehouse'}</option>
                        <option value="Showroom">{isRTL ? 'صالة العرض' : 'Showroom'}</option>
                        <option value="Secondary Warehouse">{isRTL ? 'المخزن الفرعي' : 'Secondary Warehouse'}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{isRTL ? 'الكمية المتوفرة' : 'Initial Stock'}</label>
                      <input 
                        required
                        type="number"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{isRTL ? 'الحد الأدنى للمخزون' : 'Min Stock Level'}</label>
                      <input 
                        type="number"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={productForm.minStock}
                        onChange={(e) => setProductForm({...productForm, minStock: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    {isRTL ? 'حفظ' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">{isRTL ? 'مسح الباركود' : 'Scan Barcode'}</h3>
                <button onClick={stopScanner} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <div id="reader" className="w-full rounded-2xl overflow-hidden"></div>
                <p className="text-center text-xs text-slate-500 mt-4">
                  {isRTL ? 'وجه الكاميرا نحو الباركود للمسح' : 'Point camera at barcode to scan'}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stock Adjustment Modal */}
      <AnimatePresence>
        {showAdjustmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
                <h3 className="text-xl font-bold">{isRTL ? 'تعديل المخزون' : 'Adjust Stock'}</h3>
                <button onClick={() => setShowAdjustmentModal(false)} className="text-white/80 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAdjustmentSubmit} className="p-6 space-y-4">
                {adjustmentForm.productId === null && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{isRTL ? 'اختر المنتج' : 'Select Product'}</label>
                    <select 
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={adjustmentForm.productId || ''}
                      onChange={(e) => setAdjustmentForm({...adjustmentForm, productId: parseInt(e.target.value)})}
                    >
                      <option value="">{isRTL ? 'اختر منتجاً...' : 'Select a product...'}</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setAdjustmentForm({...adjustmentForm, type: 'add'})}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                      adjustmentForm.type === 'add' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    {isRTL ? 'إضافة' : 'Add'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAdjustmentForm({...adjustmentForm, type: 'remove'})}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                      adjustmentForm.type === 'remove' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    {isRTL ? 'سحب' : 'Remove'}
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">{isRTL ? 'الكمية' : 'Quantity'}</label>
                  <input 
                    required
                    type="number"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={adjustmentForm.quantity}
                    onChange={(e) => setAdjustmentForm({...adjustmentForm, quantity: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">{isRTL ? 'السبب' : 'Reason'}</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm({...adjustmentForm, reason: e.target.value})}
                  >
                    <option value="">{isRTL ? 'اختر السبب...' : 'Select reason...'}</option>
                    <option value="Restock">{isRTL ? 'إعادة تعبئة' : 'Restock'}</option>
                    <option value="Return">{isRTL ? 'إرجاع' : 'Return'}</option>
                    <option value="Damage">{isRTL ? 'تلف' : 'Damage'}</option>
                    <option value="Correction">{isRTL ? 'تصحيح مخزون' : 'Correction'}</option>
                  </select>
                </div>

                {adjustmentForm.productId && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{isRTL ? 'المخزون الحالي' : 'Current Stock'}</span>
                      <span className="text-lg font-bold text-slate-700">
                        {products.find(p => p.id === adjustmentForm.productId)?.stock || 0}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{isRTL ? 'المخزون الجديد' : 'New Stock'}</span>
                      <span className={cn(
                        "text-lg font-bold",
                        adjustmentForm.type === 'add' ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {Math.max(0, (products.find(p => p.id === adjustmentForm.productId)?.stock || 0) + ((parseInt(adjustmentForm.quantity) || 0) * (adjustmentForm.type === 'add' ? 1 : -1)))}
                      </span>
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all mt-4"
                >
                  {isRTL ? 'تأكيد التعديل' : 'Confirm Adjustment'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Damaged/Lost Item Modal */}
      <AnimatePresence>
        {showDamagedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-600 text-white">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={24} />
                  <h3 className="text-xl font-bold">{isRTL ? 'تبليغ عن تلف أو فقد' : 'Report Damaged/Lost'}</h3>
                </div>
                <button onClick={() => setShowDamagedModal(false)} className="text-white/80 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleDamagedSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">{isRTL ? 'الكمية' : 'Quantity'}</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                    value={damagedForm.quantity}
                    onChange={(e) => setDamagedForm({...damagedForm, quantity: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">{isRTL ? 'السبب' : 'Reason'}</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                    value={damagedForm.reason}
                    onChange={(e) => setDamagedForm({...damagedForm, reason: e.target.value as any})}
                  >
                    <option value="Damaged">{isRTL ? 'تلف' : 'Damaged'}</option>
                    <option value="Lost">{isRTL ? 'فقدان' : 'Lost'}</option>
                    <option value="Expired">{isRTL ? 'منتهي الصلاحية' : 'Expired'}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">{isRTL ? 'الموقع' : 'Location'}</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                    value={damagedForm.location}
                    onChange={(e) => setDamagedForm({...damagedForm, location: e.target.value})}
                  >
                    <option value="Main Warehouse">{isRTL ? 'المخزن الرئيسي' : 'Main Warehouse'}</option>
                    <option value="Showroom">{isRTL ? 'صالة العرض' : 'Showroom'}</option>
                    <option value="Secondary Warehouse">{isRTL ? 'المخزن الفرعي' : 'Secondary Warehouse'}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">{isRTL ? 'ملاحظات إضافية' : 'Additional Notes'}</label>
                  <textarea 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all h-24 resize-none"
                    placeholder={isRTL ? 'تفاصيل عن الحادثة...' : 'Details about the incident...'}
                    value={damagedForm.notes}
                    onChange={(e) => setDamagedForm({...damagedForm, notes: e.target.value})}
                  />
                </div>

                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <div className="flex justify-between items-center text-rose-700">
                    <span className="text-xs font-bold uppercase">{isRTL ? 'تأثير المخزون' : 'Stock Impact'}</span>
                    <span className="text-lg font-bold">-{damagedForm.quantity || 0}</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-rose-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all mt-4 flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={18} />
                  <span>{isRTL ? 'تسجيل كـ تالف/مفقود' : 'Record as Damaged/Lost'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Management Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
                <h3 className="text-xl font-bold">{isRTL ? 'إدارة التصنيفات' : 'Manage Categories'}</h3>
                <button onClick={() => setShowCategoryModal(false)} className="text-white/80 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <form onSubmit={handleCategorySubmit} className="flex gap-2">
                  <input 
                    type="text"
                    placeholder={isRTL ? 'اسم التصنيف الجديد...' : 'New category name...'}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  />
                  <button 
                    type="submit"
                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                  >
                    {categoryForm.id ? <Edit size={20} /> : <Plus size={20} />}
                  </button>
                </form>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {managedCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                      <span className="font-medium text-slate-700">{cat.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setCategoryForm({ id: cat.id, name: cat.name })}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {managedCategories.length === 0 && (
                    <p className="text-center text-slate-400 py-8 text-sm">
                      {isRTL ? 'لا توجد تصنيفات مضافة' : 'No categories added yet'}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
