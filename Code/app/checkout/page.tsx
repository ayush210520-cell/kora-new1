import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import DynamicRazorpayCheckout from "@/components/dynamic-razorpay-checkout"

export default function Checkout() {
  return (
    <>
      <SiteHeader />
      <main className="pt-[100px]">
        <DynamicRazorpayCheckout />
      </main>
      <SiteFooter />
    </>
  )
}
