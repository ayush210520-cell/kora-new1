"use client"

import React, { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus } from "lucide-react"
import { productAPI } from "@/lib/api"
import { useRequireAdmin } from "@/contexts/auth-context"

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  category?: {
    id: string;
    name: string;
  };
  images: Array<{ url: string; public_id: string }>;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  products?: Product[];
}

export default function AdminPanel() {
  const { isAdmin, isLoading: authLoading } = useRequireAdmin()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
    image: "",
    useSizeStock: false,
    sizeStock: {
      S: "",
      M: "",
      L: "",
      XL: "",
    },
  })
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  })
  const [stats, setStats] = useState({
    totalSales: 0,
    totalPurchases: 0,
    monthlySales: 0,
  })

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect if not admin (this should be handled by layout, but just in case)
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  const fetchStats = async () => {
    try {
      // TODO: Implement stats API
      setStats({
        totalSales: 0,
        totalPurchases: 0,
        monthlySales: 0,
      })
    } catch (err) {
      console.error("Failed to fetch stats", err)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await productAPI.getAll()
      setProducts(res.products)
    } catch (err) {
      console.error("Failed to fetch products", err)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await productAPI.getCategories()
      setCategories(res.categories)
    } catch (err) {
      console.error("Failed to fetch categories", err)
    }
  }

  const handleProductUpload = async () => {
    try {
      // Validate required fields
      if (!newProduct.name || !newProduct.sku || !newProduct.description || !newProduct.price || !newProduct.categoryId) {
        alert("Please fill in all required fields")
        return
      }

      // Validate size-wise stock if enabled
      if (newProduct.useSizeStock) {
        const sizeValues = [
          parseInt(newProduct.sizeStock.S) || 0,
          parseInt(newProduct.sizeStock.M) || 0,
          parseInt(newProduct.sizeStock.L) || 0,
          parseInt(newProduct.sizeStock.XL) || 0,
        ]
        const totalSizeStock = sizeValues.reduce((sum, val) => sum + val, 0)
        
        if (totalSizeStock === 0) {
          alert("Please enter stock quantities for at least one size")
          return
        }
      }

      // Prepare product data
      const productData = {
        name: newProduct.name,
        sku: newProduct.sku,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        stock: newProduct.useSizeStock ? 0 : parseInt(newProduct.stock) || 0,
        categoryId: newProduct.categoryId,
        images: newProduct.image ? [{ url: newProduct.image }] : [],
        sizeStock: newProduct.useSizeStock ? {
          S: parseInt(newProduct.sizeStock.S) || 0,
          M: parseInt(newProduct.sizeStock.M) || 0,
          L: parseInt(newProduct.sizeStock.L) || 0,
          XL: parseInt(newProduct.sizeStock.XL) || 0,
        } : undefined
      }

      console.log("Creating product with data:", productData)
      console.log("Size-wise stock enabled:", newProduct.useSizeStock)
      console.log("Size stock values:", newProduct.sizeStock)

      // Use proper API function
      await productAPI.create(productData)
      
      setNewProduct({ 
        name: "", 
        sku: "", 
        description: "", 
        price: "", 
        stock: "", 
        categoryId: "", 
        image: "",
        useSizeStock: false,
        sizeStock: { S: "", M: "", L: "", XL: "" }
      })
      fetchProducts()
      alert("Product created successfully!")
    } catch (err) {
      console.error("Product upload failed", err)
      alert(`Product creation failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleCategoryCreate = async () => {
    try {
      await productAPI.createCategory(newCategory)
      setNewCategory({ name: "", description: "" })
      fetchCategories()
      alert("Category created successfully!")
    } catch (err) {
      console.error("Category creation failed", err)
      alert(`Category creation failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      await productAPI.delete(productId)
      fetchProducts()
      alert("Product deleted successfully!")
    } catch (err) {
      console.error("Product deletion failed", err)
      alert(`Product deletion failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // TODO: Implement category deletion in API
      alert("Category deletion not implemented yet")
    } catch (err) {
      console.error("Category deletion failed", err)
      alert(`Category deletion failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchProducts()
    fetchCategories()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Manage Products</TabsTrigger>
          <TabsTrigger value="categories">Manage Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardContent className="p-4">
                <p>Total Sales</p>
                <h2 className="text-xl font-bold">₹{stats.totalSales}</h2>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p>Total Purchases</p>
                <h2 className="text-xl font-bold">₹{stats.totalPurchases}</h2>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p>Monthly Sales</p>
                <h2 className="text-xl font-bold">₹{stats.monthlySales}</h2>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Product
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product-name">Product Name</Label>
                  <Input
                    id="product-name"
                    placeholder="Enter product name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="product-sku">SKU</Label>
                  <Input
                    id="product-sku"
                    placeholder="Enter unique SKU"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-description">Description</Label>
                  <Textarea
                    id="product-description"
                    placeholder="Enter product description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-price">Price (₹)</Label>
                    <Input
                      id="product-price"
                      type="number"
                      placeholder="0.00"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-stock">Stock</Label>
                    <Input
                      id="product-stock"
                      type="number"
                      placeholder="0"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      disabled={newProduct.useSizeStock}
                    />
                  </div>
                </div>

                {/* Size-wise Stock Toggle */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="use-size-stock"
                    checked={newProduct.useSizeStock}
                    onChange={(e) => setNewProduct({ ...newProduct, useSizeStock: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="use-size-stock" className="text-sm font-medium">
                    Use size-wise stock management
                  </Label>
                </div>

                {/* Size-wise Stock Inputs */}
                {newProduct.useSizeStock && (
                  <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                    <Label className="text-sm font-medium">Size-wise Stock</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="size-S" className="text-xs">Size S</Label>
                        <Input
                          id="size-S"
                          type="number"
                          placeholder="0"
                          value={newProduct.sizeStock.S}
                          onChange={(e) => setNewProduct({ 
                            ...newProduct, 
                            sizeStock: { ...newProduct.sizeStock, S: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="size-M" className="text-xs">Size M</Label>
                        <Input
                          id="size-M"
                          type="number"
                          placeholder="0"
                          value={newProduct.sizeStock.M}
                          onChange={(e) => setNewProduct({ 
                            ...newProduct, 
                            sizeStock: { ...newProduct.sizeStock, M: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="size-L" className="text-xs">Size L</Label>
                        <Input
                          id="size-L"
                          type="number"
                          placeholder="0"
                          value={newProduct.sizeStock.L}
                          onChange={(e) => setNewProduct({ 
                            ...newProduct, 
                            sizeStock: { ...newProduct.sizeStock, L: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="size-XL" className="text-xs">Size XL</Label>
                        <Input
                          id="size-XL"
                          type="number"
                          placeholder="0"
                          value={newProduct.sizeStock.XL}
                          onChange={(e) => setNewProduct({ 
                            ...newProduct, 
                            sizeStock: { ...newProduct.sizeStock, XL: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="product-category">Category</Label>
                  <Select value={newProduct.categoryId} onValueChange={(value) => setNewProduct({ ...newProduct, categoryId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-image">Image URL</Label>
                  <Input
                    id="product-image"
                    placeholder="Enter image URL"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  />
                </div>

                <Button onClick={handleProductUpload} className="w-full">
                  Create Product
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {products.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                          <p className="text-sm text-gray-600">₹{product.price} | Stock: {product.stock}</p>
                          {product.category && (
                            <Badge variant="secondary" className="mt-1">
                              {product.category.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Category Name</Label>
                  <Input
                    id="category-name"
                    placeholder="Enter category name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category-description">Description</Label>
                  <Textarea
                    id="category-description"
                    placeholder="Enter category description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  />
                </div>

                <Button onClick={handleCategoryCreate} className="w-full">
                  Create Category
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {categories.map((category) => (
                    <div key={category.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-gray-600">{category.description}</p>
                          )}
                          <Badge variant="outline" className="mt-1">
                            {category.products?.length || 0} products
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
