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
  ArrowLeftIcon,
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
  onEndConversation?: () => void
  onBack?: () => void
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
  onEndConversation,
  onBack,
  isWindowMaximized,
  isWindowMinimized,
}) => {
  return (
    <header className='flex h-12 shrink-0 select-none items-center justify-between border-b border-slate-200/80 bg-slate-50/95 pl-2 pr-1'>
      <div className='flex min-w-0 items-center' style={{ gap: '6px' }}>
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
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
            <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6A11CB"/>
                    <stop offset="100%" stopColor="#2575FC"/>
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="8" fill="url(#aiGrad)"/>
                <text x="16" y="22" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">AI</text>
              </svg>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', flexShrink: 0 }}>AI智能助手</span>
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
              <>
                <span className={s.aiStatusBadge}>
                  ⚡️ AI在线
                </span>
                <button
                  type='button'
                  title='返回'
                  aria-label='返回'
                  className='flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40'
                  onClick={onBack}
                >
                  <ArrowLeftIcon className='h-[16px] w-[16px]' />
                </button>
              </>
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
              title={isEmbedded ? '结束对话' : '关闭'}
              aria-label={isEmbedded ? '结束对话' : '关闭窗口'}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40 ${isEmbedded ? 'bg-red-500 text-white hover:bg-red-600' : 'text-slate-500 hover:bg-red-500 hover:text-white'}`}
              onClick={isEmbedded ? onEndConversation : onCloseWindow}
            >
              {isEmbedded
                ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="19" height="19">
                    <path d="M6 7h12v10H6V7zm1 2v8h10V9H7zm-2 2l4 4-4 4 1.5 1.5L10 14l4.5 4.5L16 17l-4-4 4-4-1.5-1.5L14 10l-4.5-4.5L8 7z"/>
                  </svg>
                )
                : (
                  <XMarkIcon className='h-[19px] w-[19px]' />
                )}
            </button>
          </div>
        )}
    </header>
  )
}

export default React.memo(Header)
