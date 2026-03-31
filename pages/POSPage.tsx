import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '../App';
import { Product, CartItem, Order, OrderStatus, Client, UserRole } from '../types';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { formatCurrency } from '../utils/currencyFormatter';
import { generateWhatsAppInvoiceLink } from '../utils/whatsappLinkGenerator';
import { PlusCircle, MinusCircle, Trash2, Printer, MessageSquareText, DollarSign, ScrollText, CheckCircle, Loader2 } from 'lucide-react';
import { ORDER_STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS } from '../constants';
import { Modal } from '../components/Modal';
import { fetchAddressByCep } from '../utils/cepService';

export const POSPage: React.FC = () => {
  const { products, addOrder, companyInfo, clients, addClient, updateClient, checkPermission } = useAuth(); // Use checkPermission

  const canFinalizeSale = checkPermission('canFinalizeSale');
  const canGenerateBudget = checkPermission('canGenerateBudget');
  const canEditOrderItems = checkPermission('canEditOrderItems');
  const canPrintOrSendOrder = checkPermission('canPrintOrSendOrder');

  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientCpf, setClientCpf] = useState('');
  const [clientZipCode, setClientZipCode] = useState('');
  const [clientStreet, setClientStreet] = useState('');
  const [clientNumber, setClientNumber] = useState('');
  const [clientNeighborhood, setClientNeighborhood] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientState, setClientState] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [isClientFound, setIsClientFound] = useState(false);

  const [orderType, setOrderType] = useState<'sale' | 'service-order' | 'budget'>('sale');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [servicePrice, setServicePrice] = useState('0.00');
  const [isCheckoutSuccessModalOpen, setIsCheckoutSuccessModalOpen] = useState(false);
  const [checkoutSuccessOrder, setCheckoutSuccessOrder] = useState<Order | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) && product.stock > 0
    );
  }, [products, searchTerm]);

  const addToCart = (product: Product) => {
    if (!canEditOrderItems) {
      alert('Você não tem permissão para adicionar itens ao carrinho.');
      return;
    }
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id && item.quantity < product.stock
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    if (!canEditOrderItems) {
      alert('Você não tem permissão para alterar a quantidade de itens no carrinho.');
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === itemId) {
          const productInStock = products.find(p => p.id === itemId);
          const maxQuantity = productInStock ? productInStock.stock : item.quantity;
          const quantity = Math.max(1, Math.min(newQuantity, maxQuantity));
          return { ...item, quantity };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (itemId: string) => {
    if (!canEditOrderItems) {
      alert('Você não tem permissão para remover itens do carrinho.');
      return;
    }
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const calculatedSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setClientZipCode(value);

    if (value.length === 8) {
      setCepLoading(true);
      setCepError(null);
      try {
        const address = await fetchAddressByCep(value);
        setClientStreet(address.street);
        setClientNeighborhood(address.neighborhood);
        setClientCity(address.city);
        setClientState(address.state);
      } catch (error: any) {
        setCepError(error.message);
        setClientStreet('');
        setClientNeighborhood('');
        setClientCity('');
        setClientState('');
      } finally {
        setCepLoading(false);
      }
    } else {
      setCepError(null);
    }
  };

  // --- Client Search by CPF ---
  React.useEffect(() => {
    const cleanCpf = clientCpf.replace(/\D/g, '');
    if (cleanCpf.length === 11) {
      const foundClient = clients.find(c => c.cpf.replace(/\D/g, '') === cleanCpf);
      if (foundClient) {
        setClientName(foundClient.name);
        setClientContact(foundClient.contact);
        setClientZipCode(foundClient.zipCode);
        setClientStreet(foundClient.street);
        setClientNumber(foundClient.number);
        setClientNeighborhood(foundClient.neighborhood);
        setClientCity(foundClient.city);
        setClientState(foundClient.state);
        setIsClientFound(true);
      } else {
        setIsClientFound(false);
      }
    } else {
      setIsClientFound(false);
    }
  }, [clientCpf, clients]);

  const handleCheckout = () => {
    if (orderType === 'sale' && !canFinalizeSale) {
      alert('Você não tem permissão para finalizar vendas.');
      return;
    }
    if (orderType === 'budget' && !canGenerateBudget) {
      alert('Você não tem permissão para gerar orçamentos.');
      return;
    }
    if (orderType === 'service-order' && !checkPermission('canCreateServiceOrder')) { // Assuming a specific permission for creating service orders from POS
      alert('Você não tem permissão para criar ordens de serviço.');
      return;
    }

    if (cart.length === 0) {
      alert('O carrinho está vazio.');
      return;
    }
    if (orderType !== 'budget' && !paymentMethod) {
      alert('Por favor, selecione uma forma de pagamento.');
      return;
    }
    if (!clientName.trim() || !clientContact.trim() || !clientCpf.trim()) {
      alert('Por favor, preencha nome, contato e CPF do cliente.');
      return;
    }
    if (!clientZipCode.trim() || clientZipCode.trim().replace(/\D/g, '').length !== 8 || !clientStreet.trim() || !clientNumber.trim() || !clientNeighborhood.trim() || !clientCity.trim() || !clientState.trim()) {
      alert('Por favor, preencha o endereço completo do cliente (CEP, Rua, Número, Bairro, Cidade, Estado).');
      return;
    }

    let finalOrderTotal: number;
    if (orderType === 'service-order') {
      const parsedServicePrice = parseFloat(servicePrice);
      if (isNaN(parsedServicePrice) || parsedServicePrice <= 0) {
        alert('Por favor, insira um preço de serviço válido para a Ordem de Serviço.');
        return;
      }
      finalOrderTotal = parsedServicePrice;
    } else {
      finalOrderTotal = calculatedSubtotal;
    }

    let status: OrderStatus;
    if (orderType === 'budget') {
      status = OrderStatus.BUDGET;
    } else {
      status = OrderStatus.COMPLETED;
    }

    const existingClient = clients.find(
      (c) => c.cpf === clientCpf.trim() || c.contact === clientContact.trim()
    );

    if (existingClient) {
      if (
        existingClient.name !== clientName.trim() ||
        existingClient.contact !== clientContact.trim() ||
        existingClient.cpf !== clientCpf.trim() ||
        existingClient.zipCode !== clientZipCode.trim() ||
        existingClient.street !== clientStreet.trim() ||
        existingClient.number !== clientNumber.trim() ||
        existingClient.neighborhood !== clientNeighborhood.trim() ||
        existingClient.city !== clientCity.trim() ||
        existingClient.state !== clientState.trim()
      ) {
        updateClient({
          ...existingClient,
          name: clientName.trim(),
          contact: clientContact.trim(),
          cpf: clientCpf.trim(),
          zipCode: clientZipCode.trim(),
          street: clientStreet.trim(),
          number: clientNumber.trim(),
          neighborhood: clientNeighborhood.trim(),
          city: clientCity.trim(),
          state: clientState.trim(),
        });
      }
    } else {
      addClient({
        id: '',
        name: clientName.trim(),
        contact: clientContact.trim(),
        cpf: clientCpf.trim(),
        zipCode: clientZipCode.trim(),
        street: clientStreet.trim(),
        number: clientNumber.trim(),
        neighborhood: clientNeighborhood.trim(),
        city: clientCity.trim(),
        state: clientState.trim(),
      });
    }

    const newOrderData: Order = {
      id: '',
      type: orderType,
      clientName: clientName.trim(),
      clientContact: clientContact.trim(),
      clientCpf: clientCpf.trim(),
      clientZipCode: clientZipCode.trim(),
      clientStreet: clientStreet.trim(),
      clientNumber: clientNumber.trim(),
      clientNeighborhood: clientNeighborhood.trim(),
      clientCity: clientCity.trim(),
      clientState: clientState.trim(),
      items: cart,
      total: finalOrderTotal,
      paymentMethod: orderType === 'budget' ? 'N/A' : paymentMethod,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      productionDetails: orderType === 'service-order' ? [] : undefined,
    };

    const addedOrder = addOrder(newOrderData);

    setCheckoutSuccessOrder(addedOrder);
    setIsCheckoutSuccessModalOpen(true);

    resetPOS();
  };

  const resetPOS = () => {
    setSearchTerm('');
    setCart([]);
    setClientName('');
    setClientContact('');
    setClientCpf('');
    setClientZipCode('');
    setClientStreet('');
    setClientNumber('');
    setClientNeighborhood('');
    setClientCity('');
    setClientState('');
    setCepError(null);
    setCepLoading(false);
    setOrderType('sale');
    setPaymentMethod('');
    setServicePrice('0.00');
  };

  const handlePrint = (order: Order) => {
    if (!canPrintOrSendOrder) {
      alert('Você não tem permissão para imprimir ordens/orçamentos.');
      return;
    }
    if (!order) {
      alert('Nenhuma ordem para imprimir.');
      return;
    }

    const docTitle = order.type === 'budget' ? 'Imprimir Orçamento' : 'Imprimir Cupom Fiscal';
    const documentTypeLabel = order.type === 'budget' ? 'Orçamento' : 'Cupom Fiscal de Venda/Serviço';

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
            <p><strong>ID do Pedido:</strong> ${order.id}</p>
            <p><strong>Cliente:</strong> ${order.clientName}</p>
            <p><strong>Contato:</strong> ${order.clientContact}</p>
            <p><strong>CPF:</strong> ${order.clientCpf}</p>
            <div class="address-info">
                <p><strong>Endereço:</strong> ${order.clientStreet}, ${order.clientNumber} - ${order.clientNeighborhood}</p>
                <p>${order.clientCity}/${order.clientState} - CEP: ${order.clientZipCode}</p>
            </div>
            <p><strong>Data:</strong> ${new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
            <p><strong>Tipo:</strong> ${order.type === 'sale' ? 'Venda Direta' : order.type === 'service-order' ? 'Ordem de Serviço' : 'Orçamento'}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            ${order.paymentMethod && order.type !== 'budget' ? `<p><strong>Forma de Pagto:</strong> ${order.paymentMethod}</p>` : ''}

            <h3 class="text-xl font-semibold mt-6 mb-3">${order.type === 'service-order' ? 'Produtos a serem confeccionados:' : 'Itens'}:</h3>
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

            ${order.type === 'service-order' && order.productionDetails && order.productionDetails.length > 0 ? `
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
                <h3 class="text-2xl font-bold">Total ${order.type === 'service-order' ? '(Preço do Serviço)' : ''}: ${formatCurrency(order.total)}</h3>
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

  const handleWhatsAppInvoice = (order: Order) => {
    if (!canPrintOrSendOrder) {
      alert('Você não tem permissão para enviar ordens/orçamentos via WhatsApp.');
      return;
    }
    if (!order) {
      alert('Nenhuma ordem para enviar via WhatsApp.');
      return;
    }
    const whatsappLink = generateWhatsAppInvoiceLink(order, companyInfo.name);
    window.open(whatsappLink, '_blank');
  };

  const closeCheckoutSuccessModal = () => {
    setIsCheckoutSuccessModalOpen(false);
    setCheckoutSuccessOrder(null);
  };

  const currentPrintTitle = checkoutSuccessOrder?.type === 'budget' ? 'Imprimir Orçamento' : 'Imprimir Cupom Fiscal';
  const currentWhatsAppTitle = checkoutSuccessOrder?.type === 'budget' ? 'Enviar Orçamento via WhatsApp' : 'Enviar Cupom Fiscal via WhatsApp';

  // Determine if checkout button should be enabled
  const isCheckoutDisabled = useMemo(() => {
    const baseConditions = cart.length === 0 || !clientName || !clientContact || !clientCpf || !clientZipCode || !clientStreet || !clientNumber || !clientNeighborhood || !clientCity || !clientState;
    if (baseConditions) return true;

    if (orderType !== 'budget' && !paymentMethod) return true;

    if (orderType === 'sale' && !canFinalizeSale) return true;
    if (orderType === 'budget' && !canGenerateBudget) return true;
    if (orderType === 'service-order' && !checkPermission('canCreateServiceOrder')) return true;

    if (orderType === 'service-order' && (parseFloat(servicePrice) <= 0 || isNaN(parseFloat(servicePrice)))) return true;

    return false;
  }, [cart, clientName, clientContact, clientCpf, clientZipCode, clientStreet, clientNumber, clientNeighborhood, clientCity, clientState, orderType, servicePrice, paymentMethod, canFinalizeSale, canGenerateBudget, checkPermission]);


  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 h-full">
      {/* Product Search & List */}
      <div className="w-full md:w-1/2 bg-white shadow-md rounded-lg p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Produtos Disponíveis</h2>
        <Input
          id="productSearch"
          placeholder="Buscar produto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`border border-gray-200 rounded-lg p-3 flex flex-col items-center text-center cursor-pointer transition-shadow ${canEditOrderItems ? 'hover:shadow-lg' : 'opacity-70 cursor-not-allowed'}`}
              onClick={() => canEditOrderItems && addToCart(product)}
            >
              <img src={product.imageUrl} alt={product.name} className="h-20 w-20 object-cover rounded-md mb-2" />
              <h3 className="font-medium text-gray-800 text-sm truncate w-full">{product.name}</h3>
              <p className="text-gray-600 text-xs">{formatCurrency(product.price)}</p>
              <p className="text-gray-500 text-xs">Estoque: {product.stock}</p>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <p className="col-span-full text-center text-gray-500 py-4">Nenhum produto encontrado ou em estoque.</p>
          )}
        </div>
      </div>

      {/* Cart and Checkout */}
      <div className="w-full md:w-1/2 bg-white shadow-md rounded-lg p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Carrinho / Checkout</h2>

        <div className="mb-4">
            <Select
                id="orderType"
                label="Tipo de Transação"
                value={orderType}
                onChange={(e) => {
                    setOrderType(e.target.value as 'sale' | 'service-order' | 'budget');
                    setServicePrice('0.00');
                }}
                options={[
                    { value: 'sale', label: 'Venda Direta' },
                    { value: 'budget', label: 'Orçamento' },
                    { value: 'service-order', label: 'Ordem de Serviço' },
                ]}
                containerClassName="mb-4"
            />
            {orderType !== 'budget' && (
                <Select
                    id="paymentMethod"
                    label="Forma de Pagamento"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    options={[{ value: '', label: 'Selecione...' }, ...PAYMENT_METHOD_OPTIONS]}
                    containerClassName="mb-4"
                    required
                />
            )}
            {orderType === 'service-order' && (
                <Input
                    id="servicePrice"
                    label="Preço do Serviço (R$)"
                    type="number"
                    step="0.01"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    placeholder="0.00"
                    className="mb-4"
                    required
                />
            )}
            <Input
              id="clientName"
              label="Nome do Cliente"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nome do cliente"
              className="mb-2"
            />
            <Input
              id="clientContact"
              label="Contato do Cliente (WhatsApp)"
              value={clientContact}
              onChange={(e) => setClientContact(e.target.value)}
              placeholder="Ex: 5511987654321"
              type="tel"
              className="mb-2"
            />
            <Input
              id="clientCpf"
              label="CPF do Cliente"
              value={clientCpf}
              onChange={(e) => setClientCpf(e.target.value)}
              placeholder="Ex: 123.456.789-00"
              maxLength={14}
              className="mb-1"
              icon={isClientFound ? <CheckCircle className="h-5 w-5 text-green-500" /> : undefined}
            />
            {isClientFound && (
              <p className="text-xs text-green-600 mb-4 font-medium flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Cliente cadastrado encontrado! Dados preenchidos.
              </p>
            )}
            {!isClientFound && <div className="mb-4" />}

            <h3 className="text-lg font-semibold text-gray-800 mb-3 pt-4 border-t border-gray-100">Endereço do Cliente</h3>
            <Input
              id="clientZipCode"
              label="CEP"
              value={clientZipCode}
              onChange={handleCepChange}
              error={cepError}
              placeholder="Ex: 12345-678"
              maxLength={9}
              icon={cepLoading ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" /> : undefined}
              className="mb-2"
            />
            <Input
              id="clientStreet"
              label="Rua"
              value={clientStreet}
              onChange={(e) => setClientStreet(e.target.value)}
              placeholder="Ex: Rua das Flores"
              className="mb-2"
              disabled={cepLoading}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <Input
                id="clientNumber"
                label="Número"
                value={clientNumber}
                onChange={(e) => setClientNumber(e.target.value)}
                placeholder="Ex: 123"
                />
                <Input
                id="clientNeighborhood"
                label="Bairro"
                value={clientNeighborhood}
                onChange={(e) => setClientNeighborhood(e.target.value)}
                placeholder="Ex: Centro"
                disabled={cepLoading}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                id="clientCity"
                label="Cidade"
                value={clientCity}
                onChange={(e) => setClientCity(e.target.value)}
                placeholder="Ex: São Paulo"
                disabled={cepLoading}
                />
                <Input
                id="clientState"
                label="Estado (UF)"
                value={clientState}
                onChange={(e) => setClientState(e.target.value)}
                placeholder="Ex: SP"
                maxLength={2}
                disabled={cepLoading}
                />
            </div>
        </div>


        <div className="border-t border-b border-gray-200 py-4 mb-4">
          {cart.length === 0 ? (
            <p className="text-center text-gray-500">Carrinho vazio.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto pr-2">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <img src={item.imageUrl} alt={item.name} className="h-10 w-10 object-cover rounded-md mr-3" />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                      <p className="text-gray-600 text-xs">{formatCurrency(item.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || !canEditOrderItems} // Disabled if no permission
                      icon={<MinusCircle className="h-4 w-4" />}
                    />
                    <span className="mx-2 text-gray-700">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock || !canEditOrderItems} // Disabled if no permission
                      icon={<PlusCircle className="h-4 w-4" />}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="ml-3"
                      icon={<Trash2 className="h-4 w-4" />}
                      disabled={!canEditOrderItems} // Disabled if no permission
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center text-xl font-bold text-gray-800 mb-6">
          <span>Total {orderType === 'service-order' ? '(Preço do Serviço)' : ''}:</span>
          <span>{orderType === 'service-order' ? formatCurrency(parseFloat(servicePrice) || 0) : formatCurrency(calculatedSubtotal)}</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Button
            variant="primary"
            onClick={handleCheckout}
            disabled={isCheckoutDisabled} // Use memoized disabled state
            icon={orderType === 'budget' ? <ScrollText className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
          >
            {orderType === 'budget' ? 'Gerar Orçamento' : 'Finalizar Venda'}
          </Button>
        </div>
      </div>

      <div ref={printAreaRef} className="absolute -left-[9999px] top-0 p-8 hidden-print">
      </div>

      {checkoutSuccessOrder && (
        <Modal
          isOpen={isCheckoutSuccessModalOpen}
          onClose={closeCheckoutSuccessModal}
          title={checkoutSuccessOrder.type === 'budget' ? 'Orçamento Gerado com Sucesso!' : 'Venda Finalizada!'}
          size="lg"
          autoPrint={checkoutSuccessOrder.type !== 'budget'}
        >
          <div className="text-center py-4">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <p className="text-xl font-semibold text-gray-800 mb-2">
              Pedido <span className="text-indigo-600">#{checkoutSuccessOrder.id}</span> foi {checkoutSuccessOrder.type === 'budget' ? 'gerado' : 'finalizado'}!
            </p>
            <p className="text-gray-600">Total: {formatCurrency(checkoutSuccessOrder.total)}</p>
            {checkoutSuccessOrder.paymentMethod && checkoutSuccessOrder.type !== 'budget' && (
               <p className="text-gray-500 mb-6">Forma de Pagto: {checkoutSuccessOrder.paymentMethod}</p>
            )}
            {checkoutSuccessOrder.type === 'budget' && <div className="mb-6"></div>}

            {checkoutSuccessOrder.type !== 'budget' ? (
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => handlePrint(checkoutSuccessOrder)}
                  icon={<Printer className="h-5 w-5" />}
                  disabled={!canPrintOrSendOrder}
                >
                  {currentPrintTitle}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleWhatsAppInvoice(checkoutSuccessOrder)}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  icon={<MessageSquareText className="h-5 w-5" />}
                  disabled={!canPrintOrSendOrder}
                >
                  {currentWhatsAppTitle}
                </Button>
              </div>
            ) : (
              <p className="text-gray-500">
                Você pode gerenciar este orçamento na seção "Orçamentos".
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};