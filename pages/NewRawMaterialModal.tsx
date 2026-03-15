import React, { useState, useEffect } from 'react';
import { RawMaterial, UserRole } from '../types';
import { Button } from '../components/Button';
import { Input, Textarea, Select } from '../components/Input';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../App';

interface NewRawMaterialModalProps {
  rawMaterial: RawMaterial | null;
  onSave: (rawMaterial: RawMaterial) => void;
  onCancel: () => void;
}

export const NewRawMaterialModal: React.FC<NewRawMaterialModalProps> = ({ rawMaterial, onSave, onCancel }) => {
  const { checkPermission } = useAuth();
  const canAddRawMaterial = checkPermission('canAddRawMaterial');
  const canEditRawMaterial = checkPermission('canEditRawMaterial');

  const isEditing = !!rawMaterial;
  const canSave = isEditing ? canEditRawMaterial : canAddRawMaterial;

  const [name, setName] = useState(rawMaterial?.name || '');
  const [description, setDescription] = useState(rawMaterial?.description || '');
  const [unit, setUnit] = useState(rawMaterial?.unit || 'unidade');
  const [quantity, setQuantity] = useState(rawMaterial?.quantity.toString() || '0');
  const [costPerUnit, setCostPerUnit] = useState(rawMaterial?.costPerUnit.toFixed(2) || '0.00');
  const [supplier, setSupplier] = useState(rawMaterial?.supplier || '');

  const [saveLoading, setSaveLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (rawMaterial) {
      setName(rawMaterial.name);
      setDescription(rawMaterial.description);
      setUnit(rawMaterial.unit);
      setQuantity(rawMaterial.quantity.toString());
      setCostPerUnit(rawMaterial.costPerUnit.toFixed(2));
      setSupplier(rawMaterial.supplier);
    } else {
      setName('');
      setDescription('');
      setUnit('unidade');
      setQuantity('0');
      setCostPerUnit('0.00');
      setSupplier('');
    }
    setFormErrors({});
  }, [rawMaterial]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!name.trim()) errors.name = 'Nome é obrigatório.';
    if (!description.trim()) errors.description = 'Descrição é obrigatória.';
    if (!unit.trim()) errors.unit = 'Unidade é obrigatória.';
    if (isNaN(parseFloat(quantity)) || parseFloat(quantity) < 0) errors.quantity = 'Quantidade inválida.';
    if (isNaN(parseFloat(costPerUnit)) || parseFloat(costPerUnit) < 0) errors.costPerUnit = 'Custo por unidade inválido.';
    if (!supplier.trim()) errors.supplier = 'Fornecedor é obrigatório.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) {
      alert('Você não tem permissão para salvar matérias-primas.');
      return;
    }
    if (!validateForm()) {
      return;
    }

    setSaveLoading(true);

    const newRawMaterial: RawMaterial = {
      id: rawMaterial?.id || '',
      name,
      description,
      unit,
      quantity: parseFloat(quantity),
      costPerUnit: parseFloat(costPerUnit),
      supplier,
    };
    onSave(newRawMaterial);
    setSaveLoading(false);
  };

  const unitOptions = [
    { value: 'unidade', label: 'Unidade' },
    { value: 'metros', label: 'Metros' },
    { value: 'kg', label: 'Kilogramas (Kg)' },
    { value: 'litros', label: 'Litros (L)' },
    { value: 'pacote', label: 'Pacote' },
    { value: 'rolo', label: 'Rolo' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="rawMaterialName"
        label="Nome da Matéria Prima"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={formErrors.name}
        required
        disabled={!canEditRawMaterial} // Disabled if no permission
      />

      <Textarea
        id="rawMaterialDescription"
        label="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={formErrors.description}
        required
        disabled={!canEditRawMaterial} // Disabled if no permission
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          id="rawMaterialUnit"
          label="Unidade de Medida"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          options={unitOptions}
          error={formErrors.unit}
          required
          disabled={!canEditRawMaterial} // Disabled if no permission
        />
        <Input
          id="rawMaterialQuantity"
          label="Quantidade"
          type="number"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          error={formErrors.quantity}
          required
          disabled={!canEditRawMaterial} // Disabled if no permission
        />
      </div>

      <Input
        id="rawMaterialCostPerUnit"
        label="Custo por Unidade (R$)"
        type="number"
        step="0.01"
        value={costPerUnit}
        onChange={(e) => setCostPerUnit(e.target.value)}
        error={formErrors.costPerUnit}
        required
        disabled={!canEditRawMaterial} // Disabled if no permission
      />

      <Input
        id="rawMaterialSupplier"
        label="Fornecedor"
        value={supplier}
        onChange={(e) => setSupplier(e.target.value)}
        error={formErrors.supplier}
        required
        disabled={!canEditRawMaterial} // Disabled if no permission
      />

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={saveLoading} disabled={!canSave || saveLoading}> {/* Disabled if no permission or if loading */}
          Salvar Matéria Prima
        </Button>
      </div>
    </form>
  );
};