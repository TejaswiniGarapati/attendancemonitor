import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  BookOpen, 
  Edit, 
  Trash2, 
  Search,
  Code,
  GraduationCap
} from 'lucide-react'
import { supabase, Subject } from '../lib/supabase'

export default function SubjectManager() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    course: '',
    year: 1
  })

  useEffect(() => {
    fetchSubjects()
  }, [])

  useEffect(() => {
    filterSubjects()
  }, [subjects, searchTerm])

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('course', { ascending: true })
        .order('year', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterSubjects = () => {
    const filtered = subjects.filter(subject =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.course.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredSubjects(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSubject) {
        const { error } = await supabase
          .from('subjects')
          .update(formData)
          .eq('id', editingSubject.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('subjects')
          .insert([formData])
        if (error) throw error
      }

      resetForm()
      fetchSubjects()
    } catch (error) {
      console.error('Error saving subject:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        const { error } = await supabase
          .from('subjects')
          .delete()
          .eq('id', id)
        if (error) throw error
        fetchSubjects()
      } catch (error) {
        console.error('Error deleting subject:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      course: '',
      year: 1
    })
    setShowAddForm(false)
    setEditingSubject(null)
  }

  const startEdit = (subject: Subject) => {
    setEditingSubject(subject)
    setFormData({
      name: subject.name,
      code: subject.code,
      course: subject.course,
      year: subject.year
    })
    setShowAddForm(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Subject Management
            </h1>
            <p className="text-gray-400 mt-2">Manage course subjects and curriculum</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
          >
            <Plus className="h-5 w-5" />
            Add Subject
          </button>
        </div>

        {/* Search */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                  <BookOpen className="h-6 w-6 text-purple-400" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(subject)}
                    className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">{subject.name}</h3>
                <div className="flex items-center gap-2 text-purple-400">
                  <Code className="h-4 w-4" />
                  <span className="font-mono text-sm">{subject.code}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <GraduationCap className="h-4 w-4" />
                  <span>{subject.course} - Year {subject.year}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No subjects found matching your criteria.</p>
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-white mb-6">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
                    placeholder="e.g., Data Structures and Algorithms"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white font-mono"
                    placeholder="e.g., CS301"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Course</label>
                  <select
                    required
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value="">Select Course</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics and Communication Engineering">Electronics andCommunication Engineering</option>
                    <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Artificial Intelligence and Data Science">Artificial Intelligence and Data Science</option>
                    <option value="Artificial Intelligence and Machine Learning">Artificial Intelligence and Machine Learning</option>
                    <option value="Electronics and Instrumentation Engineering">Electronics and Instrumentation Engineering</option>
                    <option value="Bio Technology">Bio Technology</option>
                    <option value="Chemical Engineering">Chemical Engineering</option>
                    <option value="Aeronautical Engineering">Aeronautical Engineering</option>
                    <option value="Automobile Engineering">Automobile Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Academic Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-3 border border-gray-700 rounded-lg text-gray-400 hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                  >
                    {editingSubject ? 'Update' : 'Add'} Subject
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}