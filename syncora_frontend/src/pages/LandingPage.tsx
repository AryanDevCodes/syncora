import React, { useState, useEffect } from "react";
import { ArrowRight, Check, MessageSquare, Video, PenTool, StickyNote, ListTodo, Zap, Users, Shield, Sparkles, Clock, Globe, Lock, TrendingUp, Star, PlayCircle, ChevronRight, Award, Rocket, BarChart3, FileText, Calendar, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { pricingPlans as importedPricingPlans } from "@/data/pricingData";

const FeatureCard = ({ feature, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    viewport={{ once: true }}
  >
    <Card className="glass-card p-6 hover-lift h-full group cursor-pointer transition-all duration-300 hover:shadow-lg border border-border/40">
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
        <feature.icon className="w-7 h-7 text-white" />
      </div>
      <h4 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{feature.title}</h4>
      <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
    </Card>
  </motion.div>
);

const TestimonialCard = ({ testimonial, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.15 }}
    viewport={{ once: true }}
  >
    <Card className="glass-card p-6 hover-lift h-full border border-border/40">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-xl shadow-lg">
          {testimonial.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-base">{testimonial.name}</h4>
          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
          <p className="text-xs text-muted-foreground/70">{testimonial.company}</p>
        </div>
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
      </div>
      <p className="text-muted-foreground text-sm italic leading-relaxed">"{testimonial.quote}"</p>
    </Card>
  </motion.div>
);

const StatCard = ({ stat, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    viewport={{ once: true }}
    className="text-center"
  >
    <div className="glass-card p-8 rounded-2xl hover-lift border border-border/40">
      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
        <stat.icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">{stat.value}</h3>
      <p className="text-muted-foreground font-medium">{stat.label}</p>
    </div>
  </motion.div>
);

const PricingCard = ({ plan, index, popular }) => (
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
        <Link to="/auth?mode=signup" className="block">
          <Button 
            className={`w-full py-6 text-base font-semibold ${popular ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg' : ''}`} 
            variant={popular ? "default" : "outline"}
          >
            {plan.cta}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
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

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Color palette
  const colors = {
    primary: "#3B82F6", // blue-500
    secondary: "#8B5CF6", // violet-500
    accent: "#06B6D4", // cyan-500
    success: "#10B981", // emerald-500
    warning: "#F59E0B", // amber-500
    error: "#EF4444" // red-500
  };

  const features = [
    {
      icon: MessageSquare,
      title: "Real-time Chat",
      description: "Connect instantly with team members through powerful messaging with threads, reactions, and file sharing",
      color: "from-blue-500 to-cyan-500",
      category: "communication"
    },
    {
      icon: Video,
      title: "HD Video Calls",
      description: "Face-to-face meetings with crystal clear video quality, screen sharing, and recording",
      color: "from-violet-500 to-purple-500",
      category: "communication"
    },
    {
      icon: PenTool,
      title: "Collaborative Whiteboard",
      description: "Brainstorm together with real-time drawing tools, sticky notes, and infinite canvas",
      color: "from-emerald-500 to-teal-500",
      category: "collaboration"
    },
    {
      icon: StickyNote,
      title: "Smart Notes",
      description: "Organize thoughts and ideas with beautiful note-taking, markdown support, and templates",
      color: "from-amber-500 to-orange-500",
      category: "productivity"
    },
    {
      icon: ListTodo,
      title: "Task Management",
      description: "Keep projects on track with powerful kanban boards, timelines, and progress tracking",
      color: "from-indigo-500 to-blue-500",
      category: "productivity"
    },
    {
      icon: Bot,
      title: "AI-Powered",
      description: "Smart suggestions, automation, and insights to boost your team's productivity",
      color: "from-purple-500 to-pink-500",
      category: "ai"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Coordinate meetings effortlessly with integrated calendar and availability checking",
      color: "from-rose-500 to-pink-500",
      category: "productivity"
    },
    {
      icon: FileText,
      title: "Document Management",
      description: "Store, organize, and collaborate on documents with version control and comments",
      color: "from-teal-500 to-emerald-500",
      category: "collaboration"
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track team performance, productivity metrics, and collaboration patterns",
      color: "from-blue-500 to-indigo-500",
      category: "analytics"
    },
  ];

  const stats = [
    { icon: Users, value: "10K+", label: "Active Teams", color: "from-blue-500 to-cyan-500" },
    { icon: MessageSquare, value: "5M+", label: "Messages Sent", color: "from-violet-500 to-purple-500" },
    { icon: Clock, value: "99.9%", label: "Uptime SLA", color: "from-emerald-500 to-teal-500" },
    { icon: TrendingUp, value: "3x", label: "Productivity Boost", color: "from-amber-500 to-orange-500" },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "CEO",
      company: "TechVision Inc",
      quote: "Syncora transformed how our remote team collaborates. We've seen a 40% increase in productivity since switching.",
    },
    {
      name: "Michael Chen",
      role: "Product Manager",
      company: "InnovateLabs",
      quote: "The all-in-one approach is genius. No more switching between 5 different apps. Everything we need is right here.",
    },
    {
      name: "Emily Rodriguez",
      role: "Design Lead",
      company: "CreativeFlow",
      quote: "The whiteboard feature is incredible for design brainstorming. Our team loves the real-time collaboration.",
    },
    {
      name: "David Kim",
      role: "Engineering Director",
      company: "DevOps Pro",
      quote: "Best investment we've made. The task management and notes integration keeps our entire team aligned.",
    },
    {
      name: "Lisa Thompson",
      role: "Marketing Director",
      company: "BrandBuild",
      quote: "Video calls are crystal clear and the AI features help us stay organized. Game changer for our distributed team.",
    },
    {
      name: "James Wilson",
      role: "CTO",
      company: "DataStream",
      quote: "Security and reliability are top-notch. We trust Syncora with our most important communications.",
    },
  ];

  // Use imported pricing data
  const pricingPlans = importedPricingPlans;

  const benefits = [
    "Unlimited team members",
    "End-to-end encryption",
    "Real-time collaboration",
    "Cross-platform support",
    "99.9% uptime guarantee",
    "Priority support",
  ];

  const integrations = [
    { name: "Slack", logo: "🔗" },
    { name: "Google Drive", logo: "📁" },
    { name: "GitHub", logo: "⚡" },
    { name: "Jira", logo: "📊" },
    { name: "Zoom", logo: "🎥" },
    { name: "Dropbox", logo: "📦" },
  ];

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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Syncora
              </h1>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
              <Link to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</Link>
              <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Testimonials</a>
              <a href="#faq" className="text-sm font-medium hover:text-primary transition-colors">FAQ</a>
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
      <section className="container mx-auto px-6 py-20 md:py-32">
        <motion.div
          className="max-w-5xl mx-auto text-center space-y-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white border-0 shadow-lg mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Now in Beta - Join 10,000+ Teams Worldwide
            </Badge>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Collaborate
            </span>
            <br />
            <span className="text-foreground">Without Limits</span>
          </motion.h1>

          <motion.p
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            The all-in-one workspace for modern teams. Chat, video call, collaborate on whiteboards,
            manage tasks, and take notes - all in one beautiful, intuitive platform.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link to="/auth?mode=signup">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg px-8 py-6 text-base">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-2 px-8 py-6 text-base">
              <PlayCircle className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-500" />
              </div>
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-500" />
              </div>
              Free plan available
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-500" />
              </div>
              Cancel anytime
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section - Moved up for better flow */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatCard key={index} stat={stat} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-6 py-20">
        <motion.div
          className="text-center mb-16 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="outline" className="mb-4">
            <Rocket className="w-3 h-3 mr-1" />
            Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold">Everything Your Team Needs</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Powerful tools that work together seamlessly to boost productivity and streamline collaboration
          </p>
        </motion.div>

        {/* Feature Categories */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {["all", "communication", "collaboration", "productivity", "ai", "analytics"].map((category) => (
            <Button
              key={category}
              variant={activeTab === category ? "default" : "outline"}
              className={`${activeTab === category ? 'bg-gradient-to-r from-primary to-primary/80' : ''} capitalize`}
              onClick={() => setActiveTab(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features
            .filter(f => activeTab === "all" || f.category === activeTab)
            .map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-6 py-20 bg-muted/20 rounded-3xl my-20">
        <motion.div
          className="text-center mb-16 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="outline" className="mb-4">
            <Zap className="w-3 h-3 mr-1" />
            How It Works
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold">Get Started in Minutes</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple setup, powerful results
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Sign Up", description: "Create your free account in seconds. No credit card required.", icon: Users },
            { step: "2", title: "Invite Team", description: "Add your team members and set up your workspace together.", icon: MessageSquare },
            { step: "3", title: "Start Collaborating", description: "Begin chatting, calling, and working together seamlessly.", icon: Rocket },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <Card className="text-center p-8 h-full border-none shadow-lg">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 shadow-lg">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="container mx-auto px-6 py-20">
        <motion.div
          className="text-center mb-16 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="outline" className="mb-4">
            <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
            Testimonials
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold">Loved by Teams Worldwide</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what our customers have to say about their experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} index={index} />
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="overflow-hidden border-none shadow-xl">
          <div className="grid md:grid-cols-2 gap-0">
            <motion.div
              className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-12 space-y-6"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white border-0">
                <Shield className="w-3 h-3 mr-1" />
                Enterprise Grade
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold">Built for Teams of All Sizes</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                From startups to enterprises, Syncora scales with your needs. Secure, reliable, and built to help you collaborate better.
              </p>
              <div className="space-y-4 pt-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="p-12 space-y-6"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              {[
                { icon: Users, value: "10,000+", label: "Active Teams", color: "text-primary" },
                { icon: MessageSquare, value: "5M+", label: "Messages Sent", color: "text-violet-500" },
                { icon: TrendingUp, value: "3x", label: "Productivity Boost", color: "text-emerald-500" },
                { icon: Shield, value: "99.9%", label: "Uptime SLA", color: "text-blue-500" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-4 p-6 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                >
                  <div className={`w-12 h-12 rounded-lg ${item.color}/10 flex items-center justify-center`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <div>
                    <p className="font-bold text-2xl">{item.value}</p>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </Card>
      </section>

      {/* Integrations Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          className="text-center mb-16 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="outline" className="mb-4">
            <Zap className="w-3 h-3 mr-1" />
            Integrations
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold">Works with Your Favorite Tools</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Seamlessly integrate with the tools you already use
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {integrations.map((integration, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow text-center cursor-pointer border">
                <div className="text-3xl mb-3">{integration.logo}</div>
                <p className="font-medium">{integration.name}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-6 py-20 bg-muted/20 rounded-3xl my-20">
        <motion.div
          className="text-center mb-16 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="outline" className="mb-4">
            <Award className="w-3 h-3 mr-1" />
            Pricing
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your team. Start free, upgrade anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <PricingCard key={index} plan={plan} index={index} popular={plan.popular} />
          ))}
        </div>

        <motion.div
          className="text-center mt-12 text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="mb-4 font-medium">All plans include:</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              End-to-end encryption
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              99.9% uptime SLA
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-500" />
              GDPR compliant
            </div>
          </div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-6 py-20">
        <motion.div
          className="text-center mb-16 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="outline" className="mb-4">
            <FileText className="w-3 h-3 mr-1" />
            FAQ
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold">Frequently Asked Questions</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about Syncora
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {[
            { q: "Is Syncora really free?", a: "Yes! Our Starter plan is free forever for up to 5 team members with essential features." },
            { q: "Can I switch plans anytime?", a: "Absolutely! You can upgrade, downgrade, or cancel your subscription at any time with no penalties." },
            { q: "Is my data secure?", a: "Yes. We use end-to-end encryption, bank-level security, and are GDPR compliant. Your data is always protected." },
            { q: "What payment methods do you accept?", a: "We accept all major credit cards (Visa, Mastercard, Amex) and offer annual billing with a 20% discount." },
            { q: "Do you offer refunds?", a: "Yes, we offer a 30-day money-back guarantee on all paid plans. No questions asked." },
            { q: "Can I import data from other tools?", a: "Yes! We support data import from popular tools like Slack, Microsoft Teams, Asana, and more." },
          ].map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold mt-0.5">
                      ?
                    </div>
                    {faq.q}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground pl-9">{faq.a}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <Card className="overflow-hidden border-none shadow-2xl">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-12 md:p-20 text-center">
              <div className="space-y-8 max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white border-0 mb-6">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Limited Time Offer
                  </Badge>
                </motion.div>
                <motion.h2
                  className="text-4xl md:text-5xl font-bold"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  Ready to Transform Your Team?
                </motion.h2>
                <motion.p
                  className="text-xl text-muted-foreground"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  Join thousands of teams already collaborating better with Syncora
                </motion.p>
                <motion.div
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <Link to="/auth?mode=signup">
                    <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg px-10 py-7 text-base">
                      Get Started Now
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button size="lg" variant="outline" className="border-2 px-10 py-7 text-base">
                      Contact Sales
                    </Button>
                  </Link>
                </motion.div>
                <motion.div
                  className="flex flex-wrap items-center justify-center gap-6 pt-6 text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Free plan available
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    No credit card required
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Cancel anytime
                  </div>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Syncora
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The all-in-one workspace for modern teams. Collaborate without limits.
              </p>
              <div className="flex items-center gap-3">
                {["twitter", "linkedin", "github", "youtube"].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-primary/10 transition-colors"
                  >
                    <div className="w-5 h-5 bg-gradient-to-r from-primary to-primary/80 rounded-full" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Roadmap</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Press Kit</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                © 2025 Syncora. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-foreground transition-colors flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Terms of Service
                </a>
                <a href="#" className="hover:text-foreground transition-colors flex items-center gap-1">
                  <Lock className="w-4 h-4" />
                  Security
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;