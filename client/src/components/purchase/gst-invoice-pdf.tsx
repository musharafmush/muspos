import jsPDF from 'jspdf';
import { formatCurrency } from '@/lib/currency';

const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  const convertLessThanThousand = (n: number): string => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      return result;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result;
  };

  let result = '';

  if (num >= 10000000) {
    result += convertLessThanThousand(Math.floor(num / 10000000)) + 'Crore ';
    num %= 10000000;
  }

  if (num >= 100000) {
    result += convertLessThanThousand(Math.floor(num / 100000)) + 'Lakh ';
    num %= 100000;
  }

  if (num >= 1000) {
    result += convertLessThanThousand(Math.floor(num / 1000)) + 'Thousand ';
    num %= 1000;
  }

  result += convertLessThanThousand(num);

  return result.trim();
};

interface PurchaseItem {
  id: number;
  productId?: number;
  productName?: string;
  quantity: number;
  unitPrice: string | number;
  total: string | number;
  mrp?: string | number;
  hsnCode?: string;
  gstRate?: number;
  cgstRate?: string | number;
  sgstRate?: string | number;
  product?: {
    id: number;
    name: string;
    sku?: string;
    hsnCode?: string;
    mrp?: string | number;
    gstRate?: number;
  };
}

interface Supplier {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
}

interface Purchase {
  id: number;
  orderNumber?: string;
  invoiceNumber?: string;
  orderDate?: string;
  invoiceDate?: string;
  expectedDate?: string;
  dueDate?: string;
  totalAmount?: string | number;
  subTotal?: string | number;
  taxAmount?: string | number;
  freightCost?: string | number;
  otherCharges?: string | number;
  discountAmount?: string | number;
  status?: string;
  notes?: string;
  supplier?: Supplier;
  items?: PurchaseItem[];
  purchaseItems?: PurchaseItem[];
  purchase_items?: PurchaseItem[];
}

interface BusinessDetails {
  name: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone: string;
  phone2?: string;
  email: string;
  gstin: string;
  stateCode?: string;
}

