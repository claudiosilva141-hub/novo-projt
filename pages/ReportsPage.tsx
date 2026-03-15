import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { OrderStatus } from '../types';
import { ReportCard } from '../components/ReportCard';
import { formatCurrency } from '../utils/currencyFormatter';
import { formatDateTime } from '../utils/dateFormatter';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { summarizeReport } from '../services/geminiService';
import { Loader2, TrendingUp, Package, ShoppingBag, BarChart as BarChartIcon, Brain, CheckCircle, Clock, DollarSign, ScrollText, Factory } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export const ReportsPage: React.FC = () => {
  const { products, orders, rawMaterials, checkPermission } = useAuth(); // Use checkPermission
  const canGenerateAISummary = checkPermission('canGenerateAISummary');

  const [reportSummary, setReportSummary] = useState<string | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // --- General Metrics ---
  const totalDirectSalesValue = useMemo(() => {
    return orders
      .filter(order => order.type === 'sale' && (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DELIVERED))
      .reduce((sum, order) => sum + order.total, 0);
  }, [orders]);

  const totalServiceOrdersValue = useMemo(() => {
    return orders
      .filter(order => order.type === 'service-order' && (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DELIVERED))
      .reduce((sum, order) => sum + order.total, 0);
  }, [orders]);

  const totalBudgetsCount = useMemo(() => {
    return orders.filter(order => order.type === 'budget').length;
  }, [orders]);

  const completedDirectSalesCount = useMemo(() => {
    return orders.filter(order => order.type === 'sale' && (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DELIVERED)).length;
  }, [orders]);

  const completedServiceOrdersCount = useMemo(() => {
    return orders.filter(order => order.type === 'service-order' && (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DELIVERED)).length;
  }, [orders]);

  const pendingDirectSalesCount = useMemo(() => {
    return orders.filter(order => order.type === 'sale' && (order.status === OrderStatus.PENDING || order.status === OrderStatus.IN_PROGRESS)).length;
  }, [orders]);

  const pendingServiceOrdersCount = useMemo(() => {
    return orders.filter(order => order.type === 'service-order' && (order.status === OrderStatus.PENDING || order.status === OrderStatus.IN_PROGRESS)).length;
  }, [orders]);

  // New: Calculate total production costs for completed service orders
  const totalProductionCosts = useMemo(() => {
    return orders
      .filter(order => order.type === 'service-order' && (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DELIVERED) && order.productionDetails)
      .reduce((orderSum, order) => {
        const itemCosts = order.productionDetails ? order.productionDetails.reduce((itemSum, item) => itemSum + (item.quantityUsed * item.costPerUnit), 0) : 0;
        return orderSum + itemCosts;
      }, 0);
  }, [orders]);


  // Calculate total value of finished products in stock (based on cost price)
  const totalFinishedProductsCostValue = useMemo(() => {
    return products.reduce((sum, product) => sum + (product.stock * product.costPrice), 0);
  }, [products]);

  const totalRawMaterialValue = useMemo(() => {
    return rawMaterials.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);
  }, [rawMaterials]);

  // --- Sales by Month Chart Data (Direct Sales) ---
  const directSalesByMonthData = useMemo(() => {
    const monthlySales: { [key: string]: number } = {}; // Format: YYYY-MM
    orders
      .filter(order => order.type === 'sale' && (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DELIVERED))
      .forEach(order => {
        const date = new Date(order.createdAt);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlySales[monthKey] = (monthlySales[monthKey] || 0) + order.total;
      });

    return Object.keys(monthlySales)
      .sort()
      .map(key => ({
        month: new Date(key).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' }),
        sales: monthlySales[key],
      }));
  }, [orders]);

  // --- Service Orders by Month Chart Data ---
  const serviceOrdersByMonthData = useMemo(() => {
    const monthlyOrders: { [key: string]: number } = {}; // Format: YYYY-MM
    orders
      .filter(order => order.type === 'service-order' && (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DELIVERED))
      .forEach(order => {
        const date = new Date(order.createdAt);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyOrders[monthKey] = (monthlyOrders[monthKey] || 0) + order.total;
      });

    return Object.keys(monthlyOrders)
      .sort()
      .map(key => ({
        month: new Date(key).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' }),
        total: monthlyOrders[key],
      }));
  }, [orders]);

  // --- Top Products Sales Chart Data (Combined) ---
  const topProductsData = useMemo(() => {
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    orders
      .filter(order => (order.type === 'sale' || order.type === 'service-order') && (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DELIVERED))
      .forEach(order => {
        order.items.forEach(item => {
          if (!productSales[item.id]) {
            productSales[item.id] = { name: item.name, quantity: 0, revenue: 0 };
          }
          productSales[item.id].quantity += item.quantity;
          productSales[item.id].revenue += item.price * item.quantity;
        });
      });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5 products
  }, [orders]);

  const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F'];

  const handleGenerateSummary = async () => {
    if (!canGenerateAISummary) {
      alert('Você não tem permissão para gerar o resumo com IA.');
      return;
    }
    setIsLoadingSummary(true);

    const productionCostsSummary = orders
      .filter(order => order.type === 'service-order' && (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DELIVERED) && order.productionDetails)
      .map(order => {
        const costs = order.productionDetails ? order.productionDetails.reduce((itemSum, item) => itemSum + (item.quantityUsed * item.costPerUnit), 0) : 0;
        return `OS #${order.id}: Custo de Produção: ${formatCurrency(costs)}`;
      }).join('\n');

    const reportContent = `
      Relatório de Atividades da Confecção e Vendas:

      --- Vendas Diretas ---
      Valor Total de Vendas Diretas: ${formatCurrency(totalDirectSalesValue)}
      Número de Vendas Diretas Concluídas/Entregues: ${completedDirectSalesCount}
      Número de Vendas Diretas Pendentes/Em Andamento: ${pendingDirectSalesCount}

      --- Ordens de Serviço ---
      Valor Total de Ordens de Serviço Concluídas/Entregues: ${formatCurrency(totalServiceOrdersValue)}
      Número de Ordens de Serviço Concluídas/Entregues: ${completedServiceOrdersCount}
      Número de Ordens de Serviço Pendentes/Em Andamento: ${pendingServiceOrdersCount}
      Custo Total de Produção (Ordens de Serviço Concluídas): ${formatCurrency(totalProductionCosts)}
      Detalhes de Custo por OS (Concluídas):
      ${productionCostsSummary}

      --- Orçamentos ---
      Total de Orçamentos Registrados: ${totalBudgetsCount}

      --- Estoque ---
      Valor Total de Produtos Acabados em Estoque (Custo): ${formatCurrency(totalFinishedProductsCostValue)}
      Valor Total da Matéria Prima em Estoque: ${formatCurrency(totalRawMaterialValue)}

      --- Tendências Mensais ---
      Vendas Diretas por Mês:
      ${directSalesByMonthData.map(data => `${data.month}: ${formatCurrency(data.sales)}`).join('\n')}

      Ordens de Serviço por Mês:
      ${serviceOrdersByMonthData.map(data => `${data.month}: ${formatCurrency(data.total)}`).join('\n')}

      --- Produtos em Destaque (Vendas e O.S. combinadas) ---
      Top 5 Produtos por Faturamento:
      ${topProductsData.map(data => `${data.name}: ${formatCurrency(data.revenue)} (${data.quantity} unidades)`).join('\n')}
    `;
    try {
      const summary = await summarizeReport(reportContent);
      setReportSummary(summary);
      setIsSummaryModalOpen(true);
    } catch (error) {
      alert('Erro ao gerar resumo com Gemini AI. Verifique a chave da API.');
      console.error(error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Relatórios de Atividade</h2>
        <Button
          onClick={handleGenerateSummary}
          isLoading={isLoadingSummary}
          icon={<Brain className="h-5 w-5" />}
          disabled={!canGenerateAISummary} // Disabled if no permission
        >
          {isLoadingSummary ? 'Gerando Resumo...' : 'Gerar Resumo com IA'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <ReportCard
          title="Valor Total Vendas Diretas"
          value={formatCurrency(totalDirectSalesValue)}
          icon={<TrendingUp className="h-8 w-8" />}
          color="green"
          description="Soma de todas as vendas diretas concluídas."
        />
        <ReportCard
          title="Valor Total Ordens de Serviço"
          value={formatCurrency(totalServiceOrdersValue)}
          icon={<ShoppingBag className="h-8 w-8" />}
          color="blue"
          description="Soma de todas as ordens de serviço concluídas."
        />
        <ReportCard
          title="Vendas Diretas Concluídas"
          value={completedDirectSalesCount}
          icon={<CheckCircle className="h-8 w-8" />}
          color="purple"
          description="Número de vendas diretas finalizadas."
        />
        <ReportCard
          title="O.S. Concluídas"
          value={completedServiceOrdersCount}
          icon={<CheckCircle className="h-8 w-8" />}
          color="teal"
          description="Número de ordens de serviço finalizadas."
        />
        <ReportCard
          title="Vendas Diretas Pendentes"
          value={pendingDirectSalesCount}
          icon={<Clock className="h-8 w-8" />}
          color="yellow"
          description="Vendas diretas aguardando finalização."
        />
        <ReportCard
          title="O.S. Pendentes"
          value={pendingServiceOrdersCount}
          icon={<Clock className="h-8 w-8" />}
          color="orange"
          description="Ordens de serviço aguardando finalização."
        />
        <ReportCard
          title="Total de Orçamentos"
          value={totalBudgetsCount}
          icon={<ScrollText className="h-8 w-8" />}
          color="blue"
          description="Orçamentos registrados (em aberto ou fechados)."
        />
        <ReportCard
          title="Custo Total de Produção (O.S.)"
          value={formatCurrency(totalProductionCosts)}
          icon={<Factory className="h-8 w-8" />}
          color="red"
          description="Custo total de matéria-prima e mão de obra para O.S. concluídas."
        />
        <ReportCard
          title="Produtos Acabados em Estoque (Custo)"
          value={formatCurrency(totalFinishedProductsCostValue)}
          icon={<Package className="h-8 w-8" />}
          color="red"
          description="Valor de custo total dos itens prontos para venda no estoque."
        />
        <ReportCard
          title="Valor Matéria Prima em Estoque"
          value={formatCurrency(totalRawMaterialValue)}
          icon={<DollarSign className="h-8 w-8" />}
          color="gray"
          description="Valor monetário total da matéria-prima."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Vendas Diretas por Mês</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={directSalesByMonthData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ordens de Serviço por Mês</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={serviceOrdersByMonthData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} /> {/* Tailwind emerald-500 */}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2"> {/* Span both columns */}
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Produtos por Faturamento (Vendas Diretas e O.S.)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topProductsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="revenue"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {topProductsData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Modal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        title="Resumo do Relatório (Gerado por IA)"
        size="lg"
      >
        {reportSummary ? (
          <p className="whitespace-pre-wrap text-gray-800">{reportSummary}</p>
        ) : (
          <p className="text-gray-600">Nenhum resumo disponível.</p>
        )}
      </Modal>
    </div>
  );
};