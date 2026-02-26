'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AdminNavbar from '@/components/AdminNavbar'
import { supabase } from '@/lib/supabase'

interface OutlineSection {
  title: string
  items: string
}

export default function CreateCourse() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    duration: '',
    fee: '',
    category: 'Programming Languages',
    level: 'Beginner',
    image_url: '',
    prerequisites: '',
    learning_outcomes: '',
    is_active: true
  })

  const [outlineSections, setOutlineSections] = useState<OutlineSection[]>([
    { title: '', items: '' }
  ])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

  useEffect(() => {
    if (!authLoading) {
      if (!user || !userProfile) {
        router.push('/login')
      } else if (userProfile.role !== 'admin') {
        router.push(`/${userProfile.role}`)
      }
    }
  }, [user, userProfile, authLoading, router])

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.title])


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadImage = async () => {
    if (!selectedFile) {
      alert('Please select an image first')
      return
    }

    try {
      setUploadingImage(true)
      setError('')

      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)

      const response = await fetch('/api/upload/course-image', {
        method: 'POST',
        body: uploadFormData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      // Set the uploaded image URL
      setFormData(prev => ({ ...prev, image_url: result.url }))
      alert('Image uploaded successfully!')

    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
      alert(`Upload error: ${err.message}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const updateOutlineSection = (index: number, field: keyof OutlineSection, value: string) => {
    setOutlineSections(prev =>
      prev.map((section, sectionIndex) =>
        sectionIndex === index
          ? { ...section, [field]: value }
          : section
      )
    )
  }

  const addOutlineSection = () => {
    setOutlineSections(prev => [...prev, { title: '', items: '' }])
  }

  const removeOutlineSection = (index: number) => {
    setOutlineSections(prev => {
      if (prev.length === 1) return prev
      return prev.filter((_, sectionIndex) => sectionIndex !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)

    try {
      // Validate required fields
      if (!formData.title || !formData.slug || !formData.description) {
        throw new Error('Title, slug, and description are required')
      }

      if (!formData.duration || !formData.fee) {
        throw new Error('Duration and fee are required')
      }

      // Parse prerequisites and learning outcomes
      const prerequisites = formData.prerequisites
        ? formData.prerequisites.split('\n').filter(p => p.trim())
        : []
      
      const learning_outcomes = formData.learning_outcomes
        ? formData.learning_outcomes.split('\n').filter(l => l.trim())
        : []

      const outlines = outlineSections
        .map((section) => ({
          title: section.title.trim(),
          items: section.items
            .split('\n')
            .map(item => item.trim())
            .filter(item => item.length > 0)
        }))
        .filter(section => section.title.length > 0 || section.items.length > 0)

      // Insert into database
      const { data, error: dbError } = await supabase
        .from('courses')
        .insert({
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          duration: formData.duration,
          fee: parseFloat(formData.fee),
          category: formData.category,
          level: formData.level,
          image_url: formData.image_url || null,
          outlines,
          prerequisites: prerequisites.length > 0 ? prerequisites : null,
          learning_outcomes: learning_outcomes.length > 0 ? learning_outcomes : null,
          is_active: formData.is_active
        })
        .select()

      if (dbError) throw dbError

      setSuccess(true)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/admin/courses')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Failed to create course')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar
        title="Create Course"
        subtitle="Add a new course to the catalog"
        userName={userProfile?.name}
        userEmail={userProfile?.email}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link
            href="/admin/courses"
            className="text-blue-600 hover:text-blue-700 transition text-sm font-semibold"
          >
            ← Back to Courses
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            <strong>Success!</strong> Course created successfully. Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-8">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Course Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Python Programming Fundamentals"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Slug (URL-friendly name) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="python-programming-fundamentals"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated from title. Use lowercase, hyphens, no spaces.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Detailed description of the course..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Course Details */}
          <div className="mb-8 border-t pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Course Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duration <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="8 weeks"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">e.g., "8 weeks", "3 months"</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fee (MMK) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.fee}
                  onChange={(e) => setFormData({...formData, fee: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="150000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Programming Languages">Programming Languages</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Mobile Development">Mobile Development</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Level <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="mb-8 border-t pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Media</h2>
            
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, or WebP. Max 5MB.</p>
                
                {imagePreview && (
                  <div className="mt-4">
                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleUploadImage}
                      disabled={uploadingImage}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                    >
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    </button>
                  </div>
                )}
              </div>

              {/* OR Separator */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://images.unsplash.com/photo-..."
                />
                <p className="text-xs text-gray-500 mt-1">Paste a direct URL to an image</p>
              </div>
            </div>
          </div>

          {/* Learning Content */}
          <div className="mb-8 border-t pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Learning Content</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prerequisites (Optional)
                </label>
                <textarea
                  value={formData.prerequisites}
                  onChange={(e) => setFormData({...formData, prerequisites: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Basic computer literacy&#10;Familiarity with text editors&#10;No prior programming experience required"
                />
                <p className="text-xs text-gray-500 mt-1">One prerequisite per line</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Learning Outcomes (Optional)
                </label>
                <textarea
                  value={formData.learning_outcomes}
                  onChange={(e) => setFormData({...formData, learning_outcomes: e.target.value})}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Write clean, efficient Python code&#10;Understand OOP concepts&#10;Build real-world applications&#10;Work with data structures"
                />
                <p className="text-xs text-gray-500 mt-1">One outcome per line</p>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Course Outlines (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={addOutlineSection}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-semibold"
                  >
                    + Add Module
                  </button>
                </div>

                <div className="space-y-4">
                  {outlineSections.map((section, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-700">Module {index + 1}</p>
                        {outlineSections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOutlineSection(index)}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateOutlineSection(index, 'title', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Dart Basics"
                        />

                        <textarea
                          value={section.items}
                          onChange={(e) => updateOutlineSection(index, 'items', e.target.value)}
                          rows={5}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                          placeholder="Variables and data types&#10;Control flow&#10;Functions&#10;Classes and objects"
                        />
                        <p className="text-xs text-gray-500">One outline item per line</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Saved format: [{'{'} title: "Module Name", items: ["Item 1", "Item 2"] {'}'}]
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mb-8 border-t pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Status</h2>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="ml-3 text-sm font-semibold text-gray-700">
                Course is active (visible to students)
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Creating...' : 'Create Course'}
            </button>
            <Link
              href="/admin/courses"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
