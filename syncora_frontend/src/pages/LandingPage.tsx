import React, { useState, useEffect } from "react";
import { ArrowRight, Check, MessageSquare, Video, PenTool, StickyNote, ListTodo, Zap, Users, Shield, Sparkles, Globe, Lock, Star, PlayCircle, Award, Rocket, FileText, Mail, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { pricingPlans as importedPricingPlans } from "@/data/pricingData";

const FeatureCard = ({ feature, index }) => (
  <Card className="p-6 h-full group cursor-pointer transition-all duration-300 hover:shadow-lg border border-slate-200 hover:border-indigo-200 bg-white">
    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform duration-300`}>
      <feature.icon className="w-7 h-7 text-white" />
    </div>
    <h4 className="font-bold text-lg mb-2 text-slate-900 group-hover:text-indigo-700 transition-colors">{feature.title}</h4>
    <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
  </Card>
);

const TestimonialCard = ({ testimonial, index }) => (
  <Card className="p-6 h-full border border-slate-200 hover:shadow-lg transition-shadow bg-white">
    <div className="flex items-start gap-4 mb-4">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
        {testimonial.name.charAt(0)}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-base text-slate-900">{testimonial.name}</h4>
        <p className="text-sm text-slate-600">{testimonial.role}</p>
        <p className="text-xs text-slate-500">{testimonial.company}</p>
      </div>
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
    </div>
    <p className="text-slate-600 text-sm italic leading-relaxed">"{testimonial.quote}"</p>
  </Card>
);

const StatCard = ({ stat, index }) => (
  <div className="text-center">
    <div className="p-8 rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow bg-white">
      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-4 shadow-md`}>
        <stat.icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent mb-2">{stat.value}</h3>
      <p className="text-slate-600 font-medium">{stat.label}</p>
    </div>
  </div>
);

