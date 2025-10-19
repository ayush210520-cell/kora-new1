"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Phone, User, Eye, EyeOff, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { config } from "@/lib/config";

// Debounce hook for performance
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized input component for better performance
const MemoizedInput = React.memo(({ 
  icon: Icon, 
  type, 
  name, 
  placeholder, 
  value, 
  onChange, 
  required, 
  autoComplete, 
  className = "pl-10 text-primary-brand",
  ...props 
}: any) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Icon className="h-5 w-5 text-primary-brand" />
    </div>
    <Input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={className}
      required={required}
      autoComplete={autoComplete}
      {...props}
    />
  </div>
));

MemoizedInput.displayName = 'MemoizedInput';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { login, register, loginWithGoogle, isLoading: authLoading } = useAuth();
  
  // Optimized state management
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [showForgetPassword, setShowForgetPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  
  // Memoized form data to prevent unnecessary re-renders
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });

  // Debounced email for validation
  const debouncedEmail = useDebounce(formData.email, 500);
  
  // Refs for performance
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Memoized input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Memoized Google sign-in handler
  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsGoogleLoading(true);
      console.log('🔄 Starting Google sign-in process...');
      
      await loginWithGoogle();
      console.log("✅ Google sign-in successful");
      
      // Close modal after successful login
      onClose();
      
    } catch (err: any) {
      console.error("❌ Google Sign-in Error:", err);
      let errorMessage = "Google sign-in failed";
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  }, [loginWithGoogle, onClose]);

  // Memoized form submission handlers
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    
    setIsLoginLoading(true);
    try {
      await login(formData.email, formData.password);
      onClose();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoginLoading(false);
    }
  }, [formData.email, formData.password, login, onClose]);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name || !formData.phone) return;
    
    setIsRegisterLoading(true);
    try {
      await register(formData.name, formData.email, formData.password, formData.phone);
      onClose();
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setIsRegisterLoading(false);
    }
  }, [formData, register, onClose]);

  // Optimized forget password handler
  const handleForgetPassword = useCallback(async () => {
    if (!formData.email) {
      alert('Please enter your email address');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🔄 Processing forgot password request...');
      
      const response = await fetch(`${config.apiUrl}/api/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Password reset email sent successfully');
        
        // Show success popup immediately
        alert(`✅ Password reset email sent to: ${formData.email}\n\nPlease check your email and click the reset link.`);
        
        // Close forget password modal and reset form
        setShowForgetPassword(false);
        setFormData(prev => ({ ...prev, email: '' }));
        
      } else {
        const errorData = await response.json();
        console.error('❌ Password reset failed:', errorData);
        
        if (response.status === 404) {
          alert(`❌ Email "${formData.email}" not found.\n\nPlease check the email address or sign up for a new account.`);
        } else {
          alert(`❌ Failed to send reset email: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (err: any) {
      console.error("❌ Forgot Password Error:", err);
      alert('❌ Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [formData.email]);

  // Memoized tab change handler
  const handleTabChange = useCallback((value: string) => {
    setIsLogin(value === 'login');
    setShowForgetPassword(false);
    // Reset form when switching tabs
    setFormData({
      email: '',
      password: '',
      name: '',
      phone: ''
    });
  }, []);

  // Memoized forget password toggle
  const toggleForgetPassword = useCallback(() => {
    setShowForgetPassword(!showForgetPassword);
    if (!showForgetPassword) {
      // Focus email input when opening forget password
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [showForgetPassword]);

  // Auto-focus optimization
  useEffect(() => {
    if (isOpen && !showForgetPassword) {
      const timer = setTimeout(() => {
        if (isLogin) {
          emailInputRef.current?.focus();
        } else {
          emailInputRef.current?.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isLogin, showForgetPassword]);

  // Memoized modal content to prevent unnecessary re-renders
  const modalContent = useMemo(() => {
    if (showForgetPassword) {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset Password</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter your email address and we'll send you a reset link.
            </p>
          </div>
          
          <div className="space-y-4">
            <MemoizedInput
              ref={emailInputRef}
              icon={Mail}
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              required
              autoComplete="email"
            />
            
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleForgetPassword}
                className="flex-1 bg-primary-brand hover:bg-primary-brand/90 text-white font-medium py-3 rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Button
                type="button"
                onClick={toggleForgetPassword}
                variant="outline"
                className="px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Tabs value={isLogin ? "login" : "signup"} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        {/* LOGIN TAB */}
        <TabsContent value="login" className="space-y-4">
          {/* Google Sign-In Button */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl border border-gray-300 transform transition-transform duration-200 hover:scale-105 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <MemoizedInput
              ref={emailInputRef}
              icon={Mail}
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              required
              autoComplete="email"
            />

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-primary-brand" />
              </div>
              <Input
                ref={passwordInputRef}
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className="pl-10 pr-10 text-primary-brand"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center z-10 text-primary-brand"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary-brand hover:bg-primary-brand text-white font-medium py-3 rounded-xl transform transition-transform duration-200 hover:scale-105"
              disabled={isLoginLoading || authLoading}
            >
              {isLoginLoading || authLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={toggleForgetPassword}
                className="text-sm text-primary-brand hover:underline"
              >
                Forgot your password?
              </button>
            </div>
          </form>
        </TabsContent>

        {/* SIGNUP TAB */}
        <TabsContent value="signup" className="space-y-4">
          {/* Google Sign-In Button */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl border border-gray-300 transform transition-transform duration-200 hover:scale-105 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
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
            {isGoogleLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <MemoizedInput
              icon={User}
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleInputChange}
              required
              autoComplete="name"
            />

            <MemoizedInput
              icon={Mail}
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              required
              autoComplete="email"
            />

            <MemoizedInput
              icon={Phone}
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleInputChange}
              required
              autoComplete="tel"
            />

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-primary-brand" />
              </div>
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className="pl-10 pr-10 text-primary-brand"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center z-10 text-primary-brand"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>



            <Button
              type="submit"
              className="w-full bg-primary-brand hover:bg-primary-brand text-white font-medium py-3 rounded-xl transform transition-transform duration-200 hover:scale-105"
              disabled={isRegisterLoading || authLoading}
            >
              {isRegisterLoading || authLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    );
  }, [showForgetPassword, isLogin, formData, isLoading, isGoogleLoading, isLoginLoading, isRegisterLoading, authLoading, handleInputChange, handleLogin, handleRegister, handleTabChange, handleForgetPassword, toggleForgetPassword, handleGoogleSignIn]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="auth-modal-description">
        <DialogHeader>
          <DialogTitle className="text-primary-brand">
            Welcome to KORAKAGAZ
          </DialogTitle>
          <DialogDescription id="auth-modal-description" className="text-gray-600">
            {isLogin ? "Sign in to your account to continue" : "Create a new account to get started"}
          </DialogDescription>
        </DialogHeader>

        {modalContent}
      </DialogContent>
    </Dialog>
  );
}