// Plan-specific styles and utilities
export const getPlanStyles = (plan: string) => {
  switch (plan.toLowerCase()) {
    case 'trial':
      return {
        bg: 'bg-gradient-to-r from-gray-100 to-slate-200',
        text: 'text-gray-800',
        border: 'border-gray-300',
        badge: 'bg-gray-100 text-gray-800 border-gray-300',
        gradient: 'from-gray-400 to-slate-500',
        shadow: 'shadow-gray-300/50'
      };
    case 'starter':
      return {
        bg: 'bg-gradient-to-r from-blue-100 to-sky-200',
        text: 'text-blue-800',
        border: 'border-blue-300',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
        gradient: 'from-blue-400 to-sky-600',
        shadow: 'shadow-blue-300/50'
      };
    case 'pro':
      return {
        bg: 'bg-gradient-to-r from-purple-100 to-violet-200',
        text: 'text-purple-800',
        border: 'border-purple-300',
        badge: 'bg-purple-100 text-purple-800 border-purple-300',
        gradient: 'from-purple-500 to-violet-600',
        shadow: 'shadow-purple-300/50'
      };
    case 'enterprise':
      return {
        bg: 'bg-gradient-to-r from-amber-100 via-orange-100 to-yellow-100',
        text: 'text-orange-800',
        border: 'border-orange-300',
        badge: 'bg-gradient-to-r from-amber-100 to-orange-100 text-orange-800 border-orange-300',
        gradient: 'from-amber-500 via-orange-500 to-yellow-500',
        shadow: 'shadow-orange-300/50'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-300',
        badge: 'bg-gray-100 text-gray-800 border-gray-300',
        gradient: 'from-gray-400 to-gray-500',
        shadow: 'shadow-gray-300/50'
      };
  }
};

export const getPlanGradientClasses = (plan: string) => {
  const styles = getPlanStyles(plan);
  return `${styles.bg} ${styles.text} ${styles.border} ${styles.shadow}`;
};

export const getPlanBadgeClasses = (plan: string) => {
  const styles = getPlanStyles(plan);
  return `${styles.badge} font-semibold`;
};

export const getPlanPriority = (plan: string): number => {
  const priorities: Record<string, number> = {
    'enterprise': 4,
    'pro': 3,
    'starter': 2,
    'trial': 1
  };
  return priorities[plan.toLowerCase()] || 0;
};

export const getPlanLabel = (plan: string): string => {
  const labels: Record<string, string> = {
    'trial': 'Trial',
    'starter': 'Starter',
    'pro': 'Professional',
    'enterprise': 'Enterprise'
  };
  return labels[plan.toLowerCase()] || plan;
};