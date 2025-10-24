"use client"

import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { getContactEmail } from "@/lib/config"

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "Do you keep ready stock, or is everything made to order?",
    answer: "We maintain limited stock to avoid wastage. Most of our products are made to order, which means your piece is crafted especially for you. This also ensures better quality control and exclusivity."
  },
  {
    question: "Can I customize my outfit?",
    answer: "At this stage, we don't provide full customization. However, if you have a size preference that's slightly outside our chart, feel free to reach out – we'll try our best to help."
  },
  {
    question: "Where can I wear Korakagaz kurtis & sets?",
    answer: "Our designs are versatile – perfect for college, work, casual outings, festive gatherings, and travel. They are crafted to blend comfort with elegance, so you can style them up or down as you like."
  },
  {
    question: "Do the colors of the products look the same in real life as they do in pictures?",
    answer: "We try our best to capture the true colors of each outfit in natural light. However, minor variations may occur due to screen brightness, resolution, or lighting conditions."
  },
  {
    question: "How do I know my correct size?",
    answer: "We provide a detailed size chart on every product page. Please measure yourself before ordering, as different fits (A-line, regular fit, relaxed fit, etc.) may feel slightly different."
  }
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  return (
    <>
      <SiteHeader />
      <main className="pt-[100px] min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h1>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-4">
                {faqData.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg">
                    <button
                      className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      onClick={() => toggleItem(index)}
                    >
                      <span className="font-medium text-gray-900">{item.question}</span>
                      {openItems.includes(index) ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                    {openItems.includes(index) && (
                      <div className="px-4 pb-4">
                        <p className="text-gray-700">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center">
                <h3 className="font-medium text-gray-900 mb-2">Still have questions?</h3>
                <p className="text-gray-600 mb-3">
                  Can't find the answer you're looking for? Please contact our friendly customer support team.
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Email:</strong> {getContactEmail()}</p>
                  <p><strong>Phone:</strong> <a href="tel:6261911729" className="text-primary-brand hover:underline">+91 6261-911729</a></p>
                  <p><strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM IST</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
