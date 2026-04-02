import { DEFAULT_CATEGORIES, FALLBACK_CATEGORY } from '@/constants/categories';
import type { Transaction } from '@/lib/parsers/types';

export function categorize(description: string): string {
  const lower = description.toLowerCase();

  for (const rule of DEFAULT_CATEGORIES) {
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return rule.category;
      }
    }
  }

  return FALLBACK_CATEGORY;
}

export function categorizeAll(transactions: Transaction[]): Transaction[] {
  return transactions.map((t) => ({
    ...t,
    category: categorize(t.description),
  }));
}
