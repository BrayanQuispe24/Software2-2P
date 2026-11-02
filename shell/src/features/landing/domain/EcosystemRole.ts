export interface RoleFeature {
  title: string;
  description: string;
}

export interface EcosystemRole {
  id: string;
  tabLabel: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  features: RoleFeature[];
  visualCard: {
    tag: string;
    headline: string;
    statNumber?: string;
    statLabel?: string;
    highlightTitle: string;
    highlightSubtitle: string;
  };
}
