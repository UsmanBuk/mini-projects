'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Note, Conversation } from '../../../shared/types'

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}
import { Plus, Search, MessageSquare, NotebookPen, LogOut, User } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadDashboardData()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/auth/login')
      return
    }

    setUser(session.user)
  }

  const loadDashboardData = async () => {
    try {
      // Load recent notes
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10)

      if (notesError) throw notesError

      // Load recent conversations
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5)

      if (conversationsError) throw conversationsError

      setNotes(notesData || [])
      setConversations(conversationsData || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const filteredNotes = notes.filter(note =>
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-white/60 mt-4">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">Note Tracker</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center text-white/60">
                <User className="w-4 h-4 mr-2" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-white/60 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.user_metadata?.name || user?.email?.split('@')[0]}
          </h2>
          <p className="text-white/60">Here's your productivity overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <NotebookPen className="w-8 h-8 text-purple-400 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-white">Total Notes</h3>
                <p className="text-2xl font-bold text-purple-400">{notes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-pink-400 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-white">Conversations</h3>
                <p className="text-2xl font-bold text-pink-400">{conversations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <Search className="w-8 h-8 text-blue-400 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-white">This Week</h3>
                <p className="text-2xl font-bold text-blue-400">
                  {notes.filter(note => {
                    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
                    return new Date(note.created_at).getTime() >= weekAgo
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Notes Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Recent Notes</h3>
              <Link
                href="/notes"
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Link>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Notes List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-8">
                  <NotebookPen className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40">No notes yet. Create your first note!</p>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/notes/${note.id}`}
                    className="block bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors border border-white/10"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-white truncate">
                        {note.title || 'Untitled Note'}
                      </h4>
                      <span className="text-xs text-white/40 ml-2">
                        {formatTimestamp(note.updated_at)}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm line-clamp-2">
                      {note.content}
                    </p>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {note.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="text-xs text-white/40">
                            +{note.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <Link
                href="/notes"
                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
              >
                View all notes →
              </Link>
            </div>
          </div>

          {/* Recent Conversations Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">AI Conversations</h3>
              <Link
                href="/chat"
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                New Chat
              </Link>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40">No conversations yet. Start chatting with AI!</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/chat/${conversation.id}`}
                    className="block bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors border border-white/10"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-white truncate">
                        {conversation.title}
                      </h4>
                      <span className="text-xs text-white/40 ml-2">
                        {formatTimestamp(conversation.updated_at)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <Link
                href="/chat"
                className="text-pink-400 hover:text-pink-300 text-sm font-medium"
              >
                View all chats →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}