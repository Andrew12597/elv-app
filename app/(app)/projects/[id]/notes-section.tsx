'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { ProjectNote } from '@/lib/supabase'
import { Camera, Upload, Plus, X, Loader2 } from 'lucide-react'

type Props = {
  projectId: string
  notes: ProjectNote[]
}

export function NotesSection({ projectId, notes }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [adding, setAdding] = useState(false)
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [imageType, setImageType] = useState('image/jpeg')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleFile(file: File) {
    setImageType(file.type || 'image/jpeg')
    const reader = new FileReader()
    reader.onload = e => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    setImageBlob(file)
  }

  function resetForm() {
    setContent('')
    setAuthor('')
    setImagePreview(null)
    setImageBlob(null)
    setError('')
    setAdding(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!author.trim()) { setError('Please enter your name'); return }
    if (!content.trim() && !imageBlob) { setError('Please add a note or photo'); return }

    setSaving(true)
    setError('')

    let photo_url: string | null = null

    if (imageBlob) {
      const filename = `${projectId}/notes/${Date.now()}.jpg`
      const { data: uploadData } = await supabase.storage.from('receipts').upload(filename, imageBlob, { contentType: imageType })
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filename)
        photo_url = urlData.publicUrl
      }
    }

    const { error: insertError } = await supabase.from('project_notes').insert({
      project_id: projectId,
      content: content.trim() || null,
      author: author.trim(),
      photo_url,
    })

    if (insertError) { setError(insertError.message); setSaving(false); return }

    resetForm()
    router.refresh()
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Note / Photo
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
            <input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="e.g. Andrew"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={3}
              placeholder="Write an update, observation, or action item…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo <span className="font-normal text-gray-400">(optional)</span></label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg border border-gray-200 object-contain" />
                <button
                  type="button"
                  onClick={() => { setImagePreview(null); setImageBlob(null); if (fileRef.current) fileRef.current.value = '' }}
                  className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-0.5 hover:bg-gray-100"
                >
                  <X className="h-3.5 w-3.5 text-gray-500" />
                </button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              >
                <div className="flex justify-center gap-3 mb-1">
                  <Camera className="h-6 w-6 text-gray-300" />
                  <Upload className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-xs text-gray-400">Take or upload a photo</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save Note'}
            </button>
            <button type="button" onClick={resetForm} className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </form>
      )}

      {notes.length === 0 && !adding ? (
        <div className="bg-white rounded-xl border border-gray-200 py-10 text-center text-gray-400 text-sm">
          No notes yet. Add the first one.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                    {note.author[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{note.author}</span>
                </div>
                <span className="text-xs text-gray-400">{formatDate(note.created_at)}</span>
              </div>
              {note.content && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
              )}
              {note.photo_url && (
                <div className={note.content ? 'mt-3' : ''}>
                  <a href={note.photo_url} target="_blank" rel="noopener noreferrer">
                    <img src={note.photo_url} alt="Note photo" className="max-h-64 rounded-lg border border-gray-100 object-contain hover:opacity-90 transition-opacity" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
