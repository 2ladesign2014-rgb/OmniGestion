
import React, { useState, useEffect } from 'react';
import { AppSettings, User, UserRole } from '../types';
import { Save, Building, Shield, Database, FileDown, AlertTriangle, CheckCircle, Plus, Edit2, Trash2, X, UserPlus, Key, User as UserIcon, Lock, Unlock, KeyRound } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onExportData: () => void;
  companyUsers: User[];
  onUpdateCompanyUsers: (users: User[]) => void;
  currentCompanyId: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings, onExportData, companyUsers, onUpdateCompanyUsers, currentCompanyId }) => {
  // Authentication State for Settings View
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isSetupMode, setIsSetupMode] = useState(!settings.settingsPin); // True if no PIN is set
  const [pinError, setPinError] = useState('');
  const [newPin, setNewPin] = useState(''); // Used for setup or change

  const [activeTab, setActiveTab] = useState<'general' | 'data' | 'security'>('general');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  // User Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<{
      name: string;
      username: string;
      role: UserRole;
      password?: string;
  }>({
      name: '',
      username: '',
      role: UserRole.SALES,
      password: ''
  });

  // Reset auth state when component mounts or settings change
  useEffect(() => {
     if (!settings.settingsPin) {
         setIsSetupMode(true);
         setIsAuthenticated(false);
     } else {
         setIsSetupMode(false);
         // Require auth every time component mounts/remounts
         setIsAuthenticated(false); 
     }
  }, [settings.settingsPin]); // Depend on pin existence

  const handlePinSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (isSetupMode) {
          if (pinInput.length < 4) {
              setPinError('Le code PIN doit contenir au moins 4 chiffres.');
              return;
          }
          // Save new PIN
          setSettings(prev => ({ ...prev, settingsPin: pinInput }));
          setIsSetupMode(false);
          setIsAuthenticated(true);
          setPinInput('');
      } else {
          // Validate PIN
          if (pinInput === settings.settingsPin) {
              setIsAuthenticated(true);
              setPinInput('');
              setPinError('');
          } else {
              setPinError('Code PIN incorrect.');
              setPinInput('');
          }
      }
  };

  const handleSave = () => {
    setSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleChange = (key: keyof AppSettings, value: string | number) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  // --- User Management Handlers ---
  const handleOpenUserModal = (user?: User) => {
      if (user) {
          setEditingUser(user);
          setUserFormData({
              name: user.name,
              username: user.username,
              role: user.role,
              password: '' // Don't show current password
          });
      } else {
          setEditingUser(null);
          setUserFormData({
              name: '',
              username: '',
              role: UserRole.SALES,
              password: ''
          });
      }
      setIsUserModalOpen(true);
  };

  const handleSaveUser = () => {
      if (!userFormData.name || !userFormData.username) {
          alert("Nom et Identifiant requis.");
          return;
      }
      
      if (editingUser) {
          const updatedUsers = companyUsers.map(u => u.id === editingUser.id ? {
              ...u,
              name: userFormData.name,
              username: userFormData.username,
              role: userFormData.role,
              // Update password only if provided
              ...(userFormData.password ? { password: userFormData.password } : {})
          } : u);
          onUpdateCompanyUsers(updatedUsers);
      } else {
          const newUser: User = {
              id: `user-${Date.now()}`,
              companyId: currentCompanyId,
              name: userFormData.name,
              username: userFormData.username,
              role: userFormData.role,
              avatar: '', // Default
              password: userFormData.password // Set initial password
          };
          onUpdateCompanyUsers([...companyUsers, newUser]);
      }
      setIsUserModalOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
      if (window.confirm("Supprimer cet utilisateur ? Il ne pourra plus se connecter.")) {
          onUpdateCompanyUsers(companyUsers.filter(u => u.id !== userId));
      }
  };

  const handleChangePin = () => {
      if (newPin.length < 4) {
          alert("Le nouveau code PIN doit contenir au moins 4 chiffres.");
          return;
      }
      setSettings(prev => ({...prev, settingsPin: newPin}));
      alert("Nouveau code PIN enregistré.");
      setNewPin('');
  };

  const getRoleColor = (role: UserRole) => {
      switch(role) {
          case UserRole.ADMIN: return 'bg-purple-100 text-purple-700 border-purple-200';
          case UserRole.SUPER_ADMIN: return 'bg-slate-800 text-white border-slate-700';
          case UserRole.SALES: return 'bg-blue-100 text-blue-700 border-blue-200';
          case UserRole.INVENTORY_MANAGER: return 'bg-orange-100 text-orange-700 border-orange-200';
          default: return 'bg-gray-100 text-gray-600';
      }
  };

  // --- LOCK SCREEN RENDER ---
  if (!isAuthenticated) {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center animate-in zoom-in-95 duration-300">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isSetupMode ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                      {isSetupMode ? <KeyRound size={40} /> : <Lock size={40} />}
                  </div>
                  
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                      {isSetupMode ? 'Sécuriser les Paramètres' : 'Accès Restreint'}
                  </h2>
                  <p className="text-slate-500 mb-8">
                      {isSetupMode 
                        ? "Veuillez définir un code PIN pour protéger l'accès à la configuration de l'entreprise." 
                        : "Veuillez entrer votre code PIN pour accéder aux paramètres."}
                  </p>

                  <form onSubmit={handlePinSubmit} className="space-y-4">
                      <input 
                        type="password" 
                        autoFocus
                        inputMode="numeric"
                        placeholder={isSetupMode ? "Créer un code PIN" : "Entrer code PIN"}
                        className="w-full text-center text-2xl tracking-widest font-bold py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                      />
                      {pinError && <p className="text-red-500 text-sm font-medium">{pinError}</p>}
                      
                      <button 
                        type="submit"
                        disabled={pinInput.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {isSetupMode ? 'Définir le PIN' : 'Déverrouiller'}
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  // --- MAIN SETTINGS RENDER ---
  return (
    <div className="p-8 bg-gray-50 h-full overflow-y-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Configuration Entreprise</h2>
            <p className="text-slate-500">Personnalisez votre espace de travail dédié.</p>
        </div>
        <button 
            onClick={() => setIsAuthenticated(false)}
            className="text-slate-400 hover:text-slate-600 flex items-center gap-2 text-sm font-medium"
        >
            <Lock size={16} /> Verrouiller
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Menu */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'general' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Building size={20} />
            <span>Identité & Contact</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'data' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Database size={20} />
            <span>Données Entreprise</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'security' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Shield size={20} />
            <span>Accès & Rôles</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 animate-in fade-in duration-200">
              <h3 className="text-lg font-bold text-slate-800 border-b border-gray-100 pb-4">Informations Légales</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Raison Sociale</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={localSettings.companyName}
                    onChange={e => handleChange('companyName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email Professionnel</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={localSettings.email}
                    onChange={e => handleChange('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Ligne Directe</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={localSettings.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Siège Social</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={localSettings.address}
                    onChange={e => handleChange('address', e.target.value)}
                  />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 border-b border-gray-100 pb-4 pt-4">Préférences de Vente</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Devise (Locale)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-slate-500 cursor-not-allowed"
                    value={localSettings.currencySymbol}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Taux TVA applicable (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={localSettings.taxRate}
                    onChange={e => handleChange('taxRate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-sm font-medium text-slate-700">Pied de page (Factures & Devis)</label>
                  <textarea 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                    value={localSettings.footerMessage}
                    onChange={e => handleChange('footerMessage', e.target.value)}
                    placeholder="Ex: Merci de votre confiance. SIRET: XXXXX..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-6 border-t border-gray-100 gap-4">
                 {isSaved && (
                    <span className="text-emerald-600 text-sm font-medium flex items-center gap-2 animate-pulse">
                        <CheckCircle size={16} /> Profil entreprise mis à jour
                    </span>
                 )}
                 <button 
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2 transition-all"
                 >
                    <Save size={18} />
                    Enregistrer
                 </button>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 animate-in fade-in duration-200">
                <h3 className="text-lg font-bold text-slate-800 border-b border-gray-100 pb-4">Export & Archivage</h3>
                
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                    <FileDown className="text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold text-blue-800">Archive Complète (JSON)</h4>
                        <p className="text-sm text-blue-600 mb-3">Téléchargez l'intégralité des données de <strong>cette entreprise uniquement</strong> (Clients, Stocks, Ventes).</p>
                        <button 
                            onClick={onExportData}
                            className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                            Générer l'archive
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-2">
                        <Database size={16} /> Statistiques Base de Données
                    </h4>
                    <p className="text-xs text-slate-500">Espace utilisé par cette entreprise : ~24 MB</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{width: '15%'}}></div>
                    </div>
                </div>
             </div>
          )}

          {activeTab === 'security' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8 animate-in fade-in duration-200">
                {/* PIN Management Section */}
                <div className="border-b border-gray-100 pb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <KeyRound size={20} className="text-indigo-600"/> Code PIN Paramètres
                    </h3>
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                         <p className="text-sm text-indigo-800 mb-3">Modifiez le code PIN utilisé pour accéder à cette section des paramètres.</p>
                         <div className="flex gap-3 max-w-sm">
                             <input 
                                type="password"
                                inputMode="numeric" 
                                placeholder="Nouveau PIN" 
                                className="flex-1 px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={newPin}
                                onChange={e => setNewPin(e.target.value)}
                             />
                             <button 
                                onClick={handleChangePin}
                                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
                             >
                                 Modifier
                             </button>
                         </div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Gestion des Utilisateurs</h3>
                        <button 
                            onClick={() => handleOpenUserModal()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                        >
                            <UserPlus size={16} /> Ajouter Membre
                        </button>
                    </div>

                    {/* User List */}
                    <div className="overflow-hidden border border-gray-100 rounded-lg">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-slate-600 font-medium">
                                <tr>
                                    <th className="p-4">Nom</th>
                                    <th className="p-4">Identifiant</th>
                                    <th className="p-4">Rôle</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {companyUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold border border-indigo-200">
                                                {user.name.charAt(0)}
                                            </div>
                                            {user.name}
                                        </td>
                                        <td className="p-4 text-slate-600">{user.username}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold border ${getRoleColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleOpenUserModal(user)}
                                                    className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {companyUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-400 italic">
                                            Aucun utilisateur configuré.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3 mt-4">
                        <AlertTriangle className="text-amber-600 mt-1 flex-shrink-0"/>
                        <div>
                            <h4 className="font-bold text-amber-800">Information de Sécurité</h4>
                            <p className="text-sm text-amber-700">
                                Les utilisateurs ajoutés ici auront accès aux données de <strong>cette entreprise uniquement</strong>, selon leur rôle.
                                Le rôle "Administrateur" donne accès à tous les paramètres.
                            </p>
                        </div>
                    </div>
                </div>
              </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      {isUserModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50 rounded-t-2xl">
                      <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                          <UserIcon size={20} />
                          {editingUser ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
                      </h3>
                      <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Nom Complet <span className="text-red-500">*</span></label>
                          <input 
                              type="text" 
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={userFormData.name}
                              onChange={e => setUserFormData({...userFormData, name: e.target.value})}
                              placeholder="Ex: Jean Dupont"
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Identifiant de Connexion <span className="text-red-500">*</span></label>
                          <input 
                              type="text" 
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={userFormData.username}
                              onChange={e => setUserFormData({...userFormData, username: e.target.value})}
                              placeholder="Ex: jean.dupont"
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Rôle <span className="text-red-500">*</span></label>
                          <select 
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={userFormData.role}
                              onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})}
                          >
                              <option value={UserRole.ADMIN}>Administrateur (Accès total)</option>
                              <option value={UserRole.SALES}>Vendeur (Ventes & Clients)</option>
                              <option value={UserRole.INVENTORY_MANAGER}>Gestionnaire Stock (Achats & Inventaire)</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                              <Key size={14} /> Mot de passe
                          </label>
                          <input 
                              type="password" 
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={userFormData.password}
                              onChange={e => setUserFormData({...userFormData, password: e.target.value})}
                              placeholder={editingUser ? "Laisser vide pour ne pas changer" : "Créer un mot de passe"}
                          />
                          {!editingUser && <p className="text-xs text-slate-500">Requis pour la première connexion.</p>}
                      </div>
                  </div>
                  <div className="p-6 border-t border-gray-100 bg-white rounded-b-2xl flex justify-end gap-3">
                      <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium">Annuler</button>
                      <button onClick={handleSaveUser} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-md">
                          {editingUser ? 'Mettre à jour' : 'Créer Utilisateur'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SettingsView;
