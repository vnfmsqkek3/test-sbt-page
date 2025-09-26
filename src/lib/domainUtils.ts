import { PlanId } from '@/types';

export function generateTenantDomain(tenantName: string, plan: PlanId): string {
  // 플랜별 prefix 매핑
  const planPrefixes: Record<PlanId, string> = {
    trial: 't',
    starter: 's', 
    pro: 'p',
    enterprise: 'e'
  };

  const prefix = planPrefixes[plan] || 't'; // 기본값은 trial
  return `${prefix}-${tenantName}.ediworks.com`;
}

export function getPlanPrefix(plan: PlanId): string {
  const planPrefixes: Record<PlanId, string> = {
    trial: 't',
    starter: 's',
    pro: 'p', 
    enterprise: 'e'
  };
  
  return planPrefixes[plan] || 't';
}

export function getPlanFromDomain(domain: string): PlanId | null {
  const match = domain.match(/^([a-z])-/);
  if (!match) return null;
  
  const prefix = match[1];
  const prefixToPlan: Record<string, PlanId> = {
    't': 'trial',
    's': 'starter',
    'p': 'pro',
    'e': 'enterprise'
  };
  
  return prefixToPlan[prefix] || null;
}

export function extractTenantNameFromDomain(domain: string): string | null {
  const match = domain.match(/^[a-z]-(.*?)\.ediworks\.com$/);
  return match ? match[1] : null;
}

export function formatDomainForDisplay(domain: string): string {
  return domain;
}

export function copyDomainToClipboard(domain: string): void {
  navigator.clipboard.writeText(domain);
}