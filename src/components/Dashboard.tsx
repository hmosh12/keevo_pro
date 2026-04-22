import React from 'react';
import { cn } from '../lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign
} from 'lucide-react';
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

const data = [
  { name: 'Jan', sales: 4000, expenses: 2400 },
  { name: 'Feb', sales: 3000, expenses: 1398 },
  { name: 'Mar', sales: 2000, expenses: 9800 },
  { name: 'Apr', sales: 2780, expenses: 3908 },
  { name: 'May', sales: 1890, expenses: 4800 },
  { name: 'Jun', sales: 2390, expenses: 3800 },
];

const StatCard = ({ title, value, change, icon: Icon, trend, isRTL }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
        <Icon size={24} />
      </div>
      <div className={cn(
        "flex items-center text-sm font-medium",
        trend === 'up' ? "text-emerald-600" : "text-rose-600"
      )}>
        {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        <span className="ml-1 rtl:mr-1 rtl:ml-0">{change}</span>
      </div>
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
  </div>
);

export default function Dashboard({ 
  isRTL, 
  sales = [], 
  products = [], 
  expenses = [], 
  returns = [], 
  damaged = [] 
}: { 
  isRTL: boolean,
  sales?: any[],
  products?: any[],
  expenses?: any[],
  returns?: any[],
  damaged?: any[]
}) {
  const totalSales = sales.reduce((acc, s) => acc + (s.total || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const totalReturns = returns.reduce((acc, r) => acc + (r.amount || 0), 0);
  const totalDamaged = damaged.reduce((acc, d) => acc + (d.cost || 0), 0);
  const netProfit = totalSales - totalExpenses - totalReturns - totalDamaged;
  const stockCount = products.reduce((acc, p) => acc + (p.stock || 0), 0);

  // Group sales for charts
  const monthlyData = sales.reduce((acc: any[], sale) => {
    const month = new Date(sale.date).toLocaleString('default', { month: 'short' });
    let existing = acc.find(d => d.name === month);
    if (!existing) {
      existing = { name: month, sales: 0, expenses: 0 };
      acc.push(existing);
    }
    existing.sales += sale.total;
    return acc;
  }, []);

  // Merge expenses into monthlyData
  expenses.forEach(exp => {
    const month = new Date(exp.date).toLocaleString('default', { month: 'short' });
    let existing = monthlyData.find(d => d.name === month);
    if (!existing) {
      existing = { name: month, sales: 0, expenses: 0 };
      monthlyData.push(existing);
    }
    existing.expenses += exp.amount;
  });

  const chartData = monthlyData.sort((a, b) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.indexOf(a.name) - months.indexOf(b.name);
  }).slice(-6);

  const recentTransactions = [
    ...sales.map(s => ({ id: `sale-${s.id}`, name: isRTL ? `فاتورة مبيعات #${s.invoiceNumber || s.id}` : `Sales Invoice #${s.invoiceNumber || s.id}`, date: s.date, amount: s.total, type: 'sale' })),
    ...expenses.map(e => ({ id: `exp-${e.id}`, name: e.description, date: e.date, amount: -e.amount, type: 'expense' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={isRTL ? 'إجمالي المبيعات' : 'Total Sales'} 
          value={`$${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          change="+100%" 
          icon={ShoppingCart} 
          trend="up"
          isRTL={isRTL}
        />
        <StatCard 
          title={isRTL ? 'إجمالي المصاريف' : 'Total Expenses'} 
          value={`$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          change="+100%" 
          icon={TrendingDown} 
          trend="down"
          isRTL={isRTL}
        />
        <StatCard 
          title={isRTL ? 'صافي الربح' : 'Net Profit'} 
          value={`$${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          change="+100%" 
          icon={TrendingUp} 
          trend="up"
          isRTL={isRTL}
        />
        <StatCard 
          title={isRTL ? 'المخزون المتوفر' : 'Stock Items'} 
          value={stockCount.toLocaleString()} 
          change="0%" 
          icon={Package} 
          trend="down"
          isRTL={isRTL}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800">
              {isRTL ? 'نظرة عامة على المبيعات' : 'Sales Overview'}
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.length > 0 ? chartData : [{ name: 'N/A', sales: 0 }]}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
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

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800">
              {isRTL ? 'المبيعات مقابل المصاريف' : 'Sales vs Expenses'}
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.length > 0 ? chartData : [{ name: 'N/A', sales: 0, expenses: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                />
                <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expenses" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">
            {isRTL ? 'آخر العمليات' : 'Recent Transactions'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'العملية' : 'Transaction'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'التاريخ' : 'Date'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'المبلغ' : 'Amount'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        row.amount < 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {row.amount < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                      </div>
                      <span className="font-medium text-slate-700">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{row.date}</td>
                  <td className={cn(
                    "px-6 py-4 font-bold",
                    row.amount < 0 ? "text-rose-600" : "text-emerald-600"
                  )}>${Math.abs(row.amount).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-semibold",
                      row.amount >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    )}>
                      {row.amount >= 0 ? 'Completed' : 'Expense'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
