import React from 'react';
import { 
  ShieldCheck, 
  BarChart3, 
  Zap, 
  Globe, 
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  ShoppingCart,
  Users,
  Wallet,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface LandingPageProps {
  isRTL: boolean;
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({ isRTL, onGetStarted, onLogin }: LandingPageProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  const features = [
    { 
      icon: LayoutDashboard, 
      title: isRTL ? 'لوحة تحكم ذكية' : 'Smart Dashboard',
      description: isRTL ? 'راقب أداء عملك لحظة بلحظة مع تحليلات ذكية ورسوم بيانية تفاعلية.' : 'Monitor your business performance in real-time with smart analytics and interactive charts.'
    },
    { 
      icon: ShoppingCart, 
      title: isRTL ? 'نقطة بيع سحابية' : 'Cloud POS',
      description: isRTL ? 'نظام مبيعات سريع، مرن، ويدعم العمل بدون إنترنت مع مزامنة فورية.' : 'Fast, flexible sales system supporting offline work with instant synchronization.'
    },
    { 
      icon: Wallet, 
      title: isRTL ? 'إدارة مالية دقيقة' : 'Precise Accounting',
      description: isRTL ? 'نظام محاسبي متكامل يغطي المصروفات، المردودات، والتقارير المالية بكبسة زر.' : 'Integrated accounting covering expenses, returns, and financial reports at a click.'
    },
    { 
      icon: Users, 
      title: isRTL ? 'إدارة العملاء' : 'Customer CRM',
      description: isRTL ? 'بناء علاقات طويلة الأمد مع عملائك وتتبع تاريخ مشترياتهم وتفضيلاتهم.' : 'Build long-term relationships with customers, track their purchase history and preferences.'
    }
  ];

  return (
    <div className={cn(
      "min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden",
      isRTL ? "font-['Cairo']" : "font-sans"
    )} dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20">
              K
            </div>
            <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              KEEVO
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">{isRTL ? 'المميزات' : 'Features'}</a>
            <a href="#about" className="hover:text-white transition-colors">{isRTL ? 'عن النظام' : 'About'}</a>
            <button 
              onClick={onLogin}
              className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
            >
              {isRTL ? 'تسجيل الدخول' : 'Sign In'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full -z-10 opacity-30" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-sky-600/10 blur-[100px] rounded-full -z-10 opacity-20" />

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-black tracking-widest uppercase"
          >
            <Sparkles size={14} />
            {isRTL ? 'المستقبل في إدارة الأعمال' : 'THE FUTURE OF BUSINESS MANAGEMENT'}
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight text-white"
          >
            {isRTL ? (
              <>أدِر تجارتك بذكاء وفخامة مع <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">KEEVO</span></>
            ) : (
              <>Manage Your Business with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">Elegance</span></>
            )}
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            {isRTL 
              ? 'النظام المحاسبي والـ ERP المتكامل الذي يجمع بين قوة الأداء وسهولة الاستخدام. حلول ذكية مصممة خصيصاً لنمو مشروعك.' 
              : 'The integrated ERP & accounting system that combines high performance with seamless usability. Smart solutions designed specifically for your growth.'}
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              <span>{isRTL ? 'ابدأ تجربتك المجانية' : 'Start Free Trial'}</span>
              <ArrowRight size={20} className={cn(isRTL && "rotate-180")} />
            </button>
            <button 
              onClick={onLogin}
              className="w-full sm:w-auto px-8 py-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all"
            >
              {isRTL ? 'مشاهدة عرض توضيحي' : 'Watch Demo'}
            </button>
          </motion.div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-6xl mx-auto mt-24 relative"
        >
          <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] -z-10 rounded-[40px]" />
          <div className="p-2 bg-white/5 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden aspect-video">
            <div className="w-full h-full bg-slate-900 rounded-[32px] overflow-hidden relative group">
              <img 
                src="https://picsum.photos/seed/keevodashboard/1200/800" 
                alt="Dashboard Preview" 
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center gap-4">
                    <Zap size={32} className="text-indigo-400 animate-pulse" />
                    <div className="text-left rtl:text-right">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isRTL ? 'نظام حي' : 'LIVE SYSTEM'}</p>
                       <p className="text-lg font-black text-white">{isRTL ? 'مزامنة سحابية فائقة السرعة' : 'Ultra-fast Cloud Sync'}</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-indigo-400 text-sm font-black tracking-widest uppercase">{isRTL ? 'الجيل القادم' : 'NEXT GENERATION'}</h2>
            <h3 className="text-4xl md:text-5xl font-black">{isRTL ? 'كل ما تحتاجه في مكان واحد' : 'Everything in One Place'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white/[0.02] border border-white/5 rounded-[40px] hover:bg-white/[0.05] transition-all hover:-translate-y-2 group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-sky-500/20 rounded-3xl flex items-center justify-center text-indigo-400 mb-8 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/5">
                  <feature.icon size={32} />
                </div>
                <h4 className="text-xl font-bold mb-4">{feature.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent to-white/5">
         <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { val: '99.9%', label: isRTL ? 'وقت التشغيل' : 'Uptime' },
              { val: '24/7', label: isRTL ? 'دعم فني' : 'Support' },
              { val: '+10k', label: isRTL ? 'مستخدم سعيد' : 'Happy Users' },
              { val: '256-bit', label: isRTL ? 'تشفير بيانات' : 'Encryption' }
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <p className="text-4xl md:text-5xl font-black text-white">{stat.val}</p>
                <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
         </div>
      </section>

      {/* Trust Quote */}
      <section id="about" className="py-32 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-600/5 blur-[120px] rounded-full -z-10" />
        <div className="max-w-5xl mx-auto text-center space-y-12">
           <ShieldCheck size={64} className="mx-auto text-indigo-500/50" />
           <blockquote className="text-3xl md:text-5xl font-black text-white italic leading-tight">
             {isRTL 
               ? '"نحن لا نبني مجرد نظام، نحن نبني العمود الفقري لنمو شركتك واستقرارها المالي."'
               : '"We don\'t just build a system, we build the backbone of your company\'s growth and financial stability."'}
           </blockquote>
           <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-0.5 bg-indigo-500" />
              <p className="font-black text-indigo-400 uppercase tracking-widest">{isRTL ? 'فريق تصميم KEEVO' : 'KEEVO DESIGN TEAM'}</p>
              <div className="w-12 h-0.5 bg-indigo-500" />
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto p-12 md:p-20 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[56px] text-center shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -mr-32 -mt-32 rounded-full" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 blur-[80px] -ml-32 -mb-32 rounded-full" />
           
           <h3 className="text-4xl md:text-6xl font-black text-white mb-8 relative z-10">
             {isRTL ? 'هل أنت مستعد للارتقاء؟' : 'Ready to Elevate?'}
           </h3>
           <p className="text-xl text-indigo-100 mb-12 font-medium opacity-80 relative z-10">
             {isRTL 
               ? 'انضم إلى نخبة الشركات التي اختارت الثقة والذكاء في العمل.' 
               : 'Join the elite companies that chose trust and intelligence in their operations.'}
           </p>
           <button 
             onClick={onGetStarted}
             className="relative z-10 px-12 py-5 bg-white text-indigo-600 rounded-2xl font-black text-xl hover:bg-slate-50 hover:-translate-y-1 transition-all shadow-xl"
           >
             {isRTL ? 'ابدأ كمدير الآن' : 'Start as Admin Now'}
           </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">K</div>
              <span className="text-xl font-black text-white tracking-tight">KEEVO</span>
           </div>
           <p className="text-slate-500 text-sm font-medium">
             &copy; {new Date().getFullYear()} KEEVO Technologies. {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved.'}
           </p>
           <div className="flex items-center gap-6">
              <button 
                onClick={() => isRTL ? window.location.href = '?lang=en' : window.location.href = '?lang=ar'}
                className="text-xs font-black text-slate-400 hover:text-white uppercase tracking-widest flex items-center gap-2"
              >
                <Globe size={14} />
                {isRTL ? 'English' : 'العربية'}
              </button>
           </div>
        </div>
      </footer>
    </div>
  );
}
