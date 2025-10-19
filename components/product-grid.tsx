import Image from "next/image"

const products = [
  { id: 1, name: "Product 1", imageUrl: "/placeholder.svg?height=400&width=300", price: "$49.99" },
  { id: 2, name: "Product 2", imageUrl: "/placeholder.svg?height=400&width=300", price: "$59.99" },
  { id: 3, name: "Product 3", imageUrl: "/placeholder.svg?height=400&width=300", price: "$39.99" },
  { id: 4, name: "Product 4", imageUrl: "/placeholder.svg?height=400&width=300", price: "$69.99" },
  { id: 5, name: "Product 5", imageUrl: "/placeholder.svg?height=400&width=300", price: "$79.99" },
  { id: 6, name: "Product 6", imageUrl: "/placeholder.svg?height=400&width=300", price: "$29.99" },
]

export default function ProductGrid() {
  return (
    <section className="container mx-auto py-8 px-4">
      <h2 className="text-3xl font-bold text-center mb-8">Shop Our Products</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="flex flex-col items-center text-center">
            <div className="relative w-full aspect-[3/4] mb-2">
              <Image
                src={product.imageUrl || "/placeholder.svg"}
                alt={product.name}
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
              />
            </div>
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="text-gray-600">{product.price}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
