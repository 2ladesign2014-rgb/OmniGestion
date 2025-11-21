
import React, { useState, useMemo } from 'react';
import { Product, CartItem, Category, AppSettings, Client, PaymentDetails, PaymentType, PaymentStatus, PaymentMethod, MobileMoneyProvider } from '../types';
import { Search, Plus, Minus, Trash, ShoppingCart, CreditCard, Tag, ClipboardList, X, User, CheckCircle, DollarSign, Smartphone, Landmark, Banknote, Save } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';

interface POSViewProps {
  inventory: Product[];
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  onCheckout: (items: CartItem[], client?: Client, paymentDetails?: PaymentDetails) => void;
  onSaveOrder: (items: CartItem[], clientName: string) => void;
  settings: AppSettings;
}

const POSView: React.FC<POSViewProps> = ({ inventory, clients, setClients, onCheckout, onSaveOrder, settings }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amountPaid, setAmountPaid] = useState<string>(''); // For calculating change
  
  // Additional Payment Details
  const [mobileProvider, setMobileProvider] = useState<MobileMoneyProvider>(MobileMoneyProvider.ORANGE_MONEY);
  const [bankName, setBankName] = useState('');
  const [checkNumber, setCheckNumber] = useState('');

  // Client Creation State (Quick Add)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  const filteredProducts = inventory.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Check stock limit
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          // Check stock limit for increase
          const product = inventory.find(p => p.id === productId);
          if (product && newQuantity > product.stock) return item; 
          
          return { ...item, quantity: Math.max(1, newQuantity) };
        }
        return item;
      });
    });
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => {
       let itemPrice = item.price;
       if (item.promotionalPrice && item.promotionalPrice > 0) {
           itemPrice = item.promotionalPrice;
       } else if (item.discount) {
           itemPrice = item.price * (1 - item.discount / 100);
       }
       return sum + (itemPrice * item.quantity);
    }, 0);
    return subtotal * (1 + (settings.taxRate || 0) / 100);
  };

  const handleFinalizePayment = () => {
      const details: PaymentDetails = {
          type: PaymentType.IMMEDIATE,
          status: PaymentStatus.VALIDATED,
          method: paymentMethod,
          mobileProvider: paymentMethod === PaymentMethod.MOBILE_MONEY ? mobileProvider : undefined,
          bankName: (paymentMethod === PaymentMethod.BANK_TRANSFER || paymentMethod === PaymentMethod.CHECK) ? bankName : undefined,
          checkNumber: paymentMethod === PaymentMethod.CHECK ? checkNumber : undefined
      };

      onCheckout(cart, selectedClient || undefined, details);
      setCart([]);
      setSelectedClient(null);
      setIsPaymentModalOpen(false);
      setAmountPaid('');
      setPaymentMethod(PaymentMethod.CASH);
      setBankName('');
      setCheckNumber('');
  };

  const handleQuickClientAdd = () => {
      if(newClientName && newClientPhone) {
          const newClient: Client = {
              id: Date.now().toString(),
              companyId: '', // Will be set by parent
              name: newClientName,
              phone: newClientPhone,
              email: '',
              type: 'Particulier' as any,
              loyaltyPoints: 0,
              totalSpent: 0
          };
          setClients(prev => [...prev, newClient]);
          setSelectedClient(newClient);
          setIsClientModalOpen(false);
          setNewClientName('');
          setNewClientPhone('');
      }
  };

  const totalAmount = calculateTotal();
  const changeAmount = amountPaid ? parseFloat(amountPaid) - totalAmount : 0;

  // Helper to show summary before validation
  const renderPaymentSummary = () => {
    let detailText = '';
    if (paymentMethod === PaymentMethod.MOBILE_MONEY) detailText = `via ${mobileProvider}`;
    if (paymentMethod === PaymentMethod.BANK_TRANSFER) detailText = `Banque: ${bankName || 'Non renseignée'}`;
    if (paymentMethod === PaymentMethod.CHECK) detailText = `Chèque: ${checkNumber || 'N/A'} (${bankName || 'Banque N/A'})`;

    return (
        <div className="text-xs text-slate-500 text-center mt-2 mb-1">
            Confirmer paiement par <span className="font-bold text-slate-700">{paymentMethod}</span> {detailText && <span className="font-bold text-blue-600">{detailText}</span>}
        </div>
    );
  };

  return (
    <div className="flex h-full flex-col lg:flex-row bg-gray-100 overflow-hidden">
      {/* Left Panel: Products */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-4 bg-white border-b border-gray-200 shadow-sm z-10">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Scanner ou rechercher..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">Tout</option>
              {Object.values(Category).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => product.stock > 0 && addToCart(product)}
              className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${product.stock === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                 <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-md font-bold uppercase">{product.category}</span>
                 {product.stock < 5 && product.stock > 0 && <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-1 rounded-md font-bold">Faible Stock</span>}
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2 h-10">{product.name}</h3>
              <div className="mt-auto pt-2 flex justify-between items-center">
                 <div className="flex flex-col">
                    {product.promotionalPrice && product.promotionalPrice > 0 ? (
                        <>
                            <span className="text-xs text-gray-400 line-through">{product.price.toLocaleString()}</span>
                            <span className="font-bold text-emerald-600">{product.promotionalPrice.toLocaleString()} {CURRENCY_SYMBOL}</span>
                        </>
                    ) : (
                        <span className="font-bold text-blue-600">{product.price.toLocaleString()} {CURRENCY_SYMBOL}</span>
                    )}
                 </div>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${product.stock > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Plus size={18} />
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Cart */}
      <div className="w-full lg:w-[400px] bg-white border-l border-gray-200 flex flex-col h-full shadow-xl z-20">
        {/* Client Selector */}
        <div className="p-4 border-b border-gray-100 bg-slate-50">
            <div className="flex justify-between items-center mb-2">
                 <h3 className="font-bold text-slate-700 flex items-center gap-2">
                     <User size={18} /> Client
                 </h3>
                 <button onClick={() => setIsClientModalOpen(true)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 font-medium flex items-center gap-1">
                     <Plus size={12}/> Nouveau
                 </button>
            </div>
            <select 
                className="w-full p-2 border border-gray-200 rounded-lg bg-white text-sm mb-2"
                value={selectedClient?.id || ''}
                onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value) || null)}
            >
                <option value="">Client de passage (Anonyme)</option>
                {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
            {selectedClient && (
                <div className="flex justify-between text-xs text-slate-500 bg-white p-2 rounded border border-gray-200">
                    <span>Points Fidélité: <strong>{selectedClient.loyaltyPoints}</strong></span>
                    <span>Type: {selectedClient.type}</span>
                </div>
            )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="mb-2 opacity-20" />
              <p>Panier vide</p>
            </div>
          ) : (
            cart.map((item) => {
              let displayPrice = item.price;
              if(item.promotionalPrice && item.promotionalPrice > 0) displayPrice = item.promotionalPrice;
              else if(item.discount) displayPrice = item.price * (1 - item.discount/100);

              return (
                <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                    <div className="flex-1">
                        <h4 className="font-medium text-slate-800 text-sm line-clamp-1">{item.name}</h4>
                        <div className="text-xs text-slate-500">
                            {displayPrice.toLocaleString()} {CURRENCY_SYMBOL} 
                            {item.discount && !item.promotionalPrice && <span className="ml-1 text-red-500">(-{item.discount}%)</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded shadow-sm"><Minus size={14}/></button>
                        <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded shadow-sm"><Plus size={14}/></button>
                    </div>
                    <div className="font-bold text-slate-700 text-sm w-20 text-right">
                        {(displayPrice * item.quantity).toLocaleString()}
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600"><X size={16}/></button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Totals */}
        <div className="p-6 bg-slate-50 border-t border-gray-200 space-y-4">
            <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-500">
                    <span>Sous-total</span>
                    <span>{(totalAmount / (1 + (settings.taxRate/100))).toLocaleString(undefined, {maximumFractionDigits: 0})} {CURRENCY_SYMBOL}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                    <span>TVA ({settings.taxRate}%)</span>
                    <span>{(totalAmount - (totalAmount / (1 + (settings.taxRate/100)))).toLocaleString(undefined, {maximumFractionDigits: 0})} {CURRENCY_SYMBOL}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-slate-800 pt-2 border-t border-gray-200">
                    <span>Total TTC</span>
                    <span>{totalAmount.toLocaleString()} {CURRENCY_SYMBOL}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button 
                    disabled={cart.length === 0}
                    onClick={() => onSaveOrder(cart, selectedClient?.name || 'Client de passage')}
                    className="flex flex-col items-center justify-center py-3 bg-white border border-blue-200 text-blue-700 rounded-xl font-bold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ClipboardList size={20} className="mb-1" />
                    <span className="text-xs">Devis / Commande</span>
                </button>
                <button 
                    disabled={cart.length === 0}
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="flex flex-col items-center justify-center py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transition-colors"
                >
                    <CreditCard size={20} className="mb-1" />
                    <span className="text-xs">Payer Maintenant</span>
                </button>
            </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Quick Add Client Modal */}
      {isClientModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                  <h3 className="font-bold text-lg mb-4">Nouveau Client Rapide</h3>
                  <input 
                      type="text" 
                      placeholder="Nom du client" 
                      className="w-full p-2 border border-gray-200 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                  />
                  <input 
                      type="tel" 
                      placeholder="Téléphone" 
                      className="w-full p-2 border border-gray-200 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                  />
                  <div className="flex gap-3">
                      <button onClick={() => setIsClientModalOpen(false)} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg">Annuler</button>
                      <button onClick={handleQuickClientAdd} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium">Créer</button>
                  </div>
              </div>
          </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-100 bg-slate-50 rounded-t-2xl flex justify-between items-center">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800">Encaissement</h2>
                          <p className="text-slate-500">Total à payer : <span className="font-bold text-blue-600">{totalAmount.toLocaleString()} {CURRENCY_SYMBOL}</span></p>
                      </div>
                      <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                      {/* Methods */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                              { id: PaymentMethod.CASH, icon: Banknote, label: 'Espèces' },
                              { id: PaymentMethod.MOBILE_MONEY, icon: Smartphone, label: 'Mobile Money' },
                              { id: PaymentMethod.CARD, icon: CreditCard, label: 'Carte' },
                              { id: PaymentMethod.CHECK, icon: ClipboardList, label: 'Chèque' },
                          ].map((m) => (
                              <button
                                  key={m.id}
                                  onClick={() => setPaymentMethod(m.id)}
                                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${paymentMethod === m.id ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-inner' : 'border-gray-200 hover:bg-gray-50'}`}
                              >
                                  <m.icon size={24} className="mb-2" />
                                  <span className="text-xs font-bold">{m.label}</span>
                              </button>
                          ))}
                      </div>

                      {/* Dynamic Fields based on Method */}
                      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
                          {paymentMethod === PaymentMethod.CASH && (
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-2">Montant Reçu</label>
                                  <input 
                                      type="number" 
                                      className="w-full p-3 text-lg border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                      placeholder="0"
                                      value={amountPaid}
                                      onChange={(e) => setAmountPaid(e.target.value)}
                                      autoFocus
                                  />
                                  {amountPaid && parseFloat(amountPaid) >= totalAmount && (
                                      <div className="mt-4 p-4 bg-emerald-100 text-emerald-800 rounded-lg text-center animate-pulse">
                                          <p className="text-sm font-bold uppercase">Monnaie à rendre</p>
                                          <p className="text-3xl font-bold">{changeAmount.toLocaleString()} {CURRENCY_SYMBOL}</p>
                                      </div>
                                  )}
                              </div>
                          )}

                          {paymentMethod === PaymentMethod.MOBILE_MONEY && (
                              <div className="space-y-4">
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-2">Opérateur</label>
                                      <div className="grid grid-cols-3 gap-2">
                                          {[MobileMoneyProvider.ORANGE_MONEY, MobileMoneyProvider.WAVE, MobileMoneyProvider.MTN_MONEY, MobileMoneyProvider.MOOV_MONEY].map(p => (
                                              <button 
                                                key={p} 
                                                onClick={() => setMobileProvider(p)}
                                                className={`py-2 px-3 rounded-lg text-xs font-bold border ${mobileProvider === p ? 'bg-orange-100 border-orange-500 text-orange-700' : 'bg-white border-gray-200'}`}
                                              >
                                                  {p}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-2">Référence Transaction (Optionnel)</label>
                                      <input type="text" className="w-full p-3 border border-gray-200 rounded-lg bg-white" placeholder="Ex: ID Transaction..." />
                                  </div>
                              </div>
                          )}

                          {(paymentMethod === PaymentMethod.CHECK || paymentMethod === PaymentMethod.BANK_TRANSFER) && (
                              <div className="space-y-4">
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-2">Banque</label>
                                      <input 
                                          type="text" 
                                          className="w-full p-3 border border-gray-200 rounded-lg bg-white" 
                                          placeholder="Ex: SGBS, Ecobank..." 
                                          value={bankName}
                                          onChange={(e) => setBankName(e.target.value)}
                                      />
                                  </div>
                                  {paymentMethod === PaymentMethod.CHECK && (
                                      <div>
                                          <label className="block text-sm font-bold text-slate-700 mb-2">Numéro Chèque</label>
                                          <input 
                                              type="text" 
                                              className="w-full p-3 border border-gray-200 rounded-lg bg-white" 
                                              placeholder="Ex: 1234567" 
                                              value={checkNumber}
                                              onChange={(e) => setCheckNumber(e.target.value)}
                                          />
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 bg-white rounded-b-2xl">
                      {renderPaymentSummary()}
                      <button 
                          onClick={handleFinalizePayment}
                          disabled={paymentMethod === PaymentMethod.CASH && (!amountPaid || parseFloat(amountPaid) < totalAmount)}
                          className="w-full py-4 bg-emerald-600 text-white font-bold text-lg rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                          <CheckCircle size={24} />
                          Valider le Paiement
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default POSView;
