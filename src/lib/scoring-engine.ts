export type MatchTeamStats = {
  name:string; id:number; logo?:string;
  awayWins:number; awayDraws:number; totalWins:number;
  goalsScored:number; goalsConceded:number; redCards:number;
  penaltiesFor:number; penaltiesAgainst:number; hasKeyInjury:boolean;
};
export type MotivationState = 'team_a'|'team_b'|'draw_ok'|'none';
export type AuditRow = { rule:number; name:string; dataA:string; dataB:string; pointsA:number; pointsB:number; formula:string };

export function calculateMatchScore(a:MatchTeamStats,b:MatchTeamStats,motivation:MotivationState='none',defensiveAsDeduction=true,h2hWinsA=0,h2hWinsB=0) {
  const rows:AuditRow[]=[];
  const add=(rule:number,name:string,dataA:string,dataB:string,pointsA:number,pointsB:number,formula:string)=>rows.push({rule,name,dataA,dataB,pointsA,pointsB,formula});

  const r1a=a.awayWins>3?1:0, r1b=b.awayWins>3?1:0;
  add(1,'فوز خارج الأرض بعتبة تفوقية',`${a.awayWins} انتصارات خارج الأرض`,`${b.awayWins} انتصارات خارج الأرض`,r1a,r1b,'> 3 ← +1.00');
  const r2a=a.awayDraws>4?1:0,r2b=b.awayDraws>4?1:0;
  add(2,'تعادلات خارج الأرض',`${a.awayDraws} تعادلات خارج الأرض`,`${b.awayDraws} تعادلات خارج الأرض`,r2a,r2b,'> 4 ← +1.00');
  const r3a=a.totalWins>7?2:0,r3b=b.totalWins>7?2:0;
  add(3,'هيمنة الانتصارات الكلية',`${a.totalWins} انتصارات`,`${b.totalWins} انتصارات`,r3a,r3b,'> 7 ← +2.00');
  const r4a=b.hasKeyInjury?1:0,r4b=a.hasKeyInjury?1:0;
  add(4,'غياب لاعب مؤثر في الخصم',b.hasKeyInjury?'خصمك يفتقد لاعباً مؤثراً':'لا غياب مؤثر مؤكد',a.hasKeyInjury?'خصمك يفتقد لاعباً مؤثراً':'لا غياب مؤثر مؤكد',r4a,r4b,'خصم مؤثر ← +1.00');
  let r5a=0,r5b=0;
  if(h2hWinsA+h2hWinsB>0){
    if(h2hWinsA>h2hWinsB){r5a=1}else if(h2hWinsB>h2hWinsA){r5b=1}else{r5a=1;r5b=1}
  }
  add(5,'سجل المواجهات المباشرة (آخر 5)',`${h2hWinsA} انتصارات`,`${h2hWinsB} انتصارات`,r5a,r5b,'الأكثر يفوز +1؛ التعادل العددي +1 للطرفين');
  const r6a=(a.goalsScored/10)/2,r6b=(b.goalsScored/10)/2;
  add(6,'معدل التهديف الهجومي',`${a.goalsScored} هدفًا في 10 مباريات`,`${b.goalsScored} هدفًا في 10 مباريات`,r6a,r6b,'(الأهداف ÷ 10) ÷ 2');
  const r7a=defensiveAsDeduction?-(a.goalsConceded/10)/2:(a.goalsConceded/10)/2;
  const r7b=defensiveAsDeduction?-(b.goalsConceded/10)/2:(b.goalsConceded/10)/2;
  add(7,'معدل الأهداف المستقبلة',`${a.goalsConceded} هدفًا مستقبلاً`,`${b.goalsConceded} هدفًا مستقبلاً`,r7a,r7b,defensiveAsDeduction?'-(المستقبل ÷ 10) ÷ 2':'+(المستقبل ÷ 10) ÷ 2');
  const r8a=motivation==='team_a'||motivation==='draw_ok'?1:0,r8b=motivation==='team_b'||motivation==='draw_ok'?1:0;
  add(8,'دافع الفوز وحصة المباراة',motivation==='team_a'?'دافع حاسم':motivation==='draw_ok'?'التعادل مرضي':'لا دافع حاسم',motivation==='team_b'?'دافع حاسم':motivation==='draw_ok'?'التعادل مرضي':'لا دافع حاسم',r8a,r8b,'حالة الدافع ← 0 / 1');
  const r9a=-(a.redCards/10),r9b=-(b.redCards/10);
  add(9,'البطاقات الحمراء',`${a.redCards} بطاقة حمراء`,`${b.redCards} بطاقة حمراء`,r9a,r9b,'-(البطاقات ÷ 10)');
  const r10a=a.penaltiesFor/10,r10b=b.penaltiesFor/10;
  add(10,'ركلات الجزاء المسجلة لصالحه',`${a.penaltiesFor} ركلة`,`${b.penaltiesFor} ركلة`,r10a,r10b,'+(الركلات ÷ 10)');
  const r11a=-(a.penaltiesAgainst/10),r11b=-(b.penaltiesAgainst/10);
  add(11,'ركلات الجزاء المحتسبة عليه',`${a.penaltiesAgainst} ركلة`,`${b.penaltiesAgainst} ركلة`,r11a,r11b,'-(الركلات ÷ 10)');

  const sum=(fn:(r:AuditRow)=>number)=>rows.reduce((acc,r)=>acc+fn(r),0);
  const rawA=sum(r=>r.pointsA),rawB=sum(r=>r.pointsB);
  const finalPointsA=Number(rawA.toFixed(2)),finalPointsB=Number(rawB.toFixed(2));
  const spread=Number((finalPointsA-finalPointsB).toFixed(2));
  const absolute=Math.abs(spread);
  let verdict:string;
  if(absolute>=1.5){ verdict=`ترجيح قوي لكفة ${spread>0?a.name:b.name}` }
  else if(absolute>=0.25){ verdict=`أفضلية نسبية لـ ${spread>0?a.name:b.name}` }
  else{ verdict='مباراة متكافئة رقمياً' }
  return {finalPointsA,finalPointsB,spread,verdict,rows};
}
