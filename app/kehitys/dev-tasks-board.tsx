'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Trash2, MessageSquare, Plus, X, ChevronLeft, LayoutGrid, TrendingUp, Sparkles, Lock, Users } from 'lucide-react'
import Link from 'next/link'
import FeatureMatrix from './feature-matrix'
import GrowthStrategy from './growth-strategy'
import FutureNotes from './future-notes'

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
  sort_order?: number | null
}

type Comment = {
  id: string
  message: string
  created_at: string
  author_name: string
}

const COLUMNS = [
  { value: 'idea', label: '💡 Idea' },
  { value: 'suunnitteilla', label: '📋 Suunnitteilla' },
  { value: 'tyon_alla', label: '🔨 Työn alla' },
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

const PRIORITY_DOT: Record<string, string> = {
  kriittinen: 'bg-red-500',
  korkea: 'bg-orange-400',
  normaali: 'bg-yellow-400',
  matala: 'bg-green-500',
}

const COL_HEADER: Record<string, string> = {
  idea: 'text-purple-300 border-purple-800',
  suunnitteilla: 'text-blue-300 border-blue-800',
  tyon_alla: 'text-[#92400e] border-[#fcd34d]',
  valmis: 'text-[#1e3d1e] border-[#e0d8cc]',
  hylätty: 'text-[#888888] border-[#e0d8cc]',
}

const COL_BG: Record<string, string> = {
  idea: 'bg-purple-900/10',
  suunnitteilla: 'bg-blue-900/10',
  tyon_alla: 'bg-[#fef3c7]/10',
  valmis: 'bg-white',
  hylätty: 'bg-[#1e3d1e]/10',
}

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

interface Props {
  initialTasks: DevTask[]
  role: string
}

type PageTab = 'kanban' | 'ominaisuudet' | 'kasvustrategia' | 'tulevaisuus'

export default function DevTasksBoard({ initialTasks, role }: Props) {
  const [pageTab, setPageTab] = useState<PageTab>('kanban')
  const [tasks, setTasks] = useState<DevTask[]>(initialTasks)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [newTaskCol, setNewTaskCol] = useState<string | null>(null)

  // Comments
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [loadingComments, setLoadingComments] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  const selectedTask = tasks.find((t) => t.id === selectedId) ?? null

  const showSaved = useCallback((id: string) => {
    setSavedId(id)
    setTimeout(() => setSavedId((prev) => (prev === id ? null : prev)), 2000)
  }, [])

  const patch = useCallback(async (id: string, update: Record<string, string | null | number>) => {
    const res = await fetch(`/api/dev-tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
    if (res.ok) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...update } : t)))
      showSaved(id)
    }
  }, [showSaved])

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

  useEffect(() => {
    if (selectedId) void loadComments(selectedId)
  }, [selectedId, loadComments])

  const sendComment = async () => {
    if (!selectedId || !newComment.trim()) return
    setSendingComment(true)
    const res = await fetch(`/api/dev-tasks/${selectedId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newComment.trim() }),
    })
    setSendingComment(false)
    if (res.ok) {
      setNewComment('')
      const r2 = await fetch(`/api/dev-tasks/${selectedId}/comments`)
      if (r2.ok) {
        const json = (await r2.json()) as { comments: Comment[] }
        setComments((prev) => ({ ...prev, [selectedId]: json.comments }))
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === selectedId ? { ...t, comment_count: t.comment_count + 1 } : t))
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
      setSelectedId(null)
    }
  }

  // Drag and drop
  const handleDragStart = (id: string) => setDraggingId(id)
  const handleDragEnd = () => { setDraggingId(null); setDragOverCol(null) }
  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault()
    setDragOverCol(col)
  }
  const handleDrop = (col: string) => {
    if (draggingId && draggingId !== col) {
      const task = tasks.find((t) => t.id === draggingId)
      if (task && task.status !== col) {
        void patch(draggingId, { status: col })
      }
    }
    setDraggingId(null)
    setDragOverCol(null)
  }

  const pageTabBtn = (tab: PageTab, label: string, icon?: React.ReactNode, access?: 'shared' | 'superadmin') => (
    <button
      onClick={() => setPageTab(tab)}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        pageTab === tab
          ? 'bg-[#1e3d1e] text-white'
          : 'text-[#2d6a2d] hover:bg-[#f0ebe3]'
      }`}
    >
      {icon}
      {label}
      {role === 'superadmin' && access === 'shared' && <Users size={10} className="ml-0.5 opacity-50" />}
      {role === 'superadmin' && access === 'superadmin' && <Lock size={10} className="ml-0.5 opacity-50" />}
    </button>
  )

  return (
    <main className="min-h-screen bg-[#f5f0e8]">
      {/* Top bar */}
      <div className="px-4 pt-6 pb-4">
        <Link href="/dashboard" className="mb-3 flex items-center gap-1 text-sm text-[#2d6a2d] hover:text-[#1e3d1e]">
          <ChevronLeft className="h-4 w-4" />
          Takaisin
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1a1a1a]">🗺️ Kehityssuunnitelma</h1>
            <p className="text-xs text-[#4a4a4a] mt-0.5">{tasks.length} tehtävää</p>
          </div>
          {pageTab === 'kanban' && (
            <button
              onClick={() => setNewTaskCol('idea')}
              className="flex items-center gap-1.5 rounded-xl bg-[#1e3d1e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d16] transition-colors"
            >
              <Plus size={15} />
              Uusi tehtävä
            </button>
          )}
        </div>

        {/* Page tabs */}
        <div className="mt-4 flex flex-wrap gap-1 rounded-xl border border-[#e0d8cc] bg-white p-1">
          {pageTabBtn('kanban', 'Tehtävät', undefined, 'shared')}
          {pageTabBtn('ominaisuudet', 'Ominaisuudet', <LayoutGrid size={14} />, 'shared')}
          {pageTabBtn('kasvustrategia', 'Kasvustrategia', <TrendingUp size={14} />, 'superadmin')}
          {role === 'superadmin' && pageTabBtn('tulevaisuus', 'Tulevaisuus', <Sparkles size={14} />, 'superadmin')}
        </div>
        {role === 'superadmin' && (
          <p className="mt-1.5 text-[10px] text-[#2d6a2d]">
            🔒 = vain Pekka näkee &nbsp;|&nbsp; 👥 = Jari näkee myös
          </p>
        )}
      </div>

      {pageTab === 'ominaisuudet' && (
        <div className="px-4 pb-8">
          <FeatureMatrix />
        </div>
      )}

      {pageTab === 'kasvustrategia' && (
        <div className="px-4 pb-8">
          <GrowthStrategy />
        </div>
      )}

      {pageTab === 'tulevaisuus' && role === 'superadmin' && (
        <div className="px-4 pb-8">
          <FutureNotes />
        </div>
      )}

      {/* Kanban board — horizontal scroll */}
      {pageTab === 'kanban' && (
        <>

      <div className="overflow-x-auto pb-8">
        <div className="flex gap-3 px-4" style={{ minWidth: `${COLUMNS.length * 260}px` }}>
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.value)
            const isOver = dragOverCol === col.value
            return (
              <div
                key={col.value}
                className={`flex w-60 shrink-0 flex-col rounded-2xl border transition-colors ${
                  isOver ? 'border-green-500 bg-white' : `border-[#e0d8cc]/60 ${COL_BG[col.value]}`
                }`}
                onDragOver={(e) => handleDragOver(e, col.value)}
                onDrop={() => handleDrop(col.value)}
                onDragLeave={() => setDragOverCol(null)}
              >
                {/* Column header */}
                <div className={`flex items-center justify-between border-b px-3 py-2.5 ${COL_HEADER[col.value]}`}>
                  <span className="text-xs font-semibold">{col.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#f0ebe3] px-1.5 py-0.5 text-xs">{colTasks.length}</span>
                    <button
                      onClick={() => setNewTaskCol(col.value)}
                      title="Lisää tähän sarakkeeseen"
                      className="rounded p-0.5 hover:bg-[#f0ebe3] transition-colors"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 p-2 flex-1">
                  {colTasks.map((task) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      selected={selectedId === task.id}
                      dragging={draggingId === task.id}
                      saved={savedId === task.id}
                      onClick={() => setSelectedId((prev) => prev === task.id ? null : task.id)}
                      onDragStart={() => handleDragStart(task.id)}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="flex-1 rounded-xl border border-dashed border-white/10 flex items-center justify-center min-h-16">
                      <span className="text-xs text-[#1a1a1a]/20">Tyhjä</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Slide-in detail panel */}
      {selectedTask && (
        <DetailPanel
          task={selectedTask}
          role={role}
          onClose={() => setSelectedId(null)}
          onPatch={patch}
          onDelete={deleteTask}
          deleting={deletingId === selectedTask.id}
          saved={savedId === selectedTask.id}
          comments={comments[selectedTask.id] ?? null}
          loadingComments={loadingComments === selectedTask.id}
          commentInput={newComment}
          onCommentInput={setNewComment}
          onSendComment={sendComment}
          sendingComment={sendingComment}
        />
      )}

      {/* New task modal */}
      {newTaskCol !== null && (
        <NewTaskModal
          defaultStatus={newTaskCol}
          onClose={() => setNewTaskCol(null)}
          onCreate={async (data) => {
            const res = await fetch('/api/dev-tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            })
            if (res.ok) {
              const r2 = await fetch('/api/dev-tasks')
              if (r2.ok) {
                const json = (await r2.json()) as { tasks: DevTask[] }
                setTasks(json.tasks)
              }
              setNewTaskCol(null)
            }
          }}
        />
      )}
        </>
      )}
    </main>
  )
}

// ─── Kanban card ────────────────────────────────────────────────────────────

interface KanbanCardProps {
  task: DevTask
  selected: boolean
  dragging: boolean
  saved: boolean
  onClick: () => void
  onDragStart: () => void
  onDragEnd: () => void
}

function KanbanCard({ task, selected, dragging, saved, onClick, onDragStart, onDragEnd }: KanbanCardProps) {
  const catLabel = CATEGORY_OPTIONS.find((c) => c.value === task.category)?.label ?? task.category

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`cursor-pointer rounded-xl border bg-white overflow-hidden transition-all select-none ${
        selected ? 'border-green-500 bg-white' : 'border-[#e0d8cc] hover:border-[#e0d8cc]'
      } ${dragging ? 'opacity-40' : ''}`}
    >
      <div className={`h-1 w-full ${PRIORITY_BAR[task.priority] ?? 'bg-stone-600'}`} />
      <div className="px-3 py-2.5">
        <p className="text-sm font-medium text-[#1a1a1a] leading-snug line-clamp-2">{task.title}</p>
        <div className="mt-2 flex items-center justify-between gap-1">
          <span className="rounded bg-[#f0ebe3] px-1.5 py-0.5 text-xs text-[#4a4a4a]">{catLabel}</span>
          <div className="flex items-center gap-2">
            {task.comment_count > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-[#888888]">
                <MessageSquare size={10} />
                {task.comment_count}
              </span>
            )}
            {saved && <span className="text-xs text-[#2d6a2d]">✓</span>}
            <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[task.priority] ?? 'bg-stone-500'}`} />
          </div>
        </div>
        {task.created_by_name && (
          <p className="mt-1.5 text-xs text-[#2d6a2d] truncate">{task.created_by_name}</p>
        )}
      </div>
    </div>
  )
}

