import { SupabaseClient } from '@supabase/supabase-js'
import Store from 'electron-store'
import { Note as LocalNote, ChatMessage as LocalChatMessage } from '../react/types'
import { Note as CloudNote, Conversation, ChatMessage as CloudChatMessage } from '../../shared/types'

interface SyncState {
  lastSyncTime: number
  pendingNotes: LocalNote[]
  pendingMessages: LocalChatMessage[]
  isOnline: boolean
}

export class SyncService {
  private store: Store
  private supabase: SupabaseClient
  private syncState: SyncState
  private userId: string | null = null
  private syncInterval: NodeJS.Timeout | null = null

  constructor(store: Store, supabase: SupabaseClient) {
    this.store = store
    this.supabase = supabase
    this.syncState = {
      lastSyncTime: this.store.get('lastSyncTime', 0) as number,
      pendingNotes: this.store.get('pendingNotes', []) as LocalNote[],
      pendingMessages: this.store.get('pendingMessages', []) as LocalChatMessage[],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    }

    // Monitor online status (in main process, we'll handle this differently)
    // These will be handled by the renderer process and communicated via IPC
  }

  setUserId(userId: string | null) {
    this.userId = userId
    if (userId) {
      this.fixOldNoteIds() // Fix any notes with timestamp IDs
      this.startPeriodicSync()
      this.syncFromCloud() // Initial sync when user logs in
    } else {
      this.stopPeriodicSync()
    }
  }

  // Fix old notes that have timestamp IDs instead of UUIDs
  private fixOldNoteIds() {
    const notes = this.store.get('notes', []) as LocalNote[]
    const pendingNotes = this.store.get('pendingNotes', []) as LocalNote[]
    let hasChanges = false

    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    // Check if an ID is a timestamp (all digits)
    const isTimestampId = (id: string) => /^\d+$/.test(id)

    // Fix regular notes
    const fixedNotes = notes.map(note => {
      if (isTimestampId(note.id)) {
        hasChanges = true
        return { ...note, id: generateUUID() }
      }
      return note
    })

    // Clear pending notes with timestamp IDs (they can't sync anyway)
    const fixedPending = pendingNotes.filter(note => !isTimestampId(note.id))

    if (hasChanges || pendingNotes.length !== fixedPending.length) {
      this.store.set('notes', fixedNotes)
      this.store.set('pendingNotes', fixedPending)
      this.syncState.pendingNotes = fixedPending
      console.log('Fixed old notes with timestamp IDs')
    }
  }

