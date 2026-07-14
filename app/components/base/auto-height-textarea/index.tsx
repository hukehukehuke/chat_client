import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import cn from 'classnames'

interface IProps {
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  className?: string
  minHeight?: number
  maxHeight?: number
  autoFocus?: boolean
  controlFocus?: number
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onKeyUp?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

const AutoHeightTextarea = forwardRef<HTMLTextAreaElement, IProps>(
  (
    { value, onChange, placeholder, className, minHeight = 36, maxHeight = 96, autoFocus, controlFocus, onKeyDown, onKeyUp }: IProps,
    outerRef,
  ) => {
    const innerRef = useRef<HTMLTextAreaElement>(null)
    useImperativeHandle(outerRef, () => innerRef.current!, [])

    const focus = useCallback(() => {
      const textarea = innerRef.current
      if (!textarea) { return }
      textarea.setSelectionRange(value.length, value.length)
      textarea.focus()
    }, [value.length])

    useEffect(() => {
      if (autoFocus) { focus() }
    }, [autoFocus, focus])
    useEffect(() => {
      if (controlFocus) { focus() }
    }, [controlFocus, focus])

    return (
      <div className='relative'>
        <div className={cn(className, 'invisible whitespace-pre-wrap break-all  overflow-y-auto')} style={{ minHeight, maxHeight }}>
          {!value ? placeholder : value.replace(/\n$/, '\n ')}
        </div>
        <textarea
          ref={innerRef}
          autoFocus={autoFocus}
          className={cn(className, 'absolute inset-0 resize-none overflow-hidden')}
          placeholder={placeholder}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          value={value}
        />
      </div>
    )
  },
)

export default AutoHeightTextarea
