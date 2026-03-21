export const HomeState = {
  LOADING: "loading",
  NO_ROUTES: "no_routes",
  ACTIVE: "active",
} as const

export type HomeState = (typeof HomeState)[keyof typeof HomeState]
