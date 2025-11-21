
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Product, Sale, Client, Supplier, Expense, Company, User, ClientOrder, SupplierOrder, SupplierInvoice } from '../types';
import { MOCK_INVENTORY, MOCK_SALES, MOCK_CLIENTS, MOCK_SUPPLIERS, MOCK_EXPENSES, MOCK_COMPANIES, MOCK_USERS } from '../constants';

interface TechGestionDB extends DBSchema {
  products: { key: string; value: Product };
  sales: { key: string; value: Sale };
  clients: { key: string; value: Client };
  suppliers: { key: string; value: Supplier };
  expenses: { key: string; value: Expense };
  companies: { key: string; value: Company };
  users: { key: string; value: User };
  clientOrders: { key: string; value: ClientOrder };
  supplierOrders: { key: string; value: SupplierOrder };
  supplierInvoices: { key: string; value: SupplierInvoice };
  syncQueue: { key: number; value: { url: string; method: string; data: any; timestamp: number } };
}

const DB_NAME = 'techgestion-db';
const DB_VERSION = 1;

export const initDB = async (): Promise<IDBPDatabase<TechGestionDB>> => {
  return openDB<TechGestionDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('sales')) db.createObjectStore('sales', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('clients')) db.createObjectStore('clients', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('suppliers')) db.createObjectStore('suppliers', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('expenses')) db.createObjectStore('expenses', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('companies')) db.createObjectStore('companies', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('clientOrders')) db.createObjectStore('clientOrders', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('supplierOrders')) db.createObjectStore('supplierOrders', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('supplierInvoices')) db.createObjectStore('supplierInvoices', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('syncQueue')) db.createObjectStore('syncQueue', { keyPath: 'timestamp' });
    },
  });
};

// Seed initial data if empty (Simulation for first load)
export const seedDataIfEmpty = async () => {
  const db = await initDB();
  const count = await db.count('products');
  
  if (count === 0) {
    console.log('Seeding initial data into IndexedDB...');
    const tx = db.transaction(['products', 'sales', 'clients', 'suppliers', 'expenses', 'companies', 'users'], 'readwrite');
    
    await Promise.all([
      ...MOCK_INVENTORY.map(p => tx.objectStore('products').put(p)),
      ...MOCK_SALES.map(s => tx.objectStore('sales').put(s)),
      ...MOCK_CLIENTS.map(c => tx.objectStore('clients').put(c)),
      ...MOCK_SUPPLIERS.map(s => tx.objectStore('suppliers').put(s)),
      ...MOCK_EXPENSES.map(e => tx.objectStore('expenses').put(e)),
      ...MOCK_COMPANIES.map(c => tx.objectStore('companies').put(c)),
      ...MOCK_USERS.map(u => tx.objectStore('users').put(u)),
    ]);
    await tx.done;
  }
};

export const db = {
  async getAll<T>(store: string): Promise<T[]> {
    const db = await initDB();
    // @ts-ignore
    return db.getAll(store);
  },
  
  async put<T>(store: string, value: T): Promise<T> {
    const db = await initDB();
    // @ts-ignore
    await db.put(store, value);
    return value;
  },

  async delete(store: string, id: string): Promise<void> {
    const db = await initDB();
    // @ts-ignore
    await db.delete(store, id);
  }
};
