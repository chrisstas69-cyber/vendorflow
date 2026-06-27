import { STOCK } from '@/lib/event-images';

/** Default booth/setup photos for demo vendors (by category keyword) */
export function defaultSetupPhoto(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('food') || c.includes('bbq') || c.includes('truck')) return STOCK.foodTrucks;
  if (c.includes('balloon') || c.includes('face')) return STOCK.balloonVendor;
  if (c.includes('toy') || c.includes('led') || c.includes('game')) return STOCK.toyBooth;
  return STOCK.vendorTent;
}

export const DEMO_VENDOR_SETUP = {
  'glow@example.com': STOCK.toyBooth,
  'fun@example.com': STOCK.balloonVendor,
  'bbq@example.com': STOCK.foodTrucks,
  'arcade@example.com': STOCK.expoHall,
} as Record<string, string>;

export function resolveSetupPhoto(email: string, category: string, override?: string): string | undefined {
  return override || DEMO_VENDOR_SETUP[email] || defaultSetupPhoto(category);
}
