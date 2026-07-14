# iframe 嵌入 API 文档

本项目支持通过 iframe 嵌入到其他系统中，并提供双向通信机制。

## 基本用法

```html
<iframe
  id="dify-chat"
  src="https://your-domain.com"
  width="100%"
  height="600px"
></iframe>
```

## 事件列表 (iframe → 父页面)

当事件发生时，iframe 会向父页面发送消息：

```javascript
window.addEventListener('message', (event) => {
  const { type, payload } = event.data

  switch (type) {
    case 'ready':
      // iframe 已准备就绪
      console.log('版本:', payload.version)
      break

    case 'messageSent':
      // 用户发送了消息
      console.log('消息ID:', payload.id)
      console.log('内容:', payload.content)
      console.log('时间:', payload.createdAt)
      break

    case 'messageReceived':
      // 收到 AI 回复
      console.log('回复ID:', payload.id)
      console.log('回复内容:', payload.content)
      break

    case 'conversationChanged':
      // 切换了对话
      console.log('对话ID:', payload.conversationId)
      console.log('对话名称:', payload.name)
      break

    case 'conversationListUpdated':
      // 对话列表更新
      console.log('所有对话:', payload.conversations)
      break

    case 'error':
      // 发生错误
      console.log('错误码:', payload.code)
      console.log('错误信息:', payload.message)
      break
  }
})
```

## 命令列表 (父页面 → iframe)

父页面可以通过 `postMessage` 向 iframe 发送命令：

```javascript
const iframe = document.getElementById('dify-chat')

// 发送命令
iframe.contentWindow.postMessage({
  type: 'sendMessage',
  payload: {
    message: '你好，请介绍一下你自己'
  }
}, '*')
```

### 支持的命令

#### 1. init - 初始化配置

```javascript
iframe.contentWindow.postMessage({
  type: 'init',
  payload: {
    appId: 'your-app-id',        // 可选
    apiUrl: 'https://api.example.com', // 可选
    conversationId: 'conv-xxx'    // 可选，指定对话ID
  }
}, '*')
```

#### 2. sendMessage - 发送消息

```javascript
iframe.contentWindow.postMessage({
  type: 'sendMessage',
  payload: {
    message: '你好',
    files: [  // 可选，附件
      {
        type: 'image',
        url: 'https://example.com/image.png',
        transferable: false
      }
    ]
  }
}, '*')
```

#### 3. newChat - 开始新对话

```javascript
iframe.contentWindow.postMessage({
  type: 'newChat'
}, '*')
```

#### 4. switchConversation - 切换对话

```javascript
iframe.contentWindow.postMessage({
  type: 'switchConversation',
  payload: {
    conversationId: 'conv-xxx'
  }
}, '*')
```

## 完整示例

```html
<!DOCTYPE html>
<html>
<head>
  <title>嵌入示例</title>
</head>
<body>
  <h1>AI 对话助手</h1>

  <iframe
    id="chat-iframe"
    src="http://localhost:3000"
    width="100%"
    height="700px"
    style="border: 1px solid #ccc; border-radius: 8px;"
  ></iframe>

  <div style="margin-top: 20px;">
    <h3>控制面板</h3>
    <button onclick="sendMessage('你好')">发送消息</button>
    <button onclick="newChat()">新对话</button>
  </div>

  <div id="log" style="margin-top: 20px; padding: 10px; background: #f5f5f5;">
    <h4>事件日志:</h4>
    <pre id="log-content"></pre>
  </div>

  <script>
    const iframe = document.getElementById('chat-iframe')
    const logContent = document.getElementById('log-content')

    // 监听 iframe 事件
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data
      logContent.textContent += `\n[${new Date().toLocaleTimeString()}] ${type}: ${JSON.stringify(payload)}`
    })

    // 发送消息
    function sendMessage(text) {
      iframe.contentWindow.postMessage({
        type: 'sendMessage',
        payload: { message: text }
      }, '*')
    }

    // 新对话
    function newChat() {
      iframe.contentWindow.postMessage({ type: 'newChat' }, '*')
    }

    // 初始化
    iframe.contentWindow.postMessage({
      type: 'init',
      payload: {
        appId: 'your-app-id',
        conversationId: '' // 可选
      }
    }, '*')
  </script>
</body>
</html>
```

## 注意事项

1. **CORS**: 如果 iframe 和父页面不在同一域名下，可能需要配置跨域策略
2. **Ready 状态**: 建议在收到 `ready` 事件后再发送命令
3. **错误处理**: 监听 `error` 事件以便及时处理异常情况
