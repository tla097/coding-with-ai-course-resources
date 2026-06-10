'use client'

import type { Dispatch, SetStateAction } from 'react'
import type { EditForm } from '@/hooks/useItemDrawer'
import type { FormState } from '@/components/items/ItemFormFields'
import ItemFormFields from '@/components/items/ItemFormFields'

interface Props {
  editForm: EditForm
  setEditForm: Dispatch<SetStateAction<EditForm>>
  isPro?: boolean
  showLanguage: boolean
  showContent: boolean
  showCodeEditor: boolean
  showMarkdownEditor: boolean
  showUrl: boolean
  collections: { id: string; name: string }[]
  tagSuggestions: string[]
  suggestingTags: boolean
  generatingDescription: boolean
  onSuggestTags: () => void
  onAcceptTag: (tag: string) => void
  onDismissTag: (tag: string) => void
  onGenerateDescription: () => void
}

export default function ItemDrawerEditForm({
  editForm,
  setEditForm,
  ...rest
}: Props) {
  const form: FormState = {
    title: editForm.title,
    description: editForm.description,
    content: editForm.content,
    url: editForm.url,
    language: editForm.language,
    tags: editForm.tags,
  }

  function setForm(updater: SetStateAction<FormState>) {
    setEditForm(prev => {
      const prevForm: FormState = {
        title: prev.title,
        description: prev.description,
        content: prev.content,
        url: prev.url,
        language: prev.language,
        tags: prev.tags,
      }
      const next = typeof updater === 'function' ? updater(prevForm) : updater
      return { ...prev, ...next }
    })
  }

  return (
    <ItemFormFields
      idPrefix="edit"
      form={form}
      setForm={setForm}
      selectedCollectionIds={editForm.collectionIds}
      onCollectionChange={ids => setEditForm(f => ({ ...f, collectionIds: ids }))}
      urlRequired={false}
      {...rest}
    />
  )
}
