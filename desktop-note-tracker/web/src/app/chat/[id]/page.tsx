'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Conversation, ChatMessage, Note } from '../../../../../shared/types'

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}
import {
  Send,
  ArrowLeft,
  MessageSquare,
  NotebookPen,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react'
import Link from 'next/link'

export default function ChatConversationPage() {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const [showNoteSelector, setShowNoteSelector] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (params.id) {
      checkAuth()
      loadConversation(params.id as string)
      loadNotes()
    }
  }, [params.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
    }
  }

  const loadConversation = async (conversationId: string) => {
    try {
      // Load conversation
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (convError) throw convError

      setConversation(convData)

      // Load messages
      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true })

      if (msgError) throw msgError

      setMessages(msgData || [])
    } catch (error: any) {
      setError(error.message)
      if (error.code === 'PGRST116') {
        router.push('/chat')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Error loading notes:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return

    setSending(true)
    const userMessage = newMessage.trim()
    setNewMessage('')

    try {
      // Add user message to database
      const { data: userMsgData, error: userMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: userMessage
        } as any)
        .select()
        .single()

      if (userMsgError) throw userMsgError

      // Update messages state
      const newUserMessage: ChatMessage = {
        id: userMsgData.id,
        conversation_id: conversation.id,
        role: 'user',
        content: userMessage,
        timestamp: userMsgData.timestamp
      }
      setMessages(prev => [...prev, newUserMessage])

      // Prepare context from selected notes
      let contextText = ''
      if (selectedNotes.length > 0) {
        const selectedNotesList = notes.filter(note => selectedNotes.includes(note.id))
        contextText = selectedNotesList.map(note =>
          `Note: ${note.title || 'Untitled'}\n${note.content}\nTags: ${note.tags.join(', ')}`
        ).join('\n\n')
      }

      // Call Claude API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          context: contextText,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      })

      if (!response.ok) throw new Error('Failed to get AI response')

      const { response: aiResponse } = await response.json()

      // Add AI message to database
      const { data: aiMsgData, error: aiMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: aiResponse
        } as any)
        .select()
        .single()

      if (aiMsgError) throw aiMsgError

      // Update messages state
      const newAiMessage: ChatMessage = {
        id: aiMsgData.id,
        conversation_id: conversation.id,
        role: 'assistant',
        content: aiResponse,
        timestamp: aiMsgData.timestamp
      }
      setMessages(prev => [...prev, newAiMessage])

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id)

    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const deleteConversation = async () => {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversation!.id)

      if (error) throw error

      router.push('/chat')
    } catch (error: any) {
      setError(error.message)
    }
  }

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes(prev =>
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-white/60 mt-4">Loading conversation...</p>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Conversation not found</h2>
          <Link href="/chat" className="text-purple-400 hover:text-purple-300">
            ← Back to chat
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/chat"
                className="text-white/60 hover:text-white mr-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <MessageSquare className="w-5 h-5 text-white/60 mr-3" />
              <h1 className="text-xl font-bold text-white">{conversation.title}</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNoteSelector(!showNoteSelector)}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  showNoteSelector ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/60 hover:text-white'
                }`}
              >
                <NotebookPen className="w-4 h-4 mr-2" />
                Notes ({selectedNotes.length})
                {showNoteSelector ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </button>
              <button
                onClick={deleteConversation}
                className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                title="Delete conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Note Selector */}
          {showNoteSelector && (
            <div className="pb-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/20">
                <h3 className="text-white font-medium mb-3">Select notes to include as context:</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {notes.map((note) => (
                    <label
                      key={note.id}
                      className="flex items-start p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedNotes.includes(note.id)}
                        onChange={() => toggleNoteSelection(note.id)}
                        className="mt-1 mr-3 accent-purple-500"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">
                          {note.title || 'Untitled Note'}
                        </h4>
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
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Start the conversation</h3>
              <p className="text-white/60">Ask questions about your notes or anything else!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-xl ${
                    message.role === 'user'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-purple-100' : 'text-white/40'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mx-6 mb-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white/10 backdrop-blur-lg border-t border-white/20 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="flex-1 p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors flex items-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {selectedNotes.length > 0 && (
            <div className="mt-2 text-xs text-white/60">
              Including {selectedNotes.length} note{selectedNotes.length !== 1 ? 's' : ''} as context
            </div>
          )}
        </div>
      </div>
    </div>
  )
}