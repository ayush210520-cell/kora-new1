"use client"

import React, { useState, useEffect } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

interface PhoneRegistrationFlowProps {
  onSuccess: (data: any) => void;
  onCancel?: () => void;
  isOpen?: boolean;
}

export function PhoneRegistrationFlow({ onSuccess, onCancel, isOpen = true }: PhoneRegistrationFlowProps) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  
  // Registration form fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { toast } = useToast();
  const { completePhoneRegistration } = useAuth();

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && otpSent) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, otpSent]);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.sendOtp(phone);
      
      if (response.success) {
        setOtpSent(true);
        setCountdown(60); // 60 seconds countdown
        setCanResend(false);
        toast({
          title: "OTP Sent",
          description: "OTP has been sent to your phone number",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.verifyOtp(phone, otp);
      
      if (response.success) {
        if (response.requiresRegistration) {
          // New user - show registration form
          setOtpVerified(true);
          toast({
            title: "Phone Verified",
            description: "Please complete your registration",
          });
        } else {
          // Existing user - login successful
          toast({
            title: "Login Successful",
            description: "Welcome back!",
          });
          onSuccess(response);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    try {
      const response = await authAPI.resendOtp(phone);
      
      if (response.success) {
        setCountdown(60);
        setCanResend(false);
        setOtp('');
        toast({
          title: "OTP Resent",
          description: "New OTP has been sent to your phone number",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    // Validation
    if (!email || !name || !password || !confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await completePhoneRegistration({
        phone,
        email,
        name,
        password
      });
      
      toast({
        title: "Registration Successful",
        description: "Welcome to KORAKAGAZ!",
      });
      onSuccess({ success: true, message: "Registration completed successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete registration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToOTP = () => {
    setOtpVerified(false);
    setOtp('');
    setCountdown(0);
    setCanResend(false);
  };

  const handleReset = () => {
    setPhone('');
    setOtp('');
    setOtpSent(false);
    setOtpVerified(false);
    setCountdown(0);
    setCanResend(false);
    setEmail('');
    setName('');
    setPassword('');
    setConfirmPassword('');
  };

  if (!isOpen) return null;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {!otpSent ? "Enter Phone Number" : 
           !otpVerified ? "Verify OTP" : "Complete Registration"}
        </CardTitle>
        <CardDescription>
          {!otpSent ? "Enter your phone number to receive OTP" :
           !otpVerified ? "Enter the 6-digit OTP sent to your phone" :
           "Please provide your details to complete registration"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!otpSent ? (
          // Step 1: Phone Number Input ONLY
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={handleSendOTP} 
              disabled={isLoading || phone.length < 10}
              className="w-full"
            >
              {isLoading ? "Sending..." : "Send OTP & Continue"}
            </Button>
          </div>
        ) : !otpVerified ? (
          // Step 2: OTP Verification
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <InputOTP
                value={otp}
                onChange={setOtp}
                maxLength={6}
                disabled={isLoading}
                className="justify-center"
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {countdown > 0 ? `Resend in ${countdown}s` : "OTP expired"}
              </span>
              <Button
                variant="link"
                size="sm"
                onClick={handleResendOTP}
                disabled={!canResend || isLoading}
                className="p-0 h-auto"
              >
                Resend OTP
              </Button>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleBackToOTP}
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleVerifyOTP} 
                disabled={isLoading || otp.length !== 6}
                className="flex-1"
              >
                {isLoading ? "Verifying..." : "Verify OTP & Continue"}
              </Button>
            </div>
          </div>
        ) : (
          // Step 3: Registration Form
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleBackToOTP}
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleCompleteRegistration} 
                disabled={isLoading || !email || !name || !password || !confirmPassword}
                className="flex-1"
              >
                {isLoading ? "Creating Account..." : "Complete Registration"}
              </Button>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <Button
            variant="ghost"
            onClick={handleReset}
            disabled={isLoading}
            className="flex-1"
          >
            Start Over
          </Button>
          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
