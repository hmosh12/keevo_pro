import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Camera,
  Save,
  Bell,
  Lock,
  User,
  Truck,
  Plus,
  X,
  Upload,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Trash2,
  Smartphone,
  Banknote,
  Coins,
  Settings as SettingsIcon,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { api } from '../api';

export default function Settings({ 
  isRTL, 
  companyInfo, 
  setCompanyInfo,
  user,
  staff,
  refreshData
}: { 
  isRTL: boolean, 
  companyInfo: any, 
  setCompanyInfo: (info: any) => void,
  user: any,
  staff: any[],
  refreshData: () => void
}) {
  const [activeSection, setActiveSection] = useState('company');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    email: '',
    password: '',
    role: 'cashier',
    displayName: ''
  });
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [localInfo, setLocalInfo] = useState({
    name: companyInfo?.name || '',
    deliveryNumber: companyInfo?.deliveryNumber || '',
    address: companyInfo?.address || '',
    email: companyInfo?.email || '',
    website: companyInfo?.website || '',
    logo: companyInfo?.logo || ''
  });
  const [localUser, setLocalUser] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    bio: user?.bio || '',
    photoURL: user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=random`
  });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userPhotoInputRef = useRef<HTMLInputElement>(null);

  // Sync local info when prop updates
  React.useEffect(() => {
    if (companyInfo) {
      setLocalInfo({
        name: companyInfo.name || '',
        deliveryNumber: companyInfo.deliveryNumber || '',
        address: companyInfo.address || '',
        email: companyInfo.email || '',
        website: companyInfo.website || '',
        logo: companyInfo.logo || ''
      });
    }
  }, [companyInfo]);

  // Sync local user profile when prop updates
  React.useEffect(() => {
    if (user) {
      setLocalUser({
        displayName: user.displayName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        bio: user.bio || '',
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=random`
      });
    }
  }, [user]);

  const sections = [
    { id: 'company', label: isRTL ? 'بيانات الشركة' : 'Company Info', icon: Building2 },
    { id: 'profile', label: isRTL ? 'الملف الشخصي' : 'Profile', icon: User },
    { id: 'notifications', label: isRTL ? 'الإشعارات' : 'Notifications', icon: Bell },
    { id: 'security', label: isRTL ? 'الأمان' : 'Security', icon: Lock },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeSection === 'company') {
        if (user?.companyId) {
          await api.company.update(user.companyId, localInfo);
          setCompanyInfo(localInfo);
        }
      } else if (activeSection === 'profile') {
        if (user?.uid) {
          await api.users.update(user.uid, {
            displayName: localUser.displayName,
            phoneNumber: localUser.phoneNumber,
            bio: localUser.bio,
            photoURL: localUser.photoURL
          });
        }
      }
      refreshData();
      alert(isRTL ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert(isRTL ? 'حدث خطأ أثناء حفظ التغييرات' : 'Error saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalInfo({ ...localInfo, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalUser({ ...localUser, photoURL: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;
    
    setIsAddingStaff(true);
    try {
      const data = await api.staff.create({
        ...newStaff,
        companyId: user.companyId
      });

      setShowAddStaffModal(false);
      setNewStaff({ email: '', password: '', role: 'cashier', displayName: '' });
      alert(isRTL ? 'تم إضافة الموظف بنجاح' : 'Staff added successfully');
    } catch (error: any) {
      console.error("Error adding staff:", error);
      alert(error.message || (isRTL ? 'حدث خطأ أثناء إضافة الموظف' : 'Error adding staff'));
    } finally {
      setIsAddingStaff(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <div className="w-full md:w-64 space-y-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "flex items-center gap-3 w-full p-4 rounded-2xl transition-all",
              activeSection === section.id 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
            )}
          >
            <section.icon size={20} />
            <span className="font-bold">{section.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {activeSection === 'company' && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-slate-800">{isRTL ? 'إعدادات النظام والشركة' : 'System & Company Settings'}</h3>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    <span>{isRTL ? 'حفظ التغييرات' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-8">
              {/* Branding Header */}
              <div className="p-6 bg-indigo-50 rounded-[32px] border border-indigo-100 flex flex-col md:flex-row items-center gap-8">
                <div className="relative group">
                  <div className="w-32 h-32 bg-white rounded-[32px] shadow-xl border-4 border-white overflow-hidden group-hover:shadow-2xl transition-all duration-300">
                    {localInfo.logo ? (
                      <img 
                        src={localInfo.logo} 
                        alt="Logo" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-5xl font-black">
                        {localInfo.name?.charAt(0) || 'K'}
                      </div>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <Camera size={32} />
                    </button>
                  </div>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                </div>
                
                <div className="flex-1 space-y-4 text-center md:text-left rtl:md:text-right w-full">
                  <div>
                    <label className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{isRTL ? 'شعار النظام' : 'SYSTEM LOGO'}</label>
                    <h4 className="text-xl font-black text-slate-800 mt-1">{localInfo.name || 'KEEVO ERP'}</h4>
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <Upload size={16} />
                      {isRTL ? 'تحميل شعار جديد' : 'Upload New Logo'}
                    </button>
                    {localInfo.logo && (
                      <button 
                        onClick={() => setLocalInfo({...localInfo, logo: ''})}
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={16} className="text-rose-500" />
                        {isRTL ? 'إزالة الشعار' : 'Remove Logo'}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    {isRTL 
                      ? '* يفضل استخدام شعار بخلفية شفافة وتصميم مربع للحصول على أفضل النتائج.' 
                      : '* Preferred: Square image with transparent background for best results.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{isRTL ? 'اسم النظام / الشركة' : 'System / Company Name'}</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                      value={localInfo.name}
                      onChange={(e) => setLocalInfo({...localInfo, name: e.target.value})}
                      placeholder={isRTL ? 'أدخل اسم النظام' : 'Enter System Name'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{isRTL ? 'رقم التوصيل / التواصل' : 'Delivery / Contact Number'}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={localInfo.deliveryNumber}
                      onChange={(e) => setLocalInfo({...localInfo, deliveryNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">{isRTL ? 'عنوان الشركة' : 'Company Address'}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={localInfo.address}
                      onChange={(e) => setLocalInfo({...localInfo, address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{isRTL ? 'البريد الإلكتروني' : 'Email Address'}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email"
                      className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={localInfo.email}
                      onChange={(e) => setLocalInfo({...localInfo, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{isRTL ? 'الموقع الإلكتروني' : 'Website'}</label>
                  <div className="relative">
                    <Globe className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={localInfo.website}
                      onChange={(e) => setLocalInfo({...localInfo, website: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'profile' && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">{isRTL ? 'الملف الشخصي' : 'Personal Profile'}</h3>
                <p className="text-slate-500 text-sm mt-1">
                  {isRTL ? 'إدارة بياناتك الشخصية وصورتك' : 'Manage your personal details and photo'}
                </p>
              </div>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    <span>{isRTL ? 'حفظ التغييرات' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-8">
              {/* Profile Photo */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="relative group">
                  <img 
                    src={localUser.photoURL} 
                    alt="Profile" 
                    className="w-28 h-28 rounded-3xl object-cover border-4 border-white shadow-md"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => userPhotoInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 text-white rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Camera size={28} />
                  </button>
                  <input 
                    type="file"
                    ref={userPhotoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleUserPhotoChange}
                  />
                </div>
                <div className="text-center sm:text-left rtl:sm:text-right">
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold text-xl text-slate-800 mb-0 leading-tight">{localUser.displayName || (isRTL ? 'مستخدم' : 'User')}</h4>
                    <p className="text-slate-500 mb-2">{localUser.email}</p>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => userPhotoInputRef.current?.click()}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-indigo-600 hover:bg-slate-50 transition-colors flex items-center gap-2 mx-auto sm:mx-0"
                      >
                        <Upload size={16} />
                        <span>{isRTL ? 'تغيير الصورة' : 'Change Photo'}</span>
                      </button>
                      <button 
                        onClick={() => {
                          setLocalUser({ ...localUser, photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(localUser.displayName || 'U')}&background=random` });
                        }}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-2 mx-auto sm:mx-0"
                      >
                        <X size={16} />
                        <span>{isRTL ? 'حذف' : 'Remove'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{isRTL ? 'الاسم الكامل' : 'Full Name'}</label>
                  <div className="relative">
                    <User className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                      value={localUser.displayName}
                      onChange={(e) => setLocalUser({...localUser, displayName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="tel"
                      className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-left rtl:text-right"
                      dir="ltr"
                      value={localUser.phoneNumber}
                      onChange={(e) => setLocalUser({...localUser, phoneNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">{isRTL ? 'البريد الإلكتروني (لا يمكن تعديله)' : 'Email (Read-only)'}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email"
                      readOnly
                      disabled
                      className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium"
                      value={localUser.email}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">{isRTL ? 'نبذة تعريفية' : 'Bio'}</label>
                  <div className="relative">
                    <FileText className="absolute left-3 rtl:right-3 rtl:left-auto top-3 text-slate-400" size={18} />
                    <textarea 
                      rows={4}
                      className="w-full pl-10 rtl:pr-10 rtl:pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium resize-none"
                      value={localUser.bio}
                      onChange={(e) => setLocalUser({...localUser, bio: e.target.value})}
                      placeholder={isRTL ? 'أخبرنا المزيد عنك...' : 'Tell us something about yourself...'}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'security' && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">{isRTL ? 'إدارة الموظفين' : 'Staff Management'}</h3>
                <p className="text-slate-500 text-sm mt-1">
                  {isRTL ? 'إدارة حسابات الموظفين وصلاحياتهم' : 'Manage staff accounts and permissions'}
                </p>
              </div>
              <button 
                onClick={() => setShowAddStaffModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                <Plus size={18} />
                <span>{isRTL ? 'إضافة موظف' : 'Add Staff'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {staff.map((member) => (
                <div key={member.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-xl">
                      {member.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{member.displayName}</h4>
                      <p className="text-sm text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase",
                      member.role === 'admin' ? "bg-rose-100 text-rose-600" : 
                      member.role === 'accountant' ? "bg-amber-100 text-amber-600" : 
                      "bg-emerald-100 text-emerald-600"
                    )}>
                      {isRTL ? (
                        member.role === 'admin' ? 'مدير' : 
                        member.role === 'accountant' ? 'محاسب' : 'كاشير'
                      ) : member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Staff Modal */}
        <AnimatePresence>
          {showAddStaffModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
                  <h3 className="text-xl font-bold">{isRTL ? 'إضافة موظف جديد' : 'Add New Staff'}</h3>
                  <button onClick={() => setShowAddStaffModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleAddStaff} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">{isRTL ? 'الاسم' : 'Name'}</label>
                    <input 
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={newStaff.displayName}
                      onChange={(e) => setNewStaff({...newStaff, displayName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">{isRTL ? 'البريد الإلكتروني' : 'Email'}</label>
                    <input 
                      required
                      type="email"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">{isRTL ? 'كلمة المرور' : 'Password'}</label>
                    <input 
                      required
                      type="password"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={newStaff.password}
                      onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">{isRTL ? 'الصلاحية' : 'Role'}</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={newStaff.role}
                      onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                    >
                      <option value="cashier">{isRTL ? 'كاشير' : 'Cashier'}</option>
                      <option value="accountant">{isRTL ? 'محاسب' : 'Accountant'}</option>
                      <option value="admin">{isRTL ? 'مدير' : 'Admin'}</option>
                    </select>
                  </div>

                  <button 
                    disabled={isAddingStaff}
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    {isAddingStaff ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus size={20} />
                        <span>{isRTL ? 'إضافة الموظف' : 'Add Staff'}</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {activeSection !== 'company' && activeSection !== 'security' && activeSection !== 'profile' && (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <SettingsIcon size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{isRTL ? 'قيد التطوير' : 'Under Development'}</h3>
            <p className="text-slate-500">{isRTL ? 'هذا القسم سيكون متاحاً قريباً.' : 'This section will be available soon.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
