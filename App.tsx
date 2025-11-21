
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';

import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import POSView from './components/POSView';
import AIAssistantView from './components/AIAssistantView';
import InvoicesManagementView from './components/InvoicesManagementView';
import SuppliersView from './components/SuppliersView';
import OrdersView from './components/OrdersView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import CRMView from './components/CRMView';
import TreasuryView from './components/TreasuryView';

import { Product, Sale, CartItem, Supplier, SupplierInvoice, ClientOrder, OrderStatus, Company, User, UserRole, SupplierOrder, SupplierOrderStatus, Client, Expense, PaymentDetails } from './types';
import { Building, PlusCircle, LogOut, Upload, ImageIcon, X, Save, Edit2, Palette, Check } from 'lucide-react';
import { ApiService } from './services/api';
import { seedDataIfEmpty } from './utils/db';

const MainLayout: React.FC<{ 
    children: React.ReactNode; 
    currentUser: User | null; 
    currentCompany?: Company; 
    onLogout: () => void;
    onSwitchCompany?: () => void; 
}> = ({ children, currentUser, currentCompany, onLogout, onSwitchCompany }) => {
    const navigate = useNavigate();
    const location = useLocation();
    // Extract view ID from path (e.g. /pos -> pos)
    const currentView = location.pathname.substring(1) || 'dashboard';

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
            <Sidebar 
                currentView={currentView} 
                setCurrentView={(view) => navigate(`/${view}`)} 
                currentUser={currentUser}
                currentCompany={currentCompany}
                onLogout={onLogout}
                onSwitchCompany={onSwitchCompany}
            />
            <main className="flex-1 h-full overflow-hidden relative">
                {children}
            </main>
        </div>
    );
};

