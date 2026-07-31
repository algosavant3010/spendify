import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, MailCheck, PieChart, Sparkles, TrendingUp, Wallet } from "lucide-react";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("mode") === "signup" ? "signup" : "signin");
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) navigate("/dashboard", { replace: true });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate("/dashboard", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = authSchema.parse({ email, password });
      if (!displayName.trim()) throw new Error("Please enter your name");
      setIsLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: { display_name: displayName.trim() },
        },
      });

      if (error) throw error;

      if (data.session) return;
      setIsAwaitingConfirmation(true);
      toast.success("Verification email sent. Open the link in your inbox.");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleResendVerification = async () => {
    if (!email) return toast.error("Enter your email address first");
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
      if (error) throw error;
      toast.success("A new verification email was sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resend the verification email");
    } finally {
      setIsLoading(false);
    }
  };


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = authSchema.parse({ email, password });
      setIsLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          setIsAwaitingConfirmation(true);
          await supabase.auth.resend({ type: "signup", email: validated.email });
          throw new Error("Please verify your email. We sent you a new confirmation link.");
        }
        throw error;
      }
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError ?? new Error("We couldn't verify your session. Please try again.");
      toast.success("Welcome back!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-transparent px-4 py-10 sm:px-6 sm:py-14 relative">
      <Link to="/" className="absolute left-4 top-4 sm:left-6 sm:top-6">
        <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" /> Back home</Button>
      </Link>
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        <div className="hidden lg:flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-sm bg-primary/10">
              <Wallet className="h-7 w-7 text-primary" strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-4xl">Spendify</h1>
          </div>

          <p className="text-lg text-muted-foreground max-w-[42ch] leading-relaxed">
            Smart expense tracking with AI-powered insights to help you make better financial decisions.
          </p>

          <div className="grid gap-5 mt-4">
            <div className="flex gap-4 items-start">
              <div className="p-2 rounded-sm bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-semibold">Real-time Analytics</h3>
                <p className="text-sm text-muted-foreground">Track your spending patterns with interactive charts</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2 rounded-sm bg-primary/10">
                <PieChart className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-semibold">Budget Management</h3>
                <p className="text-sm text-muted-foreground">Set budgets and get alerts when you're close to limits</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2 rounded-sm bg-warning/10">
                <Sparkles className="h-5 w-5 text-warning" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-semibold">AI Insights</h3>
                <p className="text-sm text-muted-foreground">Get personalised recommendations to save money</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="w-full max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="font-display text-3xl">{isAwaitingConfirmation ? "Verify your email" : "Welcome"}</CardTitle>
                <CardDescription>{isAwaitingConfirmation ? `We sent a confirmation link to ${email}` : "Sign in or create an account to get started"}</CardDescription>
              </CardHeader>

              <CardContent>
                {isAwaitingConfirmation ? (
                  <div className="space-y-6">
                    <div className="flex justify-center py-2"><MailCheck className="h-8 w-8 text-primary" /></div>
                    <p className="text-sm text-center text-muted-foreground">
                      Open the email and click <strong className="text-foreground">Confirm email address</strong>. You can then return here and sign in.
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <Button type="button" variant="ghost" size="sm" onClick={handleResendVerification} disabled={isLoading}>
                        {isLoading ? "Sending..." : "Resend email"}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setIsAwaitingConfirmation(false); setActiveTab("signin"); }}>Back to sign in</Button>
                    </div>
                  </div>
                ) : <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="mt-5">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-5">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Name</Label>
                        <Input id="signup-name" autoComplete="name" placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email" required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="new-password" required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Creating account..." : "Create Account"}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        We'll email you a secure link to verify your email address.
                      </p>
                    </form>
                  </TabsContent>
                </Tabs>}
              </CardContent>

        </Card>
      </div>
    </div>
  );
};

export default Auth;




