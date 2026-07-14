import {
  useCallback,
} from 'react'
import {
  RiUploadCloud2Line,
} from '@remixicon/react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { useFile } from './hooks'
import type { FileEntity, FileUpload } from './types'
import {
  FileContextProvider,
  useStore,
} from './store'
import FileInput from './file-input'
import FileItem from './file-item'
import Button from '@/app/components/base/button'
import cn from '@/utils/classnames'
import { TransferMethod } from '@/types/app'

interface Option {
  value: string
  label: string
  icon: JSX.Element
}
interface FileUploaderInAttachmentProps {
  fileConfig: FileUpload
  compact?: boolean
}
const FileUploaderInAttachment = ({
  fileConfig,
  compact = false,
}: FileUploaderInAttachmentProps) => {
  const { t } = useTranslation()
  const files = useStore(s => s.files)
  const {
    handleRemoveFile,
    handleReUploadFile,
  } = useFile(fileConfig)
  const options = [
    {
      value: TransferMethod.local_file,
      label: t('common.fileUploader.uploadFromComputer'),
      icon: <RiUploadCloud2Line className='h-4 w-4' />,
    },
  ]

  const renderButton = useCallback((option: Option, open?: boolean) => {
    if (compact) {
      return (
        <div
          key={option.value}
          className={cn(
            'relative flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer hover:bg-gray-100',
            open && 'bg-gray-100',
            (fileConfig.number_limits && files.length >= fileConfig.number_limits) && 'cursor-not-allowed opacity-50',
          )}
        >
          <PlusIcon className='h-6 w-6 text-gray-800' aria-hidden='true' />
          {
            option.value === TransferMethod.local_file && (
              <FileInput fileConfig={fileConfig} />
            )
          }
        </div>
      )
    }
    return (
      <Button
        key={option.value}
        className={cn('relative grow', open && 'bg-components-button-tertiary-bg-hover')}
        disabled={!!(fileConfig.number_limits && files.length >= fileConfig.number_limits)}
      >
        {option.icon}
        <span className='ml-1'>{option.label}</span>
        {
          option.value === TransferMethod.local_file && (
            <FileInput fileConfig={fileConfig} />
          )
        }
      </Button>
    )
  }, [fileConfig, files.length, compact])
  const renderOption = useCallback((option: Option) => {
    if (option.value === TransferMethod.local_file && fileConfig?.allowed_file_upload_methods?.includes(TransferMethod.local_file)) { return renderButton(option) }
  }, [renderButton, fileConfig])

  return (
    <div>
      <div className='flex items-center space-x-1'>
        {options.map(renderOption)}
      </div>
      <div className='mt-1 space-y-1'>
        {
          files.map(file => (
            <FileItem
              key={file.id}
              file={file}
              showDeleteAction
              showDownloadAction={false}
              onRemove={() => handleRemoveFile(file.id)}
              onReUpload={() => handleReUploadFile(file.id)}
            />
          ))
        }
      </div>
    </div>
  )
}

interface FileUploaderInAttachmentWrapperProps {
  value?: FileEntity[]
  onChange: (files: FileEntity[]) => void
  fileConfig: FileUpload
  compact?: boolean
}
const FileUploaderInAttachmentWrapper = ({
  value,
  onChange,
  fileConfig,
  compact = false,
}: FileUploaderInAttachmentWrapperProps) => {
  return (
    <FileContextProvider
      value={value}
      onChange={onChange}
    >
      <FileUploaderInAttachment fileConfig={fileConfig} compact={compact} />
    </FileContextProvider>
  )
}

export default FileUploaderInAttachmentWrapper
