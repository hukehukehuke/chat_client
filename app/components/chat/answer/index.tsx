'use client'
import type { FC } from 'react'
import type { ChatItem, VisionFile } from '@/types/app'
import type { Emoji } from '@/types/tools'
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import React from 'react'
import copy from 'copy-to-clipboard'
import { useTranslation } from 'react-i18next'
import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import Tooltip from '@/app/components/base/tooltip'
import WorkflowProcess from '@/app/components/workflow/workflow-process'
import ImageGallery from '../../base/image-gallery'
import LoadingAnim from '../loading-anim'
import ThinkingPanel from '../thought/thinking-panel'

function OperationBtn({ ariaLabel, innerContent, onClick, className }: { ariaLabel: string, innerContent: React.ReactNode, onClick?: () => void, className?: string }) {
  return (
    <button
      type='button'
      aria-label={ariaLabel}
      className={`relative box-border flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent p-0 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 ${className ?? ''}`}
      onClick={onClick}
    >
      {innerContent}
    </button>
  )
}

interface IAnswerProps {
  item: ChatItem
  isResponding?: boolean
  allToolIcons?: Record<string, string | Emoji>
}

const Answer: FC<IAnswerProps> = ({
  item,
  isResponding,
  allToolIcons,
}) => {
  const { t } = useTranslation()
  const { id, content, agent_thoughts, workflowProcess } = item
  const isAgentMode = !!agent_thoughts && agent_thoughts.length > 0
  const [isCopied, setIsCopied] = React.useState(false)
  const copyResetTimerRef = React.useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)

  React.useEffect(() => () => {
    if (copyResetTimerRef.current) { globalThis.clearTimeout(copyResetTimerRef.current) }
  }, [])

  const getImgs = (list?: VisionFile[]) => {
    if (!list) { return [] }
    return list.filter(file => file.type === 'image' && file.belongs_to === 'assistant')
  }

  const copyText = isAgentMode
    ? (agent_thoughts || []).map(thought => thought.thought).filter(Boolean).join('\n\n')
    : content

  const handleCopy = () => {
    if (!copyText) { return }

    const didCopy = copy(copyText)
    if (!didCopy) { return }

    if (copyResetTimerRef.current) { globalThis.clearTimeout(copyResetTimerRef.current) }
    setIsCopied(true)
    copyResetTimerRef.current = globalThis.setTimeout(() => {
      setIsCopied(false)
      copyResetTimerRef.current = null
    }, 1600)
  }

  const visibleAnswerThought = [...(agent_thoughts || [])].reverse().find(thought => !!thought.thought.trim())
  const hasRunningAgentTool = !!isResponding && (agent_thoughts || []).some(thought => !!thought.tool && !thought.observation)
  const shouldRevealAnswer = !hasRunningAgentTool
  const visibleAnswer = shouldRevealAnswer ? (visibleAnswerThought?.thought || content) : ''
  const visibleAnswerImages = shouldRevealAnswer ? getImgs(visibleAnswerThought?.message_files) : []

  const agentModeAnswer = (
    <div>
      <ThinkingPanel
        thoughts={agent_thoughts || []}
        answerThoughtId={shouldRevealAnswer ? visibleAnswerThought?.id : undefined}
        allToolIcons={allToolIcons || {}}
        isResponding={!!isResponding}
      />
      {visibleAnswer && <StreamdownMarkdown content={visibleAnswer} />}
      {visibleAnswerImages.length > 0 && (
        <ImageGallery srcs={visibleAnswerImages.map(image => image.url)} />
      )}
    </div>
  )

  return (
    <div className='w-full flex items-start gap-3'>
      {/* AI Avatar */}
      <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-[#6A11CB] to-[#2575FC] flex items-center justify-center flex-shrink-0'>
        <span className='text-white text-[11px] font-bold'>AI</span>
      </div>
      {/* AI Bubble */}
      <div className='flex-1 max-w-[75%]'>
        <div className='bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 text-[#1f1f1f]'>
          <div className='min-w-0 break-words'>
            {workflowProcess && (
              <div className='mb-3'>
                <WorkflowProcess data={workflowProcess} hideInfo />
              </div>
            )}
            {(isResponding && (isAgentMode ? (!content && (agent_thoughts || []).filter(thought => !!thought.thought || !!thought.tool).length === 0) : !content))
              ? (
                <div className='flex h-8 w-6 items-center justify-center'>
                  <LoadingAnim type='text' />
                </div>
              )
              : (isAgentMode
                ? agentModeAnswer
                : <StreamdownMarkdown content={content} />)}
          </div>
          {copyText && (
            <div className='mt-2 flex min-h-8 flex-row items-center gap-1'>
              <Tooltip selector={`copy-answer-${id}`} content={t(isCopied ? 'common.operation.copied' : 'common.operation.copy')}>
                <OperationBtn
                  ariaLabel={t(isCopied ? 'common.operation.copiedAnswer' : 'common.operation.copyAnswer') as string}
                  innerContent={isCopied
                    ? <CheckIcon className='h-[18px] w-[18px]' />
                    : <ClipboardDocumentIcon className='h-[18px] w-[18px]' />}
                  onClick={handleCopy}
                  className={isCopied ? 'text-primary-600' : ''}
                />
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default React.memo(Answer)
