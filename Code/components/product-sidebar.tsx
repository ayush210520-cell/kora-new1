// "use client"

// import Link from "next/link"
// import { useState } from "react"
// import { ChevronDown, ChevronRight, X } from "lucide-react"
// import { Button } from "@/components/ui/button"

// export default function ProductSidebar() {
//   const [openSections, setOpenSections] = useState<Set<string>>(new Set())
//   const [isMobileOpen, setIsMobileOpen] = useState(false)

//   const toggleSection = (section: string) => {
//     const newOpenSections = new Set(openSections)
//     if (newOpenSections.has(section)) {
//       newOpenSections.delete(section)
//     } else {
//       newOpenSections.add(section)
//     }
//     setOpenSections(newOpenSections)
//   }

//   const categories = [
//     { name: "All Products", href: "/products", count: 50 },
//     { name: "Kurti Sets", href: "/products", count: 20 },
//     { name: "Tops & Blouses", href: "/products", count: 15 },
//     { name: "Palazzo Sets", href: "/products", count: 8 },
//     { name: "Jewelry", href: "/products", count: 7 },
//   ]

//   const colors = [
//     { name: "Traditional Colors", href: "/products", count: 15 },
//     { name: "Yellow/Gold", href: "/products", count: 12 },
//     { name: "Orange/Coral", href: "/products", count: 8 },
//     { name: "Multi-Color", href: "/products", count: 15 },
//   ]

//   const priceRanges = [
//     { name: "Under ₹16,000", href: "/products" },
//     { name: "₹16,000 - ₹32,000", href: "/products" },
//     { name: "₹32,000 - ₹48,000", href: "/products" },
//     { name: "Over ₹48,000", href: "/products" },
//   ]

//   const sizes = ["XS", "S", "M", "L", "XL", "XXL"]

//   const SidebarContent = () => (
//     <>
//       {/* Categories */}
//       <div className="mb-6 lg:mb-8">
//         <button
//           onClick={() => toggleSection("categories")}
//           className="flex items-center justify-between w-full text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-primary-brand hover:text-primary-brand/80 transition-colors"
//         >
//           <span>Categories</span>
//           {openSections.has("categories") ? (
//             <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5" />
//           ) : (
//             <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" />
//           )}
//         </button>

//         {openSections.has("categories") && (
//           <nav className="animate-in slide-in-from-top-2 duration-200">
//             <ul className="space-y-2">
//               {categories.map((category) => (
//                 <li key={category.name}>
//                   <Link
//                     href={category.href}
//                     className="flex justify-between items-center text-sm lg:text-base text-gray-700 hover:text-primary-brand hover:underline transition-colors py-1"
//                     onClick={() => setIsMobileOpen(false)}
//                   >
//                     <span>{category.name}</span>
//                     <span className="text-xs lg:text-sm text-gray-500">({category.count})</span>
//                   </Link>
//                 </li>
//               ))}
//             </ul>
//           </nav>
//         )}
//       </div>

//       {/* Colors */}
//       <div className="mb-6 lg:mb-8">
//         <button
//           onClick={() => toggleSection("colors")}
//           className="flex items-center justify-between w-full text-base lg:text-lg font-semibold mb-3 lg:mb-4 text-primary-brand hover:text-primary-brand/80 transition-colors"
//         >
//           <span>Colors</span>
//           {openSections.has("colors") ? (
//             <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5" />
//           ) : (
//             <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" />
//           )}
//         </button>

//         {openSections.has("colors") && (
//           <ul className="space-y-2 animate-in slide-in-from-top-2 duration-200">
//             {colors.map((color) => (
//               <li key={color.name}>
//                 <Link
//                   href={color.href}
//                   className="flex justify-between items-center text-sm lg:text-base text-gray-700 hover:text-primary-brand hover:underline transition-colors py-1"
//                   onClick={() => setIsMobileOpen(false)}
//                 >
//                   <span>{color.name}</span>
//                   <span className="text-xs lg:text-sm text-gray-500">({color.count})</span>
//                 </Link>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Price Range */}
//       <div className="mb-6 lg:mb-8">
//         <button
//           onClick={() => toggleSection("price")}
//           className="flex items-center justify-between w-full text-base lg:text-lg font-semibold mb-3 lg:mb-4 text-primary-brand hover:text-primary-brand/80 transition-colors"
//         >
//           <span>Price Range</span>
//           {openSections.has("price") ? (
//             <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5" />
//           ) : (
//             <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" />
//           )}
//         </button>

