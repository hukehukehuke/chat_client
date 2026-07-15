'use client'
import type { FC } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { ChevronDownIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import type { ThoughtItem } from '../type'
import Thought from './index'
import s from './style.module.css'
import Loading02 from '@/app/components/base/icons/line/loading-02'
import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import ImageGallery from '@/app/components/base/image-gallery'
import type { Emoji } from '@/types/tools'
import type { VisionFile } from '@/types/app'
import cn from '@/utils/classnames'

interface ThinkingPanelProps {
  thoughts: ThoughtItem[]
  answerThoughtId?: string
  allToolIcons: Record<string, string | Emoji>
  isResponding: boolean
}

const getAssistantImages = (files?: VisionFile[]) => {
  return (files || []).filter(file => file.type === 'image' && file.belongs_to === 'assistant')
}

const ThinkingPanel: FC<ThinkingPanelProps> = ({
  thoughts,
  answerThoughtId,
  allToolIcons,
  isResponding,
}) => {
  const { t } = useTranslation()
  const isThinking = isResponding && thoughts.some(thought => !!thought.tool && !thought.observation)
  const [showDetail, setShowDetail] = useState(isThinking)

  const hasDetails = useMemo(() => thoughts.some((thought) => {
    const hasReasoningText = thought.id !== answerThoughtId && !!thought.thought.trim()
    return hasReasoningText || !!thought.tool || getAssistantImages(thought.message_files).length > 0
  }), [answerThoughtId, thoughts])

  useEffect(() => {
    setShowDetail(isThinking)
  }, [isThinking])

  if (!hasDetails) { return null }

  return (
    <section className={s.thinkingPanel}>
      <button
        type='button'
        className={s.thinkingHeader}
        aria-expanded={showDetail}
        onClick={() => setShowDetail(value => !value)}
      >
        <span className={cn(s.statusIcon, showDetail && !isThinking && s.statusIconActive)}>
          {isThinking
            ? <Loading02 className='h-3.5 w-3.5 animate-spin' />
            : <SparklesIcon className='h-3.5 w-3.5' />}
        </span>
        <span className={cn(s.thinkingTitle, isThinking && s.shimmerText)}>
          {isThinking
            ? t('tools.thought.thinking', { defaultValue: 'Thinking...' })
            : t('tools.thought.thought', { defaultValue: 'Thought process' })}
        </span>
        <ChevronDownIcon className={cn(s.chevron, showDetail && s.chevronExpanded)} aria-hidden='true' />
      </button>

      {showDetail && (
        <div className={s.thinkingContent}>
          {thoughts.map((thought, index) => {
            const images = getAssistantImages(thought.message_files)
            return (
              <div key={thought.id || index} className={s.thoughtEntry}>
                {thought.id !== answerThoughtId && thought.thought && (
                  <div className={s.reasoningText}>
                    <StreamdownMarkdown content={thought.thought} />
                  </div>
                )}
                {!!thought.tool && (
                  <Thought
                    thought={thought}
                    allToolIcons={allToolIcons}
                    isFinished={!!thought.observation || !isResponding}
                  />
                )}
                {thought.id !== answerThoughtId && images.length > 0 && (
                  <ImageGallery srcs={images.map(image => image.url)} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default ThinkingPanel
