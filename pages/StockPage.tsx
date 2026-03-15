import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { RawMaterial, Product, UserRole } from '../types';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input, Select, Textarea } from '../components/Input';
import { formatCurrency } from '../utils/currencyFormatter';
import { Plus, Edit, Trash2, Warehouse, Shirt, Package, Store } from 'lucide-react';
import { NewRawMaterialModal } from './NewRawMaterialModal';

export const StockPage: React.FC = () => {
  const { products, rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial, checkPermission } = useAuth(); // Use checkPermission

  const canAddRawMaterial = checkPermission('canAddRawMaterial');
  const canEditRawMaterial = checkPermission('canEditRawMaterial');
  const canDeleteRawMaterial = checkPermission('canDeleteRawMaterial');

  const [activeTab, setActiveTab] = useState<'rawMaterials' | 'finishedProducts'>('rawMaterials');
  const [isRawMaterialModalOpen, setIsRawMaterialModalOpen] = useState(false);
  const [editingRawMaterial, setEditingRawMaterial] = useState<RawMaterial | null>(null);

  const handleOpenRawMaterialModal = (rawMaterial?: RawMaterial) => {
    if (rawMaterial === undefined && !canAddRawMaterial) {
      alert('Você não tem permissão para adicionar matérias-primas.');
      return;
    }
    if (rawMaterial !== undefined && !canEditRawMaterial) {
      alert('Você não tem permissão para editar matérias-primas.');
      return;
    }
    setEditingRawMaterial(rawMaterial || null);
    setIsRawMaterialModalOpen(true);
  };

  const handleCloseRawMaterialModal = () => {
    setIsRawMaterialModalOpen(false);
    setEditingRawMaterial(null);
  };

  const handleSaveRawMaterial = (rawMaterial: RawMaterial) => {
    if (editingRawMaterial) {
      if (!canEditRawMaterial) {
        alert('Você não tem permissão para editar matérias-primas.');
        return;
      }
      updateRawMaterial(rawMaterial);
    } else {
      if (!canAddRawMaterial) {
        alert('Você não tem permissão para adicionar matérias-primas.');
        return;
      }
      addRawMaterial(rawMaterial);
    }
    handleCloseRawMaterialModal();
  };

  const handleDeleteRawMaterial = (id: string) => {
    if (!canDeleteRawMaterial) {
      alert('Você não tem permissão para excluir matérias-primas.');
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir este item de matéria-prima?')) {
      deleteRawMaterial(id);
    }
  };

  const totalRawMaterialValue = useMemo(() => {
    return rawMaterials.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);
  }, [rawMaterials]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Gerenciamento de Estoque</h2>
        <span className="text-lg font-semibold text-gray-600 hidden md:block">
          Valor Total Matéria-Prima: {formatCurrency(totalRawMaterialValue)}
        </span>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('rawMaterials')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'rawMaterials' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Matéria Prima
          </button>
          <button
            onClick={() => setActiveTab('finishedProducts')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'finishedProducts' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Produtos Acabados
          </button>
        </nav>
      </div>

      {activeTab === 'rawMaterials' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Matéria Prima</h3>
            {canAddRawMaterial && ( // Only show button if user has permission
              <Button onClick={() => handleOpenRawMaterialModal()} icon={<Plus className="h-5 w-5" />}>
                Nova Matéria Prima
              </Button>
            )}
          </div>

          {rawMaterials.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-600 text-lg">Nenhuma matéria-prima cadastrada ainda.</p>
              {canAddRawMaterial && ( // Only show button if user has permission
                <Button onClick={() => handleOpenRawMaterialModal()} className="mt-4">
                  Adicionar Primeira Matéria Prima
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Custo Unit.
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fornecedor
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rawMaterials.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.costPerUnit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.supplier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenRawMaterialModal(item)}
                          className="mr-2 text-indigo-600 hover:text-indigo-900"
                          icon={<Edit className="h-4 w-4" />}
                          disabled={!canEditRawMaterial} // Disabled if no permission
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRawMaterial(item.id)}
                          className="text-red-600 hover:text-red-900"
                          icon={<Trash2 className="h-4 w-4" />}
                          disabled={!canDeleteRawMaterial} // Disabled if no permission
                        >
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'finishedProducts' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Produtos Acabados em Estoque</h3>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-8">
              <Shirt className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-600 text-lg">Nenhum produto acabado cadastrado ainda.</p>
              <p className="text-gray-500 text-sm mt-2">
                Vá para a seção "Produtos" para adicionar e gerenciar seus produtos acabados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Imagem
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estoque
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço Venda
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="h-10 w-10 object-cover rounded-md" />
                        ) : (
                          <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                            <Store className="h-5 w-5" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href={`#/products`} className="text-indigo-600 hover:text-indigo-900 inline-flex items-center">
                          <Edit className="h-4 w-4 mr-1" /> Gerenciar
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isRawMaterialModalOpen}
        onClose={handleCloseRawMaterialModal}
        title={editingRawMaterial ? 'Editar Matéria Prima' : 'Nova Matéria Prima'}
        size="lg"
      >
        <NewRawMaterialModal
          rawMaterial={editingRawMaterial}
          onSave={handleSaveRawMaterial}
          onCancel={handleCloseRawMaterialModal}
        />
      </Modal>
    </div>
  );
};