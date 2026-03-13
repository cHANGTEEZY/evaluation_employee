import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Asset } from "expo-asset";
import { insertPayment, updatePaymentReceipt } from "./schema";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const APP_ICON_MODULE = require("../assets/images/app_icon.jpeg");

let cachedLogoBase64: string | null = null;

async function getLogoBase64(): Promise<string> {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const asset = Asset.fromModule(APP_ICON_MODULE);
    await asset.downloadAsync();
    const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
      encoding: FileSystem.EncodingType.Base64,
    });
    cachedLogoBase64 = `data:image/jpeg;base64,${base64}`;
    return cachedLogoBase64;
  } catch (e) {
    console.warn("[pdf-generator] Failed to load logo:", e);
    return "";
  }
}

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

const formatDateTime = (date: Date): string => {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPaymentMethodLabel = (data: PaymentReceiptData): string => {
  const methods: string[] = [];
  if (data.cashPayment > 0) methods.push("Cash");
  if (data.onlinePayment > 0) {
    const mode = getOnlinePaymentModeLabel(data.onlinePaymentMode);
    methods.push(mode !== "N/A" ? mode : "Online");
  }
  return methods.length > 0 ? methods.join(" + ") : "N/A";
};

const generateReceiptHtml = async (
  data: PaymentReceiptData,
): Promise<string> => {
  const totalReceived = data.cashPayment + data.onlinePayment;
  const logoDataUri = await getLogoBase64();

  const logoImg = logoDataUri
    ? `<img src="${logoDataUri}" class="logo-img" alt="Mr. Valuator" />`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #222;
      background: #fff;
      padding: 32px 36px;
    }

    /* ── Brand header ─────────────────────────────── */
    .brand-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 18px;
      border-bottom: 3px solid #2B579A;
      margin-bottom: 6px;
    }
    .brand-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-img {
      width: 64px;
      height: 64px;
      border-radius: 10px;
      object-fit: contain;
    }
    .brand-name {
      font-size: 28px;
      font-weight: 800;
      color: #2B579A;
      letter-spacing: 1px;
    }
    .brand-tagline {
      font-size: 11px;
      color: #666;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }

    /* ── Receipt title ────────────────────────────── */
    .receipt-title {
      font-size: 36px;
      font-weight: 800;
      color: #2B579A;
      margin: 22px 0 18px 0;
      letter-spacing: 2px;
    }

    /* ── Meta row (Receipt No / Date / Payment) ──── */
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 22px;
    }
    .meta-table th {
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 10px 4px;
      border-bottom: 1px solid #ddd;
    }
    .meta-table td {
      padding: 6px 10px 10px;
      font-size: 14px;
      font-weight: 500;
      color: #222;
      border-bottom: 1px solid #eee;
    }

    /* ── Client section ───────────────────────────── */
    .client-section {
      display: flex;
      gap: 40px;
      margin-bottom: 26px;
    }
    .client-block {
      flex: 1;
    }
    .client-block-title {
      font-size: 13px;
      font-weight: 700;
      color: #2B579A;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .client-block p {
      font-size: 13px;
      color: #333;
      line-height: 1.6;
      margin: 0;
    }

    /* ── Line-items table ─────────────────────────── */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
    }
    .items-table thead th {
      background: #2B579A;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      text-align: left;
    }
    .items-table thead th:not(:first-child) {
      text-align: right;
    }
    .items-table tbody td {
      padding: 11px 12px;
      font-size: 13px;
      color: #333;
      border-bottom: 1px solid #e8e8e8;
    }
    .items-table tbody td:not(:first-child) {
      text-align: right;
    }
    .items-table tbody tr.empty-row td {
      height: 28px;
      border-bottom: 1px solid #e8e8e8;
    }

    /* ── Summary block ────────────────────────────── */
    .summary-wrapper {
      display: flex;
      justify-content: space-between;
      margin-top: 0;
      border-top: 2px solid #2B579A;
    }
    .notes-block {
      flex: 1;
      padding: 14px 12px;
    }
    .notes-label {
      font-size: 12px;
      font-weight: 700;
      color: #333;
      margin-bottom: 6px;
    }
    .notes-text {
      font-size: 11px;
      color: #666;
      line-height: 1.5;
    }
    .summary-table {
      border-collapse: collapse;
      min-width: 280px;
    }
    .summary-table td {
      padding: 8px 14px;
      font-size: 13px;
      border-bottom: 1px solid #e8e8e8;
    }
    .summary-table td:first-child {
      color: #555;
      font-weight: 500;
      text-align: right;
    }
    .summary-table td:last-child {
      font-weight: 600;
      color: #222;
      text-align: right;
      min-width: 100px;
    }
    .summary-table tr.total-row td {
      font-size: 15px;
      font-weight: 800;
      color: #2B579A;
      border-top: 2px solid #2B579A;
      border-bottom: 2px solid #2B579A;
      padding: 12px 14px;
      background: #EDF2FA;
    }
    .summary-table tr.due-row td {
      color: #b91c1c;
      font-weight: 700;
      background: #fef2f2;
    }

    /* ── Signature section ────────────────────────── */
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
      padding-top: 0;
    }
    .sig-block {
      text-align: center;
      width: 200px;
    }
    .sig-line {
      border-top: 1px solid #333;
      margin-bottom: 6px;
    }
    .sig-label {
      font-size: 12px;
      font-weight: 700;
      color: #333;
    }

    /* ── Footer ───────────────────────────────────── */
    .footer-bar {
      text-align: center;
      margin-top: 36px;
      padding-top: 16px;
      border-top: 3px solid #2B579A;
    }
    .footer-thanks {
      font-size: 15px;
      font-weight: 800;
      color: #2B579A;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .footer-note {
      font-size: 10px;
      color: #888;
      line-height: 1.5;
    }
  </style>
