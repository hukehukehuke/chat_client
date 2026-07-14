import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo } from '@/app/api/utils/common'

const MAX_PUBLIC_ERROR_LENGTH = 240

const getPublicErrorMessage = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') { return fallback }
  const message = value.trim()
  if (!message || message.length > MAX_PUBLIC_ERROR_LENGTH || /^\s*</.test(message)) { return fallback }
  return message
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body.query !== 'string') {
      return NextResponse.json({ message: 'Invalid chat request' }, { status: 400 })
    }

    const {
      inputs,
      query,
      files,
      conversation_id: conversationId,
      response_mode: responseMode,
    } = body
    const { user } = getInfo(request)
    const shouldStream = responseMode === 'streaming'
    const res = await client.createChatMessage(inputs, query, user, shouldStream, conversationId, files)
    const upstreamContentType = res.headers?.['content-type']
    return new Response(res.data as any, {
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        'Content-Type': typeof upstreamContentType === 'string'
          ? upstreamContentType
          : 'text/event-stream; charset=utf-8',
      },
    })
  }
  catch (error: any) {
    const rawStatus = Number(error?.response?.status)
    const status = Number.isInteger(rawStatus) && rawStatus >= 400 && rawStatus <= 599 ? rawStatus : 500
    const upstreamError = error?.response?.data
    const fallbackMessage = status >= 500 ? 'Chat service unavailable' : 'Chat request failed'
    const message = getPublicErrorMessage(
      typeof upstreamError === 'string' ? upstreamError : upstreamError?.message,
      fallbackMessage,
    )

    return NextResponse.json({ message }, { status })
  }
}
