"use client"

import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import { getContactEmail } from "@/lib/config"

export default function ShippingPage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-[100px] min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              SHIPPING AND DELIVERY POLICY
            </h1>
            
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <section>
                <p className="text-gray-700 leading-relaxed">
                  At Korakagaz, every piece is carefully crafted with attention to detail. Since we work
                  with limited stock and follow a made-to-order process, we kindly request your patience as
                  we prepare your perfect piece.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Processing and Shipping Time</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your order is made specially for you! Please allow us 1-4 business days to craft and
                  prepare it before dispatch. If there's ever a fabric shortage or extra rush, we'll personally
                  reach out to you to keep you updated.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Shipping Time</h2>
                <p className="text-gray-700 leading-relaxed">
                  Once shipped, your order usually reaches you in 5-14 business days after dispatch.
                  Remote areas may take a little longer, but don't worry—we'll keep you informed.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Shipping Charges</h2>
                <p className="text-gray-700 leading-relaxed">
                  We offer free shipping across India on all orders.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Order Tracking</h2>
                <p className="text-gray-700 leading-relaxed">
                  As soon as we ship your order, you'll receive a tracking link via email/SMS so you can
                  follow your package all the way to your doorstep.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Delays</h2>
                <p className="text-gray-700 leading-relaxed">
                  Since every piece is handcrafted and made-to-order, slight delays can happen—especially
                  during festivals, holidays, or due to courier issues. We appreciate your patience and
                  promise it'll be worth the wait.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">International Shipping</h2>
                <p className="text-gray-700 leading-relaxed">
                  Currently, we ship within India. For international orders, please write to us
                  at <a href={`mailto:${getContactEmail()}`} className="text-primary-brand hover:underline">{getContactEmail()}</a> and we'll be happy to help.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
