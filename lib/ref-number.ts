export function getCurrentFiscalYear(): string {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    let fiscalYearStart: number;
    if (currentMonth < 6) {
        fiscalYearStart = currentYear - 1;
    }
    else if (currentMonth === 6 && now.getDate() < 16) {
        fiscalYearStart = currentYear - 1;
    }
    else {
        fiscalYearStart = currentYear;
    }
    const bsFiscalStart = fiscalYearStart + 57;
    const bsFiscalEnd = bsFiscalStart + 1;
    const startStr = String(bsFiscalStart).slice(-3).padStart(3, "0");
    const endStr = String(bsFiscalEnd).slice(-2).padStart(2, "0");
    return `${startStr}/${endStr}`;
}
export function getNameInitials(fullName: string): string {
    if (!fullName || typeof fullName !== "string") {
        return "XX";
    }
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length === 0) {
        return "XX";
    }
    if (nameParts.length === 1) {
        return nameParts[0].charAt(0).toUpperCase();
    }
    const firstNameInitial = nameParts[0].charAt(0).toUpperCase();
    const lastNameInitial = nameParts[nameParts.length - 1]
        .charAt(0)
        .toUpperCase();
    return `${firstNameInitial}${lastNameInitial}`;
}
export function formatSerialNumber(serial: number, padding: number = 3): string {
    return String(serial).padStart(padding, "0");
}
export function generateRefNumber(userName: string, serialNumber: number): string {
    const initials = getNameInitials(userName);
    const fiscalYear = getCurrentFiscalYear();
    const serial = formatSerialNumber(serialNumber);
    return `${initials}/${fiscalYear}/${serial}`;
}
export function parseRefNumber(refNo: string): {
    initials: string;
    fiscalYear: string;
    serialNumber: number;
} | null {
    if (!refNo)
        return null;
    const parts = refNo.split("/");
    if (parts.length !== 4)
        return null;
    return {
        initials: parts[0],
        fiscalYear: `${parts[1]}/${parts[2]}`,
        serialNumber: parseInt(parts[3], 10) || 0,
    };
}
export function sanitizeForRefNo(str: string): string {
    if (!str || typeof str !== "string")
        return "";
    return str
        .trim()
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 80);
}
export function getDistrictPrefix(district: string): string {
    if (!district || typeof district !== "string")
        return "XXX";
    const cleaned = district.trim().replace(/[^a-zA-Z]/g, "");
    if (!cleaned)
        return "XXX";
    return cleaned.slice(0, 3).toUpperCase();
}
export function generateClientRefNumber(clientName: string, district: string, plotNo: string): string {
    const client = sanitizeForRefNo(clientName) || "Unknown";
    const dist = getDistrictPrefix(district);
    const plot = sanitizeForRefNo(String(plotNo ?? "")) || "0";
    return `${client}_${dist}_${plot}`;
}
export function generateShortId(): string {
    return (Date.now().toString(36) +
        Math.random().toString(36).replace(".", "").slice(2, 6)).slice(-8);
}
