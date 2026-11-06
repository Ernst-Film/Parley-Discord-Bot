// minMembers = how many humans must be in the channel before the bot auto-joins
// (per-guild setting, default 2; 1 = record even a single person).
// guildBusy = the bot is already recording another channel in this guild; it
// has only one voice connection per guild, so joining here would hijack it.
export function shouldAutoJoin({ humanCount, autoJoin, connected, channelId, allowedChannelIds, minMembers = 2, guildBusy = false }) {
  // An empty/absent allow-list means "any voice channel" (the pre-list behavior).
  const allowed = !allowedChannelIds?.length || allowedChannelIds.includes(channelId);
  return !!autoJoin && !connected && !guildBusy && humanCount >= normalizeMin(minMembers) && allowed;
}

// Deliberately channel-list-unaware: a channel being removed from the allow-list
// mid-meeting must not stop the bot from leaving it when it empties.
// Leave threshold is capped at 2: with minMembers=1 the bot stays until the
// channel is empty; with 2+ it leaves when one or zero remain (a higher join
// threshold must not end a running meeting just because one person drops out).
export function shouldAutoLeave({ humanCount, connected, minMembers = 2 }) {
  return !!connected && humanCount < Math.min(normalizeMin(minMembers), 2);
}

function normalizeMin(n) {
  const v = Number(n);
  return Number.isInteger(v) && v >= 1 ? v : 2;
}
