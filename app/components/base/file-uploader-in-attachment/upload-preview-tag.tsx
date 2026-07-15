import type { FC } from 'react'
import {
  CodeBracketIcon,
  DocumentIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FilmIcon,
  MusicalNoteIcon,
  PhotoIcon,
  TableCellsIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import s from './style.module.css'
import cn from '@/utils/classnames'

export type UploadPreviewStatus = 'uploading' | 'done' | 'error'

interface UploadPreviewTagProps {
  id: string
  name: string
  size: number
  type: string
  status: UploadPreviewStatus
  previewUrl?: string
  showDeleteAction?: boolean
  onRemove?: (id: string) => void
  onRetry?: (id: string) => void
  onPreviewLoad?: () => void
  onPreviewError?: () => void
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) { return `${bytes} B` }
  if (bytes < 1024 * 1024) { return `${(bytes / 1024).toFixed(1)} KB` }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const truncateName = (name: string, maxLength = 24) => {
  if (name.length <= maxLength) { return name }

  const extensionIndex = name.lastIndexOf('.')
  if (extensionIndex === -1) { return `${name.slice(0, maxLength - 1)}…` }

  const extension = name.slice(extensionIndex)
  const baseLength = maxLength - extension.length - 1
  if (baseLength < 4) { return `${name.slice(0, maxLength - 1)}…` }
  return `${name.slice(0, baseLength)}…${extension}`
}

const getFileIcon = (type: string) => {
  const iconClassName = s.fileIcon

  if (type.startsWith('image/')) { return <PhotoIcon className={iconClassName} /> }
  if (type.includes('pdf') || type.includes('word') || type.includes('document') || type.includes('presentation') || type.includes('powerpoint')) {
    return <DocumentTextIcon className={iconClassName} />
  }
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {
    return <TableCellsIcon className={iconClassName} />
  }
  if (type.startsWith('video/')) { return <FilmIcon className={iconClassName} /> }
  if (type.startsWith('audio/')) { return <MusicalNoteIcon className={iconClassName} /> }
  if (type.startsWith('text/') || type.includes('code') || type.includes('json') || type.includes('xml')) {
    return <CodeBracketIcon className={iconClassName} />
  }
  return <DocumentIcon className={iconClassName} />
}

const UploadPreviewTag: FC<UploadPreviewTagProps> = ({
  id,
  name,
  size,
  type,
  status,
  previewUrl,
  showDeleteAction = true,
  onRemove,
  onRetry,
  onPreviewLoad,
  onPreviewError,
}) => {
  const { t } = useTranslation()
  const isImage = type.startsWith('image/')

  return (
    <div className={cn(s.tag, status === 'error' && s.tagError)}>
      {isImage && previewUrl
        ? (
          <div className={s.thumbImg}>
            <img
              src={previewUrl}
              alt={name}
              onLoad={onPreviewLoad}
              onError={onPreviewError}
            />
          </div>
        )
        : <div className={s.thumb}>{getFileIcon(type)}</div>}

      <div className={s.info}>
        <span className={cn(s.name, status === 'error' && s.nameError)} title={name}>
          {truncateName(name)}
        </span>

        {status === 'uploading'
          ? (
            <span className={s.statusRow}>
              <span className={s.progressBar} />
              {t('common.fileUploader.uploading', { defaultValue: 'Uploading' })}
            </span>
          )
          : status === 'error'
            ? (
              <span className={s.errorRow}>
                <ExclamationTriangleIcon className={s.errorIcon} />
                <span>{t('common.fileUploader.uploadFailed', { defaultValue: 'Upload failed' })}</span>
                {onRetry && (
                  <button type='button' className={s.retryBtn} onClick={() => onRetry(id)}>
                    {t('common.operation.retry', { defaultValue: 'Retry' })}
                  </button>
                )}
              </span>
            )
            : <span className={s.sizeText}>{formatSize(size)}</span>}
      </div>

      {showDeleteAction && (
        <button
          type='button'
          className={s.removeBtn}
          aria-label={`${t('common.operation.delete', { defaultValue: 'Delete' })} ${name}`}
          onClick={() => onRemove?.(id)}
        >
          <XMarkIcon />
        </button>
      )}
    </div>
  )
}

export default UploadPreviewTag
