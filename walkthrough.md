# The System — NYXIS Build Walkthrough

## What Was Built

A complete Solo Leveling–inspired RPG gamification app integrated into the existing **NYXIS** Expo project.

---

## Files Created / Modified

### Database & Types
| File | Purpose |
|------|---------|
| [supabase/schema.sql](file:///d:/Cool%20Projects/NYXIS/supabase/schema.sql) | Full PostgreSQL DDL — `profiles`, `paths`, `quests` tables + RLS policies |
| [lib/database.types.ts](file:///d:/Cool%20Projects/NYXIS/lib/database.types.ts) | TypeScript interfaces for [Profile](file:///d:/Cool%20Projects/NYXIS/lib/database.types.ts#13-28), [Path](file:///d:/Cool%20Projects/NYXIS/lib/database.types.ts#29-36), [Quest](file:///d:/Cool%20Projects/NYXIS/lib/database.types.ts#37-51) + enum types |
| [lib/supabase.ts](file:///d:/Cool%20Projects/NYXIS/lib/supabase.ts) | *(existing)* Supabase JS client — kept as-is |

### Game Logic & AI
| File | Purpose |
|------|---------|
| [lib/gameLogic.ts](file:///d:/Cool%20Projects/NYXIS/lib/gameLogic.ts) | [calculateLevel()](file:///d:/Cool%20Projects/NYXIS/lib/gameLogic.ts#10-17), [xpProgress()](file:///d:/Cool%20Projects/NYXIS/lib/gameLogic.ts#34-40), [calculateRank()](file:///d:/Cool%20Projects/NYXIS/lib/gameLogic.ts#41-58), rank/stat/quest display constants |
| [lib/aiPlaceholder.ts](file:///d:/Cool%20Projects/NYXIS/lib/aiPlaceholder.ts) | [generatePathQuests()](file:///d:/Cool%20Projects/NYXIS/lib/aiPlaceholder.ts#16-78) stub with mock data + Gemini API TODO comments |

### Hooks
| File | Purpose |
|------|---------|
| [hooks/useProfile.ts](file:///d:/Cool%20Projects/NYXIS/hooks/useProfile.ts) | Fetches player profile, real-time Supabase subscription, demo fallback |
| [hooks/useQuests.ts](file:///d:/Cool%20Projects/NYXIS/hooks/useQuests.ts) | `completeQuest()` — awards XP, increments stat, recalculates level/rank, fires Heavy haptic |

### UI Components
| File | Purpose |
|------|---------|
| [components/XPBar.tsx](file:///d:/Cool%20Projects/NYXIS/components/XPBar.tsx) | Animated neon progress bar with glow fill |
| [components/RankBadge.tsx](file:///d:/Cool%20Projects/NYXIS/components/RankBadge.tsx) | Rank pill (E→S) with per-rank color + glow shadow |
| [components/QuestCard.tsx](file:///d:/Cool%20Projects/NYXIS/components/QuestCard.tsx) | Quest card with type badge, reward chips, spring press + fade animations |
| [components/StatRadar.tsx](file:///d:/Cool%20Projects/NYXIS/components/StatRadar.tsx) | SVG pentagon radar chart for STR/INT/VIT/DEX/WIS |

### Screens
| File | Purpose |
|------|---------|
| `app/(tabs)/status.tsx` | **Status Window** — player identity, XP bar, stat radar |
| `app/(tabs)/quests.tsx` | **Quest Log** — active quest FlatList with complete/fail actions |
| `app/(tabs)/leaderboard.tsx` | **Global Ranking** — podium top-3, ranked rows, self-highlight |

### Navigation & Config
| File | Purpose |
|------|---------|
| `app/(tabs)/_layout.tsx` | Tab navigator (Status / Quests / Ranking), OLED tab bar with neon glow icons |
| [app/_layout.tsx](file:///d:/Cool%20Projects/NYXIS/app/_layout.tsx) | Root layout with OLED-black System theme override |
| [tailwind.config.js](file:///d:/Cool%20Projects/NYXIS/tailwind.config.js) | Extended with rank, stat, and quest-type color tokens |
| [.env.example](file:///d:/Cool%20Projects/NYXIS/.env.example) | Documents `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

### Dependencies Added
- `react-native-svg` — installed via `npx expo install react-native-svg` for the stat radar chart

---

## Key Design Decisions

- **Demo Mode** — Every hook has a local fallback with mock data. The app renders fully without a Supabase connection.
- **Quest Completion Flow** — Single transaction: mark COMPLETED → read profile → increment XP+stat → recalculate level/rank → Heavy haptic. All in `useQuests.completeQuest()`.
- **Leveling Formula** — `level = Math.floor(totalXp / 1000) + 1`. Ranks gate at levels 10/25/50/75/100.
- **Real-time** — [useProfile](file:///d:/Cool%20Projects/NYXIS/hooks/useProfile.ts#16-78) subscribes to Supabase `postgres_changes` so XP bars update live when another device completes a quest.

---

## Next Steps to Go Live

> [!IMPORTANT]
> **Supabase Setup Required**
> 1. Create a project at [supabase.com](https://supabase.com)
> 2. Run [supabase/schema.sql](file:///d:/Cool%20Projects/NYXIS/supabase/schema.sql) in the SQL Editor
> 3. Copy [.env.example](file:///d:/Cool%20Projects/NYXIS/.env.example) → [.env](file:///d:/Cool%20Projects/NYXIS/.env) and fill in your URL + anon key
> 4. Enable Email auth in Supabase → Authentication → Providers

> [!TIP]
> **AI Quests** — Replace the stub in [lib/aiPlaceholder.ts](file:///d:/Cool%20Projects/NYXIS/lib/aiPlaceholder.ts) with a real Gemini API call. The function signature is stable and all screens are already wired to consume the output.

```bash
# Run the app
cd "d:\Cool Projects\NYXIS"
npx expo start
```
