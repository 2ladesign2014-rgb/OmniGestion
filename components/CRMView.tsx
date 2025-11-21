
import React, { useState } from 'react';
import { Client, ClientType, Sale, CartItem } from '../types';
import { Search, Plus, Edit2, Trash2, Users, Phone, Mail, MapPin, ShoppingBag, Award, ArrowRight, X } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';

interface CRMViewProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  sales: Sale[]; // To show history
}

const CRMView: React.FC<CRMViewProps> = ({ clients, setClients, sales }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    type: ClientType.INDIVIDUAL,
    notes: ''
  });

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm)
  );

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setSelectedClient(client);
      setFormData(client);
    } else {
      setSelectedClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        type: ClientType.INDIVIDUAL,
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveClient = () => {
    if (!formData.name || !formData.phone) {
      alert("Le nom et le téléphone sont obligatoires.");
      return;
    }

    if (selectedClient) {
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, ...formData } as Client : c));
    } else {
      const newClient: Client = {
        id: Date.now().toString(),
        loyaltyPoints: 0,
        totalSpent: 0,
        ...formData as Client
      };
      setClients(prev => [...prev, newClient]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteClient = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      setClients(prev => prev.filter(c => c.id !== id));
      if (selectedClient?.id === id) {
        setIsModalOpen(false);
        setSelectedClient(null);
      }
    }
  };

  const getClientHistory = (clientId: string) => {
    return sales.filter(s => s.clientId === clientId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto bg-gray-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestion Client (CRM)</h2>
          <p className="text-slate-500">Répertoire client, historique et fidélité.</p>
        </div>
        <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={18} />
          <span>Nouveau Client</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100%-100px)]">
        {/* Left List */}
        <div className="w-full lg:w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
           </div>
           <div className="overflow-y-auto flex-1">
              {filteredClients.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                    <Users size={48} className="mx-auto mb-3 opacity-30" />
                    <p>Aucun client trouvé.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                   {filteredClients.map(client => (
                     <div 
                        key={client.id} 
                        onClick={() => handleOpenModal(client)}
                        className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between ${selectedClient?.id === client.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                     >
                        <div className="flex items-center gap-3 overflow-hidden">
                           <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 font-bold border border-gray-200">
                             {client.name.charAt(0)}
                           </div>
                           <div className="min-w-0">
                              <h4 className="font-bold text-slate-800 truncate">{client.name}</h4>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Phone size={10} /> {client.phone}
                              </p>
                           </div>
                        </div>
                        <ArrowRight size={16} className="text-gray-300" />
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>

        {/* Right Details Panel (shown as modal on mobile, inline on desktop) */}
        <div className="hidden lg:block lg:w-2/3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
           {selectedClient ? (
              <div className="flex flex-col h-full">
                 {/* Header */}
                 <div className="p-6 border-b border-gray-100 bg-slate-50 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white border-2 border-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold shadow-sm">
                            {selectedClient.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{selectedClient.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedClient.type === ClientType.CORPORATE ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                    {selectedClient.type}
                                </span>
                                <span className="text-slate-400 text-sm">•</span>
                                <span className="text-slate-500 text-sm flex items-center gap-1"><MapPin size={12}/> {selectedClient.address || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsModalOpen(true)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"><Edit2 size={18}/></button>
                        <button onClick={() => handleDeleteClient(selectedClient.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 size={18}/></button>
                    </div>
                 </div>

                 {/* Stats */}
                 <div className="grid grid-cols-2 gap-4 p-6 border-b border-gray-100">
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <div className="flex items-center gap-2 text-indigo-700 mb-1 font-medium">
                            <ShoppingBag size={18} />
                            Total Dépensé
                        </div>
                        <div className="text-2xl font-bold text-indigo-900">
                            {selectedClient.totalSpent.toLocaleString()} {CURRENCY_SYMBOL}
                        </div>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-2 text-amber-700 mb-1 font-medium">
                            <Award size={18} />
                            Points Fidélité
                        </div>
                        <div className="text-2xl font-bold text-amber-900">
                            {selectedClient.loyaltyPoints} pts
                        </div>
                        <div className="text-xs text-amber-600 mt-1">
                            Soit {(selectedClient.loyaltyPoints * 10).toLocaleString()} {CURRENCY_SYMBOL} de remise potentielle
                        </div>
                    </div>
                 </div>

                 {/* Contact & Notes */}
                 <div className="p-6 grid grid-cols-2 gap-6 border-b border-gray-100">
                     <div className="space-y-3">
                         <h4 className="font-bold text-slate-700">Coordonnées</h4>
                         <div className="space-y-2 text-sm">
                             <div className="flex items-center gap-2 text-slate-600">
                                 <Mail size={16} className="text-slate-400" /> {selectedClient.email || 'Non renseigné'}
                             </div>
                             <div className="flex items-center gap-2 text-slate-600">
                                 <Phone size={16} className="text-slate-400" /> {selectedClient.phone}
                             </div>
                         </div>
                     </div>
                     <div className="space-y-3">
                         <h4 className="font-bold text-slate-700">Notes Internes</h4>
                         <p className="text-sm text-slate-600 bg-gray-50 p-3 rounded-lg border border-gray-200 italic">
                             {selectedClient.notes || "Aucune note."}
                         </p>
                     </div>
                 </div>

                 {/* Purchase History */}
                 <div className="flex-1 overflow-y-auto p-6">
                     <h4 className="font-bold text-slate-700 mb-4">Historique des Achats</h4>
                     {getClientHistory(selectedClient.id).length === 0 ? (
                         <p className="text-slate-400 italic text-sm">Aucun achat enregistré.</p>
                     ) : (
                         <div className="space-y-3">
                             {getClientHistory(selectedClient.id).map(sale => (
                                 <div key={sale.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-slate-50">
                                     <div>
                                         <div className="font-bold text-slate-700">Achat #{sale.id}</div>
                                         <div className="text-xs text-slate-500">{sale.date}</div>
                                     </div>
                                     <div className="text-right">
                                         <div className="font-bold text-blue-600">{sale.total.toLocaleString()} {CURRENCY_SYMBOL}</div>
                                         <div className="text-xs text-slate-500">{sale.items.length} articles</div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
              </div>
           ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                 <Users size={64} className="opacity-20 mb-4" />
                 <p className="text-lg">Sélectionnez un client pour voir les détails</p>
              </div>
           )}
        </div>
      </div>

      {/* Modal for Add/Edit (Reused for mobile/desktop) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">{selectedClient ? 'Modifier Client' : 'Nouveau Client'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Nom Complet <span className="text-red-500">*</span></label>
                        <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Téléphone <span className="text-red-500">*</span></label>
                            <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Type</label>
                            <select className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as ClientType})}>
                                {Object.values(ClientType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <input type="email" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Adresse</label>
                        <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Notes</label>
                        <textarea className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Préférences, historique..." />
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium">Annuler</button>
                    <button onClick={handleSaveClient} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md">Enregistrer</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CRMView;
