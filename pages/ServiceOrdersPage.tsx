import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '../App';
import { Order, OrderStatus, UserRole } from '../types';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { formatCurrency } from '../utils/currencyFormatter';
import { formatDateTime } from '../utils/dateFormatter';
import { ORDER_STATUS_COLORS, ORDER_STATUS_OPTIONS, ORDER_TYPE_OPTIONS } from '../constants';
import { Edit, Eye, Printer, MessageSquareText, Plus, Factory } from 'lucide-react';
import { Modal } from '../components/Modal';
import { generateWhatsAppInvoiceLink } from '../utils/whatsappLinkGenerator';
import { EditOrderModal } from './EditOrderModal';

export const ServiceOrdersPage: React.FC = () => {
  const { orders, updateOrder, addOrder, companyInfo, products, clients, addClient, updateClient, rawMaterials, checkPermission } = useAuth(); // Use checkPermission

  const canCreateServiceOrder = checkPermission('canCreateServiceOrder');
  const canEditServiceOrder = checkPermission('canEditServiceOrder');
  const canEditOrderStatus = checkPermission('canEditOrderStatus');
  const canPrintOrSendOrder = checkPermission('canPrintOrSendOrder');


  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (order.type !== 'service-order') return false;

      const matchesSearch =
        order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clientCpf.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        order.clientStreet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clientNeighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clientCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clientState.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clientZipCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchTerm, filterStatus]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    if (!canEditOrderStatus) {
      alert('Você não tem permissão para alterar o status das ordens de serviço.');
      return;
    }
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (orderToUpdate) {
      updateOrder({ ...orderToUpdate, status: newStatus, updatedAt: new Date().toISOString() });
    }
  };

  const openViewModal = (order: Order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedOrder(null);
  };

  const openEditModal = (order: Order) => {
    if (!canEditServiceOrder) {
      alert('Você não tem permissão para editar ordens de serviço.');
      return;
    }
    setSelectedOrder(order);
    setIsEditOrderModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOrderModalOpen(false);
    setSelectedOrder(null);
  };

  const openNewOrderModal = () => {
    if (!canCreateServiceOrder) {
      alert('Você não tem permissão para criar novas ordens de serviço.');
      return;
    }
    setSelectedOrder(null);
    setIsNewOrderModalOpen(true);
  }

  const closeNewOrderModal = () => {
    setIsNewOrderModalOpen(false);
    setSelectedOrder(null);
  }

  const handleSaveOrder = (orderToSave: Order) => {
    // Permission check is handled inside EditOrderModal as well, but this is a final check.
    if (orderToSave.id && !canEditServiceOrder) {
      alert('Você não tem permissão para editar ordens de serviço.');
      return;
    }
    if (!orderToSave.id && !canCreateServiceOrder) {
      alert('Você não tem permissão para criar ordens de serviço.');
      return;
    }

    if (orderToSave.id) {
      updateOrder(orderToSave);
    } else {
      addOrder(orderToSave);
    }
    closeEditModal();
    closeNewOrderModal();
  };


  const handlePrintOrderInvoice = (order: Order) => {
    if (!canPrintOrSendOrder) {
      alert('Você não tem permissão para imprimir ordens de serviço.');
      return;
    }
    if (!order) {
      alert('Nenhuma ordem selecionada para impressão.');
      return;
    }

    const docTitle = 'Imprimir Ordem de Serviço';
    const documentTypeLabel = 'Ordem de Serviço';

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
        printWindow.document.write('<html><head><title>');
        printWindow.document.write(docTitle);
        printWindow.document.write('</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            @media print {
                body { font-family: sans-serif; margin: 20px; }
                h1, h2, h3 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .text-right { text-align: right; }
                .hidden-print { display: none; }
                .header-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .header-info img { height: 50px; margin-right: 15px; }
                .header-info h2 { margin: 0; flex-grow: 1; }
                .order-summary { margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 15px; }
                .address-info { margin-bottom: 15px; font-size: 0.9em; }
                .production-details-section { margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 15px; }
                .production-details-section h3 { margin-bottom: 10px; }
                .production-details-section ul { list-style: none; padding: 0; }
                .production-details-section li { margin-bottom: 5px; font-size: 0.85em; }
            }
        `);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(`
            <div class="header-info">
                ${companyInfo.logo ? `<img src="${companyInfo.logo}" alt="Logo da Empresa" />` : ''}
                <h2>${companyInfo.name}</h2>
            </div>
            <h1 class="text-2xl font-bold mb-4">
                ${documentTypeLabel}
            </h1>
            <p><strong>ID da Ordem:</strong> ${order.id}</p>
            <p><strong>Cliente:</strong> ${order.clientName}</p>
            <p><strong>Contato:</strong> ${order.clientContact}</p>
            <p><strong>CPF:</strong> ${order.clientCpf}</p>
            <div class="address-info">
                <p><strong>Endereço:</strong> ${order.clientStreet}, ${order.clientNumber} - ${order.clientNeighborhood}</p>
                <p>${order.clientCity}/${order.clientState} - CEP: ${order.clientZipCode}</p>
            </div>
            <p><strong>Data:</strong> ${new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
            <p><strong>Tipo:</strong> Ordem de Serviço</p>
            <p><strong>Status:</strong> ${order.status}</p>
            ${order.payments && order.payments.length > 0 ? `
                <div class="mt-4 mb-4 pb-2 border-b border-gray-200">
                   <strong>Forma de Pagto:</strong><br/>
                   ${order.payments.map((p: any) => 
                     `- ${p.method} ${p.installments ? `(${p.installments}x)` : ''} ${p.interestRate ? `(Juros: ${p.interestRate}%)` : ''}: R$ ${p.amount.toFixed(2).replace('.', ',')}<br/>`
                   ).join('')}
                </div>
            ` : (order.paymentMethod ? `<p><strong>Forma de Pagto:</strong> ${order.paymentMethod}</p>` : '')}

            <h3 class="text-xl font-semibold mt-6 mb-3">Produtos a serem confeccionados:</h3>
            <table>
                <thead>
                    <tr>
                        <th>Produto</th>
                        <th class="text-right">Quantidade</th>
                        <th class="text-right">Preço Unit.</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map((item) => `
                        <tr>
                            <td>${item.name}</td>
                            <td class="text-right">${item.quantity}</td>
                            <td class="text-right">${formatCurrency(item.price)}</td>
                            <td class="text-right">${formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            ${order.productionDetails && order.productionDetails.length > 0 ? `
                <div class="production-details-section">
                    <h3 class="text-xl font-semibold mb-3">Detalhes de Produção:</h3>
                    <ul>
                        ${order.productionDetails.map(prodItem => `
                            <li>- ${prodItem.name} (${prodItem.type === 'raw_material' ? 'Matéria Prima' : 'Mão de Obra'}): ${prodItem.quantityUsed} ${prodItem.unit} @ ${formatCurrency(prodItem.costPerUnit)} cada</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            <div class="order-summary text-right mt-6">
                <h3 class="text-2xl font-bold">Total (Preço do Serviço): ${formatCurrency(order.total)}</h3>
            </div>
            <p class="mt-8 text-center text-sm text-gray-500">
                Obrigado pela preferência!
            </p>
        `);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
    } else {
        alert('Erro ao abrir janela de impressão.');
    }
  };

  const handleWhatsAppOrderInvoice = (order: Order) => {
    if (!canPrintOrSendOrder) {
      alert('Você não tem permissão para enviar ordens de serviço via WhatsApp.');
      return;
    }
    if (!order) {
      alert('Nenhuma ordem selecionada para enviar via WhatsApp.');
      return;
    }
    const whatsappLink = generateWhatsAppInvoiceLink(order, companyInfo.name);
    window.open(whatsappLink, '_blank');
  };

  const canPrintOrSend = true; // Still based on selectedOrder existence and permission
  const printButtonLabel = 'Imprimir Ordem de Serviço';
  const whatsappButtonLabel = 'Enviar O.S. via WhatsApp';


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Ordens de Serviço</h2>
        {canCreateServiceOrder && ( // Only show button if user has permission
          <Button onClick={openNewOrderModal} icon={<Plus className="h-5 w-5" />}>
            Nova Ordem de Serviço
          </Button>
        )}
      </div>


      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          id="orderSearch"
          placeholder="Buscar por cliente, ID, CPF, endereço ou produto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sm:flex-1"
        />
        <Select
          id="filterStatus"
          label=""
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'all')}
          options={[{ value: 'all', label: 'Todos os Status' }, ...ORDER_STATUS_OPTIONS.map(s => ({ value: s, label: s }))]}
          containerClassName="sm:w-auto"
        />
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-600 text-lg">Nenhuma ordem de serviço encontrada.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endereço
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço do Serviço
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.clientName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.clientStreet}, {order.clientNumber} - {order.clientCity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewModal(order)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                        icon={<Eye className="h-4 w-4" />}
                      >
                        Ver Detalhes
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(order)}
                        className="text-blue-600 hover:text-blue-900"
                        icon={<Edit className="h-4 w-4" />}
                        disabled={!canEditServiceOrder} // Disabled if no permission
                      >
                        Editar
                      </Button>
                      <Select
                        id={`status-change-${order.id}`}
                        label=""
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        options={ORDER_STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                        className="inline-flex w-auto py-1.5 pl-3 pr-8 text-xs bg-gray-50 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 rounded-md ml-2"
                        containerClassName="inline-block"
                        disabled={!canEditOrderStatus} // Disabled if no permission
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrder && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={closeViewModal}
          title={`Detalhes da Ordem de Serviço #${selectedOrder.id}`}
          size="lg"
        >
          <div className="space-y-4 text-gray-700">
            <p><strong>Cliente:</strong> {selectedOrder.clientName}</p>
            <p><strong>Contato:</strong> {selectedOrder.clientContact}</p>
            <p><strong>CPF:</strong> {selectedOrder.clientCpf}</p>
            <div className="address-info">
                <p><strong>Endereço:</strong> {selectedOrder.clientStreet}, {selectedOrder.clientNumber} - {selectedOrder.clientNeighborhood}</p>
                <p>{selectedOrder.clientCity}/{selectedOrder.clientState} - CEP: {selectedOrder.clientZipCode}</p>
            </div>
            <p><strong>Tipo:</strong> Ordem de Serviço</p>
            <p><strong>Status:</strong> <span className={`px-2 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${ORDER_STATUS_COLORS[selectedOrder.status]}`}>{selectedOrder.status}</span></p>
            {selectedOrder.payments && selectedOrder.payments.length > 0 ? (
               <div className="mt-2 bg-gray-50 p-3 rounded border border-gray-100 mb-2">
                 <p className="font-semibold text-gray-700 mb-1">Pagamentos:</p>
                 {selectedOrder.payments.map(p => (
                    <div key={p.id} className="text-sm text-gray-600 flex justify-between border-b border-gray-200 last:border-0 pb-1 pt-1">
                       <span>{p.method} {p.installments ? `(${p.installments}x)`:''} {p.interestRate ? `(+${p.interestRate}%)` : ''}</span>
                       <span>R$ {p.amount.toFixed(2).replace('.', ',')}</span>
                    </div>
                 ))}
               </div>
            ) : (
               selectedOrder.paymentMethod && <p><strong>Forma de Pagamento:</strong> {selectedOrder.paymentMethod}</p>
            )}
            <p><strong>Criado em:</strong> {formatDateTime(selectedOrder.createdAt)}</p>
            <p><strong>Última Atualização:</strong> {formatDateTime(selectedOrder.updatedAt)}</p>

            <h3 className="text-lg font-semibold mt-6 mb-2">Produtos a serem confeccionados:</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Preço Unit.</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {selectedOrder.items.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{item.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{item.quantity}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedOrder.productionDetails && selectedOrder.productionDetails.length > 0 && (
                <div className="pt-4 border-t border-gray-100 mt-6">
                    <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center"><Factory className="h-5 w-5 mr-2" /> Detalhes de Produção:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        {selectedOrder.productionDetails.map(prodItem => (
                            <li key={prodItem.id}>
                                <strong>{prodItem.name}</strong> ({prodItem.type === 'raw_material' ? 'Matéria Prima' : 'Mão de Obra'}): {prodItem.quantityUsed} {prodItem.unit} @ {formatCurrency(prodItem.costPerUnit)} cada
                                {prodItem.notes && <span className="text-gray-500 italic ml-2">({prodItem.notes})</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <h3 className="text-xl font-bold text-right mt-6">Total (Preço do Serviço): {formatCurrency(selectedOrder.total)}</h3>

            {canPrintOrSendOrder && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                    <Button
                        variant="secondary"
                        onClick={() => handlePrintOrderInvoice(selectedOrder)}
                        icon={<Printer className="h-5 w-5" />}
                        disabled={!canPrintOrSendOrder}
                    >
                        {printButtonLabel}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => handleWhatsAppOrderInvoice(selectedOrder)}
                        className="bg-green-500 hover:bg-green-600 text-white"
                        icon={<MessageSquareText className="h-5 w-5" />}
                        disabled={!canPrintOrSendOrder}
                    >
                        {whatsappButtonLabel}
                    </Button>
                </div>
            )}
          </div>
        </Modal>
      )}

      {selectedOrder && (
        <Modal
          isOpen={isEditOrderModalOpen}
          onClose={closeEditModal}
          title={`Editar Ordem de Serviço #${selectedOrder.id}`}
          size="xl"
        >
          <EditOrderModal
            order={selectedOrder}
            products={products}
            clients={clients}
            rawMaterials={rawMaterials}
            onSave={handleSaveOrder}
            onCancel={closeEditModal}
            addClient={addClient}
            updateClient={updateClient}
          />
        </Modal>
      )}

      {isNewOrderModalOpen && (
        <Modal
          isOpen={isNewOrderModalOpen}
          onClose={closeNewOrderModal}
          title="Criar Nova Ordem de Serviço"
          size="xl"
        >
          <EditOrderModal
            order={null}
            initialOrderType="service-order"
            products={products}
            clients={clients}
            rawMaterials={rawMaterials}
            onSave={handleSaveOrder}
            onCancel={closeNewOrderModal}
            addClient={addClient}
            updateClient={updateClient}
          />
        </Modal>
      )}

      <div ref={printAreaRef} className="absolute -left-[9999px] top-0 p-8"></div>
    </div>
  );
};