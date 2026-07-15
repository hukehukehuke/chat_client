import type { FC } from 'react'
import UploadPreviewTag from '@/app/components/base/file-uploader-in-attachment/upload-preview-tag'
import previewStyles from '@/app/components/base/file-uploader-in-attachment/style.module.css'
import type { ImageFile } from '@/types/app'
import { TransferMethod } from '@/types/app'

interface ImageListProps {
  list: ImageFile[]
  readonly?: boolean
  onRemove?: (imageFileId: string) => void
  onReUpload?: (imageFileId: string) => void
  onImageLinkLoadSuccess?: (imageFileId: string) => void
  onImageLinkLoadError?: (imageFileId: string) => void
}

const ImageList: FC<ImageListProps> = ({
  list,
  readonly,
  onRemove,
  onReUpload,
  onImageLinkLoadSuccess,
  onImageLinkLoadError,
}) => {
  return (
    <div className={previewStyles.fileList}>
      {list.map((item) => {
        const previewUrl = item.type === TransferMethod.remote_url ? item.url : item.base64Url
        const name = item.file?.name || item.url.split('/').pop() || 'Image'
        const status = item.progress === -1 ? 'error' : item.progress === 100 ? 'done' : 'uploading'

        return (
          <UploadPreviewTag
            key={item._id}
            id={item._id}
            name={name}
            size={item.file?.size || 0}
            type={item.file?.type || 'image/*'}
            status={status}
            previewUrl={previewUrl}
            showDeleteAction={!readonly}
            onRemove={onRemove}
            onRetry={onReUpload}
            onPreviewLoad={() => {
              if (item.type === TransferMethod.remote_url && item.progress !== -1) {
                onImageLinkLoadSuccess?.(item._id)
              }
            }}
            onPreviewError={() => {
              if (item.type === TransferMethod.remote_url) { onImageLinkLoadError?.(item._id) }
            }}
          />
        )
      })}
    </div>
  )
}

export default ImageList
