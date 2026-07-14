import { getLocaleOnServer } from '@/i18n/server'
import { IframeProvider } from '@/components/iframe/IframeProvider'

import './styles/globals.css'
import './styles/markdown.scss'

const LocaleLayout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  const locale = await getLocaleOnServer()
  return (
    <html lang={locale ?? 'zh-Hans'} className="h-full">
      <body className="h-full">
        <IframeProvider>
          <div className="overflow-x-auto">
            <div className="w-screen h-screen min-w-[300px]">
              {children}
            </div>
          </div>
        </IframeProvider>
      </body>
    </html>
  )
}

export default LocaleLayout
