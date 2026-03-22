import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/queries"

type PushPermission = "default" | "granted" | "denied" | "unsupported"

export function usePushNotifications() {
  const { isAuthenticated } = useAuth()
  const [permission, setPermission] = useState<PushPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const checkSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch {
      setIsSubscribed(false)
    }
  }, [])

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported")
      return
    }

    setPermission(Notification.permission as PushPermission)

    if (Notification.permission === "granted" && isAuthenticated) {
      checkSubscription()
    }
  }, [isAuthenticated, checkSubscription])

  const subscribe = useCallback(async () => {
    if (!isAuthenticated) return false

    setIsLoading(true)
    try {
      const currentPermission = await Notification.requestPermission()
      setPermission(currentPermission as PushPermission)

      if (currentPermission !== "granted") {
        return false
      }

      const { publicKey } = await api.getVapidKey()
      const registration = await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      })

      const subscriptionJson = subscription.toJSON()
      await api.subscribePush(subscriptionJson)

      setIsSubscribed(true)
      return true
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const unsubscribe = useCallback(async () => {
    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await api.unsubscribePush(subscription.endpoint)
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
      return true
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const sendTestNotification = useCallback(async () => {
    try {
      // Request permission if not already granted
      if (Notification.permission === "default") {
        const result = await Notification.requestPermission()
        setPermission(result as PushPermission)
        if (result !== "granted") return false
      } else if (Notification.permission !== "granted") {
        return false
      }

      const registration = await navigator.serviceWorker.ready
      await registration.showNotification("🚂 Testnotis från Tågstrul", {
        body: "Så här ser det ut när ditt tåg är försenat!",
        icon: "/favicon.svg",
        tag: "test-notification",
      })
      return true
    } catch (error) {
      console.error("Failed to send test notification:", error)
      return false
    }
  }, [])

  return {
    permission,
    isSubscribed,
    isLoading,
    canSubscribe: permission !== "denied" && permission !== "unsupported",
    subscribe,
    unsubscribe,
    sendTestNotification,
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
