"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Upload, Edit, Trash2, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useRequireAdmin } from '@/contexts/auth-context'
import { config } from '@/lib/config';
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  sku: string
  description: string
  price: number
  stock: number
  sizeStock?: { [key: string]: number } // Size-wise stock
  categoryId: string
  images: Array<string | { url: string; public_id: string }>
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

// Cache for products data
const productsCache = new Map<string, { products: Product[], pagination: PaginationInfo, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export default function ProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    images: [] as File[],
    useSizeStock: false,
    sizeStock: {
      XS: '',
      S: '',
      M: '',
      L: '',
      XL: '',
      XXL: '',
    },
  })

  const router = useRouter()
  const { isAdmin, isLoading: authLoading } = useRequireAdmin()
  
  // Memoized cache key
  const cacheKey = useMemo(() => {
    return `${pagination.page}-${pagination.limit}-${searchTerm}-${selectedCategory}`
  }, [pagination.page, pagination.limit, searchTerm, selectedCategory])

  // Check if data is cached and fresh
  const getCachedData = useCallback((key: string) => {
    const cached = productsCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached
    }
    return null
  }, [])

  // Set cached data
  const setCachedData = useCallback((key: string, data: { products: Product[], pagination: PaginationInfo }) => {
    productsCache.set(key, { ...data, timestamp: Date.now() })
  }, [])

  // Load data when admin access is confirmed
  useEffect(() => {
    if (isAdmin && !authLoading) {
      Promise.all([
        fetchProducts(),
        fetchCategories()
      ]).finally(() => setIsLoading(false))
    }
  }, [isAdmin, authLoading])

  // Fetch products with caching
  const fetchProducts = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = getCachedData(cacheKey)
        if (cached) {
          setProducts(cached.products)
          setPagination(prev => ({
            ...prev,
            total: cached.pagination.total,
            pages: cached.pagination.pages
          }))
          return
        }
      }

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (searchTerm) queryParams.append('search', searchTerm)
      if (selectedCategory && selectedCategory !== 'all') queryParams.append('category', selectedCategory)

      const response = await fetch(`${config.apiUrl}/api/products?${queryParams}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0
        }))
        
        // Cache the data
        setCachedData(cacheKey, {
          products: data.products || [],
          pagination: data.pagination || { page: 1, limit: 10, total: 0, pages: 0 }
        })
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }, [cacheKey, pagination.page, pagination.limit, searchTerm, selectedCategory, getCachedData, setCachedData])

  // Fetch categories (cached)
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/products/categories`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '' || selectedCategory !== 'all') {
        setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
        fetchProducts(true) // Force refresh for search
      }
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchTerm, selectedCategory, fetchProducts])

  // Pagination handlers
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.pages) {
      setPagination(prev => ({ ...prev, page }))
    }
  }, [pagination.pages])

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.pages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
    }
  }, [pagination.page, pagination.pages])

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }))
    }
  }, [pagination.page])

  // Refetch products when page changes (but use cache if available)
  useEffect(() => {
    if (isAdmin && !authLoading) {
      fetchProducts()
    }
  }, [pagination.page, isAdmin, authLoading, fetchProducts])

  // Clear cache when adding/editing/deleting products
  const clearCache = useCallback(() => {
    productsCache.clear()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      categoryId: value
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setFormData(prev => ({
        ...prev,
        images: filesArray
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      price: '',
      stock: '',
      categoryId: '',
      images: [],
      useSizeStock: false,
      sizeStock: {
        XS: '',
        S: '',
        M: '',
        L: '',
        XL: '',
        XXL: '',
      },
    })
    setEditingProduct(null)
    setIsAddingProduct(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/?auth=required')
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('sku', formData.sku)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('price', formData.price)
      formDataToSend.append('stock', formData.stock)
      formDataToSend.append('categoryId', formData.categoryId)
      formDataToSend.append('useSizeStock', formData.useSizeStock.toString())
      
        if (formData.useSizeStock) {
          // Convert sizeStock object to JSON string
          const sizeStockObj: { [key: string]: number } = {};
          Object.entries(formData.sizeStock).forEach(([size, stock]) => {
            if (stock && stock.trim() !== '') {
              sizeStockObj[size] = parseInt(stock);
            }
          });
          formDataToSend.append('sizeStock', JSON.stringify(sizeStockObj));
        }
      
      if (formData.images.length > 0) {
        formData.images.forEach((image) => {
          formDataToSend.append('images', image)
        })
      }

      const url = editingProduct 
        ? `${config.apiUrl}/api/products/${editingProduct.id}`
        : `${config.apiUrl}/api/products`
      
      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })

      if (response.ok) {
        clearCache() // Clear cache after changes
        await fetchProducts(true) // Force refresh
        resetForm()
        toast({
          title: "Success!",
          description: editingProduct ? 'Product updated successfully!' : 'Product added successfully!',
          duration: 3000,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || 'Something went wrong',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to save product:', error)
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      categoryId: product.categoryId,
      images: [],
      useSizeStock: !!product.sizeStock,
      sizeStock: product.sizeStock ? {
        XS: product.sizeStock.XS?.toString() || '',
        S: product.sizeStock.S?.toString() || '',
        M: product.sizeStock.M?.toString() || '',
        L: product.sizeStock.L?.toString() || '',
        XL: product.sizeStock.XL?.toString() || '',
        XXL: product.sizeStock.XXL?.toString() || '',
      } : {
        XS: '',
        S: '',
        M: '',
        L: '',
        XL: '',
        XXL: '',
      },
    })
    setIsAddingProduct(true)
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/?auth=required')
      return
    }

    try {
      const response = await fetch(`${config.apiUrl}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        clearCache() // Clear cache after deletion
        await fetchProducts(true) // Force refresh
        toast({
          title: "Success!",
          description: "Product deleted successfully",
          duration: 3000,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || 'Failed to delete product',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  // Memoized filtered products count
  const filteredProductsCount = useMemo(() => {
    return products.length
  }, [products])


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Add, edit, and manage your products</p>
        </div>
        <Button 
          onClick={() => setIsAddingProduct(true)}
          className="bg-primary-brand hover:bg-primary-brand/90 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full sm:w-auto"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Product Form */}
      {isAddingProduct && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter product name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU
                  </label>
                  <Input
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter unique SKU"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Select value={formData.categoryId} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹)
                    </label>
                    <Input
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock
                    </label>
                    <Input
                      name="stock"
                      type="number"
                      value={formData.stock}
                      onChange={handleInputChange}
                      required
                      placeholder="0"
                      disabled={formData.useSizeStock}
                    />
                  </div>
                </div>

                {/* Size-wise Stock Toggle */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="use-size-stock"
                    checked={formData.useSizeStock}
                    onChange={(e) => setFormData({ ...formData, useSizeStock: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="use-size-stock" className="text-sm font-medium text-gray-700">
                    Use size-wise stock management
                  </label>
                </div>

                {/* Size-wise Stock Inputs */}
                {formData.useSizeStock && (
                  <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                    <label className="text-sm font-medium text-gray-700">Size-wise Stock</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="size-XS" className="text-xs text-gray-600">Size XS</label>
                        <Input
                          id="size-XS"
                          type="number"
                          placeholder="0"
                          value={formData.sizeStock.XS}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            sizeStock: { ...formData.sizeStock, XS: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="size-S" className="text-xs text-gray-600">Size S</label>
                        <Input
                          id="size-S"
                          type="number"
                          placeholder="0"
                          value={formData.sizeStock.S}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            sizeStock: { ...formData.sizeStock, S: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="size-M" className="text-xs text-gray-600">Size M</label>
                        <Input
                          id="size-M"
                          type="number"
                          placeholder="0"
                          value={formData.sizeStock.M}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            sizeStock: { ...formData.sizeStock, M: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="size-L" className="text-xs text-gray-600">Size L</label>
                        <Input
                          id="size-L"
                          type="number"
                          placeholder="0"
                          value={formData.sizeStock.L}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            sizeStock: { ...formData.sizeStock, L: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="size-XL" className="text-xs text-gray-600">Size XL</label>
                        <Input
                          id="size-XL"
                          type="number"
                          placeholder="0"
                          value={formData.sizeStock.XL}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            sizeStock: { ...formData.sizeStock, XL: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="size-XXL" className="text-xs text-gray-600">Size XXL</label>
                        <Input
                          id="size-XXL"
                          type="number"
                          placeholder="0"
                          value={formData.sizeStock.XXL}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            sizeStock: { ...formData.sizeStock, XXL: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    
                    {/* Total Stock Display */}
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800">Total Stock:</span>
                        <span className="text-lg font-bold text-blue-900">
                          {Object.values(formData.sizeStock).reduce((sum, sizeStock) => {
                            return sum + (parseInt(sizeStock) || 0);
                          }, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter product description"
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images
                </label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  required={!editingProduct}
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {editingProduct ? 'Leave empty to keep existing images' : 'Select up to 5 images'}
                </p>
                {isSubmitting && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-brand h-2 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Processing product...</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  type="submit" 
                  className="bg-primary-brand hover:bg-primary-brand/90 w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isSubmitting 
                    ? (editingProduct ? 'Updating...' : 'Adding...') 
                    : (editingProduct ? 'Update Product' : 'Add Product')
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>All Products ({pagination.total} total)</CardTitle>
          <p className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
            {searchTerm && ` matching "${searchTerm}"`}
            {selectedCategory !== 'all' && ` in category "${categories.find(c => c.id === selectedCategory)?.name}"`}
          </p>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Image</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">SKU</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Price</th>
                  <th className="text-left p-2">Stock</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      {product.images && product.images[0] && (
                        <img 
                          src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url} 
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                    </td>
                    <td className="p-2 font-medium">{product.name}</td>
                    <td className="p-2 text-sm text-gray-600">{product.sku}</td>
                    <td className="p-2">
                      {categories.find(c => c.id === product.categoryId)?.name || 'Unknown'}
                    </td>
                    <td className="p-2">₹{product.price}</td>
                    <td className="p-2">{product.stock}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start gap-3">
                  {product.images && product.images[0] && (
                    <img 
                      src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url} 
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                    <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    <p className="text-sm text-gray-600">
                      {categories.find(c => c.id === product.categoryId)?.name || 'Unknown'}
                    </p>
                    <p className="text-sm font-medium text-gray-900">₹{product.price}</p>
                    <p className="text-sm text-gray-600">Stock: {product.stock}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(product)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={pagination.page === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum
                    if (pagination.pages <= 5) {
                      pageNum = i + 1
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i
                    } else {
                      pageNum = pagination.page - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={pagination.page === pagination.pages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
