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
      try {
        console.log('Starting data load from Supabase...');
        
        // Load all data from Supabase
        const { data: companyData, error: companyError } = await supabase.from('company_info').select('*').eq('key', 'singleton').maybeSingle();
        if (companyError) console.error('Error fetching company_info:', companyError);
        if (companyData) setCompanyInfo({ 
          name: companyData.name, 
          logo: companyData.logo, 
          geminiApiKey: companyData.gemini_api_key,
          geminiModelText: companyData.gemini_model_text,
          geminiModelImage: companyData.gemini_model_image,
          key: 'singleton' 
        });

        const { data: permData, error: permError } = await supabase.from('user_permissions').select('*').eq('key', 'singleton').maybeSingle();
        if (permError) console.error('Error fetching user_permissions:', permError);
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

        const { data: loadedUsers, error: usersError } = await supabase.from('users').select('*');
        if (usersError) console.error('Error fetching users:', usersError);
        if (loadedUsers) {
          setUsers(loadedUsers);
          setIsInitialSetup(loadedUsers.length === 0);
        }

        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const userObj: User = {
            id: authUser.id,
            username: authUser.email || '',
            fullName: authUser.user_metadata?.full_name || '',
            role: authUser.user_metadata?.role || UserRole.USER,
            password: '', // Password is not stored locally with Supabase Auth
          };
          setCurrentUser(userObj);
        } else {
          setCurrentUser(null);
          localStorage.removeItem('currentUser');
        }

        const { data: prodData, error: prodError } = await supabase.from('products').select('*');
        if (prodError) console.error('Error fetching products:', prodError);
        if (prodData) {
          setProducts(prodData.map(p => ({
            id: p.id, name: p.name, description: p.description, price: p.price,
            costPrice: p.cost_price, stock: p.stock, imageUrl: p.image_url
          })));
        }

        const { data: rawData, error: rawError } = await supabase.from('raw_materials').select('*');
        if (rawError) console.error('Error fetching raw_materials:', rawError);
        if (rawData) {
           setRawMaterials(rawData.map(r => ({
             id: r.id, name: r.name, description: r.description, unit: r.unit,
             quantity: r.quantity, costPerUnit: r.cost_per_unit, supplier: r.supplier
           })));
        }

        const { data: orderData, error: orderError } = await supabase.from('orders').select('*');
        if (orderError) console.error('Error fetching orders:', orderError);
        if (orderData) {
          setOrders(orderData.map(o => ({
            id: o.id, type: o.type, clientName: o.client_name, clientContact: o.client_contact,
            clientCpf: o.client_cpf, clientZipCode: o.client_zip_code, clientStreet: o.client_street,
            clientNumber: o.client_number, clientNeighborhood: o.client_neighborhood, 
            clientCity: o.client_city, clientState: o.client_state, items: o.items, total: o.total,
            productionDetails: o.production_details, status: o.status, createdAt: o.created_at, updatedAt: o.updated_at
          })));
        }

        const { data: clientsData, error: clientsError } = await supabase.from('clients').select('*');
        if (clientsError) console.error('Error fetching clients:', clientsError);
        if (clientsData) {
           setClients(clientsData.map(c => ({
             id: c.id, name: c.name, contact: c.contact, cpf: c.cpf, zipCode: c.zip_code,
             street: c.street, number: c.number, neighborhood: c.neighborhood, city: c.city, state: c.state
           })));
        }

        setDataLoaded(true);
        console.log('All data loaded from Supabase successfully.');
      } catch (err) {
        console.error('Critical error loading data from Supabase:', err);
        setDataLoaded(true); // Still set data loaded to avoid infinite loading screen, but user might see empty state
      }
    };

    loadData();
  }, []); // Run only once on mount

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userObj: User = {
          id: session.user.id,
          username: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || '',
          role: session.user.user_metadata?.role || UserRole.USER,
          password: '',
        };
        setCurrentUser(userObj);
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  // isAuthenticated is true if currentUser exists
  const isAuthenticated = !!currentUser;

  // Login function
  const login = async (emailInput: string, passwordInput: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailInput,
      password: passwordInput,
    });
    
    if (error) {
      console.error('Login error:', error.message);
      return false;
    }
    
    return !!data.user;
  };

  // Logout function
  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    navigate('/login', { replace: true });
  };

  const updateCompanyInfo = async (name: string, logo: string | null, geminiApiKey?: string, geminiModelText?: string, geminiModelImage?: string) => {
    setCompanyInfo({ ...companyInfo, name, logo, geminiApiKey, geminiModelText, geminiModelImage });
    const { error } = await supabase.from('company_info').upsert({ 
      key: 'singleton', 
      name, 
      logo,
      gemini_api_key: geminiApiKey,
      gemini_model_text: geminiModelText,
      gemini_model_image: geminiModelImage
    });
    if (error) {
      console.error('Error updating company info:', error);
      alert('Erro ao atualizar informações da empresa: ' + error.message);
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const { data, error } = await supabase.from('products').insert({
      name: product.name, description: product.description, price: product.price, 
      cost_price: product.costPrice, stock: product.stock, image_url: product.imageUrl
    }).select().single();
    if (error) {
      console.error('Error adding product:', error);
      alert('Erro ao adicionar produto: ' + error.message);
      return;
    }
    if (data) {
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
    const { error } = await supabase.from('products').update({
       name: updatedProduct.name, description: updatedProduct.description, price: updatedProduct.price, 
       cost_price: updatedProduct.costPrice, stock: updatedProduct.stock, image_url: updatedProduct.imageUrl
    }).eq('id', updatedProduct.id);
    if (error) {
      console.error('Error updating product:', error);
      alert('Erro ao atualizar produto: ' + error.message);
      // Revert local state would be better, but keeping it simple for now
    }
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((prod) => prod.id !== id));
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
       console.error('Error deleting product:', error);
       alert('Erro ao excluir produto: ' + error.message);
    }
  };

  const addRawMaterial = async (rawMaterial: Omit<RawMaterial, 'id'>) => {
    const { data, error } = await supabase.from('raw_materials').insert({
      name: rawMaterial.name, description: rawMaterial.description, unit: rawMaterial.unit,
      quantity: rawMaterial.quantity, cost_per_unit: rawMaterial.costPerUnit, supplier: rawMaterial.supplier
    }).select().single();
    if (error) {
      console.error('Error adding raw material:', error);
      alert('Erro ao adicionar matéria-prima: ' + error.message);
      return;
    }
    if (data) {
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
    const { error } = await supabase.from('raw_materials').update({
       name: updatedRawMaterial.name, description: updatedRawMaterial.description, unit: updatedRawMaterial.unit,
       quantity: updatedRawMaterial.quantity, cost_per_unit: updatedRawMaterial.costPerUnit, supplier: updatedRawMaterial.supplier
    }).eq('id', updatedRawMaterial.id);
    if (error) {
      console.error('Error updating raw material:', error);
      alert('Erro ao atualizar matéria-prima: ' + error.message);
    }
  };

  const deleteRawMaterial = async (id: string) => {
    setRawMaterials((prev) => prev.filter((rm) => rm.id !== id));
    const { error } = await supabase.from('raw_materials').delete().eq('id', id);
    if (error) {
      console.error('Error deleting raw material:', error);
      alert('Erro ao excluir matéria-prima: ' + error.message);
    }
  };

  const addOrder = (orderToSave: Order): Order => {
     // Generate new ID based on date and series (1 to 1000)
     const now = new Date();
     const dateStr = now.getFullYear().toString() + 
                     (now.getMonth() + 1).toString().padStart(2, '0') + 
                     now.getDate().toString().padStart(2, '0');
     
     // Find orders from today and their max suffix
     const todaysOrders = orders.filter(o => o.id.startsWith(dateStr));
     let nextNum = 1;
     
     if (todaysOrders.length > 0) {
       const suffixes = todaysOrders.map(o => {
         const parts = o.id.split('-');
         return parts.length > 1 ? parseInt(parts[1], 10) : 0;
       });
       nextNum = Math.max(...suffixes, 0) + 1;
     }

     const newId = `${dateStr}-${nextNum.toString().padStart(4, '0')}`;
     const newOrder = { ...orderToSave, id: newId };
     setOrders((prev) => [...prev, newOrder]);
     
     supabase.from('orders').insert({
        id: newOrder.id, // Explicitly provide the custom ID
        type: newOrder.type, client_name: newOrder.clientName, client_contact: newOrder.clientContact,
        client_cpf: newOrder.clientCpf, client_zip_code: newOrder.clientZipCode, client_street: newOrder.clientStreet,
        client_number: newOrder.clientNumber, client_neighborhood: newOrder.clientNeighborhood, 
        client_city: newOrder.clientCity, client_state: newOrder.clientState, items: newOrder.items,
        total: newOrder.total, production_details: newOrder.productionDetails, status: newOrder.status,
        created_at: newOrder.createdAt, updated_at: newOrder.updatedAt
     }).select().single().then(({data, error}) => {
         if (error) {
            console.error('Error adding order:', error);
            alert('Erro ao salvar pedido: ' + error.message);
         }
         // No need to update the ID here as we predetermined it
     });

     return newOrder;
  };

  const updateOrder = async (updatedOrder: Order) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === updatedOrder.id ? updatedOrder : ord))
    );
    const { error } = await supabase.from('orders').update({
        type: updatedOrder.type, client_name: updatedOrder.clientName, client_contact: updatedOrder.clientContact,
        client_cpf: updatedOrder.clientCpf, client_zip_code: updatedOrder.clientZipCode, client_street: updatedOrder.clientStreet,
        client_number: updatedOrder.clientNumber, client_neighborhood: updatedOrder.clientNeighborhood, 
        client_city: updatedOrder.clientCity, client_state: updatedOrder.clientState, items: updatedOrder.items,
        total: updatedOrder.total, production_details: updatedOrder.productionDetails, status: updatedOrder.status,
        updated_at: updatedOrder.updatedAt
    }).eq('id', updatedOrder.id);
    if (error) {
      console.error('Error updating order:', error);
      alert('Erro ao atualizar pedido: ' + error.message);
    }
  };

  const addClient = async (client: Omit<Client, 'id'>) => {
    const { data, error } = await supabase.from('clients').insert({
        name: client.name, contact: client.contact, cpf: client.cpf, zip_code: client.zipCode,
        street: client.street, number: client.number, neighborhood: client.neighborhood, 
        city: client.city, state: client.state
    }).select().single();

    if (error) {
      console.error('Error adding client:', error);
      alert('Erro ao adicionar cliente: ' + error.message);
      return;
    }

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
    const { error } = await supabase.from('clients').update({
        name: updatedClient.name, contact: updatedClient.contact, cpf: updatedClient.cpf, zip_code: updatedClient.zipCode,
        street: updatedClient.street, number: updatedClient.number, neighborhood: updatedClient.neighborhood, 
        city: updatedClient.city, state: updatedClient.state
    }).eq('id', updatedClient.id);
    if (error) {
       console.error('Error updating client:', error);
       alert('Erro ao atualizar cliente: ' + error.message);
    }
  };

  const deleteClient = async (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
       console.error('Error deleting client:', error);
       alert('Erro ao excluir cliente: ' + error.message);
    }
  };

  // User management functions
  const registerUser = async (email: string, password: string, role: UserRole, fullName: string = '') => {
    console.log('Registering user with Supabase Auth:', { email, role, fullName });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        }
      }
    });

    if (error) {
      console.error('Error registering user:', error);
      alert('Erro ao registrar usuário: ' + error.message);
      throw error;
    }

    if (data.user) {
      // Also insert into our users table to maintain compatibility with existing logic
      await supabase.from('users').upsert({
        id: data.user.id,
        username: email,
        password: '', // No longer storing password in our table
        role,
        full_name: fullName
      });
      
      setUsers((prev) => [...prev, {
        id: data.user!.id,
        username: email,
        fullName,
        role,
        password: ''
      }]);
      setIsInitialSetup(false);
    }
  };

  const sendOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      console.error('Error sending OTP:', error.message);
      throw error;
    }
  };

  const verifyOtp = async (email: string, token: string): Promise<boolean> => {
    // Note: Suapbase verifyOtp handles both signup and signin tokens
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup' // or 'signin' depending on flow, but 'signup' is what's used after signUp
    });

    if (error) {
       // Try 'signin' type if 'signup' fails, in case user already existed
       const { data: data2, error: error2 } = await supabase.auth.verifyOtp({
         email,
         token,
         type: 'magiclink'
       });
       if (error2) {
         console.error('OTP verification error:', error2.message);
         return false;
       }
       return !!data2.user;
    }
    
    return !!data.user;
  };

  const updateUser = async (updatedUser: User) => {
    console.log('Updating user:', updatedUser);
    
    // Update Auth user metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: updatedUser.fullName,
        role: updatedUser.role
      }
    });

    if (authError) console.error('Error updating auth metadata:', authError);

    const { error } = await supabase.from('users').update({
      username: updatedUser.username, 
      role: updatedUser.role,
      full_name: updatedUser.fullName
    }).eq('id', updatedUser.id);
    
    if (error) {
      console.error('Error updating user table:', error);
      alert('Erro ao atualizar usuário: ' + error.message);
      throw error;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
  };
  
  const deleteUser = async (id: string) => {
    // Note: Deleting from auth.users requires admin API. 
    // For now we delete from our public users table and let the session expire or handle it manually.
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.error('Error deleting user:', error);
      alert('Erro ao excluir usuário: ' + error.message);
      throw error;
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (currentUser?.id === id) {
      logout();
    }
  };

  // Function to update configurable permissions
  const updateUserPermissions = async (permissions: UserPermissions) => {
    setUserPermissions(permissions);
    
    const { error } = await supabase.from('user_permissions').upsert({
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
    if (error) {
       console.error('Error updating user permissions:', error);
       alert('Erro ao atualizar permissões: ' + error.message);
    }
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
    sendOtp,
    verifyOtp,
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