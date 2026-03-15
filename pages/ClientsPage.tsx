import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { Client, UserRole } from '../types';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Plus, Edit, Trash2, Users, Search } from 'lucide-react';
import { NewClientModal } from './NewClientModal';

export const ClientsPage: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient, checkPermission } = useAuth(); // Use checkPermission
  
  const canAddClient = checkPermission('canAddClient');
  const canEditClient = checkPermission('canEditClient');
  const canDeleteClient = checkPermission('canDeleteClient');

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const filteredClients = useMemo(() => {
    return clients.filter((client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cpf.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.zipCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.state.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, searchTerm]);

  const handleOpenModal = (client?: Client) => {
    if (client === undefined && !canAddClient) {
      alert('Você não tem permissão para adicionar clientes.');
      return;
    }
    if (client !== undefined && !canEditClient) {
      alert('Você não tem permissão para editar clientes.');
      return;
    }
    setEditingClient(client || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSaveClient = (client: Client) => {
    if (editingClient) {
      if (!canEditClient) {
        alert('Você não tem permissão para editar clientes.');
        return;
      }
      updateClient(client);
    } else {
      if (!canAddClient) {
        alert('Você não tem permissão para adicionar clientes.');
        return;
      }
      addClient(client);
    }
    handleCloseModal();
  };

  const handleDeleteClient = (id: string) => {
    if (!canDeleteClient) {
      alert('Você não tem permissão para excluir clientes.');
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteClient(id);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Clientes</h2>
        {canAddClient && ( // Only show button if user has permission
          <Button onClick={() => handleOpenModal()} icon={<Plus className="h-5 w-5" />}>
            Novo Cliente
          </Button>
        )}
      </div>

      <div className="mb-6">
        <Input
          id="clientSearch"
          placeholder="Buscar por nome, contato, CPF ou endereço..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="h-5 w-5 text-gray-400" />}
        />
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-md">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-600 text-lg">Nenhum cliente encontrado.</p>
          {canAddClient && ( // Only show button if user has permission
            <Button onClick={() => handleOpenModal()} className="mt-4">
              Adicionar Primeiro Cliente
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
                    Nome
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato (WhatsApp)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPF
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endereço Principal
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {client.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.contact}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.cpf}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.street}, {client.number} - {client.city}/{client.state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(client)}
                        className="mr-2 text-indigo-600 hover:text-indigo-900"
                        icon={<Edit className="h-4 w-4" />}
                        disabled={!canEditClient} // Disabled if no permission
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClient(client.id)}
                        className="text-red-600 hover:text-red-900"
                        icon={<Trash2 className="h-4 w-4" />}
                        disabled={!canDeleteClient} // Disabled if no permission
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
        title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}
        size="lg"
      >
        <NewClientModal
          client={editingClient}
          onSave={handleSaveClient}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};