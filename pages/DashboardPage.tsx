import React, { useMemo } from 'react';
import { useAuth } from '../App';
import { formatCurrency } from '../utils/currencyFormatter';
import { ReportCard } from '../components/ReportCard';
import { TrendingUp, Package, ShoppingBag, Truck, DollarSign } from 'lucide-react';
import { OrderStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export const DashboardPage: React.FC = () => {
  const { products, orders, rawMaterials } = useAuth();

  // Calculate total sales
  const totalSales = useMemo(() => {
    return orders
      .filter(order => order.type === 'sale' && (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DELIVERED))
      .reduce((sum, order) => sum + order.total, 0);
  }, [orders]);

  // Calculate total value of finished products in stock (based on cost price)
  const totalFinishedProductsCostValue = useMemo(() => {
    return products.reduce((sum, product) => sum + (product.stock * product.costPrice), 0);
  }, [products]);

  // Calculate total value of raw materials in stock
  const totalRawMaterialValue = useMemo(() => {
    return rawMaterials.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);
  }, [rawMaterials]);

  // Calculate number of active orders (not budget or cancelled)
  const activeOrdersCount = useMemo(() => {
    return orders.filter(order =>
      order.type !== 'budget' &&
      order.status !== OrderStatus.COMPLETED &&
      order.status !== OrderStatus.DELIVERED &&
      order.status !== OrderStatus.CANCELLED
    ).length;
  }, [orders]);

  // Data for sales over time (example: last 7 days)
  const salesData = useMemo(() => {
    const last7DaysSales: { [key: string]: number } = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      last7DaysSales[dateString] = 0;
    }

    orders
      .filter(order => order.type === 'sale' && (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DELIVERED))
      .forEach(order => {
        const orderDate = new Date(order.createdAt);
        const orderDateString = orderDate.toISOString().split('T')[0];
        if (last7DaysSales.hasOwnProperty(orderDateString)) {
          last7DaysSales[orderDateString] += order.total;
        }
      });

    return Object.keys(last7DaysSales)
      .sort() // Sort dates ascending
      .map(date => ({
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        sales: last7DaysSales[date],
      }));
  }, [orders]);

  // Data for order status distribution
  const orderStatusData = useMemo(() => {
    const statusCounts: { [key in OrderStatus]?: number } = {};
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  }, [orders]);

  const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F'];

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ReportCard
          title="Vendas Totais"
          value={formatCurrency(totalSales)}
          icon={<TrendingUp className="h-8 w-8" />}
          color="green"
          description="Valor total de vendas concluídas."
        />
        <ReportCard
          title="Produtos Acabados em Estoque (Custo)"
          value={formatCurrency(totalFinishedProductsCostValue)}
          icon={<Package className="h-8 w-8" />}
          color="blue"
          description="Valor total de custo dos produtos prontos para venda."
        />
        <ReportCard
          title="Matéria Prima em Estoque (Valor)"
          value={formatCurrency(totalRawMaterialValue)}
          icon={<DollarSign className="h-8 w-8" />}
          color="yellow"
          description="Valor total da matéria-prima disponível."
        />
        <ReportCard
          title="Pedidos Ativos"
          value={activeOrdersCount}
          icon={<ShoppingBag className="h-8 w-8" />}
          color="purple"
          description="Pedidos em andamento ou pendentes."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Vendas nos Últimos 7 Dias</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={salesData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição de Status de Pedidos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {orderStatusData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => value.toString()} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};