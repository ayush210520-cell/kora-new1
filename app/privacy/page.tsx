"use client"

import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import { getContactEmail } from "@/lib/config"

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-[100px] min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Privacy Policy
            </h1>
            
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <div className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  At Korakagaz ("we," "our," "us"), your privacy is extremely important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website www.korakagazindia.com (the "Site") and purchase our products.
                </p>
                <p className="mb-6">
                  By using our Site, you agree to the practices described in this Privacy Policy.
                </p>
              </div>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. INFORMATION WE COLLECT</h2>
                <p className="text-gray-700 mb-3">We may collect the following types of information when you interact with our Site:</p>
                <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                  <li><strong>Personal Information:</strong> Name, email address, phone number, billing and shipping address, payment details.</li>
                  <li><strong>Non-Personal Information:</strong> Browser type, device information, IP address, pages visited, and cookies.</li>
                  <li><strong>Order Information:</strong> Details of the products you purchase, payment method, and transaction details.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. HOW WE USE YOUR INFORMATION</h2>
                <p className="text-gray-700 mb-3">We use the collected information to:</p>
                <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                  <li>Process and deliver your orders.</li>
                  <li>Communicate with you about your purchases, promotions, or inquiries.</li>
                  <li>Improve our products, services, and website experience.</li>
                  <li>Prevent fraudulent activities and ensure secure transactions.</li>
                  <li>Send marketing emails or SMS (only if you opt in).</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. SHARING OF INFORMATION</h2>
                <p className="text-gray-700 mb-3">
                  We respect your privacy. Your personal information is never sold to third parties. However, we may share it with trusted partners:
                </p>
                <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                  <li><strong>Service Providers:</strong> Delivery partners, payment gateways, and IT support providers.</li>
                  <li><strong>Legal Compliance:</strong> If required by law, regulation, or government request.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. COOKIES AND TRACKING TECHNOLOGIES</h2>
                <p className="text-gray-700">
                  We use cookies and similar tools to improve your browsing experience and analyze traffic. You can manage cookies through your browser settings, but some features of the Site may not work properly without them.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. DATA SECURITY</h2>
                <p className="text-gray-700">
                  We implement industry-standard security measures to protect your personal information. However, please note that no method of online transmission or storage is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. YOUR RIGHTS</h2>
                <p className="text-gray-700 mb-3">You have the right to:</p>
                <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                  <li>Access the personal information we hold about you.</li>
                  <li>Request corrections or updates to your information.</li>
                  <li>Opt out of marketing communications at any time.</li>
                  <li>Request deletion of your account or personal data (subject to legal and transactional requirements).</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">7. THIRD-PARTY LINKS</h2>
                <p className="text-gray-700">
                  Our Site may contain links to third-party websites. We are not responsible for the privacy practices or content of those external sites.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">8. CHANGES TO THIS PRIVACY POLICY</h2>
                <p className="text-gray-700">
                  We may update this Privacy Policy from time to time. Changes will be posted on this page with the updated effective date.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">9. CONTACT US</h2>
                <p className="text-gray-700 mb-3">
                  If you have questions or concerns about this Privacy Policy, please contact us:
                </p>
                <div className="text-gray-700 space-y-1">
                  <p><strong>Email:</strong> <a href={`mailto:${getContactEmail()}`} className="text-primary-brand hover:underline">{getContactEmail()}</a></p>
                  <p><strong>Address:</strong> 24, Readymade Complex, Pardesipura, Indore, Madhya Pradesh, 452006, India</p>
                </div>
              </section>

              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
