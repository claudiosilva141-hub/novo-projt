export interface CompanyInfo {
  key: string; // Used by Dexie for singleton tables
  name: string;
  logo: string | null; // base64 string for image
  geminiApiKey?: string;
  geminiModelText?: string;
  geminiModelImage?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  password: string; // Stored in plain text for simplicity in this local app example, but insecure for production
  role: UserRole;
}

export interface Client {
  id: string;
  name: string;
  contact: string; // WhatsApp number
  cpf: string;
  // New address fields
  zipCode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number; // New field for product cost price
  stock: number;
  imageUrl: string; // base64 string or URL
}

export interface RawMaterial {
  id: string;
  name: string;
  description: string;
  unit: string; // E.g., 'metros', 'kg', 'unidade'
  quantity: number;
  costPerUnit: number;
  supplier: string;
}

export interface ProductionItem {
  id: string; // Unique ID for this specific production item instance
  name: string; // Name of the material or labor type (e.g., "Tecido Algodão", "Mão de Obra Corte", "Linha Poliéster")
  type: 'raw_material' | 'labor'; // Distinguish between raw material and labor
  unit: string; // E.g., 'metros', 'horas', 'unidade'
  quantityUsed: number; // How much was used for this service order
  costPerUnit: number; // Cost per unit for tracking internal costs
  notes?: string; // Additional notes
}


export interface CartItem extends Product {
  quantity: number;
}

export enum OrderStatus {
  BUDGET = 'Orçamento',
  PENDING = 'Pendente',
  IN_PROGRESS = 'Em Andamento',
  COMPLETED = 'Concluída',
  DELIVERED = 'Entregue',
  CANCELLED = 'Cancelada',
}

export interface Order {
  id: string;
  type: 'sale' | 'service-order' | 'budget';
  clientName: string;
  clientContact: string; // WhatsApp number
  clientCpf: string; // New field for client CPF
  // Store full client address in order for snapshot
  clientZipCode: string;
  clientStreet: string;
  clientNumber: string;
  clientNeighborhood: string;
  clientCity: string;
  clientState: string;
  items: CartItem[]; // Represents final products for sale/service output
  total: number; // For 'sale'/'budget': sum of items.price * quantity. For 'service-order': custom service price.
  // New: Production details for service orders (raw materials, labor)
  productionDetails?: ProductionItem[]; // Optional, only for type 'service-order'
  status: OrderStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// New: Interface for configurable user permissions
export interface UserPermissions {
  key: string; // Used by Dexie for singleton tables
  // Product Management
  canAddProduct: boolean;
  canEditProduct: boolean;
  canDeleteProduct: boolean;
  canViewProductCostPrice: boolean; // View cost price in product list/modal

  // POS / Order Creation
  canFinalizeSale: boolean;
  canGenerateBudget: boolean;
  canCreateServiceOrder: boolean; // For creating new SO from scratch, distinct from POS
  canEditOrderItems: boolean; // Add/remove items from cart in POS/EditOrder

  // Service Order Management
  canEditServiceOrder: boolean;
  canEditOrderStatus: boolean;
  canEditProductionDetails: boolean; // Add/remove raw materials/labor in service order

  // Budget Management
  canEditBudget: boolean;
  canEditBudgetStatus: boolean;

  // Stock Management (Raw Materials)
  canAddRawMaterial: boolean;
  canEditRawMaterial: boolean;
  canDeleteRawMaterial: boolean;

  // Client Management
  canAddClient: boolean;
  canEditClient: boolean;
  canDeleteClient: boolean;

  // Reports
  canViewReports: boolean;
  canGenerateAISummary: boolean;

  // Settings (Company & Users) - Admin-only pages, but specific actions can be permissioned
  canEditCompanySettings: boolean;
  canManageUsers: boolean; // Full user management

  // General features
  canUseAI: boolean; // Generic AI usage (e.g., generating descriptions)
  canPrintOrSendOrder: boolean; // Print/WhatsApp invoices/orders
}

// AuthContextType updated for user login and permissions
export interface AuthContextType {
  isAuthenticated: boolean;
  isInitialSetup: boolean;
  companyInfo: CompanyInfo;
  products: Product[];
  rawMaterials: RawMaterial[];
  orders: Order[];
  clients: Client[];
  users: User[]; // New: List of all users
  currentUser: User | null; // New: Currently logged-in user
  userPermissions: UserPermissions; // New: Configurable permissions for standard users
  login: (username: string, password: string) => Promise<boolean>; // Modified: login now returns Promise<boolean>
  logout: () => void;
  updateCompanyInfo: (name: string, logo: string | null, geminiApiKey?: string, geminiModelText?: string, geminiModelImage?: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addRawMaterial: (rawMaterial: RawMaterial) => void;
  updateRawMaterial: (rawMaterial: RawMaterial) => void;
  deleteRawMaterial: (id: string) => void;
  addOrder: (order: Order) => Order;
  updateOrder: (order: Order) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  registerUser: (username: string, password: string, role: UserRole, fullName?: string) => Promise<void>; // New: Register a new user
  updateUser: (user: User) => Promise<void>; // New: Update existing user
  deleteUser: (id: string) => void; // New: Delete user
  updateUserPermissions: (permissions: UserPermissions) => void; // New: Update configurable permissions
  checkPermission: (permissionName: keyof UserPermissions) => boolean; // New: Helper to check permission
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<boolean>;
}