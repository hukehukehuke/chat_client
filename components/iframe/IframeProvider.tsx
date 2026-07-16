'use client'

import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react'
import { getIframeCommandPayload, iframeEvents, type IframeCommand, type IframeEvent } from '@/hooks/useIframeBridge'

export { iframeEvents }

interface IframeContextValue {
  isEmbedded: boolean
  sendEvent: (event: IframeEvent) => void
  registerHandler: (type: string, handler: (payload: unknown) => void) => void
  unregisterHandler: (type: string) => void
  // Track conversation for iframe embedding
  trackMessage: (role: 'user' | 'assistant', content: string) => void
  setConversationEndedCallback: (callback: (transcript: string) => void) => void
}

const IframeContext = createContext<IframeContextValue>({
  isEmbedded: false,
  sendEvent: () => {},
  registerHandler: () => {},
  unregisterHandler: () => {},
  trackMessage: () => {},
  setConversationEndedCallback: () => {},
})

export const useIframeContext = () => useContext(IframeContext)

interface MessageRecord {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export function IframeProvider({ children }: { children: React.ReactNode }) {
  const handlersRef = useRef<Map<string, (payload: unknown) => void>>(new Map())
  const isEmbedded = typeof window !== 'undefined' && window.parent !== window
  const messagesRef = useRef<MessageRecord[]>([])
  const conversationEndedCallbackRef = useRef<((transcript: string) => void) | null>(null)

  const sendEvent = useCallback((event: IframeEvent) => {
    if (window.parent !== window) {
      window.parent.postMessage(event, '*')
    }
  }, [])

  const registerHandler = useCallback((type: string, handler: (payload: unknown) => void) => {
    handlersRef.current.set(type, handler)
  }, [])

  const unregisterHandler = useCallback((type: string) => {
    handlersRef.current.delete(type)
  }, [])

  const trackMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    messagesRef.current.push({ role, content, timestamp: Date.now() })
  }, [])

  const setConversationEndedCallback = useCallback((callback: (transcript: string) => void) => {
    conversationEndedCallbackRef.current = callback
  }, [])

  const buildTranscript = useCallback(() => {
    return messagesRef.current
      .map((msg) => {
        const prefix = msg.role === 'user' ? '【用户】' : '【AI】'
        return `${prefix}${msg.content}`
      })
      .join('\n\n')
  }, [])

  const handleEndConversation = useCallback(() => {
    const transcript = buildTranscript()
    // Send conversationEnded event to parent
    sendEvent(iframeEvents.conversationEnded(transcript))
    // Also call the local callback if registered
    conversationEndedCallbackRef.current?.(transcript)
    // Clear messages
    messagesRef.current = []
  }, [buildTranscript, sendEvent])

  useEffect(() => {
    const handleMessage = (event: MessageEvent<IframeCommand>) => {
      if (event.source !== window.parent) { return }
      if (!event.data || typeof event.data !== 'object' || !event.data.type) { return }

      // Handle endConversation command
      if (event.data.type === 'endConversation') {
        handleEndConversation()
        return
      }

      const handler = handlersRef.current.get(event.data.type)
      if (handler) {
        handler(getIframeCommandPayload(event.data))
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleEndConversation])

  useEffect(() => {
    if (isEmbedded) {
      sendEvent(iframeEvents.ready('1.0.0'))
    }
  }, [isEmbedded, sendEvent])

  return (
    <IframeContext.Provider value={{ isEmbedded, sendEvent, registerHandler, unregisterHandler, trackMessage, setConversationEndedCallback }}>
      {children}
    </IframeContext.Provider>
  )
}
