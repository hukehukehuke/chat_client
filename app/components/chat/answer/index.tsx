'use client'
import type { FC } from 'react'
import type { FeedbackFunc } from '../type'
import type { ChatItem, VisionFile } from '@/types/app'
import type { Emoji } from '@/types/tools'
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import React from 'react'
import copy from 'copy-to-clipboard'
import Button from '@/app/components/base/button'
import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import Tooltip from '@/app/components/base/tooltip'
import WorkflowProcess from '@/app/components/workflow/workflow-process'
import ImageGallery from '../../base/image-gallery'
import LoadingAnim from '../loading-anim'
import Thought from '../thought'

function OperationBtn({ innerContent, onClick, className }: { innerContent: React.ReactNode, onClick?: () => void, className?: string }) {
  return (
    <button
      type='button'
      className={`relative box-border flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent p-0 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 ${className ?? ''}`}
      onClick={onClick}
    >
      {innerContent}
    </button>
  )
}

interface IAnswerProps {
  item: ChatItem
  feedbackDisabled: boolean
  onFeedback?: FeedbackFunc
  isResponding?: boolean
  allToolIcons?: Record<string, string | Emoji>
  suggestionClick?: (suggestion: string) => void
}

const Answer: FC<IAnswerProps> = ({
  item,
  isResponding,
  allToolIcons,
  suggestionClick = () => { },
}) => {
  const { id, content, agent_thoughts, workflowProcess, suggestedQuestions = [] } = item
  const isAgentMode = !!agent_thoughts && agent_thoughts.length > 0
  const [isCopied, setIsCopied] = React.useState(false)

  const getImgs = (list?: VisionFile[]) => {
    if (!list) { return [] }
    return list.filter(file => file.type === 'image' && file.belongs_to === 'assistant')
  }

  const copyText = isAgentMode
    ? (agent_thoughts || []).map(thought => thought.thought).filter(Boolean).join('\n\n')
    : content

  const handleCopy = () => {
    if (!copyText) { return }

    copy(copyText)
    setIsCopied(true)
    globalThis.setTimeout(() => setIsCopied(false), 1600)
  }

  const agentModeAnswer = (
    <div>
      {agent_thoughts?.map((thought, index) => (
        <div key={index}>
          {thought.thought && (
            <StreamdownMarkdown content={thought.thought} />
          )}
          {!!thought.tool && (
            <Thought
              thought={thought}
              allToolIcons={allToolIcons || {}}
              isFinished={!!thought.observation || !isResponding}
            />
          )}
          {getImgs(thought.message_files).length > 0 && (
            <ImageGallery srcs={getImgs(thought.message_files).map(image => image.url)} />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className='w-full' key={id}>
      <div className='w-full min-w-0'>
        <div className='text-base leading-8 text-[#1f1f1f] tablet:text-[18px]'>
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
            {suggestedQuestions.length > 0 && (
              <div className='mt-3'>
                <div className='mt-1 flex flex-wrap gap-1'>
                  {suggestedQuestions.map((suggestion, index) => (
                    <div key={index} className='flex items-center gap-1'>
                      <Button className='text-base' type='link' onClick={() => suggestionClick(suggestion)}>{suggestion}</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {copyText && !item.feedbackDisabled && (
            <div className='mt-2 flex min-h-8 flex-row items-center gap-1'>
              <Tooltip selector={`copy-answer-${id}`} content={isCopied ? '已复制' : '复制'}>
                <OperationBtn
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
