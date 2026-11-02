export interface GymDiscipline {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  highlightBadge?: string;
  isPopular?: boolean;
  benefits: string[];
}
