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
    // 只提取最后一条 AI 回复的 detail 字段值
    const lastAiMessage = [...messagesRef.current].reverse().find(msg => msg.role === 'assistant')
    if (lastAiMessage) {
      const content = lastAiMessage.content

      // 方法1：直接提取 "detail": "xxx" 中的值
      const detailMatch = content.match(/"detail"\s*:\s*"([\s\S]*?)"(?=\s*[,\}])/m)
      if (detailMatch && detailMatch[1]) {
        return detailMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .trim()
      }

      // 方法2：如果方法1失败，尝试完整 JSON 解析
      try {
        // 提取 JSON 对象（从 { 开始到最后一个 }）
        const jsonStart = content.indexOf('{')
        const jsonEnd = content.lastIndexOf('}')
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          const jsonStr = content.substring(jsonStart, jsonEnd + 1)
          const json = JSON.parse(jsonStr)
          if (json.detail) {
            return json.detail.trim()
          }
        }
      } catch {
        // JSON 解析失败，忽略
      }

      // 如果都失败，返回原内容（已过滤 thinking）
      return content
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .trim()
    }
    return ''
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
