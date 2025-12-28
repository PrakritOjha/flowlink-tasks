import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);
    if (!error) {
      navigate('/');
    }
  };

  const onSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.displayName);
    setIsLoading(false);
    if (!error) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/20">
            <Link2 className="w-8 h-8 text-primary" />
          </div>
          <span className="text-3xl font-bold text-foreground">TaskLink</span>
        </div>

        {/* Auth Card */}
        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            {isSignUp
              ? 'Start managing your projects with visual dependencies'
              : 'Sign in to continue to your boards'}
          </p>

          {isSignUp ? (
            <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-foreground/90">Name</Label>
                <Input
                  id="displayName"
                  placeholder="Your name"
                  className="bg-foreground/5 border-border/30 text-foreground"
                  {...signUpForm.register('displayName')}
                />
                {signUpForm.formState.errors.displayName && (
                  <p className="text-sm text-destructive">{signUpForm.formState.errors.displayName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/90">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="bg-foreground/5 border-border/30 text-foreground"
                  {...signUpForm.register('email')}
                />
                {signUpForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground/90">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-foreground/5 border-border/30 text-foreground"
                  {...signUpForm.register('password')}
                />
                {signUpForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground/90">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="bg-foreground/5 border-border/30 text-foreground"
                  {...signUpForm.register('confirmPassword')}
                />
                {signUpForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{signUpForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          ) : (
            <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-foreground/90">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="you@example.com"
                  className="bg-foreground/5 border-border/30 text-foreground"
                  {...signInForm.register('email')}
                />
                {signInForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-foreground/90">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-foreground/5 border-border/30 text-foreground"
                  {...signInForm.register('password')}
                />
                {signInForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;