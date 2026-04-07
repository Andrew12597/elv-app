'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Camera, Upload, Loader2, CheckCircle } from 'lucide-react'

type Project = { id: string; name: string }

type Props = {
  projects: Project[]
  defaultProjectId?: string
}

type Extracted = {
  vendor: string | null
  amount: number | null
  date: string | null
  description: string | null
}

const PRICE_CODES = ['MATERIALS', 'LABOUR', 'EQUIPMENT', 'TRANSPORT', 'SUBCONTRACT', 'OTHER']

export function ReceiptCapture({ projects, defaultProjectId }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<string>('image/jpeg')
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<Extracted | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [priceCode, setPriceCode] = useState('MATERIALS')
  const [projectId, setProjectId] = useState(defaultProjectId ?? '')

  async function handleFile(file: File) {
    const mt = file.type || 'image/jpeg'
    setMediaType(mt)

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      setImagePreview(dataUrl)

      // Extract base64 data
      const base64 = dataUrl.split(',')[1]
      setImageBase64(base64)

      // Auto-extract
      setExtracting(true)
      setError('')
      try {
        const res = await fetch('/api/extract-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType: mt }),
        })
        if (res.ok) {
          const data: Extracted = await res.json()
          setExtracted(data)
          if (data.vendor) setVendor(data.vendor)
          if (data.amount) setAmount(String(data.amount))
          if (data.date) setDate(data.date)
          if (data.description) setDescription(data.description)
        } else {
          setError('Could not extract receipt data. Please fill in manually.')
        }
      } catch {
        setError('Extraction failed. Please fill in manually.')
      }
      setExtracting(false)
    }
    reader.readAsDataURL(file)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!projectId) { setError('Please select a project'); return }
    setSaving(true)
    setError('')

    let receipt_url: string | null = null

    // Upload receipt image if we have one
    if (imageBase64) {
      const filename = `${projectId}/${Date.now()}.jpg`
      const blob = await fetch(`data:${mediaType};base64,${imageBase64}`).then(r => r.blob())
      const { data: uploadData } = await supabase.storage.from('receipts').upload(filename, blob, { contentType: mediaType })
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filename)
        receipt_url = urlData.publicUrl
      }
    }

    const { error: insertError } = await supabase.from('expenses').insert({
      project_id: projectId,
      vendor,
      amount: Number(amount),
      date,
      description,
      price_code: priceCode,
      receipt_url,
    })

    if (insertError) { setError(insertError.message); setSaving(false); return }

    setSaved(true)
    setTimeout(() => router.push(defaultProjectId ? `/projects/${defaultProjectId}` : '/expenses'), 1200)
  }

  return (
    <div className="space-y-6">
      {/* Image upload */}
      <div
        className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {imagePreview ? (
          <div className="space-y-2">
            <img src={imagePreview} alt="Receipt" className="max-h-64 mx-auto rounded-lg object-contain" />
            {extracting && (
              <div className="flex items-center justify-center gap-2 text-blue-600 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Extracting receipt data with AI…
              </div>
            )}
            {extracted && !extracting && (
              <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                Data extracted — review below
              </div>
            )}
            <p className="text-xs text-gray-400">Click or drag to replace</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center gap-4">
              <Camera className="h-10 w-10 text-gray-300" />
              <Upload className="h-10 w-10 text-gray-300" />
            </div>
            <p className="font-medium text-gray-600">Take a photo or upload a receipt</p>
            <p className="text-sm text-gray-400">AI will automatically extract the vendor, amount and date</p>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Expense Details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select project…</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <input
              value={vendor}
              onChange={e => setVendor(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Supplier name"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              value={date}
              onChange={e => setDate(e.target.value)}
              type="date"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Code</label>
            <select
              value={priceCode}
              onChange={e => setPriceCode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRICE_CODES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What was purchased?"
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || saved || extracting}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : saving ? 'Saving…' : 'Save Expense'}
          </button>
          <a href={defaultProjectId ? `/projects/${defaultProjectId}` : '/expenses'} className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
