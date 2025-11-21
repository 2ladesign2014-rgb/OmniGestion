
export enum Category {
  GENERAL = 'Général / Divers',
  ELECTRONICS = 'Électronique & High-Tech',
  FASHION = 'Mode & Accessoires',
  GROCERY = 'Alimentation & Boissons',
  HOME_GARDEN = 'Maison & Jardin',
  BEAUTY_HEALTH = 'Beauté & Santé',
  SERVICES = 'Prestations de Service',
  AUTOMOTIVE = 'Automobile & Mécanique',
  CONSTRUCTION = 'BTP & Matériaux',
  REAL_ESTATE = 'Immobilier'
}

// --- PAYMENT ENUMS ---

export enum PaymentType {
  IMMEDIATE = 'Paiement Comptant',
  ORDER_DEPOSIT = 'Acompte',
  DELIVERY_PAYMENT = 'Paiement à la Livraison',
  TERM_PAYMENT = 'Paiement à Échéance',
  SUBSCRIPTION = 'Abonnement'
}

export enum PaymentStatus {
  VALIDATED = 'Validé',
  PENDING = 'En attente',
  PARTIAL = 'Partiel',
  CANCELLED = 'Annulé',
  REFUNDED = 'Remboursé'
}

export enum PaymentMethod {
  CASH = 'Espèces',
  MOBILE_MONEY = 'Mobile Money',
  BANK_TRANSFER = 'Virement Bancaire',
  CHECK = 'Chèque',
  CARD = 'Carte Bancaire'
}

export enum MobileMoneyProvider {
  ORANGE_MONEY = 'Orange Money',
  MTN_MONEY = 'MTN Mobile Money',
  WAVE = 'Wave',
  MOOV_MONEY = 'Moov Money',
  AIRTEL_MONEY = 'Airtel Money',
  MPESA = 'M-Pesa',
  OTHER = 'Autre'
}

export interface PaymentDetails {
  type: PaymentType;
  status: PaymentStatus;
  method: PaymentMethod;
  mobileProvider?: MobileMoneyProvider; // Si Mobile Money
  bankName?: string; // Si Chèque ou Virement
  checkNumber?: string; // Si Chèque
}

// --- MULTI-TENANT CORE ---

export interface Company {
  id: string;
  name: string;
  logo?: string; // URL or Base64
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  currencySymbol: string;
  footerMessage: string;
  themeColor?: string; // Pour personnaliser l'UI par entreprise
  settingsPin?: string; // Code PIN pour accéder aux paramètres
}

export interface Product {
  id: string;
  companyId: string; // Tenant Isolation
  name: string;
  category: Category;
  price: number;
  purchaseCost?: number; // Coût d'achat unitaire
  stock: number;
  description: string;
  image?: string;
  discount?: number;
  promotionalPrice?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  companyId: string; // Tenant Isolation
  date: string;
  items: CartItem[];
  total: number;
  clientId?: string;
  clientName?: string;
  paymentInfo?: PaymentDetails; // New payment details
}

export interface Supplier {
  id: string;
  companyId: string; // Tenant Isolation
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  suppliedProductIds: string[];
  lastOrderDate?: string;
  nextDeliveryDate?: string;
}

export interface SupplierInvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
}

export interface SupplierInvoice {
  id: string;
  companyId: string; // Tenant Isolation
  supplierId: string;
  supplierName: string;
  date: string;
  items: SupplierInvoiceItem[];
  totalAmount: number;
  relatedOrderId?: string;
}

export enum OrderStatus {
  PENDING = 'Devis / En attente',
  COMPLETED = 'Facturée / Livrée',
  CANCELLED = 'Annulée'
}

export interface ClientOrder {
  id: string;
  companyId: string; // Tenant Isolation
  customerName: string;
  date: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
}

export enum SupplierOrderStatus {
  PENDING = 'En cours',
  RECEIVED = 'Reçue',
  CANCELLED = 'Annulée'
}

export interface SupplierOrderItem {
  productId: string;
  productName: string;
  quantityOrdered: number;
  estimatedUnitCost: number;
}

export interface SupplierOrder {
  id: string;
  companyId: string; // Tenant Isolation
  supplierId: string;
  supplierName: string;
  date: string;
  expectedDeliveryDate?: string;
  items: SupplierOrderItem[];
  totalEstimated: number;
  status: SupplierOrderStatus;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// AppSettings is now merged into Company, kept for compatibility in specific views if needed but generally replaced.
export interface AppSettings {
  companyName: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  currencySymbol: string;
  footerMessage: string;
  settingsPin?: string; // Mapped from Company
}

export enum UserRole {
  SUPER_ADMIN = 'Super Administrateur', // Can manage all companies
  ADMIN = 'Administrateur (Gérant)', // Company specific admin
  SALES = 'Vendeur / Caissier',
  INVENTORY_MANAGER = 'Gestionnaire Stock / Achats'
}

export interface User {
  id: string;
  companyId?: string; // If null and role is SUPER_ADMIN, has access to everything
  name: string;
  username: string;
  role: UserRole;
  avatar?: string;
  password?: string; // Added for basic auth management
}

export enum ClientType {
  INDIVIDUAL = 'Particulier',
  CORPORATE = 'Entreprise',
  RESELLER = 'Revendeur / Grossiste',
  VIP = 'Client VIP'
}

export interface Client {
  id: string;
  companyId: string; // Tenant Isolation
  name: string;
  email: string;
  phone: string;
  address?: string;
  type: ClientType;
  loyaltyPoints: number;
  totalSpent: number;
  notes?: string;
}

export enum ExpenseCategory {
  RENT = 'Loyer / Locaux',
  UTILITIES = 'Électricité/Eau/Internet',
  SALARIES = 'Salaires & Primes',
  MARKETING = 'Marketing & Pub',
  MAINTENANCE = 'Maintenance & Réparations',
  TAXES = 'Impôts & Taxes',
  LOGISTICS = 'Transport & Logistique',
  OTHER = 'Autres Frais Généraux'
}

export interface Expense {
  id: string;
  companyId: string; // Tenant Isolation
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  declaredBy: string;
}
