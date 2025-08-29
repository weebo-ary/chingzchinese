// utils/invoiceGenerator.ts
import { InvoiceData } from "@/types/billing";

type ReceiptOptions = {
  shopName?: string;
  tagline?: string;
  addressLine?: string;
  tokenPrefix?: string;      // e.g., "Token#"
  paymentMode?: string;      // e.g., "CASH"
  logoUrl?: string | null;   // optional
  paperWidthMm?: 80 | 58;    // receipt width
};

const defaultOpts: Required<ReceiptOptions> = {
  shopName: "CHINGZ CHINESE",
  tagline: "FAST FOOD",
  addressLine: "BAWARIYA KALAN, BHOPAL",
  tokenPrefix: "Token#",
  paymentMode: "CASH",
  logoUrl: "/lovable-uploads/3419ee8e-6ea9-4f1e-b277-aec4b018b84c.png",
  paperWidthMm: 80,
};

// Basic INR
const inr = (n: number) => `&#8377;${(n ?? 0).toFixed(2)}`;

export const generateInvoiceHTML = (
  invoiceData: InvoiceData,
  options: ReceiptOptions = {}
): string => {
  const opts = { ...defaultOpts, ...options };
  const date = new Date(invoiceData.date);
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString();

  // 80mm ~ 302px at 96dpi; we use mm for print and px for screen preview
  const paperMm = opts.paperWidthMm;
  const contentMaxPx = paperMm === 58 ? 220 : 300;

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${opts.shopName} - ${invoiceData.invoiceNumber || invoiceData.id}</title>
      <style>
        :root{
          --content-max:${contentMaxPx}px;
          --muted:#666;
          --line:#222;
        }
        @page {
          size: ${paperMm}mm auto;
          margin: 4mm;
        }
        *{ box-sizing:border-box; }
        body{
          margin:0;
          padding:0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", "DejaVu Sans", sans-serif;
        }
        .receipt{
          width:100%;
          max-width:var(--content-max);
          margin:0 auto;
          padding:6px 6px 12px;
        }
        .center{ text-align:center; }
        .muted{ color:var(--muted); }
        .hr{ border-top:1px solid var(--line); margin:8px 0; }
        .logo{
          display:block; margin:0 auto 6px; width:64px; height:64px; object-fit:contain;
        }
        h1,h2,h3,p{ margin:0; }
        h1{ font-weight:700; font-size:16px; }
        .sub{ font-size:12px; }
        .meta{ display:flex; justify-content:space-between; font-size:12px; }
        .token{ font-weight:700; font-size:12px; margin-top:4px; }
        .section-title{ font-weight:700; font-size:13px; }

        /* ITEM TABLE */
        table{ width:100%; border-collapse:collapse; }
        .items thead th{
          font-weight:700; font-size:12px; padding:6px 4px; text-align:left; border-bottom:1px solid var(--line);
        }
        .items tbody td{
          font-size:12px; padding:8px 4px; vertical-align:top; border-bottom:1px solid #eee;
        }
        .col-qty{ width:14%; }
        .col-desc{ width:52%; }
        .col-rate{ width:16%; text-align:right; }
        .col-amt{ width:18%; text-align:right; }

        /* TOTALS RIGHT BOX */
        .totals{
          margin-top:8px;
          width:100%;
          display:flex;
          justify-content:flex-end;
        }
        .totals table{ width:60%; min-width: ${paperMm === 58 ? "120px" : "160px"}; }
        .totals td{ font-size:12px; padding:4px 0; }
        .totals td:first-child{ text-align:left; }
        .totals td:last-child{ text-align:right; }
        .net{
          border-top:1px solid var(--line);
          border-bottom:1px solid var(--line);
          padding:8px 0;
          margin-top:4px;
          font-weight:800;
          font-size:14px;
        }

        .footer{ margin-top:10px; }
        .pay{ font-weight:700; font-size:12px; }
        .thanks{ font-size:11px; }
        @media screen {
          body{ background:#f7f7f7; }
          .receipt{ background:#fff; box-shadow:0 1px 6px rgba(0,0,0,.08); margin:12px auto; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">

        ${opts.logoUrl ? `<img src="${opts.logoUrl}" class="logo" alt="logo" />` : ""}

        <div class="center">
          <h1>${opts.shopName}</h1>
          <div class="sub muted">${opts.tagline}</div>
          <div class="sub muted">${opts.addressLine}</div>
        </div>

        <div class="center" style="margin-top:6px;">
          <div class="section-title">Customer Bill</div>
          <div class="muted sub">Take Out</div>
        </div>

        <div class="meta" style="margin-top:8px;">
          <div>Date : ${dateStr}</div>
          <div>Time : ${timeStr}</div>
        </div>
        <div class="token">${opts.tokenPrefix} : ${invoiceData.invoiceNumber || invoiceData.id}</div>
        <div class="sub" style="margin-top:2px;">Order Of : ${invoiceData.customerName || "Walking Customer"}</div>

        <div class="hr"></div>

        <table class="items">
          <thead>
            <tr>
              <th class="col-qty">Qty</th>
              <th class="col-desc">Item Description</th>
              <th class="col-rate">Rate</th>
              <th class="col-amt">Amt</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.items
              .map(
                (it) => `
              <tr>
                <td class="col-qty">${it.quantity}</td>
                <td class="col-desc">${escapeHtml(it.name)}</td>
                <td class="col-rate">${inr(it.price)}</td>
                <td class="col-amt">${inr(it.total)}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tbody>
              <tr>
                <td>Subtotal:</td>
                <td>${inr(invoiceData.subtotal)}</td>
              </tr>
              ${
                invoiceData.discount > 0
                  ? `<tr><td>Discount:</td><td>- ${inr(invoiceData.discount)}</td></tr>`
                  : ""
              }
              <tr>
                <td>GST (18%):</td>
                <td>${inr(invoiceData.tax)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="net">
          <table style="width:100%;">
            <tr>
              <td style="text-align:left;">Net Bill :</td>
              <td style="text-align:right;">${inr(invoiceData.total)}</td>
            </tr>
          </table>
        </div>

        <div class="footer center">
          <div class="pay">${opts.paymentMode}</div>
          <div class="thanks muted">Thank you! Visit again.</div>
        </div>

      </div>
      <script>
        // Ensure images (logo) are loaded before window.onload triggers in some browsers
        (function(){
          const imgs = Array.from(document.images || []);
          if (imgs.length === 0) return;
          Promise.all(imgs.map(i => i.complete ? Promise.resolve() : new Promise(res => { i.onload = i.onerror = res; })))
            .then(() => { /* images ready */ });
        })();
      </script>
    </body>
  </html>`;
};

// Simple HTML escaping for item names
const escapeHtml = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const printInvoice = (invoiceData: InvoiceData, options?: ReceiptOptions) => {
  const html = generateInvoiceHTML(invoiceData, options);
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;

  w.document.open();
  w.document.write(html);
  w.document.close();

  // Wait for images & fonts, then print
  const waitReady = () =>
    new Promise<void>((resolve) => {
      const imgs = Array.from(w.document.images || []);
      const imgWaits = imgs.map((img) =>
        img.complete ? Promise.resolve() : new Promise((r) => ((img.onload = img.onerror = () => r(undefined))))
      );
      Promise.all(imgWaits).then(() => setTimeout(() => resolve(), 100));
    });

  waitReady().then(() => {
    w.focus();
    w.print();
    // w.close(); // uncomment if you want auto-close after print dialog
  });
};

export const downloadInvoice = (invoiceData: InvoiceData, options?: ReceiptOptions) => {
  const html = generateInvoiceHTML(invoiceData, options);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice-${invoiceData.invoiceNumber || invoiceData.id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};