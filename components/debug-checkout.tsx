"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { addressAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugCheckout() {
  const { user, isAuthenticated } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebugTest = async () => {
    setIsLoading(true);
    setDebugInfo(null);

    try {
      const info: any = {
        timestamp: new Date().toISOString(),
        user: {
          isAuthenticated,
          user: user ? {
            id: user.id,
            email: user.email,
            name: user.name
          } : null
        },
        localStorage: {
          token: typeof window !== 'undefined' ? localStorage.getItem('token') : 'N/A',
          user: typeof window !== 'undefined' ? localStorage.getItem('user') : 'N/A'
        },
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'Not set'
      };

      // Test address creation
      if (isAuthenticated && user) {
        try {
          console.log('🧪 Testing address creation...');
          const response = await addressAPI.create({
            name: 'Debug Test Address',
            phone: '9876543210',
            address: '123 Debug Street',
            city: 'Debug City',
            state: 'Debug State',
            pincode: '123456',
            landmark: 'Debug Landmark'
          });
          
          info.addressTest = {
            success: true,
            addressId: response.address.id,
            response: response
          };
        } catch (error: any) {
          info.addressTest = {
            success: false,
            error: {
              message: error.message,
              status: error.status,
              errorData: error.errorData,
              url: error.url
            }
          };
        }
      } else {
        info.addressTest = {
          success: false,
          error: 'User not authenticated'
        };
      }

      setDebugInfo(info);
    } catch (error: any) {
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto p-6">
      <CardHeader>
        <CardTitle>🔧 Checkout Debug Tool</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={runDebugTest} 
          disabled={isLoading}
          className="mb-4"
        >
          {isLoading ? 'Running Debug Test...' : 'Run Debug Test'}
        </Button>

        {debugInfo && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Debug Results:</h3>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

