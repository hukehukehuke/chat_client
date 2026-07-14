import 'server-only'

import { cookies, headers } from 'next/headers'
import Negotiator from 'negotiator'
import { match } from '@formatjs/intl-localematcher'
import type { Locale } from '.'
import { i18n } from '.'

const isValidLanguageTag = (language: string) => {
  if (language === '*') {
    return false
  }

  try {
    Intl.getCanonicalLocales(language)
    return true
  }
  catch {
    return false
  }
}

export const getLocaleOnServer = async (): Promise<Locale> => {
  // @ts-expect-error locales are readonly
  const locales: string[] = i18n.locales

  let languages: string[] | undefined
  // get locale from cookie
  const localeCookie = (await cookies()).get('locale')
  languages = localeCookie?.value && isValidLanguageTag(localeCookie.value)
    ? [localeCookie.value]
    : []

  if (!languages.length) {
    // Negotiator expects plain object so we need to transform headers
    const negotiatorHeaders: Record<string, string> = {}
    const headersList = await headers()
    headersList.forEach((value, key) => (negotiatorHeaders[key] = value))
    // Use negotiator and intl-localematcher to get best locale
    languages = new Negotiator({ headers: negotiatorHeaders })
      .languages()
      .filter(isValidLanguageTag)
  }

  // match locale
  if (!languages.length) {
    return i18n.defaultLocale
  }

  const matchedLocale = match(languages, locales, i18n.defaultLocale) as Locale
  return matchedLocale
}
