export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance: number;
  category: string;
}

export interface BankParser {
  detect(text: string): boolean;
  parse(pages: string[]): Transaction[];
}

export interface CategoryRule {
  category: string;
  keywords: string[];
}
