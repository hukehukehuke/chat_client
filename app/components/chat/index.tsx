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
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Tooltip from '@/app/components/base/tooltip'
import Toast from '@/app/components/base/toast'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import FileUploaderInAttachmentWrapper from '@/app/components/base/file-uploader-in-attachment'
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
}

const Chat: FC<IChatProps> = ({
  chatList,
  isHideSendInput = false,
  checkCanSend,
  onSend = () => { },
  isResponding,
  visionConfig,
  fileConfig,
}) => {
  const { t } = useTranslation()
  const { notify } = Toast
  const isUseInputMethod = useRef(false)
  const hasConversationMessages = chatList.length > 0
  const inputPlaceholder = t('common.chat.inputPlaceholder') as string

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

  return (
    <div className={cn('px-3.5', s.chatRoot)}>
      {/* Chat List */}
      <div className={cn('h-full space-y-10 pt-8 tablet:pt-10', !hasConversationMessages && s.emptyChatList)}>
        {chatList.map((item) => {
          if (item.isAnswer) {
            const isLast = item.id === chatList[chatList.length - 1].id
            return <Answer
              key={item.id}
              item={item}
              isResponding={isResponding && isLast}
              suggestionClick={suggestionClick}
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
      </div>
      {
        !isHideSendInput && (
          <>
            <div
              className={cn(
                s.emptyGreeting,
                hasConversationMessages && s.emptyGreetingHidden,
              )}
            >
              {t('common.chat.greeting')}
            </div>
            <div
              className={cn(
                s.composerPosition,
                hasConversationMessages && s.composerDocked,
              )}
            >
              <div className={s.composerCard}>
                <div className={cn(s.composerLeftActions, hasAttachments && s.composerActionsWithAttachments)}>
                  {
                    fileConfig?.enabled && (
                      <FileUploaderInAttachmentWrapper
                        fileConfig={fileConfig}
                        value={attachmentFiles}
                        onChange={setAttachmentFiles}
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
                            <FileUploaderInAttachmentWrapper
                              fileConfig={fileConfig}
                              value={attachmentFiles}
                              onChange={setAttachmentFiles}
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
            </div>
          </>
        )
      }
    </div>
  )
}

export default React.memo(Chat)
