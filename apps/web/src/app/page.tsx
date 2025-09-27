// Clean implementation of the page component
"use client";
import React, { useState } from 'react';
import HeroSearch from '@/components/HeroSearch';
import { useVideoClips } from '@/lib/useVideoClips';
import { useCfbPlayerSearch } from '@/lib/useCfbPlayerSearch';
import { useCfbProps } from '@/lib/useCfbProps';
import { AppShell, SectionHeader, Card, CTAButton, Badge } from '@/ui';
import { statToShortLabel, formatEdge, getConference } from '@/lib/cfb';
import { SocialClips, useSocialClips } from '@/components/SocialClips';
import { EvidenceRail, TLMoment } from '@/components/EvidenceRail';
import { MomentPlayer } from '@/components/MomentPlayer';

// ---------- Presentational helpers ----------
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--fg-dim)]">{label}</div>
      <div className="text-3xl font-semibold tabular-nums lining-nums">{value}</div>
    </div>
  );
}

function VideoSearchForm({ onSearch, loading }: { onSearch: (q: string) => void; loading: boolean }) {
  const [q, setQ] = useState('');
  return (
    <div className="mt-3 flex gap-2">
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder='e.g., "quarterback highlights", "rushing touchdowns"'
        className="w-full rounded-lg bg-[var(--card)] text-[var(--fg)] placeholder-[var(--muted)] border border-white/10 px-3 py-2 focus:ring-2 focus:ring-[var(--iris)] focus:outline-none"
        onKeyDown={e => e.key === 'Enter' && !loading && onSearch(q)}
      />
      <button
        onClick={() => onSearch(q)}
        disabled={loading}
        className="rounded-lg px-3 py-2 bg-[var(--iris)]/90 hover:bg-[var(--iris)] transition disabled:opacity-50"
      >
        {loading ? 'Searching...' : 'Go'}
      </button>
    </div>
  );
}

function ClipCard({ title, time, snippet }: { title: string; time: string; snippet: string }) {
  return (
    <div className="rounded-xl bg-black/20 ring-1 ring-white/10 p-3">
      <div className="text-[var(--fg)] font-medium">{title}</div>
      <div className="text-xs text-[var(--fg-dim)]">{time}</div>
      <p className="mt-2 text-sm text-[var(--fg)]/90">{snippet}</p>
    </div>
  );
}

