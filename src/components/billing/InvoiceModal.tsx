import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Printer } from "lucide-react";
import type { InvoiceData } from "@/types/billing";
import { printInvoice, downloadInvoice } from "@/utils/invoiceGenerator";
import { useToast } from "@/hooks/use-toast";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null; // 👈 align with parent
}

const InvoiceModal = ({ isOpen, onClose, invoice }: InvoiceModalProps) => {
  const { toast } = useToast();

  if (!invoice) return null;

  const handlePrint = () => {
    try {
      printInvoice(invoice);
      toast({ title: "Printing...", description: "Invoice sent to printer" });
    } catch (e: any) {
      toast({ title: "Print failed", description: e?.message || "Try again", variant: "destructive" });
    }
  };

  const handleDownload = () => {
    try {
      downloadInvoice(invoice);
      toast({ title: "Downloaded", description: "Invoice downloaded successfully" });
    } catch (e: any) {
      toast({ title: "Download failed", description: e?.message || "Try again", variant: "destructive" });
    }
  };

  const d = new Date(invoice.date);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }} // 👈 correct handler
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              Invoice Details — {invoice.invoiceNumber || invoice.id}
            </span>
            <div className="flex gap-2">
              <Button onClick={handlePrint} size="sm" className="bg-gradient-brand hover:opacity-90">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleDownload} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="text-center border-b-2 border-primary pb-6">
            <img
              src="/lovable-uploads/3419ee8e-6ea9-4f1e-b277-aec4b018b84c.png"
              alt="Chingz Chinese"
              className="h-20 w-20 mx-auto mb-3 object-contain"
            />
            <h1 className="text-2xl font-bold text-primary">CHINGZ CHINESE</h1>
            <p className="text-sm text-muted-foreground">Authentic Chinese Cuisine</p>
            <p className="text-sm text-muted-foreground">
              Phone: +91 XXXXX-XXXXX | Email: info@chingzchinese.com
            </p>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Invoice Details</h3>
              <p><span className="font-medium">Invoice #:</span> {invoice.invoiceNumber || invoice.id}</p>
              <p><span className="font-medium">Date:</span> {d.toLocaleDateString()}</p>
              <p><span className="font-medium">Time:</span> {d.toLocaleTimeString()}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Customer Details</h3>
              <p><span className="font-medium">Name:</span> {invoice.customerName}</p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Order Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-left">Quantity</th>
                    <th className="px-4 py-3 text-left">Price</th>
                    <th className="px-4 py-3 text-left">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={item.id ?? index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">₹{Number(item.price).toFixed(2)}</td>
                      <td className="px-4 py-3">₹{Number(item.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4">
            <div className="space-y-2 text-right max-w-sm ml-auto">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%):</span>
                <span>₹{Number(invoice.tax).toFixed(2)}</span>
              </div>
              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-₹{Number(invoice.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg text-primary border-t pt-2">
                <span>Total:</span>
                <span>₹{Number(invoice.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">Thank you for dining with us!</p>
            <p className="text-sm text-muted-foreground">Visit us again soon!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceModal;
