
import axios from 'axios';
import { db } from '../utils/db';
import { toast } from 'sonner';

// In a real scenario, this points to your FastAPI backend
// e.g., const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
// For this demo, we simulate the backend responses using IndexedDB immediately.

const isOnline = () => navigator.onLine;

// Generic CRUD Helper to switch between Real API and Local DB
const apiHelper = {
  get: async (endpoint: string, table: string) => {
    try {
      if (isOnline()) {
        // In real app: const res = await axios.get(`${API_URL}/${endpoint}`); return res.data;
        // Mocking network delay
        // await new Promise(r => setTimeout(r, 300));
        return await db.getAll(table);
      } else {
        return await db.getAll(table);
      }
    } catch (err) {
      console.error(`Error fetching ${table}`, err);
      // Fallback to DB on error
      return await db.getAll(table);
    }
  },

  post: async (endpoint: string, table: string, data: any) => {
    try {
      // Optimistic UI update: Save to local DB first
      await db.put(table, data);
      
      if (isOnline()) {
         // In real app: await axios.post(`${API_URL}/${endpoint}`, data);
         // toast.success('Sauvegardé sur le serveur');
      } else {
         // Add to sync queue
         // await db.put('syncQueue', { url: endpoint, method: 'POST', data, timestamp: Date.now() });
         toast.info('Mode hors ligne : Sauvegardé localement');
      }
      return data;
    } catch (err) {
      console.error(`Error saving to ${table}`, err);
      throw err;
    }
  },

  delete: async (endpoint: string, table: string, id: string) => {
     await db.delete(table, id);
     if (isOnline()) {
         // await axios.delete(`${API_URL}/${endpoint}/${id}`);
     }
  }
};

export const ApiService = {
  // Products
  getProducts: () => apiHelper.get('products', 'products'),
  saveProduct: (product: any) => apiHelper.post('products', 'products', product),
  deleteProduct: (id: string) => apiHelper.delete('products', 'products', id),

  // Sales
  getSales: () => apiHelper.get('sales', 'sales'),
  saveSale: (sale: any) => apiHelper.post('sales', 'sales', sale),
  deleteSale: (id: string) => apiHelper.delete('sales', 'sales', id),

  // Clients
  getClients: () => apiHelper.get('clients', 'clients'),
  saveClient: (client: any) => apiHelper.post('clients', 'clients', client),

  // Suppliers
  getSuppliers: () => apiHelper.get('suppliers', 'suppliers'),
  saveSupplier: (supplier: any) => apiHelper.post('suppliers', 'suppliers', supplier),

  // Expenses
  getExpenses: () => apiHelper.get('expenses', 'expenses'),
  saveExpense: (expense: any) => apiHelper.post('expenses', 'expenses', expense),
  
  // Companies & Users
  getCompanies: () => apiHelper.get('companies', 'companies'),
  saveCompany: (company: any) => apiHelper.post('companies', 'companies', company),
  getUsers: () => apiHelper.get('users', 'users'),
  saveUser: (user: any) => apiHelper.post('users', 'users', user),

  // Orders
  getClientOrders: () => apiHelper.get('client_orders', 'clientOrders'),
  saveClientOrder: (order: any) => apiHelper.post('client_orders', 'clientOrders', order),
  getSupplierOrders: () => apiHelper.get('supplier_orders', 'supplierOrders'),
  saveSupplierOrder: (order: any) => apiHelper.post('supplier_orders', 'supplierOrders', order),
  getSupplierInvoices: () => apiHelper.get('supplier_invoices', 'supplierInvoices'),
  saveSupplierInvoice: (inv: any) => apiHelper.post('supplier_invoices', 'supplierInvoices', inv),
};
