// utils/tokenInvoice.ts
import jsPDF from "jspdf";
import type { BillItem } from "@/types/billing";

/**
 * Generate an 80mm receipt-style token invoice PDF.
 * - Multi-line item names (wrap within Item column)
 * - Small fonts optimized for thermal printers
 * - Dynamic height (no clipping / minimal empty space)
 * - Optional centered logo at the top (base64 PNG/JPG)
 */
export function generateTokenInvoicePDF({
  shopName = "CHINGZ CHINESE",
  tagline = "FAST FOOD",
  addressLine = "BAWARIYA KALAN, BHOPAL",
  tokenPrefix = "Token#",
  invoiceCount,
  date,
  items,
  subtotal,
  discount,
  tax,
  total,
  paymentMode = "CASH",
  logo, // base64 data URL (PNG/JPG), optional
  logoWidth = 50, // points
  logoHeight = 50, // points
}: {
  shopName?: string;
  tagline?: string;
  addressLine?: string;
  tokenPrefix?: string;
  invoiceCount: number;
  date: Date;
  items: BillItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMode?: string;
  logo?: string; // e.g., "data:image/png;base64,...."
  logoWidth?: number;
  logoHeight?: number;
}) {
  // --- Page/layout constants (80mm roll ≈ 226pt wide) ---
  const pageWidth = 226;
  const margin = 12;

  const gap = 14; // spacing between columns
  const qtyW = 28; // reserved width for Qty (left)
  const amtW = 56; // reserved width for Amount (right)

  // Column anchors
  const amtRight = pageWidth - margin; // right edge for Amount
  const rateRight = amtRight - amtW - gap; // right edge for Rate
  const descX = margin + qtyW + gap; // left of description text
  const descRight = rateRight - (gap + 4); // padding before Rate
  const descW = descRight - descX; // max width for item name

  // Font sizes + rhythm (smaller for receipt)
  const lineH = 12; // baseline line height for small body text
  const minRowH = 16; // minimum item row height
  const bottomPad = 12; // breathing room at the end

  // --- Helper to detect image format from data URL ---
  const getImageFormat = (dataUrl?: string): "PNG" | "JPEG" => {
    if (!dataUrl) return "PNG";
    const lower = dataUrl.slice(0, 30).toLowerCase();
    if (lower.includes("image/jpeg") || lower.includes("image/jpg"))
      return "JPEG";
    return "PNG";
  };

  // --- PRE-MEASURE TO COMPUTE DYNAMIC HEIGHT ---
  const measureDoc = new jsPDF({ unit: "pt", format: [pageWidth, 500] });
  measureDoc.setFont("helvetica", "normal");
  measureDoc.setFontSize(9); // item font size used for wrapping

  const list = items.length
    ? items
    : ([
        { name: "— No items —", quantity: 0, price: 0, total: 0 },
      ] as any as BillItem[]);

  const itemLineCounts = list.map((it) => {
    const wrapped = measureDoc.splitTextToSize(
      String(it?.name ?? " "),
      descW
    ) as string[];
    return Math.max(wrapped.length, 1);
  });

  let ySim = 22;

  // Logo space (if provided)
  if (logo) {
    ySim += logoHeight + 12; // logo plus a small gap
  }

  // Header
  ySim += lineH + 2; // shopName (bold, 13)
  ySim += lineH; // tagline (10)
  ySim += lineH + 4; // address (10)
  ySim += lineH; // "Customer Bill" (bold, 11)
  ySim += lineH + 6; // "Take Out" (10)

  // Meta
  ySim += lineH; // date/time (9)
  ySim += 8; // token extra
  ySim += 8; // before hr
  // hr: 0
  ySim += 10; // after hr

  // Table header
  // header text: 0
  ySim += 5; // hr offset
  ySim += 10; // after hr

  // Items
  for (const lines of itemLineCounts) {
    const rowHeight = Math.max(minRowH, lines * lineH);
    ySim += rowHeight;
  }

  // After items
  // hr: 0
  ySim += 10;

  // Totals
  ySim += lineH; // Subtotal
  if (discount > 0) ySim += lineH; // Discount row if present
  ySim += lineH + 4; // GST
  // hr: 0
  ySim += lineH; // space aligned with code

  // Net Bill
  ySim += lineH + 4;
  // hr: 0
  ySim += lineH;

  // Footer
  ySim += lineH; // payment mode
  ySim += lineH; // thank you

  // Bottom padding
  ySim += bottomPad;

  const pageHeight = Math.max(220, Math.ceil(ySim));

  // --- CREATE FINAL DOC WITH EXACT HEIGHT ---
  const doc = new jsPDF({ unit: "pt", format: [pageWidth, pageHeight] });
  doc.setFont("helvetica", "normal");

  const hr = (y: number) => {
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageWidth - margin, y);
  };
  const money = (n: number) => `Rs ${Number(n ?? 0).toFixed(2)}`;
  const numberOnly = (n: number) => `${Number(n ?? 0).toFixed(2)}`;

  let y = 22;

  // --- Logo (optional) ---
  if (logo) {
    const fmt = getImageFormat(logo);
    doc.addImage(
      logo,
      fmt,
      (pageWidth - logoWidth) / 2,
      y,
      logoWidth,
      logoHeight
    );
    y += logoHeight + 16; // ⬅️ increase gap (was 6)
  }

  // --- Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(shopName, pageWidth / 2, y, { align: "center" });
  y += lineH + 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(tagline, pageWidth / 2, y, { align: "center" });
  y += lineH;
  doc.text(addressLine, pageWidth / 2, y, { align: "center" });
  y += lineH + 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Customer Bill", pageWidth / 2, y, { align: "center" });
  y += lineH;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Take Out", pageWidth / 2, y, { align: "center" });
  y += lineH + 6;

  // --- Meta ---
  doc.setFontSize(9);
  doc.text(`Date : ${date.toLocaleDateString()}`, margin, y);
  doc.text(`Time : ${date.toLocaleTimeString()}`, pageWidth - margin, y, {
    align: "right",
  });
  y += lineH;

  doc.setFont("helvetica", "bold");
  doc.text(`${tokenPrefix} : ${invoiceCount}`, margin, y);
  doc.setFont("helvetica", "normal");
  y += 8;

  hr((y += 8));
  y += 10;

  // --- Table header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Qty", margin, y);
  doc.text("Item", descX, y);
  doc.text("Rate", rateRight, y, { align: "right" });
  doc.text("Amt", amtRight, y, { align: "right" });

  hr((y += 5));
  y += 10;

  // --- Rows (multi-line item names; no row borders) ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  if (items.length === 0) {
    doc.text("— No items —", pageWidth / 2, y, { align: "center" });
    y += Math.max(minRowH, lineH);
  } else {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const wrapped = doc.splitTextToSize(
        String(it?.name ?? " "),
        descW
      ) as string[];
      const rowHeight = Math.max(minRowH, wrapped.length * lineH);

      // Qty on first line
      doc.text(String(it.quantity), margin, y);

      // Item lines
      for (let li = 0; li < wrapped.length; li++) {
        doc.text(wrapped[li], descX, y + li * lineH);
      }

      // Rate & Amount on first line
      doc.text(numberOnly(it.price), rateRight, y, { align: "right" });
      doc.text(money(it.total), amtRight, y, { align: "right" });

      y += rowHeight;
    }
  }

  hr(y);
  y += 10;

  // --- Totals ---
  const labelX = rateRight - 62;
  doc.setFontSize(9);

  doc.text("Subtotal:", labelX, y);
  doc.text(money(subtotal), amtRight, y, { align: "right" });
  y += lineH;

  if (discount > 0) {
    doc.text("Discount:", labelX, y);
    doc.text(`- ${money(discount)}`, amtRight, y, { align: "right" });
    y += lineH;
  }

  doc.text("GST (18%):", labelX, y);
  doc.text(money(tax), amtRight, y, { align: "right" });
  y += lineH + 4;

  hr(y);
  y += lineH;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Net Bill :", labelX, y);
  doc.text(money(total), amtRight, y, { align: "right" });
  y += lineH + 4;

  hr(y);
  y += lineH;

  // --- Footer ---
  doc.setFontSize(9.5);
  doc.text(String(paymentMode).toUpperCase(), pageWidth / 2, y, {
    align: "center",
  });
  y += lineH;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Thank you! Visit again.", pageWidth / 2, y, { align: "center" });

  // Bottom padding (ensures nothing touches page edge)
  y += bottomPad;

  // doc.save(`Token-${invoiceCount}.pdf`); 
}
