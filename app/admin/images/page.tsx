"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Eye, Upload, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface DynamicImage {
  id: string
  title: string
  description?: string
  imageUrl: string
  position: string
  category?: string
  isActive: boolean
  sortOrder: number
  altText?: string
  linkUrl?: string
  createdAt: string
  updatedAt: string
}

interface Position {
  value: string
  label: string
}

export default function AdminImagesPage() {
  const [images, setImages] = useState<DynamicImage[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingImage, setEditingImage] = useState<DynamicImage | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    position: '',
    category: '',
    altText: '',
    linkUrl: '',
    sortOrder: 0,
    isActive: true
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const { toast } = useToast()

  // Fetch images and positions
  useEffect(() => {
    fetchImages()
    fetchPositions()
  }, [])

  const fetchImages = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/dynamic-images', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      }
    } catch (error) {
      console.error('Error fetching images:', error)
      toast({
        title: "Error",
        description: "Failed to fetch images",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/dynamic-images/positions')
      if (response.ok) {
        const data = await response.json()
        setPositions(data.positions || [])
      }
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      position: '',
      category: '',
      altText: '',
      linkUrl: '',
      sortOrder: 0,
      isActive: true
    })
    setSelectedFile(null)
    setPreviewUrl('')
    setEditingImage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.position) {
      toast({
        title: "Error",
        description: "Title and position are required",
        variant: "destructive"
      })
      return
    }

    if (!editingImage && !selectedFile) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive"
      })
      return
    }

    try {
      const token = localStorage.getItem('token')
      const formDataToSend = new FormData()
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString())
        }
      })

      // Add file if selected
      if (selectedFile) {
        formDataToSend.append('image', selectedFile)
      }

      const url = editingImage 
        ? `/api/dynamic-images/${editingImage.id}`
        : '/api/dynamic-images'
      
      const method = editingImage ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: editingImage ? "Image updated successfully" : "Image created successfully"
        })
        setIsDialogOpen(false)
        resetForm()
        fetchImages()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to save image",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error saving image:', error)
      toast({
        title: "Error",
        description: "Failed to save image",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (image: DynamicImage) => {
    setEditingImage(image)
    setFormData({
      title: image.title,
      description: image.description || '',
      position: image.position,
      category: image.category || '',
      altText: image.altText || '',
      linkUrl: image.linkUrl || '',
      sortOrder: image.sortOrder,
      isActive: image.isActive
    })
    setPreviewUrl(image.imageUrl)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/dynamic-images/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Image deleted successfully"
        })
        fetchImages()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete image",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive"
      })
    }
  }

  const toggleActive = async (image: DynamicImage) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/dynamic-images/${image.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...image,
          isActive: !image.isActive
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Image ${!image.isActive ? 'activated' : 'deactivated'} successfully`
        })
        fetchImages()
      }
    } catch (error) {
      console.error('Error toggling image status:', error)
      toast({
        title: "Error",
        description: "Failed to update image status",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-brand mx-auto mb-4"></div>
            <p className="text-gray-600">Loading images...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dynamic Images</h1>
          <p className="text-gray-600 mt-2">Manage website images and banners</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingImage ? 'Edit Image' : 'Add New Image'}
              </DialogTitle>
              <DialogDescription>
                {editingImage 
                  ? 'Update the image details and upload a new file if needed.' 
                  : 'Upload a new image and configure its position and display settings.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Image title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position *</Label>
                  <Select value={formData.position} onValueChange={(value) => setFormData({...formData, position: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.value} value={position.value}>
                          {position.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Image description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g., slider, gallery, banner"
                  />
                </div>
                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="altText">Alt Text</Label>
                <Input
                  id="altText"
                  value={formData.altText}
                  onChange={(e) => setFormData({...formData, altText: e.target.value})}
                  placeholder="Alternative text for accessibility"
                />
              </div>

              <div>
                <Label htmlFor="linkUrl">Link URL</Label>
                <Input
                  id="linkUrl"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({...formData, linkUrl: e.target.value})}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="image">Image File {!editingImage && '*'}</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mb-2"
                />
                {previewUrl && (
                  <div className="mt-2">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      width={200}
                      height={200}
                      className="object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingImage ? 'Update' : 'Create'} Image
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="aspect-video relative bg-gray-100">
              <Image
                src={image.imageUrl}
                alt={image.altText || image.title}
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge variant={image.isActive ? "default" : "secondary"}>
                  {image.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{image.title}</CardTitle>
              <p className="text-sm text-gray-600">{image.position}</p>
              {image.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{image.description}</p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(image)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(image)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Image</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{image.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(image.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <span className="text-xs text-gray-500">
                  Order: {image.sortOrder}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first dynamic image.</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Image
          </Button>
        </div>
      )}
    </div>
  )
}
