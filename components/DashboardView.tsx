import React from 'react';
import { Sale, Product } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, Package, AlertTriangle, PieChart as PieIcon } from 'lucide-react';

interface DashboardViewProps {
  sales: Sale[];
  inventory: Product[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ sales, inventory }) => {
  // Calculate stats
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalSalesCount = sales.length;
  const lowStockItems = inventory.filter(p => p.stock < 5).length;
  const totalInventoryValue = inventory.reduce((sum, p) => sum + (p.price * p.stock), 0);

  // Prepare Weekly Chart Data (Mocked for visualization of concept, as real dates would require complex grouping logic)
  const weeklyData = [
    { name: 'Lun', ventes: 150000 },
    { name: 'Mar', ventes: 230000 },
    { name: 'Mer', ventes: 180000 },
    { name: 'Jeu', ventes: 320000 },
    { name: 'Ven', ventes: 290000 },
    { name: 'Sam', ventes: 450000 },
    { name: 'Dim', ventes: 380000 },
  ];

  // Prepare Sales by Category Data
  const categoryDataMap = sales.reduce((acc, sale) => {
    sale.items.forEach(item => {
      acc[item.category] = (acc[item.category] || 0) + (item.price * item.quantity);
    });
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.keys(categoryDataMap).map(key => ({
    name: key,
    value: categoryDataMap[key]
  })).sort((a, b) => b.value - a.value);

  // Prepare Best Selling Products Data
  const productSalesMap = sales.reduce((acc, sale) => {
    sale.items.forEach(item => {
      acc[item.name] = (acc[item.name] || 0) + item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  const topProductsData = Object.keys(productSalesMap)
    .map(key => ({ name: key, sales: productSalesMap[key] }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5); // Top 5

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition-transform hover:scale-105">
      <div>
        <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {trend && <p className="text-xs text-green-600 mt-1 flex items-center">+{trend}% cette semaine</p>}
      </div>
      <div className={`p-4 rounded-full ${color} text-white shadow-md`}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Tableau de Bord</h1>
        <p className="text-slate-500">Aperçu des performances de votre boutique.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Chiffre d'affaires" 
          value={`${totalRevenue.toLocaleString()} ${CURRENCY_SYMBOL}`} 
          icon={TrendingUp} 
          color="bg-blue-600"
          trend="12"
        />
        <StatCard 
          title="Ventes Totales" 
          value={totalSalesCount} 
          icon={Users} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Valeur Stock" 
          value={`${totalInventoryValue.toLocaleString()} ${CURRENCY_SYMBOL}`} 
          icon={Package} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Stock Faible" 
          value={lowStockItems} 
          icon={AlertTriangle} 
          color={lowStockItems > 0 ? "bg-red-500" : "bg-gray-400"}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        
        {/* Sales by Category (Pie Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 xl:col-span-1 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PieIcon size={18} className="text-purple-500" />
            Répartition par Catégorie
          </h3>
          <div className="flex-1 min-h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                     formatter={(value: number) => [`${value.toLocaleString()} ${CURRENCY_SYMBOL}`, 'Ventes']}
                     contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Revenue (Bar Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 xl:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" />
            Évolution Hebdomadaire (Simulation)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} ${CURRENCY_SYMBOL}`, 'Revenu']}
                    contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="ventes" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Products */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Package size={18} className="text-emerald-500" />
            Meilleures Ventes (Produits)
          </h3>
          <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical" margin={{ left: 40, right: 20, bottom: 0, top: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={150} 
                    tick={{fill: '#475569', fontSize: 12}} 
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="sales" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} name="Unités vendues">
                    {
                        topProductsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))
                    }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

export default DashboardView;