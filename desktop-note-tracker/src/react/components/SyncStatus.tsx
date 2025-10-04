import React from 'react'
import { motion } from 'framer-motion'
import { Cloud, CloudOff, Loader2, Check, AlertCircle, Wifi, WifiOff } from 'lucide-react'

interface SyncStatusProps {
  isOnline: boolean
  isAuthenticated: boolean
  pendingChanges: number
  lastSyncTime: number
  isSyncing: boolean
  onSync?: () => void
  onLogout?: () => void
}

export default function SyncStatus({
  isOnline,
  isAuthenticated,
  pendingChanges,
  lastSyncTime,
  isSyncing,
  onSync,
  onLogout
}: SyncStatusProps) {
  const formatLastSync = (timestamp: number) => {
    if (!timestamp) return 'Never'

    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const getSyncIcon = () => {
    if (!isAuthenticated) {
      return <CloudOff className="w-4 h-4 text-gray-400" />
    }

    if (!isOnline) {
      return <WifiOff className="w-4 h-4 text-red-400" />
    }

    if (isSyncing) {
      return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
    }

    if (pendingChanges > 0) {
      return <AlertCircle className="w-4 h-4 text-yellow-400" />
    }

    return <Check className="w-4 h-4 text-green-400" />
  }

  const getSyncStatus = () => {
    if (!isAuthenticated) return 'Offline mode'
    if (!isOnline) return 'No connection'
    if (isSyncing) return 'Syncing...'
    if (pendingChanges > 0) return `${pendingChanges} pending`
    return 'Synced'
  }

  const getSyncColor = () => {
    if (!isAuthenticated) return 'text-gray-400'
    if (!isOnline) return 'text-red-400'
    if (isSyncing) return 'text-blue-400'
    if (pendingChanges > 0) return 'text-yellow-400'
    return 'text-green-400'
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
      {/* Sync Status */}
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ scale: isSyncing ? [1, 1.1, 1] : 1 }}
          transition={{ repeat: isSyncing ? Infinity : 0, duration: 1.5 }}
        >
          {getSyncIcon()}
        </motion.div>

        <div className="min-w-0 flex-1">
          <div className={`text-sm font-medium ${getSyncColor()}`}>
            {getSyncStatus()}
          </div>

          {isAuthenticated && (
            <div className="text-xs text-white/40">
              Last sync: {formatLastSync(lastSyncTime)}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Network Status Indicator */}
        <div className={`flex items-center gap-1 text-xs ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
          {isOnline ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          {isOnline ? 'Online' : 'Offline'}
        </div>

        {/* Sync Button */}
        {isAuthenticated && isOnline && onSync && (
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="text-white/60 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>
        )}

        {/* Logout Button */}
        {isAuthenticated && onLogout && (
          <button
            onClick={onLogout}
            className="text-white/60 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  )
}