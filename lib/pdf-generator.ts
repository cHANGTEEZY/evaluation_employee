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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          padding: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2196F3;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2196F3;
          font-size: 28px;
          margin-bottom: 8px;
        }
        .header p {
          color: #666;
          font-size: 14px;
        }
        .receipt-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        .receipt-info div {
          text-align: left;
        }
        .receipt-info label {
          font-size: 12px;
          color: #666;
          display: block;
          margin-bottom: 4px;
        }
        .receipt-info span {
          font-size: 16px;
          font-weight: 600;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .table th, .table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .table th {
          background: #f5f5f5;
          font-weight: 600;
          color: #666;
        }
        .table td {
          font-size: 15px;
        }
        .table .amount {
          text-align: right;
          font-weight: 500;
        }
        .table .total-row {
          background: #e3f2fd;
          font-weight: 700;
        }
        .table .total-row td {
          font-size: 16px;
          color: #1976D2;
        }
        .table .due-row {
          background: #ffebee;
        }
        .table .due-row td {
          color: #c62828;
          font-weight: 600;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
        .stamp {
          margin: 30px auto;
          width: 80px;
          height: 80px;
          border: 2px solid #4CAF50;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4CAF50;
          font-weight: bold;
          font-size: 12px;
          text-align: center;
        }
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
        }
        .signature-box {
          text-align: center;
          width: 40%;
        }
        .signature-line {
          border-top: 1px solid #333;
          padding-top: 8px;
          margin-top: 50px;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PAYMENT RECEIPT</h1>
        <p>Property Valuation Service</p>
      </div>

      <div class="receipt-info">
        <div>
          <label>Reference No.</label>
          <span>${data.refNo || "N/A"}</span>
        </div>
        <div>
          <label>Client Name</label>
          <span>${data.clientName || "N/A"}</span>
        </div>
        <div>
          <label>Date</label>
          <span>${formatDate(data.valuationDate)}</span>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Site Charge (Total)</td>
            <td class="amount">${formatCurrency(data.siteCharge)}</td>
          </tr>
          <tr>
            <td colspan="2" style="height: 10px; background: transparent;"></td>
          </tr>
          <tr>
            <td>Cash Payment</td>
            <td class="amount">${formatCurrency(data.cashPayment)}</td>
          </tr>
          <tr>
            <td>Online Payment ${
              data.onlinePayment > 0
                ? `(${getOnlinePaymentModeLabel(data.onlinePaymentMode)})`
                : ""
            }</td>
            <td class="amount">${formatCurrency(data.onlinePayment)}</td>
          </tr>
          <tr class="total-row">
            <td>Total Received</td>
            <td class="amount">${formatCurrency(totalReceived)}</td>
          </tr>
          ${
            data.pendingDue > 0
              ? `
          <tr class="due-row">
            <td>Pending Due</td>
            <td class="amount">${formatCurrency(data.pendingDue)}</td>
          </tr>
          `
              : ""
          }
        </tbody>
      </table>

      <div class="stamp">PAID</div>


      <div class="footer">
        <p>This is a computer-generated receipt.</p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
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
