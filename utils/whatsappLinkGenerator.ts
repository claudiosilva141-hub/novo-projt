import { Order, CartItem, ProductionItem } from '../types';
import { formatCurrency } from './currencyFormatter';
import { formatDateShort } from './dateFormatter';

/**
 * Generates a WhatsApp share link for an order.
 * @param order The order object.
 * @param companyName The name of the company.
 * @returns A string representing the WhatsApp share URL.
 */
export const generateWhatsAppInvoiceLink = (order: Order, companyName: string): string => {
  let message = `*Confecção ${companyName} - ${order.type === 'budget' ? 'Orçamento' : order.type === 'service-order' ? 'Ordem de Serviço' : 'Cupom Fiscal'}*\n\n`; // Changed "Nota Fiscal" to "Cupom Fiscal"
  message += `*ID do Pedido:* ${order.id}\n`;
  message += `*Cliente:* ${order.clientName}\n`;
  message += `*CPF:* ${order.clientCpf}\n`;
  message += `*Endereço:* ${order.clientStreet}, ${order.clientNumber} - ${order.clientNeighborhood}\n`;
  message += `                 ${order.clientCity}/${order.clientState} - CEP: ${order.clientZipCode}\n`; // Added address
  message += `*Data:* ${formatDateShort(order.createdAt)}\n`;
  message += `*Tipo:* ${order.type === 'sale' ? 'Venda Direta' : order.type === 'service-order' ? 'Ordem de Serviço' : 'Orçamento'}\n`;
  message += `*Status:* ${order.status}\n\n`;

  message += `*${order.type === 'service-order' ? 'Produtos a serem confeccionados' : 'Itens'}:*\n`;
  order.items.forEach((item: CartItem) => {
    message += `- ${item.name} (x${item.quantity}) - ${formatCurrency(item.price)} cada\n`;
  });

  if (order.type === 'service-order' && order.productionDetails && order.productionDetails.length > 0) {
    message += `\n*Detalhes de Produção:*\n`;
    order.productionDetails.forEach((prodItem: ProductionItem) => {
      message += `- ${prodItem.name} (${prodItem.type === 'raw_material' ? 'Matéria Prima' : 'Mão de Obra'}): ${prodItem.quantityUsed} ${prodItem.unit} @ ${formatCurrency(prodItem.costPerUnit)} cada\n`;
    });
  }

  message += `\n*Total ${order.type === 'service-order' ? '(Preço do Serviço)' : ''}:* ${formatCurrency(order.total)}\n\n`;
  message += `Agradecemos a preferência!`;

  const encodedMessage = encodeURIComponent(message);
  // Remove non-numeric characters from the client contact to ensure valid WhatsApp number
  const phoneNumber = order.clientContact.replace(/\D/g, '');

  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
};