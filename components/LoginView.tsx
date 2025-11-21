
import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, User as UserIcon, Lock, ArrowRight, Building2 } from 'lucide-react';
import { MOCK_COMPANIES } from '../constants';

interface LoginViewProps {
  onLogin: (user: User) => void;
  users?: User[]; // Accept dynamic users list
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, users = [] }) => {
  // Fallback to safe default if users is empty, though App.tsx provides MOCK_USERS initially
  const userList = users.length > 0 ? users : [];
  const [selectedUser, setSelectedUser] = useState<string>(userList[0]?.id || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = userList.find(u => u.id === selectedUser);

    if (!user) {
        setError('Utilisateur introuvable.');
        return;
    }

    // Check password if user has one, otherwise fallback to length check (legacy/mock)
    if (user.password && user.password.length > 0) {
        if (password !== user.password) {
            setError('Mot de passe incorrect.');
            return;
        }
    } else if (password.length < 4) {
      setError('Le mot de passe doit contenir au moins 4 caractères');
      return;
    }

    onLogin(user);
  };

  const getUserCompanyLabel = (user: User) => {
      if(user.companyId) {
          const company = MOCK_COMPANIES.find(c => c.id === user.companyId);
          return company ? ` - ${company.name}` : '';
      }
      return ' - Accès Global';
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 bg-slate-50 border-b border-gray-100 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <Building2 className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">OmniGestion</h1>
          <p className="text-slate-500 mt-1">Plateforme de Gestion Universelle</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Sélectionner un compte</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <select 
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white appearance-none cursor-pointer transition-all hover:border-indigo-300"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  {userList.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role}){getUserCompanyLabel(user)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="password" 
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <p className="text-xs text-gray-400 italic">Mot de passe par défaut: "123" ou "admin"</p>
            </div>

            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Connexion</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={14} />
              <span>Business Enterprise Solution v3.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
