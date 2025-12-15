import React, {
  Suspense,
  useState,
  useEffect,
  createContext,
  useContext,
  startTransition,
} from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { AgoraChatProvider } from "@/contexts/AgoraChatContext";
import { TaskProvider } from "@/contexts/TaskContext";
import { AppProvider } from "@/contexts/AppContext";
import { VideoProvider } from "@/contexts/VideoContext";
import { ZegoCloudProvider } from "@/contexts/ZegoCloudContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Loader from "./components/layout/Loader";

// Simulate delay for suspense fallback
const simulateDelay = (importPromise: Promise<any>): Promise<{ default: React.ComponentType<any> }> =>
  new Promise((resolve) =>
    setTimeout(() => {
      importPromise.then((module) => resolve({ default: module.default }));
    }, 1000)
  );

// Lazy-loaded pages
const LandingPage = React.lazy(() => simulateDelay(import("./pages/LandingPage")));
const PricingPage = React.lazy(() => simulateDelay(import("./pages/PricingPage")));
const AuthPage = React.lazy(() => simulateDelay(import("./pages/AuthPage")));
const OAuthCallback = React.lazy(() => import("./pages/OAuthCallback"));
const Dashboard = React.lazy(() => simulateDelay(import("./pages/Dashboard")));
const ChatPage = React.lazy(() => simulateDelay(import("./pages/ChatPage")));
// VideoCall feature (lazy-loaded)
const VideoCall = React.lazy(() => simulateDelay(import("./pages/VideoCall")));
const CollaboratePage = React.lazy(() => simulateDelay(import("./pages/CollaboratePage")));
const NotesPage = React.lazy(() => simulateDelay(import("./pages/NotesPage")));
const TasksPage = React.lazy(() => simulateDelay(import("./pages/TasksPage")));
const ContactsPage = React.lazy(() => simulateDelay(import("./pages/ContactsPage")));
const EmailPage = React.lazy(() => simulateDelay(import("./pages/EmailPage")));
const SettingsPage = React.lazy(() => simulateDelay(import("./pages/SettingsPage")));
const SubscriptionPage = React.lazy(() => simulateDelay(import("./pages/SubscriptionPage")));
const NotFound = React.lazy(() => simulateDelay(import("./pages/NotFound")));

// Query client for React Query
const queryClient = new QueryClient();

// Loader fallback
const LoadingFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-transparent">
    <Loader />
  </div>
);



const DelayedSuspenseWithFetch = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return isLoading ? <LoadingFallback /> : children;
};

const ErrorBoundary = ({ children }) => (
  <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
);

const App = () => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <AgoraChatProvider>
              <ChatProvider>
                <TaskProvider>
                  <AppProvider>
                    <VideoProvider>
                      <ZegoCloudProvider>
                        <Toaster />
                        <Sonner />
                        <BrowserRouter>
                    <Routes>
                    {/* Public routes */}
                    <Route
                      path="/"
                      element={
                        <Suspense fallback={<LoadingFallback />}>
                          <LandingPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/pricing"
                      element={
                        <Suspense fallback={<LoadingFallback />}>
                          <PricingPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/auth"
                      element={
                        <Suspense fallback={<LoadingFallback />}>
                          <AuthPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/auth/callback"
                      element={
                        <Suspense fallback={<LoadingFallback />}>
                          <OAuthCallback />
                        </Suspense>
                      }
                    />

                    {/* Protected routes */}
                    <Route path="/*" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                      <Route path="dashboard" element={<ErrorBoundary><DelayedSuspenseWithFetch><Dashboard /></DelayedSuspenseWithFetch></ErrorBoundary>} />
                      <Route path="chat" element={<ErrorBoundary><DelayedSuspenseWithFetch><ChatPage /></DelayedSuspenseWithFetch></ErrorBoundary>} />
                      <Route path="video" element={<ErrorBoundary><DelayedSuspenseWithFetch><VideoCall /></DelayedSuspenseWithFetch></ErrorBoundary>} />
                      <Route path="collaborate" element={<ErrorBoundary><DelayedSuspenseWithFetch><CollaboratePage /></DelayedSuspenseWithFetch></ErrorBoundary>} />
                      <Route path="notes" element={<ErrorBoundary><DelayedSuspenseWithFetch><NotesPage /></DelayedSuspenseWithFetch></ErrorBoundary>} />
                      <Route path="tasks" element={<ErrorBoundary><DelayedSuspenseWithFetch><TasksPage /></DelayedSuspenseWithFetch></ErrorBoundary>} />
                      <Route path="contacts" element={<ErrorBoundary><DelayedSuspenseWithFetch><ContactsPage /></DelayedSuspenseWithFetch></ErrorBoundary>} />
                      <Route path="email" element={<ErrorBoundary><DelayedSuspenseWithFetch><EmailPage /></DelayedSuspenseWithFetch></ErrorBoundary>} />
                      <Route path="settings" element={<ErrorBoundary><DelayedSuspenseWithFetch><SettingsPage /></DelayedSuspenseWithFetch></ErrorBoundary>} />
                      <Route path="subscription" element={<ErrorBoundary><DelayedSuspenseWithFetch><SubscriptionPage /></DelayedSuspenseWithFetch></ErrorBoundary>} />
                      <Route path="*" element={<ErrorBoundary><DelayedSuspenseWithFetch><NotFound /></DelayedSuspenseWithFetch></ErrorBoundary>} />
                    </Route>
                  </Routes>
                      </BrowserRouter>
                    </ZegoCloudProvider>
                  </VideoProvider>
                </AppProvider>
              </TaskProvider>
            </ChatProvider>
          </AgoraChatProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
);

export default App;
