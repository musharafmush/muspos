// GST Calculator Utility for Dynamic Tax Calculations
export interface GSTBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total: number;
  isInterState: boolean;
}



export function calculateGSTBreakdown(
  amount: number,
  gstRate: number,
  supplierState: string = "MH",
  buyerState: string = "MH"
): GSTBreakdown {
  const isInterState = supplierState !== buyerState;
  const gstAmount = (amount * gstRate) / 100;

  if (isInterState) {
    // Inter-state: Only IGST
    return {
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      cess: 0,
      total: gstAmount,
      isInterState: true
    };
  } else {
    // Intra-state: CGST + SGST
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    return {
      cgst,
      sgst,
      igst: 0,
      cess: 0,
      total: gstAmount,
      isInterState: false
    };
  }
}

export function generateAlias(brand: string, department: string, itemName: string): string {
  const parts = [brand, department, itemName].filter(Boolean);
  if (parts.length === 0) return "";

  // Create a clean alias from the parts
  return parts
    .join(" ")
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
    .replace(/\s+/g, " ") // Normalize spaces
    .trim()
    .substring(0, 50); // Limit length
}

export function formatGSTBreakdown(breakdown: GSTBreakdown): string {
  if (breakdown.isInterState) {
    return `IGST: ${breakdown.igst.toFixed(2)}`;
  } else {
    return `CGST: ${breakdown.cgst.toFixed(2)} + SGST: ${breakdown.sgst.toFixed(2)}`;
  }
}

/**
 * Suggests a GST rate based on the HSN code prefix.
 * This is a simplified implementation for standard GST rates.
 */
export function suggestGSTRate(hsnCode: string): number {
  if (!hsnCode) return 18; // Default standard rate

  const prefix = hsnCode.substring(0, 2);
  // Simplified HSN-to-GST mapping
  const mapping: Record<string, number> = {
    "01": 0, "02": 0, "03": 0, "07": 0, "08": 0, "10": 0, // Essentials
    "04": 5, "09": 5, "11": 5, "15": 5, "17": 5,        // Daily needs
    "21": 12, "22": 12, "25": 12,                       // Processed foods
    "33": 18, "84": 18, "85": 18, "90": 18,             // General goods
    "71": 3,                                            // Gems/Jewelry
  };

  return mapping[prefix] ?? 18;
}

/**
 * Validates the format of an HSN code.
 * Standard HSN codes are 4, 6, or 8 digits.
 */
export function validateHSNCode(hsnCode: string): boolean {
  if (!hsnCode) return true; // Optional in many cases
  const cleanCode = hsnCode.replace(/\s+/g, "");
  return /^(\d{4}|\d{6}|\d{8})$/.test(cleanCode);
}

