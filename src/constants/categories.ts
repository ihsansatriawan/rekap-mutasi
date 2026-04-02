import { CategoryRule } from '@/lib/parsers/types';

export const DEFAULT_CATEGORIES: CategoryRule[] = [
  { category: 'Infaq/Donasi', keywords: ['infaq', 'donasi', 'sumbangan', 'sedekah', 'zakat'] },
  { category: 'Operasional', keywords: ['listrik', 'air', 'pln', 'pdam', 'wifi', 'internet', 'pulsa'] },
  { category: 'Konsumsi', keywords: ['makan', 'catering', 'snack', 'warung', 'resto', 'kopi'] },
  { category: 'Perbaikan/Maintenance', keywords: ['renovasi', 'perbaikan', 'tukang', 'material', 'cat', 'bangunan'] },
  { category: 'Kegiatan', keywords: ['acara', 'pengajian', 'event', 'kegiatan', 'rapat'] },
  { category: 'Transfer', keywords: ['transfer', 'tf'] },
];

export const FALLBACK_CATEGORY = 'Lainnya';

export const ALL_CATEGORIES = [
  ...DEFAULT_CATEGORIES.map((r) => r.category),
  FALLBACK_CATEGORY,
];
