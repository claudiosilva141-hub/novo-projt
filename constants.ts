import { OrderStatus } from './types';
import { UserRole, UserPermissions } from './types'; // Import UserRole and UserPermissions

export const SINGLETON_KEY = 'singleton';
export const COMPANY_NAME_DEFAULT = 'Sua Confecção & Vendas';
export const GEMINI_MODEL_TEXT = 'gemini-3-flash-preview';
export const GEMINI_MODEL_IMAGE = 'gemini-2.5-flash-image'; // Or 'gemini-3-pro-image-preview' for higher quality/features
export const DEFAULT_PRODUCT_IMAGE_PLACEHOLDER = 'https://picsum.photos/300/300';

// Reintroduced: Default admin credentials for initial setup
export const ADMIN_USERNAME_DEFAULT = 'admin';
export const ADMIN_PASSWORD_DEFAULT = 'admin123'; // Insecure for production, for demo purposes

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.BUDGET]: 'bg-blue-100 text-blue-800',
  [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.IN_PROGRESS]: 'bg-indigo-100 text-indigo-800',
  [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [OrderStatus.DELIVERED]: 'bg-teal-100 text-teal-800',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
};

export const ORDER_STATUS_OPTIONS = Object.values(OrderStatus);

export const ORDER_TYPE_OPTIONS = [
  { value: 'sale', label: 'Venda Direta' },
  { value: 'service-order', label: 'Ordem de Serviço' },
  { value: 'budget', label: 'Orçamento' },
];

// Reintroduced: User Role Options for selection
export const USER_ROLE_OPTIONS = [
  { value: UserRole.ADMIN, label: 'Administrador' },
  { value: UserRole.USER, label: 'Usuário Padrão' },
];

// New: Default permissions for a standard user
// Admins will always have all permissions, these apply only to UserRole.USER
export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  key: SINGLETON_KEY, // Add the missing 'key' property
  // Product Management
  canAddProduct: false,             // Restrito por padrão
  canEditProduct: false,            // Restrito por padrão
  canDeleteProduct: false,          // Restrito por padrão
  canViewProductCostPrice: false,   // Restrito por padrão (informação sensível)

  // POS / Order Creation
  canFinalizeSale: true,            // Permitido por padrão (operador de PDV)
  canGenerateBudget: true,          // Permitido por padrão (vendedor)
  canCreateServiceOrder: true,      // Permitido por padrão (equipe de produção)
  canEditOrderItems: true,          // Essencial para usar PDV/criar ordens

  // Service Order Management
  canEditServiceOrder: true,        // Permitido por padrão
  canEditOrderStatus: true,         // Permitido por padrão
  canEditProductionDetails: true,   // Permitido por padrão

  // Budget Management
  canEditBudget: true,              // Permitido por padrão
  canEditBudgetStatus: true,        // Permitido por padrão

  // Stock Management (Raw Materials)
  canAddRawMaterial: false,         // Restrito por padrão
  canEditRawMaterial: false,        // Restrito por padrão
  canDeleteRawMaterial: false,      // Restrito por padrão

  // Client Management
  canAddClient: true,               // Permitido por padrão (operador de PDV pode precisar adicionar novos clientes)
  canEditClient: true,              // Permitido por padrão (operador de PDV pode precisar editar informações)
  canDeleteClient: false,           // Restrito por padrão

  // Reports
  canViewReports: true,             // Permitido por padrão
  canGenerateAISummary: false,      // Restrito por padrão (uso de IA)

  // Settings (Company & Users)
  canEditCompanySettings: false,    // Restrito por padrão (administrador)
  canManageUsers: false,            // Restrito por padrão (administrador)

  // General features
  canUseAI: false,                  // Restrito por padrão (uso de IA)
  canPrintOrSendOrder: true,        // Permitido por padrão
};

// List of all permission keys for easier iteration in UI
export const PERMISSION_KEYS: Array<keyof UserPermissions> = Object.keys(DEFAULT_USER_PERMISSIONS) as Array<keyof UserPermissions>;

// New: User-friendly labels for permissions in Portuguese
// Use Omit to exclude 'key' from UserPermissions, as it's not a permission that needs a label
export const PERMISSION_LABELS: Record<keyof Omit<UserPermissions, 'key'>, string> = {
  // Product Management
  canAddProduct: 'Pode Adicionar Produtos',
  canEditProduct: 'Pode Editar Produtos',
  canDeleteProduct: 'Pode Excluir Produtos',
  canViewProductCostPrice: 'Pode Ver Preço de Custo (Produtos)',

  // POS / Order Creation
  canFinalizeSale: 'Pode Finalizar Vendas (PDV)',
  canGenerateBudget: 'Pode Gerar Orçamentos (PDV)',
  canCreateServiceOrder: 'Pode Criar Ordens de Serviço',
  canEditOrderItems: 'Pode Editar Itens no Carrinho/Ordem',

  // Service Order Management
  canEditServiceOrder: 'Pode Editar Ordens de Serviço',
  canEditOrderStatus: 'Pode Alterar Status de Ordem/Orçamento',
  canEditProductionDetails: 'Pode Editar Detalhes de Produção (O.S.)',

  // Budget Management
  canEditBudget: 'Pode Editar Orçamentos',
  canEditBudgetStatus: 'Pode Alterar Status de Ordem/Orçamento', // Shared with Service Orders

  // Stock Management (Raw Materials)
  canAddRawMaterial: 'Pode Adicionar Matérias-Primas',
  canEditRawMaterial: 'Pode Editar Matérias-Primas',
  canDeleteRawMaterial: 'Pode Excluir Matérias-Primas',

  // Client Management
  canAddClient: 'Pode Adicionar Clientes',
  canEditClient: 'Pode Editar Clientes',
  canDeleteClient: 'Pode Excluir Clientes',

  // Reports
  canViewReports: 'Pode Visualizar Relatórios',
  canGenerateAISummary: 'Pode Gerar Resumo com IA (Relatórios)',

  // Settings (Company & Users)
  canEditCompanySettings: 'Pode Editar Configurações da Empresa',
  canManageUsers: 'Pode Gerenciar Usuários',

  // General features
  canUseAI: 'Pode Usar IA (Ex: Descrições de Produto)',
  canPrintOrSendOrder: 'Pode Imprimir/Enviar Ordens/Orçamentos',
};