import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { TimelineItem } from '../timeline/timelineService'
import {
  remindersSupported,
  scheduleDeadlineReminders,
  sendTestReminder,
} from './reminderService'

export function useReminders(items: TimelineItem[]) {
  const [scheduledCount, setScheduledCount] = useState<number | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Only reschedule when something meaningful changes
  const signature = items
    .map((i) => `${i.id}:${i.done}:${i.dueDate?.getTime() ?? 'asap'}`)
    .join('|')

  useEffect(() => {
    if (!remindersSupported || items.length === 0) return
    let cancelled = false

    scheduleDeadlineReminders(items)
      .then((result) => {
        if (cancelled) return
        setScheduledCount(result.count)
        setPermissionDenied(!result.allowed)
      })
      .catch((e) => console.log('REMINDER ERROR:', e))

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  // Tap a notification -> open that step
  useEffect(() => {
    if (!remindersSupported) return

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const stepId = response.notification.request.content.data?.stepId
      if (typeof stepId === 'string') {
        router.push({ pathname: '/step/[id]', params: { id: stepId } })
      }
    })
    return () => sub.remove()
  }, [])

  const sendTest = async () => {
    const firstOpen = items.find((i) => !i.done)
    const ok = await sendTestReminder(firstOpen)
    if (!ok) setPermissionDenied(true)
    return ok
  }

  return {
    supported: remindersSupported,
    scheduledCount,
    permissionDenied,
    sendTest,
  }
}