import React, { useState } from 'react';
import { useAuth } from '../App';
import { Product, UserRole } from '../types';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { NewProductModal } from './NewProductModal';
import { formatCurrency } from '../utils/currencyFormatter';
import { Trash2, Edit, Plus, Image } from 'lucide-react';
import { DEFAULT_PRODUCT_IMAGE_PLACEHOLDER } from '../constants';

export const ProductsPage: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, checkPermission } = useAuth(); // Use checkPermission
  const canAddProduct = checkPermission('canAddProduct');
  const canEditProduct = checkPermission('canEditProduct');
  const canDeleteProduct = checkPermission('canDeleteProduct');
  const canViewProductCostPrice = checkPermission('canViewProductCostPrice');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleOpenModal = (product?: Product) => {
    // If opening for a new product, check 'canAddProduct'
    // If opening for an existing product, check 'canEditProduct'
    if (product === undefined && !canAddProduct) {
      alert('Você não tem permissão para adicionar produtos.');
      return;
    }
    if (product !== undefined && !canEditProduct) {
        alert('Você não tem permissão para editar produtos.');
        return;
    }
    setEditingProduct(product || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      if (!canEditProduct) { // Double check permission before saving
        alert('Você não tem permissão para editar produtos.');
        return;
      }
      updateProduct(product);
    } else {
      if (!canAddProduct) { // Double check permission before saving
        alert('Você não tem permissão para adicionar produtos.');
        return;
      }
      addProduct(product);
    }
    handleCloseModal();
  };

  const handleDeleteProduct = (id: string) => {
    if (!canDeleteProduct) {
      alert('Você não tem permissão para excluir produtos.');
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProduct(id);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Produtos</h2>
        {canAddProduct && ( // Only show button if user has permission
          <Button onClick={() => handleOpenModal()} icon={<Plus className="h-5 w-5" />}>
            Novo Produto
          </Button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-600 text-lg">Nenhum produto cadastrado ainda.</p>
          {canAddProduct && ( // Only show button if user has permission
            <Button onClick={() => handleOpenModal()} className="mt-4">
              Adicionar Primeiro Produto
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
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
                    Descrição
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço Venda
                  </th>
                  {canViewProductCostPrice && ( // Conditionally render cost price column
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço Custo
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estoque
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
                        <img src={product.imageUrl} alt={product.name} className="h-12 w-12 object-cover rounded-md" />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                          <Image className="h-6 w-6" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {product.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(product.price)}
                    </td>
                    {canViewProductCostPrice && ( // Conditionally render cost price
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(product.costPrice)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(product)}
                        className="mr-2 text-indigo-600 hover:text-indigo-900"
                        icon={<Edit className="h-4 w-4" />}
                        disabled={!canEditProduct} // Disabled if no permission
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                        icon={<Trash2 className="h-4 w-4" />}
                        disabled={!canDeleteProduct} // Disabled if no permission
                      >
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
        size="lg"
      >
        <NewProductModal
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};