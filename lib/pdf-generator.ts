import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { insertPayment, updatePaymentReceipt } from "./schema";

export interface PaymentReceiptData {
  refNo: string;
  clientName: string;
  valuationDate: Date;
  siteCharge: number;
  cashPayment: number;
  onlinePayment: number;
  onlinePaymentMode?: string;
  pendingDue: number;
}

const getOnlinePaymentModeLabel = (mode?: string): string => {
  switch (mode) {
    case "esewa":
      return "eSewa";
    case "khalti":
      return "Khalti";
    case "bank_transfer":
      return "Bank Transfer";
    case "fonepay":
      return "FonePay";
    case "other":
      return "Other";
    default:
      return "N/A";
  }
};

const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString("en-NP")}`;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-NP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const generateReceiptHtml = (data: PaymentReceiptData): string => {
  const totalReceived = data.cashPayment + data.onlinePayment;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          padding: 40px;
          color: #1a1a1a;
          background: #ffffff;
        }
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          position: relative;
        }
        .logo-section {
          margin-bottom: 20px;
        }
        .logo-text {
          font-size: 42px;
          font-weight: 900;
          letter-spacing: 2px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
          margin-bottom: 5px;
        }
        .logo-icon {
          font-size: 50px;
          margin-bottom: 10px;
        }
        .header-subtitle {
          font-size: 16px;
          font-weight: 300;
          letter-spacing: 1px;
          opacity: 0.95;
          margin-top: 8px;
        }
        .receipt-title {
          font-size: 24px;
          font-weight: 600;
          margin-top: 20px;
          letter-spacing: 3px;
          border-top: 2px solid rgba(255,255,255,0.3);
          padding-top: 15px;
        }
        .content {
          padding: 30px;
        }
        .receipt-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }
        .meta-item {
          text-align: left;
        }
        .meta-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
          font-weight: 600;
        }
        .meta-value {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
        }
        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e3a8a;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 30px 0 15px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .table tr {
          border-bottom: 1px solid #e2e8f0;
        }
        .table td {
          padding: 16px 12px;
          font-size: 15px;
        }
        .table td:first-child {
          color: #475569;
          font-weight: 500;
        }
        .table td:last-child {
          text-align: right;
          font-weight: 600;
          color: #1e293b;
        }
        .table .spacer-row {
          height: 8px;
          background: transparent;
          border: none;
        }
        .table .highlight-row {
          background: #f1f5f9;
          font-weight: 600;
        }
        .table .total-row {
          background: #dbeafe;
          border-top: 2px solid #3b82f6;
          border-bottom: 2px solid #3b82f6;
        }
        .table .total-row td {
          padding: 18px 12px;
          font-size: 18px;
          font-weight: 700;
          color: #1e3a8a;
        }
        .table .due-row {
          background: #fee2e2;
          border-left: 4px solid #dc2626;
        }
        .table .due-row td {
          color: #991b1b;
          font-weight: 700;
          font-size: 16px;
        }
        .payment-badge {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          margin: 25px auto;
          text-align: center;
        }
        .status-section {
          text-align: center;
          padding: 20px;
          margin: 20px 0;
        }
        .stamp {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 120px;
          height: 120px;
          border: 4px solid #10b981;
          border-radius: 50%;
          color: #10b981;
          font-weight: 900;
          font-size: 22px;
          letter-spacing: 2px;
          transform: rotate(-15deg);
          margin: 10px auto;
        }
        .footer {
          background: #f8fafc;
          padding: 25px 30px;
          text-align: center;
          border-top: 2px solid #e2e8f0;
        }
        .footer-text {
          color: #64748b;
          font-size: 11px;
          line-height: 1.6;
          margin-bottom: 8px;
        }
        .footer-contact {
          color: #475569;
          font-size: 12px;
          font-weight: 600;
          margin-top: 15px;
        }
        .thank-you {
          font-size: 16px;
          font-weight: 600;
          color: #1e3a8a;
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="logo-section">
            <div class="logo-icon">🏛️</div>
            <div class="logo-text">MR. VALUATOR</div>
            <div class="header-subtitle">Professional Property Valuation Services</div>
          </div>
          <div class="receipt-title">PAYMENT RECEIPT</div>
        </div>

        <div class="content">
          <div class="receipt-meta">
            <div class="meta-item">
              <div class="meta-label">Receipt No.</div>
              <div class="meta-value">${data.refNo || "N/A"}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Client Name</div>
              <div class="meta-value">${data.clientName || "N/A"}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Date</div>
              <div class="meta-value">${formatDate(data.valuationDate)}</div>
            </div>
          </div>

          <div class="section-title">Payment Details</div>
          
          <table class="table">
            <tbody>
              <tr>
                <td>Site Charge (Total)</td>
                <td>${formatCurrency(data.siteCharge)}</td>
              </tr>
              <tr class="spacer-row">
                <td colspan="2"></td>
              </tr>
              <tr class="highlight-row">
                <td>💵 Cash Payment</td>
                <td>${formatCurrency(data.cashPayment)}</td>
              </tr>
              <tr class="highlight-row">
                <td>💳 Online Payment ${
                  data.onlinePayment > 0
                    ? `(${getOnlinePaymentModeLabel(data.onlinePaymentMode)})`
                    : ""
                }</td>
                <td>${formatCurrency(data.onlinePayment)}</td>
              </tr>
              <tr class="total-row">
                <td>Total Amount Received</td>
                <td>${formatCurrency(totalReceived)}</td>
              </tr>
              ${
                data.pendingDue > 0
                  ? `
              <tr class="due-row">
                <td>⚠️ Pending Due</td>
                <td>${formatCurrency(data.pendingDue)}</td>
              </tr>
              `
                  : ""
              }
            </tbody>
          </table>

          <div class="status-section">
            <div class="stamp">PAID</div>
            <div class="payment-badge">✓ PAYMENT CONFIRMED</div>
          </div>
        </div>

        <div class="footer">
          <div class="thank-you">Thank you for choosing Mr. Valuator!</div>
          <div class="footer-text">
            This is a computer-generated receipt and does not require a signature.
          </div>
          <div class="footer-text">
            Generated on: ${new Date().toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div class="footer-contact">
            For queries, please contact: support@mrvaluator.com | +977-XXXX-XXXX
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate a PDF receipt for the payment and save it to the payments folder.
 * When existingPaymentId is provided (e.g. when updating a valuation), updates
 * that payment row instead of inserting a new one.
 * @param valuationId - The valuation ID to associate the payment with
 * @param data - The payment receipt data
 * @param existingPaymentId - If provided, update this payment's pdf_uri/file_name instead of inserting
 * @returns The PDF file URI
 */
export async function generatePaymentReceipt(
  valuationId: string,
  data: PaymentReceiptData,
  existingPaymentId?: string,
): Promise<string> {
  try {
    // Generate HTML content
    const html = generateReceiptHtml(data);

    // Generate PDF using expo-print
    const { uri: tempUri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Create a filename for the record
    const rawRef = data.refNo || valuationId;
    const safeRef = rawRef.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `receipt_${safeRef}_${Date.now()}.pdf`;

    // Save to app's persistent "receipts" folder (app files – visible when you open Edit and tap the receipt icon).
    if (!FileSystem.documentDirectory) {
      throw new Error("FileSystem.documentDirectory is null");
    }
    const baseDir = FileSystem.documentDirectory;
    const receiptsDir = baseDir.endsWith("/")
      ? `${baseDir}receipts/`
      : `${baseDir}/receipts/`;

    // Ensure directory exists - blindly create with intermediates: true
    try {
      await FileSystem.makeDirectoryAsync(receiptsDir, { intermediates: true });
    } catch (e) {
      // Ignore error if directory already exists
      console.log("Directory creation warning:", e);
    }

    // Full file URI so the PDF can be opened and viewed when editing
    const pdfUri = `${receiptsDir}${fileName}`;

    try {
      await FileSystem.moveAsync({
        from: tempUri,
        to: pdfUri,
      });
    } catch (e) {
      console.log("Move failed, attempting copy...", e);
      await FileSystem.copyAsync({
        from: tempUri,
        to: pdfUri,
      });
    }

    // Insert or update payment record in database with the PDF URI
    if (existingPaymentId) {
      await updatePaymentReceipt(existingPaymentId, pdfUri, fileName);
    } else {
      await insertPayment(valuationId, pdfUri, fileName);
    }

    return pdfUri;
  } catch (error) {
    console.error("Error generating PDF receipt:", error);
    throw error;
  }
}

/**
 * Check if a receipt PDF file exists at the given URI (e.g. after app restart or when opening in edit mode).
 */
export async function receiptFileExists(pdfUri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(pdfUri, { size: false });
    return info.exists === true;
  } catch {
    return false;
  }
}

/**
 * Share / open the PDF receipt (opens system viewer or share sheet; user can choose "Save to Files" to save a copy).
 */
export async function sharePaymentReceipt(pdfUri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(pdfUri, {
      mimeType: "application/pdf",
      dialogTitle: "Payment Receipt – Open or Save to Files",
    });
  } else {
    throw new Error("Sharing is not available on this device");
  }
}
