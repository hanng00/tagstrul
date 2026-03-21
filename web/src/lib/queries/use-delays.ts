import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { queryKeys } from "./query-keys"

export function useDelays() {
  return useQuery({
    queryKey: queryKeys.delays,
    queryFn: api.getDelays,
  })
}

export function useDelay(delayId: string | undefined) {
  const { data: delays = [], isLoading } = useDelays()
  const delay = delayId ? delays.find((d) => d.delayId === delayId) : undefined
  return { delay, isLoading }
}
