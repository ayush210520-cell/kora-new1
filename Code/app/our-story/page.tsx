import type { Metadata } from "next"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import OurStoryContent from "@/components/our-story-content"

export const metadata: Metadata = {
  title: "Our Story - KORAKAGAZ",
  description:
    "Learn about KORAKAGAZ - A blank page. A fresh start. And a whole lot of heart. Discover our journey and philosophy behind creating clothes for real life.",
}

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="pt-20">
        <OurStoryContent />
      </main>
      <SiteFooter />
    </div>
  )
}
