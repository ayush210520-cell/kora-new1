"use client"

import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import AuthModal from "./auth-modal"
import { Button } from "@/components/ui/button"
import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"

export default function CartPage() {
  const { state, updateQuantity, removeFromCart, clearCart } = useCart()
  const { isAuthenticated } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const router = useRouter()
  
  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      updateQuantity(id, newQuantity)
    }
  }

  const handleRemoveItem = (id: string) => {
    removeFromCart(id)
  }

  const handleClearCart = () => {
    clearCart()
  }

  const handleContinueShopping = () => {
    router.push('/products')
  }

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    // If authenticated, proceed to checkout
    window.location.href = '/checkout'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b pb-4 mb-6">
        <h1 className="text-primary-brand text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary-brand" />
          Your Cart ({state.itemCount} items)
        </h1>
      </div>

      {/* Cart Content */}
      <div className="flex-1">
        {state.items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-primary-brand mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Add some products to get started</p>
            <Button 
              onClick={handleContinueShopping}
              className="bg-primary-brand hover:bg-primary-brand/90"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {state.items.map((item) => (
              <div
                key={`${item.id}-${item.size}`}
                className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50"
              >
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={60}
                    height={60}
                    className="rounded-md object-cover"
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                    {item.name}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Size: {item.size}
                    {item.color && ` • Color: ${item.color}`}
                  </p>
                  <p className="text-primary-brand font-semibold text-sm mt-1">
                    {item.price}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary */}
      {state.items.length > 0 && (
        <div className="border-t pt-4 mt-6 space-y-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total:</span>
            <span className="text-primary-brand">₹{state.total.toLocaleString()}</span>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={handleCheckout}
              className="w-full bg-primary-brand hover:bg-primary-brand/90 h-12 text-lg font-medium"
            >
              Proceed to Checkout
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleClearCart}
              className="w-full h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear Cart
            </Button>
          </div>
          
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={handleContinueShopping}
              className="text-gray-500 hover:text-gray-700"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      )}
      
      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}