//         {openSections.has("price") && (
//           <ul className="space-y-2 animate-in slide-in-from-top-2 duration-200">
//             {priceRanges.map((range) => (
//               <li key={range.name}>
//                 <Link
//                   href={range.href}
//                   className="block text-sm lg:text-base text-gray-700 hover:text-primary-brand hover:underline transition-colors py-1"
//                   onClick={() => setIsMobileOpen(false)}
//                 >
//                   {range.name}
//                 </Link>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Sizes */}
//       <div className="mb-6 lg:mb-8">
//         <button
//           onClick={() => toggleSection("sizes")}
//           className="flex items-center justify-between w-full text-base lg:text-lg font-semibold mb-3 lg:mb-4 text-primary-brand hover:text-primary-brand/80 transition-colors"
//         >
//           <span>Sizes</span>
//           {openSections.has("sizes") ? (
//             <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5" />
//           ) : (
//             <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" />
//           )}
//         </button>

//         {openSections.has("sizes") && (
//           <div className="grid grid-cols-3 gap-2 animate-in slide-in-from-top-2 duration-200">
//             {sizes.map((size) => (
//               <Link
//                 key={size}
//                 href="/products"
//                 className="py-2 px-2 lg:px-3 border border-gray-300 text-center text-xs lg:text-sm hover:border-primary-brand hover:text-primary-brand transition-colors rounded block"
//                 onClick={() => setIsMobileOpen(false)}
//               >
//                 {size}
//               </Link>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Special Offers */}
//       <div className="mb-6 lg:mb-8">
//         <button
//           onClick={() => toggleSection("offers")}
//           className="flex items-center justify-between w-full text-base lg:text-lg font-semibold mb-3 lg:mb-4 text-primary-brand hover:text-primary-brand/80 transition-colors"
//         >
//           <span>Special Offers</span>
//           {openSections.has("offers") ? (
//             <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5" />
//           ) : (
//             <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" />
//           )}
//         </button>

//         {openSections.has("offers") && (
//           <ul className="space-y-2 animate-in slide-in-from-top-2 duration-200">
//             <li>
//               <Link
//                 href="/products"
//                 className="block text-sm lg:text-base text-gray-700 hover:text-primary-brand hover:underline transition-colors py-1"
//                 onClick={() => setIsMobileOpen(false)}
//               >
//                 Sale Items
//               </Link>
//             </li>
//             <li>
//               <Link
//                 href="/products"
//                 className="block text-sm lg:text-base text-gray-700 hover:text-primary-brand hover:underline transition-colors py-1"
//                 onClick={() => setIsMobileOpen(false)}
//               >
//                 New Arrivals
//               </Link>
//             </li>
//             <li>
//               <Link
//                 href="/products"
//                 className="block text-sm lg:text-base text-gray-700 hover:text-primary-brand hover:underline transition-colors py-1"
//                 onClick={() => setIsMobileOpen(false)}
//               >
//                 Best Sellers
//               </Link>
//             </li>
//             <li>
//               <Link
//                 href="/products"
//                 className="block text-sm lg:text-base text-gray-700 hover:text-primary-brand hover:underline transition-colors py-1"
//                 onClick={() => setIsMobileOpen(false)}
//               >
//                 Premium Collection
//               </Link>
//             </li>
//           </ul>
//         )}
//       </div>
//     </>
//   )

//   return (
//     <>
//       {/* Mobile Filter Button */}
//       <div className="lg:hidden p-4 border-b border-gray-200 bg-white">
//         <Button
//           onClick={() => setIsMobileOpen(true)}
//           className="w-full bg-primary-brand text-white hover:bg-primary-brand/90"
//         >
//           Filters & Categories
//         </Button>
//       </div>

//       {/* Mobile Sidebar Overlay */}
//       {isMobileOpen && (
//         <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsMobileOpen(false)}>
//           <div
//             className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="flex items-center justify-between p-4 border-b border-gray-200">
//               <h2 className="text-lg font-semibold text-primary-brand">Filters</h2>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => setIsMobileOpen(false)}
//                 className="text-primary-brand hover:bg-primary-brand/10"
//               >
//                 <X className="h-5 w-5" />
//               </Button>
//             </div>
//             <div className="p-4">
//               <SidebarContent />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Desktop Sidebar */}
//       <aside className="hidden lg:block w-80 p-6 border-r border-gray-200 bg-white">
//         <SidebarContent />
//       </aside>
//     </>
//   )
// }
