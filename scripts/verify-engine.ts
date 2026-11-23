import assert from 'node:assert/strict';
import { calculateMatchScore } from '../src/lib/scoring-engine';

const teamA={name:'Team A',id:1,awayWins:4,awayDraws:5,totalWins:8,goalsScored:24,goalsConceded:9,redCards:2,penaltiesFor:2,penaltiesAgainst:1,hasKeyInjury:false};
const teamB={name:'Team B',id:2,awayWins:2,awayDraws:2,totalWins:4,goalsScored:10,goalsConceded:20,redCards:1,penaltiesFor:1,penaltiesAgainst:2,hasKeyInjury:true};
const r=calculateMatchScore(teamA,teamB,'team_a',true,2,2);
assert.equal(r.rows.length,11,'must evaluate exactly 11 rules');
assert.equal(r.finalPointsA,7.65,'Team A example sum');
assert.equal(r.finalPointsB,0.3,'Team B example sum');
assert.equal(r.rows[5].pointsA,1.2,'offensive goal rate');
assert.equal(r.rows[6].pointsA,-0.45,'defensive conceded penalty');
assert.equal(r.rows[8].pointsA,-0.2,'red card penalty');
assert.equal(r.rows[9].pointsA,0.2,'penalty for');
assert.equal(r.rows[10].pointsA,-0.1,'penalty against');
assert.equal(r.verdict,'ترجيح قوي لكفة Team A','verdict threshold');

const noH2H=calculateMatchScore({...teamA,awayWins:0,awayDraws:0,totalWins:0,goalsScored:0,goalsConceded:0,redCards:0,penaltiesFor:0,penaltiesAgainst:0},{...teamB,hasKeyInjury:false,awayWins:0,awayDraws:0,totalWins:0,goalsScored:0,goalsConceded:0,redCards:0,penaltiesFor:0,penaltiesAgainst:0},'none',true,0,0);
assert.equal(noH2H.finalPointsA,0,'zero history exact sum');
assert.equal(noH2H.finalPointsB,0,'zero history exact sum');
console.log('SCORING ENGINE: 11 rules verified');
