import { getSupabaseClient } from './client'

let subscriptionSequence = 0

export function subscribeToTableChanges(
  channelPrefix: string,
  tables: readonly string[],
  onChange: () => void,
): () => void {
  subscriptionSequence += 1
  const client = getSupabaseClient()
  let channel = client.channel(`${channelPrefix}-${subscriptionSequence}`)

  for (const table of tables) {
    channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
  }

  channel.subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}
