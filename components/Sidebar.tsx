
import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, FileText, Bot, Settings, LogOut, Truck, ClipboardList, Users, Wallet, LayoutGrid } from 'lucide-react';
import { User, UserRole, Company } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void; // Now used to navigate
  currentUser: User | null;
  currentCompany?: Company;
  onLogout: () => void;
  onSwitchCompany?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, currentUser, currentCompany, onLogout, onSwitchCompany }) => {
  
  const allMenuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES, UserRole.INVENTORY_MANAGER] },
    { id: 'pos', label: 'Point de Vente', icon: ShoppingCart, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES] },
    { id: 'crm', label: 'Clients (CRM)', icon: Users, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES] },
    { id: 'orders', label: 'Commandes', icon: ClipboardList, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES] },
    { id: 'inventory', label: 'Inventaire', icon: Package, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER] },
    { id: 'suppliers', label: 'Fournisseurs', icon: Truck, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER] },
    { id: 'treasury', label: 'Trésorerie', icon: Wallet, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    { id: 'invoices', label: 'Factures', icon: FileText, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES, UserRole.INVENTORY_MANAGER] },
    { id: 'assistant', label: 'Assistant IA', icon: Bot, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  ];

  const visibleMenuItems = allMenuItems.filter(item => 
    currentUser && item.roles.includes(currentUser.role)
  );

  const themeColor = currentCompany?.themeColor || 'blue';
  
  const getButtonClass = (isActive: boolean) => {
      return `w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
        isActive
          ? `bg-${themeColor}-600 text-white shadow-md translate-x-1 font-medium`
          : 'text-slate-400 hover:bg-slate-800 hover:text-white font-normal'
      }`;
  };

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col shadow-2xl z-10">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center space-x-3 mb-1">
          <div className={`w-8 h-8 bg-${themeColor}-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-inner`}>
             {currentCompany?.logo ? <img src={currentCompany.logo} className="w-full h-full rounded-lg object-cover"/> : (currentCompany?.name.charAt(0) || 'O')}
          </div>
          <div className="overflow-hidden">
             <h1 className="font-bold tracking-tight truncate text-lg" title={currentCompany?.name}>{currentCompany?.name || 'OmniGestion'}</h1>
          </div>
        </div>
        {onSwitchCompany && (
            <button 
                onClick={onSwitchCompany}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mt-2 transition-colors w-full group"
            >
                <LayoutGrid size={12} className="group-hover:text-blue-400"/> Changer d'entreprise
            </button>
        )}
      </div>

      {currentUser && (
        <div className="p-4 mx-3 mt-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-${themeColor}-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md border border-slate-600`}>
            {currentUser.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
             <p className="text-sm font-bold text-slate-200 truncate">{currentUser.name}</p>
             <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider truncate">{currentUser.role}</p>
          </div>
        </div>
      )}

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={getButtonClass(isActive)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPER_ADMIN) && (
          <button 
            onClick={() => setCurrentView('settings')}
            className={getButtonClass(currentView === 'settings')}
          >
            <Settings size={20} />
            <span>Paramètres</span>
          </button>
        )}
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