// ---------- Page Component ----------
export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null); // reserved for future drawer
  const [selectedMoment, setSelectedMoment] = useState<TLMoment | null>(null);

  const { loading: loadingClips, clips, search: searchVideos } = useVideoClips();
  const { setQ: setPlayerQuery, loading: loadingPlayers, results: playerResults } = useCfbPlayerSearch();
  const { loading: loadingProps, data: propsData } = useCfbProps(selectedPlayerId);
  const { clips: socialClips } = useSocialClips(
    'search',
    selectedPlayerId && propsData ? { player: propsData.player.name, team: propsData.player.team } : {},
    4
  );

  function handleSearch(_sport: string, q: string) {
    if (!q) return;
    setPlayerQuery(q);
    setSearchQuery(q);
    setShowResults(true);
  }

  return (
    <AppShell>
      {/* Hero */}
      <div className="space-y-10">
        <SectionHeader
          title="Prop & Video Intelligence"
          subtitle="Compare market lines to our fair models and inspect video-derived evidence in seconds."
        />
        <HeroSearch onSearch={handleSearch} />
      </div>

      {/* Search Results Panel */}
      {showResults && (
        <section className="mt-8">
          <Card className="p-5 bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Search Results for "{searchQuery}"</h2>
              <CTAButton onClick={() => setShowResults(false)} className="bg-white/10 hover:bg-white/20">Clear</CTAButton>
            </div>
            {loadingPlayers ? (
              <div className="text-[var(--fg-dim)] text-sm animate-pulse">Searching players...</div>
            ) : playerResults.length === 0 ? (
              <div className="text-[var(--fg-dim)] text-sm">No players found. Try a different search term.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {playerResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPlayerId(p.id); setShowResults(false); }}
                    className="text-left rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition"
                  >
                    <div className="font-medium text-[var(--fg)]">{p.name}</div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </section>
      )}

      <main className="grid md:grid-cols-[2fr_1fr] gap-8 mt-10">
        <section className="space-y-6">
          {selectedPlayerId && propsData ? (
            <>
              {/* Player Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">{propsData.player.name}</h2>
                  <div className="text-[var(--fg-dim)]">
                    <span style={{ color: propsData.player.teamColor }}>{propsData.player.team}</span>
                    {propsData.player.position && <span> • {propsData.player.position}</span>}
                    {propsData.player.team && <span> • {getConference(propsData.player.team)}</span>}
                  </div>
                </div>
                <CTAButton onClick={() => { setSelectedPlayerId(null); setSelectedPropId(null); }} className="bg-white/10 hover:bg-white/20">← Back</CTAButton>
              </div>

              {/* Best Edge */}
              {propsData.props.length > 0 && (() => {
                const best = propsData.props.reduce((b, p) => Math.abs(p.edgePct) > Math.abs(b.edgePct) ? p : b);
                return (
                  <Card className="p-5 bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-[var(--fg-dim)]">Best Edge • {best.book}</div>
                      <Badge color="sky">{statToShortLabel(best.stat)}</Badge>
                    </div>
                    <div className="mt-2 flex items-end gap-6">
                      <Stat label="Market" value={best.marketLine.toString()} />
                      <Stat label="Fair" value={best.fairLine.toString()} />
                      <div className="ml-auto text-right">
                        <div className="text-xs text-[var(--fg-dim)]">Edge</div>
                        <div className={`text-3xl font-semibold tabular-nums lining-nums ${best.edgePct > 0 ? 'text-[var(--mint)]' : 'text-[var(--rose)]'}`}>{best.edgePct > 0 ? '+' : ''}{best.edgePct}%</div>
                      </div>
                    </div>
                    <div className="mt-4 h-20 rounded-md bg-black/20 ring-1 ring-white/5 overflow-hidden">
                      <div className="h-full w-full animate-pulse bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    </div>
                  </Card>
                );
              })()}

              {/* Props Table */}
              <Card className="p-0 bg-white/5 border border-white/10 overflow-hidden">
                <div className="grid grid-cols-5 gap-3 px-5 py-3 text-xs text-[var(--fg-dim)]">
                  <div>Stat</div><div>Book</div><div>Market</div><div>Fair</div><div className="text-right">Edge</div>
                </div>
                <div className="divide-y divide-white/5">
                  {loadingProps ? (
                    <div className="px-5 py-8 text-center text-[var(--fg-dim)] animate-pulse">Loading props...</div>
                  ) : propsData.props.length === 0 ? (
                    <div className="px-5 py-8 text-center"><div className="text-[var(--fg-dim)] mb-2">No prop line data available yet.</div></div>
                  ) : (
                    propsData.props.map(prop => (
                      <button
                        key={prop.propId}
                        onClick={() => setSelectedPropId(prop.propId)}
                        className="grid grid-cols-5 w-full text-left items-center px-5 py-3 hover:bg-white/10 transition"
                      >
                        <div className="font-medium text-[var(--fg)]">{statToShortLabel(prop.stat)}</div>
                        <div className="text-[var(--fg-dim)]">{prop.book}</div>
                        <div className="tabular-nums">{prop.marketLine}</div>
                        <div className="tabular-nums text-[var(--fg-dim)]">{prop.fairLine}</div>
                        <div className={`text-right tabular-nums ${formatEdge(prop.edgePct).color}`}>{formatEdge(prop.edgePct).text}</div>
                      </button>
                    ))
                  )}
                </div>
              </Card>

              {/* Evidence & Highlights */}
              <Card className="p-5 bg-white/5 border border-white/10">
                <div className="flex items-center gap-4 mb-6 border-b border-white/10">
                  <div className="flex items-center gap-2 pb-3 border-b-2 border-[var(--iris)] text-[var(--iris)]"><span>📹</span><span className="font-medium">Video Evidence</span></div>
                  <div className="text-[var(--fg-dim)] pb-3"><span>▶️</span><span className="font-medium">Highlights</span></div>
                </div>
                <div className="space-y-6">
                  {propsData.props.length > 0 && (() => {
                    const best = propsData.props.reduce((b, p) => Math.abs(p.edgePct) > Math.abs(b.edgePct) ? p : b);
                    return (
                      <EvidenceRail
                        propId={best.propId}
                        playerId={selectedPlayerId || ''}
                        propType={best.stat}
                        onMomentClick={m => setSelectedMoment(m)}
                      />
                    );
                  })()}
                  <div className="border-t border-white/10 pt-6">
                    <SocialClips playerId={selectedPlayerId || ''} title="📺 YouTube Highlights" limit={4} />
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-8 text-center bg-white/5 border border-white/10">
              <div className="text-[var(--fg-dim)] mb-4">Search for a college football player above to see their prop lines vs our fair market analysis</div>
              <div className="text-sm text-[var(--fg-dim)]">• Compare market lines to fair value</div>
              <div className="text-sm text-[var(--fg-dim)]">• See edge percentages for each prop</div>
              <div className="text-sm text-[var(--fg-dim)]">• Click props to view relevant clips & analysis</div>
            </Card>
          )}
        </section>

        <aside className="space-y-6">
          <Card className="p-5 bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Video Intelligence</h3>
              <Badge color="emerald">LIVE</Badge>
            </div>
            <VideoSearchForm onSearch={searchVideos} loading={loadingClips} />
            <div className="mt-4 space-y-3">
              {selectedPlayerId && socialClips.length > 0 && (
                <>
                  <div className="text-xs text-[var(--fg-dim)] font-medium mb-2">Recent Highlights</div>
                  {socialClips.slice(0, 2).map((clip, i) => (
                    <div key={`social-${i}`} className="rounded-lg bg-black/20 ring-1 ring-white/10 p-3">
                      <div className="flex items-start gap-3">
                        <img src={clip.thumbnailUrl} alt={clip.title} className="w-20 h-12 object-cover rounded flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[var(--fg)] font-medium text-sm line-clamp-2">{clip.title}</div>
                          <div className="text-xs text-[var(--fg-dim)] mt-1">{clip.author} • {clip.duration ? `${Math.floor((clip.duration || 0) / 60)}:${String((clip.duration || 0) % 60).padStart(2, '0')}` : ''}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {clips.length > 0 && <div className="border-t border-white/5 my-3" />}
                </>
              )}
              {loadingClips ? (
                <div className="text-[var(--fg-dim)] text-sm animate-pulse">Searching videos...</div>
              ) : clips.length === 0 && socialClips.length === 0 ? (
                <div className="text-[var(--fg-dim)] text-sm">No clips yet. Try searching for player moments above.</div>
              ) : (
                clips.map((clip, i) => (
                  <ClipCard
                    key={i}
                    title={clip.title}
                    time={`${Math.floor(clip.start / 60)}:${String(Math.floor(clip.start % 60)).padStart(2, '0')}` +
                      `–${Math.floor(clip.end / 60)}:${String(Math.floor(clip.end % 60)).padStart(2, '0')}`}
                    snippet={clip.snippet || 'Video clip found'}
                  />
                ))
              )}
            </div>
          </Card>
        </aside>
      </main>

      {selectedMoment && (
        <MomentPlayer
          moment={selectedMoment}
          s3Url="https://propsage-clips.s3.amazonaws.com/cfb/sample-clip.mp4"
          onClose={() => setSelectedMoment(null)}
        />
      )}
    </AppShell>
  );
}

// CLEAN FILE END.
