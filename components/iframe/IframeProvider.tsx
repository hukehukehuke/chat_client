'use client'

import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react'
import { iframeEvents, type IframeCommand, type IframeEvent } from '@/hooks/useIframeBridge'

interface IframeContextValue {
  isEmbedded: boolean
  sendEvent: (event: IframeEvent) => void
  registerHandler: (type: string, handler: (payload: any) => void) => void
  unregisterHandler: (type: string) => void
}

const IframeContext = createContext<IframeContextValue>({
  isEmbedded: false,
  sendEvent: () => {},
  registerHandler: () => {},
  unregisterHandler: () => {},
})

export const useIframeContext = () => useContext(IframeContext)

export function IframeProvider({ children }: { children: React.ReactNode }) {
  const handlersRef = useRef<Map<string, (payload: any) => void>>(new Map())
  const isEmbedded = typeof window !== 'undefined' && window.parent !== window

  const sendEvent = useCallback((event: IframeEvent) => {
    if (window.parent !== window) {
      window.parent.postMessage(event, '*')
    }
  }, [])

  const registerHandler = useCallback((type: string, handler: (payload: any) => void) => {
    handlersRef.current.set(type, handler)
  }, [])

  const unregisterHandler = useCallback((type: string) => {
    handlersRef.current.delete(type)
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent<IframeCommand>) => {
      if (!event.data || typeof event.data !== 'object' || !event.data.type) return
      const handler = handlersRef.current.get(event.data.type)
      if (handler) {
        handler(event.data.payload)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    if (isEmbedded) {
      sendEvent(iframeEvents.ready('1.0.0'))
    }
  }, [isEmbedded, sendEvent])

  return (
    <IframeContext.Provider value={{ isEmbedded, sendEvent, registerHandler, unregisterHandler }}>
      {children}
    </IframeContext.Provider>
  )
}
