import type { FC } from 'react'
import Image from 'next/image'
import React from 'react'
import {
  Bars3Icon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid'
import {
  ChevronDownIcon,
  MinusIcon,
  Square2StackIcon,
  StopIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import s from './style.module.css'

export interface IHeaderProps {
  title: string
  isMobile?: boolean
  isEmbedded?: boolean
  onShowSideBar?: () => void
  onCreateNewChat?: () => void
  onMinimizeWindow?: () => void
  onToggleMaximizeWindow?: () => void
  onCloseWindow?: () => void
  isWindowMaximized?: boolean
  isWindowMinimized?: boolean
}

const Header: FC<IHeaderProps> = ({
  title,
  isMobile,
  isEmbedded,
  onShowSideBar,
  onCreateNewChat,
  onMinimizeWindow,
  onToggleMaximizeWindow,
  onCloseWindow,
  isWindowMaximized,
  isWindowMinimized,
}) => {
  return (
    <header className='flex h-12 shrink-0 select-none items-center justify-between border-b border-slate-200/80 bg-slate-50/95 pl-2 pr-1'>
      <div className='flex min-w-0 items-center'>
        {isMobile && (
          <>
            <button
              type='button'
              aria-label='打开会话列表'
              className='flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40'
              onClick={() => onShowSideBar?.()}
            >
              <Bars3Icon className='h-[18px] w-[18px]' />
            </button>
            <div className='ml-1 flex min-w-0 items-center gap-2.5'>
              <Image
                src='/favicon.ico'
                alt=''
                width={32}
                height={32}
                unoptimized
                className='h-8 w-8 shrink-0 object-contain'
                aria-hidden='true'
              />
              <div className='truncate text-sm font-semibold tracking-[-0.01em] text-slate-800'>{title}</div>
            </div>
          </>
        )}
        {isEmbedded && !isMobile && (
          <div className={s.embeddedLogo}>
            <span className={s.logoIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M12 2a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v3h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1V7a2 2 0 0 1 2-2h3V4a2 2 0 0 1 2-2zm-3 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-3 3a3 3 0 0 0-3 3v1h6v-1a3 3 0 0 0-3-3z"/>
              </svg>
            </span>
            <span className={s.logoText}>AI智能助手</span>
          </div>
        )}
      </div>
      {isMobile
        ? (
          <button
            type='button'
            aria-label='新对话'
            className='flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40'
            onClick={() => onCreateNewChat?.()}
          >
            <PencilSquareIcon className='h-[18px] w-[18px]' />
          </button>
        )
        : (
          <div className='flex h-full items-center gap-2' role='group' aria-label='窗口控制'>
            {isEmbedded && (
              <span className={s.aiStatusBadge}>
                ⚡️ AI在线
              </span>
            )}
            <button
              type='button'
              title={isWindowMinimized ? '展开' : '最小化'}
              aria-label={isWindowMinimized ? '展开窗口' : '最小化窗口'}
              className='flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/80 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40'
              onClick={onMinimizeWindow}
            >
              {isWindowMinimized
                ? <ChevronDownIcon className='h-[18px] w-[18px]' />
                : <MinusIcon className='h-[18px] w-[18px]' />}
            </button>
            <button
              type='button'
              title={isWindowMaximized ? '还原' : '最大化'}
              aria-label={isWindowMaximized ? '还原窗口' : '最大化窗口'}
              className='flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/80 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40'
              onClick={onToggleMaximizeWindow}
            >
              {isWindowMaximized
                ? <Square2StackIcon className='h-[17px] w-[17px]' />
                : <StopIcon className='h-[17px] w-[17px]' />}
            </button>
            <button
              type='button'
              title='关闭'
              aria-label='关闭窗口'
              className='flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40'
              onClick={onCloseWindow}
            >
              <XMarkIcon className='h-[19px] w-[19px]' />
            </button>
          </div>
        )}
    </header>
  )
}

export default React.memo(Header)