const AppContent: React.FC = () => {
  // --- AUTH & CONTEXT STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);

  // --- DATA STATE (Loaded from IndexedDB/API) ---
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clientOrders, setClientOrders] = useState<ClientOrder[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // --- INIT DATA ---
  useEffect(() => {
      const init = async () => {
          await seedDataIfEmpty();
          refreshData();
      };
      init();
  }, []);

  const refreshData = async () => {
      try {
          const [p, s, c, sup, exp, comp, u, co, so, si] = await Promise.all([
              ApiService.getProducts(),
              ApiService.getSales(),
              ApiService.getClients(),
              ApiService.getSuppliers(),
              ApiService.getExpenses(),
              ApiService.getCompanies(),
              ApiService.getUsers(),
              ApiService.getClientOrders(),
              ApiService.getSupplierOrders(),
              ApiService.getSupplierInvoices()
          ]);
          setInventory(p); setSales(s); setClients(c); setSuppliers(sup); setExpenses(exp);
          setCompanies(comp); setAllUsers(u); setClientOrders(co); setSupplierOrders(so); setSupplierInvoices(si);
          setIsLoading(false);
      } catch (error) {
          console.error("Failed to load data", error);
          toast.error("Erreur de chargement des données");
          setIsLoading(false);
      }
  };

  // --- COMPANY MANAGEMENT STATE ---
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [companyFormData, setCompanyFormData] = useState<Partial<Company>>({
    name: '', address: '', phone: '', email: '', taxRate: 18, currencySymbol: 'FCFA', footerMessage: '', themeColor: 'blue', logo: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FILTERED DATA ---
  const activeCompany = companies.find(c => c.id === currentCompanyId);
  
  const currentAppSettings = activeCompany ? {
      companyName: activeCompany.name,
      logo: activeCompany.logo,
      address: activeCompany.address,
      phone: activeCompany.phone,
      email: activeCompany.email,
      taxRate: activeCompany.taxRate,
      currencySymbol: activeCompany.currencySymbol,
      footerMessage: activeCompany.footerMessage,
      settingsPin: activeCompany.settingsPin
  } : {
      companyName: 'TechGestion',
      logo: undefined, address: '', phone: '', email: '', taxRate: 0, currencySymbol: 'FCFA', footerMessage: '', settingsPin: undefined
  };

  const companyInventory = useMemo(() => inventory.filter(i => i.companyId === currentCompanyId), [inventory, currentCompanyId]);
  const companySales = useMemo(() => sales.filter(s => s.companyId === currentCompanyId), [sales, currentCompanyId]);
  const companySuppliers = useMemo(() => suppliers.filter(s => s.companyId === currentCompanyId), [suppliers, currentCompanyId]);
  const companyClients = useMemo(() => clients.filter(c => c.companyId === currentCompanyId), [clients, currentCompanyId]);
  const companyExpenses = useMemo(() => expenses.filter(e => e.companyId === currentCompanyId), [expenses, currentCompanyId]);
  const companyClientOrders = useMemo(() => clientOrders.filter(o => o.companyId === currentCompanyId), [clientOrders, currentCompanyId]);
  const companySupplierOrders = useMemo(() => supplierOrders.filter(o => o.companyId === currentCompanyId), [supplierOrders, currentCompanyId]);
  const companySupplierInvoices = useMemo(() => supplierInvoices.filter(i => i.companyId === currentCompanyId), [supplierInvoices, currentCompanyId]);
  const companyUsers = useMemo(() => allUsers.filter(u => u.companyId === currentCompanyId), [allUsers, currentCompanyId]);

  // --- HANDLERS ---

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.companyId) {
      setCurrentCompanyId(user.companyId);
    } else if (user.role === UserRole.SUPER_ADMIN) {
      setCurrentCompanyId(null);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentCompanyId(null);
  };

  const calculateTotal = (items: CartItem[]) => {
    const subtotal = items.reduce((sum, item) => {
       let itemPrice = item.price;
       if (item.promotionalPrice && item.promotionalPrice > 0) itemPrice = item.promotionalPrice;
       else if (item.discount) itemPrice = item.price * (1 - item.discount / 100);
       return sum + (itemPrice * item.quantity);
    }, 0);
    return subtotal * (1 + (activeCompany?.taxRate || 0) / 100);
  };

  // --- DATA UPDATE WRAPPERS (Using API Service) ---

  const updateInventory = async (newInv: Product[] | ((prev: Product[]) => Product[])) => {
      // React state update simulation for smooth UI, then sync to DB
      const updatedList = typeof newInv === 'function' ? newInv(companyInventory) : newInv;
      
      // Identify changed items (simplified) and save
      // In real app, we'd save individually. For this demo, we just update state & assume save happened in component or we bulk save.
      // Better: Components call API, API updates DB, then we refresh or optimistically update.
      // For this 'setInventory' prop compatibility:
      
      // We'll just set state locally to keep UI responsive, and assume the component called ApiService.saveProduct
      // But since the child components use setInventory to ADD items, we need to intercept.
      
      // Hack for compatibility with existing components that expect setState
      // In a full refactor, components would call ApiService directly.
      setInventory(prev => {
          const others = prev.filter(p => p.companyId !== currentCompanyId);
          return [...others, ...updatedList.map(p => ({...p, companyId: currentCompanyId!}))];
      });
      
      // Persist changes (Diffing is hard here without Refactor, so we save all for the active company - inefficient but functional for demo)
      for (const p of updatedList) {
          await ApiService.saveProduct({...p, companyId: currentCompanyId!});
      }
  };

  // --- VIEW RENDERERS ---

  if (isLoading) {
      return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Chargement...</div>;
  }

  if (!currentUser) {
      return <LoginView onLogin={handleLogin} users={allUsers} />;
  }

  // SUPER ADMIN DASHBOARD
  if (currentUser.role === UserRole.SUPER_ADMIN && !currentCompanyId) {
       // ... (Keep existing Super Admin UI logic, just wrapping handlers)
       const handleOpenCompanyModal = (c?: Company) => {
          if (c) { setEditingCompanyId(c.id); setCompanyFormData(c); } 
          else { setEditingCompanyId(null); setCompanyFormData({name: '', address: '', phone: '', email: '', taxRate: 18, currencySymbol: 'FCFA', footerMessage: '', themeColor: 'blue', logo: ''}); }
          setIsCompanyModalOpen(true);
       };

       const handleSaveCompany = async () => {
           if (!companyFormData.name) return toast.error("Nom requis");
           const newComp = { ...companyFormData, id: editingCompanyId || Date.now().toString() } as Company;
           await ApiService.saveCompany(newComp);
           setCompanies(prev => editingCompanyId ? prev.map(c => c.id === editingCompanyId ? newComp : c) : [...prev, newComp]);
           setIsCompanyModalOpen(false);
           toast.success("Entreprise enregistrée");
       };

       const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setCompanyFormData(prev => ({ ...prev, logo: reader.result as string }));
                reader.readAsDataURL(file);
            }
       };

       return (
        <div className="min-h-screen bg-slate-900 p-8 text-white relative">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <div><h1 className="text-3xl font-bold">TechGestion Cloud</h1><p className="text-slate-400">Portail de Gestion Multi-Entreprises</p></div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300"><LogOut size={20} /> Déconnexion</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div onClick={() => handleOpenCompanyModal()} className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 hover:border-blue-500 transition-all group min-h-[250px]">
                        <div className="w-16 h-16 rounded-full bg-slate-700 group-hover:bg-blue-600 flex items-center justify-center mb-4 transition-colors"><PlusCircle size={32} className="text-slate-400 group-hover:text-white"/></div>
                        <h3 className="font-bold text-lg">Nouvelle Entreprise</h3>
                    </div>
                    {companies.map(company => (
                        <div key={company.id} className="bg-white text-slate-900 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all relative overflow-hidden group min-h-[250px] flex flex-col">
                            <div className={`absolute top-0 left-0 w-full h-2 bg-${company.themeColor || 'blue'}-500`}></div>
                            <div className="flex justify-between items-start mb-4">
                                <div onClick={() => { setCurrentCompanyId(company.id); }} className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-xl text-slate-700 border border-slate-200 cursor-pointer hover:scale-105 transition-transform">
                                    {company.logo ? <img src={company.logo} alt="logo" className="w-full h-full object-cover rounded-xl" /> : company.name.charAt(0)}
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleOpenCompanyModal(company); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                            </div>
                            <div onClick={() => { setCurrentCompanyId(company.id); }} className="cursor-pointer flex-1">
                                <h3 className="text-xl font-bold mb-1">{company.name}</h3>
                                <p className="text-sm text-slate-500 flex items-center gap-1 mb-4"><Building size={14}/> {company.address || 'Non renseignée'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {isCompanyModalOpen && (
               <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                   <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl text-slate-800">
                       <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                           <h3 className="text-xl font-bold flex items-center gap-2"><Building className="text-blue-600" />{editingCompanyId ? 'Modifier' : 'Nouvelle'}</h3>
                           <button onClick={() => setIsCompanyModalOpen(false)}><X size={24}/></button>
                       </div>
                       <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                           <div className="flex items-center gap-6">
                               <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 cursor-pointer relative group" onClick={() => fileInputRef.current?.click()}>
                                   {companyFormData.logo ? <img src={companyFormData.logo} className="w-full h-full object-cover rounded-xl" /> : <ImageIcon className="text-gray-400" size={24} />}
                               </div>
                               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                               <div className="flex-1">
                                   <label className="block text-sm font-bold text-slate-700 mb-1">Nom</label>
                                   <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg" value={companyFormData.name} onChange={e => setCompanyFormData({...companyFormData, name: e.target.value})} />
                               </div>
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                                <input placeholder="Email" className="px-4 py-2 border rounded-lg" value={companyFormData.email} onChange={e => setCompanyFormData({...companyFormData, email: e.target.value})} />
                                <input placeholder="Téléphone" className="px-4 py-2 border rounded-lg" value={companyFormData.phone} onChange={e => setCompanyFormData({...companyFormData, phone: e.target.value})} />
                           </div>
                           <input placeholder="Adresse" className="w-full px-4 py-2 border rounded-lg" value={companyFormData.address} onChange={e => setCompanyFormData({...companyFormData, address: e.target.value})} />
                           <div className="grid grid-cols-3 gap-6">
                               <select className="px-4 py-2 border rounded-lg bg-white" value={companyFormData.currencySymbol} onChange={e => setCompanyFormData({...companyFormData, currencySymbol: e.target.value})}>
                                   <option value="FCFA">FCFA</option><option value="€">€</option><option value="$">$</option>
                               </select>
                               <input type="number" placeholder="TVA" className="px-4 py-2 border rounded-lg" value={companyFormData.taxRate} onChange={e => setCompanyFormData({...companyFormData, taxRate: parseFloat(e.target.value)})} />
                               <div className="flex gap-1 mt-2">{['blue', 'emerald', 'purple', 'orange'].map(c => <button key={c} onClick={() => setCompanyFormData({...companyFormData, themeColor: c})} className={`w-6 h-6 rounded-full bg-${c}-500`}/>)}</div>
                           </div>
                       </div>
                       <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                           <button onClick={() => setIsCompanyModalOpen(false)} className="px-5 py-2 text-slate-600">Annuler</button>
                           <button onClick={handleSaveCompany} className="px-5 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"><Save size={18} /> Enregistrer</button>
                       </div>
                   </div>
               </div>
            )}
        </div>
       );
  }

  // TENANT ROUTES
  return (
    <Router>
        <MainLayout 
            currentUser={currentUser} 
            currentCompany={activeCompany} 
            onLogout={handleLogout}
            onSwitchCompany={currentUser.role === UserRole.SUPER_ADMIN ? () => setCurrentCompanyId(null) : undefined}
        >
            <Toaster position="top-right" richColors />
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardView sales={companySales} inventory={companyInventory} />} />
                <Route path="/inventory" element={<InventoryView inventory={companyInventory} setInventory={updateInventory} />} />
                <Route path="/pos" element={
                    <POSView 
                        inventory={companyInventory} 
                        clients={companyClients}
                        setClients={async (newClients) => {
                            const updated = typeof newClients === 'function' ? newClients(companyClients) : newClients;
                            // Simple diff check to find new client
                            const newClient = updated.find(c => !companyClients.find(existing => existing.id === c.id));
                            if(newClient) {
                                await ApiService.saveClient({...newClient, companyId: currentCompanyId});
                                setClients(prev => [...prev, {...newClient, companyId: currentCompanyId!}]);
                            }
                        }}
                        onCheckout={async (items, client, payment) => {
                             const total = calculateTotal(items);
                             const newSale: Sale = {
                                 id: Date.now().toString(), companyId: currentCompanyId!, date: new Date().toLocaleString(), items, total, clientId: client?.id, clientName: client?.name, paymentInfo: payment
                             };
                             await ApiService.saveSale(newSale);
                             setSales(prev => [...prev, newSale]);
                             
                             // Update Stock
                             const updatedInv = inventory.map(p => {
                                 const item = items.find(i => i.id === p.id);
                                 return item ? {...p, stock: p.stock - item.quantity} : p;
                             });
                             setInventory(updatedInv);
                             items.forEach(async item => {
                                 const p = inventory.find(p => p.id === item.id);
                                 if(p) await ApiService.saveProduct({...p, stock: p.stock - item.quantity});
                             });

                             if(client) {
                                 const updatedClient = { ...client, totalSpent: client.totalSpent + total, loyaltyPoints: client.loyaltyPoints + Math.floor(total/1000) };
                                 await ApiService.saveClient(updatedClient);
                                 setClients(prev => prev.map(c => c.id === client.id ? updatedClient : c));
                             }
                             toast.success('Vente enregistrée');
                        }}
                        onSaveOrder={async (items, name) => {
                            const order: ClientOrder = { id: `CMD-${Date.now()}`, companyId: currentCompanyId!, customerName: name, date: new Date().toLocaleString(), items, total: calculateTotal(items), status: OrderStatus.PENDING };
                            await ApiService.saveClientOrder(order);
                            setClientOrders(prev => [...prev, order]);
                            toast.success('Commande sauvegardée');
                        }}
                        settings={currentAppSettings}
                    />
                } />
                <Route path="/crm" element={<CRMView clients={companyClients} sales={companySales} setClients={async (val) => {
                     const updated = typeof val === 'function' ? val(companyClients) : val;
                     // Bulk update sim
                     setClients(prev => [...prev.filter(c => c.companyId !== currentCompanyId), ...updated.map(c => ({...c, companyId: currentCompanyId!}))]);
                     // In real app, pass only the created/updated client to ApiService
                }} />} />
                <Route path="/orders" element={<OrdersView orders={companyClientOrders} settings={currentAppSettings} onProcessOrder={async (id) => {
                    const order = clientOrders.find(o => o.id === id);
                    if(order) {
                        const updated = {...order, status: OrderStatus.COMPLETED};
                        await ApiService.saveClientOrder(updated);
                        setClientOrders(prev => prev.map(o => o.id === id ? updated : o));
                        toast.success("Commande facturée");
                    }
                }} onCancelOrder={async (id) => {
                     const order = clientOrders.find(o => o.id === id);
                     if(order) {
                         const updated = {...order, status: OrderStatus.CANCELLED};
                         await ApiService.saveClientOrder(updated);
                         setClientOrders(prev => prev.map(o => o.id === id ? updated : o));
                     }
                }}/>} />
                <Route path="/suppliers" element={<SuppliersView 
                    suppliers={companySuppliers} inventory={companyInventory} supplierOrders={companySupplierOrders}
                    setSuppliers={(val) => {
                         const updated = typeof val === 'function' ? val(companySuppliers) : val;
                         setSuppliers(prev => [...prev.filter(s => s.companyId !== currentCompanyId), ...updated.map(s => ({...s, companyId: currentCompanyId!}))]);
                         // Persist logic...
                    }}
                    setSupplierOrders={(val) => {}} 
                    onCreateOrder={async (order) => {
                        const newOrder = {...order, companyId: currentCompanyId!};
                        await ApiService.saveSupplierOrder(newOrder);
                        setSupplierOrders(prev => [...prev, newOrder]);
                        toast.success("Commande fournisseur créée");
                    }}
                    onReceiveStock={async (supId, items, date, orderId) => {
                        // Update Stock
                        const updatedInv = inventory.map(p => {
                            const rec = items.find(i => i.productId === p.id);
                            return rec ? {...p, stock: p.stock + rec.quantity} : p;
                        });
                        setInventory(updatedInv);
                        items.forEach(async i => {
                             const p = inventory.find(p => p.id === i.productId);
                             if(p) await ApiService.saveProduct({...p, stock: p.stock + i.quantity});
                        });

                        // Create Invoice
                        const invoice: SupplierInvoice = {
                             id: `INV-SUP-${Date.now()}`, companyId: currentCompanyId!, supplierId: supId, supplierName: suppliers.find(s => s.id === supId)?.name || '',
                             date, items: items.map(i => ({...i, productName: inventory.find(p => p.id === i.productId)?.name || ''})),
                             totalAmount: items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0), relatedOrderId: orderId
                        };
                        await ApiService.saveSupplierInvoice(invoice);
                        setSupplierInvoices(prev => [...prev, invoice]);
                        
                        if(orderId) {
                             const order = supplierOrders.find(o => o.id === orderId);
                             if(order) {
                                 const updatedOrder = {...order, status: SupplierOrderStatus.RECEIVED};
                                 await ApiService.saveSupplierOrder(updatedOrder);
                                 setSupplierOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
                             }
                        }
                        toast.success("Stock réceptionné");
                    }}
                />} />
                <Route path="/treasury" element={<TreasuryView 
                    expenses={companyExpenses} sales={companySales} supplierInvoices={companySupplierInvoices} currentUser={currentUser}
                    setExpenses={async (val) => {
                         const updated = typeof val === 'function' ? val(companyExpenses) : val;
                         // Find added expense
                         const newExp = updated.find(e => !companyExpenses.find(ex => ex.id === e.id));
                         if(newExp) {
                             await ApiService.saveExpense({...newExp, companyId: currentCompanyId});
                             setExpenses(prev => [...prev, {...newExp, companyId: currentCompanyId!}]);
                             toast.success("Dépense ajoutée");
                         }
                    }}
                />} />
                <Route path="/invoices" element={<InvoicesManagementView sales={companySales} supplierInvoices={companySupplierInvoices} setSales={setSales} setSupplierInvoices={setSupplierInvoices} settings={currentAppSettings} />} />
                <Route path="/assistant" element={<AIAssistantView inventory={companyInventory} sales={companySales} />} />
                <Route path="/settings" element={<SettingsView 
                    settings={currentAppSettings} 
                    currentCompanyId={currentCompanyId!}
                    companyUsers={companyUsers}
                    onUpdateCompanyUsers={(updatedUsers) => {
                        // Save all updated users
                        updatedUsers.forEach(async u => await ApiService.saveUser(u));
                        setAllUsers(prev => {
                             const others = prev.filter(u => u.companyId !== currentCompanyId);
                             return [...others, ...updatedUsers];
                        });
                        toast.success("Utilisateurs mis à jour");
                    }}
                    setSettings={async (val) => {
                         const updatedVal = typeof val === 'function' ? val(currentAppSettings) : val;
                         const updatedCompany = { ...activeCompany!, ...updatedVal, name: updatedVal.companyName };
                         await ApiService.saveCompany(updatedCompany);
                         setCompanies(prev => prev.map(c => c.id === currentCompanyId ? updatedCompany : c));
                         toast.success("Paramètres sauvegardés");
                    }}
                    onExportData={() => {}}
                />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </MainLayout>
    </Router>
  );
}

const App: React.FC = () => {
    return <AppContent />;
};

export default App;
