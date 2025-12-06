export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  popular?: boolean;
  features: string[];
}

export interface PricingFeature {
  title: string;
  description: string;
  included: boolean;
}

export interface PlanComparison {
  feature: string;
  starter: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
}
