export interface EmploymentStatusInfo {
  status: 'Probationary' | 'Permanent';
  monthsCompleted: number;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export function getEmploymentStatus(joinDateStr: string): EmploymentStatusInfo {
  if (!joinDateStr) {
    return {
      status: 'Permanent',
      monthsCompleted: 12,
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-700',
      badgeBorder: 'border-indigo-200',
    };
  }

  const joinDate = new Date(joinDateStr);
  const now = new Date();

  // Calculate full month difference accurately
  let months = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
  if (now.getDate() < joinDate.getDate()) {
    months--;
  }

  const isProbation = months < 6;

  if (isProbation) {
    return {
      status: 'Probationary',
      monthsCompleted: Math.max(0, months),
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-300',
    };
  }

  return {
    status: 'Permanent',
    monthsCompleted: Math.max(0, months),
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
  };
}
