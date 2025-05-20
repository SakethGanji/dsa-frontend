import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useLogin } from '../../hooks/use-auth';

const COMPANY_NAME = '';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginMutation = useLogin({
    onSuccess: () => {
      toast({
        title: 'Login successful',
        description: 'You have been logged in successfully.',
      });
      navigate({ to: '/' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Login failed',
        description: error.message || 'An error occurred during login. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
      <div className="flex min-h-screen">
        {/* Left side: Branding / Company name */}
        <div className="w-1/2 bg-gray-50 flex items-center justify-center">
          <h1 className="text-5xl font-extrabold text-gray-800">{COMPANY_NAME}</h1>
        </div>
        {/* Right side: Login form */}
        <div className="w-1/2 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                      id="username"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-center mt-6">
                <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? 'Logging in...' : 'Login'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
  );
}
