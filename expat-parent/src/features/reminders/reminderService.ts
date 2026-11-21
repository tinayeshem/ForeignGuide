import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { TimelineItem } from '../timeline/timelineService'

const CHANNEL_ID = 'deadlines'
const REMINDER_HOUR = 9
const DAYS_BEFORE = [3, 1, 0]

// Scheduled local notifications only work on Android / iOS
export const remindersSupported = Platform.OS !== 'web'

if (remindersSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })
}

export async function ensureReminderPermission(): Promise<boolean> {
  if (!remindersSupported) return false

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Deadline reminders',
      importance: Notifications.AndroidImportance.HIGH,
    })
  }

  const current = await Notifications.getPermissionsAsync()
  if (current.granted) return true
  if (!current.canAskAgain) return false

  const requested = await Notifications.requestPermissionsAsync()
  return requested.granted
}

function atReminderTime(base: Date, daysOffset: number): Date {
  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + daysOffset,
    REMINDER_HOUR,
    0,
    0
  )
}

function bodyFor(item: TimelineItem, daysBefore: number): string {
  if (daysBefore === 0) return `Today is the deadline: ${item.title}. Tap to see what to bring.`
  if (daysBefore === 1) return `Tomorrow is the deadline: ${item.title}.`
  return `${daysBefore} days left: ${item.title}.`
}

async function scheduleAt(date: Date, title: string, body: string, stepId: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { stepId } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: CHANNEL_ID,
    },
  })
}

export type ScheduleResult = {
  allowed: boolean
  count: number
}

async function doSchedule(items: TimelineItem[]): Promise<ScheduleResult> {
  if (!remindersSupported) return { allowed: false, count: 0 }

  const allowed = await ensureReminderPermission()
  if (!allowed) return { allowed: false, count: 0 }

  // Start fresh every time so done steps never get reminders
  await Notifications.cancelAllScheduledNotificationsAsync()

  const now = new Date()
  let count = 0

  for (const item of items) {
    if (item.done) continue

    if (item.status === 'overdue') {
      await scheduleAt(
        atReminderTime(now, 1),
        '⚠️ Overdue',
        `${item.title} is overdue. Do it as soon as possible.`,
        item.id
      )
      count++
      continue
    }

    if (item.dueDate) {
      for (const daysBefore of DAYS_BEFORE) {
        const date = atReminderTime(item.dueDate, -daysBefore)
        if (date > now) {
          await scheduleAt(date, '⏰ Deadline reminder', bodyFor(item, daysBefore), item.id)
          count++
        }
      }
    } else {
      await scheduleAt(
        atReminderTime(now, 2),
        '📌 Still to do',
        `Don't forget: ${item.title}. Do this as soon as possible.`,
        item.id
      )
      count++
    }
  }

  return { allowed: true, count }
}

// Queue so fast taps never run two schedules at the same time (prevents duplicates)
let queue: Promise<unknown> = Promise.resolve()

export function scheduleDeadlineReminders(items: TimelineItem[]): Promise<ScheduleResult> {
  const run = queue.then(() => doSchedule(items))
  queue = run.catch(() => {})
  return run
}

export async function sendTestReminder(item: TimelineItem | undefined): Promise<boolean> {
  if (!remindersSupported) return false

  const allowed = await ensureReminderPermission()
  if (!allowed) return false

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Deadline reminder',
      body: item
        ? `3 days left: ${item.title}.`
        : 'This is how deadline reminders will look.',
      data: { stepId: item?.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: CHANNEL_ID,
    },
  })

  return true
}