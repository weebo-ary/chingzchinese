interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface InvoiceData {
  id: string;
  date: string;
  customerName: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

export const generateInvoiceHTML = (invoiceData: InvoiceData): string => {
  return `
    <html>
      <head>
        <title>Invoice - ${invoiceData.id}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #e74c3c; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { width: 80px; height: 80px; margin: 0 auto 10px; }
          .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background-color: #e74c3c; color: white; }
          .totals { text-align: right; margin-top: 20px; }
          .total-row { font-weight: bold; font-size: 18px; color: #e74c3c; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/lovable-uploads/3419ee8e-6ea9-4f1e-b277-aec4b018b84c.png" alt="Chingz Chinese" class="logo" />
          <h1>CHINGZ CHINESE</h1>
          <p>Authentic Chinese Cuisine</p>
          <p>Phone: +91 XXXXX-XXXXX | Email: info@chingzchinese.com</p>
        </div>
        
        <div class="invoice-details">
          <div>
            <h3>Invoice #${invoiceData.id}</h3>
            <p>Date: ${new Date(invoiceData.date).toLocaleDateString()}</p>
            <p>Time: ${new Date(invoiceData.date).toLocaleTimeString()}</p>
          </div>
          <div>
            <h3>Customer Details</h3>
            <p>Name: ${invoiceData.customerName}</p>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <p>Subtotal: ₹${invoiceData.subtotal.toFixed(2)}</p>
          <p>GST (18%): ₹${invoiceData.tax.toFixed(2)}</p>
          ${invoiceData.discount > 0 ? `<p>Discount: -₹${invoiceData.discount.toFixed(2)}</p>` : ''}
          <p class="total-row">Total: ₹${invoiceData.total.toFixed(2)}</p>
        </div>

        <div style="text-center; margin-top: 40px; font-size: 14px; color: #666;">
          <p>Thank you for dining with us!</p>
          <p>Visit us again soon!</p>
        </div>
      </body>
    </html>
  `;
};

export const printInvoice = (invoiceData: InvoiceData) => {
  const invoiceWindow = window.open('', '_blank');
  if (invoiceWindow) {
    const htmlContent = generateInvoiceHTML(invoiceData);
    invoiceWindow.document.write(htmlContent);
    invoiceWindow.document.close();
    
    invoiceWindow.onload = function() {
      invoiceWindow.print();
    };
  }
};

export const downloadInvoice = (invoiceData: InvoiceData) => {
  const htmlContent = generateInvoiceHTML(invoiceData);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice-${invoiceData.id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};