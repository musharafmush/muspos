
export const generateA4InvoiceHTML = (sale: any, settings: any) => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    const safeData = {
        billNumber: sale?.billNumber || sale?.orderNumber || `INV/${year}/${Math.floor(Math.random() * 10000)}`,
        billDate: sale?.billDate || formattedDate,
        customer: {
            name: sale?.customer?.name || sale?.customerDetails?.name || sale?.customerName || '',
            address: sale?.customer?.address || sale?.customerDetails?.address || sale?.customerAddress || '',
            phone: sale?.customer?.phone || sale?.customerDetails?.phone || sale?.customerPhone || '',
        },
        items: Array.isArray(sale?.items) && sale.items.length > 0 ? sale.items.map((item: any, index: number) => ({
            sNo: index + 1,
            description: item?.productName || item?.name || 'Item',
            hsn: item?.hsn || item?.category?.hsn || '',
            quantity: Number(item?.quantity ?? 1),
            rate: Number(item?.unitPrice ?? item?.price ?? 0).toFixed(2),
            amount: (Number(item?.quantity ?? 1) * Number(item?.unitPrice ?? item?.price ?? 0)).toFixed(2), // Total Amount
            pis: item?.pis || ''
        })) : [],
        totalAmount: Number(sale?.total || sale?.grandTotal || 0).toFixed(2)
    };

    const totalWithTax = Number(safeData.totalAmount).toFixed(2);

    // Generate up to 20 rows specifically as shown in the image format
    const tableRows = [];
    const maxRows = safeData.items.length > 0 ? safeData.items.length : 1; 
    
    // We only render actual items now, rather than 20 empty rows, for a cleaner minimalist look
    for (let i = 0; i < maxRows; i++) {
        const item = safeData.items[i];
        if (item) {
            tableRows.push(`
                <tr style="border-bottom: 1px solid #eaeaea;">
                    <td style="padding: 12px 10px; color: #666; font-size: 13px;">${item.sNo}</td>
                    <td style="padding: 12px 10px; font-weight: 500; color: #111; font-size: 13px;">${item.description}</td>
                    <td style="text-align: center; padding: 12px 10px; color: #444; font-size: 13px;">${item.hsn || '-'}</td>
                    <td style="text-align: center; padding: 12px 10px; font-weight: 600; color: #111; font-size: 13px;">${item.quantity}</td>
                    <td style="text-align: right; padding: 12px 10px; color: #444; font-size: 13px;">${settings?.currencySymbol || '₹'}${item.rate}</td>
                    <td style="text-align: right; padding: 12px 10px; font-weight: 600; color: #111; font-size: 13px;">${settings?.currencySymbol || '₹'}${item.amount}</td>
                </tr>
            `);
        }
    }

    return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      
      .invoice-container {
        font-family: 'Plus Jakarta Sans', sans-serif;
        padding: 40px 50px;
        max-width: 210mm;
        margin: 20px auto;
        color: #111;
        background: #fff;
        box-sizing: border-box;
        box-shadow: 0 10px 40px rgba(0,0,0,0.08);
        border-radius: 12px;
        border-top: 8px solid #000;
      }

      .text-muted { color: #666; }
      .text-primary { color: #111; }
      
      .modern-table th {
        background: #fafafa;
        color: #666;
        font-weight: 600;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 14px 10px;
        border-bottom: 2px solid #eaeaea;
        border-top: 1px solid #eaeaea;
      }
      
      @media print {
        @page { margin: 0; size: A4; }
        body { margin: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .invoice-container { 
          padding: 15mm; 
          margin: 0; 
          box-shadow: none; 
          border-radius: 0; 
          border-top: 12px solid #000;
        }
      }
    </style>

    <div class="invoice-container">
      
      <!-- Top Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 50px;">
        <div>
          <h1 style="margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -1px; color: #000;">RS AGENCY</h1>
          <div style="font-size: 13px; color: #666; margin-top: 4px; font-weight: 500;">Modern Retail Solutions</div>
          <div style="padding-top: 15px; font-size: 12px; color: #666; line-height: 1.6;">
            29/13,14A Govindan Nagar, Nachimalai<br>
            Outer Ringroad, Tiruvannamalai - 606611<br>
            <strong>GSTIN:</strong> 33BGXPA9211M1Z2<br>
            <strong>Phone:</strong> 80729 88861 / 98945 55386
          </div>
        </div>
        
        <div style="text-align: right;">
          <div style="font-size: 42px; font-weight: 800; color: #eaeaea; letter-spacing: -1px; text-transform: uppercase; margin-bottom: 10px;">INVOICE</div>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${safeData.billNumber}" style="width: 80px; height: 80px; border-radius: 4px; mix-blend-mode: multiply;" alt="QR Code" />
        </div>
      </div>

      <!-- Two-Column Meta Section -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px; padding: 25px 30px; background: #fafafa; border-radius: 8px;">
        <!-- Bill To -->
        <div style="flex: 1;">
           <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; font-weight: 700; margin-bottom: 10px;">Billed To</div>
           ${safeData.customer.name ? `<div style="font-weight: 700; font-size: 18px; color: #111; margin-bottom: 5px;">${safeData.customer.name}</div>` : '<div style="font-style: italic; color: #888;">Walk-in Customer</div>'}
           ${safeData.customer.address ? `<div style="font-size: 13px; color: #666; line-height: 1.5; margin-bottom: 5px;">${safeData.customer.address.replace(/\\n/g, '<br/>')}</div>` : ''}
           ${safeData.customer.phone ? `<div style="font-size: 13px; font-weight: 500; color: #111;">${safeData.customer.phone}</div>` : ''}
        </div>
        
        <!-- Invoice Details -->
        <div style="flex: 1; text-align: right;">
           <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; font-weight: 700; margin-bottom: 10px;">Invoice Details</div>
           <div style="margin-bottom: 8px;">
              <span style="font-size: 13px; color: #666; margin-right: 15px;">Invoice Number</span>
              <span style="font-size: 14px; font-weight: 700;">#${safeData.billNumber}</span>
           </div>
           <div>
              <span style="font-size: 13px; color: #666; margin-right: 15px;">Date of Issue</span>
              <span style="font-size: 14px; font-weight: 700;">${safeData.billDate}</span>
           </div>
        </div>
      </div>

      <!-- Clean Items Table -->
      <div style="margin-bottom: 40px;">
        <table style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
          <thead class="modern-table">
            <tr>
              <th style="text-align: left; width: 40px; border-top-left-radius: 6px; border-bottom-left-radius: 6px;">#</th>
              <th style="text-align: left;">Item Description</th>
              <th style="text-align: center; width: 80px;">HSN</th>
              <th style="text-align: center; width: 80px;">Qty</th>
              <th style="text-align: right; width: 100px;">Rate</th>
              <th style="text-align: right; width: 120px; border-top-right-radius: 6px; border-bottom-right-radius: 6px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows.join('')}
          </tbody>
        </table>
      </div>

      <!-- Modern Footer Grid (Banking & Summary) -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 30px;">
         
         <!-- Left side: Banking -->
         <div style="width: 50%;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; font-weight: 700; margin-bottom: 12px;">Payment Details</div>
            <div style="font-size: 13px; color: #444; line-height: 1.8;">
              <div style="display: flex; justify-content: space-between; max-width: 250px;">
                <span style="color: #888;">Bank</span>
                <span style="font-weight: 600; color: #111;">State Bank of India</span>
              </div>
              <div style="display: flex; justify-content: space-between; max-width: 250px;">
                <span style="color: #888;">Account No</span>
                <span style="font-weight: 600; color: #111; font-family: monospace; font-size: 14px;">44708101861</span>
              </div>
              <div style="display: flex; justify-content: space-between; max-width: 250px;">
                <span style="color: #888;">IFSC Code</span>
                <span style="font-weight: 600; color: #111;">SBIN0014622</span>
              </div>
            </div>
         </div>
         
         <!-- Right side: Calculation Card -->
         <div style="width: 320px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding: 0 10px;">
               <span style="font-size: 14px; color: #666;">Subtotal</span>
               <span style="font-size: 14px; font-weight: 600; color: #111;">${settings?.currencySymbol || '₹'}${safeData.totalAmount}</span>
            </div>
            
            <div style="background: #000; color: #fff; padding: 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
               <div>
                 <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; margin-bottom: 4px;">Grand Total</div>
                 <div style="font-size: 10px; opacity: 0.6; font-style: italic;">Thank you for your business!</div>
               </div>
               <span style="font-size: 24px; font-weight: 800;">${settings?.currencySymbol || '₹'}${totalWithTax}</span>
            </div>
         </div>
      </div>

      <!-- Signatures Component -->
      <div style="margin-top: 80px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 30px; border-top: 1px solid #eaeaea;">
         <div>
            <div style="width: 150px; border-bottom: 2px solid #eaeaea; margin-bottom: 10px;"></div>
            <div style="font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Customer Signature</div>
         </div>
         <div style="text-align: right; position: relative;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Signature_of_John_Hancock.svg" style="height: 40px; position: absolute; right: 0; bottom: 30px; opacity: 0.8;" alt="Signature" />
            <div style="font-size: 14px; font-weight: 800; color: #111; margin-bottom: 5px;">RS AGENCY</div>
            <div style="font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Authorized Signatory</div>
         </div>
      </div>

    </div>
  `;
};