  private startPeriodicSync() {
    if (this.syncInterval) clearInterval(this.syncInterval)

    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.syncState.isOnline && this.userId) {
        this.syncFromCloud()
        this.syncPendingChanges()
      }
    }, 30000)
  }

  private stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  // Convert local note format to cloud format
  private convertLocalToCloudNote(localNote: LocalNote): Omit<CloudNote, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
    return {
      content: localNote.text,
      title: this.extractTitleFromContent(localNote.text) || undefined,
      tags: localNote.tags
    }
  }

  // Convert cloud note format to local format
  private convertCloudToLocalNote(cloudNote: CloudNote): LocalNote {
    return {
      id: cloudNote.id,
      text: cloudNote.content,
      timestamp: new Date(cloudNote.updated_at).getTime(),
      tags: cloudNote.tags
    }
  }

  // Extract title from content (first line or first 50 chars)
  private extractTitleFromContent(content: string): string | null {
    const lines = content.trim().split('\n')
    const firstLine = lines[0]?.trim()

    if (!firstLine) return null

    // If first line is short, use it as title
    if (firstLine.length <= 50) {
      return firstLine
    }

    // Otherwise, truncate to 50 chars
    return firstLine.substring(0, 47) + '...'
  }

  // Save note locally and queue for cloud sync
  async saveNoteLocally(note: LocalNote): Promise<LocalNote[]> {
    const notes = this.store.get('notes', []) as LocalNote[]

    // Update existing note or add new one
    const existingIndex = notes.findIndex(n => n.id === note.id)
    if (existingIndex >= 0) {
      notes[existingIndex] = note
    } else {
      notes.unshift(note)
    }

    this.store.set('notes', notes)

    // Add to pending sync queue if online and authenticated
    if (this.userId) {
      this.addToPendingNotes(note)
      if (this.syncState.isOnline) {
        this.syncPendingChanges()
      }
    }

    return notes
  }

  // Delete note locally and queue for cloud sync
  async deleteNoteLocally(noteId: string): Promise<LocalNote[]> {
    const notes = this.store.get('notes', []) as LocalNote[]
    const updatedNotes = notes.filter(note => note.id !== noteId)
    this.store.set('notes', updatedNotes)

    // Sync deletion to cloud if authenticated
    if (this.userId && this.syncState.isOnline) {
      try {
        await this.supabase
          .from('notes')
          .delete()
          .eq('id', noteId)
          .eq('user_id', this.userId)
      } catch (error) {
        console.error('Failed to delete note from cloud:', error)
      }
    }

    return updatedNotes
  }

  // Add note to pending sync queue
  private addToPendingNotes(note: LocalNote) {
    const pending = this.syncState.pendingNotes.filter(n => n.id !== note.id)
    pending.push(note)
    this.syncState.pendingNotes = pending
    this.store.set('pendingNotes', pending)
  }

  // Sync pending changes to cloud
  private async syncPendingChanges() {
    if (!this.userId || !this.syncState.isOnline) return

    // Sync pending notes
    const pendingNotes = [...this.syncState.pendingNotes]
    for (const note of pendingNotes) {
      try {
        const cloudNote = this.convertLocalToCloudNote(note)

        const { error } = await this.supabase
          .from('notes')
          .upsert({
            id: note.id,
            user_id: this.userId,
            ...cloudNote
          })

        if (error) throw error

        // Remove from pending queue
        this.syncState.pendingNotes = this.syncState.pendingNotes.filter(n => n.id !== note.id)
      } catch (error) {
        console.error('Failed to sync note to cloud:', error)
        break // Stop syncing if we hit an error
      }
    }

    // Update pending queue in store
    this.store.set('pendingNotes', this.syncState.pendingNotes)
  }

  // Sync from cloud to local
  async syncFromCloud(): Promise<void> {
    if (!this.userId || !this.syncState.isOnline) return

    try {
      // Get notes updated since last sync
      const { data: cloudNotes, error } = await this.supabase
        .from('notes')
        .select('*')
        .eq('user_id', this.userId)
        .gte('updated_at', new Date(this.syncState.lastSyncTime).toISOString())
        .order('updated_at', { ascending: false })

      if (error) throw error

      if (cloudNotes && cloudNotes.length > 0) {
        const localNotes = this.store.get('notes', []) as LocalNote[]

        // Merge cloud notes with local notes
        const mergedNotes = this.mergeNotes(localNotes, cloudNotes)
        this.store.set('notes', mergedNotes)

        // Update last sync time
        this.syncState.lastSyncTime = Date.now()
        this.store.set('lastSyncTime', this.syncState.lastSyncTime)
      }
    } catch (error) {
      console.error('Failed to sync from cloud:', error)
    }
  }

  // Merge cloud notes with local notes (conflict resolution)
  private mergeNotes(localNotes: LocalNote[], cloudNotes: CloudNote[]): LocalNote[] {
    const mergedMap = new Map<string, LocalNote>()

    // Add all local notes to map
    localNotes.forEach(note => {
      mergedMap.set(note.id, note)
    })

    // Process cloud notes
    cloudNotes.forEach(cloudNote => {
      const localNote = mergedMap.get(cloudNote.id)
      const cloudNoteAsLocal = this.convertCloudToLocalNote(cloudNote)

      if (!localNote) {
        // New cloud note, add it
        mergedMap.set(cloudNote.id, cloudNoteAsLocal)
      } else {
        // Conflict resolution: use newer timestamp
        const cloudTimestamp = new Date(cloudNote.updated_at).getTime()
        if (cloudTimestamp > localNote.timestamp) {
          mergedMap.set(cloudNote.id, cloudNoteAsLocal)
        }
        // If local is newer, keep local version (it will sync to cloud later)
      }
    })

    // Convert map back to array, sorted by timestamp
    return Array.from(mergedMap.values())
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  // Initialize data migration from local to cloud
  async migrateLocalDataToCloud(): Promise<void> {
    if (!this.userId) return

    const localNotes = this.store.get('notes', []) as LocalNote[]
    const localChat = this.store.get('chatHistory', []) as LocalChatMessage[]

    try {
      // Migrate notes
      for (const localNote of localNotes) {
        const cloudNote = this.convertLocalToCloudNote(localNote)

        await this.supabase
          .from('notes')
          .upsert({
            id: localNote.id,
            user_id: this.userId,
            ...cloudNote,
            created_at: new Date(localNote.timestamp).toISOString(),
            updated_at: new Date(localNote.timestamp).toISOString()
          })
      }

      // Migrate chat history (create a single conversation)
      if (localChat.length > 0) {
        // Create a conversation for migrated chat
        const { data: conversation, error: convError } = await this.supabase
          .from('conversations')
          .insert({
            user_id: this.userId,
            title: 'Migrated Chat History'
          })
          .select()
          .single()

        if (convError) throw convError

        // Add all messages to the conversation
        const messages = localChat.map(msg => ({
          conversation_id: conversation.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp).toISOString()
        }))

        await this.supabase
          .from('messages')
          .insert(messages)
      }

      console.log('Data migration completed successfully')
    } catch (error) {
      console.error('Data migration failed:', error)
      throw error
    }
  }

  // Get sync status for UI
  getSyncStatus(): {
    isOnline: boolean
    pendingChanges: number
    lastSyncTime: number
    isAuthenticated: boolean
  } {
    return {
      isOnline: this.syncState.isOnline,
      pendingChanges: this.syncState.pendingNotes.length + this.syncState.pendingMessages.length,
      lastSyncTime: this.syncState.lastSyncTime,
      isAuthenticated: !!this.userId
    }
  }

  // Force sync now
  async forcSync(): Promise<void> {
    if (this.userId && this.syncState.isOnline) {
      await this.syncPendingChanges()
      await this.syncFromCloud()
    }
  }
}