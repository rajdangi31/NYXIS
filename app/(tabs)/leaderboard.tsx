// ─────────────────────────────────────────────
//  LeaderboardScreen — Global Hunter Rankings
// ─────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Crown } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../lib/database.types';
import { RankBadge } from '../../components/RankBadge';
import { RANK_COLORS } from '../../lib/gameLogic';

function useLeaderboard() {
  const [players, setPlayers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setMyId(user?.id ?? null);

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('total_xp', { ascending: false })
        .limit(50);

      setPlayers((data ?? []) as Profile[]);
    } catch (e) {
      // Use demo data if Supabase not connected
      setPlayers(getDemoLeaderboard());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { players, loading, myId, refresh: fetch };
}

function getDemoLeaderboard(): Profile[] {
  const names = [
    ['Sung Jin-Woo',  'Shadow Monarch',  99, 'S', 99000],
    ['Thomas Andre',  'National Level',  75, 'A', 75000],
    ['Liu Zhigang',   'China S-Rank',    63, 'A', 63000],
    ['Go Gunhee',     'Guild Leader',    55, 'B', 55000],
    ['Yoo Jinho',     'Vice Master',     34, 'C', 34000],
    ['Cha Hae-In',    'S-Rank Hunter',   80, 'A', 80000],
    ['You Hunter',    'The Weakest',      1, 'E',     0],
  ];

  return names.map(([name, title, level, rank, xp], i) => ({
    id: `demo-p-${i}`,
    player_name: name as string,
    player_title: title as string,
    level: level as number,
    rank: rank as Profile['rank'],
    total_xp: xp as number,
    stats_str: 0, stats_int: 0, stats_vit: 0, stats_dex: 0, stats_wis: 0,
  }));
}

function positionColor(pos: number): string {
  if (pos === 1) return '#FFD700';
  if (pos === 2) return '#C0C0C0';
  if (pos === 3) return '#CD7F32';
  return '#333';
}

interface RowProps {
  player: Profile;
  position: number;
  isMe: boolean;
}

function LeaderboardRow({ player, position, isMe }: RowProps) {
  const rankColor = RANK_COLORS[player.rank] ?? '#9E9E9E';
  const posColor  = positionColor(position);

  return (
    <View style={[styles.row, isMe && styles.rowHighlight]}>
      {/* Position */}
      <View style={styles.posContainer}>
        {position <= 3
          ? <Crown size={16} color={posColor} />
          : <Text style={[styles.posText, { color: posColor }]}>{position}</Text>
        }
      </View>

      {/* Player info */}
      <View style={styles.playerInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.playerName, isMe && styles.meHighlight]}>
            {player.player_name}
          </Text>
          {isMe && <Text style={styles.meTag}>YOU</Text>}
        </View>
        <Text style={styles.playerTitle}>{player.player_title}</Text>
      </View>

      {/* Rank & XP */}
      <View style={styles.rightSide}>
        <RankBadge rank={player.rank} size="sm" />
        <Text style={[styles.xpText, { color: rankColor }]}>
          {player.total_xp.toLocaleString()} XP
        </Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const { players, loading, myId, refresh } = useLeaderboard();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.headerBar}>
        <Trophy size={16} color="#FFD700" />
        <Text style={styles.headerTitle}>GLOBAL RANKINGS</Text>
      </View>

      {/* Top-3 spotlight */}
      {!loading && players.length >= 3 && (
        <View style={styles.podium}>
          {[players[1], players[0], players[2]].map((p, idx) => {
            const actualPos = idx === 0 ? 2 : idx === 1 ? 1 : 3;
            const color = positionColor(actualPos);
            return (
              <View
                key={p.id}
                style={[
                  styles.podiumItem,
                  actualPos === 1 && styles.podiumCenter,
                ]}
              >
                <Crown size={actualPos === 1 ? 22 : 16} color={color} />
                <Text style={[styles.podiumName, { color: actualPos === 1 ? '#FFF' : '#AAA' }]}
                  numberOfLines={1}>
                  {p.player_name.split(' ').slice(-1)[0]}
                </Text>
                <Text style={[styles.podiumXp, { color }]}>
                  {(p.total_xp / 1000).toFixed(0)}k
                </Text>
                <View style={[styles.podiumBar, {
                  height: actualPos === 1 ? 50 : actualPos === 2 ? 34 : 24,
                  backgroundColor: color + '33',
                  borderTopColor: color,
                }]} />
              </View>
            );
          })}
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#00E5FF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          renderItem={({ item, index }) => (
            <LeaderboardRow
              player={item}
              position={index + 1}
              isMe={item.id === myId}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#FFD700',
    fontFamily: 'SpaceMono',
    fontSize: 11,
    letterSpacing: 3,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  podiumCenter: {
    marginBottom: 0,
  },
  podiumName: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  podiumXp: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 1,
  },
  podiumBar: {
    width: '100%',
    borderTopWidth: 2,
    borderRadius: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#111',
  },
  rowHighlight: {
    borderColor: '#00E5FF44',
    backgroundColor: '#00E5FF08',
  },
  posContainer: {
    width: 28,
    alignItems: 'center',
  },
  posText: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    fontWeight: '700',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    color: '#DDD',
    fontSize: 14,
    fontWeight: '600',
  },
  meHighlight: {
    color: '#FFF',
  },
  meTag: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 8,
    letterSpacing: 1.5,
    borderWidth: 1,
    borderColor: '#00E5FF',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  playerTitle: {
    color: '#444',
    fontSize: 11,
    marginTop: 1,
  },
  rightSide: {
    alignItems: 'flex-end',
    gap: 4,
  },
  xpText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
