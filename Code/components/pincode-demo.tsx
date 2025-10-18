"use client";

import { useState } from "react";
import { usePincodeLookup } from "@/hooks/use-pincode-lookup";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MapPin, CheckCircle, XCircle } from "lucide-react";

export default function PincodeDemo() {
  const [pincode, setPincode] = useState("");
  const { isLoading, error, lookupPincode, clearError } = usePincodeLookup();

  const handleLookup = async () => {
    if (pincode.length !== 6) {
      alert("Please enter a valid 6-digit pincode");
      return;
    }

    clearError();
    const result = await lookupPincode(pincode);
    
    if (result) {
      console.log("Pincode lookup result:", result);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Pincode Lookup Demo
          </CardTitle>
          <CardDescription>
            Enter a 6-digit Indian pincode to automatically fetch city and state information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Pincode</label>
            <div className="relative">
              <Input
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit pincode"
                maxLength={6}
                className="pr-10"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
              {!isLoading && pincode.length === 6 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={handleLookup}
            disabled={isLoading || pincode.length !== 6}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Looking up...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Lookup Location
              </>
            )}
          </Button>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">How it works:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Enter any valid 6-digit Indian pincode</li>
              <li>• Click "Lookup Location" or wait for auto-fill</li>
              <li>• City and state will be automatically filled</li>
              <li>• Works in both checkout forms</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-700 mb-2">Test Pincodes:</h4>
            <div className="text-sm text-blue-600 space-y-1">
              <p>• 110001 - New Delhi, Delhi</p>
              <p>• 400001 - Mumbai, Maharashtra</p>
              <p>• 560001 - Bangalore, Karnataka</p>
              <p>• 700001 - Kolkata, West Bengal</p>
              <p>• 600001 - Chennai, Tamil Nadu</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
