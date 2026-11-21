import { StepStatus, TimelineItem } from './timelineService'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const STATUS_COLOR: Record<StepStatus, string> = {
  overdue: '#c0392b',
  asap: '#e67e22',
  soon: '#f1c40f',
  later: '#27ae60',
  done: '#95a5a6',
}

export const STATUS_LABEL: Record<StepStatus, string> = {
  overdue: 'Overdue',
  asap: 'Do ASAP',
  soon: 'Due soon',
  later: 'Upcoming',
  done: 'Done',
}

export function formatDate(d: Date, withYear = false): string {
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`
  return withYear ? `${base} ${d.getFullYear()}` : base
}

export function dueLabel(item: TimelineItem): string {
  switch (item.status) {
    case 'done':
      return 'Done ✓'
    case 'asap':
      return 'As soon as possible'
    case 'overdue': {
      const days = Math.abs(item.daysLeft ?? 0)
      return `${days} day${days === 1 ? '' : 's'} overdue`
    }
    default: {
      const days = item.daysLeft ?? 0
      const date = item.dueDate ? ` · ${formatDate(item.dueDate)}` : ''
      if (days === 0) return `Due today${date}`
      return `Due in ${days} day${days === 1 ? '' : 's'}${date}`
    }
  }
}