
import { Category, Product, Sale, Supplier, Client, ClientType, Expense, ExpenseCategory, Company, User, UserRole } from './types';

// --- MOCK COMPANIES ---
export const MOCK_COMPANIES: Company[] = [
  {
    id: '1',
    name: 'Global Tech Solutions',
    address: 'Av. de la République, Dakar',
    phone: '+221 33 800 00 00',
    email: 'contact@globaltech.sn',
    taxRate: 18,
    currencySymbol: 'FCFA',
    footerMessage: 'Le meilleur de la technologie. Garantie 1 an sur tout matériel neuf.',
    themeColor: 'blue',
    settingsPin: '1234'
  },
  {
    id: '2',
    name: 'Élégance Boutique',
    address: 'Rue des Jardins, Abidjan',
    phone: '+225 27 22 00 00',
    email: 'info@elegance.ci',
    taxRate: 0, // Pas de TVA pour exemple
    currencySymbol: 'FCFA',
    footerMessage: 'La mode, votre style. Échange possible sous 7 jours.',
    themeColor: 'pink',
    settingsPin: '0000'
  }
];

// --- MOCK USERS ---
export const MOCK_USERS: User[] = [
  { id: '0', name: 'Admin Système', username: 'superadmin', role: UserRole.SUPER_ADMIN, password: 'admin' },
  { id: '1', companyId: '1', name: 'Moussa Diop', username: 'manager_tech', role: UserRole.ADMIN, password: '123' },
  { id: '2', companyId: '1', name: 'Awa Fall', username: 'vente_tech', role: UserRole.SALES, password: '123' },
  { id: '3', companyId: '2', name: 'Sarah Koné', username: 'manager_mode', role: UserRole.ADMIN, password: '123' },
  { id: '4', companyId: '2', name: 'Jean Kouassi', username: 'vente_mode', role: UserRole.SALES, password: '123' },
];


export const MOCK_INVENTORY: Product[] = [
  // --- COMPANY 1 PRODUCTS (Tech) ---
  {
    id: '1',
    companyId: '1',
    name: 'HP EliteDesk 800 G5',
    category: Category.ELECTRONICS,
    price: 450000,
    purchaseCost: 350000,
    stock: 12,
    description: 'Intel Core i7, 16GB RAM, 512GB SSD, Win 10 Pro',
    discount: 0
  },
  {
    id: '2',
    companyId: '1',
    name: 'MacBook Air M2',
    category: Category.ELECTRONICS,
    price: 950000,
    purchaseCost: 800000,
    stock: 5,
    description: 'Puce M2, 8GB RAM, 256GB SSD, Gris Sidéral',
    discount: 0
  },
  {
    id: '3',
    companyId: '1',
    name: 'Installation Système & Logiciels',
    category: Category.SERVICES,
    price: 15000,
    stock: 999, // Service
    description: 'Formatage, installation Windows/Office, Antivirus',
    discount: 0
  },
  
  // --- COMPANY 2 PRODUCTS (Mode/Retail) ---
  {
    id: '201',
    companyId: '2',
    name: 'Robe Soirée Satin',
    category: Category.FASHION,
    price: 45000,
    purchaseCost: 20000,
    stock: 8,
    description: 'Robe longue en satin rouge, Taille M/L',
    discount: 0
  },
  {
    id: '202',
    companyId: '2',
    name: 'Escarpins Cuir Noir',
    category: Category.FASHION,
    price: 35000,
    purchaseCost: 15000,
    stock: 12,
    description: 'Talons 10cm, Cuir véritable',
    discount: 10
  },
  {
    id: '203',
    companyId: '2',
    name: 'Parfum "Essence d\'Or"',
    category: Category.BEAUTY_HEALTH,
    price: 60000,
    purchaseCost: 30000,
    stock: 20,
    description: 'Eau de parfum 100ml',
    discount: 0
  },
];

export const MOCK_SALES: Sale[] = [
  {
    id: '1001',
    companyId: '1',
    date: new Date(Date.now() - 172800000).toLocaleString(), 
    items: [
      { ...MOCK_INVENTORY[0], quantity: 1, discount: 5 }
    ],
    total: 427500,
    clientId: '1'
  },
  {
    id: '2001',
    companyId: '2',
    date: new Date().toLocaleString(), 
    items: [
      { ...MOCK_INVENTORY[3], quantity: 2, discount: 0 } // Robes
    ],
    total: 90000,
    clientId: '3'
  }
];

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: '1',
    companyId: '1',
    name: 'Global Tech Distribution',
    contactName: 'Jean Dupont',
    email: 'j.dupont@globaltech.com',
    phone: '+221 77 123 45 67',
    address: 'Zone Industrielle, Dakar',
    suppliedProductIds: ['1', '2'],
    lastOrderDate: '2023-10-15',
    nextDeliveryDate: '2023-11-20'
  },
  {
    id: '2',
    companyId: '2',
    name: 'Fashion Import Paris',
    contactName: 'Sophie Martin',
    email: 'contact@fashion-import.fr',
    phone: '+33 6 12 34 56 78',
    address: 'Paris, France',
    suppliedProductIds: ['201', '202'],
    lastOrderDate: '2023-11-01'
  }
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    companyId: '1',
    name: 'Cabinet Avocats & Associés',
    email: 'contact@avocats.sn',
    phone: '+221 33 822 22 22',
    address: 'Plateau, Dakar',
    type: ClientType.CORPORATE,
    loyaltyPoints: 120,
    totalSpent: 4500000,
    notes: 'Client VIP.'
  },
  {
    id: '3',
    companyId: '2',
    name: 'Mme. Aminata Diallo',
    email: 'aminata@gmail.com',
    phone: '+225 07 07 07 07',
    address: 'Cocody, Abidjan',
    type: ClientType.INDIVIDUAL,
    loyaltyPoints: 50,
    totalSpent: 150000
  }
];

export const MOCK_EXPENSES: Expense[] = [
  {
    id: '1',
    companyId: '1',
    date: new Date(Date.now() - 1296000000).toISOString().split('T')[0],
    category: ExpenseCategory.RENT,
    amount: 300000,
    description: 'Loyer Magasin Dakar',
    declaredBy: 'Moussa Diop'
  },
  {
    id: '2',
    companyId: '2',
    date: new Date().toISOString().split('T')[0],
    category: ExpenseCategory.MARKETING,
    amount: 50000,
    description: 'Campagne Facebook Ads',
    declaredBy: 'Sarah Koné'
  }
];

export const CURRENCY_SYMBOL = 'FCFA';