// ─── Detail panel ────────────────────────────────────────────────────────────

interface DetailPanelProps {
  task: DevTask
  role: string
  onClose: () => void
  onPatch: (id: string, update: Record<string, string | null | number>) => Promise<void>
  onDelete: (id: string, title: string) => Promise<void>
  deleting: boolean
  saved: boolean
  comments: Comment[] | null
  loadingComments: boolean
  commentInput: string
  onCommentInput: (v: string) => void
  onSendComment: () => void
  sendingComment: boolean
}

function DetailPanel({
  task, role, onClose, onPatch, onDelete, deleting, saved,
  comments, loadingComments, commentInput, onCommentInput, onSendComment, sendingComment,
}: DetailPanelProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(task.title)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descValue, setDescValue] = useState(task.description ?? '')
  const titleRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)

  // Reset edits when task changes
  useEffect(() => {
    setTitleValue(task.title)
    setDescValue(task.description ?? '')
    setEditingTitle(false)
    setEditingDesc(false)
  }, [task.id, task.title, task.description])

  useEffect(() => { if (editingTitle) titleRef.current?.focus() }, [editingTitle])
  useEffect(() => { if (editingDesc) descRef.current?.focus() }, [editingDesc])

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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-[#f5f0e8] shadow-2xl border-l border-[#e0d8cc] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#e0d8cc] bg-[#f5f0e8] px-5 py-4">
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  ref={titleRef}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditingTitle(false); setTitleValue(task.title) } }}
                  className="flex-1 rounded border border-green-600 bg-white px-2 py-1 text-base font-bold text-[#1a1a1a] outline-none"
                />
                <button
                  onClick={saveTitle}
                  className="shrink-0 rounded-lg bg-[#1e3d1e] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#162d16] transition-colors"
                >
                  Tallenna
                </button>
                <button
                  onClick={() => { setEditingTitle(false); setTitleValue(task.title) }}
                  className="shrink-0 rounded-lg border border-[#e0d8cc] px-2.5 py-1 text-xs text-[#2d6a2d] hover:bg-white transition-colors"
                >
                  Peruuta
                </button>
              </div>
            ) : (
              <h2
                className="cursor-text text-base font-bold text-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
                onClick={() => setEditingTitle(true)}
                title="Klikkaa muokataksesi"
              >
                {task.title}
              </h2>
            )}
            <div className="mt-1 flex items-center gap-2 text-xs text-[#888888]">
              {task.created_by_name && <span>{task.created_by_name}</span>}
              <span>{relativeTime(task.created_at)}</span>
              {saved && <span className="text-[#2d6a2d]">Tallennettu ✓</span>}
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-[#4a4a4a] hover:bg-[#f0ebe3] hover:text-[#1a1a1a] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 px-5 py-4">
          {/* Status + Priority */}
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#888888]">Status</p>
              <select
                value={task.status}
                onChange={(e) => void onPatch(task.id, { status: e.target.value })}
                className="w-full rounded-lg border border-[#e0d8cc] bg-[#f5f0e8] px-2 py-1.5 text-sm text-[#1a1a1a] outline-none focus:border-[#2d6a2d]"
              >
                {COLUMNS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#888888]">Prioriteetti</p>
              <select
                value={task.priority}
                onChange={(e) => void onPatch(task.id, { priority: e.target.value })}
                className="w-full rounded-lg border border-[#e0d8cc] bg-[#f5f0e8] px-2 py-1.5 text-sm text-[#1a1a1a] outline-none focus:border-[#2d6a2d]"
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#888888]">Kategoria</p>
            <select
              value={task.category}
              onChange={(e) => void onPatch(task.id, { category: e.target.value })}
              className="w-full rounded-lg border border-[#e0d8cc] bg-[#f5f0e8] px-2 py-1.5 text-sm text-[#1a1a1a] outline-none focus:border-[#2d6a2d]"
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#888888]">Kuvaus</p>
            {editingDesc ? (
              <div className="space-y-2">
                <textarea
                  ref={descRef}
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setEditingDesc(false); setDescValue(task.description ?? '') } }}
                  rows={5}
                  className="w-full rounded-lg border border-green-600 bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none resize-none"
                  placeholder="Lisää kuvaus..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveDesc}
                    className="rounded-lg bg-[#1e3d1e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162d16] transition-colors"
                  >
                    Tallenna
                  </button>
                  <button
                    onClick={() => { setEditingDesc(false); setDescValue(task.description ?? '') }}
                    className="rounded-lg border border-[#e0d8cc] px-3 py-1.5 text-xs text-[#2d6a2d] hover:bg-white transition-colors"
                  >
                    Peruuta
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="group cursor-text rounded-lg border border-transparent px-3 py-2 hover:border-[#e0d8cc] hover:bg-white transition-colors"
                onClick={() => setEditingDesc(true)}
              >
                {task.description ? (
                  <p className="whitespace-pre-wrap text-sm text-[#1a1a1a]">{task.description}</p>
                ) : (
                  <p className="text-sm text-[#2d6a2d] italic">Klikkaa lisätäksesi kuvaus...</p>
                )}
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#888888]">
              Kommentit {task.comment_count > 0 && `(${task.comment_count})`}
            </p>
            {loadingComments ? (
              <p className="text-xs text-[#2d6a2d]">Ladataan...</p>
            ) : comments && comments.length > 0 ? (
              <div className="mb-3 space-y-2">
                {comments.map((c) => (
                  <div key={c.id} className="rounded-lg border border-[#e0d8cc] bg-white/[0.03] px-3 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-[#1e3d1e]">{c.author_name}</span>
                      <span className="text-xs text-[#2d6a2d]">{relativeTime(c.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm text-[#1a1a1a]">{c.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-3 text-xs text-[#2d6a2d] italic">Ei kommentteja vielä.</p>
            )}
            <div className="flex gap-2">
              <textarea
                value={commentInput}
                onChange={(e) => onCommentInput(e.target.value)}
                placeholder="Kirjoita kommentti..."
                rows={2}
                className="flex-1 rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#888888] outline-none focus:border-[#2d6a2d] resize-none"
              />
              <button
                onClick={onSendComment}
                disabled={sendingComment || !commentInput.trim()}
                className="shrink-0 rounded-lg bg-[#1e3d1e] px-3 py-2 text-sm font-semibold text-white hover:bg-[#162d16] disabled:opacity-50"
              >
                {sendingComment ? '...' : 'Lähetä'}
              </button>
            </div>
          </div>

          {/* Delete */}
          {role === 'superadmin' && (
            <div className="border-t border-[#e0d8cc]/60 pt-3">
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
      </div>
    </>
  )
}

// ─── New task modal ──────────────────────────────────────────────────────────

interface NewTaskModalProps {
  defaultStatus: string
  onClose: () => void
  onCreate: (data: { title: string; description?: string; category: string; priority: string; status: string }) => Promise<void>
}

function NewTaskModal({ defaultStatus, onClose, onCreate }: NewTaskModalProps) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [category, setCategory] = useState('yleinen')
  const [priority, setPriority] = useState('normaali')
  const [status, setStatus] = useState(defaultStatus)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onCreate({
      title: title.trim(),
      description: desc.trim() || undefined,
      category,
      priority,
      status,
    })
    setSaving(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-2xl border border-[#e0d8cc] bg-[#f5f0e8] p-5 shadow-2xl max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#2d6a2d]">Uusi tehtävä</h2>
          <button onClick={onClose} className="text-[#888888] hover:text-[#1e3d1e]">
            <X size={16} />
          </button>
        </div>
        <input
          type="text"
          placeholder="Otsikko *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          className="w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#888888] outline-none focus:border-[#2d6a2d]"
        />
        <textarea
          placeholder="Kuvaus"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-[#e0d8cc] bg-[#f0ebe3] px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#888888] outline-none focus:border-[#2d6a2d] resize-none"
        />
        <div className="grid grid-cols-3 gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-[#e0d8cc] bg-[#f5f0e8] px-2 py-1.5 text-xs text-[#1a1a1a] outline-none"
          >
            {COLUMNS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-[#e0d8cc] bg-[#f5f0e8] px-2 py-1.5 text-xs text-[#1a1a1a] outline-none"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-lg border border-[#e0d8cc] bg-[#f5f0e8] px-2 py-1.5 text-xs text-[#1a1a1a] outline-none"
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={saving || !title.trim()}
            className="flex-1 rounded-lg bg-[#1e3d1e] py-2 text-sm font-semibold text-white hover:bg-[#162d16] disabled:opacity-50"
          >
            {saving ? 'Tallennetaan...' : 'Tallenna'}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#e0d8cc] px-4 py-2 text-sm text-[#2d6a2d] hover:bg-white"
          >
            Peruuta
          </button>
        </div>
      </div>
    </>
  )
}