</head>
<body>

  <!-- Brand header -->
  <div class="brand-header">
    <div class="brand-left">
      ${logoImg}
      <div>
        <div class="brand-name">MR. VALUATOR</div>
        <div class="brand-tagline">Professional Property Valuation Services</div>
      </div>
    </div>
  </div>

  <!-- Receipt title -->
  <div class="receipt-title">RECEIPT</div>

  <!-- Meta row -->
  <table class="meta-table">
    <thead>
      <tr>
        <th>Receipt Number</th>
        <th>Receipt Date</th>
        <th>Payment Method</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${data.refNo || "N/A"}</td>
        <td>${formatDateTime(data.valuationDate)}</td>
        <td>${getPaymentMethodLabel(data)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Client -->
  <div class="client-section">
    <div class="client-block">
      <div class="client-block-title">Client</div>
      <p>${data.clientName || "N/A"}</p>
    </div>
  </div>

  <!-- Line items -->
  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Property Valuation &mdash; Site Charge</td>
        <td>1</td>
        <td>${formatCurrency(data.siteCharge)}</td>
        <td>${formatCurrency(data.siteCharge)}</td>
      </tr>
      <tr class="empty-row"><td></td><td></td><td></td><td></td></tr>
      <tr class="empty-row"><td></td><td></td><td></td><td></td></tr>
      <tr class="empty-row"><td></td><td></td><td></td><td></td></tr>
    </tbody>
  </table>

  <!-- Summary -->
  <div class="summary-wrapper">
    <div class="notes-block">
      <div class="notes-label">Notes</div>
      <div class="notes-text">
        ${data.pendingDue > 0 ? "Partial payment received. Remaining balance is due upon completion of valuation report." : "Full payment received. Thank you."}
      </div>
    </div>
    <table class="summary-table">
      <tbody>
        <tr>
          <td>Subtotal</td>
          <td>${formatCurrency(data.siteCharge)}</td>
        </tr>
        ${data.cashPayment > 0 ? `<tr><td>Cash Received</td><td>${formatCurrency(data.cashPayment)}</td></tr>` : ""}
        ${data.onlinePayment > 0 ? `<tr><td>Online (${getOnlinePaymentModeLabel(data.onlinePaymentMode)})</td><td>${formatCurrency(data.onlinePayment)}</td></tr>` : ""}
        <tr class="total-row">
          <td>Total Received</td>
          <td>${formatCurrency(totalReceived)}</td>
        </tr>
        ${data.pendingDue > 0 ? `<tr class="due-row"><td>Pending Due</td><td>${formatCurrency(data.pendingDue)}</td></tr>` : ""}
      </tbody>
    </table>
  </div>

  <!-- Signature -->
  <div class="signature-section">
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Salesperson</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Signature</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer-bar">
    <div class="footer-thanks">THANK YOU FOR THE PAYMENT!</div>
    <div class="footer-note">
      This is a computer-generated receipt. Generated on ${formatDateTime(new Date())}.<br/>
      For queries: support@mrvaluator.com &nbsp;|&nbsp; +977-XXXX-XXXX
    </div>
  </div>

</body>
</html>`;
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
    const html = await generateReceiptHtml(data);

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
