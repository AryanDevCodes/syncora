import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Github, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';
const OAUTH_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8081';

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signup } = useAuth();
  const { toast } = useToast();
  
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [activeTab, setActiveTab] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Signup form state
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!loginEmail || !loginPassword) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all fields',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail)) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter a valid email address',
      });
      return;
    }

    setLoginLoading(true);
    
    try {
      await login(loginEmail, loginPassword);
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in',
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error?.response?.data?.message || 'Invalid email or password. Please try again.',
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!signupFirstName || !signupLastName || !signupEmail || !signupPassword) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all fields',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail)) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter a valid email address',
      });
      return;
    }

    if (signupPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Password must be at least 8 characters',
      });
      return;
    }

    setSignupLoading(true);
    
    try {
      await signup(signupFirstName, signupLastName, signupEmail, signupPassword);
      
      toast({
        title: 'Account Created!',
        description: 'Welcome to Syncora! Your account has been created successfully.',
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error?.response?.data?.message || 'Failed to create account. Please try again.',
      });
    } finally {
      setSignupLoading(false);
    }
  };

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    // Use window.location.href for OAuth redirect
    window.location.href = `${OAUTH_BASE_URL}/oauth2/authorization/${provider}`;
  };

  const handleDemoLogin = () => {
    setLoginEmail('demo@syncora.com');
    setLoginPassword('demo123');
    
    toast({
      title: 'Demo credentials loaded',
      description: 'Click Sign In to continue with demo account',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8 animate-fade-in">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Syncora
              </h1>
              <p className="text-sm text-muted-foreground">Collaborate without limits</p>
            </div>
          </Link>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-1">
            <div className="bg-background rounded-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Link 
                    to="/" 
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to home
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    Secure
                  </div>
                </div>
                <CardTitle className="text-2xl">
                  {activeTab === 'login' ? 'Welcome back' : 'Create your account'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'login' 
                    ? 'Sign in to continue to your workspace' 
                    : 'Get started with Syncora'
                  }
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                    <TabsTrigger 
                      value="login" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  {/* Login Tab */}
                  <TabsContent value="login" className="space-y-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-sm font-medium">
                          Email address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="pl-10 h-11"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password" className="text-sm font-medium">
                            Password
                          </Label>
                          <a 
                            href="#" 
                            className="text-xs text-primary hover:underline transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              toast({
                                title: 'Feature Coming Soon',
                                description: 'Password reset will be available soon.',
                              });
                            }}
                          >
                            Forgot password?
                          </a>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="pl-10 pr-10 h-11"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="remember-me"
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <Label
                          htmlFor="remember-me"
                          className="ml-2 block text-sm text-muted-foreground cursor-pointer"
                        >
                          Remember me for 30 days
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                        disabled={loginLoading}
                      >
                        {loginLoading ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </form>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/50" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-background px-3 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOAuthLogin('github')}
                        className="h-11 hover:bg-muted"
                      >
                        <Github className="w-5 h-5 mr-2" />
                        GitHub
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOAuthLogin('google')}
                        className="h-11 hover:bg-muted"
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Google
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Signup Tab */}
                  <TabsContent value="signup" className="space-y-6">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-firstname" className="text-sm font-medium">
                            First name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="signup-firstname"
                              type="text"
                              placeholder="John"
                              value={signupFirstName}
                              onChange={(e) => setSignupFirstName(e.target.value)}
                              className="pl-10 h-11"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-lastname" className="text-sm font-medium">
                            Last name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="signup-lastname"
                              type="text"
                              placeholder="Doe"
                              value={signupLastName}
                              onChange={(e) => setSignupLastName(e.target.value)}
                              className="pl-10 h-11"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm font-medium">
                          Email address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            className="pl-10 h-11"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm font-medium">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type={showSignupPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="pl-10 pr-10 h-11"
                            required
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showSignupPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Must be at least 8 characters with letters and numbers
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <input
                            id="terms"
                            type="checkbox"
                            className="h-4 w-4 mt-1 rounded border-border text-primary focus:ring-primary"
                            required
                          />
                          <label htmlFor="terms" className="text-sm text-muted-foreground">
                            I agree to the{' '}
                            <a href="#" className="text-primary hover:underline">
                              Terms of Service
                            </a>{' '}
                            and{' '}
                            <a href="#" className="text-primary hover:underline">
                              Privacy Policy
                            </a>
                          </label>
                        </div>

                        <div className="flex items-start gap-3">
                          <input
                            id="newsletter"
                            type="checkbox"
                            className="h-4 w-4 mt-1 rounded border-border text-primary focus:ring-primary"
                          />
                          <label htmlFor="newsletter" className="text-sm text-muted-foreground">
                            Send me product updates, tips, and offers
                          </label>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                        disabled={signupLoading}
                      >
                        {signupLoading ? 'Creating account...' : 'Create Account'}
                      </Button>
                    </form>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/50" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-background px-3 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOAuthLogin('github')}
                        className="h-11 hover:bg-muted"
                      >
                        <Github className="w-5 h-5 mr-2" />
                        GitHub
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOAuthLogin('google')}
                        className="h-11 hover:bg-muted"
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Google
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'login' ? (
                      <>
                        Don't have an account?{' '}
                        <button
                          onClick={() => setActiveTab('signup')}
                          className="text-primary hover:underline font-medium"
                        >
                          Sign up for free
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <button
                          onClick={() => setActiveTab('login')}
                          className="text-primary hover:underline font-medium"
                        >
                          Sign in
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            Your data is protected with enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;