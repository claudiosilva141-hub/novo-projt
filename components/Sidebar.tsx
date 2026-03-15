import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Shirt, ShoppingCart, ScrollText, BarChart, Menu, X, Warehouse, Settings, Users, FileText, Factory } from 'lucide-react'; // Example icon library
import { useAuth } from '../App';
import { UserRole, UserPermissions } from '../types'; // Import UserPermissions

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  permission?: keyof UserPermissions; // New: Optional permission key for dynamic visibility
  onClick?: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, children, permission, onClick }) => {
  const { currentUser, checkPermission } = useAuth();
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // If a specific permission is required, check it. Otherwise, assume it's generally visible or handled internally.
  // Admins always see everything.
  if (permission && !isAdmin && !checkPermission(permission)) {
    return null;
  }

  // Special handling for pages that are always admin-only (Clients, Settings) if no specific permission is given.
  // This is a simplification; in a more complex app, even these might have granular permissions.
  // For now, if no permission is specified, default to admin-only for these routes if `to` matches.
  const isClientsOrSettingsPage = to === '/clients' || to === '/settings';
  if (isClientsOrSettingsPage && !isAdmin && !permission) {
      return null;
  }


  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200
       ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`
      }
    >
      {icon}
      <span className="ml-3 font-medium">{children}</span>
    </NavLink>
  );
};

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { checkPermission } = useAuth(); // Use checkPermission here for page access

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-40 p-2 rounded-md bg-indigo-600 text-white md:hidden"
        aria-label="Open menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        ></div>
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex-shrink-0 md:flex md:flex-col p-4 border-r border-gray-200`}
      >
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-indigo-700">App Confecção</h2>
          <button onClick={closeSidebar} className="text-gray-500 hover:text-gray-700 md:hidden">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-grow">
          <ul className="space-y-2">
            <li>
              <SidebarLink to="/" icon={<LayoutDashboard className="h-5 w-5" />} onClick={closeSidebar}>
                Dashboard
              </SidebarLink>
            </li>
            <li>
              <SidebarLink to="/products" icon={<Shirt className="h-5 w-5" />} onClick={closeSidebar}>
                Produtos
              </SidebarLink>
            </li>
            <li>
              <SidebarLink to="/pos" icon={<ShoppingCart className="h-5 w-5" />} onClick={closeSidebar}>
                PDV / Orçamentos
              </SidebarLink>
            </li>
            <li>
              <SidebarLink to="/service-orders" icon={<ScrollText className="h-5 w-5" />} onClick={closeSidebar}>
                Ordens de Serviço
              </SidebarLink>
            </li>
            <li>
              <SidebarLink to="/budgets" icon={<FileText className="h-5 w-5" />} onClick={closeSidebar}>
                Orçamentos
              </SidebarLink>
            </li>
            <li>
              <SidebarLink to="/stock" icon={<Warehouse className="h-5 w-5" />} onClick={closeSidebar}>
                Estoque
              </SidebarLink>
            </li>
            {/* Clients and Settings are inherently admin-only pages, so we don't need a specific permission check for their visibility in the sidebar,
                unless we want to make them conditionally visible to regular users with specific granular permissions (e.g., canViewClientsPage).
                For now, keeping them as implicitly admin-only if no permission is set. The `checkPermission` in the SidebarLink handles this. */}
            <SidebarLink to="/clients" icon={<Users className="h-5 w-5" />} permission="canAddClient" onClick={closeSidebar}>
                Clientes
            </SidebarLink>
            <SidebarLink to="/reports" icon={<BarChart className="h-5 w-5" />} permission="canViewReports" onClick={closeSidebar}>
                Relatórios
            </SidebarLink>
            <SidebarLink to="/settings" icon={<Settings className="h-5 w-5" />} permission="canManageUsers" onClick={closeSidebar}>
                Configurações
            </SidebarLink>
          </ul>
        </nav>
      </aside>
    </>
  );
};