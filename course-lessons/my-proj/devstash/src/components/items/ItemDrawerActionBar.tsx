'use client'

import { Star, Pin, Copy, Pencil, Trash2, Save, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Props {
  isEditing: boolean
  saving: boolean
  deleting: boolean
  favoriting: boolean
  pinning: boolean
  isFavorite: boolean
  isPinned: boolean
  showFile: boolean
  fileUrl?: string | null
  fileName?: string | null
  editFormTitle: string
  onSave: () => void
  onCancelEdit: () => void
  onToggleFavorite: () => void
  onTogglePin: () => void
  onCopy: () => void
  onEditStart: () => void
  onDelete: () => void
}

export default function ItemDrawerActionBar({
  isEditing,
  saving,
  deleting,
  favoriting,
  pinning,
  isFavorite,
  isPinned,
  showFile,
  fileUrl,
  fileName,
  editFormTitle,
  onSave,
  onCancelEdit,
  onToggleFavorite,
  onTogglePin,
  onCopy,
  onEditStart,
  onDelete,
}: Props) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-border">
      {isEditing ? (
        <>
          <Button
            size="sm"
            onClick={onSave}
            disabled={saving || !editFormTitle.trim()}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancelEdit} disabled={saving}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFavorite}
            disabled={favoriting}
            className={isFavorite ? 'text-yellow-500 hover:text-yellow-600' : ''}
          >
            <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500' : ''}`} />
            {isFavorite ? 'Unfavorite' : 'Favorite'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePin}
            disabled={pinning}
            className={isPinned ? 'text-foreground' : ''}
          >
            <Pin className={`h-4 w-4 ${isPinned ? 'fill-foreground' : ''}`} />
            {isPinned ? 'Unpin' : 'Pin'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onCopy}>
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          {showFile && fileUrl && (
            <Button
              variant="ghost"
              size="sm"
              render={<a href={`/api/download?path=${encodeURIComponent(fileUrl)}`} download={fileName ?? undefined} />}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}
          <div className="ml-auto flex items-center gap-0.5">
            <Button variant="ghost" size="icon-sm" onClick={onEditStart}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    disabled={deleting}
                  />
                }
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The item will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </>
      )}
    </div>
  )
}
