import {
  DEMO_VENDOR_EMAIL,
  createEmptyPassport,
  mockVendorPassport,
  normalizePassport,
  validatePassport,
  type VendorPassport,
} from '@/lib/vendor-passport';

const store = new Map<string, VendorPassport>();

function seed() {
  if (store.size === 0) {
    store.set(DEMO_VENDOR_EMAIL, structuredClone(mockVendorPassport));
  }
}

export function getPassport(vendorEmail: string): VendorPassport | null {
  seed();
  return store.get(vendorEmail) ?? null;
}

export function getOrCreatePassport(vendorEmail: string): VendorPassport {
  seed();
  const existing = store.get(vendorEmail);
  if (existing) return existing;
  const created = createEmptyPassport(vendorEmail);
  store.set(vendorEmail, created);
  return created;
}

export function createPassport(data: Partial<VendorPassport> & { vendorEmail: string }): VendorPassport {
  seed();
  if (store.has(data.vendorEmail)) {
    throw new Error('Passport already exists for this vendor');
  }
  const passport = normalizePassport(data);
  store.set(passport.vendorEmail, passport);
  return passport;
}

export function updatePassport(
  vendorEmail: string,
  patch: Partial<Omit<VendorPassport, 'id' | 'vendorEmail' | 'createdAt'>>
): VendorPassport {
  seed();
  const current = getOrCreatePassport(vendorEmail);
  const updated = normalizePassport({
    ...current,
    ...patch,
    vendorEmail,
    logistics: { ...current.logistics, ...patch.logistics },
  });
  store.set(vendorEmail, updated);
  return updated;
}

export function deletePassport(vendorEmail: string): boolean {
  seed();
  return store.delete(vendorEmail);
}

export function validatePassportByEmail(vendorEmail: string) {
  const passport = getOrCreatePassport(vendorEmail);
  return { passport, validation: validatePassport(passport) };
}

export function resetPassportStore() {
  store.clear();
  store.set(DEMO_VENDOR_EMAIL, structuredClone(mockVendorPassport));
}

export function syncPassportFromClient(passport: VendorPassport) {
  seed();
  store.set(passport.vendorEmail, normalizePassport(passport));
}
