"use client"

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  text?: string
  showProgress?: boolean
  progress?: number
}

export default function LoadingSpinner({ 
  size = "md", 
  className,
  text,
  showProgress = false,
  progress = 0
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className={cn(
        "border-4 border-primary-brand border-t-transparent rounded-full animate-spin",
        sizeClasses[size]
      )} />
      
      {text && (
        <div className="text-primary-brand text-center">
          <div className="font-medium text-lg mb-2">{text}</div>
          
          {showProgress && (
            <div className="space-y-2">
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-brand h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-sm">{Math.round(progress)}%</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
