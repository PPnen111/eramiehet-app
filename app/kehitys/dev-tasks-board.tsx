'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Trash2, MessageSquare, ChevronDown, ChevronUp, Plus, X } from 'lucide-react'

export type DevTask = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  category: string
  created_at: string
  created_by_name: string | null
  comment_count: number
}

type Comment = {
  id: string
  message: string
  created_at: string
  author_name: string
}

const STATUS_OPTIONS = [
  { value: 'idea', label: '💡 Idea' },
  { value: 'suunnitteilla', label: '📋 Suunnitteilla' },
  { value: 'työn_alla', label: '🔨 Työn alla' },
  { value: 'valmis', label: '✅ Valmis' },
  { value: 'hylätty', label: '❌ Hylätty' },
]

const PRIORITY_OPTIONS = [
  { value: 'kriittinen', label: '🔴 Kriittinen' },
  { value: 'korkea', label: '🟠 Korkea' },
  { value: 'normaali', label: '🟡 Normaali' },
  { value: 'matala', label: '🟢 Matala' },
]

const CATEGORY_OPTIONS = [
  { value: 'bugi', label: 'Bugi' },
  { value: 'ominaisuus', label: 'Ominaisuus' },
  { value: 'ui', label: 'UI' },
  { value: 'tietokanta', label: 'Tietokanta' },
  { value: 'yleinen', label: 'Yleinen' },
  { value: 'muu', label: 'Muu' },
]

const PRIORITY_BAR: Record<string, string> = {
  kriittinen: 'bg-red-500',
  korkea: 'bg-orange-400',
  normaali: 'bg-yellow-400',
  matala: 'bg-green-500',
}

const STATUS_BADGE: Record<string, string> = {
  idea: 'bg-purple-900/60 text-purple-300',
  suunnitteilla: 'bg-blue-900/60 text-blue-300',
  'työn_alla': 'bg-yellow-900/60 text-yellow-300',
  valmis: 'bg-green-900/60 text-green-300',
  hylätty: 'bg-stone-700 text-stone-400',
}

const FILTER_OPTIONS = [
  { value: 'kaikki', label: 'Kaikki' },
  { value: 'idea', label: '💡 Idea' },
  { value: 'suunnitteilla', label: '📋 Suunnitteilla' },
  { value: 'työn_alla', label: '🔨 Työn alla' },
  { value: 'valmis', label: '✅ Valmis' },
  { value: 'hylätty', label: '❌ Hylätty' },
]

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'juuri nyt'
  if (m < 60) return `${m} min sitten`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} t sitten`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} pv sitten`
  return new Date(iso).toLocaleDateString('fi-FI')
}

function SavedFeedback({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span className="text-xs text-green-400 animate-pulse">Tallennettu ✓</span>
  )
}

interface Props {
  initialTasks: DevTask[]
  role: string
}

