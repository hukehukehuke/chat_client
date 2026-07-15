import { useEffect, useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import cn from 'classnames'
import NodePanel from './node'
import s from './style.module.css'
import type { WorkflowProcess } from '@/types/app'
import CheckCircle from '@/app/components/base/icons/solid/general/check-circle'
import AlertCircle from '@/app/components/base/icons/solid/alert-circle'
import Loading02 from '@/app/components/base/icons/line/loading-02'
import { WorkflowRunningStatus } from '@/types/app'

interface WorkflowProcessProps {
  data: WorkflowProcess
  grayBg?: boolean
  expand?: boolean
  hideInfo?: boolean
}

const WorkflowProcessItem = ({
  data,
  grayBg,
  expand = false,
  hideInfo = false,
}: WorkflowProcessProps) => {
  const { t } = useTranslation()
  const running = data.status === WorkflowRunningStatus.Running
  const succeeded = data.status === WorkflowRunningStatus.Succeeded
  const failed = data.status === WorkflowRunningStatus.Failed || data.status === WorkflowRunningStatus.Stopped
  const [collapse, setCollapse] = useState(!(expand || running))

  useEffect(() => {
    setCollapse(!(expand || running))
  }, [expand, running])

  const title = running
    ? t('tools.thought.workflowRunning', { defaultValue: 'Running workflow...' })
    : succeeded
      ? t('tools.thought.workflowSucceeded', { defaultValue: 'Workflow completed' })
      : failed
        ? t('tools.thought.workflowFailed', { defaultValue: 'Workflow failed' })
        : t('tools.thought.workflow', { defaultValue: 'Workflow' })

  return (
    <section className={cn(s.workflowPanel, grayBg && s.workflowPanelGray, hideInfo && s.workflowPanelCompact)}>
      <button
        type='button'
        className={s.workflowHeader}
        aria-expanded={!collapse}
        onClick={() => setCollapse(value => !value)}
      >
        <span className={cn(
          s.statusIcon,
          succeeded && s.statusSucceeded,
          failed && s.statusFailed,
        )}>
          {running && <Loading02 className='h-3.5 w-3.5 animate-spin' />}
          {succeeded && <CheckCircle className='h-3.5 w-3.5' />}
          {failed && <AlertCircle className='h-3.5 w-3.5' />}
        </span>
        <span className={cn(s.workflowTitle, running && s.shimmerText)}>{title}</span>
        {!!data.tracing?.length && (
          <span className={s.nodeCount}>{data.tracing.length}</span>
        )}
        <ChevronDownIcon
          className={cn(s.chevron, !collapse && s.chevronExpanded)}
          aria-hidden='true'
        />
      </button>

      {!collapse && (
        <div className={s.workflowContent}>
          {data.tracing?.map(node => (
            <NodePanel key={node.id || node.node_id} nodeInfo={node} hideInfo={hideInfo} />
          ))}
        </div>
      )}
    </section>
  )
}

export default WorkflowProcessItem
