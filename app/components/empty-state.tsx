import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#eaf3de] flex items-center justify-center text-[#2d6a2d] mb-3">
        {icon}
      </div>
      <p className="text-sm font-semibold text-[#1a1a1a] mb-1">{title}</p>
      {subtitle && <p className="text-xs text-[#888888] mb-4">{subtitle}</p>}
      {action}
    </div>
  )
}
