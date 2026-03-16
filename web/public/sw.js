const CACHE_NAME = "tagstrul-v1"
const STATIC_ASSETS = ["/", "/manifest.json", "/favicon.svg", "/icon-192.svg", "/icon-512.svg"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

// Push notification handling
self.addEventListener("push", (event) => {
  if (!event.data) return

  const data = event.data.json()
  const { title, body, data: notificationData } = data

  const options = {
    body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: notificationData?.delayId || "delay-notification",
    renotify: true,
    data: notificationData,
    actions: [
      { action: "claim", title: "Kräv ersättning" },
      { action: "dismiss", title: "Avfärda" },
    ],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const { action } = event
  const { url, delayId } = event.notification.data || {}

  let targetUrl = "/"
  if (action === "claim" && url) {
    targetUrl = url
  } else if (action === "dismiss" && delayId) {
    targetUrl = "/app"
  } else if (url) {
    targetUrl = url
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      return clients.openWindow(targetUrl)
    })
  )
})
