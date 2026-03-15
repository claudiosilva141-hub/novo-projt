import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { fileToBase64 } from '../utils/base64Converter';
import { UploadCloud, Save, Plus, Edit, Trash2, User as UserIcon, Lock, KeyRound } from 'lucide-react';
import { COMPANY_NAME_DEFAULT, USER_ROLE_OPTIONS, PERMISSION_KEYS, PERMISSION_LABELS } from '../constants'; // Import PERMISSION_LABELS
import { Modal } from '../components/Modal';
import { User, UserRole, UserPermissions } from '../types'; // Import UserPermissions

interface UserModalProps {
    user: User | null; // Null for new user
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: User) => void;
    currentUserId: string | undefined; // To prevent changing own role
    canManageUsers: boolean; // Use permission directly
}

const UserModal: React.FC<UserModalProps> = ({ user, isOpen, onClose, onSave, currentUserId, canManageUsers }) => { // Added canManageUsers prop
    const [username, setUsername] = useState(user?.username || '');
    const [password, setPassword] = useState(user?.password || '');
    const [role, setRole] = useState(user?.role || UserRole.USER);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setPassword(user.password || ''); // Do not expose actual password if not allowed
            setRole(user.role);
        } else {
            setUsername('');
            setPassword('');
            setRole(UserRole.USER);
        }
        setFormErrors({});
    }, [user, isOpen]); // Reset on modal open/close

    const validateForm = () => {
        const errors: { [key: string]: string } = {};
        if (!username.trim()) errors.username = 'Nome de usuário é obrigatório.';
        if (!password.trim() && !user) errors.password = 'Senha é obrigatória para novos usuários.'; // Password required only for new users
        if (!role) errors.role = 'Função é obrigatória.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canManageUsers) { // Check permission before attempting to save
            alert('Você não tem permissão para gerenciar usuários.');
            return;
        }
        if (!validateForm()) {
            return;
        }

        setSaveLoading(true);

        const userToSave: User = {
            id: user?.id || Date.now().toString(),
            username: username.trim(),
            password: password.trim() || user?.password || '', // Keep existing password if not changed, ensure it's not undefined
            role: role,
        };

        onSave(userToSave);
        setSaveLoading(false);
        onClose();
    };

    const isEditingSelf = user && user.id === currentUserId;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={user ? `Editar Usuário: ${user.username}` : 'Novo Usuário'}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    id="username"
                    label="Nome de Usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    error={formErrors.username}
                    required
                    disabled={!!user || !canManageUsers} // Username cannot be changed after creation, and only admin can edit
                    icon={<UserIcon className="h-5 w-5 text-gray-400" />}
                />
                <Input
                    id="password"
                    label="Senha (Deixe em branco para manter a senha atual)"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={formErrors.password}
                    placeholder={user ? '********' : 'Digite a nova senha'}
                    required={!user} // Required only for new users
                    disabled={!canManageUsers} // Only admin can edit password
                    icon={<Lock className="h-5 w-5 text-gray-400" />}
                />
                <Select
                    id="role"
                    label="Função"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    options={USER_ROLE_OPTIONS}
                    error={formErrors.role}
                    required
                    disabled={isEditingSelf || !canManageUsers} // Cannot change own role, and only admin can change roles
                    icon={<KeyRound className="h-5 w-5 text-gray-400" />}
                />

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" isLoading={saveLoading} disabled={!canManageUsers || saveLoading}> {/* Updated: Add canManageUsers check here */}
                        Salvar
                    </Button>
                </div>
            </form>
        </Modal>
    );
};


