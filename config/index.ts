import type { AppInfo } from '@/types/app'
export const APP_ID = `${process.env.NEXT_PUBLIC_APP_ID}`
export const API_KEY = `${process.env.NEXT_PUBLIC_APP_KEY}`
export const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`
export const APP_INFO: AppInfo = {
  title: ' AI需求助手',
  description: '',
  copyright: '',
  privacy_policy: '',
  default_language: 'zh-Hans',
  disable_session_same_site: false, // set it to true if you want to embed the chatbot in an iframe
}

export const isShowPrompt = false
export const promptTemplate = 'I want you to act as a javascript console.'

export const REQUIREMENT_TEMPLATE_PROMPT = `
你是一位专业的需求分析师。请根据用户的描述，帮助用户生成一份标准的需求文档。

## 内容结构标准

一份标准的需求内容通常需要包含以下要素：

1. **背景与目标**：为什么要做这个需求？解决什么痛点？预期达到什么业务指标？

2. **用户角色 (User Persona)**：谁在使用这个功能？

3. **业务流程图/状态机**：用可视化的方式展示业务流转，避免纯文字带来的歧义。

4. **功能详细描述**：
   - 正常流程：用户一步步怎么操作。
   - 异常流程：断网了、数据为空、权限不足时怎么提示。
   - 边界条件：输入框最多多少字？列表最多展示多少条？

5. **非功能性需求**：性能要求（响应时间）、安全性、兼容性要求等。

6. **数据埋点需求**：需要统计哪些点击、曝光数据？

请按照以上结构来整理和完善用户的需求。
`

export const API_PREFIX = '/api'

export const LOCALE_COOKIE_NAME = 'locale'

export const DEFAULT_VALUE_MAX_LEN = 48
