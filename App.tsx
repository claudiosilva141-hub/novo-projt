import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { POSPage } from './pages/POSPage';
import { ServiceOrdersPage } from './pages/ServiceOrdersPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { ReportsPage } from './pages/ReportsPage';
import { CompanyInfo, Product, Order, RawMaterial, Client, User, UserRole, AuthContextType, UserPermissions } from './types';
import { COMPANY_NAME_DEFAULT, DEFAULT_USER_PERMISSIONS } from './constants';
import { StockPage } from './pages/StockPage';
import { SettingsPage } from './pages/SettingsPage';
import { ClientsPage } from './pages/ClientsPage';
import { supabase } from './supabase'; // Import Supabase Client

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  // State to track if initial data loading/migration is complete
  const [dataLoaded, setDataLoaded] = useState(false);

  // All application data states
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({ name: COMPANY_NAME_DEFAULT, logo: null });
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions>(DEFAULT_USER_PERMISSIONS);
  const [isInitialSetup, setIsInitialSetup] = useState<boolean>(true); // Assume true until users are loaded

  // --- Data Loading Effect ---
  useEffect(() => {
    const loadData = async () => {
      // Load all data from Supabase
      const { data: companyData } = await supabase.from('company_info').select('*').eq('key', 'singleton').maybeSingle();
      if (companyData) setCompanyInfo({ name: companyData.name, logo: companyData.logo, key: 'singleton' });

      const { data: permData } = await supabase.from('user_permissions').select('*').eq('key', 'singleton').maybeSingle();
      // Converter de snake_case do banco para camelCase do types se necessário, 
      // mas como enviamos JSON inteiro, podemos ter de tratar. Vamos assumir as colunas.
      if (permData) {
        setUserPermissions({
          key: 'singleton',
          canAddProduct: permData.can_add_product,
          canEditProduct: permData.can_edit_product,
          canDeleteProduct: permData.can_delete_product,
          canViewProductCostPrice: permData.can_view_product_cost_price,
          canFinalizeSale: permData.can_finalize_sale,
          canGenerateBudget: permData.can_generate_budget,
          canCreateServiceOrder: permData.can_create_service_order,
          canEditOrderItems: permData.can_edit_order_items,
          canEditServiceOrder: permData.can_edit_service_order,
          canEditOrderStatus: permData.can_edit_order_status,
          canEditProductionDetails: permData.can_edit_production_details,
          canEditBudget: permData.can_edit_budget,
          canEditBudgetStatus: permData.can_edit_budget_status,
          canAddRawMaterial: permData.can_add_raw_material,
          canEditRawMaterial: permData.can_edit_raw_material,
          canDeleteRawMaterial: permData.can_delete_raw_material,
          canAddClient: permData.can_add_client,
          canEditClient: permData.can_edit_client,
          canDeleteClient: permData.can_delete_client,
          canViewReports: permData.can_view_reports,
          canGenerateAISummary: permData.can_generate_ai_summary,
          canEditCompanySettings: permData.can_edit_company_settings,
          canManageUsers: permData.can_manage_users,
          canUseAI: permData.can_use_ai,
          canPrintOrSendOrder: permData.can_print_or_send_order,
        });
      }

      const { data: loadedUsers } = await supabase.from('users').select('*');
      if (loadedUsers) {
        setUsers(loadedUsers);
        setIsInitialSetup(loadedUsers.length === 0);
      }

      const storedCurrentUser = localStorage.getItem('currentUser');
      if (storedCurrentUser) {
        const parsedUser = JSON.parse(storedCurrentUser);
        const existsInDb = loadedUsers?.some(u => u.id === parsedUser.id && u.username === parsedUser.username);
        if (existsInDb) {
          setCurrentUser(parsedUser);
        } else {
          localStorage.removeItem('currentUser'); // User no longer exists in DB, clear session
        }
      }

      const { data: prodData } = await supabase.from('products').select('*');
      if (prodData) {
        setProducts(prodData.map(p => ({
          id: p.id, name: p.name, description: p.description, price: p.price,
          costPrice: p.cost_price, stock: p.stock, imageUrl: p.image_url
        })));
      }

      const { data: rawData } = await supabase.from('raw_materials').select('*');
      if (rawData) {
         setRawMaterials(rawData.map(r => ({
           id: r.id, name: r.name, description: r.description, unit: r.unit,
           quantity: r.quantity, costPerUnit: r.cost_per_unit, supplier: r.supplier
         })));
      }

      const { data: orderData } = await supabase.from('orders').select('*');
      if (orderData) {
        setOrders(orderData.map(o => ({
          id: o.id, type: o.type, clientName: o.client_name, clientContact: o.client_contact,
          clientCpf: o.client_cpf, clientZipCode: o.client_zip_code, clientStreet: o.client_street,
          clientNumber: o.client_number, clientNeighborhood: o.client_neighborhood, 
          clientCity: o.client_city, clientState: o.client_state, items: o.items, total: o.total,
          productionDetails: o.production_details, status: o.status, createdAt: o.created_at, updatedAt: o.updated_at
        })));
      }

      const { data: clientsData } = await supabase.from('clients').select('*');
      if (clientsData) {
         setClients(clientsData.map(c => ({
           id: c.id, name: c.name, contact: c.contact, cpf: c.cpf, zipCode: c.zip_code,
           street: c.street, number: c.number, neighborhood: c.neighborhood, city: c.city, state: c.state
         })));
      }

      setDataLoaded(true);
      console.log('All data loaded from Supabase.');
    };

    loadData();
  }, []); // Run only once on mount

  // Current User (session state still in localStorage for simplicity across reloads)
  useEffect(() => {
    if (!dataLoaded) return;
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser, dataLoaded]);


  // isAuthenticated is true if currentUser exists
  const isAuthenticated = !!currentUser;

  // Login function
  const login = async (usernameInput: string, passwordInput: string): Promise<boolean> => {
    const { data: user } = await supabase.from('users').select('*').eq('username', usernameInput).eq('password', passwordInput).maybeSingle();
    if (user) {
      setCurrentUser(user as User);
      return true;
    }
    return false;
  };

  // Logout function
  const logout = () => {
    setCurrentUser(null);
    navigate('/login', { replace: true });
  };

  const updateCompanyInfo = async (name: string, logo: string | null) => {
    setCompanyInfo({ ...companyInfo, name, logo });
    await supabase.from('company_info').upsert({ key: 'singleton', name, logo });
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const { data, error } = await supabase.from('products').insert({
      name: product.name, description: product.description, price: product.price, 
      cost_price: product.costPrice, stock: product.stock, image_url: product.imageUrl
    }).select().single();
    if (data && !error) {
      setProducts((prev) => [...prev, {
        id: data.id, name: data.name, description: data.description, price: data.price,
        costPrice: data.cost_price, stock: data.stock, imageUrl: data.image_url
      }]);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((prod) => (prod.id === updatedProduct.id ? updatedProduct : prod))
    );
    await supabase.from('products').update({
       name: updatedProduct.name, description: updatedProduct.description, price: updatedProduct.price, 
       cost_price: updatedProduct.costPrice, stock: updatedProduct.stock, image_url: updatedProduct.imageUrl
    }).eq('id', updatedProduct.id);
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((prod) => prod.id !== id));
    await supabase.from('products').delete().eq('id', id);
  };

  const addRawMaterial = async (rawMaterial: Omit<RawMaterial, 'id'>) => {
    const { data, error } = await supabase.from('raw_materials').insert({
      name: rawMaterial.name, description: rawMaterial.description, unit: rawMaterial.unit,
      quantity: rawMaterial.quantity, cost_per_unit: rawMaterial.costPerUnit, supplier: rawMaterial.supplier
    }).select().single();
    if (data && !error) {
       setRawMaterials((prev) => [...prev, {
         id: data.id, name: data.name, description: data.description, unit: data.unit,
         quantity: data.quantity, costPerUnit: data.cost_per_unit, supplier: data.supplier
       }]);
    }
  };

  const updateRawMaterial = async (updatedRawMaterial: RawMaterial) => {
    setRawMaterials((prev) =>
      prev.map((rm) => (rm.id === updatedRawMaterial.id ? updatedRawMaterial : rm))
    );
    await supabase.from('raw_materials').update({
       name: updatedRawMaterial.name, description: updatedRawMaterial.description, unit: updatedRawMaterial.unit,
       quantity: updatedRawMaterial.quantity, cost_per_unit: updatedRawMaterial.costPerUnit, supplier: updatedRawMaterial.supplier
    }).eq('id', updatedRawMaterial.id);
  };

  const deleteRawMaterial = async (id: string) => {
    setRawMaterials((prev) => prev.filter((rm) => rm.id !== id));
    await supabase.from('raw_materials').delete().eq('id', id);
  };

  const addOrder = (orderToSave: Order): Order => {
     // Save optimistically locally immediately, will not work id-wise until real backend fetch, but keeping sync simple
     const tempId = Date.now().toString();
     const newOrder = { ...orderToSave, id: tempId };
     setOrders((prev) => [...prev, newOrder]);
     
     supabase.from('orders').insert({
        type: newOrder.type, client_name: newOrder.clientName, client_contact: newOrder.clientContact,
        client_cpf: newOrder.clientCpf, client_zip_code: newOrder.clientZipCode, client_street: newOrder.clientStreet,
        client_number: newOrder.clientNumber, client_neighborhood: newOrder.clientNeighborhood, 
        client_city: newOrder.clientCity, client_state: newOrder.clientState, items: newOrder.items,
        total: newOrder.total, production_details: newOrder.productionDetails, status: newOrder.status,
        created_at: newOrder.createdAt, updated_at: newOrder.updatedAt
     }).select().single().then(({data}) => {
         if (data) {
            setOrders(currentList => currentList.map(o => o.id === tempId ? { ...newOrder, id: data.id } : o));
         }
     });

     return newOrder;
  };

  const updateOrder = async (updatedOrder: Order) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === updatedOrder.id ? updatedOrder : ord))
    );
    await supabase.from('orders').update({
        type: updatedOrder.type, client_name: updatedOrder.clientName, client_contact: updatedOrder.clientContact,
        client_cpf: updatedOrder.clientCpf, client_zip_code: updatedOrder.clientZipCode, client_street: updatedOrder.clientStreet,
        client_number: updatedOrder.clientNumber, client_neighborhood: updatedOrder.clientNeighborhood, 
        client_city: updatedOrder.clientCity, client_state: updatedOrder.clientState, items: updatedOrder.items,
        total: updatedOrder.total, production_details: updatedOrder.productionDetails, status: updatedOrder.status,
        updated_at: updatedOrder.updatedAt
    }).eq('id', updatedOrder.id);
  };

  const addClient = async (client: Omit<Client, 'id'>) => {
    const { data } = await supabase.from('clients').insert({
        name: client.name, contact: client.contact, cpf: client.cpf, zip_code: client.zipCode,
        street: client.street, number: client.number, neighborhood: client.neighborhood, 
        city: client.city, state: client.state
    }).select().single();

    if (data) {
       setClients((prev) => [...prev, {
         id: data.id, name: data.name, contact: data.contact, cpf: data.cpf, zipCode: data.zip_code,
         street: data.street, number: data.number, neighborhood: data.neighborhood, city: data.city, state: data.state
       }]);
    }
  };

  const updateClient = async (updatedClient: Client) => {
    setClients((prev) =>
      prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
    );
    await supabase.from('clients').update({
        name: updatedClient.name, contact: updatedClient.contact, cpf: updatedClient.cpf, zip_code: updatedClient.zipCode,
        street: updatedClient.street, number: updatedClient.number, neighborhood: updatedClient.neighborhood, 
        city: updatedClient.city, state: updatedClient.state
    }).eq('id', updatedClient.id);
  };

  const deleteClient = async (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    await supabase.from('clients').delete().eq('id', id);
  };

  // User management functions
  const registerUser = async (username: string, password: string, role: UserRole) => {
    const { data } = await supabase.from('users').insert({
       username, password, role
    }).select().single();

    if (data) {
       setUsers((prev) => [...prev, data as User]);
       setIsInitialSetup(false);
    }
  };

  const updateUser = async (updatedUser: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    await supabase.from('users').update({
      username: updatedUser.username, password: updatedUser.password, role: updatedUser.role
    }).eq('id', updatedUser.id);
  };
  
  const deleteUser = async (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (currentUser?.id === id) {
      setCurrentUser(null);
    }
    await supabase.from('users').delete().eq('id', id);
  };

  // Function to update configurable permissions
  const updateUserPermissions = async (permissions: UserPermissions) => {
    setUserPermissions(permissions);
    
    await supabase.from('user_permissions').upsert({
       key: 'singleton',
       can_add_product: permissions.canAddProduct,
       can_edit_product: permissions.canEditProduct,
       can_delete_product: permissions.canDeleteProduct,
       can_view_product_cost_price: permissions.canViewProductCostPrice,
       can_finalize_sale: permissions.canFinalizeSale,
       can_generate_budget: permissions.canGenerateBudget,
       can_create_service_order: permissions.canCreateServiceOrder,
       can_edit_order_items: permissions.canEditOrderItems,
       can_edit_service_order: permissions.canEditServiceOrder,
       can_edit_order_status: permissions.canEditOrderStatus,
       can_edit_production_details: permissions.canEditProductionDetails,
       can_edit_budget: permissions.canEditBudget,
       can_edit_budget_status: permissions.canEditBudgetStatus,
       can_add_raw_material: permissions.canAddRawMaterial,
       can_edit_raw_material: permissions.canEditRawMaterial,
       can_delete_raw_material: permissions.canDeleteRawMaterial,
       can_add_client: permissions.canAddClient,
       can_edit_client: permissions.canEditClient,
       can_delete_client: permissions.canDeleteClient,
       can_view_reports: permissions.canViewReports,
       can_generate_ai_summary: permissions.canGenerateAISummary,
       can_edit_company_settings: permissions.canEditCompanySettings,
       can_manage_users: permissions.canManageUsers,
       can_use_ai: permissions.canUseAI,
       can_print_or_send_order: permissions.canPrintOrSendOrder,
    });
  };

  // Helper function to check permissions based on user role and configuration
  const checkPermission = (permissionName: keyof UserPermissions): boolean => {
    if (currentUser?.role === UserRole.ADMIN) {
      return true; // Admins always have all permissions
    }
    if (currentUser?.role === UserRole.USER) {
      return userPermissions[permissionName] || false; // Check specific permission for standard users
    }
    return false; // Not authenticated
  };

  const value: AuthContextType = {
    isAuthenticated,
    isInitialSetup,
    companyInfo,
    products,
    rawMaterials,
    orders,
    clients,
    users,
    currentUser,
    userPermissions,
    login,
    logout,
    updateCompanyInfo,
    addProduct,
    updateProduct,
    deleteProduct,
    addRawMaterial,
    updateRawMaterial,
    deleteRawMaterial,
    addOrder,
    updateOrder,
    addClient,
    updateClient,
    deleteClient,
    registerUser,
    updateUser,
    deleteUser,
    updateUserPermissions,
    checkPermission,
  };

  if (!dataLoaded) {
    return (
      <div className="flex items-center justify-center h-screen text-indigo-600 text-xl font-semibold">
        Carregando dados...
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="pos" element={<POSPage />} />
            <Route path="service-orders" element={<ServiceOrdersPage />} />
            <Route path="budgets" element={<BudgetsPage />} />
            <Route path="stock" element={<StockPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;