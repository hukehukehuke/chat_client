'use client'
import type { FC } from 'react'
import React, { useRef } from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import Textarea from 'rc-textarea'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'
import s from './style.module.css'
import Answer from './answer'
import Question from './question'
import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Tooltip from '@/app/components/base/tooltip'
import Toast from '@/app/components/base/toast'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import { FileUploaderInAttachment } from '@/app/components/base/file-uploader-in-attachment'
import { FileContextProvider } from '@/app/components/base/file-uploader-in-attachment/store'
import type { FileEntity, FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { getProcessedFiles } from '@/app/components/base/file-uploader-in-attachment/utils'

export interface IChatProps {
  chatList: ChatItem[]
  /**
   * Whether to display the input area
   */
  isHideSendInput?: boolean
  checkCanSend?: () => boolean
  onSend?: (message: string, files: VisionFile[]) => void
  isResponding?: boolean
  visionConfig?: VisionSettings
  fileConfig?: FileUpload
  isWelcomeState?: boolean
  openingStatement?: string
  suggestedQuestions?: string[]
  /**
   * Whether the chat is embedded in an iframe (for requirement ticket)
   */
  isEmbedded?: boolean
  /**
   * Callback when user clicks "Confirm and Submit" button in embedded mode
   */
  onSubmitRequirement?: (transcript: string) => void
  /**
   * Whether AI has completed generating the requirement summary
   * When true, the submission section will be shown
   */
  isRequirementSummaryComplete?: boolean
}

const getOpeningHeadline = (openingStatement: string) => {
  const trimmedStatement = openingStatement.trim()
  const greeting = trimmedStatement.match(/^你好[！!]?/)?.[0]
  if (!greeting) { return trimmedStatement.match(/^[^。！？.!?]+[。！？.!?]?/)?.[0] || trimmedStatement }

  const remainingStatement = trimmedStatement.slice(greeting.length).trimStart()
  const firstSentence = remainingStatement.match(/^[^。！？.!?]+[。！？.!?]?/)?.[0] || ''
  return `${greeting}${firstSentence}`
}

const Chat: FC<IChatProps> = ({
  chatList,
  isHideSendInput = false,
  checkCanSend,
  onSend = () => { },
  isResponding,
  visionConfig,
  fileConfig,
  isWelcomeState = false,
  openingStatement = '',
  suggestedQuestions = [],
  isEmbedded = false,
  onSubmitRequirement,
  isRequirementSummaryComplete = false,
}) => {
  const { t } = useTranslation()
  const { notify } = Toast
  const isUseInputMethod = useRef(false)
  const inputPlaceholder = t('common.chat.inputPlaceholder') as string
  const openingHeadline = getOpeningHeadline(openingStatement)

  const [query, setQuery] = React.useState('')
  const queryRef = useRef('')

  const handleContentChange = (e: any) => {
    const value = e.target.value
    setQuery(value)
    queryRef.current = value
  }

  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const valid = () => {
    const query = queryRef.current
    if (!query || query.trim() === '') {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  const {
    files,
    onUpload,
    onRemove,
    onReUpload,
    onImageLinkLoadError,
    onImageLinkLoadSuccess,
    onClear,
  } = useImageFiles()

  const [attachmentFiles, setAttachmentFiles] = React.useState<FileEntity[]>([])
  const hasAttachments = files.length > 0 || attachmentFiles.length > 0

  const handleSend = () => {
    if (!valid() || (checkCanSend && !checkCanSend())) { return }
    const hasPendingImageUploads = files.some(file => file.progress !== -1 && file.progress < 100)
    const hasPendingAttachmentUploads = attachmentFiles.some(file => file.progress !== -1 && file.progress < 100)
    if (hasPendingImageUploads || hasPendingAttachmentUploads) {
      logError(t('app.errorMessage.waitForFileUpload'))
      return
    }
    const imageFiles: VisionFile[] = files.filter(file => file.progress !== -1).map(fileItem => ({
      type: 'image',
      transfer_method: fileItem.type,
      url: fileItem.url,
      upload_file_id: fileItem.fileId,
    }))
    const docAndOtherFiles: VisionFile[] = getProcessedFiles(attachmentFiles)
    const combinedFiles: VisionFile[] = [...imageFiles, ...docAndOtherFiles]
    onSend(queryRef.current, combinedFiles)
    if (!files.find(item => item.type === TransferMethod.local_file && !item.fileId)) {
      if (files.length) { onClear() }
      if (!isResponding) {
        setQuery('')
        queryRef.current = ''
      }
    }
    if (!attachmentFiles.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)) { setAttachmentFiles([]) }
  }

  const handleKeyUp = (e: any) => {
    if (e.code === 'Enter') {
      e.preventDefault()
      // prevent send message when using input method enter
      if (!e.shiftKey && !isUseInputMethod.current) { handleSend() }
    }
  }

  const handleKeyDown = (e: any) => {
    isUseInputMethod.current = e.nativeEvent.isComposing
    if (e.code === 'Enter' && !e.shiftKey) {
      const result = query.replace(/\n$/, '')
      setQuery(result)
      queryRef.current = result
      e.preventDefault()
    }
  }

  const suggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    queryRef.current = suggestion
    handleSend()
  }

  const buildTranscript = () => {
    return chatList
      .map((item) => {
        const prefix = item.isAnswer ? '【AI】' : '【用户】'
        return `${prefix}${item.content}`
      })
      .join('\n\n')
  }

  const handleEndConversation = () => {
    const transcript = buildTranscript()
    onSubmitRequirement?.(transcript)
  }

  return (
    <div className={cn(isEmbedded ? s.chatRootEmbedded : s.chatRoot)}>
      {/* Chat List */}
      <div className={cn('overflow-y-auto space-y-10 pt-8 tablet:pt-10', isWelcomeState && s.emptyChatList, isEmbedded ? 'px-0' : 'px-3.5', !isEmbedded && chatList.length === 0 && 'hidden')}>
        {chatList.map((item) => {
          if (item.isAnswer) {
            const isLast = item.id === chatList[chatList.length - 1].id
            return <Answer
              key={item.id}
              item={item}
              isResponding={isResponding && isLast}
            />
          }
          return (
            <Question
              key={item.id}
              content={item.content}
              imgSrcs={(item.message_files && item.message_files?.length > 0) ? item.message_files.map(item => item.url) : []}
            />
          )
        })}

        {/* Welcome content for embedded mode - shown as first message when no messages */}
        {isEmbedded && chatList.length === 0 && openingStatement && (
          <div className={s.welcomeMessageEmbedded}>
            <div className={s.welcomeIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                <path d="M12 2a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v3h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1V7a2 2 0 0 1 2-2h3V4a2 2 0 0 1 2-2zm-3 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-3 3a3 3 0 0 0-3 3v1h6v-1a3 3 0 0 0-3-3z"/>
              </svg>
            </div>
            <StreamdownMarkdown content={openingStatement} />
          </div>
        )}
      </div>

      {/* Suggested questions - shown below chat messages, above input in embedded mode */}
      {isEmbedded && suggestedQuestions.length > 0 && (
        <div className={s.suggestedQuestionsWrapper}>
          <div className={s.suggestedQuestionsInner}>
            {suggestedQuestions.map((suggestion, index) => (
              <button
                key={`${suggestion}-${index}`}
                type='button'
                className={s.suggestedQuestion}
                onClick={() => suggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submission section - shown when AI has completed requirement summary */}
      {isEmbedded && isRequirementSummaryComplete && chatList.length > 0 && (
        <div className={s.submissionSection}>
          <div className={s.submissionCard}>
            <div className={s.submissionTitle}>
              <span>📋 需求内容</span>
            </div>
            <div className={s.submissionTranscript}>
              {chatList.filter(item => item.isAnswer).pop()?.content || ''}
            </div>
            <div className={s.submissionActions}>
              <button
                type='button'
                className={s.copyButton}
                onClick={() => {
                  const content = chatList.filter(item => item.isAnswer).pop()?.content || ''
                  navigator.clipboard.writeText(content)
                  Toast.notify({ type: 'success', message: '已复制到剪贴板' })
                }}
              >
                复制内容
              </button>
              <button
                type='button'
                className={s.submitButton}
                onClick={() => {
                  const content = chatList.filter(item => item.isAnswer).pop()?.content || ''
                  onSubmitRequirement?.(content)
                }}
              >
                确认无误，提交需求
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggested questions for normal mode - above input */}
      {!isEmbedded && isWelcomeState && suggestedQuestions.length > 0 && (
        <div className={s.suggestedQuestions}>
          {suggestedQuestions.map((suggestion, index) => (
            <button
              key={`${suggestion}-${index}`}
              type='button'
              className={s.suggestedQuestion}
              onClick={() => suggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Welcome content for normal mode */}
      {!isEmbedded && (
        <section
          className={cn(
            s.emptyGreeting,
            !isWelcomeState && s.emptyGreetingHidden,
          )}
          aria-hidden={!isWelcomeState}
        >
          {openingHeadline && (
            <div className={s.openingStatement}>
              <StreamdownMarkdown content={openingHeadline} />
            </div>
          )}
        </section>
      )}

      {
        !isHideSendInput && (
          <>
            {/* End conversation button - only show when AI is responding in embedded mode */}
            {isEmbedded && isResponding && (
              <div className={s.endConversationWrapper}>
                <button
                  type='button'
                  className={s.endConversationButton}
                  onClick={handleEndConversation}
                >
                  结束对话
                </button>
              </div>
            )}

            <div
              className={cn(
                isEmbedded ? s.composerPositionEmbedded : s.composerPosition,
                !isEmbedded && !isWelcomeState && s.composerDocked,
              )}
            >
              <FileContextProvider value={attachmentFiles} onChange={setAttachmentFiles}>
                <div className={cn(s.composerCard, isEmbedded && s.composerCardEmbedded)}>
                  <div className={cn(s.composerLeftActions, hasAttachments && s.composerActionsWithAttachments)}>
                    {
                      fileConfig?.enabled && (
                        <FileUploaderInAttachment
                          fileConfig={fileConfig}
                          compact
                        />
                      )
                    }
                    {
                      visionConfig?.enabled && (
                        <>
                          <div className='mx-1 w-[1px] h-4 bg-black/5' />
                          <ChatImageUploader
                            settings={visionConfig}
                            onUpload={onUpload}
                            disabled={files.length >= visionConfig.number_limits}
                          />
                        </>
                      )
                    }
                  </div>
                  {
                    hasAttachments && (
                      <div className='pb-2'>
                        {
                          files.length > 0 && (
                            <ImageList
                              list={files}
                              onRemove={onRemove}
                              onReUpload={onReUpload}
                              onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                              onImageLinkLoadError={onImageLinkLoadError}
                            />
                          )
                        }
                        {
                          fileConfig && attachmentFiles.length > 0 && (
                            <div className='max-w-full overflow-visible'>
                              <FileUploaderInAttachment
                                fileConfig={fileConfig}
                                listOnly
                              />
                            </div>
                          )
                        }
                      </div>
                    )
                  }
                  <Textarea
                    className={`
                    relative top-[2px] block w-full pl-[50px] pr-[52px] py-1.5 text-base text-gray-700 bg-transparent outline-none appearance-none resize-none leading-relaxed
                  `}
                    style={{ minHeight: '48px', maxHeight: '200px' }}
                    value={query}
                    onChange={handleContentChange}
                    onKeyUp={handleKeyUp}
                    onKeyDown={handleKeyDown}
                    autoSize={{ minRows: 1, maxRows: 8 }}
                    placeholder={inputPlaceholder}
                  />
                  <div className={cn(s.composerRightActions, hasAttachments && s.composerActionsWithAttachments)}>
                    <Tooltip
                      selector='send-tip'
                      htmlContent={
                        <div>
                          <div>{t('common.operation.send')} Enter</div>
                          <div>{t('common.operation.lineBreak')} Shift Enter</div>
                        </div>
                      }
                    >
                      <button
                        type='button'
                        aria-label={t('common.operation.send') as string}
                        className={cn(s.sendButton, query.trim() && s.sendButtonActive)}
                        onClick={handleSend}
                      >
                        <PaperAirplaneIcon className='h-5 w-5' aria-hidden='true' />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </FileContextProvider>
            </div>
          </>
        )
      }
    </div>
  )
}

export default React.memo(Chat)
