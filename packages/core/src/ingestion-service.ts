// Ingestion Service for Odds/Props and Play-by-Play data
// Handles polling SportsDataIO and storing canonicalized data
import { 
  PropLine, 
  PbP, 
  StatProgress, 
  EvidenceLink,
  normalizeMarketName,
  normalizeBookName,
  normalizePlayerId,
  normalizeGameId,
  MarketKey 
} from './canonical-model';
import { applyPlay } from './interval-join';

export class PropPlayIngestionService {
  private propLines = new Map<string, PropLine[]>(); // key: gameId:playerId:marketKey:book
  private statProgress = new Map<string, StatProgress>(); // key: gameId:playerId:marketKey
  private evidenceLinks: EvidenceLink[] = [];
  
  constructor(
    private sportsDataIOKey: string,
    private onImpact?: (play: PbP, delta: any, line: PropLine) => void
  ) {}

  // Ingest prop lines from SportsDataIO
  async ingestPropLines(gameId: number): Promise<void> {
    try {
      // Fetch props from SportsDataIO
      const url = `https://api.sportsdata.io/v3/nfl/odds/json/PlayerPropsByGameID/${gameId}?key=${this.sportsDataIOKey}`;
      const response = await fetch(url);
      const props = await response.json();

      const timestamp = new Date().toISOString();
      
      for (const prop of props) {
        const playerId = normalizePlayerId(prop.PlayerID || prop.GlobalPlayerID || '');
        const marketKey = normalizeMarketName(prop.BetName || prop.Market);
        const book = normalizeBookName(prop.Sportsbook || prop.SportsbookName || '');
        
        if (!marketKey || !playerId || !book) continue;

        const propLine: PropLine = {
          id: `${gameId}:${playerId}:${marketKey}:${book}:${timestamp}`,
          gameId: normalizeGameId(gameId),
          playerId,
          marketKey,
          book,
          line: Number(prop.Value || prop.Line || 0),
          overPrice: prop.OverPayout || prop.OverPrice,
          underPrice: prop.UnderPayout || prop.UnderPrice,
          snapshotAt: timestamp
        };

        const key = `${gameId}:${playerId}:${marketKey}:${book}`;
        if (!this.propLines.has(key)) {
          this.propLines.set(key, []);
        }
        this.propLines.get(key)!.push(propLine);
        
        // Sort by snapshotAt for interval join
        this.propLines.get(key)!.sort((a, b) => 
          new Date(a.snapshotAt).getTime() - new Date(b.snapshotAt).getTime()
        );
      }
      
      console.log(`📊 Ingested ${props.length} prop lines for game ${gameId}`);
    } catch (error) {
      console.error('Error ingesting prop lines:', error);
    }
  }

  // Ingest play-by-play events
  async ingestPBPEvents(gameId: number): Promise<void> {
    try {
      // Fetch PBP from SportsDataIO (using a mock structure - adjust based on actual API)
      const url = `https://api.sportsdata.io/v3/nfl/pbp/json/PlayByPlay/${gameId}?key=${this.sportsDataIOKey}`;
      const response = await fetch(url);
      const data = await response.json();

      // Process each play
      const plays = data.Plays || data.plays || [];
      for (let i = 0; i < plays.length; i++) {
        const rawPlay = plays[i];
        
        const play: PbP = {
          id: `${gameId}:${i}`,
          gameId: normalizeGameId(gameId),
          clock: rawPlay.TimeRemainingMinutes + ':' + rawPlay.TimeRemainingSeconds || `${rawPlay.Quarter || 1} ${rawPlay.Clock || '15:00'}`,
          realTimeUtc: rawPlay.Created || rawPlay.Updated || new Date().toISOString(),
          eventType: this.normalizeEventType(rawPlay.PlayType || rawPlay.Type || ''),
          offenseId: normalizePlayerId(rawPlay.OffensiveTeam || ''),
          defenseId: normalizePlayerId(rawPlay.DefensiveTeam || ''),
          yards: Number(rawPlay.Yards || 0),
          passerId: rawPlay.PasserId ? normalizePlayerId(rawPlay.PasserId) : undefined,
          rusherId: rawPlay.RusherId ? normalizePlayerId(rawPlay.RusherId) : undefined,
          receiverId: rawPlay.ReceiverId ? normalizePlayerId(rawPlay.ReceiverId) : undefined,
          raw: rawPlay
        };

        // Apply the play using interval join logic
        applyPlay(play, this.statProgress, this.propLines, this.recordImpact.bind(this));
      }
      
      console.log(`🏈 Processed ${plays.length} plays for game ${gameId}`);
    } catch (error) {
      console.error('Error ingesting PBP events:', error);
    }
  }

  // Record impact when a play moves a prop
  private recordImpact(play: PbP, delta: any, line: PropLine): void {
    console.log(`📈 Impact: ${delta.playerId} ${delta.market} ${delta.delta > 0 ? '+' : ''}${delta.delta} (line: ${line.line})`);
    
    // Create evidence link if we have video evidence
    const evidenceLink: EvidenceLink = {
      id: `${play.id}:${delta.playerId}:${delta.market}`,
      pbpId: play.id,
      playerId: delta.playerId,
      marketKey: delta.market,
      clipUrl: this.findVideoEvidence(play, delta),
      note: `Play moved ${delta.market} by ${delta.delta}`
    };
    
    this.evidenceLinks.push(evidenceLink);
    
    // Call external impact handler if provided
    if (this.onImpact) {
      this.onImpact(play, delta, line);
    }
  }

  // Find video evidence for a play (integrate with existing evidence service)
  private findVideoEvidence(play: PbP, delta: any): string | undefined {
    // This would integrate with your existing evidence services
    // For now, return a placeholder
    return `https://example.com/clip/${play.gameId}/${play.id}`;
  }

  // Normalize event types from vendor data
  private normalizeEventType(eventType: string): string {
    const typeMap: Record<string, string> = {
      'Pass': 'pass_complete',
      'Incomplete Pass': 'pass_incomplete',
      'Rush': 'rush',
      'Passing Touchdown': 'pass_touchdown',
      'Rushing Touchdown': 'rush_touchdown',
      'Sack': 'sack',
      'Penalty': 'penalty'
    };
    return typeMap[eventType] || eventType.toLowerCase();
  }

  // Get current stat progress for a player/market
  getStatProgress(gameId: number, playerId: string, marketKey: MarketKey): StatProgress | undefined {
    return this.statProgress.get(`${gameId}:${playerId}:${marketKey}`);
  }

  // Get evidence links for a player/market
  getEvidenceLinks(playerId: string, marketKey: MarketKey): EvidenceLink[] {
    return this.evidenceLinks.filter(link => 
      link.playerId === playerId && link.marketKey === marketKey
    );
  }

  // Get current line for a player/market/book
  getCurrentLine(gameId: number, playerId: string, marketKey: MarketKey, book: string): PropLine | undefined {
    const key = `${gameId}:${playerId}:${marketKey}:${book}`;
    const lines = this.propLines.get(key);
    return lines && lines.length > 0 ? lines[lines.length - 1] : undefined;
  }
}