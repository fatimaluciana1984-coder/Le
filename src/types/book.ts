export type BookGenre =
  | 'Ficção'
  | 'Romance'
  | 'Mistério'
  | 'Ensaios'
  | 'Poesia'
  | 'Desenvolvimento Pessoal';

export type CoverPreset = 'stories' | 'woods' | 'midnight' | 'shadow' | 'slow';

export type PixKeyType = 'cpf' | 'email' | 'telefone' | 'aleatoria';

export const BOOK_GENRES: BookGenre[] = [
  'Ficção',
  'Romance',
  'Mistério',
  'Ensaios',
  'Poesia',
  'Desenvolvimento Pessoal',
];

export const COVER_PRESET_INFO: Record<
  CoverPreset,
  { label: string; imageUrl: string; accentColor: string }
> = {
  stories: {
    label: 'Botânico Outonal',
    imageUrl: '/src/assets/images/cover_stories_seasons_1795271164112.jpg',
    accentColor: '#9f3c16',
  },
  woods: {
    label: 'Bosque Silencioso',
    imageUrl: '/src/assets/images/cover_silent_woods_1795271164894.jpg',
    accentColor: '#29674b',
  },
  midnight: {
    label: 'Poltrona & Luz',
    imageUrl: '/src/assets/images/cover_midnight_library_1795271164812.jpg',
    accentColor: '#805521',
  },
  shadow: {
    label: 'Chave Dourada',
    imageUrl: '/src/assets/images/cover_shadow_wind_1795271164811.jpg',
    accentColor: '#1f3a2e',
  },
  slow: {
    label: 'Manhã Serena',
    imageUrl: '/src/assets/images/cover_slow_living_1795271164257.jpg',
    accentColor: '#9f3c16',
  },
};

export const VALIDATION_BOUNDS = {
  TITLE_MIN: 2,
  TITLE_MAX: 140,
  SYNOPSIS_MIN: 10,
  SYNOPSIS_MAX: 1200,
  CONTENT_MIN: 20,
  CONTENT_MAX: 120000,
  AUTHOR_NAME_MAX: 100,
  FULL_NAME_MIN: 3,
  FULL_NAME_MAX: 120,
  PIX_KEY_MIN: 5,
  PIX_KEY_MAX: 140,
  BANK_NAME_MIN: 2,
  BANK_NAME_MAX: 80,
  MAX_PRICE_CENTS: 999900,
};

export interface BookItem {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  synopsis: string;
  genre: BookGenre;
  coverPreset: CoverPreset;
  content: string;
  priceCents: number;
  status: 'draft' | 'published';
  adultMonetized: boolean;
  isCurated?: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  dailyMinutes: number;
  dailyGoalMinutes: number;
  annualBooksRead: number;
  annualBooksGoal: number;
  streakDays: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CreatorPayout {
  userId: string;
  fullName: string;
  birthDate: string;
  age18Confirmed: boolean;
  cpf: string;
  pixKeyType: PixKeyType;
  pixKey: string;
  bankName: string;
  termsAccepted: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PurchaseRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  buyerId: string;
  authorId: string;
  amountCents: number;
  createdAt?: unknown;
}

export interface ReadingProgressRecord {
  id: string;
  userId: string;
  bookId: string;
  percent: number;
  bookmarked: boolean;
  updatedAt?: unknown;
}

export function formatBRL(cents: number): string {
  if (cents <= 0) return 'Gratuito';
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function calculateAge(birthDateStr: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDateStr);
  if (!match) return -1;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return -1;

  const today = new Date();
  let age = today.getFullYear() - year;
  const mDiff = today.getMonth() + 1 - month;
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < day)) {
    age--;
  }
  return age;
}
