import React, { useState, useEffect, useMemo } from 'react';
import { Order, CartItem, Product, OrderStatus, Client, ProductionItem, RawMaterial, UserRole } from '../types';
import { Button } from '../components/Button';
import { Input, Select, Textarea } from '../components/Input';
import { formatCurrency } from '../utils/currencyFormatter';
import { PlusCircle, MinusCircle, Trash2, Search, Users, Scissors, Factory } from 'lucide-react';
import { ORDER_STATUS_OPTIONS, ORDER_TYPE_OPTIONS } from '../constants';
import { useAuth } from '../App';

interface EditOrderModalProps {
  order: Order | null;
  initialOrderType?: Order['type'];
  products: Product[];
  clients: Client[];
  rawMaterials: RawMaterial[];
  onSave: (order: Order) => void;
  onCancel: () => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  order,
  initialOrderType = 'service-order',
  products,
  clients,
  rawMaterials,
  onSave,
  onCancel,
  addClient,
  updateClient,
}) => {
  const { currentUser, checkPermission } = useAuth(); // Use checkPermission

  const canEditServiceOrder = checkPermission('canEditServiceOrder');
  const canCreateServiceOrder = checkPermission('canCreateServiceOrder');
  const canEditBudget = checkPermission('canEditBudget');
  const canEditOrderItems = checkPermission('canEditOrderItems');
  const canEditProductionDetails = checkPermission('canEditProductionDetails');

  const isEditing = !!order;
  // Determine if the current user can save based on whether it's a new order or an existing one, and its type
  const canSave = isEditing
    ? (order?.type === 'service-order' && canEditServiceOrder) || (order?.type === 'budget' && canEditBudget)
    : (initialOrderType === 'service-order' && canCreateServiceOrder) || (initialOrderType === 'budget' && canEditBudget); // Assuming canEditBudget allows creation too for simplicity


  // Initialize states with order data or defaults for new orders
  const [currentClientName, setCurrentClientName] = useState(order?.clientName || '');
  const [currentClientContact, setCurrentClientContact] = useState(order?.clientContact || '');
  const [currentClientCpf, setCurrentClientCpf] = useState(order?.clientCpf || '');
  // New address states for the client in the order modal
  const [currentClientZipCode, setCurrentClientZipCode] = useState(order?.clientZipCode || '');
  const [currentClientStreet, setCurrentClientStreet] = useState(order?.clientStreet || '');
  const [currentClientNumber, setCurrentClientNumber] = useState(order?.clientNumber || '');
  const [currentClientNeighborhood, setCurrentClientNeighborhood] = useState(order?.clientNeighborhood || '');
  const [currentClientCity, setCurrentClientCity] = useState(order?.clientCity || '');
  const [currentClientState, setCurrentClientState] = useState(order?.clientState || '');

  const [currentOrderType, setCurrentOrderType] = useState(order?.type || initialOrderType);
  const [currentOrderStatus, setCurrentOrderStatus] = useState(order?.status || OrderStatus.PENDING);
  const [currentCart, setCurrentCart] = useState<CartItem[]>(order?.items || []);
  const [currentServicePrice, setCurrentServicePrice] = useState(order?.type === 'service-order' ? order.total.toFixed(2) : '0.00');
  const [currentProductionDetails, setCurrentProductionDetails] = useState<ProductionItem[]>(order?.productionDetails || []);

  // States for adding new production item
  const [newProdItemName, setNewProdItemName] = useState('');
  const [newProdItemType, setNewProdItemType] = useState<'raw_material' | 'labor'>('raw_material');
  const [newProdItemUnit, setNewProdItemUnit] = useState('unidade');
  const [newProdItemQuantityUsed, setNewProdItemQuantityUsed] = useState('0');
  const [newProdItemCostPerUnit, setNewProdItemCostPerUnit] = useState('0.00');
  const [newProdItemNotes, setNewProdItemNotes] = useState('');
  const [newProdItemSearchTerm, setNewProdItemSearchTerm] = useState('');

  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Reset states when a different order is passed (or when it changes from null to an order/vice versa)
  useEffect(() => {
    setCurrentClientName(order?.clientName || '');
    setCurrentClientContact(order?.clientContact || '');
    setCurrentClientCpf(order?.clientCpf || '');
    // Reset address fields
    setCurrentClientZipCode(order?.clientZipCode || '');
    setCurrentClientStreet(order?.clientStreet || '');
    setCurrentClientNumber(order?.clientNumber || '');
    setCurrentClientNeighborhood(order?.clientNeighborhood || '');
    setCurrentClientCity(order?.clientCity || '');
    setCurrentClientState(order?.clientState || '');

    setCurrentOrderType(order?.type || initialOrderType);
    setCurrentOrderStatus(order?.status || OrderStatus.PENDING);
    setCurrentCart(order?.items || []);
    setCurrentServicePrice(order?.type === 'service-order' ? order.total.toFixed(2) : '0.00');
    setCurrentProductionDetails(order?.productionDetails || []);

    setProductSearchTerm('');
    setClientSearchTerm('');
    setFormErrors({});

    // Reset new production item form fields
    setNewProdItemName('');
    setNewProdItemType('raw_material');
    setNewProdItemUnit('unidade');
    setNewProdItemQuantityUsed('0');
    setNewProdItemCostPerUnit('0.00');
    setNewProdItemNotes('');
    setNewProdItemSearchTerm('');
  }, [order, initialOrderType]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!currentClientName.trim()) errors.clientName = 'Nome do cliente é obrigatório.';
    if (!currentClientContact.trim()) errors.clientContact = 'Contato do cliente é obrigatório.';
    if (!currentClientCpf.trim()) errors.clientCpf = 'CPF do cliente é obrigatório.';
    if (currentClientCpf.trim().length !== 11 && currentClientCpf.trim().length !== 14) errors.clientCpf = 'CPF inválido (use 11 ou 14 dígitos).';
    // New address validations
    if (!currentClientZipCode.trim()) errors.clientZipCode = 'CEP é obrigatório.';
    if (currentClientZipCode.trim().replace(/\D/g, '').length !== 8) errors.clientZipCode = 'CEP inválido.';
    if (!currentClientStreet.trim()) errors.clientStreet = 'Rua é obrigatória.';
    if (!currentClientNumber.trim()) errors.clientNumber = 'Número é obrigatório.';
    if (!currentClientNeighborhood.trim()) errors.neighborhood = 'Bairro é obrigatório.';
    if (!currentClientCity.trim()) errors.city = 'Cidade é obrigatória.';
    if (!currentClientState.trim()) errors.state = 'Estado é obrigatória.';

    if (currentCart.length === 0) errors.cart = 'A ordem deve ter pelo menos um item.';

    if (currentOrderType === 'service-order') {
      const parsedServicePrice = parseFloat(currentServicePrice);
      if (isNaN(parsedServicePrice) || parsedServicePrice <= 0) {
        errors.servicePrice = 'Preço do serviço é obrigatório e deve ser maior que zero.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) && product.stock > 0
    );
  }, [products, productSearchTerm]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) =>
      client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.contact.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.cpf.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.zipCode.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.street.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.neighborhood.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.city.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.state.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );
  }, [clients, clientSearchTerm]);

  const filteredRawMaterials = useMemo(() => {
    return rawMaterials.filter(rm =>
      rm.name.toLowerCase().includes(newProdItemSearchTerm.toLowerCase()) ||
      rm.supplier.toLowerCase().includes(newProdItemSearchTerm.toLowerCase())
    );
  }, [rawMaterials, newProdItemSearchTerm]);

  const handleSelectClient = (selectedClient: Client) => {
    setCurrentClientName(selectedClient.name);
    setCurrentClientContact(selectedClient.contact);
    setCurrentClientCpf(selectedClient.cpf);
    setCurrentClientZipCode(selectedClient.zipCode);
    setCurrentClientStreet(selectedClient.street);
    setCurrentClientNumber(selectedClient.number);
    setCurrentClientNeighborhood(selectedClient.neighborhood);
    setCurrentClientCity(selectedClient.city);
    setCurrentClientState(selectedClient.state);
    setClientSearchTerm('');
  };

  const handleSelectRawMaterial = (selectedRawMaterial: RawMaterial) => {
    setNewProdItemName(selectedRawMaterial.name);
    setNewProdItemType('raw_material');
    setNewProdItemUnit(selectedRawMaterial.unit);
    setNewProdItemCostPerUnit(selectedRawMaterial.costPerUnit.toFixed(2));
    setNewProdItemSearchTerm('');
  }

  const addToCart = (product: Product) => {
    if (!canEditOrderItems) {
      alert('Você não tem permissão para adicionar itens à ordem.');
      return;
    }
    setCurrentCart((prevCart) => {
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
      alert('Você não tem permissão para alterar a quantidade de itens na ordem.');
      return;
    }
    setCurrentCart((prevCart) =>
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
      alert('Você não tem permissão para remover itens da ordem.');
      return;
    }
    setCurrentCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const addProductionItem = () => {
    if (!canEditProductionDetails) {
      alert('Você não tem permissão para adicionar itens de produção.');
      return;
    }
    if (!newProdItemName.trim() || parseFloat(newProdItemQuantityUsed) <= 0 || isNaN(parseFloat(newProdItemQuantityUsed)) || parseFloat(newProdItemCostPerUnit) < 0 || isNaN(parseFloat(newProdItemCostPerUnit))) {
      alert('Por favor, preencha todos os campos obrigatórios e válidos para o item de produção.');
      return;
    }

    const newItem: ProductionItem = {
      id: Date.now().toString(),
      name: newProdItemName.trim(),
      type: newProdItemType,
      unit: newProdItemUnit,
      quantityUsed: parseFloat(newProdItemQuantityUsed),
      costPerUnit: parseFloat(newProdItemCostPerUnit),
      notes: newProdItemNotes.trim(),
    };

    setCurrentProductionDetails((prev) => [...prev, newItem]);
    setNewProdItemName('');
    setNewProdItemType('raw_material');
    setNewProdItemUnit('unidade');
    setNewProdItemQuantityUsed('0');
    setNewProdItemCostPerUnit('0.00');
    setNewProdItemNotes('');
    setNewProdItemSearchTerm('');
  };

  const removeProductionItem = (id: string) => {
    if (!canEditProductionDetails) {
      alert('Você não tem permissão para remover itens de produção.');
      return;
    }
    setCurrentProductionDetails((prev) => prev.filter(item => item.id !== id));
  };

  const calculatedCartSubtotal = useMemo(() => {
    return currentCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [currentCart]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) {
        alert('Você não tem permissão para salvar esta ordem.');
        return;
    }
    if (!validateForm()) {
      return;
    }

    setSaveLoading(true);

    const existingClient = clients.find(
      (c) => c.cpf === currentClientCpf.trim() || c.contact === currentClientContact.trim()
    );

    if (existingClient) {
      if (
        existingClient.name !== currentClientName.trim() ||
        existingClient.contact !== currentClientContact.trim() ||
        existingClient.cpf !== currentClientCpf.trim() ||
        existingClient.zipCode !== currentClientZipCode.trim() ||
        existingClient.street !== currentClientStreet.trim() ||
        existingClient.number !== currentClientNumber.trim() ||
        existingClient.neighborhood !== currentClientNeighborhood.trim() ||
        existingClient.city !== currentClientCity.trim() ||
        existingClient.state !== currentClientState.trim()
      ) {
        updateClient({
          ...existingClient,
          name: currentClientName.trim(),
          contact: currentClientContact.trim(),
          cpf: currentClientCpf.trim(),
          zipCode: currentClientZipCode.trim(),
          street: currentClientStreet.trim(),
          number: currentClientNumber.trim(),
          neighborhood: currentClientNeighborhood.trim(),
          city: currentClientCity.trim(),
          state: currentClientState.trim(),
        });
      }
    } else {
      addClient({
        id: '',
        name: currentClientName.trim(),
        contact: currentClientContact.trim(),
        cpf: currentClientCpf.trim(),
        zipCode: currentClientZipCode.trim(),
        street: currentClientStreet.trim(),
        number: currentClientNumber.trim(),
        neighborhood: currentClientNeighborhood.trim(),
        city: currentClientCity.trim(),
        state: currentClientState.trim(),
      });
    }

    let finalOrderTotal: number;
    let finalProductionDetails: ProductionItem[] | undefined;

    if (currentOrderType === 'service-order') {
        finalOrderTotal = parseFloat(currentServicePrice);
        finalProductionDetails = currentProductionDetails;
    } else {
        finalOrderTotal = calculatedCartSubtotal;
        finalProductionDetails = undefined;
    }


    const orderToSave: Order = {
      id: order?.id || '',
      clientName: currentClientName.trim(),
      clientContact: currentClientContact.trim(),
      clientCpf: currentClientCpf.trim(),
      clientZipCode: currentClientZipCode.trim(),
      clientStreet: currentClientStreet.trim(),
      clientNumber: currentClientNumber.trim(),
      clientNeighborhood: currentClientNeighborhood.trim(),
      clientCity: currentClientCity.trim(),
      clientState: currentClientState.trim(),
      type: currentOrderType,
      status: currentOrderStatus,
      items: currentCart,
      total: finalOrderTotal,
      productionDetails: finalProductionDetails,
      createdAt: order?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(orderToSave);
    setSaveLoading(false);
  };

  const productionItemUnitOptions = [
    { value: 'unidade', label: 'Unidade' },
    { value: 'metros', label: 'Metros' },
    { value: 'kg', label: 'Kilogramas (Kg)' },
    { value: 'horas', label: 'Horas (h)' },
    { value: 'pacote', label: 'Pacote' },
    { value: 'rolo', label: 'Rolo' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Information */}
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center"><Users className="h-5 w-5 mr-2" /> Informações do Cliente</h3>
        <Input
          id="editClientSearch"
          placeholder="Buscar cliente por nome, contato, CPF ou endereço..."
          value={clientSearchTerm}
          onChange={(e) => setClientSearchTerm(e.target.value)}
          className="mb-2"
          disabled={!canSave} // Disabled if no permission to save
        />
        {clientSearchTerm && filteredClients.length > 0 && (
            <div className="bg-white border border-gray-300 rounded-md max-h-40 overflow-y-auto shadow-sm mb-4">
                {filteredClients.map(client => (
                    <div
                        key={client.id}
                        className="p-2 cursor-pointer hover:bg-indigo-50 flex justify-between items-center border-b border-gray-100 last:border-b-0"
                        onClick={() => handleSelectClient(client)}
                    >
                        <div>
                            <p className="font-medium text-gray-800">{client.name}</p>
                            <p className="text-sm text-gray-600">Contato: {client.contact} | CPF: {client.cpf}</p>
                            <p className="text-xs text-gray-500">{client.street}, {client.number} - {client.city}/{client.state}</p>
                        </div>
                        <Button type="button" size="sm" variant="ghost" className="text-indigo-600" disabled={!canSave}>Selecionar</Button>
                    </div>
                ))}
            </div>
        )}

        <Input
          id="editClientName"
          label="Nome do Cliente"
          value={currentClientName}
          onChange={(e) => setCurrentClientName(e.target.value)}
          error={formErrors.clientName}
          required
          disabled={!canSave} // Disabled if no permission to save
        />
        <Input
          id="editClientContact"
          label="Contato do Cliente (WhatsApp)"
          type="tel"
          value={currentClientContact}
          onChange={(e) => setCurrentClientContact(e.target.value)}
          error={formErrors.clientContact}
          placeholder="Ex: 5511987654321"
          required
          disabled={!canSave} // Disabled if no permission to save
        />
        <Input
          id="editClientCpf"
          label="CPF do Cliente"
          value={currentClientCpf}
          onChange={(e) => setCurrentClientCpf(e.target.value)}
          error={formErrors.clientCpf}
          placeholder="Ex: 123.456.789-00"
          maxLength={14}
          required
          className="mb-4"
          disabled={!canSave} // Disabled if no permission to save
        />

        <h4 className="text-md font-semibold text-gray-700 mb-2">Endereço do Cliente</h4>
        <Input
            id="editClientZipCode"
            label="CEP"
            value={currentClientZipCode}
            onChange={(e) => setCurrentClientZipCode(e.target.value.replace(/\D/g, ''))}
            error={formErrors.clientZipCode}
            placeholder="Ex: 12345-678"
            maxLength={9}
            required
            disabled={!canSave} // Disabled if no permission to save
        />
        <Input
            id="editClientStreet"
            label="Rua"
            value={currentClientStreet}
            onChange={(e) => setCurrentClientStreet(e.target.value)}
            error={formErrors.clientStreet}
            placeholder="Ex: Rua das Flores"
            required
            disabled={!canSave} // Disabled if no permission to save
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
                id="editClientNumber"
                label="Número"
                value={currentClientNumber}
                onChange={(e) => setCurrentClientNumber(e.target.value)}
                error={formErrors.clientNumber}
                placeholder="Ex: 123"
                required
                disabled={!canSave} // Disabled if no permission to save
            />
            <Input
                id="editClientNeighborhood"
                label="Bairro"
                value={currentClientNeighborhood}
                onChange={(e) => setCurrentClientNeighborhood(e.target.value)}
                error={formErrors.neighborhood}
                placeholder="Ex: Centro"
                required
                disabled={!canSave} // Disabled if no permission to save
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
                id="editClientCity"
                label="Cidade"
                value={currentClientCity}
                onChange={(e) => setCurrentClientCity(e.target.value)}
                error={formErrors.city}
                placeholder="Ex: São Paulo"
                required
                disabled={!canSave} // Disabled if no permission to save
            />
            <Input
                id="editClientState"
                label="Estado (UF)"
                value={currentClientState}
                onChange={(e) => setCurrentClientState(e.target.value)}
                error={formErrors.state}
                placeholder="Ex: SP"
                maxLength={2}
                required
                disabled={!canSave} // Disabled if no permission to save
            />
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Detalhes da Ordem</h3>
        <Select
          id="editOrderType"
          label="Tipo de Ordem"
          value={currentOrderType}
          onChange={(e) => {
            setCurrentOrderType(e.target.value as Order['type']);
            setCurrentServicePrice('0.00');
            setCurrentProductionDetails([]);
          }}
          options={ORDER_TYPE_OPTIONS}
          containerClassName="mb-4"
          disabled={isEditing} // Type cannot change for existing orders. New orders derive from initialOrderType
        />
        <Select
          id="editOrderStatus"
          label="Status da Ordem"
          value={currentOrderStatus}
          onChange={(e) => setCurrentOrderStatus(e.target.value as OrderStatus)}
          options={ORDER_STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
          containerClassName="mb-4"
          disabled={!checkPermission('canEditOrderStatus')} // Disabled if no permission
        />

        {currentOrderType === 'service-order' && (
             <Input
                id="currentServicePrice"
                label="Preço do Serviço (R$)"
                type="number"
                step="0.01"
                value={currentServicePrice}
                onChange={(e) => setCurrentServicePrice(e.target.value)}
                error={formErrors.servicePrice}
                placeholder="0.00"
                required
                disabled={!canEditServiceOrder} // Disabled if no permission
            />
        )}
      </div>

      {/* Production Details (for Service Orders only) */}
      {currentOrderType === 'service-order' && (
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center"><Factory className="h-5 w-5 mr-2" /> Itens de Produção (Matéria Prima e Mão de Obra)</h3>

          <div className="space-y-4 mb-4">
            {currentProductionDetails.length === 0 ? (
              <p className="text-center text-gray-500 py-2">Nenhum item de produção adicionado.</p>
            ) : (
              <div className="border rounded-md divide-y divide-gray-200 max-h-48 overflow-y-auto">
                {currentProductionDetails.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium text-gray-800">{item.name} <span className="text-sm text-gray-500">({item.type === 'raw_material' ? 'M. Prima' : 'Mão de Obra'})</span></p>
                      <p className="text-sm text-gray-600">{item.quantityUsed} {item.unit} @ {formatCurrency(item.costPerUnit)}</p>
                      {item.notes && <p className="text-xs text-gray-500 italic">Obs: {item.notes}</p>}
                    </div>
                    <Button type="button" variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => removeProductionItem(item.id)} disabled={!canEditProductionDetails} /> {/* Disabled if no permission */}
                  </div>
                ))}
              </div>
            )}
          </div>

          <h4 className="text-md font-semibold text-gray-700 mb-2">Adicionar Novo Item de Produção</h4>
          <Input
            id="newProdItemSearch"
            placeholder="Buscar matéria-prima existente..."
            value={newProdItemSearchTerm}
            onChange={(e) => setNewProdItemSearchTerm(e.target.value)}
            className="mb-2"
            disabled={!canEditProductionDetails} // Disabled if no permission
          />
          {newProdItemSearchTerm && filteredRawMaterials.length > 0 && (
              <div className="bg-white border border-gray-300 rounded-md max-h-40 overflow-y-auto shadow-sm mb-4">
                  {filteredRawMaterials.map(rm => (
                      <div
                          key={rm.id}
                          className="p-2 cursor-pointer hover:bg-indigo-50 flex justify-between items-center border-b border-gray-100 last:border-b-0"
                          onClick={() => handleSelectRawMaterial(rm)}
                      >
                          <div>
                              <p className="font-medium text-gray-800">{rm.name}</p>
                              <p className="text-sm text-gray-600">Fornecedor: {rm.supplier} | Custo: {formatCurrency(rm.costPerUnit)}/{rm.unit}</p>
                          </div>
                          <Button type="button" size="sm" variant="ghost" className="text-indigo-600" disabled={!canEditProductionDetails}>Selecionar</Button>
                      </div>
                  ))}
              </div>
          )}


          <Input
            id="newProdItemName"
            label="Nome do Item (Ex: Tecido Algodão, Mão de Obra Corte)"
            value={newProdItemName}
            onChange={(e) => setNewProdItemName(e.target.value)}
            required
            className="mb-2"
            disabled={!canEditProductionDetails} // Disabled if no permission
          />
          <Select
            id="newProdItemType"
            label="Tipo"
            value={newProdItemType}
            onChange={(e) => setNewProdItemType(e.target.value as 'raw_material' | 'labor')}
            options={[{ value: 'raw_material', label: 'Matéria Prima' }, { value: 'labor', label: 'Mão de Obra' }]}
            containerClassName="mb-2"
            disabled={!canEditProductionDetails} // Disabled if no permission
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <Input
              id="newProdItemQuantityUsed"
              label="Quantidade Utilizada"
              type="number"
              step="0.01"
              value={newProdItemQuantityUsed}
              onChange={(e) => setNewProdItemQuantityUsed(e.target.value)}
              required
              disabled={!canEditProductionDetails} // Disabled if no permission
            />
            <Select
              id="newProdItemUnit"
              label="Unidade"
              value={newProdItemUnit}
              onChange={(e) => setNewProdItemUnit(e.target.value)}
              options={productionItemUnitOptions}
              required
              disabled={!canEditProductionDetails} // Disabled if no permission
            />
          </div>
          <Input
            id="newProdItemCostPerUnit"
            label="Custo por Unidade (R$)"
            type="number"
            step="0.01"
            value={newProdItemCostPerUnit}
            onChange={(e) => setNewProdItemCostPerUnit(e.target.value)}
            required
            className="mb-2"
            disabled={!canEditProductionDetails} // Disabled if no permission
          />
          <Textarea
            id="newProdItemNotes"
            label="Observações (Opcional)"
            value={newProdItemNotes}
            onChange={(e) => setNewProdItemNotes(e.target.value)}
            className="mb-4"
            disabled={!canEditProductionDetails} // Disabled if no permission
          />
          <Button type="button" variant="secondary" onClick={addProductionItem} icon={<PlusCircle className="h-4 w-4" />} disabled={!canEditProductionDetails}> {/* Disabled if no permission */}
            Adicionar Item de Produção
          </Button>
        </div>
      )}


      {/* Cart Items (Products to be produced/sold) */}
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center"><Scissors className="h-5 w-5 mr-2" /> {currentOrderType === 'service-order' ? 'Produtos a serem confeccionados' : 'Itens da Ordem'}</h3>
        <Input
          id="productSearch"
          placeholder="Buscar e adicionar produto..."
          value={productSearchTerm}
          onChange={(e) => setProductSearchTerm(e.target.value)}
          className="mb-2"
          disabled={!canEditOrderItems} // Disabled if no permission
        />
        {productSearchTerm && filteredProducts.length > 0 && (
            <div className="bg-white border border-gray-300 rounded-md max-h-40 overflow-y-auto shadow-sm mb-4">
                {filteredProducts.map(product => (
                    <div
                        key={product.id}
                        className="p-2 cursor-pointer hover:bg-indigo-50 flex justify-between items-center border-b border-gray-100 last:border-b-0"
                        onClick={() => addToCart(product)}
                    >
                        <div>
                            <p className="font-medium text-gray-800">{product.name}</p>
                            <p className="text-sm text-gray-600">{formatCurrency(product.price)} | Estoque: {product.stock}</p>
                        </div>
                        <Button type="button" size="sm" variant="ghost" className="text-indigo-600" icon={<PlusCircle className="h-4 w-4" />} disabled={!canEditOrderItems} />
                    </div>
                ))}
            </div>
        )}

        {currentCart.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Nenhum item no carrinho.</p>
        ) : (
          <div className="border-t border-b border-gray-200 py-4 mb-4 max-h-60 overflow-y-auto">
            {currentCart.map((item) => (
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
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1 || !canEditOrderItems} // Disabled if no permission
                    icon={<MinusCircle className="h-4 w-4" />}
                  />
                  <span className="mx-2 text-gray-700">{item.quantity}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock || !canEditOrderItems} // Disabled if no permission
                    icon={<PlusCircle className="h-4 w-4" />}
                  />
                  <Button
                    type="button"
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
        {formErrors.cart && <p className="mt-1 text-sm text-red-600">{formErrors.cart}</p>}

        {currentOrderType !== 'service-order' && (
            <div className="flex justify-between items-center text-xl font-bold text-gray-800 mt-4">
              <span>Total:</span>
              <span>{formatCurrency(calculatedCartSubtotal)}</span>
            </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={saveLoading} disabled={!canSave || saveLoading}> {/* Disabled if no permission or if loading */}
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
};