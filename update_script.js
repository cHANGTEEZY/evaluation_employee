const fs = require('fs');
let code = fs.readFileSync('lib/pdf-generator.ts', 'utf8');
const oldFn = fs.readFileSync('/tmp/old_html.txt', 'utf8');

const newFn = `const generateReceiptHtml = (data: PaymentReceiptData): string => {
  const totalReceived = data.cashPayment + data.onlinePayment;

  return \`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1a1a1a; background: #ffffff; }
        .receipt-container { max-width: 800px; margin: 0 auto; position: relative; }
        
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bot        .header { display: flex; justify-content: space-between; align-items: flex-start; margi
                                         line-block;
          border-left: 5px solid #888;
          border-right: 5px solid #888;
          border-bottom: 5px solid #144eb9;
          padding: 5px 15px;
          margin-bottom: 15px;
        }
        .logo-vi {
          color: #144eb9;
          font-size: 50px;
          font-weight: 900;
          font-family: serif;
          letter-spacing: -2px;
          line-height: 1;
        }

        .header-right { width: 300px; text-align: right; }
        
        .logo-text { font-size: 28px; font-weight: bold; color: #003366; margin-bottom: 5px; }
        .company-info { font-size: 14px; color: #475569; line-height: 1.5; }
        
        .receipt-badge { background: #82b92b; color: #ffffff; font-size: 22px; font-weight: bold; padding: 12px 15px; text-align: left; }
        .date-badge { background: #eeeeee; color: #4b5563; font-size: 14px; padding: 8px 15px; text-align: left; }
        
        .recipient-section { margin-bottom: 40px; }
        .recipient-title { font-size: 12px; font-weight: bold; color: #1f2937; margin-bottom: 8px; text-transform: uppercase; }
        .client-name { font-size: 20px; font-weight: bold; color: #003366; margin-bottom: 5px; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
        th { background: #82b92b; color: white; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; }
        th.text-center, td.text-center { text-align: center; }
        th.text-right, td.text-right { text-align: right; }
        td { padding: 16px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #1f2937; }
        
        .footer { display: flex; justify-content: space-between; align-items: flex-start; }
        .thank-you { font-size: 14px; color: #4b5563; margin-top: 20px; }
        .totals-section { width: 350px; }
        .totals-title { font-size: 18px; font-weight: bold; color: #374151; margin-bottom: 15px; }
        
        .totals-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #4b5563; }
        .totals-row.total-received { font-weight: bold; color: #111827; font-size: 16px; border-bottom: none; }
        
        .powered-by { font-size: 11px; font-weight: bold; color: #6b7280; margin-top: 60px; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        
        <div class="header">
          <div class="header-left">
            <div class="logo-box">
              <div class="logo-vi">VI</div>
            </div>
            <h1 class="logo-text">Mr. Valuator</h1>
            <div class="company-info">
              Kathmandu, Nepal<br>
              info@valuator.com
            </div>
          </div>
          <div class="header-right">
            <div class="receipt-badge">Receipt for #\${data.refNo || "N/A"}</div>
            <div class="date-badge">Transaction Date: \${formatDate(data.valuationDate)}</div>
          </div>
        </div>

        <div class="recipient-section">
          <div class="recipient-title">RECIPIENT:</div>
          <div class="client-name">\${data.clientName}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>PRODUCT / SERVICE</th>
              <th>DESCRIPTION</th>
              <th class="text-center">QTY.</th>
              <th class="text-right">COST</th>
              <th class="text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Property Evaluation</td>
              <td>Valuation services provided</td>
              <td class="text-center">1</td>
              <td class="text-right">\${formatCurrency(data.siteCharge)}</td>
              <td class="text-right">\${formatCurrency(data.siteCharge)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <div class="thank-you">Thanks for your business!</div>
          <div class="totals-section">
            <div class="totals-title">Receipt for Payment</div>
            <div class="totals-row">
              <span>Subtotal</span>
              <span>\${formatCurrency(data.siteCharge)}</span>
            </div>
            <div class="totals-row">
              <span>Tax (0%)</span>
              <span>\${formatCurrency(0)}</span>
            </div>
            <div class="totals-row total-received" style="padding-bottom: 25px;">
              <span>Total</span>
              <span>\${formatCurrency(data.siteCharge)}</span>
            </div>
            
            <div class="totals-row" style="border-top: 1px solid #000; padding-top: 15px;">
              <span>Cash Payment</span>
              <span>\${formatCurrency(data.cashPayment)}</span>
            </div>
            <div class="totals-row">
              <span>Online Payment (\${getOnlinePaymentModeLabel(data.onlinePaymentMode)})</span>
              <span>\${formatCurrency(data.onlinePayment)}</span>
            </div>
            <div class="totals-row" style="font-weight: bold;">
              <span>Total Paid</span>
              <span>\${formatCurrency(totalReceived)}</span>
            </div>
            
            \${data.pendingDue > 0 ? \`
            <div class="totals-row" style="color: #991b1b; font-weight: bold; margin-top: 10px;">
              <span>Pending Due</span>
              <span>\${formatCurrency(data.pendingDue)}</span>
            </div>
            \` : \`\`}
          </div>
        </div>

        <div class="powered-by">
          POWERED BY <br>
          <span style="font-size: 16px; color: #144eb9;">MR. VALUATOR</span>
        </div>
        
      </div>
    </body>
    </html>
  \`;
};
`;

code = code.replace(oldFn, newFn);
fs.writeFileSync('lib/pdf-generator.ts', code);
