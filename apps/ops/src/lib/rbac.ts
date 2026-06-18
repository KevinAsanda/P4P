export type OpsRole = 'admin' | 'finance' | 'warehouse';

export interface RolePermissions {
  canSeePrices: boolean;
  canSeeAddresses: boolean;
  canSeeBI: boolean;
  canSeeConfig: boolean; // CRUD schools/templates/products
  canSeeSuppliers: boolean;
}

export const PERMISSIONS: Record<OpsRole, RolePermissions> = {
  admin: {
    canSeePrices: true,
    canSeeAddresses: true,
    canSeeBI: true,
    canSeeConfig: true,
    canSeeSuppliers: true,
  },
  finance: {
    canSeePrices: true,
    canSeeAddresses: false, // Billing name only, no full delivery address/PII
    canSeeBI: true,
    canSeeConfig: false,
    canSeeSuppliers: true,
  },
  warehouse: {
    canSeePrices: false,
    canSeeAddresses: false,
    canSeeBI: false,
    canSeeConfig: false,
    canSeeSuppliers: false,
  },
};

/**
 * Filter customer address or price details based on role permission configuration.
 */
export function formatAddressForRole(address: string | null, role: OpsRole): string {
  if (!address) return 'N/A';
  if (PERMISSIONS[role].canSeeAddresses) {
    return address;
  }
  return 'Redacted (Restricted Role)';
}

export function formatPriceForRole(price: number | string, role: OpsRole): string {
  if (PERMISSIONS[role].canSeePrices) {
    return `R ${Number(price).toFixed(2)}`;
  }
  return 'R *** (Hidden)';
}
