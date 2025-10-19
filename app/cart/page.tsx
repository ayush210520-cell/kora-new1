import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import Cartpage from "@/components/cart-page"

export default function Cart() {
  return (
    <>
      <SiteHeader />
      <main className="pt-[100px]">
        <Cartpage/>
      </main>
      <SiteFooter />
    </>
  )
}
