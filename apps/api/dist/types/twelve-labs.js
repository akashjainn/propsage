// Query building utilities
export const PROP_INTENT_LIBRARY = {
    PASS_YDS: {
        propType: 'PASS_YDS',
        queries: [
            'quarterback {player} throws deep completion',
            '{player} intermediate passing plays',
            'QB {player} throwing under pressure',
            '{player} red zone passes'
        ],
        label: 'Passing Moments',
        description: 'Deep completions, intermediate routes, pressure situations',
        chipColor: '#3B82F6'
    },
    PASS_TDS: {
        propType: 'PASS_TDS',
        queries: [
            '{player} touchdown pass',
            'QB {player} red zone touchdown',
            '{player} passing touchdown in end zone',
            '{player} scoring throws'
        ],
        label: 'TD Passes',
        description: 'Red zone efficiency, touchdown throws',
        chipColor: '#10B981'
    },
    RUSH_YDS: {
        propType: 'RUSH_YDS',
        queries: [
            '{player} running outside zone rush',
            '{player} inside zone carry with broken tackle',
            'running back {player} explosive run',
            '{player} rushing between tackles'
        ],
        label: 'Rushing Plays',
        description: 'Zone schemes, broken tackles, explosive runs',
        chipColor: '#F59E0B'
    },
    RUSH_TDS: {
        propType: 'RUSH_TDS',
        queries: [
            '{player} rushing touchdown',
            'running back {player} goal line touchdown',
            '{player} red zone rushing score',
            '{player} short yardage touchdown run'
        ],
        label: 'Rushing TDs',
        description: 'Goal line carries, red zone success',
        chipColor: '#EF4444'
    },
    REC_YDS: {
        propType: 'REC_YDS',
        queries: [
            'receiver {player} seam route with YAC',
            '{player} slant route with yards after catch',
            'wide receiver {player} crossing route',
            '{player} deep reception downfield'
        ],
        label: 'Receiving',
        description: 'Route running, YAC ability, deep targets',
        chipColor: '#8B5CF6'
    },
    REC_TDS: {
        propType: 'REC_TDS',
        queries: [
            '{player} receiving touchdown',
            'receiver {player} end zone catch',
            '{player} touchdown reception',
            '{player} red zone receiving score'
        ],
        label: 'Receiving TDs',
        description: 'End zone targets, red zone usage',
        chipColor: '#F97316'
    },
    RECEPTIONS: {
        propType: 'RECEPTIONS',
        queries: [
            '{player} catching passes underneath',
            'receiver {player} short route completions',
            '{player} check down receptions',
            '{player} volume catching'
        ],
        label: 'Receptions',
        description: 'Target share, underneath routes, volume',
        chipColor: '#06B6D4'
    },
    INTERCEPTIONS: {
        propType: 'INTERCEPTIONS',
        queries: [
            'quarterback {player} throws interception',
            '{player} intercepted pass under pressure',
            'QB {player} turnover throwing',
            '{player} picked off by defense'
        ],
        label: 'Turnovers',
        description: 'Pressure situations, risky throws',
        chipColor: '#DC2626'
    },
    SACKS: {
        propType: 'SACKS',
        queries: [
            'quarterback {player} gets sacked',
            '{player} pressured behind offensive line',
            'QB {player} hit while throwing',
            '{player} hurried in pocket'
        ],
        label: 'Pressure',
        description: 'Pass protection, pocket presence',
        chipColor: '#7C2D12'
    }
};
// Helper functions
export function buildMomentQuery(intent, playerName) {
    return intent.queries.map(query => query.replace('{player}', playerName));
}
export function calculateConfidence(score) {
    if (score >= 0.8)
        return 'high';
    if (score >= 0.6)
        return 'medium';
    return 'low';
}
export function formatMomentDuration(startTime, endTime) {
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    return `${formatTime(startTime)} → ${formatTime(endTime)}`;
}
