
export interface NavItem {
  label: string;
  path: string;
}

export interface ScooterPlan {
  id: string;
  name: string;
  type: 'white' | 'green';
  price: number;
  description: string;
  details: string[];
  image: string;
  colorClass: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export interface Guesthouse {
  name: string;
  description: string;
  image: string;
}
