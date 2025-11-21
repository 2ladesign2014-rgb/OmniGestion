
import React, { useState, useRef, useEffect } from 'react';
import { Product, Category } from '../types';
import { Search, Filter, Plus, Edit2, Trash2, Package, X, Bold, Italic, Underline, List, Save, ArrowUp, ArrowDown, ArrowUpDown, Tag, AlertTriangle, Percent, DollarSign, HelpCircle } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';

interface InventoryViewProps {
  inventory: Product[];
  setInventory: React.Dispatch<React.SetStateAction<Product[]>>;
}

// Simple Rich Text Editor Component
const RichTextEditor = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize content only once when mounting (or when reset) to avoid cursor jumping issues
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
        // Only set if empty to avoid overwriting user typing in a controlled loop scenario
        if (value === '') {
            editorRef.current.innerHTML = '';
        }
    }
  }, [value]);

  const exec = (command: string) => {
    document.execCommand(command, false, undefined);
    if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-all">
      <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-gray-200">
         <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} className="p-1.5 hover:bg-gray-200 rounded text-slate-600" title="Gras"><Bold size={16} /></button>
         <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} className="p-1.5 hover:bg-gray-200 rounded text-slate-600" title="Italique"><Italic size={16} /></button>
         <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('underline'); }} className="p-1.5 hover:bg-gray-200 rounded text-slate-600" title="Souligné"><Underline size={16} /></button>
         <div className="w-px h-4 bg-gray-300 mx-2" />
         <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }} className="p-1.5 hover:bg-gray-200 rounded text-slate-600" title="Liste à puces"><List size={16} /></button>
      </div>
      <div
        ref={editorRef}
        className="flex-1 p-3 outline-none min-h-[150px] overflow-y-auto text-sm text-slate-700 prose prose-sm max-w-none"
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onBlur={(e) => onChange(e.currentTarget.innerHTML)}
      />
    </div>
  );
};

