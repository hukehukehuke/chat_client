import { memo } from 'react'
import type { FileEntity } from './types'
import { SupportUploadFileTypes } from './types'
import { fileIsUploaded } from './utils'
import UploadPreviewTag from './upload-preview-tag'

interface FileInAttachmentItemProps {
  file: FileEntity
  showDeleteAction?: boolean
  onRemove?: (fileId: string) => void
  onReUpload?: (fileId: string) => void
}

const FileInAttachmentItem = ({
  file,
  showDeleteAction,
  onRemove,
  onReUpload,
}: FileInAttachmentItemProps) => {
  const isImage = file.supportFileType === SupportUploadFileTypes.image
  const status = file.progress === -1
    ? 'error'
    : fileIsUploaded(file)
      ? 'done'
      : 'uploading'

  return (
    <UploadPreviewTag
      id={file.id}
      name={file.name}
      size={file.size}
      type={isImage ? (file.type || 'image/*') : file.type}
      status={status}
      previewUrl={isImage ? (file.base64Url || file.url) : undefined}
      showDeleteAction={showDeleteAction}
      onRemove={onRemove}
      onRetry={onReUpload}
    />
  )
}

export default memo(FileInAttachmentItem)
