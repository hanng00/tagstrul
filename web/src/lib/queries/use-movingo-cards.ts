import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { MovingoCard } from "@/types"
import { queryKeys } from "./query-keys"

export function useMovingoCards() {
  return useQuery({
    queryKey: queryKeys.movingoCards,
    queryFn: api.getMovingoCards,
  })
}

export function useAddMovingoCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (card: Omit<MovingoCard, "cardId">) => api.addMovingoCard(card),
    onSuccess: (newCard) => {
      queryClient.setQueryData<MovingoCard[]>(queryKeys.movingoCards, (old) =>
        old ? [...old, newCard] : [newCard],
      )
    },
  })
}

export function useDeleteMovingoCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cardId: string) => api.deleteMovingoCard(cardId),
    onSuccess: (_, cardId) => {
      queryClient.setQueryData<MovingoCard[]>(queryKeys.movingoCards, (old) =>
        old?.filter((c) => c.cardId !== cardId),
      )
    },
  })
}