const InventoryView: React.FC<InventoryViewProps> = ({ inventory, setInventory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Sorting State
  const [sortKey, setSortKey] = useState<'name' | 'price' | 'stock'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPriceConflict, setShowPriceConflict] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    category: Category.GENERAL,
    name: '',
    price: 0,
    purchaseCost: 0,
    stock: 0,
    description: '',
    image: '',
    discount: 0,
    promotionalPrice: 0
  });

  const handleSort = (key: 'name' | 'price' | 'stock') => {
    if (sortKey === key) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortDirection('asc');
    }
  };

  const filteredProducts = inventory.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group products by category
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
        acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Sort categories to display (can use Enum order or alphabetical)
  const sortedCategories = Object.keys(groupedProducts).sort();

  const getStockStatus = (stock: number) => {
    if (stock === 0) return (
      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center justify-center gap-1">
        <AlertTriangle size={12} /> Rupture
      </span>
    );
    if (stock < 5) return (
      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center justify-center gap-1">
        <AlertTriangle size={12} /> Faible
      </span>
    );
    return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">En Stock</span>;
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleOpenEdit = (product: Product) => {
      setNewProduct(product);
      setEditingId(product.id);
      setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
      setEditingId(null);
      setNewProduct({
        category: Category.GENERAL,
        name: '',
        price: 0,
        purchaseCost: 0,
        stock: 0,
        description: '',
        image: '',
        discount: 0,
        promotionalPrice: 0
      });
      setIsModalOpen(true);
  };

  const finalizeSave = (productData: Partial<Product>) => {
    if (editingId) {
        // Update existing
        setInventory(prev => prev.map(p => p.id === editingId ? { ...p, ...productData, id: editingId } as Product : p));
    } else {
        // Create new
        const product: Product = {
            id: Date.now().toString(),
            companyId: '', // Handled by parent wrapper
            name: productData.name!,
            category: productData.category as Category,
            price: Number(productData.price),
            purchaseCost: Number(productData.purchaseCost) || 0,
            stock: Number(productData.stock),
            description: productData.description || '',
            image: productData.image,
            discount: Number(productData.discount) || 0,
            promotionalPrice: Number(productData.promotionalPrice) || 0
        };
        setInventory(prev => [...prev, product]);
    }

    setIsModalOpen(false);
    setEditingId(null);
    setNewProduct({
        category: Category.GENERAL,
        name: '',
        price: 0,
        purchaseCost: 0,
        stock: 0,
        description: '',
        image: '',
        discount: 0,
        promotionalPrice: 0
    });
  };

  const handleSaveProduct = () => {
    if (!newProduct.name || !newProduct.price) {
        alert("Veuillez remplir au moins le nom et le prix.");
        return;
    }

    // Check for price conflict
    if (Number(newProduct.discount) > 0 && Number(newProduct.promotionalPrice) > 0) {
        setShowPriceConflict(true);
        return;
    }

    finalizeSave(newProduct);
  };

  const resolveConflict = (preference: 'discount' | 'promo') => {
    const resolvedProduct = { ...newProduct };
    if (preference === 'discount') {
        resolvedProduct.promotionalPrice = 0;
    } else {
        resolvedProduct.discount = 0;
    }
    finalizeSave(resolvedProduct);
    setShowPriceConflict(false);
  };

  const confirmDeleteProduct = () => {
    if (productToDelete) {
      setInventory(prev => prev.filter(p => p.id !== productToDelete));
      setProductToDelete(null);
    }
  };

  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto bg-gray-50 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventaire</h2>
          <p className="text-slate-500">Gérez vos produits, stocks et prix.</p>
        </div>
        <button 
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={18} />
          <span>Nouveau Produit</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher un produit (nom, réf...)"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative md:w-64">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Filter size={18} className="text-gray-500"/>
            </div>
            <select
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
            >
                <option value="All">Toutes les catégories</option>
                {Object.values(Category).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                {/* Product Name Header */}
                <th 
                  className="p-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Produit
                    {sortKey === 'name' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
                    ) : (
                      <ArrowUpDown size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                
                <th className="p-4 font-semibold">Catégorie</th>
                
                {/* Price Header */}
                <th 
                  className="p-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors select-none group text-right"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Prix Unit.
                    {sortKey === 'price' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
                    ) : (
                      <ArrowUpDown size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>

                {/* Stock Header */}
                <th 
                  className="p-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors select-none group text-center"
                  onClick={() => handleSort('stock')}
                >
                   <div className="flex items-center justify-center gap-2">
                    Stock
                    {sortKey === 'stock' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
                    ) : (
                      <ArrowUpDown size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>

                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedCategories.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Aucun produit trouvé pour cette recherche.
                  </td>
                </tr>
              )}
              
              {sortedCategories.map(category => {
                 // Sort products within category based on current sort settings
                 const products = groupedProducts[category].sort((a, b) => {
                    let comparison = 0;
                    if (sortKey === 'name') {
                        comparison = a.name.localeCompare(b.name);
                    } else if (sortKey === 'price') {
                        comparison = a.price - b.price;
                    } else if (sortKey === 'stock') {
                        comparison = a.stock - b.stock;
                    }
                    return sortDirection === 'asc' ? comparison : -comparison;
                 });

                 return (
                    <React.Fragment key={category}>
                        <tr className="bg-gray-50/80 border-y border-gray-200">
                            <td colSpan={5} className="px-4 py-2 font-bold text-slate-700 text-sm uppercase tracking-wide">
                                {category} ({products.length})
                            </td>
                        </tr>
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-blue-50/50 transition-colors group">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 group-hover:border-blue-200 group-hover:text-blue-500 transition-colors">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-slate-800 flex items-center gap-2">
                                        {product.name}
                                        {product.stock < 5 && (
                                          <div className="relative group/tooltip">
                                              <AlertTriangle size={16} className={`${product.stock === 0 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`} />
                                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-slate-800 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                  {product.stock === 0 ? 'Rupture de stock' : 'Stock critique (< 5)'}
                                              </span>
                                          </div>
                                        )}
                                        {product.promotionalPrice && product.promotionalPrice > 0 ? (
                                            <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                                                <Tag size={10} /> PROMO
                                            </span>
                                        ) : product.discount ? (
                                            <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                                                -{product.discount}%
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate max-w-[200px]" title={stripHtml(product.description)}>
                                        {stripHtml(product.description)}
                                    </div>
                                </div>
                                </div>
                            </td>
                            <td className="p-4 text-sm text-slate-600">
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium border border-gray-200">
                                    {product.category}
                                </span>
                            </td>
                            <td className="p-4 text-right font-medium text-slate-800">
                                {product.promotionalPrice && product.promotionalPrice > 0 ? (
                                    <div>
                                        <span className="text-xs text-gray-400 line-through block">{product.price.toLocaleString()}</span>
                                        <span className="text-emerald-600 font-bold">
                                            {product.promotionalPrice.toLocaleString()} {CURRENCY_SYMBOL}
                                        </span>
                                    </div>
                                ) : product.discount ? (
                                    <div>
                                        <span className="text-xs text-gray-400 line-through block">{product.price.toLocaleString()}</span>
                                        <span className="text-red-600">
                                            {(product.price * (1 - product.discount / 100)).toLocaleString()} {CURRENCY_SYMBOL}
                                        </span>
                                    </div>
                                ) : (
                                    <span>{product.price.toLocaleString()} {CURRENCY_SYMBOL}</span>
                                )}
                            </td>
                            <td className="p-4 text-center">
                                {getStockStatus(product.stock)}
                                <div className="text-xs text-gray-400 mt-1">{product.stock} unités</div>
                            </td>
                            <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleOpenEdit(product)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    onClick={() => setProductToDelete(product.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                                </div>
                            </td>
                            </tr>
                        ))}
                    </React.Fragment>
                 );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmer la suppression</h3>
              <p className="text-slate-600 mb-6">
                Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible et retirera le produit de l'inventaire.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-slate-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmDeleteProduct}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price Conflict Modal */}
      {showPriceConflict && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95 duration-200">
             <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-5">
                      <HelpCircle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Conflit de Tarification</h3>
                  <p className="text-slate-500 mb-6">
                      Vous avez saisi à la fois une <span className="font-bold text-slate-700">remise en pourcentage ({newProduct.discount}%)</span> et un <span className="font-bold text-slate-700">prix promotionnel fixe ({newProduct.promotionalPrice} {CURRENCY_SYMBOL})</span>. 
                      Veuillez choisir quelle règle de prix prioriser pour ce produit.
                  </p>

                  <div className="flex flex-col gap-3">
                      <button 
                          onClick={() => resolveConflict('promo')}
                          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                      >
                          <Tag size={18} />
                          Utiliser le Prix Promo ({newProduct.promotionalPrice} {CURRENCY_SYMBOL})
                      </button>
                      <button 
                          onClick={() => resolveConflict('discount')}
                          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                      >
                          <Percent size={18} />
                          Utiliser la Remise ({newProduct.discount}%)
                      </button>
                      <button 
                          onClick={() => setShowPriceConflict(false)}
                          className="w-full py-3 px-4 text-slate-500 hover:bg-slate-50 rounded-xl font-medium transition-all"
                      >
                          Annuler et modifier
                      </button>
                  </div>
             </div>
          </div>
      )}

      {/* New/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4 transition-all">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Modifier Produit' : 'Nouveau Produit'}</h3>
                        <p className="text-sm text-slate-500">{editingId ? 'Mettre à jour les informations' : 'Ajouter un nouvel article à l\'inventaire'}</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(false)} 
                        className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Nom du produit <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                value={newProduct.name}
                                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                                placeholder="Ex: HP EliteBook 840 G5"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Catégorie</label>
                             <select
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition"
                                value={newProduct.category}
                                onChange={(e) => setNewProduct({...newProduct, category: e.target.value as Category})}
                            >
                                {Object.values(Category).map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    {/* Pricing & Stock */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Prix Vente ({CURRENCY_SYMBOL}) <span className="text-red-500">*</span></label>
                            <input 
                                type="number" 
                                min="0"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                value={newProduct.price || ''}
                                onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                                placeholder="0"
                            />
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                Coût Achat ({CURRENCY_SYMBOL})
                                <span className="text-xs text-slate-400 font-normal">(Est.)</span>
                            </label>
                            <input 
                                type="number" 
                                min="0"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50"
                                value={newProduct.purchaseCost || ''}
                                onChange={e => setNewProduct({...newProduct, purchaseCost: parseFloat(e.target.value)})}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-medium text-slate-700">Stock Initial</label>
                            <input 
                                type="number" 
                                min="0"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                value={newProduct.stock || ''}
                                onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                                placeholder="0"
                            />
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                Remise (%)
                                <Percent size={12} className="text-slate-400" />
                            </label>
                            <input 
                                type="number" 
                                min="0"
                                max="100"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                value={newProduct.discount || ''}
                                onChange={e => setNewProduct({...newProduct, discount: parseFloat(e.target.value)})}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1 text-emerald-600">
                                Prix Promo Spécial ({CURRENCY_SYMBOL})
                                <Tag size={12} />
                            </label>
                            <input 
                                type="number" 
                                min="0"
                                className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-emerald-50/30"
                                value={newProduct.promotionalPrice || ''}
                                onChange={e => setNewProduct({...newProduct, promotionalPrice: parseFloat(e.target.value)})}
                                placeholder="Optionnel - Écrase le prix standard"
                            />
                        </div>
                    </div>

                    {/* Rich Description */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="text-sm font-medium text-slate-700">Description Détaillée</label>
                            <span className="text-xs text-slate-400">Mise en forme disponible</span>
                        </div>
                        <RichTextEditor 
                            value={newProduct.description || ''} 
                            onChange={(val) => setNewProduct({...newProduct, description: val})} 
                        />
                        <p className="text-xs text-slate-400">Utilisez la barre d'outils pour mettre en gras, italique, ou créer des listes.</p>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                    <button 
                        onClick={() => setIsModalOpen(false)} 
                        className="px-5 py-2.5 text-slate-600 font-medium hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleSaveProduct} 
                        className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition flex items-center gap-2"
                    >
                        <Save size={18} />
                        {editingId ? 'Mettre à jour' : 'Enregistrer le produit'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
