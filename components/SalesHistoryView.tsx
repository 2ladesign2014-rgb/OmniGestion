import React, { useState } from 'react';
import { Sale } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { FileText, FileDown, Printer, Eye, Trash2, X, Download, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SalesHistoryViewProps {
  sales: Sale[];
  // Adding setSales to allow deleting/voiding invoices
  setSales?: React.Dispatch<React.SetStateAction<Sale[]>>;
}

const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ sales, setSales }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Delete Confirmation State
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  const filteredSales = sales.filter(s => 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.date.includes(searchTerm)
  );

  const formatItemString = (item: any) => {
    let str = `${item.quantity}x ${item.name}`;
    if (item.discount && item.discount > 0) {
        str += ` (-${item.discount}%)`;
    }
    return str;
  };

  // --- Export Global List (CSV) ---
  const handleExportCSV = () => {
    const headers = ['ID Vente', 'Date', 'Total', 'Articles'];
    const rows = sales.map(sale => [
      sale.id,
      sale.date,
      sale.total.toString(),
      sale.items.map(i => formatItemString(i)).join('; ')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `journal_ventes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Generate Single Invoice PDF ---
  const generateInvoicePDF = (sale: Sale) => {
    const doc = new jsPDF();

    // Company Header
    doc.setFillColor(37, 99, 235); // Blue
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text('FACTURE', 14, 25);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text('TechGestion Pro', 150, 15, { align: 'right' });
    doc.text('Dakar, Sénégal', 150, 22, { align: 'right' });
    doc.text('Tél: +221 33 000 00 00', 150, 29, { align: 'right' });

    // Invoice Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Numéro: #${sale.id}`, 14, 50);
    doc.text(`Date: ${sale.date}`, 14, 56);
    doc.text(`Client: Client de Passage`, 14, 62); // Could be dynamic if Client management exists

    // Table
    const tableColumn = ["Article", "Qté", "Prix Unit.", "Remise", "Total Ligne"];
    const tableRows: any[] = [];

    sale.items.forEach(item => {
      const unitPrice = item.price;
      const discount = item.discount || 0;
      const discountedPrice = unitPrice * (1 - discount / 100);
      const lineTotal = discountedPrice * item.quantity;

      const row = [
        item.name,
        item.quantity,
        `${unitPrice.toLocaleString()} ${CURRENCY_SYMBOL}`,
        discount > 0 ? `${discount}%` : '-',
        `${lineTotal.toLocaleString()} ${CURRENCY_SYMBOL}`
      ];
      tableRows.push(row);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 70,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { halign: 'right' },
      columnStyles: { 0: { halign: 'left' } } // Align text left for Name
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const subTotal = sale.total / 1.18;
    const tax = sale.total - subTotal;

    doc.setFontSize(10);
    doc.text(`Sous-total HT:`, 140, finalY, { align: 'right' });
    doc.text(`${subTotal.toLocaleString(undefined, {maximumFractionDigits: 0})} ${CURRENCY_SYMBOL}`, 190, finalY, { align: 'right' });

    doc.text(`TVA (18%):`, 140, finalY + 7, { align: 'right' });
    doc.text(`${tax.toLocaleString(undefined, {maximumFractionDigits: 0})} ${CURRENCY_SYMBOL}`, 190, finalY + 7, { align: 'right' });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL TTC:`, 140, finalY + 16, { align: 'right' });
    doc.setTextColor(37, 99, 235);
    doc.text(`${sale.total.toLocaleString()} ${CURRENCY_SYMBOL}`, 190, finalY + 16, { align: 'right' });

    // Footer
    doc.setTextColor(100);
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Merci de votre confiance !", 105, 280, { align: 'center' });

    doc.save(`facture_${sale.id}.pdf`);
  };

  const confirmDelete = () => {
    if (saleToDelete && setSales) {
        setSales(prev => prev.filter(s => s.id !== saleToDelete));
        setSaleToDelete(null);
    }
  };

  return (
    <div className="p-8 bg-gray-50 h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestion des Factures</h2>
          <p className="text-slate-500">Consultez, imprimez et gérez l'historique des transactions.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg hover:bg-gray-50 hover:text-slate-900 transition-colors shadow-sm font-medium"
          >
            <FileText size={18} className="text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm max-w-md">
        <input 
            type="text" 
            placeholder="Rechercher par ID ou Date..." 
            className="w-full outline-none text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-gray-200">
                <tr>
                <th className="p-4 font-semibold text-slate-600">N° Facture</th>
                <th className="p-4 font-semibold text-slate-600">Date</th>
                <th className="p-4 font-semibold text-slate-600">Articles</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Montant TTC</th>
                <th className="p-4 font-semibold text-slate-600 text-center">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {filteredSales.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-400">Aucune facture trouvée.</td></tr>
                ) : (
                filteredSales.slice().reverse().map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 text-sm font-mono text-blue-600 font-bold">#{s.id}</td>
                    <td className="p-4 text-slate-700 whitespace-nowrap text-sm">{s.date}</td>
                    <td className="p-4 text-sm text-slate-600 max-w-md truncate">
                        {s.items.map(i => i.name).join(', ')}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">{s.total.toLocaleString()} {CURRENCY_SYMBOL}</td>
                    <td className="p-4">
                        <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100">
                            <button 
                                onClick={() => setSelectedInvoice(s)}
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Voir Facture"
                            >
                                <Eye size={18} />
                            </button>
                            <button 
                                onClick={() => generateInvoicePDF(s)}
                                className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Imprimer PDF"
                            >
                                <Printer size={18} />
                            </button>
                            {setSales && (
                                <button 
                                    onClick={() => setSaleToDelete(s.id)}
                                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Supprimer"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {saleToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmer la suppression</h3>
              <p className="text-slate-600 mb-6">
                Êtes-vous sûr de vouloir supprimer cette facture ? <br/>
                <span className="text-sm text-gray-500">Note : Cela n'affectera pas le stock.</span>
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setSaleToDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-slate-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-slate-50 rounded-t-lg">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <FileText size={20} className="text-blue-600" />
                        Aperçu Facture #{selectedInvoice.id}
                    </h3>
                    <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body (Paper Look) */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
                    <div className="bg-white shadow-lg p-8 mx-auto max-w-2xl min-h-[500px] text-sm">
                        {/* Invoice Header */}
                        <div className="flex justify-between mb-8 border-b border-gray-100 pb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-blue-600 mb-2">FACTURE</h1>
                                <div className="text-slate-500">
                                    <p>N°: <span className="font-mono text-slate-700">#{selectedInvoice.id}</span></p>
                                    <p>Date: <span className="text-slate-700">{selectedInvoice.date}</span></p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="font-bold text-slate-800 text-lg">TechGestion Pro</h2>
                                <p className="text-slate-500">Zone Industrielle</p>
                                <p className="text-slate-500">Dakar, Sénégal</p>
                                <p className="text-slate-500">+221 33 000 00 00</p>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="mb-8 flex justify-between">
                            <div className="w-1/2">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Facturé à :</p>
                                <p className="font-bold text-slate-800">Client de Passage</p>
                                <p className="text-slate-500">Comptant / Espèces / Wave</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full mb-8">
                            <thead>
                                <tr className="border-b-2 border-blue-100 text-blue-600">
                                    <th className="py-2 text-left w-1/2">Description</th>
                                    <th className="py-2 text-right">Qté</th>
                                    <th className="py-2 text-right">Prix Unit.</th>
                                    <th className="py-2 text-right">Remise</th>
                                    <th className="py-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-600 divide-y divide-gray-50">
                                {selectedInvoice.items.map((item, idx) => {
                                    const unitPrice = item.price;
                                    const discount = item.discount || 0;
                                    const discountedPrice = unitPrice * (1 - discount / 100);
                                    
                                    return (
                                    <tr key={idx}>
                                        <td className="py-3">
                                            <p className="font-medium text-slate-800">{item.name}</p>
                                            <p className="text-xs text-slate-400">{item.category}</p>
                                        </td>
                                        <td className="py-3 text-right">{item.quantity}</td>
                                        <td className="py-3 text-right">{unitPrice.toLocaleString()}</td>
                                        <td className="py-3 text-right text-red-500">{discount > 0 ? `-${discount}%` : '-'}</td>
                                        <td className="py-3 text-right font-medium text-slate-800">
                                            {(discountedPrice * item.quantity).toLocaleString()}
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="flex justify-end border-t border-gray-100 pt-4">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-slate-500">
                                    <span>Sous-total HT:</span>
                                    <span>{(selectedInvoice.total / 1.18).toLocaleString(undefined, {maximumFractionDigits: 0})} {CURRENCY_SYMBOL}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>TVA (18%):</span>
                                    <span>{(selectedInvoice.total - (selectedInvoice.total / 1.18)).toLocaleString(undefined, {maximumFractionDigits: 0})} {CURRENCY_SYMBOL}</span>
                                </div>
                                <div className="flex justify-between font-bold text-xl text-blue-600 pt-2 border-t border-gray-100">
                                    <span>Total TTC:</span>
                                    <span>{selectedInvoice.total.toLocaleString()} {CURRENCY_SYMBOL}</span>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Footer */}
                        <div className="mt-12 pt-4 border-t border-dashed border-gray-200 text-center text-xs text-slate-400">
                            <p>Merci de votre visite. Les articles vendus ne sont ni repris ni échangés après 48h.</p>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg flex justify-end gap-3">
                    <button 
                        onClick={() => setSelectedInvoice(null)} 
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition"
                    >
                        Fermer
                    </button>
                    <button 
                        onClick={() => generateInvoicePDF(selectedInvoice)} 
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2"
                    >
                        <Printer size={18} />
                        Imprimer / Télécharger
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryView;