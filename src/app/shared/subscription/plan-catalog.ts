export type SubscriptionPlanTier = 'basic' | 'premium' | 'enterprise';

export interface PlanCatalogEntry {
  tier: SubscriptionPlanTier;
  maxMachinery: number;
  pricePen: number;
}

export const PLAN_CATALOG: Record<SubscriptionPlanTier, PlanCatalogEntry> = {
  basic: { tier: 'basic', maxMachinery: 5, pricePen: 149 },
  premium: { tier: 'premium', maxMachinery: 25, pricePen: 399 },
  enterprise: { tier: 'enterprise', maxMachinery: 999, pricePen: 1299 },
};

export function coercePlanTier(raw: string | undefined | null): SubscriptionPlanTier {
  const n = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (n.includes('enterprise')) {
    return 'enterprise';
  }
  if (n.includes('premium')) {
    return 'premium';
  }
  if (n.includes('basic')) {
    return 'basic';
  }
  return 'basic';
}
