import { PricingPlan, PlanComparison } from "@/types/pricing";

export const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    price: "0",
    period: "Free forever",
    description: "Perfect for small teams getting started",
    cta: "Get Started Free",
    features: [
      "Up to 5 team members",
      "Unlimited messages",
      "Video calls up to 40 mins",
      "5 GB storage",
      "Basic task boards",
      "Community support",
    ]
  },
  {
    name: "Professional",
    price: "12",
    period: "per user/month",
    description: "For growing teams that need more",
    cta: "Start Free Trial",
    popular: true,
    features: [
      "Unlimited team members",
      "Unlimited video calls",
      "100 GB storage per user",
      "Advanced task management",
      "AI-powered features",
      "Priority support",
      "Custom integrations",
      "Analytics & reporting",
    ]
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "Contact sales",
    description: "Advanced features for large organizations",
    cta: "Contact Sales",
    features: [
      "Everything in Professional",
      "Unlimited storage",
      "Advanced security & compliance",
      "SSO & SAML",
      "Dedicated account manager",
      "Custom SLA",
      "On-premise deployment",
      "24/7 phone support",
    ]
  },
];

export const planComparison: PlanComparison[] = [
  {
    feature: "Team Members",
    starter: "Up to 5",
    professional: "Unlimited",
    enterprise: "Unlimited"
  },
  {
    feature: "Messages",
    starter: true,
    professional: true,
    enterprise: true
  },
  {
    feature: "Video Calls",
    starter: "40 mins",
    professional: "Unlimited",
    enterprise: "Unlimited"
  },
  {
    feature: "Storage",
    starter: "5 GB",
    professional: "100 GB/user",
    enterprise: "Unlimited"
  },
  {
    feature: "Task Management",
    starter: "Basic",
    professional: "Advanced",
    enterprise: "Advanced"
  },
  {
    feature: "AI Features",
    starter: false,
    professional: true,
    enterprise: true
  },
  {
    feature: "Custom Integrations",
    starter: false,
    professional: true,
    enterprise: true
  },
  {
    feature: "Analytics & Reporting",
    starter: false,
    professional: true,
    enterprise: true
  },
  {
    feature: "Priority Support",
    starter: false,
    professional: true,
    enterprise: true
  },
  {
    feature: "Security & Compliance",
    starter: "Basic",
    professional: "Standard",
    enterprise: "Advanced"
  },
  {
    feature: "SSO & SAML",
    starter: false,
    professional: false,
    enterprise: true
  },
  {
    feature: "Dedicated Account Manager",
    starter: false,
    professional: false,
    enterprise: true
  },
  {
    feature: "Custom SLA",
    starter: false,
    professional: false,
    enterprise: true
  },
  {
    feature: "On-premise Deployment",
    starter: false,
    professional: false,
    enterprise: true
  },
  {
    feature: "24/7 Phone Support",
    starter: false,
    professional: false,
    enterprise: true
  }
];

export const frequentlyAskedQuestions = [
  {
    question: "Can I change plans later?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges."
  },
  {
    question: "Is there a free trial for paid plans?",
    answer: "No, we don't offer trial periods. However, you can start with our free Starter plan to explore the platform before upgrading."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and wire transfers for Enterprise plans. All payments are processed securely."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period."
  },
  {
    question: "Do you offer discounts for nonprofits or educational institutions?",
    answer: "Yes! We offer special pricing for nonprofits and educational institutions. Contact our sales team for more information."
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "You can export all your data at any time. After cancellation, we'll retain your data for 30 days before permanent deletion."
  },
  {
    question: "Is there a setup fee?",
    answer: "No setup fees for any plan. You only pay the monthly or annual subscription cost."
  },
  {
    question: "Do you offer annual billing?",
    answer: "Yes! Annual billing is available with a 20% discount compared to monthly billing."
  }
];
