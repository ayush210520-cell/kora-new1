"use client"

import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import { getContactEmail } from "@/lib/config"

export default function ReturnsPage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-[100px] min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">RETURN AND EXCHANGE POLICY</h1>
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <section>
                <p className="text-gray-700 leading-relaxed">
                  At Korakagaz, every piece is made with a lot of care. Since we are in the initial phase of our business, we do not offer returns or refunds as of now (we might surprise you very soon, though). However, we want you to feel comfortable shopping with us, so we do allow exchanges in specific cases.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">What Can Be Exchanged?</h2>
                <ul className="list-disc list-inside text-gray-700 ml-4 space-y-2">
                  <li><strong>Size Issues:</strong> If your order doesn't fit, you can request a size exchange.</li>
                  <li><strong>Defective/Wrong Product:</strong> If you receive a defective or incorrect product, please share clear pictures/videos within 48 hours of delivery so we can verify and resolve it. We will not be able to help you if this timeline is exceeded.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Conditions for Exchange</h2>
                <ul className="list-disc list-inside text-gray-700 ml-4 space-y-2">
                  <li><strong>Shipping cost:</strong> Don't worry! We provide free return shipping on your order.</li>
                  <li>Each order is eligible for a return only once.</li>
                  <li>The product must be unused, unwashed, and returned in its original packaging with all tags intact.</li>
                  <li>Exchanges should be requested within 3 days of delivery by writing to us at <a href={`mailto:${getContactEmail()}`} className="text-primary-brand hover:underline">{getContactEmail()}</a>. Further steps will be communicated at the time of exchange.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Non-Exchangeable Items</h2>
                <ul className="list-disc list-inside text-gray-700 ml-4 space-y-2">
                  <li>Products bought on sale/discount are not eligible for exchange.</li>
                </ul>
              </section>

              <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                <p className="text-gray-700">Email: <a href={`mailto:${getContactEmail()}`} className="text-primary-brand hover:underline">{getContactEmail()}</a></p>
                <p className="text-gray-700">Address: 24, Readymade Complex, Pardesipura, Indore, Madhya Pradesh, 452006, India</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
