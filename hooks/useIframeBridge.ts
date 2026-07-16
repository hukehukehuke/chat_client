'use client'

import { useCallback, useEffect } from 'react'

export type IframeCommand
  = | { type: 'init', payload: { appId?: string, apiUrl?: string, conversationId?: string } }
    | { type: 'sendMessage', payload: { message: string, files?: Array<{ type: string, url: string, transferable?: boolean }> } }
    | { type: 'newChat' }
    | { type: 'switchConversation', payload: { conversationId: string } }

export type IframeEvent
  = | { type: 'ready', payload: { version: string } }
    | { type: 'messageReceived', payload: { id: string, content: string, createdAt: string } }
    | { type: 'messageSent', payload: { id: string, content: string, createdAt: string } }
    | { type: 'conversationChanged', payload: { conversationId: string, name: string } }
    | { type: 'conversationListUpdated', payload: { conversations: Array<{ id: string, name: string }> } }
    | { type: 'error', payload: { code: string, message: string } }
    | { type: 'conversationEnded', payload: { content: string } }
    | { type: 'backToParent' }

interface UseIframeBridgeOptions {
  onCommand?: (command: IframeCommand) => void
  targetOrigin?: string
}

export const getIframeCommandPayload = (command: IframeCommand) => (
  'payload' in command ? command.payload : undefined
)

export function useIframeBridge(options: UseIframeBridgeOptions = {}) {
  const { onCommand, targetOrigin = '*' } = options

  useEffect(() => {
    const handleMessage = (event: MessageEvent<IframeCommand>) => {
      if (event.source !== window.parent) { return }
      if (!event.data || typeof event.data !== 'object' || !event.data.type) { return }
      onCommand?.(event.data as IframeCommand)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onCommand])

  const sendToParent = useCallback((event: IframeEvent) => {
    if (window.parent !== window) {
      window.parent.postMessage(event, targetOrigin)
    }
  }, [targetOrigin])

  const sendToChild = useCallback((iframe: HTMLIFrameElement, command: IframeCommand) => {
    iframe.contentWindow?.postMessage(command, targetOrigin)
  }, [targetOrigin])

  return { sendToParent, sendToChild }
}

export function createIframeBridge() {
  const handlers = new Map<string, (payload: unknown) => void>()

  const send = (event: IframeEvent) => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage(event, '*')
    }
  }

  const on = (type: string, handler: (payload: unknown) => void) => {
    handlers.set(type, handler)
  }

  const off = (type: string) => {
    handlers.delete(type)
  }

  const handleMessage = (event: MessageEvent<IframeCommand>) => {
    if (event.source !== window.parent) { return }
    if (!event.data || typeof event.data !== 'object' || !event.data.type) { return }
    const handler = handlers.get(event.data.type)
    if (handler) {
      handler(getIframeCommandPayload(event.data))
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('message', handleMessage)
  }

  const destroy = () => {
    if (typeof window !== 'undefined') { window.removeEventListener('message', handleMessage) }
    handlers.clear()
  }

  return { send, on, off, destroy }
}

export const iframeEvents = {
  ready: (version: string) => ({ type: 'ready' as const, payload: { version } }),
  messageReceived: (id: string, content: string) => ({ type: 'messageReceived' as const, payload: { id, content, createdAt: new Date().toISOString() } }),
  messageSent: (id: string, content: string) => ({ type: 'messageSent' as const, payload: { id, content, createdAt: new Date().toISOString() } }),
  conversationChanged: (conversationId: string, name: string) => ({ type: 'conversationChanged' as const, payload: { conversationId, name } }),
  conversationListUpdated: (conversations: Array<{ id: string, name: string }>) => ({ type: 'conversationListUpdated' as const, payload: { conversations } }),
  error: (code: string, message: string) => ({ type: 'error' as const, payload: { code, message } }),
  conversationEnded: (content: string) => ({ type: 'conversationEnded' as const, payload: { content } }),
  backToParent: () => ({ type: 'backToParent' as const }),
}
