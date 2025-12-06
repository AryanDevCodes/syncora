import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Check,
  X,
  ArrowRight,
  Sparkles,
  Calendar,
  DollarSign,
  TrendingUp,
  Settings,
  AlertCircle,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  getAllPlans,
  getCurrentSubscription,
  upgradeSubscription,
  cancelSubscription,
  reactivateSubscription,
  getSubscriptionHistory,
  getPaymentHistory,
  type PricingPlan as ApiPricingPlan,
  type Subscription,
  type PaymentHistory,
} from "@/api/subscriptionApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SubscriptionManagementPage = () => {
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<ApiPricingPlan[]>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<Subscription[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ApiPricingPlan | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subscription, plans, history, payments] = await Promise.all([
        getCurrentSubscription(),
        getAllPlans(),
        getSubscriptionHistory(),
        getPaymentHistory(),
      ]);

      setCurrentSubscription(subscription);
      setAvailablePlans(plans);
      setSubscriptionHistory(history);
      setPaymentHistory(payments);
    } catch (error) {
      console.error("Failed to fetch subscription data:", error);
      toast({
        title: "Error",
        description: "Failed to load subscription information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    try {
      await upgradeSubscription({
        newPlanId: selectedPlan.id,
        billingCycle: billingCycle,
        immediate: true,
      });

      toast({
        title: "Success",
        description: `Successfully upgraded to ${selectedPlan.displayName}`,
      });

      setShowUpgradeDialog(false);
      await fetchData();
      
      // Force refresh subscription context
      window.dispatchEvent(new CustomEvent('subscription-updated'));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upgrade subscription",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSubscription(cancelReason);
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled",
      });
      setShowCancelDialog(false);
      fetchData();
      // Trigger subscription refresh in sidebar and other components
      window.dispatchEvent(new CustomEvent('subscription-updated'));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      });
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateSubscription();
      toast({
        title: "Success",
        description: "Your subscription has been reactivated",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reactivate subscription",
        variant: "destructive",
      });
    }
  };

  const openUpgradeDialog = (plan: ApiPricingPlan) => {
    setSelectedPlan(plan);
    setShowUpgradeDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-2">
            Subscription Management
          </h1>
          <p className="text-muted-foreground">Manage your plans, billing, and payment history</p>
        </motion.div>

        {/* Current Subscription Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-primary/20 shadow-xl bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-900/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Current Subscription
                  </CardTitle>
                  <CardDescription className="text-base mt-1">Manage your subscription and billing</CardDescription>
                </div>
                {currentSubscription?.isInTrial && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-sm shadow-lg">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Trial Period
                  </Badge>
                )}
              </div>
            </CardHeader>
        <CardContent className="space-y-6">
          {currentSubscription ? (
            <>
              <div className="grid md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-blue-500/5 border border-primary/10"
                >
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Plan
                  </p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    {currentSubscription.plan.displayName}
                  </p>
                  {currentSubscription.plan.isPopular && (
                    <Badge className="mt-2 bg-gradient-to-r from-primary to-blue-600 text-white">
                      ⭐ Popular Choice
                    </Badge>
                  )}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10"
                >
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Billing Cycle
                  </p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {currentSubscription.billingCycle}
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/10"
                >
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Status
                  </p>
                  <Badge
                    className={`text-base px-4 py-1 ${
                      currentSubscription.isActive
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                        : "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg"
                    }`}
                  >
                    {currentSubscription.status}
                  </Badge>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid md:grid-cols-2 gap-6 pt-6 border-t border-primary/10"
              >
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                  <div className="p-3 rounded-lg bg-blue-500/20">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      {currentSubscription.plan.name === 'STARTER' ? 'Plan Duration' : 'Next Billing Date'}
                    </p>
                    <p className="font-bold text-lg mt-1">
                      {currentSubscription.plan.name === 'STARTER' 
                        ? 'No expiration' 
                        : formatDate(currentSubscription.endDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                  <div className="p-3 rounded-lg bg-emerald-500/20">
                    <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      {currentSubscription.plan.name === 'STARTER' ? 'Price' : 'Days Remaining'}
                    </p>
                    <p className="font-bold text-lg mt-1">
                      {currentSubscription.plan.name === 'STARTER' 
                        ? '🎉 Free forever' 
                        : `${currentSubscription.daysRemaining} days`}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex gap-4 pt-6"
              >
                {currentSubscription.status === "CANCELLED" ? (
                  <Button
                    onClick={handleReactivate}
                    className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Reactivate Subscription
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => navigate("/pricing")}
                      className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      size="lg"
                    >
                      <TrendingUp className="w-5 h-5" />
                      Upgrade Plan
                    </Button>
                    {currentSubscription.plan.name !== "STARTER" && (
                      <Button
                        onClick={() => setShowCancelDialog(true)}
                        variant="outline"
                        className="gap-2 border-2 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950 transition-all duration-300"
                        size="lg"
                      >
                        <X className="w-5 h-5" />
                        Cancel Subscription
                      </Button>
                    )}
                  </>
                )}
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="inline-block p-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 mb-6">
                <AlertCircle className="w-16 h-16 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                No Active Subscription
              </p>
              <p className="text-muted-foreground mb-6 text-lg">
                Choose a plan to unlock powerful collaboration features
              </p>
              <Button
                onClick={() => navigate("/pricing")}
                className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                View Available Plans
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* Tabs for Available Plans, History, and Payments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-2 rounded-xl border border-primary/10 shadow-lg">
            <TabsTrigger
              value="plans"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Available Plans
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Subscription History
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all duration-300"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Payment History
            </TabsTrigger>
          </TabsList>

        <TabsContent value="plans" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-3 gap-6">
            {availablePlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="h-full"
              >
                <Card className={`h-full relative overflow-hidden transition-all duration-300 ${
                  plan.isPopular 
                    ? "border-2 border-primary shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-slate-800 dark:via-blue-900/20 dark:to-indigo-900/20" 
                    : "border shadow-lg hover:shadow-xl bg-white dark:bg-slate-800"
                }`}>
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden">
                      <div className="absolute top-6 right-[-32px] bg-gradient-to-r from-primary to-blue-600 text-white text-xs font-bold px-8 py-1 rotate-45 shadow-lg">
                        ⭐ POPULAR
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        {plan.displayName}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-base">{plan.description}</CardDescription>
                    <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-blue-500/5 border border-primary/10">
                      <p className="text-4xl font-black bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        {plan.formattedMonthlyPrice}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 font-medium">per user/month</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {plan.features.slice(0, 5).map((feature, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.15 + idx * 0.05 }}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors"
                        >
                          <div className="p-1 rounded-full bg-green-500/10">
                            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          </div>
                          <span className="text-sm font-medium">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                    <Button
                      onClick={() => openUpgradeDialog(plan)}
                      className={`w-full font-bold shadow-lg hover:shadow-xl transition-all duration-300 ${
                        plan.isPopular
                          ? "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white"
                          : ""
                      }`}
                      variant={plan.isPopular ? "default" : "outline"}
                      size="lg"
                      disabled={
                        currentSubscription?.plan.id === plan.id ||
                        (currentSubscription &&
                          availablePlans.findIndex((p) => p.id === currentSubscription.plan.id) >
                            availablePlans.findIndex((p) => p.id === plan.id))
                      }
                    >
                      {currentSubscription?.plan.id === plan.id
                        ? "✓ Current Plan"
                        : "Select Plan"}
                      {!currentSubscription?.plan.id && plan.isPopular && (
                        <ArrowRight className="w-5 h-5 ml-2" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-6">
          {subscriptionHistory.length > 0 ? (
            <div className="space-y-4">
              {subscriptionHistory.map((sub, idx) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-800 border-l-4 border-l-primary">
                    <CardContent className="py-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/10">
                            <CreditCard className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">{sub.plan.displayName}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={`px-4 py-2 text-sm font-bold shadow-lg ${
                            sub.status === "ACTIVE"
                              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                              : sub.status === "CANCELLED"
                              ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                              : "bg-gradient-to-r from-gray-500 to-slate-500 text-white"
                          }`}
                        >
                          {sub.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900">
                <CardContent className="py-16 text-center">
                  <div className="inline-block p-4 rounded-full bg-primary/10 mb-4">
                    <Calendar className="w-12 h-12 text-primary" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">No subscription history yet</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4 mt-6">
          {paymentHistory.length > 0 ? (
            <div className="space-y-4">
              {paymentHistory.map((payment, idx) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-800 border-l-4 border-l-green-500">
                    <CardContent className="py-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-black text-2xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              {formatCurrency(payment.amount)}
                            </p>
                            <p className="text-sm font-medium text-muted-foreground mt-1">
                              {payment.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(payment.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={`px-4 py-2 text-sm font-bold shadow-lg mb-2 ${
                              payment.status === "COMPLETED"
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                : payment.status === "FAILED"
                                ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                                : "bg-gradient-to-r from-yellow-500 to-amber-500 text-white"
                            }`}
                          >
                            {payment.status}
                          </Badge>
                          <p className="text-sm font-medium text-muted-foreground flex items-center justify-end gap-1">
                            <CreditCard className="w-3 h-3" />
                            {payment.paymentMethod}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="bg-gradient-to-br from-slate-50 to-green-50 dark:from-slate-800 dark:to-slate-900">
                <CardContent className="py-16 text-center">
                  <div className="inline-block p-4 rounded-full bg-green-500/10 mb-4">
                    <DollarSign className="w-12 h-12 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">No payment history yet</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
      </motion.div>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll lose access to premium
              features.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for cancellation (optional)</Label>
              <Textarea
                id="reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Let us know why you're cancelling..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to {selectedPlan?.displayName}</DialogTitle>
            <DialogDescription>
              Choose your billing cycle and confirm the upgrade
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Billing Cycle</Label>
              <div className="flex gap-2">
                <Button
                  variant={billingCycle === "MONTHLY" ? "default" : "outline"}
                  onClick={() => setBillingCycle("MONTHLY")}
                  className="flex-1"
                >
                  Monthly
                </Button>
                <Button
                  variant={billingCycle === "ANNUAL" ? "default" : "outline"}
                  onClick={() => setBillingCycle("ANNUAL")}
                  className="flex-1"
                >
                  Annual
                  <Badge className="ml-2 bg-green-500">Save 20%</Badge>
                </Button>
              </div>
            </div>
            {selectedPlan && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">You'll be charged</p>
                <p className="text-2xl font-bold">
                  {billingCycle === "MONTHLY"
                    ? selectedPlan.formattedMonthlyPrice
                    : selectedPlan.formattedAnnualPrice}
                </p>
                <p className="text-sm text-muted-foreground">
                  {billingCycle === "MONTHLY" ? "per month" : "per year"}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpgrade}>
              Confirm Upgrade
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default SubscriptionManagementPage;
