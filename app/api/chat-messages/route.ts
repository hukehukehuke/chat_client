import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo } from '@/app/api/utils/common'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      inputs,
      query,
      files,
      conversation_id: conversationId,
      response_mode: responseMode,
    } = body
    const { user } = getInfo(request)
    const res = await client.createChatMessage(inputs, query, user, responseMode, conversationId, files)
    return new Response(res.data as any)
  }
  catch (error: any) {
    const status = Number(error?.response?.status) || 500
    const upstreamError = error?.response?.data
    const message = (typeof upstreamError === 'string' ? upstreamError : upstreamError?.message)
      || error?.message
      || 'Chat service unavailable'

    return NextResponse.json({ message }, { status })
  }
}
