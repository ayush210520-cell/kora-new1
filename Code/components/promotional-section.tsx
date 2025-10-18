"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function PromotionalSection() {
  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-primary-brand mb-8">
          STAY IN THE LOOP!
        </h2>
        
        {/* Description */}
        <p className="text-lg md:text-xl text-primary-brand mb-12 max-w-2xl mx-auto">
          Get insider access to deals and offers we don't post anywhere else, delivered straight to your inbox.
        </p>
        
        {/* Email Subscription Form */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
          <Input
            type="email"
            placeholder="E-mail"
            className="flex-1 border-gray-300 focus:border-primary-brand focus:ring-primary-brand text-base"
          />
          <Button 
            className="bg-primary-brand hover:bg-primary-brand/90 text-white px-8 py-2 text-base font-semibold uppercase"
          >
            Subscribe
          </Button>
        </div>
      </div>
    </section>
  )
}
