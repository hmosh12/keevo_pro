import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Receipt, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  ChevronLeft,
  Globe,
  Wallet,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
  collapsed?: boolean;
  key?: string | number;
}

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full p-3 my-1 rounded-lg transition-all duration-200 group",
      active 
        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
        : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
    )}
  >
    <Icon size={20} className={cn(collapsed ? "mx-auto" : "mr-3 rtl:ml-3 rtl:mr-0")} />
    {!collapsed && <span className="font-medium">{label}</span>}
    {active && !collapsed && (
      <motion.div 
        layoutId="active-pill"
        className="ml-auto rtl:mr-auto rtl:ml-0 w-1.5 h-1.5 rounded-full bg-white"
      />
    )}
  </button>
);

export default function Layout({ 
  children, 
  activeTab, 
  setActiveTab,
  isRTL,
  setIsRTL,
  user,
  companyInfo,
  logout
}: { 
  children: React.ReactNode; 
  activeTab: string; 
  setActiveTab: (tab: string) => void;
  isRTL: boolean;
  setIsRTL: (rtl: boolean) => void;
  user: any;
  companyInfo?: any;
  logout: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: isRTL ? 'لوحة التحكم' : 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: isRTL ? 'المخازن' : 'Inventory', icon: Package },
    { id: 'pos', label: isRTL ? 'نقطة البيع' : 'POS', icon: ShoppingCart },
    { id: 'returns', label: isRTL ? 'المردودات' : 'Returns', icon: RotateCcw },
    { id: 'damaged', label: isRTL ? 'التوالف' : 'Damaged', icon: Trash2 },
    { id: 'expenses', label: isRTL ? 'المصروفات' : 'Expenses', icon: Wallet },
    { id: 'accounting', label: isRTL ? 'المحاسبة' : 'Accounting', icon: Receipt },
    { id: 'contacts', label: isRTL ? 'العملاء والموردين' : 'Contacts', icon: Users },
    { id: 'settings', label: isRTL ? 'الإعدادات' : 'Settings', icon: Settings },
  ];

  return (
    <div className={cn("flex h-screen bg-slate-50", isRTL ? "font-['Cairo']" : "font-sans")} dir={isRTL ? "rtl" : "ltr"}>
      {/* Sidebar for Desktop */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-white border-r rtl:border-l rtl:border-r-0 border-slate-200 transition-all duration-300 z-20 no-print",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className={cn("p-6 flex items-center justify-between", collapsed && "flex-col gap-4")}>
          {!collapsed ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 overflow-hidden"
            >
              {companyInfo?.logo ? (
                <img 
                  src={companyInfo.logo} 
                  alt="Logo" 
                  className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-indigo-100 ring-4 ring-indigo-50">
                  <span className="text-lg">K</span>
                </div>
              )}
              <div className="flex flex-col truncate">
                <span className="text-lg font-bold text-slate-800 leading-tight truncate">
                  {companyInfo?.name || 'Keevo'}
                </span>
                <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest leading-none mt-1">
                  ERP SYSTEM
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-indigo-100 cursor-pointer ring-2 ring-indigo-50" onClick={() => setCollapsed(false)}>
              {companyInfo?.logo ? (
                <img 
                  src={companyInfo.logo} 
                  alt="Logo" 
                  className="w-full h-full rounded-xl object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                'K'
              )}
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
          >
            {collapsed ? (isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />) : (isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />)}
          </button>
        </div>

        <nav className="flex-1 px-4 overflow-y-auto">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => setIsRTL(!isRTL)}
            className="flex items-center w-full p-3 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Globe size={20} className={cn(collapsed ? "mx-auto" : "mr-3 rtl:ml-3 rtl:mr-0")} />
            {!collapsed && <span className="font-medium">{isRTL ? 'English' : 'العربية'}</span>}
          </button>
          <button 
            onClick={logout}
            className="flex items-center w-full p-3 mt-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} className={cn(collapsed ? "mx-auto" : "mr-3 rtl:ml-3 rtl:mr-0")} />
            {!collapsed && <span className="font-medium">{isRTL ? 'تسجيل الخروج' : 'Logout'}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30 no-print">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">K</div>
          <span className="text-xl font-bold text-slate-800">Keevo</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-slate-600">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: isRTL ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "fixed top-0 bottom-0 w-72 bg-white z-50 md:hidden flex flex-col shadow-2xl",
                isRTL ? "right-0" : "left-0"
              )}
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {companyInfo?.logo ? (
                    <img 
                      src={companyInfo.logo} 
                      alt="Logo" 
                      className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">
                      K
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-slate-800 leading-none">KEEVO</span>
                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-1">ERP SYSTEM</span>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-2 text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 p-4">
                {menuItems.map((item) => (
                  <SidebarItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={activeTab === item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileOpen(false);
                    }}
                  />
                ))}
              </nav>
              <div className="p-4 border-t border-slate-100">
                <button 
                  onClick={() => setIsRTL(!isRTL)}
                  className="flex items-center w-full p-3 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Globe size={20} className="mr-3 rtl:ml-3 rtl:mr-0" />
                  <span className="font-medium">{isRTL ? 'English' : 'العربية'}</span>
                </button>
                <button className="flex items-center w-full p-3 mt-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <LogOut size={20} className="mr-3 rtl:ml-3 rtl:mr-0" />
                  <span className="font-medium">{isRTL ? 'تسجيل الخروج' : 'Logout'}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0">
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 no-print">
          <h2 className="text-lg font-semibold text-slate-700">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end rtl:items-start">
              <span className="text-sm font-semibold text-slate-800">{user?.displayName || 'Admin'}</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">{user?.role || 'Administrator'}</span>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="User" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold uppercase">
                  {user?.displayName?.charAt(0) || 'A'}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
