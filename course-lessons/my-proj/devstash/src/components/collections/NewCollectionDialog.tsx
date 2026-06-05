'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderPlus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createCollection } from '@/actions/collections'

interface FormState {
  name: string
  description: string
}

const EMPTY_FORM: FormState = { name: '', description: '' }

export default function NewCollectionDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  function handleOpen() {
    setForm(EMPTY_FORM)
    setSaving(false)
    setOpen(true)
  }

  function handleClose(value: boolean) {
    if (!saving) setOpen(value)
  }

  const canSubmit = form.name.trim().length > 0

  async function handleSubmit() {
    if (!canSubmit) return
    setSaving(true)

    const result = await createCollection({
      name: form.name,
      description: form.description || null,
    })

    setSaving(false)

    if (!result.success) {
      const msg =
        typeof result.error === 'string'
          ? result.error
          : 'Validation failed. Please check your inputs.'
      toast.error(msg)
      return
    }

    toast.success('Collection created')
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        <FolderPlus className="h-4 w-4" />
        New Collection
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent showCloseButton={!saving}>
          <DialogHeader>
            <DialogTitle>New Collection</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="col-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="col-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. React Patterns"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="col-description">Description</Label>
              <Textarea
                id="col-description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description (optional)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!canSubmit || saving}>
              {saving ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
