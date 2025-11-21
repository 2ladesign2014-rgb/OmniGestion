
import React, { useState } from 'react';
import { Supplier, Product, SupplierOrder, SupplierOrderStatus } from '../types';
import { Search, Plus, Edit2, Trash2, Truck, Phone, Mail, MapPin, Calendar, X, Save, CheckSquare, Square, PackagePlus, Archive, AlertTriangle, ClipboardList, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';

interface SuppliersViewProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  inventory: Product[];
  supplierOrders: SupplierOrder[];
  setSupplierOrders: React.Dispatch<React.SetStateAction<SupplierOrder[]>>;
  onReceiveStock: (supplierId: string, items: { productId: string; quantity: number; unitCost: number }[], date: string, relatedOrderId?: string) => void;
  onCreateOrder: (order: SupplierOrder) => void;
}

const SuppliersView: React.FC<SuppliersViewProps> = ({ 
    suppliers, 
    setSuppliers, 
    inventory, 
    supplierOrders,
    setSupplierOrders,
    onReceiveStock,
    onCreateOrder
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'orders'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit/Create Supplier Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    suppliedProductIds: [],
    lastOrderDate: '',
    nextDeliveryDate: ''
  });

  // Order Creation Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedSupplierForOrder, setSelectedSupplierForOrder] = useState<Supplier | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, number>>({}); // productId -> qty
  const [orderCosts, setOrderCosts] = useState<Record<string, number>>({}); // productId -> cost
  const [newOrderDate, setNewOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [newOrderDeliveryDate, setNewOrderDeliveryDate] = useState('');

  // Reception Modal State
  const [isReceptionModalOpen, setIsReceptionModalOpen] = useState(false);
  const [selectedSupplierForReception, setSelectedSupplierForReception] = useState<Supplier | null>(null);
  const [linkedOrderId, setLinkedOrderId] = useState<string | null>(null);
  const [receptionQuantities, setReceptionQuantities] = useState<Record<string, number>>({});
  const [receptionCosts, setReceptionCosts] = useState<Record<string, number>>({});
  const [receptionDate, setReceptionDate] = useState(new Date().toISOString().split('T')[0]);

  // Delete Confirmation State
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = supplierOrders.filter(o => 
    o.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.includes(searchTerm)
  );

  // Group Orders by Status
  const pendingOrders = filteredOrders.filter(o => o.status === SupplierOrderStatus.PENDING);
  const completedOrders = filteredOrders.filter(o => o.status === SupplierOrderStatus.RECEIVED);

  // --- Create/Edit Supplier Handlers ---
  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData(supplier);
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        suppliedProductIds: [],
        lastOrderDate: '',
        nextDeliveryDate: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveSupplier = () => {
    if (!formData.name || !formData.contactName) {
      alert("Le nom du fournisseur et du contact sont obligatoires.");
      return;
    }

    if (editingSupplier) {
      setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? { ...formData, id: s.id } as Supplier : s));
    } else {
      const newSupplier: Supplier = {
        ...formData as Supplier,
        id: Date.now().toString(),
      };
      setSuppliers(prev => [...prev, newSupplier]);
    }
    setIsModalOpen(false);
  };

  const confirmDeleteSupplier = () => {
    if (supplierToDelete) {
      setSuppliers(prev => prev.filter(s => s.id !== supplierToDelete));
      setSupplierToDelete(null);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setFormData(prev => {
      const currentIds = prev.suppliedProductIds || [];
      if (currentIds.includes(productId)) {
        return { ...prev, suppliedProductIds: currentIds.filter(id => id !== productId) };
      } else {
        return { ...prev, suppliedProductIds: [...currentIds, productId] };
      }
    });
  };

  // --- Order Creation Handlers ---
  const handleOpenOrderModal = (supplier: Supplier) => {
      setSelectedSupplierForOrder(supplier);
      const initialItems: Record<string, number> = {};
      const initialCosts: Record<string, number> = {};
      
      (supplier.suppliedProductIds || []).forEach(id => {
          initialItems[id] = 0;
          const product = inventory.find(p => p.id === id);
          // Initialize cost with current purchaseCost or estimated 70% of price
          initialCosts[id] = product?.purchaseCost || (product ? Math.round(product.price * 0.7) : 0);
      });
      
      setOrderItems(initialItems);
      setOrderCosts(initialCosts);
      setNewOrderDate(new Date().toISOString().split('T')[0]);
      
      // Default delivery date +7 days
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setNewOrderDeliveryDate(nextWeek.toISOString().split('T')[0]);

      setIsOrderModalOpen(true);
  };

  const submitOrder = () => {
      if (!selectedSupplierForOrder) return;

      const items = Object.entries(orderItems)
        .filter(([_, qty]) => (qty as number) > 0)
        .map(([productId, qty]) => {
            const product = inventory.find(p => p.id === productId);
            return {
                productId,
                productName: product?.name || 'Unknown',
                quantityOrdered: qty as number,
                estimatedUnitCost: orderCosts[productId] || 0
            };
        });

      if (items.length === 0) {
          alert("Veuillez sélectionner au moins un produit.");
          return;
      }

      const newOrder: SupplierOrder = {
          id: `PO-${Date.now().toString().slice(-6)}`,
          companyId: '', // Handled by parent wrapper
          supplierId: selectedSupplierForOrder.id,
          supplierName: selectedSupplierForOrder.name,
          date: newOrderDate,
          expectedDeliveryDate: newOrderDeliveryDate,
          status: SupplierOrderStatus.PENDING,
          items: items,
          totalEstimated: items.reduce((sum, item) => sum + (item.quantityOrdered * item.estimatedUnitCost), 0)
      };

      onCreateOrder(newOrder);

      // Automatically update Supplier dates
      setSuppliers(prev => prev.map(s => s.id === selectedSupplierForOrder.id ? {
          ...s,
          lastOrderDate: newOrderDate,
          nextDeliveryDate: newOrderDeliveryDate || s.nextDeliveryDate
      } : s));

      setIsOrderModalOpen(false);
  };

  // --- Reception Handlers ---
  
  // Open reception for an existing Order
  const handleOpenReceptionFromOrder = (order: SupplierOrder) => {
    const supplier = suppliers.find(s => s.id === order.supplierId);
    if (!supplier) return;

    setSelectedSupplierForReception(supplier);
    setLinkedOrderId(order.id);
    setReceptionDate(new Date().toISOString().split('T')[0]);

    const quantities: Record<string, number> = {};
    const costs: Record<string, number> = {};

    order.items.forEach(item => {
        quantities[item.productId] = item.quantityOrdered;
        costs[item.productId] = item.estimatedUnitCost;
    });

    setReceptionQuantities(quantities);
    setReceptionCosts(costs);
    setIsReceptionModalOpen(true);
  };

  // Open reception for direct stock entry (no prior order)
  const handleOpenDirectReception = (supplier: Supplier) => {
    setSelectedSupplierForReception(supplier);
    setLinkedOrderId(null);
    
    const initialQuantities: Record<string, number> = {};
    const initialCosts: Record<string, number> = {};
    
    (supplier.suppliedProductIds || []).forEach(id => {
      initialQuantities[id] = 0;
      const product = inventory.find(p => p.id === id);
      initialCosts[id] = product ? (product.purchaseCost || Math.round(product.price * 0.7)) : 0; 
    });

    setReceptionQuantities(initialQuantities);
    setReceptionCosts(initialCosts);
    setReceptionDate(new Date().toISOString().split('T')[0]);
    setIsReceptionModalOpen(true);
  };

  const handleReceptionQuantityChange = (productId: string, qty: number) => {
    setReceptionQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, qty)
    }));
  };

  const handleReceptionCostChange = (productId: string, cost: number) => {
    setReceptionCosts(prev => ({
      ...prev,
      [productId]: Math.max(0, cost)
    }));
  };

  const submitReception = () => {
    if (!selectedSupplierForReception) return;

    const itemsToUpdate = Object.entries(receptionQuantities)
      .filter(([_, qty]) => (qty as number) > 0)
      .map(([productId, quantity]) => ({ 
        productId, 
        quantity: quantity as number,
        unitCost: receptionCosts[productId] || 0
      }));

    if (itemsToUpdate.length === 0) {
      alert("Veuillez saisir au moins une quantité reçue.");
      return;
    }

    onReceiveStock(selectedSupplierForReception.id, itemsToUpdate, receptionDate, linkedOrderId || undefined);
    setIsReceptionModalOpen(false);
    setSelectedSupplierForReception(null);
    setLinkedOrderId(null);
  };

  // --- Helpers ---
  const getProductNames = (ids: string[]) => {
    if (!ids || ids.length === 0) return "Aucun produit assigné";
    const names = inventory.filter(p => ids.includes(p.id)).map(p => p.name);
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2} autres`;
  };

  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto bg-gray-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fournisseurs</h2>
          <p className="text-slate-500">Gestion des partenaires et des approvisionnements.</p>
        </div>
        <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={18} />
          <span>Nouveau Fournisseur</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-200 p-1 rounded-xl w-fit">
        <button 
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
        >
            Liste des Fournisseurs
        </button>
        <button 
             onClick={() => setActiveTab('orders')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
        >
            Commandes d'Achat
            {pendingOrders.length > 0 && (
                <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingOrders.length}</span>
            )}
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={activeTab === 'list' ? "Rechercher un fournisseur..." : "Rechercher une commande..."}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* CONTENT: SUPPLIER LIST */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSuppliers.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-400">
                    <Truck size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Aucun fournisseur trouvé.</p>
                </div>
            ) : (
                filteredSuppliers.map(supplier => (
                <div key={supplier.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                <Truck size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{supplier.name}</h3>
                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                    <MapPin size={12} /> {supplier.address}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleOpenModal(supplier)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Modifier"><Edit2 size={16} /></button>
                            <button onClick={() => setSupplierToDelete(supplier.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Supprimer"><Trash2 size={16} /></button>
                        </div>
                    </div>

                    <div className="space-y-3 mb-4 flex-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <div className="w-5 flex justify-center"><Phone size={16} className="text-slate-400" /></div>
                            <span>{supplier.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <div className="w-5 flex justify-center"><Mail size={16} className="text-slate-400" /></div>
                            <span className="truncate">{supplier.email}</span>
                        </div>
                    </div>

                    {/* Dates Info */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                        <div className="p-2 bg-gray-50 rounded border border-gray-100">
                             <p className="text-xs text-gray-400 uppercase font-bold">Dernière Cde</p>
                             <p className="font-medium text-slate-700">{supplier.lastOrderDate || '-'}</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded border border-gray-100">
                             <p className="text-xs text-gray-400 uppercase font-bold">Prochaine Liv.</p>
                             <p className="font-medium text-slate-700">{supplier.nextDeliveryDate || '-'}</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-slate-500 text-xs uppercase font-medium mb-2">Produits Fournis</p>
                        <p className="text-sm text-slate-700 line-clamp-2">
                            {getProductNames(supplier.suppliedProductIds)}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                        <button 
                            onClick={() => handleOpenOrderModal(supplier)}
                            className="flex-1 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm border border-blue-200"
                        >
                            <ClipboardList size={16} />
                            Commander
                        </button>
                        <button 
                            onClick={() => handleOpenDirectReception(supplier)}
                            className="flex-1 py-2 bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 text-sm border border-emerald-200"
                            title="Réception sans commande préalable"
                        >
                            <PackagePlus size={16} />
                            Réception Rapide
                        </button>
                    </div>
                </div>
                ))
            )}
        </div>
      )}

      {/* CONTENT: ORDERS LIST (CATEGORIZED) */}
      {activeTab === 'orders' && (
          <div className="space-y-8">
              {/* Pending Orders Section */}
              <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                      <ClipboardList className="text-orange-500" />
                      Commandes En Cours (En attente de réception)
                  </h3>
                  {pendingOrders.length === 0 ? (
                      <p className="text-slate-400 text-sm italic p-4 bg-white rounded-lg border border-dashed">Aucune commande en cours.</p>
                  ) : (
                      <div className="grid gap-4">
                          {pendingOrders.map(order => (
                              <div key={order.id} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                                  <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                          <span className="text-xs font-mono bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold">{order.id}</span>
                                          <span className="text-sm text-slate-500 flex items-center gap-1"><Calendar size={12}/> {order.date}</span>
                                          {order.expectedDeliveryDate && (
                                              <span className="text-xs text-slate-400 flex items-center gap-1 ml-2 border-l pl-2 border-gray-200">
                                                  <Clock size={12} /> Livraison prévue: {order.expectedDeliveryDate}
                                              </span>
                                          )}
                                      </div>
                                      <h4 className="font-bold text-slate-800">{order.supplierName}</h4>
                                      <p className="text-sm text-slate-600 mt-1">
                                          {order.items.map(i => `${i.quantityOrdered}x ${i.productName}`).join(', ')}
                                      </p>
                                      <p className="text-xs text-slate-400 mt-1">Total Estimé: {order.totalEstimated.toLocaleString()} {CURRENCY_SYMBOL}</p>
                                  </div>
                                  <button 
                                      onClick={() => handleOpenReceptionFromOrder(order)}
                                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-md flex items-center gap-2 transition-transform active:scale-95"
                                  >
                                      <PackagePlus size={18} />
                                      Réceptionner
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* Completed Orders Section */}
              <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                      <Archive className="text-emerald-500" />
                      Historique des Réceptions
                  </h3>
                   {completedOrders.length === 0 ? (
                      <p className="text-slate-400 text-sm italic p-4 bg-white rounded-lg border border-dashed">Aucune commande réceptionnée.</p>
                  ) : (
                      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                           <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50 text-slate-600 font-medium border-b border-gray-100">
                                  <tr>
                                      <th className="p-4">Ref Commande</th>
                                      <th className="p-4">Date</th>
                                      <th className="p-4">Fournisseur</th>
                                      <th className="p-4">Détails</th>
                                      <th className="p-4 text-right">Statut</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                  {completedOrders.slice().reverse().map(order => (
                                      <tr key={order.id} className="hover:bg-slate-50">
                                          <td className="p-4 font-mono text-slate-500">{order.id}</td>
                                          <td className="p-4 text-slate-700">{order.date}</td>
                                          <td className="p-4 font-medium text-slate-800">{order.supplierName}</td>
                                          <td className="p-4 text-slate-600 max-w-xs truncate" title={order.items.map(i => i.productName).join(', ')}>
                                              {order.items.length} articles ({order.items[0].productName}...)
                                          </td>
                                          <td className="p-4 text-right">
                                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                                  <CheckCircle size={12} /> Reçu
                                              </span>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                           </table>
                      </div>
                   )}
              </div>
          </div>
      )}

      {/* --- MODALS --- */}

      {/* Delete Supplier Confirmation */}
      {supplierToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full text-center">
             <AlertTriangle size={32} className="mx-auto text-red-600 mb-3" />
             <h3 className="text-xl font-bold mb-2">Supprimer ce fournisseur ?</h3>
             <p className="text-slate-500 mb-6">Action irréversible.</p>
             <div className="flex gap-3">
                 <button onClick={() => setSupplierToDelete(null)} className="flex-1 py-2 bg-gray-100 rounded-lg">Annuler</button>
                 <button onClick={confirmDeleteSupplier} className="flex-1 py-2 bg-red-600 text-white rounded-lg">Supprimer</button>
             </div>
          </div>
        </div>
      )}

      {/* Create/Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">{editingSupplier ? 'Modifier Fournisseur' : 'Nouveau Fournisseur'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                    {/* Supplier Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Nom de l'entreprise <span className="text-red-500">*</span></label>
                            <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Contact Principal <span className="text-red-500">*</span></label>
                            <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email</label>
                            <input type="email" className="w-full px-4 py-2 border border-gray-200 rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Téléphone</label>
                            <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div className="col-span-full space-y-2">
                            <label className="text-sm font-medium text-slate-700">Adresse</label>
                            <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                        </div>
                        
                        {/* Dates Management */}
                         <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Dernière commande</label>
                            <input type="date" className="w-full px-4 py-2 border border-gray-200 rounded-lg" value={formData.lastOrderDate || ''} onChange={e => setFormData({...formData, lastOrderDate: e.target.value})} />
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Prochaine livraison</label>
                            <input type="date" className="w-full px-4 py-2 border border-gray-200 rounded-lg" value={formData.nextDeliveryDate || ''} onChange={e => setFormData({...formData, nextDeliveryDate: e.target.value})} />
                        </div>
                    </div>

                    {/* Products Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Produits Fournis</label>
                        <div className="h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white custom-scrollbar">
                            {inventory.map(prod => {
                                const isSelected = formData.suppliedProductIds?.includes(prod.id);
                                return (
                                    <div key={prod.id} className={`flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`} onClick={() => toggleProductSelection(prod.id)}>
                                        <div className={`text-blue-600 ${isSelected ? 'opacity-100' : 'opacity-40'}`}>{isSelected ? <CheckSquare size={18} /> : <Square size={18} />}</div>
                                        <div className="text-sm"><div className="font-medium text-slate-700">{prod.name}</div><div className="text-xs text-slate-500">{prod.category}</div></div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-white border border-transparent hover:border-gray-200 rounded-lg">Annuler</button>
                    <button onClick={handleSaveSupplier} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md">Enregistrer</button>
                </div>
            </div>
        </div>
      )}

      {/* NEW: Order Creation Modal */}
      {isOrderModalOpen && selectedSupplierForOrder && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                   <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50 rounded-t-2xl">
                       <div>
                           <h3 className="text-xl font-bold text-blue-900">Nouvelle Commande</h3>
                           <p className="text-sm text-blue-700">Fournisseur : {selectedSupplierForOrder.name}</p>
                       </div>
                       <button onClick={() => setIsOrderModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                   </div>
                   
                   <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                        {/* Date Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Date de Commande</label>
                                <input 
                                    type="date" 
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={newOrderDate}
                                    onChange={(e) => setNewOrderDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Livraison Prévue</label>
                                <input 
                                    type="date" 
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={newOrderDeliveryDate}
                                    onChange={(e) => setNewOrderDeliveryDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-slate-600 font-medium">Sélectionnez les produits, quantités et coûts :</p>
                            {(selectedSupplierForOrder.suppliedProductIds || []).length === 0 ? (
                                <p className="text-red-500 text-sm">Aucun produit associé à ce fournisseur. Veuillez d'abord modifier le fournisseur.</p>
                            ) : (
                                (selectedSupplierForOrder.suppliedProductIds || []).map(pid => {
                                    const product = inventory.find(p => p.id === pid);
                                    if (!product) return null;
                                    return (
                                        <div key={pid} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 gap-4">
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-700">{product.name}</p>
                                                <p className="text-xs text-slate-500">Stock actuel: {product.stock}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-400 mb-1">Qté</span>
                                                    <input 
                                                        type="number" 
                                                        min="0" 
                                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={orderItems[pid] || 0}
                                                        onChange={(e) => setOrderItems(prev => ({...prev, [pid]: parseInt(e.target.value) || 0}))}
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-400 mb-1">Coût Unit.</span>
                                                    <div className="relative">
                                                        <input 
                                                            type="number" 
                                                            min="0" 
                                                            className="w-24 px-2 py-1 pr-6 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={orderCosts[pid] || 0}
                                                            onChange={(e) => setOrderCosts(prev => ({...prev, [pid]: parseFloat(e.target.value) || 0}))}
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">{CURRENCY_SYMBOL}</span>
                                                    </div>
                                                </div>
                                                <div className="w-24 text-right">
                                                     <span className="text-xs text-slate-400 block">Total Ligne</span>
                                                     <span className="font-bold text-blue-600">
                                                        {((orderItems[pid] || 0) * (orderCosts[pid] || 0)).toLocaleString()}
                                                     </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                   </div>
                   
                   <div className="p-6 border-t border-gray-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                        <button onClick={() => setIsOrderModalOpen(false)} className="px-4 py-2 text-slate-600">Annuler</button>
                        <button onClick={submitOrder} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2">
                            <ClipboardList size={18} />
                            Créer la commande
                        </button>
                   </div>
               </div>
           </div>
      )}

      {/* Order Reception Modal */}
      {isReceptionModalOpen && selectedSupplierForReception && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 bg-emerald-50 rounded-t-2xl">
                   <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
                      <Archive className="text-emerald-600" />
                      {linkedOrderId ? `Réception Commande #${linkedOrderId}` : 'Réception Directe'}
                   </h3>
                   <p className="text-emerald-700 text-sm mt-1">
                      Fournisseur: <span className="font-semibold">{selectedSupplierForReception.name}</span>
                   </p>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                   {/* Date Selector */}
                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-slate-700">Date de Réception</label>
                      <input 
                          type="date"
                          className="w-full md:w-1/2 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={receptionDate}
                          onChange={(e) => setReceptionDate(e.target.value)}
                      />
                   </div>

                   <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-700">Articles à Réceptionner</h4>
                      {/* Product Table logic similar to previous version but with costs */}
                       <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200 text-slate-600">
                                    <tr>
                                        <th className="p-3 font-medium">Produit</th>
                                        <th className="p-3 font-medium text-center w-24">Stock Act.</th>
                                        <th className="p-3 font-medium text-right w-32">Qté Reçue</th>
                                        <th className="p-3 font-medium text-right w-32">Prix Achat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(linkedOrderId 
                                        ? Object.keys(receptionQuantities) // Show ordered items
                                        : selectedSupplierForReception.suppliedProductIds || [] // Show all available
                                    ).map(prodId => {
                                        const product = inventory.find(p => p.id === prodId);
                                        if(!product) return null;
                                        return (
                                            <tr key={prodId} className="hover:bg-gray-50">
                                                <td className="p-3">
                                                    <div className="font-medium text-slate-800">{product.name}</div>
                                                </td>
                                                <td className="p-3 text-center text-slate-500">{product.stock}</td>
                                                <td className="p-3 text-right">
                                                    <input 
                                                        type="number"
                                                        min="0"
                                                        className="w-24 px-2 py-1 border border-gray-300 rounded-md text-right focus:ring-2 focus:ring-emerald-500 outline-none"
                                                        value={receptionQuantities[prodId] || 0}
                                                        onChange={(e) => handleReceptionQuantityChange(prodId, parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="p-3 text-right">
                                                        <input 
                                                            type="number"
                                                            min="0"
                                                            className="w-28 px-2 py-1 border border-gray-300 rounded-md text-right focus:ring-2 focus:ring-emerald-500 outline-none"
                                                            value={receptionCosts[prodId] || 0}
                                                            onChange={(e) => handleReceptionCostChange(prodId, parseInt(e.target.value) || 0)}
                                                        />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                   </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-white rounded-b-2xl flex justify-end gap-3">
                    <button onClick={() => setIsReceptionModalOpen(false)} className="px-5 py-2.5 text-slate-600">Annuler</button>
                    <button onClick={submitReception} className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 shadow-md flex items-center gap-2">
                        <CheckCircle size={18} />
                        Valider la réception
                    </button>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default SuppliersView;
