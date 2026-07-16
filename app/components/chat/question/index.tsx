'use client'
import type { FC } from 'react'
import React from 'react'
import type { IChatItem } from '../type'

import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import ImageGallery from '@/app/components/base/image-gallery'

type IQuestionProps = Pick<IChatItem, 'content'> & {
  imgSrcs?: string[]
}

const Question: FC<IQuestionProps> = ({ content, imgSrcs }) => {
  return (
    <div className='w-full flex items-start justify-end gap-3'>
      {/* User Bubble */}
      <div className='flex-1 max-w-[75%] flex justify-end'>
        <div className='break-words rounded-2xl rounded-br-sm bg-gradient-to-br from-[#6366f1] to-[#7c3aed] px-4 py-3 text-white'>
          {imgSrcs && imgSrcs.length > 0 && (
            <ImageGallery srcs={imgSrcs} />
          )}
          <StreamdownMarkdown content={content} />
        </div>
      </div>
      {/* User Avatar */}
      <div className='w-8 h-8 rounded-lg bg-gray-300 flex items-center justify-center flex-shrink-0'>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className='w-4 h-4 text-gray-600'>
          <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  )
}

export default React.memo(Question)
