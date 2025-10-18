"use client"

import React, { useState, useEffect } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';

interface PhoneOTPVerificationProps {
  onSuccess: (data: any) => void;
  onCancel?: () => void;
  isOpen?: boolean;
}

export function PhoneOTPVerification({ onSuccess, onCancel, isOpen = true }: PhoneOTPVerificationProps) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();

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
      const response = await authAPI.post('/otp/send', { phone });
      
      if (response.data.success) {
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
        description: error.response?.data?.error || "Failed to send OTP",
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
      const response = await authAPI.post('/otp/verify', { phone, otp });
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Phone number verified successfully",
        });
        onSuccess(response.data);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to verify OTP",
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
      const response = await authAPI.post('/otp/resend', { phone });
      
      if (response.data.success) {
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
        description: error.response?.data?.error || "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Phone Verification</CardTitle>
        <CardDescription>
          {otpSent 
            ? "Enter the 6-digit OTP sent to your phone"
            : "Enter your phone number to receive OTP"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!otpSent ? (
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
              {isLoading ? "Sending..." : "Send OTP"}
            </Button>
          </div>
        ) : (
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
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setCountdown(0);
                  setCanResend(false);
                }}
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
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>
            </div>
          </div>
        )}

        {onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full"
          >
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

