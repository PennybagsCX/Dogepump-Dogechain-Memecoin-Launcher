/**
 * Reset Moderation Data
 *
 * This script resets all moderation-related data from localStorage
 * to prepare for database integration.
 */

export function resetModerationData() {
  console.log('[RESET] Clearing all moderation data from localStorage...');

  // Clear warnings
  const warnings = localStorage.getItem('dogepump_warned_users');
  if (warnings) {
    console.log('[RESET] Found warned users:', JSON.parse(warnings).length);
    localStorage.removeItem('dogepump_warned_users');
  }

  // Clear bans
  const bans = localStorage.getItem('dogepump_banned_users');
  if (bans) {
    console.log('[RESET] Found banned users:', JSON.parse(bans).length);
    localStorage.removeItem('dogepump_banned_users');
  }

  // Clear admin actions
  const actions = localStorage.getItem('dogepump_admin_actions');
  if (actions) {
    console.log('[RESET] Found admin actions:', JSON.parse(actions).length);
    localStorage.removeItem('dogepump_admin_actions');
  }

  // Also clear any delisted tokens
  const tokens = localStorage.getItem('dogepump_tokens');
  if (tokens) {
    const parsedTokens = JSON.parse(tokens);
    const delistedTokens = parsedTokens.filter((t: any) => t.delisted);
    if (delistedTokens.length > 0) {
      console.log('[RESET] Found delisted tokens:', delistedTokens.length);
      // Remove delisted flag from all tokens
      const cleanTokens = parsedTokens.map((t: any) => ({
        ...t,
        delisted: undefined,
        delistedReason: undefined,
        delistedAt: undefined
      }));
      localStorage.setItem('dogepump_tokens', JSON.stringify(cleanTokens));
    }
  }

  console.log('[RESET] ✅ All moderation data cleared from localStorage');
  console.log('[RESET] 📊 Data will now be loaded from database via API');

  return {
    warningsCleared: !!warnings,
    bansCleared: !!bans,
    actionsCleared: !!actions,
    tokensReset: !!tokens
  };
}

// Auto-run if called directly
if (typeof window !== 'undefined' && window.location.search.includes('reset=true')) {
  const result = resetModerationData();
  alert('Moderation data reset! You can close this tab and refresh the app.');
  console.log('[RESET] Result:', result);
}
