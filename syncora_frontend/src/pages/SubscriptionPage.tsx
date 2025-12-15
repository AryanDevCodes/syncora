import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Check,
  CreditCard,
  DollarSign,
  RefreshCw,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";

import {
  getAllPlans,
  getCurrentSubscription,
  getPaymentHistory,
  getSubscriptionHistory,
  upgradeSubscription,
  cancelSubscription,
  reactivateSubscription,
  type PaymentHistory,
  type PricingPlan as ApiPricingPlan,
  type Subscription,
} from "@/api/subscriptionApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);

const formatDate = (value?: string) => {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const statusBadgeClass = (status?: string) => {
  const normalized = status?.toUpperCase() ?? "INACTIVE";

  switch (normalized) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "TRIALING":
      return "bg-indigo-50 text-indigo-700 border border-indigo-200";
    case "CANCELLED":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

const SubscriptionManagementPage: React.FC = () => {
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<ApiPricingPlan[]>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<Subscription[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ApiPricingPlan | null>(null);
  const manageRef = useRef<HTMLDivElement | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    void loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [plans, subscription, history, payments] = await Promise.all([
        getAllPlans(),
        getCurrentSubscription(),
        getSubscriptionHistory(),
        getPaymentHistory(),
      ]);

      const orderedPlans = [...plans].sort((a, b) => a.displayOrder - b.displayOrder);

      setAvailablePlans(orderedPlans);
      setCurrentSubscription(subscription);
      setSubscriptionHistory(history);
      setPaymentHistory(payments);
      setBillingCycle(subscription?.billingCycle === "ANNUAL" ? "ANNUAL" : "MONTHLY");
    } catch (error) {
      console.error("Failed to load subscription data", error);
      toast({
        title: "Unable to load subscriptions",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshMeta = async () => {
    try {
      const [subscription, history, payments] = await Promise.all([
        getCurrentSubscription(),
        getSubscriptionHistory(),
        getPaymentHistory(),
      ]);

      setCurrentSubscription(subscription);
      setSubscriptionHistory(history);
      setPaymentHistory(payments);
      setBillingCycle(subscription?.billingCycle === "ANNUAL" ? "ANNUAL" : "MONTHLY");
    } catch (error) {
      console.error("Failed to refresh subscription data", error);
    }
  };

  const openUpgradeDialog = (plan: ApiPricingPlan) => {
    setSelectedPlan(plan);
    setBillingCycle(currentSubscription?.billingCycle === "ANNUAL" ? "ANNUAL" : "MONTHLY");
    setShowUpgradeDialog(true);
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;
    setActionLoading(true);
    try {
      await upgradeSubscription({ newPlanId: selectedPlan.id, billingCycle });
      toast({ title: "Plan updated", description: `${selectedPlan.displayName} activated.` });
      setShowUpgradeDialog(false);
      await refreshMeta();
    } catch (error) {
      console.error("Upgrade failed", error);
      toast({
        title: "Upgrade failed",
        description: "Something went wrong while updating your plan.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await cancelSubscription(cancelReason || undefined);
      toast({ title: "Subscription cancelled", description: "You can reactivate anytime." });
      setShowCancelDialog(false);
      setCancelReason("");
      await refreshMeta();
    } catch (error) {
      console.error("Cancellation failed", error);
      toast({
        title: "Cancellation failed",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    setActionLoading(true);
    try {
      await reactivateSubscription();
      toast({ title: "Subscription reactivated", description: "Welcome back to premium features." });
      await refreshMeta();
    } catch (error) {
      console.error("Reactivation failed", error);
      toast({
        title: "Reactivation failed",
        description: "We couldn't reactivate your plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const planOrder = (planId: string) => availablePlans.findIndex((plan) => plan.id === planId);
  const isCurrentPlan = (plan: ApiPricingPlan) => currentSubscription?.plan.id === plan.id;
  const isDowngrade = (plan: ApiPricingPlan) => {
    if (!currentSubscription) return false;
    return planOrder(plan.id) < planOrder(currentSubscription.plan.id);
  };

  const scrollToManage = () => {
    manageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const currentPrice = () => {
    if (!currentSubscription) return "Free";
    if (currentSubscription.plan.name === "STARTER") return "Free";
    return currentSubscription.billingCycle === "ANNUAL"
      ? currentSubscription.plan.formattedAnnualPrice
      : currentSubscription.plan.formattedMonthlyPrice;
  };

  const primaryCta = currentSubscription ? "Change plan" : "View plans";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading your subscription…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Subscription</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={scrollToManage}>{primaryCta}</Button>
            <Button onClick={() => navigate("/dashboard")}>Go to dashboard</Button>
          </div>
        </div>

        <Card className="overflow-hidden border-0 bg-gradient-to-r from-slate-900 to-indigo-800 text-white shadow-xl">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
                  <Sparkles className="h-4 w-4" />
                  {currentSubscription ? "Your current plan" : "No active subscription"}
                </div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-semibold">
                    {currentSubscription ? currentSubscription.plan.displayName : "Choose a plan"}
                  </h2>
                  <Badge className={"text-xs font-semibold " + statusBadgeClass(currentSubscription?.status)}>
                    {currentSubscription ? currentSubscription.status : "INACTIVE"}
                  </Badge>
                </div>
                <p className="max-w-2xl text-sm text-white/80">
                  {currentSubscription
                    ? currentSubscription.plan.description
                    : "Select the plan that fits your team and unlock collaborative features, calling, and storage."}
                </p>
                {currentSubscription && (
                  <div className="flex flex-wrap gap-3 text-sm text-white/80">
                    <span>{currentSubscription.plan.maxTeamMembersDisplay}</span>
                    <span className="opacity-60">•</span>
                    <span>{currentSubscription.plan.storageQuotaDisplay} storage</span>
                    <span className="opacity-60">•</span>
                    <span>{currentSubscription.plan.videoCallDurationDisplay} video calls</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-3 text-right">
                <div>
                  <p className="text-sm text-white/70">Current cost</p>
                  <p className="text-3xl font-semibold">{currentPrice()}</p>
                  {currentSubscription && (
                    <p className="text-xs text-white/60">
                      Billed {currentSubscription.billingCycle === "ANNUAL" ? "annually" : "monthly"}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {currentSubscription?.status === "CANCELLED" ? (
                    <Button onClick={handleReactivate} disabled={actionLoading} variant="secondary">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reactivate
                    </Button>
                  ) : (
                    <Button onClick={scrollToManage} variant="secondary">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Upgrade
                    </Button>
                  )}
                  {currentSubscription && currentSubscription.plan.name !== "STARTER" && currentSubscription.status !== "CANCELLED" && (
                    <Button
                      variant="outline"
                      className="bg-rose-50 text-rose-900 hover:bg-rose-500"
                      onClick={() => setShowCancelDialog(true)}
                      disabled={actionLoading}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Card className="bg-white/10 text-white border-0 shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/70">Next billing</p>
                      <p className="text-lg font-semibold">
                        {currentSubscription?.plan.name === "STARTER"
                          ? "No renewal"
                          : formatDate(currentSubscription?.endDate)}
                      </p>
                    </div>
                    <Calendar className="h-5 w-5 text-white/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 text-white border-0 shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/70">Billing cycle</p>
                      <p className="text-lg font-semibold">
                        {currentSubscription ? currentSubscription.billingCycle.toLowerCase() : "Monthly"}
                      </p>
                    </div>
                    <CreditCard className="h-5 w-5 text-white/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 text-white border-0 shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/70">Status</p>
                      <p className="text-lg font-semibold capitalize">{currentSubscription?.status ?? "Inactive"}</p>
                    </div>
                    <DollarSign className="h-5 w-5 text-white/80" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm" ref={manageRef}>
          <CardHeader className="pb-3">
            <CardTitle>Manage</CardTitle>
            <CardDescription>Select a plan, review history, or view payments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="plans" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-xl bg-slate-50 p-1">
                <TabsTrigger value="plans" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <CreditCard className="mr-2 h-4 w-4" /> Plans
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Calendar className="mr-2 h-4 w-4" /> History
                </TabsTrigger>
                <TabsTrigger value="payments" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <DollarSign className="mr-2 h-4 w-4" /> Payments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="plans" className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {availablePlans.map((plan) => (
                    <Card
                      key={plan.id}
                      className={`h-full rounded-xl border ${plan.isPopular ? "border-indigo-200 shadow-md" : ""}`}
                    >
                      <CardHeader className="space-y-2 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-xl text-slate-900">{plan.displayName}</CardTitle>
                          {plan.isPopular && <Badge className="bg-indigo-100 text-indigo-700">Popular</Badge>}
                        </div>
                        <CardDescription>{plan.description}</CardDescription>
                        <div>
                          <p className="text-3xl font-semibold text-slate-900">{plan.formattedMonthlyPrice}</p>
                          <p className="text-sm text-muted-foreground">per user / month</p>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm text-slate-700">
                          {plan.features.slice(0, 5).map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                        <Button
                          className="w-full"
                          variant={plan.isPopular ? "default" : "outline"}
                          disabled={isCurrentPlan(plan) || isDowngrade(plan) || actionLoading}
                          onClick={() => openUpgradeDialog(plan)}
                        >
                          {isCurrentPlan(plan)
                            ? "Current plan"
                            : isDowngrade(plan)
                            ? "Downgrade not available"
                            : "Select plan"}
                          {!isCurrentPlan(plan) && !isDowngrade(plan) && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-6 space-y-3">
                {subscriptionHistory.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="py-10 text-center text-muted-foreground">
                      No subscription history yet.
                    </CardContent>
                  </Card>
                )}

                {subscriptionHistory.map((entry) => (
                  <Card key={entry.id} className="shadow-sm">
                    <CardContent className="flex items-center justify-between gap-4 py-4">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-indigo-600" />
                        <div>
                          <p className="font-semibold text-slate-900">{entry.plan.displayName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(entry.startDate)} — {formatDate(entry.endDate)}
                          </p>
                        </div>
                      </div>
                      <Badge className={`px-3 py-1 text-xs ${statusBadgeClass(entry.status)}`}>{entry.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="payments" className="mt-6 space-y-3">
                {paymentHistory.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="py-10 text-center text-muted-foreground">No payments yet.</CardContent>
                  </Card>
                )}

                {paymentHistory.map((payment) => (
                  <Card key={payment.id} className="shadow-sm">
                    <CardContent className="flex items-center justify-between gap-4 py-4">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="font-semibold text-slate-900">{formatCurrency(payment.amount, payment.currency)}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(payment.paidAt || payment.createdAt)}
                          </p>
                          <p className="text-sm text-muted-foreground">{payment.description}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge className={`px-3 py-1 text-xs ${statusBadgeClass(payment.status)}`}>{payment.status}</Badge>
                        <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                          <CreditCard className="h-3 w-3" />
                          {payment.paymentMethod}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel subscription</DialogTitle>
              <DialogDescription>
                You will keep access until the end of the current period. Tell us why you're leaving (optional).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for cancellation</Label>
                <Textarea
                  id="reason"
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  placeholder="Let us know how we can improve"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={actionLoading}>
                Keep subscription
              </Button>
              <Button variant="destructive" onClick={handleCancel} disabled={actionLoading}>
                Cancel subscription
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upgrade to {selectedPlan?.displayName}</DialogTitle>
              <DialogDescription>Choose your billing cycle and confirm the upgrade.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Billing cycle</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={billingCycle === "MONTHLY" ? "default" : "outline"}
                    onClick={() => setBillingCycle("MONTHLY")}
                    disabled={actionLoading}
                  >
                    Monthly
                  </Button>
                  <Button
                    variant={billingCycle === "ANNUAL" ? "default" : "outline"}
                    onClick={() => setBillingCycle("ANNUAL")}
                    disabled={actionLoading}
                  >
                    Annual
                    <Badge className="ml-2 bg-emerald-100 text-emerald-700">Save 20%</Badge>
                  </Button>
                </div>
              </div>

              {selectedPlan && (
                <div className="rounded-lg border bg-slate-50 p-4">
                  <p className="text-sm text-muted-foreground">You will be charged</p>
                  <p className="text-2xl font-semibold text-slate-900">
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
              <Button variant="outline" onClick={() => setShowUpgradeDialog(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button onClick={handleUpgrade} disabled={actionLoading || !selectedPlan}>
                Confirm upgrade
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SubscriptionManagementPage;
