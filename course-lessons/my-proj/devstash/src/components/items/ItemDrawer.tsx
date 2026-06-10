'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useItemDrawer } from '@/hooks/useItemDrawer'
import DrawerSkeleton from '@/components/items/DrawerSkeleton'
import ItemDrawerActionBar from '@/components/items/ItemDrawerActionBar'
import ItemDrawerEditForm from '@/components/items/ItemDrawerEditForm'
import ItemDrawerReadView from '@/components/items/ItemDrawerReadView'

interface Props {
  itemId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  collections: { id: string; name: string }[]
  isPro?: boolean
}

export default function ItemDrawer({ itemId, open, onOpenChange, collections, isPro }: Props) {
  const {
    item,
    loading,
    isFavorite,
    isPinned,
    isEditing,
    editForm,
    setEditForm,
    saving,
    deleting,
    favoriting,
    pinning,
    tagSuggestions,
    suggestingTags,
    generatingDescription,
    handleEditStart,
    handleUseOptimized,
    handleCancelEdit,
    handleSave,
    handleDelete,
    handleToggleFavorite,
    handleTogglePin,
    handleCopy,
    handleSuggestTags,
    handleAcceptTag,
    handleDismissTag,
    handleGenerateDescription,
    Icon,
    typeName,
    showContent,
    showLanguage,
    showCodeEditor,
    showMarkdownEditor,
    showUrl,
    showFile,
  } = useItemDrawer({ itemId, open, onOpenChange })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 sm:max-w-lg"
      >
        {loading && <DrawerSkeleton />}

        {!loading && item && (
          <>
            <SheetHeader className="px-5 pt-5 pb-4 border-b border-border gap-2">
              <div className="flex items-center gap-2 pr-8">
                {Icon && (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${item.itemType.color}20` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: item.itemType.color }} />
                  </div>
                )}
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: `${item.itemType.color}20`, color: item.itemType.color }}
                >
                  {item.itemType.name}
                </span>
                {!isEditing && item.language && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {item.language}
                  </span>
                )}
              </div>
              <SheetTitle className="text-lg pr-8 leading-snug">
                {isEditing ? (editForm.title || 'Editing…') : item.title}
              </SheetTitle>
            </SheetHeader>

            <ItemDrawerActionBar
              isEditing={isEditing}
              saving={saving}
              deleting={deleting}
              favoriting={favoriting}
              pinning={pinning}
              isFavorite={isFavorite}
              isPinned={isPinned}
              showFile={showFile}
              fileUrl={item.fileUrl}
              fileName={item.fileName}
              editFormTitle={editForm.title}
              onSave={handleSave}
              onCancelEdit={handleCancelEdit}
              onToggleFavorite={handleToggleFavorite}
              onTogglePin={handleTogglePin}
              onCopy={handleCopy}
              onEditStart={handleEditStart}
              onDelete={handleDelete}
            />

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {isEditing ? (
                <ItemDrawerEditForm
                  editForm={editForm}
                  setEditForm={setEditForm}
                  isPro={isPro}
                  showLanguage={showLanguage}
                  showContent={showContent}
                  showCodeEditor={showCodeEditor}
                  showMarkdownEditor={showMarkdownEditor}
                  showUrl={showUrl}
                  collections={collections}
                  tagSuggestions={tagSuggestions}
                  suggestingTags={suggestingTags}
                  generatingDescription={generatingDescription}
                  onSuggestTags={handleSuggestTags}
                  onAcceptTag={handleAcceptTag}
                  onDismissTag={handleDismissTag}
                  onGenerateDescription={handleGenerateDescription}
                />
              ) : (
                <ItemDrawerReadView
                  item={item}
                  isPro={isPro}
                  typeName={typeName}
                  showCodeEditor={showCodeEditor}
                  showMarkdownEditor={showMarkdownEditor}
                  showFile={showFile}
                  onUseOptimized={handleUseOptimized}
                />
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
