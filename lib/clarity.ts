import clarity from '@microsoft/clarity'

const isBrowser = typeof window !== 'undefined'

const safeCall = (fn: () => void) => {
  if (!isBrowser) return
  try {
    fn()
  } catch (error) {
    console.error('Clarity call failed', error)
  }
}

export const initClarity = (projectId?: string) => {
  if (!projectId) return
  safeCall(() => clarity.init(projectId))
}

export const identify = (
  userId: string,
  sessionId?: string,
  pageId?: string,
  friendlyName?: string
) => {
  if (!userId) return
  safeCall(() => clarity.identify(userId, sessionId, pageId, friendlyName))
}

export const setTag = (key: string, value: string) => {
  if (!key) return
  safeCall(() => clarity.setTag(key, value))
}

export const trackEvent = (name: string) => {
  if (!name) return
  safeCall(() => clarity.event(name))
}

export const consentV2 = (options?: { ad_Storage?: 'granted' | 'denied'; analytics_Storage?: 'granted' | 'denied' }) => {
  safeCall(() => {
    if (options) {
      const ad = options.ad_Storage ?? 'granted'
      const analytics = options.analytics_Storage ?? 'granted'
      // Clarity v2 consent API expects two string args: (ad_Storage, analytics_Storage)
      ;(clarity as any).consentV2(ad, analytics)
    } else {
      ;(clarity as any).consentV2()
    }
  })
}

export const consent = (value?: boolean) => {
  safeCall(() => {
    if (typeof value === 'boolean') {
      clarity.consent(value)
    } else {
      ;(clarity as any).consent()
    }
  })
}

export const upgrade = (reason?: string) => {
  safeCall(() => {
    if (typeof reason === 'string') {
      ;(clarity as any).upgrade(reason)
    } else {
      ;(clarity as any).upgrade()
    }
  })
}