const PricingCard = ({ plan, index, popular }) => (
  <div className="relative h-full">
    {popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
        <Badge className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white border-0 shadow-md px-4 py-1.5 font-medium">
          <Sparkles className="w-3 h-3 mr-1" />
          Most Popular
        </Badge>
      </div>
    )}
    <Card className={`h-full ${popular ? 'border-indigo-300 shadow-xl scale-[1.02]' : 'border-slate-200'} hover:shadow-lg transition-all duration-300 bg-white`}>
      <CardHeader className="text-center pb-6 pt-8">
        <CardTitle className="text-2xl font-bold mb-2 text-slate-900">{plan.name}</CardTitle>
        <CardDescription className="text-slate-600">{plan.description}</CardDescription>
        <div className="mt-6">
          <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
            {plan.price === "0" ? "$0" : plan.price === "Custom" ? "Custom" : `$${plan.price}`}
          </div>
          <p className="text-slate-600 mt-2">{plan.period}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Link to="/auth?mode=signup" className="block">
          <Button 
            className={`w-full py-6 text-base font-semibold ${popular ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-md' : ''}`} 
            variant={popular ? "default" : "outline"}
          >
            {plan.cta}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        <div className="space-y-3 pt-4">
          {plan.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-slate-600">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
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

  const features = [
    {
      icon: MessageSquare,
      title: "Realtime Chat",
      description: "Ably-backed messaging with typing indicators, delivery receipts, and file sharing over STOMP/WebSocket",
      color: "from-indigo-600 to-blue-500",
      category: "communication"
    },
    {
      icon: Video,
      title: "Voice & Video",
      description: "ZegoCloud-powered calls with Ably signaling for reliable 1:1 voice and crystal clear video with screenshare",
      color: "from-violet-600 to-purple-500",
      category: "communication"
    },
    {
      icon: PenTool,
      title: "Collaborative Whiteboard",
      description: "Excalidraw-style canvas for diagramming, sketching, and ideation with live cursors",
      color: "from-emerald-600 to-teal-500",
      category: "collaboration"
    },
    {
      icon: StickyNote,
      title: "Notes",
      description: "Lightweight notes with markdown-friendly editing for teams and individuals",
      color: "from-amber-500 to-orange-500",
      category: "productivity"
    },
    {
      icon: ListTodo,
      title: "Tasks",
      description: "Kanban-style boards and checklists to keep delivery on track",
      color: "from-indigo-500 to-blue-500",
      category: "productivity"
    },
    {
      icon: Mail,
      title: "Email Workspace",
      description: "Schema-backed email module with inbox views, toolbar actions, and message storage",
      color: "from-rose-500 to-pink-500",
      category: "communication"
    },
    {
      icon: Users,
      title: "Contacts & Invites",
      description: "Manage workspace members, presence, and invitations with contextual profiles",
      color: "from-teal-600 to-cyan-500",
      category: "collaboration"
    },
    {
      icon: CreditCard,
      title: "Subscriptions",
      description: "Plan selection, usage tracking, and plan comparison backed by SQL schemas",
      color: "from-amber-600 to-amber-500",
      category: "platform"
    },
    {
      icon: Shield,
      title: "Secure APIs",
      description: "Spring Boot 3.5 + Java 21, OAuth2/JWT security, and WebSocket endpoints ready for production",
      color: "from-blue-600 to-indigo-500",
      category: "platform"
    },
  ];

  const stats = [
    { icon: Shield, value: "Spring Boot 3.5", label: "Java 21 backend with REST + WebSockets", color: "from-blue-600 to-indigo-500" },
    { icon: Rocket, value: "React 18 + Vite 5", label: "TypeScript + Tailwind SPA", color: "from-violet-600 to-purple-500" },
    { icon: Globe, value: "PostgreSQL / MySQL", label: "SQL schemas, migrations, and seed data", color: "from-emerald-600 to-teal-500" },
    { icon: MessageSquare, value: "Ably + ZegoCloud", label: "Realtime chat, voice, and video signaling", color: "from-amber-600 to-orange-500" },
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
    "Spring Boot 3.5 + Java 21 backend",
    "React 18, TypeScript, Vite, and Tailwind UI",
    "WebSockets with STOMP for realtime chat",
    "Ably signaling plus ZegoCloud media",
    "Excalidraw-style whiteboard experience",
    "SQL schemas for PostgreSQL/MySQL",
    "OAuth2/JWT security patterns and docs",
    "Production builds with Maven and Vite",
  ];

  const integrations = [
    { name: "Spring Boot 3.5", logo: "☕" },
    { name: "React + Vite", logo: "⚡" },
    { name: "Ably Realtime", logo: "🛰️" },
    { name: "ZegoCloud Video", logo: "🎥" },
    { name: "PostgreSQL / MySQL", logo: "💾" },
    { name: "Tailwind CSS", logo: "🎨" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      {/* Navigation */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-200' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
                Syncora
              </h1>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">Features</a>
              <Link to="/pricing" className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">Pricing</Link>
              <a href="#testimonials" className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">Testimonials</a>
              <a href="#faq" className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">FAQ</a>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost" className="hover:bg-indigo-50 text-slate-700">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-md">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 md:py-32">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div>
            <Badge className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white border-0 shadow-md mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Spring Boot 3.5 · React 18 · Vite 5
            </Badge>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 bg-clip-text text-transparent">
              Syncora
            </span>
            <br />
            <span className="text-slate-900">One Workspace for Team Flow</span>
          </h1>

          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Realtime chat, voice, video, notes, tasks, whiteboard, contacts, subscriptions, and email—powered by a Spring Boot backend, Ably/Zego realtime stack, and a high-performance React + TypeScript frontend.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-md px-8 py-6 text-base">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-2 border-slate-200 px-8 py-6 text-base hover:bg-slate-50">
              <PlayCircle className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
              Free plan available
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
              Cancel anytime
            </div>
          </div>
        </div>
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
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="mb-4 border-indigo-200">
            <Rocket className="w-3 h-3 mr-1" />
            Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Everything Your Team Needs</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Powerful tools that work together seamlessly to boost productivity and streamline collaboration
          </p>
        </div>

        {/* Feature Categories */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {["all", "communication", "collaboration", "productivity", "platform"].map((category) => (
            <Button
              key={category}
              variant={activeTab === category ? "default" : "outline"}
              className={`${activeTab === category ? 'bg-gradient-to-r from-indigo-600 to-indigo-500' : 'border-slate-200'} capitalize`}
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
      <section className="container mx-auto px-6 py-20 bg-slate-50 rounded-3xl my-20">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="mb-4 border-indigo-200">
            <Zap className="w-3 h-3 mr-1" />
            How It Works
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Get Started in Minutes</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Simple setup, powerful results
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Start the Backend", description: "Run the Spring Boot 3.5 API with .\\mvnw.cmd spring-boot:run.", icon: Shield },
            { step: "2", title: "Launch the Frontend", description: "Install deps then npm run dev (Vite + React 18 + Tailwind).", icon: Rocket },
            { step: "3", title: "Invite Your Team", description: "Add members and use chat, voice/video, tasks, notes, email, and whiteboard together.", icon: Users },
          ].map((item, index) => (
            <div key={index}>
              <Card className="text-center p-8 h-full border border-slate-200 shadow-md bg-white">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 shadow-md">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="mb-4 border-indigo-200">
            <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
            Testimonials
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Loved by Teams Worldwide</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            See what our customers have to say about their experience
          </p>
        </div>

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
            <div className="bg-gradient-to-br from-indigo-50 via-indigo-25 to-transparent p-12 space-y-6">
              <Badge className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white border-0">
                <Shield className="w-3 h-3 mr-1" />
                Enterprise Grade
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Built for Teams of All Sizes</h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                From startups to enterprises, Syncora scales with your needs. Secure, reliable, and built to help you collaborate better.
              </p>
              <div className="space-y-4 pt-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-slate-900">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-12 space-y-6">
              {[
                  { icon: Shield, value: "Spring Boot 3.5", label: "Java 21, REST + WebSockets", color: "text-indigo-600" },
                  { icon: MessageSquare, value: "Ably + STOMP", label: "Realtime chat & voice signaling", color: "text-emerald-600" },
                  { icon: Globe, value: "Postgres / MySQL", label: "SQL schemas & seeds included", color: "text-blue-600" },
                  { icon: Video, value: "ZegoCloud", label: "HD video & screenshare", color: "text-violet-600" },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-6 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                  <div className={`w-12 h-12 rounded-lg ${item.color}/10 flex items-center justify-center`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <div>
                    <p className="font-bold text-2xl text-slate-900">{item.value}</p>
                    <p className="text-sm text-slate-600">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* Integrations Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="mb-4 border-indigo-200">
            <Zap className="w-3 h-3 mr-1" />
            Integrations
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Works with Your Favorite Tools</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Works with the stack you already ship: Spring Boot APIs, Vite SPA, WebSockets, and SQL databases
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {integrations.map((integration, index) => (
            <div key={index}>
              <Card className="p-6 hover:shadow-lg transition-shadow text-center cursor-pointer border border-slate-200">
                <div className="text-3xl mb-3">{integration.logo}</div>
                <p className="font-medium text-slate-900">{integration.name}</p>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-6 py-20 bg-slate-50 rounded-3xl my-20">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="mb-4 border-indigo-200">
            <Award className="w-3 h-3 mr-1" />
            Pricing
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Simple, Transparent Pricing</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Choose the perfect plan for your team. Start free, upgrade anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <PricingCard key={index} plan={plan} index={index} popular={plan.popular} />
          ))}
        </div>

        <div className="text-center mt-12 text-slate-600">
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
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="mb-4 border-indigo-200">
            <FileText className="w-3 h-3 mr-1" />
            FAQ
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Everything you need to know about Syncora
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {[
            { q: "Is Syncora really free?", a: "Yes! Our Starter plan is free forever for up to 5 team members with essential features." },
            { q: "Can I switch plans anytime?", a: "Absolutely! You can upgrade, downgrade, or cancel your subscription at any time with no penalties." },
            { q: "Is my data secure?", a: "Yes. We use end-to-end encryption, bank-level security, and are GDPR compliant. Your data is always protected." },
            { q: "What payment methods do you accept?", a: "We accept all major credit cards (Visa, Mastercard, Amex) and offer annual billing with a 20% discount." },
            { q: "Do you offer refunds?", a: "Yes, we offer a 30-day money-back guarantee on all paid plans. No questions asked." },
            { q: "Can I import data from other tools?", a: "Yes! We support data import from popular tools like Slack, Microsoft Teams, Asana, and more." },
          ].map((faq, index) => (
            <div key={index}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold mt-0.5">
                      ?
                    </div>
                    {faq.q}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 pl-9">{faq.a}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div>
          <Card className="overflow-hidden border-none shadow-2xl">
            <div className="bg-gradient-to-br from-indigo-50 via-indigo-25 to-transparent p-12 md:p-20 text-center">
              <div className="space-y-8 max-w-4xl mx-auto">
                <div>
                  <Badge className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white border-0 mb-6">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Limited Time Offer
                  </Badge>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
                  Ready to Transform Your Team?
                </h2>
                <p className="text-xl text-slate-600">
                  Join thousands of teams already collaborating better with Syncora
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Link to="/auth?mode=signup">
                    <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg px-10 py-7 text-base">
                      Get Started Now
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button size="lg" variant="outline" className="border-2 px-10 py-7 text-base">
                      Contact Sales
                    </Button>
                  </Link>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Starter plan is free forever
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Backed by Spring Security & JWT
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Built for PostgreSQL or MySQL
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
                  Syncora
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                The all-in-one workspace for modern teams. Collaborate without limits.
              </p>
              <div className="flex items-center gap-3">
                {["twitter", "linkedin", "github", "youtube"].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-indigo-50 transition-colors"
                  >
                    <div className="w-5 h-5 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-full" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-slate-600">
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
              <ul className="space-y-3 text-sm text-slate-600">
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
              <ul className="space-y-3 text-sm text-slate-600">
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
              <p className="text-sm text-slate-600">
                © 2025 Syncora. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-slate-600">
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