export default function DevTasksBoard({ initialTasks, role }: Props) {
  const [tasks, setTasks] = useState<DevTask[]>(initialTasks)
  const [filter, setFilter] = useState('kaikki')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [errorId, setErrorId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Comments state per task
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [loadingComments, setLoadingComments] = useState<string | null>(null)
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [sendingComment, setSendingComment] = useState<string | null>(null)

  // New task form
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCategory, setNewCategory] = useState('yleinen')
  const [newPriority, setNewPriority] = useState('normaali')
  const [savingNew, setSavingNew] = useState(false)

  const showSaved = useCallback((id: string) => {
    setSavedId(id)
    setTimeout(() => setSavedId((prev) => (prev === id ? null : prev)), 2000)
  }, [])

  const showError = useCallback((id: string) => {
    setErrorId(id)
    setTimeout(() => setErrorId((prev) => (prev === id ? null : prev)), 3000)
  }, [])

  const patch = useCallback(async (id: string, update: Record<string, string | null>) => {
    const res = await fetch(`/api/dev-tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
    if (res.ok) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...update } : t)))
      showSaved(id)
    } else {
      showError(id)
    }
  }, [showSaved, showError])

  const loadComments = useCallback(async (taskId: string) => {
    if (comments[taskId]) return
    setLoadingComments(taskId)
    const res = await fetch(`/api/dev-tasks/${taskId}/comments`)
    if (res.ok) {
      const json = (await res.json()) as { comments: Comment[] }
      setComments((prev) => ({ ...prev, [taskId]: json.comments }))
    }
    setLoadingComments(null)
  }, [comments])

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => {
      const next = prev === id ? null : id
      if (next) void loadComments(next)
      return next
    })
  }, [loadComments])

  const sendComment = async (taskId: string) => {
    const msg = newComment[taskId]?.trim()
    if (!msg) return
    setSendingComment(taskId)
    const res = await fetch(`/api/dev-tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
    })
    setSendingComment(null)
    if (res.ok) {
      setNewComment((prev) => ({ ...prev, [taskId]: '' }))
      // Reload comments
      const r2 = await fetch(`/api/dev-tasks/${taskId}/comments`)
      if (r2.ok) {
        const json = (await r2.json()) as { comments: Comment[] }
        setComments((prev) => ({ ...prev, [taskId]: json.comments }))
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, comment_count: t.comment_count + 1 } : t))
      )
    }
  }

  const deleteTask = async (id: string, title: string) => {
    if (!confirm(`Haluatko varmasti poistaa tehtävän "${title}"?`)) return
    setDeletingId(id)
    const res = await fetch(`/api/dev-tasks/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id))
      if (expandedId === id) setExpandedId(null)
    }
  }

  const createTask = async () => {
    if (!newTitle.trim()) return
    setSavingNew(true)
    const res = await fetch('/api/dev-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        category: newCategory,
        priority: newPriority,
      }),
    })
    setSavingNew(false)
    if (res.ok) {
      // Reload from API
      const r2 = await fetch('/api/dev-tasks')
      if (r2.ok) {
        const json = (await r2.json()) as { tasks: DevTask[] }
        setTasks(json.tasks)
      }
      setNewTitle('')
      setNewDesc('')
      setNewCategory('yleinen')
      setNewPriority('normaali')
      setShowNewForm(false)
    }
  }

  const filtered = filter === 'kaikki' ? tasks : tasks.filter((t) => t.status === filter)

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-950 to-stone-950 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">🗺️ Kehityssuunnitelma</h1>
            <p className="mt-0.5 text-sm text-green-400">Yhteinen kehitystyötila</p>
          </div>
          <button
            onClick={() => setShowNewForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
          >
            {showNewForm ? <X size={15} /> : <Plus size={15} />}
            {showNewForm ? 'Sulje' : '+ Uusi tehtävä'}
          </button>
        </div>

        {/* New task form */}
        {showNewForm && (
          <div className="mb-6 rounded-2xl border border-green-700 bg-white/5 p-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400">Uusi tehtävä</h2>
            <input
              type="text"
              placeholder="Otsikko *"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-700 outline-none focus:border-green-500"
            />
            <textarea
              placeholder="Kuvaus"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-700 outline-none focus:border-green-500 resize-none"
            />
            <div className="flex gap-3">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 rounded-lg border border-green-800 bg-green-950 px-2 py-1.5 text-sm text-white outline-none focus:border-green-500"
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="flex-1 rounded-lg border border-green-800 bg-green-950 px-2 py-1.5 text-sm text-white outline-none focus:border-green-500"
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createTask}
                disabled={savingNew || !newTitle.trim()}
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
              >
                {savingNew ? 'Tallennetaan...' : 'Tallenna'}
              </button>
              <button
                onClick={() => setShowNewForm(false)}
                className="rounded-lg border border-green-800 px-4 py-2 text-sm text-green-400 hover:bg-white/5"
              >
                Peruuta
              </button>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === value
                  ? 'bg-green-700 text-white'
                  : 'border border-green-800 text-green-400 hover:border-green-600 hover:text-green-300'
              }`}
            >
              {label}
              {value !== 'kaikki' && (
                <span className={`ml-1.5 rounded-full px-1.5 text-xs ${filter === value ? 'bg-green-600' : 'bg-green-900 text-green-500'}`}>
                  {tasks.filter((t) => t.status === value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Task list */}
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-green-600">Ei tehtäviä.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                role={role}
                expanded={expandedId === task.id}
                onToggle={() => toggleExpand(task.id)}
                onPatch={patch}
                onDelete={deleteTask}
                deleting={deletingId === task.id}
                saved={savedId === task.id}
                error={errorId === task.id}
                comments={comments[task.id] ?? null}
                loadingComments={loadingComments === task.id}
                commentInput={newComment[task.id] ?? ''}
                onCommentInput={(v) => setNewComment((prev) => ({ ...prev, [task.id]: v }))}
                onSendComment={() => sendComment(task.id)}
                sendingComment={sendingComment === task.id}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

interface TaskCardProps {
  task: DevTask
  role: string
  expanded: boolean
  onToggle: () => void
  onPatch: (id: string, update: Record<string, string | null>) => Promise<void>
  onDelete: (id: string, title: string) => Promise<void>
  deleting: boolean
  saved: boolean
  error: boolean
  comments: Comment[] | null
  loadingComments: boolean
  commentInput: string
  onCommentInput: (v: string) => void
  onSendComment: () => void
  sendingComment: boolean
}

function TaskCard({
  task, role, expanded, onToggle, onPatch, onDelete, deleting,
  saved, error, comments, loadingComments, commentInput, onCommentInput, onSendComment, sendingComment,
}: TaskCardProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(task.title)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descValue, setDescValue] = useState(task.description ?? '')

  const titleRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editingTitle) titleRef.current?.focus()
  }, [editingTitle])

  useEffect(() => {
    if (editingDesc) descRef.current?.focus()
  }, [editingDesc])

  const saveTitle = () => {
    setEditingTitle(false)
    if (titleValue.trim() && titleValue.trim() !== task.title) {
      void onPatch(task.id, { title: titleValue.trim() })
    } else {
      setTitleValue(task.title)
    }
  }

  const saveDesc = () => {
    setEditingDesc(false)
    const val = descValue.trim()
    if (val !== (task.description ?? '')) {
      void onPatch(task.id, { description: val || null })
    }
  }

  const catLabel = CATEGORY_OPTIONS.find((c) => c.value === task.category)?.label ?? task.category
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === task.status)?.label ?? task.status

  return (
    <div className={`rounded-xl border bg-white/5 overflow-hidden transition-colors ${
      expanded ? 'border-green-600' : 'border-green-800'
    }`}>
      {/* Priority bar */}
      <div className={`h-1 w-full ${PRIORITY_BAR[task.priority] ?? 'bg-stone-600'}`} />

      {/* Card header — click to expand */}
      <div
        className="cursor-pointer px-4 py-3"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Title */}
            <div className="group flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {editingTitle ? (
                <input
                  ref={titleRef}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTitle() }}
                  className="w-full rounded border border-green-600 bg-green-900/40 px-2 py-0.5 text-sm font-semibold text-white outline-none"
                />
              ) : (
                <p
                  className="font-semibold text-white hover:text-green-200 cursor-text"
                  onClick={() => setEditingTitle(true)}
                  title="Klikkaa muokataksesi"
                >
                  {task.title}
                </p>
              )}
              {saved && <SavedFeedback show />}
              {error && <span className="text-xs text-red-400">Virhe tallennuksessa</span>}
            </div>

            {/* Badges */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-stone-700/60 px-2 py-0.5 text-xs text-stone-300">
                {catLabel}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[task.status] ?? 'bg-stone-700 text-stone-400'}`}>
                {statusLabel}
              </span>
            </div>

            {/* Meta */}
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-green-600">
              {task.created_by_name && <span>{task.created_by_name}</span>}
              <span>{relativeTime(task.created_at)}</span>
              {task.comment_count > 0 && (
                <span className="flex items-center gap-1 text-green-500">
                  <MessageSquare size={10} />
                  {task.comment_count}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onToggle() }}
            className="mt-0.5 shrink-0 text-green-600 hover:text-green-400"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-green-800/60 px-4 py-4 space-y-4">
          {/* Description */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-green-600">Kuvaus</p>
            {editingDesc ? (
              <textarea
                ref={descRef}
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                onBlur={saveDesc}
                onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) saveDesc() }}
                rows={4}
                className="w-full rounded-lg border border-green-600 bg-green-900/30 px-3 py-2 text-sm text-white outline-none resize-none"
                placeholder="Lisää kuvaus..."
              />
            ) : (
              <div
                className="group cursor-text rounded-lg border border-transparent px-3 py-2 hover:border-green-800 hover:bg-white/5 transition-colors"
                onClick={() => setEditingDesc(true)}
              >
                {task.description ? (
                  <p className="whitespace-pre-wrap text-sm text-green-200">{task.description}</p>
                ) : (
                  <p className="text-sm text-green-700 italic">Klikkaa lisätäksesi kuvaus...</p>
                )}
                <span className="mt-1 block text-xs text-green-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  Muokkaa
                </span>
              </div>
            )}
          </div>

          {/* Status + Priority */}
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-green-600">Status</p>
              <select
                value={task.status}
                onChange={(e) => void onPatch(task.id, { status: e.target.value })}
                className="w-full rounded-lg border border-green-800 bg-green-950 px-2 py-1.5 text-sm text-white outline-none focus:border-green-500"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-green-600">Prioriteetti</p>
              <select
                value={task.priority}
                onChange={(e) => void onPatch(task.id, { priority: e.target.value })}
                className="w-full rounded-lg border border-green-800 bg-green-950 px-2 py-1.5 text-sm text-white outline-none focus:border-green-500"
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Comments */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-600">
              Kommentit {task.comment_count > 0 && `(${task.comment_count})`}
            </p>
            {loadingComments ? (
              <p className="text-xs text-green-700">Ladataan...</p>
            ) : comments && comments.length > 0 ? (
              <div className="mb-3 space-y-2">
                {comments.map((c) => (
                  <div key={c.id} className="rounded-lg border border-green-900 bg-white/[0.03] px-3 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-green-300">{c.author_name}</span>
                      <span className="text-xs text-green-700">{relativeTime(c.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm text-white">{c.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-3 text-xs text-green-700 italic">Ei kommentteja vielä.</p>
            )}

            {/* Add comment */}
            <div className="flex gap-2">
              <textarea
                value={commentInput}
                onChange={(e) => onCommentInput(e.target.value)}
                placeholder="Kirjoita kommentti..."
                rows={2}
                className="flex-1 rounded-lg border border-green-800 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-700 outline-none focus:border-green-500 resize-none"
              />
              <button
                onClick={onSendComment}
                disabled={sendingComment || !commentInput.trim()}
                className="shrink-0 rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
              >
                {sendingComment ? '...' : 'Lähetä'}
              </button>
            </div>
          </div>

          {/* Delete (superadmin only) */}
          {role === 'superadmin' && (
            <div className="border-t border-green-900/60 pt-3">
              <button
                onClick={() => void onDelete(task.id, task.title)}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-lg border border-red-900 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-900/30 disabled:opacity-50 transition-colors"
              >
                <Trash2 size={14} />
                {deleting ? 'Poistetaan...' : 'Poista tehtävä'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
