import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Check, 
  X, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Zap, 
  Users, 
  Globe,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { pricingPlans as staticPricingPlans, planComparison, frequentlyAskedQuestions } from "@/data/pricingData";
import { PricingPlan } from "@/types/pricing";
import { getAllPlans } from "@/api/subscriptionApi";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PricingCard = ({ plan, index, popular }: { plan: PricingPlan; index: number; popular?: boolean }) => {
  const navigate = useNavigate();

  const handleCTAClick = () => {
    if (plan.name === "Enterprise") {
      // For enterprise, could open a contact form or redirect to contact page
      window.location.href = "mailto:sales@syncora.com?subject=Enterprise Plan Inquiry";
    } else {
      navigate("/auth?mode=signup");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15 }}
      viewport={{ once: true }}
      className="relative h-full"
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white border-0 shadow-lg px-4 py-1.5 font-medium">
            <Sparkles className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      <Card className={`glass-card h-full ${popular ? 'border-primary shadow-xl scale-[1.02]' : 'border-border/40'} hover-lift transition-all duration-300`}>
        <CardHeader className="text-center pb-6 pt-8">
          <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
          <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
          <div className="mt-6">
            <div className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {plan.price === "0" ? "$0" : plan.price === "Custom" ? "Custom" : `$${plan.price}`}
            </div>
            <p className="text-muted-foreground mt-2">{plan.period}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            onClick={handleCTAClick}
            className={`w-full py-6 text-base font-semibold ${popular ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg' : ''}`} 
            variant={popular ? "default" : "outline"}
          >
            {plan.cta}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <div className="space-y-3 pt-4">
            {plan.features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ComparisonTable = () => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-4 px-4 font-semibold">Feature</th>
            <th className="text-center py-4 px-4 font-semibold">Starter</th>
            <th className="text-center py-4 px-4 font-semibold">
              <div className="flex items-center justify-center gap-2">
                Professional
                <Badge className="bg-primary text-white text-xs">Popular</Badge>
              </div>
            </th>
            <th className="text-center py-4 px-4 font-semibold">Enterprise</th>
          </tr>
        </thead>
        <tbody>
          {planComparison.map((item, index) => (
            <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
              <td className="py-4 px-4 font-medium">{item.feature}</td>
              <td className="text-center py-4 px-4">
                {typeof item.starter === 'boolean' ? (
                  item.starter ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground mx-auto" />
                  )
                ) : (
                  <span className="text-sm text-muted-foreground">{item.starter}</span>
                )}
              </td>
              <td className="text-center py-4 px-4 bg-primary/5">
                {typeof item.professional === 'boolean' ? (
                  item.professional ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground mx-auto" />
                  )
                ) : (
                  <span className="text-sm text-muted-foreground">{item.professional}</span>
                )}
              </td>
              <td className="text-center py-4 px-4">
                {typeof item.enterprise === 'boolean' ? (
                  item.enterprise ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground mx-auto" />
                  )
                ) : (
                  <span className="text-sm text-muted-foreground">{item.enterprise}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [scrolled, setScrolled] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<any[]>(staticPricingPlans);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plans = await getAllPlans();
        if (plans && plans.length > 0) {
          // Transform API data to match the expected format
          const transformedPlans = plans.map(plan => ({
            name: plan.displayName,
            price: plan.monthlyPrice === 0 ? "0" : plan.monthlyPrice === -1 ? "Custom" : plan.monthlyPrice.toString(),
            period: plan.monthlyPrice === 0 ? "Free forever" : plan.monthlyPrice === -1 ? "Contact sales" : "per user/month",
            description: plan.description,
            cta: plan.monthlyPrice === -1 ? "Contact Sales" : plan.monthlyPrice === 0 ? "Get Started Free" : "Upgrade Now",
            popular: plan.isPopular,
            features: plan.features || []
          }));
          setPricingPlans(transformedPlans);
        }
      } catch (error) {
        console.error("Failed to fetch pricing plans:", error);
        toast({
          title: "Warning",
          description: "Using cached pricing data. Some information may be outdated.",
          variant: "default",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Navigation */}
      <motion.nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-background/80 backdrop-blur-xl shadow-lg border-b' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Syncora
              </h1>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/#features" className="text-sm font-medium hover:text-primary transition-colors">Features</Link>
              <Link to="/pricing" className="text-sm font-medium text-primary">Pricing</Link>
              <Link to="/#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Testimonials</Link>
              <Link to="/#faq" className="text-sm font-medium hover:text-primary transition-colors">FAQ</Link>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost" className="hover:bg-primary/10">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Pricing
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Choose the perfect plan for your team. Start free, upgrade anytime.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-muted/50 p-2 rounded-lg">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === "monthly"
                  ? "bg-primary text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-md transition-all flex items-center gap-2 ${
                billingCycle === "annual"
                  ? "bg-primary text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <Badge className="bg-green-500 text-white text-xs">Save 20%</Badge>
            </button>
          </div>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <PricingCard key={index} plan={plan} index={index} popular={plan.popular} />
          ))}
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { icon: Shield, title: "Secure & Compliant", desc: "Enterprise-grade security" },
            { icon: Zap, title: "Fast Setup", desc: "Get started in minutes" },
            { icon: Users, title: "24/7 Support", desc: "We're here to help" },
            { icon: Globe, title: "Global Access", desc: "Available worldwide" }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Compare Plans</h2>
          <p className="text-muted-foreground text-lg">
            See all features side by side
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="glass-card">
            <CardContent className="p-6">
              <ComparisonTable />
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-6 py-20 bg-muted/20 rounded-3xl my-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about our pricing
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {frequentlyAskedQuestions.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="glass-card border rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="glass-card border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to transform your team collaboration?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of teams already using Syncora to work smarter and faster.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg px-8">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" onClick={() => window.location.href = "mailto:sales@syncora.com"}>
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
};

export default PricingPage;
