
import React, { useState } from 'react';
import { ClientOrder, OrderStatus, AppSettings } from '../types';
import { Search, CheckCircle, XCircle, Printer, Eye, Calendar, User, Package, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrdersViewProps {
  orders: ClientOrder[];
  onProcessOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  settings: AppSettings;
}

const OrdersView: React.FC<OrdersViewProps> = ({ orders, onProcessOrder, onCancelOrder, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<ClientOrder | null>(null);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Helper for PDF
  const generateOrderPDF = (order: ClientOrder) => {
    const doc = new jsPDF();
    doc.setFillColor(99, 102, 241); // Indigo
    doc.rect(0, 0, 210, 40, 'F');
    
    // Header Logic with Logo
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
    doc.text('BON DE COMMANDE', titleX, 25);
    doc.setFontSize(12);
    doc.text(settings.companyName, 150, 15, { align: 'right' });
    doc.text(settings.phone, 150, 22, { align: 'right' });

    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(`N° Commande: #${order.id}`, 14, 50);
    doc.text(`Date: ${order.date}`, 14, 56);
    doc.text(`Client: ${order.customerName}`, 14, 62);
    doc.text(`Statut: ${order.status}`, 14, 68);

    const tableRows = order.items.map(item => [
      item.name,
      item.quantity,
      `${item.price.toLocaleString()} ${settings.currencySymbol}`,
      `${(item.price * item.quantity).toLocaleString()} ${settings.currencySymbol}`
    ]);

    autoTable(doc, {
      head: [["Produit", "Qté", "Prix Unit.", "Total"]],
      body: tableRows,
      startY: 75,
      headStyles: { fillColor: [99, 102, 241] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`TOTAL: ${order.total.toLocaleString()} ${settings.currencySymbol}`, 140, finalY);
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Ce document est un bon de commande. Le stock est réservé.", 14, 280);

    doc.save(`commande_${order.id}.pdf`);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case OrderStatus.COMPLETED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8 bg-gray-50 h-full overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Commandes Clients</h2>
        <p className="text-slate-500">Gérez les devis et les réservations de stock.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher (Client, ID)..." 
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {['All', OrderStatus.PENDING, OrderStatus.COMPLETED, OrderStatus.CANCELLED].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === status 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-white text-slate-600 border border-gray-200 hover:bg-slate-50'
              }`}
            >
              {status === 'All' ? 'Tout' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
                <Package size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Aucune commande trouvée.</p>
            </div>
        ) : (
            filteredOrders.slice().reverse().map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(order.status).split(' ')[0]}`}>
                            <User size={20} className={getStatusColor(order.status).split(' ')[1]} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{order.customerName}</h3>
                            <p className="text-xs text-slate-500 font-mono">#{order.id}</p>
                        </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full border ${getStatusColor(order.status)}`}>
                        {order.status}
                    </span>
                </div>
                
                <div className="flex-1 mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={14} />
                        <span>{order.date}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm">
                        <p className="text-slate-500 text-xs uppercase mb-1">Articles ({order.items.length})</p>
                        <p className="text-slate-700 line-clamp-2">
                            {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100 mb-4">
                    <span className="text-slate-500 text-sm">Total</span>
                    <span className="text-lg font-bold text-indigo-600">{order.total.toLocaleString()} {settings.currencySymbol}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setSelectedOrder(order)} className="p-2 text-slate-600 bg-gray-50 hover:bg-gray-100 rounded-lg flex justify-center" title="Voir">
                        <Eye size={18} />
                    </button>
                    <button onClick={() => generateOrderPDF(order)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex justify-center" title="Imprimer">
                        <Printer size={18} />
                    </button>
                    {order.status === OrderStatus.PENDING && (
                         <button onClick={() => onProcessOrder(order.id)} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex justify-center" title="Facturer (Valider)">
                            <CheckCircle size={18} />
                        </button>
                    )}
                </div>
                {order.status === OrderStatus.PENDING && (
                    <button 
                        onClick={() => {
                             if(confirm("Voulez-vous vraiment annuler cette commande ? Le stock sera remis en rayon.")) {
                                 onCancelOrder(order.id);
                             }
                        }}
                        className="mt-2 w-full py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition"
                    >
                        Annuler la commande
                    </button>
                )}
            </div>
            ))
        )}
      </div>

      {/* Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Commande #{selectedOrder.id}</h3>
                        <p className="text-sm text-slate-500">Client : {selectedOrder.customerName}</p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
                </div>
                <div className="p-6">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-slate-600">
                            <tr><th className="p-3">Produit</th><th className="p-3 text-right">Qté</th><th className="p-3 text-right">Total</th></tr>
                        </thead>
                        <tbody className="divide-y">
                            {selectedOrder.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="p-3">
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-slate-500">{item.price} {settings.currencySymbol}</div>
                                    </td>
                                    <td className="p-3 text-right">{item.quantity}</td>
                                    <td className="p-3 text-right font-medium">{((item.price * (1 - (item.discount||0)/100)) * item.quantity).toLocaleString()} {settings.currencySymbol}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-end mt-6">
                        <div className="text-right">
                            <p className="text-slate-500">Total Commande</p>
                            <p className="text-2xl font-bold text-indigo-600">{selectedOrder.total.toLocaleString()} {settings.currencySymbol}</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end gap-3">
                     {selectedOrder.status === OrderStatus.PENDING && (
                        <>
                            <button 
                                onClick={() => {
                                    onCancelOrder(selectedOrder.id);
                                    setSelectedOrder(null);
                                }} 
                                className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg"
                            >
                                Annuler Commande
                            </button>
                            <button 
                                onClick={() => {
                                    onProcessOrder(selectedOrder.id);
                                    setSelectedOrder(null);
                                }}
                                className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700"
                            >
                                Facturer maintenant
                            </button>
                        </>
                     )}
                     <button onClick={() => generateOrderPDF(selectedOrder)} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                        <Printer size={18} /> Imprimer
                     </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default OrdersView;
