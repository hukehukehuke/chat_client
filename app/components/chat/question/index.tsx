'use client'
import type { FC } from 'react'
import React from 'react'
import type { IChatItem } from '../type'

import StreamdownMarkdown from '@/app/components/base/streamdown-markdown'
import ImageGallery from '@/app/components/base/image-gallery'

type IQuestionProps = Pick<IChatItem, 'id' | 'content' | 'useCurrentUserAvatar'> & {
  imgSrcs?: string[]
}

const Question: FC<IQuestionProps> = ({ id, content, imgSrcs }) => {
  return (
    <div className='flex w-full items-start justify-end' key={id}>
      <div className='mobile:max-w-[88%] tablet:max-w-[74%] break-words rounded-[28px] bg-[#f0eeee] px-5 py-3 text-base leading-8 text-[#1f1f1f] tablet:text-[18px]'>
        {imgSrcs && imgSrcs.length > 0 && (
          <ImageGallery srcs={imgSrcs} />
        )}
        <StreamdownMarkdown content={content} />
      </div>
    </div>
  )
}

export default React.memo(Question)
