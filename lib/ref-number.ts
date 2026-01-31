/**
 * Generate Reference Number Utility
 *
 * Format: FirstLetterFirstName-FirstLetterLastName/FiscalYear/SerialNumber
 * Example: AJ/082/83/001 (for Ajay with fiscal year 082/83, first valuation)
 *
 * Nepal Fiscal Year: Mid-July to Mid-July (e.g., 2025/2026 = 082/83)
 */

/**
 * Get current Nepal fiscal year in format "082/83"
 * Fiscal year starts in mid-July (Shrawan)
 */
export function getCurrentFiscalYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (0 = Jan, 6 = July)

  // Nepal fiscal year starts mid-July
  // If we're before mid-July, we're in the previous fiscal year
  let fiscalYearStart: number;
  if (currentMonth < 6) {
    // Before July - we're in fiscal year that started previous year
    fiscalYearStart = currentYear - 1;
  } else if (currentMonth === 6 && now.getDate() < 16) {
    // Early July (before mid-July)
    fiscalYearStart = currentYear - 1;
  } else {
    // Mid-July onwards
    fiscalYearStart = currentYear;
  }

  // Convert to Nepali BS year (add 56-57 years)
  // 2024 AD ≈ 2081 BS
  const bsFiscalStart = fiscalYearStart + 57;
  const bsFiscalEnd = bsFiscalStart + 1;

  // Format as "082/83" (last 2 digits of each year with leading zeros)
  const startStr = String(bsFiscalStart).slice(-3).padStart(3, "0"); // e.g., "082"
  const endStr = String(bsFiscalEnd).slice(-2).padStart(2, "0"); // e.g., "83"

  return `${startStr}/${endStr}`;
}

/**
 * Extract initials from a full name
 * Example: "Ajay Kumar Sharma" => "AK"
 * Example: "Ram Bahadur" => "RB"
 * Example: "SingleName" => "S"
 */
export function getNameInitials(fullName: string): string {
  if (!fullName || typeof fullName !== "string") {
    return "XX";
  }

  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

  if (nameParts.length === 0) {
    return "XX";
  }

  if (nameParts.length === 1) {
    // Single name - use first letter twice or just first letter
    return nameParts[0].charAt(0).toUpperCase();
  }

  // Get first letter of first name and first letter of last name
  const firstNameInitial = nameParts[0].charAt(0).toUpperCase();
  const lastNameInitial = nameParts[nameParts.length - 1]
    .charAt(0)
    .toUpperCase();

  return `${firstNameInitial}${lastNameInitial}`;
}

/**
 * Format serial number with padding
 * Example: 1 => "001", 42 => "042", 999 => "999"
 */
export function formatSerialNumber(
  serial: number,
  padding: number = 3,
): string {
  return String(serial).padStart(padding, "0");
}

/**
 * Generate full reference number
 *
 * @param userName - Full name of the user (e.g., "Ajay Sharma")
 * @param serialNumber - The valuation count/serial for this fiscal year
 * @returns Reference number like "AS/082/83/001"
 */
export function generateRefNumber(
  userName: string,
  serialNumber: number,
): string {
  const initials = getNameInitials(userName);
  const fiscalYear = getCurrentFiscalYear();
  const serial = formatSerialNumber(serialNumber);

  return `${initials}/${fiscalYear}/${serial}`;
}

/**
 * Parse an existing ref number to extract components
 */
export function parseRefNumber(refNo: string): {
  initials: string;
  fiscalYear: string;
  serialNumber: number;
} | null {
  if (!refNo) return null;

  // Expected format: XX/YYY/YY/NNN
  const parts = refNo.split("/");

  if (parts.length !== 4) return null;

  return {
    initials: parts[0],
    fiscalYear: `${parts[1]}/${parts[2]}`,
    serialNumber: parseInt(parts[3], 10) || 0,
  };
}

// ===== Client Ref No: ClientName_First3letter_district_PlotNo =====

/**
 * Sanitize a string for use in ref no / folder name: remove spaces and special chars, use underscores.
 */
export function sanitizeForRefNo(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
}

/**
 * Get first three letters of district (e.g. "Kathmandu" => "Kat").
 */
export function getDistrictPrefix(district: string): string {
  if (!district || typeof district !== "string") return "XXX";
  const cleaned = district.trim().replace(/[^a-zA-Z]/g, "");
  if (!cleaned) return "XXX";
  return cleaned.slice(0, 3).toUpperCase();
}

/**
 * Generate base client ref number: ClientName_First3letter_district_PlotNo
 * Example: RamBahadurSharma_Kat_45
 */
export function generateClientRefNumber(
  clientName: string,
  district: string,
  plotNo: string,
): string {
  const client = sanitizeForRefNo(clientName) || "Unknown";
  const dist = getDistrictPrefix(district);
  const plot = sanitizeForRefNo(String(plotNo ?? "")) || "0";
  return `${client}_${dist}_${plot}`;
}
