import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  GraduationCap,
  Hash
} from 'lucide-react'
import { supabase, Student } from '../lib/supabase'

export default function StudentManager() {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    course: '',
    year: '',
    section: ''
  })

  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    email: '',
    course: '',
    year: 1,
    section: 'A'
  })

  const branches = [
    'Computer Science and Engineering',
    'Information Technology',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Artificial Intelligence and Data Science',
    'Artificial Intelligence and Machine Learning',
    'Electronics and Instrumentation Engineering',
    'Bio Technology',
    'Chemical Engineering',
    'Aeronautical Engineering',
    'Automobile Engineering'
  ]

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    filterStudents()
  }, [students, searchTerm, filters])

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name')

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterStudents = () => {
    let filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (filters.course) {
      filtered = filtered.filter(student => student.course === filters.course)
    }
    if (filters.year) {
      filtered = filtered.filter(student => student.year.toString() === filters.year)
    }
    if (filters.section) {
      filtered = filtered.filter(student => student.section === filters.section)
    }

    setFilteredStudents(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update(formData)
          .eq('id', editingStudent.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('students')
          .insert([formData])
        if (error) throw error
      }

      resetForm()
      fetchStudents()
    } catch (error) {
      console.error('Error saving student:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('id', id)
        if (error) throw error
        fetchStudents()
      } catch (error) {
        console.error('Error deleting student:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      student_id: '',
      name: '',
      email: '',
      course: '',
      year: 1,
      section: 'A'
    })
    setShowAddForm(false)
    setEditingStudent(null)
  }

  const startEdit = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      course: student.course,
      year: student.year,
      section: student.section
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Student Management
            </h1>
            <p className="text-gray-400 mt-2">Manage student information and records</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
          >
            <Plus className="h-5 w-5" />
            Add Student
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Course Filter */}
            <select
              value={filters.course}
              onChange={(e) => setFilters({ ...filters, course: e.target.value })}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 text-white"
            >
              <option value="">All Courses</option>
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 text-white"
            >
              <option value="">All Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>

            {/* Section Filter */}
            <select
              value={filters.section}
              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 text-white"
            >
              <option value="">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>
        </div>

        {/* Student Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-cyan-500/30">
                  <User className="h-6 w-6 text-cyan-400" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(student)}
                    className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(student.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">{student.name}</h3>
                <div className="flex items-center gap-2 text-gray-400">
                  <Hash className="h-4 w-4" />
                  <span className="text-cyan-400">{student.student_id}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Mail className="h-4 w-4" />
                  <span>{student.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <GraduationCap className="h-4 w-4" />
                  <span>{student.course} — Year {student.year} — {student.section}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No students found matching your criteria.</p>
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-white mb-6">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">Student ID</label>
                  <input
                    type="text"
                    required
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-2">Course / Branch</label>
                    <select
                      required
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 text-white"
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2">Year</label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 text-white"
                    >
                      <option value={1}>Year 1</option>
                      <option value={2}>Year 2</option>
                      <option value={3}>Year 3</option>
                      <option value={4}>Year 4</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 text-white"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
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
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
                  >
                    {editingStudent ? 'Update' : 'Add'} Student
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
