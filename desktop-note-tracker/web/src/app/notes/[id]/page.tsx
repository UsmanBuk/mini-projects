'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Note } from '@shared/types'
import { formatDateTime } from '@shared/utils'
import { ArrowLeft, Save, Tag, X, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function EditNotePage() {
  const [note, setNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    if (params.id) {
      loadNote(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    if (note) {
      const changed =
        title !== (note.title || '') ||
        content !== note.content ||
        JSON.stringify(tags) !== JSON.stringify(note.tags)
      setHasChanges(changed)
    }
  }, [title, content, tags, note])

  const loadNote = async (noteId: string) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single()

      if (error) throw error

      setNote(data)
      setTitle(data.title || '')
      setContent(data.content)
      setTags(data.tags)
    } catch (error: any) {
      setError(error.message)
      // If note not found, redirect to notes list
      if (error.code === 'PGRST116') {
        router.push('/notes')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase()
      if (!tags.includes(tag)) {
        setTags([...tags, tag])
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Content is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: title.trim() || null,
          content: content.trim(),
          tags
        })
        .eq('id', note!.id)

      if (error) throw error

      // Reload note to get updated timestamp
      await loadNote(note!.id)
      setHasChanges(false)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note!.id)

      if (error) throw error

      router.push('/notes')
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-white/60 mt-4">Loading note...</p>
        </div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Note not found</h2>
          <Link href="/notes" className="text-purple-400 hover:text-purple-300">
            ← Back to notes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/notes"
                className="text-white/60 hover:text-white mr-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-white">Edit Note</h1>
              {hasChanges && (
                <span className="ml-3 text-sm text-yellow-400">• Unsaved changes</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                title="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <span className="text-xs text-white/40">Ctrl+S to save</span>
              <button
                onClick={handleSave}
                disabled={saving || !content.trim() || !hasChanges}
                className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
          <div className="p-6">
            {/* Title */}
            <input
              type="text"
              placeholder="Note title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold text-white placeholder-white/40 bg-transparent border-none outline-none mb-6"
              onKeyDown={handleKeyDown}
            />

            {/* Tags */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-white/60" />
                <span className="text-white/60 text-sm">Tags</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <input
                type="text"
                placeholder="Add tags (press Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Content */}
            <div className="mb-6">
              <textarea
                placeholder="Start writing your note..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-96 text-white placeholder-white/40 bg-transparent border border-white/20 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-sm text-white/40">
              <span>
                {content.length} characters
              </span>
              <div className="flex gap-4">
                <span>Created: {formatDateTime(note.created_at)}</span>
                <span>Updated: {formatDateTime(note.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}