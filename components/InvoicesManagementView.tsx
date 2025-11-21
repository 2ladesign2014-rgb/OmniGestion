
import React, { useState } from 'react';
import { Sale, SupplierInvoice, AppSettings, PaymentMethod } from '../types';
import { FileText, Printer, Eye, Trash2, X, Search, AlertTriangle, Download, ShoppingCart, Truck, FileDown, CreditCard, Landmark, Banknote, Smartphone, Calendar, Clock } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoicesManagementViewProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  supplierInvoices: SupplierInvoice[];
  setSupplierInvoices: React.Dispatch<React.SetStateAction<SupplierInvoice[]>>;
  settings: AppSettings;
}

const InvoicesManagementView: React.FC<InvoicesManagementViewProps> = ({ 
    sales, 
    setSales, 
    supplierInvoices, 
    setSupplierInvoices,
    settings
}) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'purchases'>('sales');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedSupplierInvoice, setSelectedSupplierInvoice] = useState<SupplierInvoice | null>(null);
  
  // Delete State
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [supplierInvoiceToDelete, setSupplierInvoiceToDelete] = useState<string | null>(null);

  // Filter Logic
  const filteredSales = sales.filter(s => 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.date.includes(searchTerm) ||
    s.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSupplierInvoices = supplierInvoices.filter(i => 
    i.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.date.includes(searchTerm)
  );

  // --- Helper: PDF Generator for Global List ---
  const generateGlobalReport = (type: 'sales' | 'purchases') => {
    const doc = new jsPDF();
    const isSales = type === 'sales';
    const title = isSales ? 'Rapport des Ventes (Clients)' : 'Rapport des Achats (Fournisseurs)';
    const themeColor = isSales ? [37, 99, 235] : [16, 185, 129]; // Blue or Emerald

    // Logo for Global Report if available
    if (settings.logo) {
        try {
            doc.addImage(settings.logo, 14, 5, 20, 20);
        } catch (e) {
            console.error("Error adding logo to Global PDF", e);
        }
    }

    doc.setFontSize(18);
    doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.text(title, settings.logo ? 40 : 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Entreprise: ${settings.companyName}`, 14, 30);
    doc.text(`Date d'extraction: ${new Date().toLocaleString()}`, 14, 35);

    const tableColumn = isSales 
        ? ["ID", "Date", "Client", "Mode Paiement", "Réf. Paiement", "Total"] 
        : ["ID", "Date", "Fournisseur", "Total"];

    const tableRows: any[] = [];

    if (isSales) {
        filteredSales.forEach(sale => {
            const paymentMethod = sale.paymentInfo ? sale.paymentInfo.method : 'Standard';
            let paymentRef = '-';
            if (sale.paymentInfo) {
                if (sale.paymentInfo.checkNumber) paymentRef = `Chèque: ${sale.paymentInfo.checkNumber}`;
                else if (sale.paymentInfo.bankName) paymentRef = `Banque: ${sale.paymentInfo.bankName}`;
                else if (sale.paymentInfo.mobileProvider) paymentRef = `Op: ${sale.paymentInfo.mobileProvider}`;
            }

            tableRows.push([
                sale.id,
                sale.date,
                sale.clientName || 'Client de passage',
                paymentMethod,
                paymentRef,
                `${sale.total.toLocaleString()} ${settings.currencySymbol}`
            ]);
        });
    } else {
        filteredSupplierInvoices.forEach(inv => {
            tableRows.push([
                inv.id,
                inv.date,
                inv.supplierName,
                `${inv.totalAmount.toLocaleString()} ${settings.currencySymbol}`
            ]);
        });
    }

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: themeColor },
      styles: { fontSize: 8 },
    });

    // Total footer
    const totalSum = isSales 
        ? filteredSales.reduce((sum, s) => sum + s.total, 0)
        : filteredSupplierInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`TOTAL PÉRIODE: ${totalSum.toLocaleString()} ${settings.currencySymbol}`, 14, finalY);

    doc.save(`rapport_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // --- Helper: Single Customer Invoice PDF ---
  const generateSalePDF = (sale: Sale) => {
    const doc = new jsPDF();
    
    // Header Background
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Logo Logic
    let titleX = 14;
    if (settings.logo) {
        try {
            // Adjust image size/position as needed
            doc.addImage(settings.logo, 14, 5, 30, 30);
            titleX = 50; 
        } catch (e) {
            console.error("Error adding logo to PDF", e);
        }
    }

    // Invoice Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('FACTURE', titleX, 25);

    // Company Details (Top Right) - Using Settings
    doc.setFontSize(12);
    doc.text(settings.companyName || 'Ma Société', 200, 15, { align: 'right' });
    doc.setFontSize(9);
    doc.text(settings.address || '', 200, 20, { align: 'right' });
    const contactLine = [settings.phone, settings.email].filter(Boolean).join(' - ');
    doc.text(contactLine, 200, 25, { align: 'right' });

    // Invoice Info (Left)
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(`N°: #${sale.id}`, 14, 50);
    doc.text(`Date: ${sale.date}`, 14, 56);
    doc.text(`Client: ${sale.clientName || 'Client de Passage'}`, 14, 62);
    
    // Payment Info on PDF
    let paymentY = 70;
    if (sale.paymentInfo) {
        // If Mobile Money, show provider
        const methodLabel = sale.paymentInfo.mobileProvider 
            ? `${sale.paymentInfo.method} (${sale.paymentInfo.mobileProvider})`
            : sale.paymentInfo.method;

        doc.text(`Mode: ${methodLabel}`, 14, paymentY);
        paymentY += 6;

        if (sale.paymentInfo.bankName) {
             doc.text(`Banque: ${sale.paymentInfo.bankName}`, 14, paymentY);
             paymentY += 6;
        }
        if (sale.paymentInfo.checkNumber) {
             doc.text(`N° Chèque: ${sale.paymentInfo.checkNumber}`, 14, paymentY);
             paymentY += 6;
        }
        // Status
        doc.text(`Statut: ${sale.paymentInfo.status}`, 14, paymentY);
    } else {
        doc.text(`Mode: Comptant`, 14, paymentY);
    }

    // Items Table
    const tableRows = sale.items.map(item => {
      let unitPrice = item.price;
      let isPromo = false;
      
      if (item.promotionalPrice && item.promotionalPrice > 0) {
          unitPrice = item.promotionalPrice;
          isPromo = true;
      } else if (item.discount) {
          unitPrice = item.price * (1 - item.discount / 100);
      }

      return [
        item.name + (isPromo ? ' (PROMO)' : ''),
        item.quantity,
        `${unitPrice.toLocaleString()} ${settings.currencySymbol}`,
        `${(unitPrice * item.quantity).toLocaleString()} ${settings.currencySymbol}`
      ];
    });

    autoTable(doc, {
      head: [["Description", "Qté", "Prix Unit.", "Total"]],
      body: tableRows,
      startY: paymentY + 10,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`TOTAL TTC:`, 140, finalY);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${sale.total.toLocaleString()} ${settings.currencySymbol}`, 190, finalY, { align: 'right' });
    
    // Custom Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    const footerText = settings.footerMessage || "Merci de votre confiance.";
    
    // Split footer text if too long
    const splitFooter = doc.splitTextToSize(footerText, 180);
    doc.text(splitFooter, 105, 280, { align: 'center' });
    
    doc.save(`facture_client_${sale.id}.pdf`);
  };

  // --- Helper: Single Supplier Invoice PDF ---
  const generateSupplierInvoicePDF = (inv: SupplierInvoice) => {
    const doc = new jsPDF();
    
    // Header Background
    doc.setFillColor(16, 185, 129); // Emerald
    doc.rect(0, 0, 210, 40, 'F');

    // Logo Logic
    let titleX = 14;
    if (settings.logo) {
        try {
            doc.addImage(settings.logo, 14, 5, 30, 30);
            titleX = 50;
        } catch (e) {
            console.error("Error adding logo to PDF", e);
        }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('FACTURE FOURNISSEUR', titleX, 25);
    
    // Company Info
    doc.setFontSize(12);
    doc.text(settings.companyName, 200, 15, { align: 'right' });
    doc.setFontSize(9);
    doc.text(settings.address, 200, 20, { align: 'right' });

    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(`N° Ref: #${inv.id}`, 14, 50);
    doc.text(`Date: ${inv.date}`, 14, 56);
    doc.text(`Fournisseur: ${inv.supplierName}`, 14, 62);
    
    const tableRows = inv.items.map(item => [
      item.productName,
      item.quantity,
      `${item.unitCost.toLocaleString()} ${settings.currencySymbol}`,
      `${(item.unitCost * item.quantity).toLocaleString()} ${settings.currencySymbol}`
    ]);

    autoTable(doc, {
      head: [["Article", "Qté", "Coût Unit.", "Total"]],
      body: tableRows,
      startY: 75,
      headStyles: { fillColor: [16, 185, 129] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`TOTAL PAYÉ: ${inv.totalAmount.toLocaleString()} ${settings.currencySymbol}`, 140, finalY);
    
    // Footer
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Document interne - Gestion de stock", 105, 280, { align: 'center' });

    doc.save(`facture_fournisseur_${inv.id}.pdf`);
  };

  const getPaymentIcon = (method?: PaymentMethod) => {
      switch(method) {
          case 'Espèces': return <Banknote size={16} className="text-green-600"/>;
          case 'Mobile Money': return <Smartphone size={16} className="text-orange-600"/>;
          case 'Virement Bancaire': return <Landmark size={16} className="text-blue-600"/>;
          case 'Chèque': return <FileText size={16} className="text-purple-600"/>;
          default: return <CreditCard size={16} className="text-slate-400"/>;
      }
  };

  // --- Render ---
  return (
    <div className="p-8 bg-gray-50 h-full overflow-y-auto">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestion des Factures</h2>
          <p className="text-slate-500">Suivi des transactions, détails bancaires et historiques.</p>
        </div>
        <div className="flex gap-2 p-1 bg-white rounded-lg border border-gray-200 shadow-sm">
            <button 
                onClick={() => setActiveTab('sales')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'sales' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-gray-50'}`}
            >
                <ShoppingCart size={16} />
                Clients (Ventes)
            </button>
            <button 
                onClick={() => setActiveTab('purchases')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'purchases' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-gray-50'}`}
            >
                <Truck size={16} />
                Fournisseurs (Achats)
            </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder={activeTab === 'sales' ? "Rechercher (Client, ID, Date)..." : "Rechercher (Fournisseur, ID)..."}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <button 
            onClick={() => generateGlobalReport(activeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-white shadow-md transition-all hover:shadow-lg ${activeTab === 'sales' ? 'bg-slate-800 hover:bg-slate-900' : 'bg-slate-800 hover:bg-slate-900'}`}
        >
            <FileDown size={18} />
            <span>Imprimer Rapport Global</span>
        </button>
      </div>

      {/* CONTENT: SALES TABLE */}
      {activeTab === 'sales' && (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden animate-in fade-in duration-200">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-gray-200 text-slate-600 font-semibold text-sm">
                        <tr>
                            <th className="p-4">Transaction</th>
                            <th className="p-4">Client</th>
                            <th className="p-4">Mode de Paiement</th>
                            <th className="p-4">Statut</th>
                            <th className="p-4 text-right">Montant TTC</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {filteredSales.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucune vente trouvée.</td></tr>
                        ) : (
                            filteredSales.slice().reverse().map(s => (
                                <tr key={s.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-mono text-blue-600 font-bold text-xs">#{s.id}</div>
                                        <div className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                                            <Calendar size={10}/> {s.date}
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-slate-800">
                                        {s.clientName || 'Client de passage'}
                                    </td>
                                    <td className="p-4">
                                        {s.paymentInfo ? (
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-800 flex items-center gap-2">
                                                    {getPaymentIcon(s.paymentInfo.method)}
                                                    {/* Prioritize displaying the Provider/Bank name if available */}
                                                    {s.paymentInfo.mobileProvider || s.paymentInfo.bankName || s.paymentInfo.method}
                                                </span>
                                                {/* If details shown above, show method below in small text, or check number */}
                                                {(s.paymentInfo.mobileProvider || s.paymentInfo.bankName) && (
                                                    <span className="text-xs text-slate-500 ml-6">{s.paymentInfo.method}</span>
                                                )}
                                                {s.paymentInfo.checkNumber && (
                                                    <span className="text-xs text-slate-500 ml-6">N° {s.paymentInfo.checkNumber}</span>
                                                )}
                                            </div>
                                        ) : <span className="text-slate-400 italic">Standard</span>}
                                    </td>
                                    <td className="p-4">
                                        {s.paymentInfo ? (
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                                                s.paymentInfo.status === 'Validé' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                s.paymentInfo.status === 'En attente' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                s.paymentInfo.status === 'Annulé' ? 'bg-red-100 text-red-700 border-red-200' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {s.paymentInfo.status}
                                            </span>
                                        ) : <span className="text-slate-400">-</span>}
                                    </td>
                                    <td className="p-4 text-right font-bold text-slate-800">{s.total.toLocaleString()} {settings.currencySymbol}</td>
                                    <td className="p-4 flex justify-center gap-2">
                                        <button onClick={() => setSelectedSale(s)} className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors" title="Voir Détails"><Eye size={18}/></button>
                                        <button onClick={() => generateSalePDF(s)} className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors" title="Imprimer"><Printer size={18}/></button>
                                        <button onClick={() => setSaleToDelete(s.id)} className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors" title="Supprimer"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* CONTENT: PURCHASES TABLE */}
      {activeTab === 'purchases' && (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden animate-in fade-in duration-200">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-gray-200 text-slate-600 font-semibold text-sm">
                        <tr>
                            <th className="p-4">Ref. Interne</th>
                            <th className="p-4">Date Réception</th>
                            <th className="p-4">Fournisseur</th>
                            <th className="p-4 text-right">Total Achat</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {filteredSupplierInvoices.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-400">Aucune facture fournisseur trouvée.</td></tr>
                        ) : (
                            filteredSupplierInvoices.slice().reverse().map(inv => (
                                <tr key={inv.id} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="p-4 font-mono text-emerald-600 font-bold">#{inv.id}</td>
                                    <td className="p-4 text-slate-700">{inv.date}</td>
                                    <td className="p-4 font-medium text-slate-800">{inv.supplierName}</td>
                                    <td className="p-4 text-right font-bold text-slate-800">{inv.totalAmount.toLocaleString()} {settings.currencySymbol}</td>
                                    <td className="p-4 flex justify-center gap-2">
                                        <button onClick={() => setSelectedSupplierInvoice(inv)} className="p-2 hover:bg-emerald-100 text-emerald-600 rounded-lg"><Eye size={18}/></button>
                                        <button onClick={() => generateSupplierInvoicePDF(inv)} className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg"><Printer size={18}/></button>
                                        <button onClick={() => setSupplierInvoiceToDelete(inv.id)} className="p-2 hover:bg-red-100 text-red-600 rounded-lg"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Delete Sale Confirmation */}
      {saleToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl max-w-sm w-full text-center shadow-2xl">
                <AlertTriangle size={40} className="mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-bold mb-2">Supprimer la facture ?</h3>
                <p className="text-gray-500 mb-6">Cela supprimera l'historique de la vente. Le stock ne sera pas ré-ajusté automatiquement.</p>
                <div className="flex gap-3">
                    <button onClick={() => setSaleToDelete(null)} className="flex-1 py-2 bg-gray-100 rounded-lg">Annuler</button>
                    <button onClick={() => {
                        setSales(prev => prev.filter(s => s.id !== saleToDelete));
                        setSaleToDelete(null);
                    }} className="flex-1 py-2 bg-red-600 text-white rounded-lg">Supprimer</button>
                </div>
            </div>
        </div>
      )}

      {/* Delete Supplier Invoice Confirmation */}
      {supplierInvoiceToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl max-w-sm w-full text-center shadow-2xl">
                <AlertTriangle size={40} className="mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-bold mb-2">Supprimer la facture fournisseur ?</h3>
                <p className="text-gray-500 mb-6">Cela supprimera la trace de l'achat.</p>
                <div className="flex gap-3">
                    <button onClick={() => setSupplierInvoiceToDelete(null)} className="flex-1 py-2 bg-gray-100 rounded-lg">Annuler</button>
                    <button onClick={() => {
                        setSupplierInvoices(prev => prev.filter(i => i.id !== supplierInvoiceToDelete));
                        setSupplierInvoiceToDelete(null);
                    }} className="flex-1 py-2 bg-red-600 text-white rounded-lg">Supprimer</button>
                </div>
            </div>
        </div>
      )}

      {/* View Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                        <FileText size={20}/> 
                        Facture #{selectedSale.id}
                    </h3>
                    <button onClick={() => setSelectedSale(null)}><X size={24} className="text-gray-400 hover:text-gray-600"/></button>
                </div>
                <div className="p-6 space-y-6">
                    {/* Header Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Date de Transaction</p>
                            <div className="flex items-center gap-2 text-slate-800 font-medium">
                                <Calendar size={16} className="text-blue-500"/> 
                                {selectedSale.date}
                            </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-right">
                            <p className="text-xs text-blue-500 uppercase font-bold mb-1">Total TTC</p>
                            <p className="font-bold text-2xl text-blue-700">{selectedSale.total.toLocaleString()} {settings.currencySymbol}</p>
                        </div>
                    </div>

                    {/* Payment Info Section */}
                    <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 text-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <Landmark size={80} />
                        </div>
                        <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                            <CreditCard size={16} />
                            Détails Bancaires & Paiement
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-indigo-800">
                            <div className="flex justify-between border-b border-indigo-200/50 pb-1">
                                <span className="text-indigo-600">Type</span>
                                <span className="font-medium">{selectedSale.paymentInfo?.type || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-indigo-200/50 pb-1">
                                <span className="text-indigo-600">Mode</span>
                                <span className="font-medium flex items-center gap-1">
                                    {getPaymentIcon(selectedSale.paymentInfo?.method)}
                                    {selectedSale.paymentInfo?.method || 'Espèces'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-indigo-200/50 pb-1">
                                <span className="text-indigo-600">Statut</span>
                                <span className={`font-bold ${selectedSale.paymentInfo?.status === 'Validé' ? 'text-emerald-600' : 'text-orange-600'}`}>
                                    {selectedSale.paymentInfo?.status || 'N/A'}
                                </span>
                            </div>
                            
                            {/* Dynamic Fields */}
                            {selectedSale.paymentInfo?.mobileProvider && (
                                <div className="flex justify-between border-b border-indigo-200/50 pb-1">
                                    <span className="text-indigo-600">Opérateur</span>
                                    <span className="font-medium">{selectedSale.paymentInfo.mobileProvider}</span>
                                </div>
                            )}
                            {selectedSale.paymentInfo?.bankName && (
                                <div className="flex justify-between border-b border-indigo-200/50 pb-1">
                                    <span className="text-indigo-600">Banque</span>
                                    <span className="font-medium">{selectedSale.paymentInfo.bankName}</span>
                                </div>
                            )}
                            {selectedSale.paymentInfo?.checkNumber && (
                                <div className="flex justify-between border-b border-indigo-200/50 pb-1">
                                    <span className="text-indigo-600">N° Chèque</span>
                                    <span className="font-medium font-mono">{selectedSale.paymentInfo.checkNumber}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <h4 className="font-bold text-slate-700 mb-2">Articles Vendus</h4>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-slate-600 font-medium">
                                    <tr>
                                        <th className="p-3 text-left">Produit</th>
                                        <th className="p-3 text-right">Qté</th>
                                        <th className="p-3 text-right">Prix Unit.</th>
                                        <th className="p-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-slate-700">
                                    {selectedSale.items.map((item, idx) => {
                                        let finalPrice = item.price;
                                        if (item.promotionalPrice && item.promotionalPrice > 0) {
                                            finalPrice = item.promotionalPrice;
                                        } else if (item.discount) {
                                            finalPrice = item.price * (1 - item.discount / 100);
                                        }

                                        return (
                                        <tr key={idx}>
                                            <td className="p-3">
                                                {item.name}
                                                {item.promotionalPrice && item.promotionalPrice > 0 && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded">PROMO</span>}
                                            </td>
                                            <td className="p-3 text-right">{item.quantity}</td>
                                            <td className="p-3 text-right text-slate-500">{finalPrice.toLocaleString()}</td>
                                            <td className="p-3 text-right font-medium">{(finalPrice * item.quantity).toLocaleString()} {settings.currencySymbol}</td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end gap-3">
                    <button onClick={() => setSelectedSale(null)} className="px-4 py-2 text-slate-600 hover:bg-white rounded-lg transition">Fermer</button>
                    <button onClick={() => generateSalePDF(selectedSale)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-md"><Printer size={18}/> Imprimer Facture</button>
                </div>
            </div>
        </div>
      )}

      {/* View Supplier Invoice Detail Modal */}
      {selectedSupplierInvoice && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="text-xl font-bold text-emerald-800">Détail Facture Fournisseur #{selectedSupplierInvoice.id}</h3>
                    <button onClick={() => setSelectedSupplierInvoice(null)}><X size={24} className="text-gray-400 hover:text-gray-600"/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><p className="text-gray-500">Fournisseur</p><p className="font-semibold text-lg">{selectedSupplierInvoice.supplierName}</p></div>
                        <div className="text-right"><p className="text-gray-500">Date</p><p className="font-semibold">{selectedSupplierInvoice.date}</p></div>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50"><tr className="text-left"><th className="p-3">Produit</th><th className="p-3 text-right">Qté</th><th className="p-3 text-right">Coût Unit.</th><th className="p-3 text-right">Total Ligne</th></tr></thead>
                            <tbody className="divide-y">
                                {selectedSupplierInvoice.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="p-3">{item.productName}</td>
                                        <td className="p-3 text-right">{item.quantity}</td>
                                        <td className="p-3 text-right text-gray-500">{item.unitCost.toLocaleString()}</td>
                                        <td className="p-3 text-right font-medium">{(item.unitCost * item.quantity).toLocaleString()} {settings.currencySymbol}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end">
                        <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                            <span className="text-emerald-800 font-bold text-lg">Total: {selectedSupplierInvoice.totalAmount.toLocaleString()} {settings.currencySymbol}</span>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end">
                    <button onClick={() => generateSupplierInvoicePDF(selectedSupplierInvoice)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700"><Printer size={18}/> Imprimer</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default InvoicesManagementView;
