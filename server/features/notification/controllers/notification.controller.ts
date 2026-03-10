import type { Request, Response } from 'express'
import * as notificationService from '../services/notification.service'

export async function getNotifications(req: Request, res: Response) {
  try {
    const notifications = await notificationService.getNotificationsForUser(req.userId!)
    const unreadCount = await notificationService.getUnreadCount(req.userId!)
    res.json({ notifications, unreadCount })
  } catch (err) {
    console.error('Failed to get notifications:', err)
    res.status(500).json({ error: 'Failed to load notifications' })
  }
}

export async function getUnreadCount(req: Request, res: Response) {
  try {
    const count = await notificationService.getUnreadCount(req.userId!)
    res.json({ unreadCount: count })
  } catch (err) {
    console.error('Failed to get unread count:', err)
    res.status(500).json({ error: 'Failed to get unread count' })
  }
}

export async function markAsRead(req: Request, res: Response) {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.userId!)
    if (!notification) {
      res.status(404).json({ error: 'Notification not found' })
      return
    }
    res.json({ notification })
  } catch (err) {
    console.error('Failed to mark notification as read:', err)
    res.status(500).json({ error: 'Failed to mark as read' })
  }
}

export async function markAllAsRead(req: Request, res: Response) {
  try {
    await notificationService.markAllAsRead(req.userId!)
    res.json({ message: 'All notifications marked as read' })
  } catch (err) {
    console.error('Failed to mark all as read:', err)
    res.status(500).json({ error: 'Failed to mark all as read' })
  }
}
