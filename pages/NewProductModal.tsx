import React, { useState, useEffect } from 'react';
import { Product, UserRole } from '../types';
import { Button } from '../components/Button';
import { Input, Textarea } from '../components/Input';
import { fileToBase64 } from '../utils/base64Converter';
import { generateProductDescription } from '../services/geminiService';
import { Sparkles, Image as ImageIcon } from 'lucide-react';
import { DEFAULT_PRODUCT_IMAGE_PLACEHOLDER } from '../constants';
import { useAuth } from '../App';

interface NewProductModalProps {
  product: Product | null;
  onSave: (product: Product) => void;
  onCancel: () => void;
}

export const NewProductModal: React.FC<NewProductModalProps> = ({ product, onSave, onCancel }) => {
  const { checkPermission } = useAuth();
  const canAddProduct = checkPermission('canAddProduct');
  const canEditProduct = checkPermission('canEditProduct');
  const canUseAI = checkPermission('canUseAI');
  const canViewProductCostPrice = checkPermission('canViewProductCostPrice'); // For showing/hiding cost price

  const isEditing = !!product; // Determine if we are editing an existing product
  const canSave = isEditing ? canEditProduct : canAddProduct;

  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price.toFixed(2) || '0.00');
  const [costPrice, setCostPrice] = useState(product?.costPrice.toFixed(2) || '0.00');
  const [stock, setStock] = useState(product?.stock.toString() || '0');
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description);
      setPrice(product.price.toFixed(2));
      setCostPrice(product.costPrice.toFixed(2));
      setStock(product.stock.toString());
      setImageUrl(product.imageUrl);
      setImageFile(null);
    } else {
      setName('');
      setDescription('');
      setPrice('0.00');
      setCostPrice('0.00');
      setStock('0');
      setImageUrl('');
      setImageFile(null);
    }
    setFormErrors({});
  }, [product]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!name.trim()) errors.name = 'Nome é obrigatório.';
    if (!description.trim()) errors.description = 'Descrição é obrigatória.';
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) errors.price = 'Preço de venda inválido.';
    if (canViewProductCostPrice && (isNaN(parseFloat(costPrice)) || parseFloat(costPrice) < 0)) errors.costPrice = 'Preço de custo inválido.'; // Validate only if can view
    if (isNaN(parseInt(stock)) || parseInt(stock) < 0) errors.stock = 'Estoque inválido.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        setImageError('O arquivo selecionado não é uma imagem.');
        return;
      }
      setImageFile(file);
      fileToBase64(file)
        .then((base64) => {
          setImageUrl(base64);
          setImageError(null);
        })
        .catch(() => {
          setImageError('Falha ao carregar a imagem.');
          setImageUrl('');
        });
    } else {
      setImageFile(null);
      setImageUrl('');
      setImageError(null);
    }
  };

  const handleGenerateDescription = async () => {
    if (!canUseAI) {
      alert('Você não tem permissão para usar a IA.');
      return;
    }
    if (!name.trim()) {
      alert('Por favor, insira o nome do produto antes de gerar a descrição.');
      return;
    }
    setIsLoadingGemini(true);
    try {
      const desc = await generateProductDescription(name);
      setDescription(desc);
    } catch (error) {
      alert('Erro ao gerar descrição com Gemini AI. Verifique a chave da API.');
      console.error(error);
    } finally {
      setIsLoadingGemini(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) {
        alert('Você não tem permissão para salvar produtos.');
        return;
    }
    if (!validateForm()) {
      return;
    }

    setSaveLoading(true);

    let finalImageUrl = imageUrl;
    if (imageFile) {
      try {
        finalImageUrl = await fileToBase64(imageFile);
      } catch (err) {
        setImageError('Erro ao converter imagem. Use uma URL ou tente outro arquivo.');
        setSaveLoading(false);
        return;
      }
    }

    const newProduct: Product = {
      id: product?.id || '',
      name,
      description,
      price: parseFloat(price),
      costPrice: canViewProductCostPrice ? parseFloat(costPrice) : product?.costPrice || 0, // Save cost price only if can view, else keep old
      stock: parseInt(stock),
      imageUrl: finalImageUrl || DEFAULT_PRODUCT_IMAGE_PLACEHOLDER,
    };
    onSave(newProduct);
    setSaveLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="productName"
        label="Nome do Produto"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={formErrors.name}
        required
        disabled={!canEditProduct} // Disabled if no permission to edit
      />

      <div className="flex items-end gap-2">
        <Textarea
          id="productDescription"
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={formErrors.description}
          className="flex-grow"
          required
          disabled={!canEditProduct} // Disabled if no permission to edit
        />
        <Button
          type="button"
          onClick={handleGenerateDescription}
          variant="secondary"
          isLoading={isLoadingGemini}
          icon={<Sparkles className="h-4 w-4" />}
          title="Gerar descrição com IA"
          disabled={!canUseAI || isLoadingGemini} // Disabled if no permission to use AI or if loading
        >
          <span className="hidden sm:inline">Gerar com IA</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="productPrice"
          label="Preço de Venda (R$)"
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={formErrors.price}
          required
          disabled={!canEditProduct} // Disabled if no permission to edit
        />
        {canViewProductCostPrice && ( // Conditionally render cost price input
          <Input
            id="productCostPrice"
            label="Preço de Custo (R$)"
            type="number"
            step="0.01"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            error={formErrors.costPrice}
            required
            disabled={!canEditProduct} // Disabled if no permission to edit
          />
        )}
      </div>


      <Input
        id="productStock"
        label="Estoque"
        type="number"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        error={formErrors.stock}
        required
        disabled={!canEditProduct} // Disabled if no permission to edit
      />

      <div>
        <label htmlFor="productImageFile" className="block text-sm font-medium text-gray-700 mb-1">
          Imagem do Produto
        </label>
        <div className="flex items-center space-x-4">
          <input
            id="productImageFile"
            type="file"
            accept="image/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            onChange={handleImageChange}
            disabled={!canEditProduct} // Disabled if no permission to edit
          />
          {imageUrl && (
            <img src={imageUrl} alt="Preview" className="h-16 w-16 object-cover rounded-md border border-gray-200" />
          )}
          {!imageUrl && (
              <div className="h-16 w-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                <ImageIcon className="h-8 w-8" />
              </div>
          )}
        </div>
        {imageError && <p className="mt-1 text-sm text-red-600">{imageError}</p>}
      </div>


      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={saveLoading} disabled={!canSave || saveLoading}> {/* Disabled if no permission to save or if loading */}
          Salvar Produto
        </Button>
      </div>
    </form>
  );
};