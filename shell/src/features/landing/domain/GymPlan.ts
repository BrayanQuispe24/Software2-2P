export interface GymPlan {
  id: string;
  name: string;
  tag: string;
  price: string;
  period: string;
  description: string;
  isPopular?: boolean;
  highlightText?: string;
  features: string[];
  ctaText: string;
}
