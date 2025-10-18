"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { useRequireAdmin } from '@/contexts/auth-context'
import { config } from '@/lib/config';
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export default function CategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const router = useRouter()
  const { isAdmin, isLoading: authLoading } = useRequireAdmin()

  // Load data when admin access is confirmed
  useEffect(() => {
    if (isAdmin && !authLoading) {
      fetchCategories()
    }
  }, [isAdmin, authLoading])

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/products/categories`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    })
    setEditingCategory(null)
    setIsAddingCategory(false)
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
      const url = editingCategory 
        ? `${config.apiUrl}/api/products/categories/${editingCategory.id}`
        : `${config.apiUrl}/api/products/categories`
      
      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchCategories()
        resetForm()
        toast({
          title: "Success!",
          description: editingCategory ? 'Category updated successfully!' : 'Category added successfully!',
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
      console.error('Failed to save category:', error)
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || ''
    })
    setIsAddingCategory(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/?auth=required')
      return
    }

    try {
      const response = await fetch(`${config.apiUrl}/api/products/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchCategories()
        toast({
          title: "Success!",
          description: "Category deleted successfully",
          duration: 3000,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || 'Failed to delete category',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      })
    }
  }

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Categories Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Add, edit, and manage product categories</p>
        </div>
        <Button 
          onClick={() => setIsAddingCategory(true)}
          className="bg-primary-brand hover:bg-primary-brand/90 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Category Form */}
      {isAddingCategory && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter category name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  type="submit" 
                  className="bg-primary-brand hover:bg-primary-brand/90 w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? (editingCategory ? 'Updating...' : 'Adding...') 
                    : (editingCategory ? 'Update Category' : 'Add Category')
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

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories ({filteredCategories.length} total)</CardTitle>
          <p className="text-sm text-gray-600">
            {searchTerm ? `Showing categories matching "${searchTerm}"` : 'All categories'}
          </p>
        </CardHeader>
        <CardContent>
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No categories found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category) => (
                <div key={category.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Created: {new Date(category.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