export const generateGSTInvoicePDF = (
  purchase: Purchase,
  businessDetails: BusinessDetails = {
    name: "NEBULA POS",
    address: "123 Business Street, Commercial Area",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600001",
    phone: "9876543210",
    phone2: "9876543211",
    email: "info@nebulapos.com",
    gstin: "33ABCDE1234F1Z5",
    stateCode: "33"
  },
  invoiceType: 'original' | 'duplicate' | 'triplicate' = 'original'
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);

  const items = purchase.items || purchase.purchaseItems || purchase.purchase_items || [];

  let currentPage = 1;
  let totalPages = 1;

  const drawPage = (startItemIndex: number = 0): number => {
    let yPos = margin;

    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, margin, contentWidth, pageHeight - (margin * 2));

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TAX INVOICE', pageWidth / 2, yPos + 8, { align: 'center' });

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const copyText = invoiceType === 'original' ? '(Original Copy)' :
      invoiceType === 'duplicate' ? '(Duplicate Copy)' : '(Triplicate Copy)';
    pdf.text(copyText, pageWidth - margin - 5, yPos + 8, { align: 'right' });

    yPos += 15;
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 8;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(businessDetails.name, pageWidth / 2, yPos, { align: 'center' });

    yPos += 6;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(businessDetails.address, pageWidth / 2, yPos, { align: 'center' });

    if (businessDetails.city || businessDetails.state || businessDetails.pincode) {
      yPos += 4;
      const cityStatePin = [
        businessDetails.city,
        businessDetails.state,
        businessDetails.pincode ? `PIN : ${businessDetails.pincode}` : ''
      ].filter(Boolean).join(', ');
      pdf.text(cityStatePin, pageWidth / 2, yPos, { align: 'center' });
    }

    yPos += 4;
    const contactInfo = `Contact : ${businessDetails.phone}${businessDetails.phone2 ? ', ' + businessDetails.phone2 : ''}`;
    pdf.text(contactInfo, pageWidth / 2, yPos, { align: 'center' });

    yPos += 4;
    pdf.text(`Email : ${businessDetails.email}`, pageWidth / 2, yPos, { align: 'center' });

    yPos += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.text(`GSTIN : ${businessDetails.gstin}`, pageWidth / 2, yPos, { align: 'center' });

    yPos += 8;
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    const invoiceNo = purchase.invoiceNumber || purchase.orderNumber || `GST/25/${String(purchase.id).padStart(4, '0')}`;
    const invoiceDate = purchase.invoiceDate || purchase.orderDate
      ? new Date(purchase.invoiceDate || purchase.orderDate || '').toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      : new Date().toLocaleDateString('en-IN');
    const dueDate = purchase.dueDate
      ? new Date(purchase.dueDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      : invoiceDate;

    const leftColX = margin + 5;
    const leftValX = margin + 45;
    const rightColX = pageWidth / 2 + 10;
    const rightValX = pageWidth / 2 + 50;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice No.', leftColX, yPos);
    pdf.text(':', leftValX - 2, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoiceNo, leftValX, yPos);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Place of Supply', rightColX, yPos);
    pdf.text(':', rightValX - 2, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${businessDetails.stateCode || '33'}-${businessDetails.state || 'Tamil Nadu'}`, rightValX, yPos);

    yPos += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Date', leftColX, yPos);
    pdf.text(':', leftValX - 2, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoiceDate, leftValX, yPos);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Sold By', rightColX, yPos);
    pdf.text(':', rightValX - 2, yPos);

    yPos += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Ref No.', leftColX, yPos);
    pdf.text(':', leftValX - 2, yPos);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Vehicle No.', rightColX, yPos);
    pdf.text(':', rightValX - 2, yPos);

    yPos += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('PO No.', leftColX, yPos);
    pdf.text(':', leftValX - 2, yPos);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Transport Mode', rightColX, yPos);
    pdf.text(':', rightValX - 2, yPos);

    yPos += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Due Date', leftColX, yPos);
    pdf.text(':', leftValX - 2, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(dueDate, leftValX, yPos);

    pdf.setFont('helvetica', 'bold');
    pdf.text('E-Way Bill No.', rightColX, yPos);
    pdf.text(':', rightValX - 2, yPos);

    yPos += 8;
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Bill To :', leftColX, yPos);

    yPos += 5;
    const supplierName = purchase.supplier?.name || 'Customer';
    pdf.setFontSize(11);
    pdf.text(supplierName.toUpperCase(), leftColX, yPos);

    yPos += 5;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    if (purchase.supplier?.address) {
      const addressLines = purchase.supplier.address.split('\n');
      addressLines.forEach(line => {
        pdf.text(line, leftColX, yPos);
        yPos += 4;
      });
    }

    yPos += 2;
    if (purchase.supplier?.phone) {
      pdf.text(`Contact: ${purchase.supplier.phone}`, leftColX, yPos);
      yPos += 4;
    }

    if (purchase.supplier?.gstin) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`GSTIN: ${purchase.supplier.gstin}`, leftColX, yPos);
    }

    yPos += 8;
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageWidth - margin, yPos);

    const tableTop = yPos;
    const colWidths = {
      sno: 12,
      particulars: 65,
      hsn: 25,
      qty: 20,
      mrp: 22,
      unitPrice: 22,
      gst: 12,
      amount: 22
    };

    let colX = margin;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, yPos, contentWidth, 8, 'F');

    yPos += 6;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);

    pdf.text('S.No.', colX + 2, yPos);
    colX += colWidths.sno;
    pdf.line(colX, tableTop, colX, tableTop + 8);

    pdf.text('PARTICULARS', colX + 2, yPos);
    colX += colWidths.particulars;
    pdf.line(colX, tableTop, colX, tableTop + 8);

    pdf.text('HSN/SAC', colX + 2, yPos);
    colX += colWidths.hsn;
    pdf.line(colX, tableTop, colX, tableTop + 8);

    pdf.text('QTY', colX + 2, yPos);
    colX += colWidths.qty;
    pdf.line(colX, tableTop, colX, tableTop + 8);

    pdf.text('MRP', colX + 2, yPos);
    colX += colWidths.mrp;
    pdf.line(colX, tableTop, colX, tableTop + 8);

    pdf.text('UNIT PRICE', colX + 2, yPos);
    colX += colWidths.unitPrice;
    pdf.line(colX, tableTop, colX, tableTop + 8);

    pdf.text('GST', colX + 2, yPos);
    colX += colWidths.gst;
    pdf.line(colX, tableTop, colX, tableTop + 8);

    pdf.text('AMOUNT', colX + 2, yPos);

    yPos += 2;
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageWidth - margin, yPos);

    pdf.setFont('helvetica', 'normal');
    const rowHeight = 10;
    let itemIndex = startItemIndex;
    let totalQty = 0;
    let grandTotal = 0;

    const gstBreakdown: { [key: string]: { hsn: string; amount: number; cgst: number; sgst: number } } = {};

    while (itemIndex < items.length && yPos < pageHeight - 80) {
      const item = items[itemIndex] as any;
      const productName = item.productName || item.product?.name || 'Product';
      const hsnCode = item.hsnCode || item.product?.hsnCode || '';
      const qty = Number(item.quantity || item.receivedQty || item.received_qty) || 0;
      const unitPrice = Number(item.unitPrice || item.unitCost || item.unit_cost || item.cost) || 0;
      const mrp = Number(item.mrp || item.product?.mrp || unitPrice) || 0;
      const gstRate = Number(item.gstRate || item.taxPercentage || item.tax_percentage || item.taxPercent || item.product?.gstRate || 18);
      const amount = Number(item.total || item.amount || item.subtotal || item.netAmount || item.net_amount) || (qty * unitPrice);

      totalQty += qty;
      grandTotal += amount;

      const baseAmount = amount / (1 + gstRate / 100);
      const gstAmount = amount - baseAmount;
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;

      const gstKey = `${gstRate}%`;
      if (!gstBreakdown[gstKey]) {
        gstBreakdown[gstKey] = { hsn: hsnCode, amount: 0, cgst: 0, sgst: 0 };
      }
      gstBreakdown[gstKey].amount += baseAmount;
      gstBreakdown[gstKey].cgst += cgst;
      gstBreakdown[gstKey].sgst += sgst;
      if (hsnCode && !gstBreakdown[gstKey].hsn) {
        gstBreakdown[gstKey].hsn = hsnCode;
      }

      const rowTop = yPos;
      yPos += rowHeight / 2 + 2;

      colX = margin;
      pdf.text(String(itemIndex + 1), colX + 4, yPos);
      colX += colWidths.sno;

      const maxChars = 35;
      if (productName.length > maxChars) {
        const words = productName.split(' ');
        let line1 = '';
        let line2 = '';
        let i = 0;

        while (i < words.length && (line1 + words[i]).length <= maxChars) {
          line1 += (line1 ? ' ' : '') + words[i];
          i++;
        }
        while (i < words.length) {
          line2 += (line2 ? ' ' : '') + words[i];
          i++;
        }

        pdf.text(line1.toUpperCase(), colX + 2, yPos - 2);
        if (line2) {
          pdf.text(line2.toUpperCase(), colX + 2, yPos + 2);
        }
      } else {
        pdf.text(productName.toUpperCase(), colX + 2, yPos);
      }
      colX += colWidths.particulars;

      pdf.text(hsnCode, colX + 2, yPos);
      colX += colWidths.hsn;

      pdf.text(`${qty} NOS`, colX + 2, yPos);
      colX += colWidths.qty;

      pdf.text(formatCurrency(mrp).replace('₹', ''), colX + 2, yPos);
      colX += colWidths.mrp;

      pdf.text(formatCurrency(unitPrice).replace('₹', ''), colX + 2, yPos);
      colX += colWidths.unitPrice;

      pdf.text(`${gstRate}%`, colX + 2, yPos);
      colX += colWidths.gst;

      pdf.text(formatCurrency(amount).replace('₹', ''), colX + 2, yPos);

      yPos = rowTop + rowHeight;
      pdf.setLineWidth(0.1);
      pdf.line(margin, yPos, pageWidth - margin, yPos);

      itemIndex++;
    }

    pdf.setLineWidth(0.3);
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, yPos, contentWidth, 8, 'F');
    pdf.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 6;
    pdf.setFont('helvetica', 'bold');
    colX = margin + colWidths.sno;
    pdf.text('TOTAL', colX + 2, yPos);
    colX += colWidths.particulars + colWidths.hsn;
    pdf.text(String(totalQty), colX + 2, yPos);
    colX = margin + contentWidth - colWidths.amount;
    pdf.text(formatCurrency(grandTotal).replace('₹', ''), colX + 2, yPos);

    yPos += 5;
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 8;
    const gstTableTop = yPos;
    const gstColWidths = { hsn: 24, gstPercent: 16, amount: 22, cgst: 18, sgst: 18 };

    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, yPos, contentWidth / 2, 6, 'F');

    yPos += 4;
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');

    colX = margin;
    pdf.text('HSN/SAC', colX + 2, yPos);
    colX += gstColWidths.hsn;
    pdf.text('GST%', colX + 2, yPos);
    colX += gstColWidths.gstPercent;
    pdf.text('Amount', colX + 2, yPos);
    colX += gstColWidths.amount;
    pdf.text('CGST', colX + 2, yPos);
    colX += gstColWidths.cgst;
    pdf.text('SGST', colX + 2, yPos);

    let totalTaxAmount = 0;
    let totalBaseAmount = 0;
    Object.values(gstBreakdown).forEach(values => {
      totalTaxAmount += values.cgst + values.sgst;
      totalBaseAmount += values.amount;
    });

    const summaryX = pageWidth / 2 + 10;
    pdf.text('Sub Total', summaryX, yPos);
    pdf.setFont('helvetica', 'normal');

    const subTotal = Number(purchase.subTotal) || totalBaseAmount;
    pdf.text(formatCurrency(subTotal).replace('₹', ''), pageWidth - margin - 5, yPos, { align: 'right' });

    yPos += 2;
    pdf.line(margin, yPos, margin + contentWidth / 2, yPos);

    yPos += 4;
    pdf.setFont('helvetica', 'normal');

    Object.entries(gstBreakdown).forEach(([rate, values]) => {
      colX = margin;
      pdf.text(values.hsn || 'Various', colX + 2, yPos);
      colX += gstColWidths.hsn;
      pdf.text(rate, colX + 2, yPos);
      colX += gstColWidths.gstPercent;
      pdf.text(formatCurrency(values.amount).replace('₹', ''), colX + 2, yPos);
      colX += gstColWidths.amount;
      pdf.text(formatCurrency(values.cgst).replace('₹', ''), colX + 2, yPos);
      colX += gstColWidths.cgst;
      pdf.text(formatCurrency(values.sgst).replace('₹', ''), colX + 2, yPos);

      yPos += 5;
    });

    const taxSummaryY = gstTableTop + 6;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Tax Amount (+)', summaryX, taxSummaryY + 8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatCurrency(totalTaxAmount).replace('₹', ''), pageWidth - margin - 5, taxSummaryY + 8, { align: 'right' });

    const roundOff = Math.round(grandTotal) - grandTotal;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Round Off', summaryX, taxSummaryY + 14);
    pdf.setFont('helvetica', 'normal');
    pdf.text((roundOff >= 0 ? '+' : '-') + formatCurrency(Math.abs(roundOff)).replace('₹', ''), pageWidth - margin - 5, taxSummaryY + 14, { align: 'right' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('TOTAL AMOUNT', summaryX, taxSummaryY + 22);
    pdf.text(formatCurrency(Math.round(grandTotal)).replace('₹', ''), pageWidth - margin - 5, taxSummaryY + 22, { align: 'right' });

    yPos = Math.max(yPos, taxSummaryY + 30);

    yPos += 5;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    const amountInWords = `Amount (in words) : Rupees ${numberToWords(Math.round(grandTotal))} Only`;
    pdf.text(amountInWords, margin + 5, yPos);

    yPos += 10;
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('Terms / Declaration', margin + 5, yPos);

    yPos += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    const terms = [
      'Terms and conditions :',
      '1. Goods once sold cannot be taken back on any account.',
      '2. We reserve to ourselves the right to demand payment of this',
      '   bill at any time before due date.',
      '3. We are not responsible for breakage or damage in transit.',
      '4. Interest will be charged @ 24% if payment not made on due date.',
      '5. All payments should be made by A/c payee IMPS/NEFT/RTGS ONLY.',
      '6. 100% of payment before dispatch.'
    ];

    terms.forEach(term => {
      pdf.text(term, margin + 5, yPos);
      yPos += 3.5;
    });

    yPos += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text("Receiver's Signature", margin + 5, yPos);

    pdf.setFont('helvetica', 'bold');
    pdf.text(businessDetails.name, pageWidth - margin - 5, yPos - 10, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.text('Authorised Signatory', pageWidth - margin - 5, yPos, { align: 'right' });

    pdf.setFontSize(7);
    pdf.text(invoiceNo, margin + 5, pageHeight - margin - 3);
    pdf.text(`Page: ${currentPage} / ${totalPages}`, pageWidth / 2, pageHeight - margin - 3, { align: 'center' });
    // Add powered by text if dynamic branding name is available
    const appBrandName = 'POS'; // We may want to pass branding to this component later
    pdf.text(`Powered By ${appBrandName}`, pageWidth - margin - 5, pageHeight - margin - 3, { align: 'right' });

    return itemIndex;
  };

  const itemsPerPage = 15;
  totalPages = Math.ceil(items.length / itemsPerPage) || 1;

  let processedItems = 0;
  while (processedItems < items.length || currentPage === 1) {
    if (currentPage > 1) {
      pdf.addPage();
    }
    processedItems = drawPage(processedItems);
    currentPage++;

    if (processedItems >= items.length) break;
  }

  return pdf;
};

export const printGSTInvoice = (purchase: Purchase, businessDetails?: BusinessDetails) => {
  const pdf = generateGSTInvoicePDF(purchase, businessDetails);
  const invoiceNo = purchase.invoiceNumber || purchase.orderNumber || `GST_${purchase.id}`;
  pdf.save(`Invoice_${invoiceNo}.pdf`);
};

export const openGSTInvoicePrintPreview = (purchase: Purchase, businessDetails?: BusinessDetails) => {
  const pdf = generateGSTInvoicePDF(purchase, businessDetails);
  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};

export default { generateGSTInvoicePDF, printGSTInvoice, openGSTInvoicePrintPreview };
