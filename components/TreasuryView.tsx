
import React, { useState } from 'react';
import { Expense, ExpenseCategory, Sale, SupplierInvoice, User } from '../types';
import { Plus, Wallet, TrendingUp, TrendingDown, DollarSign, Filter, Trash2, Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, AreaChart, Area } from 'recharts';

interface TreasuryViewProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  sales: Sale[];
  supplierInvoices: SupplierInvoice[];
  currentUser: User;
}

const TreasuryView: React.FC<TreasuryViewProps> = ({ expenses, setExpenses, sales, supplierInvoices, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    category: ExpenseCategory.OTHER,
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // --- Calculations ---
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalCOGS = supplierInvoices.reduce((sum, i) => sum + i.totalAmount, 0); // Cost of Goods Sold (Approximated by Purchases)
  const totalOpEx = expenses.reduce((sum, e) => sum + e.amount, 0); // Operational Expenses
  
  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit - totalOpEx;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // --- Chart Data Preparation ---
  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(expensesByCategory).map(cat => ({
    name: cat,
    value: expensesByCategory[cat]
  }));

  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1'];

  const handleAddExpense = () => {
    if (!newExpense.amount || !newExpense.description) {
      alert("Montant et description requis.");
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      companyId: '', // Handled by parent wrapper
      date: newExpense.date!,
      category: newExpense.category as ExpenseCategory,
      amount: Number(newExpense.amount),
      description: newExpense.description!,
      declaredBy: currentUser.name
    };

    setExpenses(prev => [...prev, expense]);
    setIsModalOpen(false);
    setNewExpense({ category: ExpenseCategory.OTHER, amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleDeleteExpense = (id: string) => {
      if(window.confirm("Supprimer cette dépense ?")) {
          setExpenses(prev => prev.filter(e => e.id !== id));
      }
  };

  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto bg-gray-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Trésorerie & Finance</h2>
          <p className="text-slate-500">Suivi des dépenses, cash-flow et rentabilité.</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={18} />
          <span>Déclarer une Dépense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-2">
                <div className="p-3 bg-green-50 text-green-600 rounded-lg"><ArrowUpRight size={24} /></div>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">+ Recettes</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">Chiffre d'Affaires</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalRevenue.toLocaleString()} {CURRENCY_SYMBOL}</h3>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-2">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><ArrowDownLeft size={24} /></div>
                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">- Achats Stock</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">Coût Marchandises (COGS)</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalCOGS.toLocaleString()} {CURRENCY_SYMBOL}</h3>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-2">
                <div className="p-3 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={24} /></div>
                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">- Charges</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">Dépenses Opérationnelles</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalOpEx.toLocaleString()} {CURRENCY_SYMBOL}</h3>
        </div>

        <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${netProfit >= 0 ? 'border-emerald-500' : 'border-red-500'}`}>
            <div className="flex justify-between items-start mb-2">
                <div className={`p-3 rounded-lg ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    <Wallet size={24} />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${netProfit >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {profitMargin.toFixed(1)}% Marge
                </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">Bénéfice Net Réel</p>
            <h3 className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {netProfit.toLocaleString()} {CURRENCY_SYMBOL}
            </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expenses List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden max-h-[500px]">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <TrendingDown className="text-red-500" size={20}/>
                      Journal des Dépenses
                  </h3>
              </div>
              <div className="overflow-y-auto flex-1 p-0">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-slate-600 font-semibold sticky top-0 z-10">
                          <tr>
                              <th className="p-4">Date</th>
                              <th className="p-4">Catégorie</th>
                              <th className="p-4">Description</th>
                              <th className="p-4 text-right">Montant</th>
                              <th className="p-4 text-center">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {expenses.length === 0 ? (
                              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Aucune dépense enregistrée.</td></tr>
                          ) : (
                              expenses.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
                                  <tr key={exp.id} className="hover:bg-gray-50">
                                      <td className="p-4 text-slate-600">{exp.date}</td>
                                      <td className="p-4">
                                          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                                              {exp.category}
                                          </span>
                                      </td>
                                      <td className="p-4 text-slate-800 font-medium">{exp.description}</td>
                                      <td className="p-4 text-right font-bold text-red-600">-{exp.amount.toLocaleString()}</td>
                                      <td className="p-4 text-center">
                                          <button onClick={() => handleDeleteExpense(exp.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* Expense Breakdown Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
               <h3 className="font-bold text-slate-800 mb-4">Répartition des Charges</h3>
               <div className="flex-1 min-h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value:number) => `${value.toLocaleString()} ${CURRENCY_SYMBOL}`} />
                            <Legend />
                        </PieChart>
                   </ResponsiveContainer>
               </div>
          </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50 rounded-t-2xl">
                      <h3 className="text-xl font-bold text-red-900">Nouvelle Dépense</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Trash2 size={24} className="rotate-45"/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Date</label>
                          <input type="date" className="w-full px-4 py-2 border border-gray-200 rounded-lg" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Catégorie</label>
                          <select className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as ExpenseCategory})}>
                              {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Montant ({CURRENCY_SYMBOL})</label>
                          <input type="number" min="0" className="w-full px-4 py-2 border border-gray-200 rounded-lg font-bold text-red-600" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Description</label>
                          <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg" placeholder="Ex: Facture Senelec Octobre" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
                      </div>
                  </div>
                  <div className="p-6 border-t border-gray-100 bg-white rounded-b-2xl flex justify-end gap-3">
                      <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600">Annuler</button>
                      <button onClick={handleAddExpense} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md">Enregistrer Dépense</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TreasuryView;