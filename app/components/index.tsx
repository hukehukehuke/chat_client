'use client'
import type { FC } from 'react'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import produce, { setAutoFreeze } from 'immer'
import { useBoolean, useGetState } from 'ahooks'
import useConversation from '@/hooks/use-conversation'
import Toast from '@/app/components/base/toast'
import Sidebar from '@/app/components/sidebar'
import ConfigSence from '@/app/components/config-scence'
import Header from '@/app/components/header'
import { fetchAppParams, fetchChatList, fetchConversations, generationConversationName, sendChatMessage } from '@/service'
import type { ChatItem, ConversationItem, PromptConfig, VisionFile, VisionSettings } from '@/types/app'
import type { FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { Resolution, TransferMethod, WorkflowRunningStatus } from '@/types/app'
import Chat from '@/app/components/chat'
import { setLocaleOnClient } from '@/i18n/client'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import Loading from '@/app/components/base/loading'
import { replaceVarWithValues, userInputsFormToPromptVariables } from '@/utils/prompt'
import AppUnavailable from '@/app/components/app-unavailable'
import { API_KEY, APP_ID, APP_INFO, isShowPrompt, promptTemplate } from '@/config'
import type { Annotation as AnnotationType } from '@/types/log'
import { addFileInfos, sortAgentSorts } from '@/utils/tools'
import s from './style.module.css'

export interface IMainProps {
  params: any
}

const Main: FC<IMainProps> = () => {
  const { t } = useTranslation()
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  const hasSetAppConfig = APP_ID && API_KEY
  const [isWindowMinimized, setIsWindowMinimized] = useState(false)
  const [isWindowClosed, setIsWindowClosed] = useState(false)
  const [isWindowMaximized, setIsWindowMaximized] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => setIsWindowMaximized(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleMinimizeWindow = async () => {
    if (isWindowMinimized) {
      setIsWindowMinimized(false)
      return
    }
    try {
      if (document.fullscreenElement) { await document.exitFullscreen() }
    }
    finally {
      setIsWindowMinimized(true)
    }
  }

  const handleToggleMaximizeWindow = async () => {
    setIsWindowMinimized(false)
    try {
      if (document.fullscreenElement) { await document.exitFullscreen() }
      else { await document.documentElement.requestFullscreen() }
    }
    catch {
      setIsWindowMaximized(false)
    }
  }

  const handleCloseWindow = async () => {
    try {
      if (document.fullscreenElement) { await document.exitFullscreen() }
    }
    finally {
      setIsWindowClosed(true)
    }
  }

  /*
  * app info
  */
  const [appUnavailable, setAppUnavailable] = useState<boolean>(false)
  const [isUnknownReason, setIsUnknownReason] = useState<boolean>(false)
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null)
  const [inited, setInited] = useState<boolean>(false)
  // in mobile, show sidebar by click button
  const [isShowSidebar, { setTrue: showSidebar, setFalse: hideSidebar }] = useBoolean(false)
  const [visionConfig, setVisionConfig] = useState<VisionSettings | undefined>({
    enabled: false,
    number_limits: 2,
    detail: Resolution.low,
    transfer_methods: [TransferMethod.local_file],
  })
  const [fileConfig, setFileConfig] = useState<FileUpload | undefined>()

  useEffect(() => {
    if (APP_INFO?.title) { document.title = `${APP_INFO.title} - 技术支持` }
  }, [])

  // onData change thought (the produce obj). https://github.com/immerjs/immer/issues/576
  useEffect(() => {
    setAutoFreeze(false)
    return () => {
      setAutoFreeze(true)
    }
  }, [])

  /*
  * conversation info
  */
  const {
    conversationList,
    setConversationList,
    currConversationId,
    getCurrConversationId,
    setCurrConversationId,
    getConversationIdFromStorage,
    isNewConversation,
    currConversationInfo,
    currInputs,
    newConversationInputs,
    resetNewConversationInputs,
    setCurrInputs,
    setNewConversationInfo,
    setExistConversationInfo,
  } = useConversation()

  const [isResponding, { setTrue: setRespondingTrue, setFalse: setRespondingFalse }] = useBoolean(false)
  const requestGenerationRef = useRef(0)
  const activeRequestControllerRef = useRef<AbortController | null>(null)
  const cancelActiveResponse = () => {
    requestGenerationRef.current += 1
    activeRequestControllerRef.current?.abort()
    activeRequestControllerRef.current = null
    setRespondingFalse()
  }

  useEffect(() => () => {
    requestGenerationRef.current += 1
    activeRequestControllerRef.current?.abort()
  }, [])

  const [conversationIdChangeBecauseOfNew, setConversationIdChangeBecauseOfNew, getConversationIdChangeBecauseOfNew] = useGetState(false)
  const [isChatStarted, { setTrue: setChatStarted, setFalse: setChatNotStarted }] = useBoolean(false)
  const handleStartChat = (inputs: Record<string, any>) => {
    createNewChat()
    setConversationIdChangeBecauseOfNew(true)
    setCurrInputs(inputs)
    setChatStarted()
    setChatList([])
  }
  const hasSetInputs = (() => {
    if (!isNewConversation) { return true }

    // Apps without prompt variables can enter the conversation directly.
    // Prompt-driven apps still keep the existing configuration step.
    return isChatStarted || promptConfig?.prompt_variables.length === 0
  })()

  const conversationName = currConversationInfo?.name || t('app.chat.newChatDefaultName') as string
  const conversationIntroduction = currConversationInfo?.introduction || ''
  const suggestedQuestions = currConversationInfo?.suggested_questions || []

  const handleConversationSwitch = () => {
    if (!inited) { return }

    // update inputs of current conversation
    let notSyncToStateIntroduction = ''
    let notSyncToStateInputs: Record<string, any> | undefined | null = {}
    if (!isNewConversation) {
      const item = conversationList.find(item => item.id === currConversationId)
      notSyncToStateInputs = item?.inputs || {}
      setCurrInputs(notSyncToStateInputs as any)
      notSyncToStateIntroduction = item?.introduction || ''
      setExistConversationInfo({
        name: item?.name || '',
        introduction: notSyncToStateIntroduction,
        suggested_questions: suggestedQuestions,
      })
    }
    else {
      notSyncToStateInputs = newConversationInputs
      setCurrInputs(notSyncToStateInputs)
    }

    // update chat list of current conversation
    if (!isNewConversation && !conversationIdChangeBecauseOfNew && !isResponding) {
      const requestedConversationId = currConversationId
      fetchChatList(requestedConversationId).then((res: any) => {
        // Ignore a slow history response after the user has already switched
        // to another conversation (especially a fresh "new chat").
        if (getCurrConversationId() !== requestedConversationId) { return }

        const { data } = res
        const newChatList: ChatItem[] = []

        data.forEach((item: any) => {
          newChatList.push({
            id: `question-${item.id}`,
            content: item.query,
            isAnswer: false,
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'user') || [],

          })
          newChatList.push({
            id: item.id,
            content: item.answer,
            agent_thoughts: addFileInfos(item.agent_thoughts ? sortAgentSorts(item.agent_thoughts) : item.agent_thoughts, item.message_files),
            feedback: item.feedback,
            isAnswer: true,
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'assistant') || [],
          })
        })
        setChatList(newChatList)
      })
    }

    if (isNewConversation) {
      setChatList([])
    }
  }
  // Conversation hydration is intentionally driven by identity changes only.
  useEffect(handleConversationSwitch, [currConversationId, inited]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConversationIdChange = (id: string) => {
    if (id !== getCurrConversationId() || id === '-1') { cancelActiveResponse() }

    if (id === '-1') {
      createNewChat()
      setConversationIdChangeBecauseOfNew(true)
      setChatNotStarted()
      setChatList([])
      setChatResetKey(value => value + 1)
    }
    else {
      setConversationIdChangeBecauseOfNew(false)
    }
    // trigger handleConversationSwitch
    setCurrConversationId(id, APP_ID)
    hideSidebar()
  }

  /*
  * chat info. chat is under conversation.
  */
  const [chatList, setChatList, getChatList] = useGetState<ChatItem[]>([])
  const chatListDomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // scroll to bottom with page-level scrolling
    if (chatListDomRef.current) {
      setTimeout(() => {
        chatListDomRef.current?.scrollIntoView({
          behavior: 'auto',
          block: 'end',
        })
      }, 50)
    }
  }, [chatList, currConversationId])
  // user can not edit inputs if user had send message
  const canEditInputs = !chatList.some(item => item.isAnswer === false) && isNewConversation
  const hasConversationMessages = chatList.length > 0
  const isGeminiEmptyState = hasSetInputs && isNewConversation && !hasConversationMessages
  let welcomeIntroduction = conversationIntroduction
  if (welcomeIntroduction && currInputs) {
    welcomeIntroduction = replaceVarWithValues(welcomeIntroduction, promptConfig?.prompt_variables || [], currInputs)
  }
  const createNewChat = () => {
    // if new chat is already exist, do not create new chat
    if (conversationList.some(item => item.id === '-1')) { return }

    setConversationList(produce(conversationList, (draft) => {
      draft.unshift({
        id: '-1',
        name: t('app.chat.newChatDefaultName'),
        inputs: newConversationInputs,
        introduction: conversationIntroduction,
        suggested_questions: suggestedQuestions,
      })
    }))
  }

  // init
  useEffect(() => {
    if (!hasSetAppConfig) {
      setAppUnavailable(true)
      return
    }
    (async () => {
      try {
        const [conversationData, appParams] = await Promise.all([fetchConversations(), fetchAppParams()])
        // handle current conversation id
        const { data: conversations, error } = conversationData as { data: ConversationItem[], error: string }
        if (error) {
          Toast.notify({ type: 'error', message: error })
          throw new Error(error)
          return
        }
        const _conversationId = getConversationIdFromStorage(APP_ID)
        const currentConversation = conversations.find(item => item.id === _conversationId)
        const isNotNewConversation = !!currentConversation

        // fetch new conversation info
        const { user_input_form, opening_statement: introduction, file_upload, system_parameters, suggested_questions = [] }: any = appParams
        setLocaleOnClient(APP_INFO.default_language, true)
        setNewConversationInfo({
          name: t('app.chat.newChatDefaultName'),
          introduction,
          suggested_questions,
        })
        if (isNotNewConversation) {
          setExistConversationInfo({
            name: currentConversation.name || t('app.chat.newChatDefaultName'),
            introduction,
            suggested_questions,
          })
        }
        const prompt_variables = userInputsFormToPromptVariables(user_input_form)
        setPromptConfig({
          prompt_template: promptTemplate,
          prompt_variables,
        } as PromptConfig)
        const outerFileUploadEnabled = !!file_upload?.enabled
        setVisionConfig({
          ...file_upload?.image,
          enabled: !!(outerFileUploadEnabled && file_upload?.image?.enabled),
          image_file_size_limit: system_parameters?.system_parameters || 0,
        })
        setFileConfig({
          enabled: outerFileUploadEnabled,
          allowed_file_types: file_upload?.allowed_file_types,
          allowed_file_extensions: file_upload?.allowed_file_extensions,
          allowed_file_upload_methods: file_upload?.allowed_file_upload_methods,
          number_limits: file_upload?.number_limits,
          fileUploadConfig: file_upload?.fileUploadConfig,
        })
        setConversationList(conversations as ConversationItem[])

        if (isNotNewConversation) { setCurrConversationId(_conversationId, APP_ID, false) }

        setInited(true)
      }
      catch (e: any) {
        if (e.status === 404) {
          setAppUnavailable(true)
        }
        else {
          setIsUnknownReason(true)
          setAppUnavailable(true)
        }
      }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- application configuration is loaded once on mount

  const { notify } = Toast
  const logError = (message: string) => {
    notify({ type: 'error', message })
  }

  const checkCanSend = () => {
    if (currConversationId !== '-1') { return true }

    if (!currInputs || !promptConfig?.prompt_variables) { return true }

    let emptyRequiredInput = false
    promptConfig.prompt_variables.forEach((item) => {
      if (item.required && !currInputs[item.key]) {
        emptyRequiredInput = true
      }
    })

    if (emptyRequiredInput) {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  const [chatResetKey, setChatResetKey] = useState(0)

  const updateCurrentQA = ({
    responseItem,
    questionId,
    placeholderAnswerId,
    questionItem,
  }: {
    responseItem: ChatItem
    questionId: string
    placeholderAnswerId: string
    questionItem: ChatItem
  }) => {
    // closesure new list is outdated.
    const newListWithAnswer = produce(
      getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
      (draft) => {
        if (!draft.find(item => item.id === questionId)) { draft.push({ ...questionItem }) }

        draft.push({ ...responseItem })
      },
    )
    setChatList(newListWithAnswer)
  }

  const transformToServerFile = (fileItem: any) => {
    return {
      type: 'image',
      transfer_method: fileItem.transferMethod,
      url: fileItem.url,
      upload_file_id: fileItem.id,
    }
  }

  const handleSend = async (message: string, files?: VisionFile[]) => {
    if (isResponding) {
      notify({ type: 'info', message: t('app.errorMessage.waitForResponse') })
      return
    }

    // The no-variable flow no longer needs a separate "start chat" click,
    // so initialise the virtual conversation on the first actual message.
    if (isNewConversation && !isChatStarted) {
      createNewChat()
      setConversationIdChangeBecauseOfNew(true)
      setChatStarted()
    }

    const toServerInputs: Record<string, any> = {}
    if (currInputs) {
      Object.keys(currInputs).forEach((key) => {
        const value = currInputs[key]
        if (value.supportFileType) { toServerInputs[key] = transformToServerFile(value) }

        else if (value[0]?.supportFileType) { toServerInputs[key] = value.map((item: any) => transformToServerFile(item)) }

        else { toServerInputs[key] = value }
      })
    }

    const data: Record<string, any> = {
      inputs: toServerInputs,
      query: message,
      conversation_id: isNewConversation ? null : currConversationId,
    }

    if (files && files?.length > 0) {
      data.files = files.map((item) => {
        if (item.transfer_method === TransferMethod.local_file) {
          return {
            ...item,
            url: '',
          }
        }
        return item
      })
    }

    // question
    const questionId = `question-${Date.now()}`
    const questionItem = {
      id: questionId,
      content: message,
      isAnswer: false,
      message_files: (files || []).filter((f: any) => f.type === 'image'),
    }

    const placeholderAnswerId = `answer-placeholder-${Date.now()}`
    const placeholderAnswerItem = {
      id: placeholderAnswerId,
      content: '',
      isAnswer: true,
    }

    const newList = [...getChatList(), questionItem, placeholderAnswerItem]
    setChatList(newList)

    let isAgentMode = false

    // answer
    const responseItem: ChatItem = {
      id: `${Date.now()}`,
      content: '',
      agent_thoughts: [],
      message_files: [],
      isAnswer: true,
    }
    let hasSetResponseId = false

    const prevTempNewConversationId = getCurrConversationId() || '-1'
    const requestGeneration = ++requestGenerationRef.current
    const isCurrentResponse = () => requestGenerationRef.current === requestGeneration
    let tempNewConversationId = ''

    setRespondingTrue()
    sendChatMessage(data, {
      getAbortController: (abortController) => {
        if (!isCurrentResponse()) {
          abortController.abort()
          return
        }
        activeRequestControllerRef.current = abortController
      },
      onData: (message: string, isFirstMessage: boolean, { conversationId: newConversationId, messageId }: any) => {
        if (!isCurrentResponse() || prevTempNewConversationId !== getCurrConversationId()) { return }

        if (!isAgentMode) {
          responseItem.content = responseItem.content + message
        }
        else {
          const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts?.length - 1]
          if (lastThought) { lastThought.thought = lastThought.thought + message } // need immer setAutoFreeze
        }
        if (messageId && !hasSetResponseId) {
          responseItem.id = messageId
          hasSetResponseId = true
        }

        if (isFirstMessage && newConversationId) { tempNewConversationId = newConversationId }

        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      async onCompleted(hasError?: boolean) {
        if (!isCurrentResponse()) { return }
        if (hasError) {
          activeRequestControllerRef.current = null
          setRespondingFalse()
          return
        }

        if (getConversationIdChangeBecauseOfNew()) {
          try {
            const { data: allConversations }: any = await fetchConversations()
            if (!isCurrentResponse()) { return }
            const newItem: any = await generationConversationName(allConversations[0].id)
            if (!isCurrentResponse()) { return }

            const newAllConversations = produce(allConversations, (draft: any) => {
              draft[0].name = newItem.name
            })
            setConversationList(newAllConversations as any)
          }
          catch {
            // The request layer already reports the error. Conversation finalisation
            // must continue so the UI does not remain stuck in a responding state.
          }
        }
        if (!isCurrentResponse()) { return }
        setConversationIdChangeBecauseOfNew(false)
        resetNewConversationInputs()
        setChatNotStarted()
        if (tempNewConversationId) { setCurrConversationId(tempNewConversationId, APP_ID, true) }
        activeRequestControllerRef.current = null
        setRespondingFalse()
      },
      onFile(file) {
        if (!isCurrentResponse()) { return }
        const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts?.length - 1]
        if (lastThought) { lastThought.message_files = [...(lastThought as any).message_files, { ...file }] }

        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      onThought(thought) {
        if (!isCurrentResponse() || prevTempNewConversationId !== getCurrConversationId()) { return false }

        isAgentMode = true
        const response = responseItem as any
        if (thought.message_id && !hasSetResponseId) {
          response.id = thought.message_id
          hasSetResponseId = true
        }
        // responseItem.id = thought.message_id;
        if (response.agent_thoughts.length === 0) {
          response.agent_thoughts.push(thought)
        }
        else {
          const lastThought = response.agent_thoughts[response.agent_thoughts.length - 1]
          // thought changed but still the same thought, so update.
          if (lastThought.id === thought.id) {
            thought.thought = lastThought.thought
            thought.message_files = lastThought.message_files
            responseItem.agent_thoughts![response.agent_thoughts.length - 1] = thought
          }
          else {
            responseItem.agent_thoughts!.push(thought)
          }
        }
        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      onMessageEnd: (messageEnd) => {
        if (!isCurrentResponse()) { return }
        if (messageEnd.metadata?.annotation_reply) {
          responseItem.id = messageEnd.id
          responseItem.annotation = ({
            id: messageEnd.metadata.annotation_reply.id,
            authorName: messageEnd.metadata.annotation_reply.account.name,
          } as AnnotationType)
          const newListWithAnswer = produce(
            getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
            (draft) => {
              if (!draft.find(item => item.id === questionId)) { draft.push({ ...questionItem }) }

              draft.push({
                ...responseItem,
              })
            },
          )
          setChatList(newListWithAnswer)
          return
        }
        // not support show citation
        // responseItem.citation = messageEnd.retriever_resources
        const newListWithAnswer = produce(
          getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
          (draft) => {
            if (!draft.find(item => item.id === questionId)) { draft.push({ ...questionItem }) }

            draft.push({ ...responseItem })
          },
        )
        setChatList(newListWithAnswer)
      },
      onMessageReplace: (messageReplace) => {
        if (!isCurrentResponse()) { return }
        setChatList(produce(
          getChatList(),
          (draft) => {
            const current = draft.find(item => item.id === messageReplace.id)

            if (current) { current.content = messageReplace.answer }
          },
        ))
      },
      onError() {
        if (!isCurrentResponse()) { return }
        activeRequestControllerRef.current = null
        setRespondingFalse()
        // Roll back only this request's placeholder answer.
        setChatList(produce(getChatList(), (draft) => {
          const placeholderIndex = draft.findIndex(item => item.id === placeholderAnswerId)
          if (placeholderIndex >= 0) { draft.splice(placeholderIndex, 1) }
        }))
      },
      onWorkflowStarted: ({ workflow_run_id }) => {
        if (!isCurrentResponse()) { return }
        responseItem.workflow_run_id = workflow_run_id
        responseItem.workflowProcess = {
          status: WorkflowRunningStatus.Running,
          tracing: [],
        }
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          if (currentIndex < 0) { return }
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onWorkflowFinished: ({ data }) => {
        if (!isCurrentResponse()) { return }
        responseItem.workflowProcess!.status = data.status as WorkflowRunningStatus
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          if (currentIndex < 0) { return }
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onNodeStarted: ({ data }) => {
        if (!isCurrentResponse()) { return }
        responseItem.workflowProcess!.tracing!.push(data as any)
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          if (currentIndex < 0) { return }
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onNodeFinished: ({ data }) => {
        if (!isCurrentResponse()) { return }
        const currentIndex = responseItem.workflowProcess!.tracing!.findIndex(item => item.node_id === data.node_id)
        if (currentIndex < 0) { return }
        responseItem.workflowProcess!.tracing[currentIndex] = data as any
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          if (currentIndex < 0) { return }
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
    })
  }

  const renderSidebar = () => {
    if (!APP_ID || !APP_INFO || !promptConfig) { return null }
    return (
      <Sidebar
        list={conversationList}
        onCurrentIdChange={handleConversationIdChange}
        currentId={currConversationId}
        copyRight={APP_INFO.copyright || APP_INFO.title}
      />
    )
  }

  if (appUnavailable) { return <AppUnavailable isUnknownReason={isUnknownReason} errMessage={!hasSetAppConfig ? 'Please set APP_ID and API_KEY in config/index.tsx' : ''} /> }

  if (!APP_ID || !APP_INFO || !promptConfig) { return <Loading type='app' /> }

  if (isWindowClosed) {
    return (
      <div className='flex h-screen items-start bg-slate-200 p-3'>
        <button
          type='button'
          className='group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-lg shadow-slate-500/10 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40'
          onClick={() => {
            setIsWindowClosed(false)
            setIsWindowMinimized(false)
          }}
        >
          <Image
            src='/favicon.ico'
            alt=''
            width={32}
            height={32}
            unoptimized
            className='h-8 w-8 object-contain'
            aria-hidden='true'
          />
          重新打开 {APP_INFO.title}
        </button>
      </div>
    )
  }

  return (
    <div className='h-screen overflow-hidden bg-slate-200'>
      <Header
        title={APP_INFO.title}
        isMobile={isMobile}
        onShowSideBar={showSidebar}
        onCreateNewChat={() => handleConversationIdChange('-1')}
        onMinimizeWindow={handleMinimizeWindow}
        onToggleMaximizeWindow={handleToggleMaximizeWindow}
        onCloseWindow={handleCloseWindow}
        isWindowMaximized={isWindowMaximized}
        isWindowMinimized={isWindowMinimized}
      />
      {!isWindowMinimized && <div className='flex bg-white overflow-hidden'>
        {/* sidebar */}
        {!isMobile && renderSidebar()}
        {isMobile && isShowSidebar && (
          <div className='fixed inset-0 z-50' style={{ backgroundColor: 'rgba(35, 56, 118, 0.2)' }} onClick={hideSidebar} >
            <div className='inline-block' onClick={e => e.stopPropagation()}>
              {renderSidebar()}
            </div>
          </div>
        )}
        {/* main */}
        <div className={`${s.mainSurface} ${isGeminiEmptyState ? s.mainSurfaceEmpty : ''} flex-grow flex flex-col h-[calc(100vh_-_3rem)] overflow-y-auto`}>
          <div className={s.contentBrand}>
            <Image
              src='/favicon.ico'
              alt=''
              width={32}
              height={32}
              unoptimized
              className={s.contentBrandIcon}
              aria-hidden='true'
            />
            <span className={s.contentBrandTitle}>{APP_INFO.title}</span>
          </div>
          <ConfigSence
            conversationName={conversationName}
            hasSetInputs={hasSetInputs}
            isPublicVersion={isShowPrompt}
            siteInfo={APP_INFO}
            promptConfig={promptConfig}
            onStartChat={handleStartChat}
            canEditInputs={canEditInputs}
            savedInputs={currInputs as Record<string, any>}
            onInputsChange={setCurrInputs}
          ></ConfigSence>

          {
            hasSetInputs && (
              <div className={s.chatContent} ref={chatListDomRef}>
                <Chat
                  key={`${currConversationId}-${chatResetKey}`}
                  chatList={chatList}
                  onSend={handleSend}
                  isResponding={isResponding}
                  checkCanSend={checkCanSend}
                  visionConfig={visionConfig}
                  fileConfig={fileConfig}
                  isWelcomeState={isGeminiEmptyState}
                  openingStatement={welcomeIntroduction}
                  suggestedQuestions={suggestedQuestions}
                />
              </div>)
          }
        </div>
      </div>}
    </div>
  )
}

export default React.memo(Main)
