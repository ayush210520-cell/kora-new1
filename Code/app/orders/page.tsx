"use client";

import OrderHistory from "@/components/order-history";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export default function OrdersPage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-24">
        <OrderHistory />
      </main>
      <SiteFooter />
    </>
  );
}
