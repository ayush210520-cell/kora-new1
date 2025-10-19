"use client"

import { useSearchParams } from "next/navigation"
import ProductList from "./product-list"

interface ProductsWrapperProps {
  initialProducts: any[]
  initialCategories: any[]
}

export default function ProductsWrapper({ initialProducts, initialCategories }: ProductsWrapperProps) {
  const searchParams = useSearchParams()
  const category = searchParams?.get("category") || ""

  return (
    <ProductList 
      initialProducts={initialProducts} 
      initialCategories={initialCategories}
      category={category}
    />
  )
}