export const SettingsPage: React.FC = () => {
  const { companyInfo, updateCompanyInfo, users, currentUser, registerUser, updateUser, deleteUser, userPermissions, updateUserPermissions, checkPermission } = useAuth();
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const canEditCompanySettings = checkPermission('canEditCompanySettings');
  const canManageUsers = checkPermission('canManageUsers');

  const [companyName, setCompanyName] = useState<string>(companyInfo.name);
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(companyInfo.logo);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // User management states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Permissions management states (use local state for checkboxes, then update global state on save or per change)
  const [currentConfigurablePermissions, setCurrentConfigurablePermissions] = useState<UserPermissions>(userPermissions);

  useEffect(() => {
    setCompanyName(companyInfo.name);
    setCompanyLogoPreview(companyInfo.logo);
  }, [companyInfo]);

  useEffect(() => {
    setCurrentConfigurablePermissions(userPermissions); // Keep local state in sync with global when it changes
  }, [userPermissions]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/png')) {
        setCompanyLogoFile(file);
        fileToBase64(file).then(setCompanyLogoPreview).catch(console.error);
        setError(null);
        setIsSaved(false);
      } else {
        setCompanyLogoFile(null);
        setCompanyLogoPreview(null);
        setError('Por favor, selecione apenas arquivos PNG.');
      }
    } else {
      setCompanyLogoFile(null);
      setCompanyLogoPreview(null);
    }
  };

  const handleSubmitCompanySettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEditCompanySettings) {
      alert('Você não tem permissão para salvar as configurações da empresa.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsSaved(false);

    let logoBase64: string | null = companyLogoPreview;
    if (companyLogoFile) {
      try {
        logoBase64 = await fileToBase64(companyLogoFile);
      } catch (err) {
        setError('Erro ao converter imagem. Tente novamente.');
        setIsLoading(false);
        return;
      }
    }

    if (!companyName.trim()) {
      setError('O nome da empresa não pode estar vazio.');
      setIsLoading(false);
      return;
    }

    updateCompanyInfo(companyName.trim(), logoBase64);
    setIsLoading(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000); // Hide saved message after 3 seconds
  };

  const handleOpenUserModal = (user?: User) => {
    if (!canManageUsers && user === undefined) { // Check permission for adding user
        alert('Você não tem permissão para adicionar usuários.');
        return;
    }
    if (!canManageUsers && user !== undefined) { // Check permission for editing user
        alert('Você não tem permissão para editar usuários.');
        return;
    }
    setEditingUser(user || null);
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = (user: User) => {
    if (user.id) { // Existing user
      if (!canManageUsers) return; // Double check permission
      updateUser(user);
    } else { // New user
      if (!canManageUsers) return; // Double check permission
      if (users.some(u => u.username === user.username)) {
        alert('Nome de usuário já existe.');
        return;
      }
      registerUser(user.username, user.password || '', user.role);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (!canManageUsers) {
      alert('Você não tem permissão para excluir usuários.');
      return;
    }
    if (userId === currentUser?.id) {
      alert('Você não pode excluir seu próprio usuário.');
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      deleteUser(userId);
    }
  };

  const handlePermissionChange = (key: keyof UserPermissions, value: boolean) => {
    setCurrentConfigurablePermissions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSavePermissions = () => {
    if (!canManageUsers) {
      alert('Você não tem permissão para gerenciar permissões.');
      return;
    }
    updateUserPermissions(currentConfigurablePermissions);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Configurações da Empresa</h2>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <form onSubmit={handleSubmitCompanySettings} className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Informações da Empresa</h3>
          <Input
            id="companyName"
            label="Nome da Empresa"
            type="text"
            value={companyName}
            onChange={(e) => {
                setCompanyName(e.target.value);
                setIsSaved(false);
            }}
            placeholder={COMPANY_NAME_DEFAULT}
            required
            disabled={!canEditCompanySettings} // Disabled based on permission
          />

          <div>
            <label htmlFor="companyLogo" className="block text-sm font-medium text-gray-700 mb-1">
              Logo da Empresa (PNG)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative group hover:border-indigo-500 transition-colors cursor-pointer">
              <input
                id="companyLogo"
                name="companyLogo"
                type="file"
                accept="image/png"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                disabled={!canEditCompanySettings} // Disabled based on permission
              />
              <div className="space-y-1 text-center">
                {companyLogoPreview ? (
                  <img src={companyLogoPreview} alt="Company Logo Preview" className="mx-auto h-20 w-auto object-contain rounded-full" />
                ) : (
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400 group-hover:text-indigo-600" />
                )}
                <div className="flex text-sm text-gray-600">
                  <span className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    {companyLogoPreview ? 'Alterar logo' : 'Fazer upload de um arquivo'}
                  </span>
                  <p className="pl-1">ou arraste e solte</p>
                </div>
                <p className="text-xs text-gray-500">PNG de até 10MB</p>
              </div>
            </div>
            {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3">
            {isSaved && (
                <span className="text-sm text-green-600 flex items-center">
                    <Save className="h-4 w-4 mr-1" /> Salvo!
                </span>
            )}
            <Button
              type="submit"
              className="w-full sm:w-auto"
              isLoading={isLoading}
              icon={<Save className="h-5 w-5" />}
              disabled={!canEditCompanySettings} // Disabled based on permission
            >
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>

      {canManageUsers && ( // Only show User Management if user has permission
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Gerenciamento de Usuários</h3>
            <Button onClick={() => handleOpenUserModal()} icon={<Plus className="h-5 w-5" />} disabled={!canManageUsers}>
              Novo Usuário
            </Button>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 text-lg">Nenhum usuário cadastrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome de Usuário
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Função
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.username} {user.id === currentUser?.id && <span className="text-xs text-indigo-500">(Você)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {user.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenUserModal(user)}
                          className="mr-2 text-indigo-600 hover:text-indigo-900"
                          icon={<Edit className="h-4 w-4" />}
                          disabled={user.id === currentUser?.id || !canManageUsers} // Cannot edit own user role, and disabled by permission
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                          icon={<Trash2 className="h-4 w-4" />}
                          disabled={user.id === currentUser?.id || users.length === 1 || !canManageUsers} // Cannot delete self or if only one user, and disabled by permission
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

        {isAdmin && ( // Only the actual ADMIN role can see and change permissions
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Gerenciamento de Permissões (Usuários Padrão)</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                    Defina quais ações os usuários com a função "Usuário Padrão" podem realizar no sistema. Administradores sempre têm acesso total.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PERMISSION_KEYS.map((key) => (
                        <div key={key} className="flex items-center">
                            <input
                                id={`permission-${key}`}
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                checked={currentConfigurablePermissions[key]}
                                onChange={(e) => handlePermissionChange(key, e.target.checked)}
                            />
                            <label htmlFor={`permission-${key}`} className="ml-2 block text-sm text-gray-900">
                                {PERMISSION_LABELS[key]} {/* Use the human-readable label from constants */}
                            </label>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-6">
                    <Button type="button" variant="primary" onClick={handleSavePermissions} disabled={isLoading}>
                        Salvar Permissões
                    </Button>
                </div>
            </div>
        )}

      <UserModal
        user={editingUser}
        isOpen={isUserModalOpen}
        onClose={handleCloseUserModal}
        onSave={handleSaveUser}
        currentUserId={currentUser?.id}
        canManageUsers={canManageUsers} // Pass permission to UserModal
      />
    </div>
  );
};