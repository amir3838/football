'use client';

import {useEffect,useState} from 'react';
import {RotateCcw} from 'lucide-react';

type Team={id:number;name:string;arabicName:string;logo:string};
type Analysis={teamA:any;teamB:any;finalPointsA:number;finalPointsB:number;spread:number;verdict:string;rows:any[];fixturesA:any[];fixturesB:any[];h2h:any;usage:any;apiInjuries:any;motivation:string};

function TeamSearch({label,value,setTeam}:{label:string;value:string;setTeam:(v:Team)=>void}){
  const [query,setQuery]=useState(value);
  useEffect(()=>setQuery(value),[value]);
  const [suggestions,setSuggestions]=useState<Team[]>([]);
  const [open,setOpen]=useState(false);
  const [searching,setSearching]=useState(false);
  const [searchError,setSearchError]=useState('');
  useEffect(()=>{
    if(!query||query.trim().length<2){const id=setTimeout(()=>{setSuggestions([]);setSearchError('')},0);return()=>clearTimeout(id)}
    const id=setTimeout(async()=>{setSearching(true);setSearchError('');try{const r=await fetch(`/api/teams/search?q=${encodeURIComponent(query)}`);const j=await r.json();setSuggestions(j.teams??[]);if(j.error)setSearchError(j.error)}catch{setSearchError('تعذر الاتصال بخدمة البحث')}finally{setSearching(false)}},300);
    return()=>clearTimeout(id)
  },[query]);
  return (
    <div className="team-field">
      <input dir="auto" value={query} placeholder={label}
        onChange={e=>{setQuery(e.target.value);setOpen(true)}}
        onFocus={()=>setOpen(true)} onKeyDown={e=>{if(e.key==='Escape')setOpen(false)}} />
      {open&&(searching||searchError||suggestions.length>0)&&(
        <div className="suggestions">
          {searching&&<div className="suggestion-search">جارٍ البحث الحي…</div>}
          {!searching&&searchError&&<div className="suggestion-search suggestion-error">{searchError}</div>}
          {!searching&&!searchError&&suggestions.map(s=>
            <button type="button" key={s.id} className="suggestion" onClick={()=>{setTeam(s);setQuery(s.arabicName||s.name);setOpen(false)}}>
              {s.logo&&<img src={s.logo} alt="" />}
              <span>{s.arabicName||s.name}</span>
              <span className="mono team-id">#{s.id}</span>
            </button>)}
        </div>)}
    </div>
  )
}

export default function Home(){
 const [aName,setAName]=useState('');const [bName,setBName]=useState('');const [teamA,setTeamA]=useState<Team|null>(null);const [teamB,setTeamB]=useState<Team|null>(null);const [motivation,setMotivation]=useState('auto');const [injuryA,setInjuryA]=useState<boolean|null>(null);const [injuryB,setInjuryB]=useState<boolean|null>(null);const [defenseDeduct,setDefenseDeduct]=useState(true);const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [analysis,setAnalysis]=useState<Analysis|null>(null);
 const reset=()=>{setTeamA(null);setTeamB(null);setAName('');setBName('');setMotivation('auto');setInjuryA(null);setInjuryB(null);setDefenseDeduct(true);setAnalysis(null);setError('')};
 const run=async()=>{if(!teamA||!teamB){setError('اختر الفريقين من نتائج البحث قبل تشغيل التحليل.');return}setLoading(true);setError('');try{const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({teamAId:teamA.id,teamAName:teamA.name,teamALogo:teamA.logo,teamBId:teamB.id,teamBName:teamB.name,teamBLogo:teamB.logo,motivationOverride:motivation,injuryAOverride:injuryA,injuryBOverride:injuryB,defensiveDeduction:defenseDeduct})});const j=await r.json();if(!r.ok)throw new Error(j.error||`خطأ HTTP ${r.status}`);setAnalysis(j)}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setLoading(false)}};
 const fmt=(n:number)=>`${n>0?'＋':'−'}${Math.abs(n).toFixed(2)}`;
 const motivationOptions=[['auto','اكتشاف تلقائي'],['team_a','دافع للفريق الأول'],['team_b','دافع للفريق الثاني'],['draw_ok','التعادل مرضي للطرفين'],['none','تحصيل حاصل']];
 useEffect(()=>{if(aName===''){const id=setTimeout(()=>setAName(''),0);return()=>clearTimeout(id)}},[aName]);
 useEffect(()=>{if(bName===''){const id=setTimeout(()=>setBName(''),0);return()=>clearTimeout(id)}},[bName]);
 return <main><header className="utility"><div className="brand">مرصد التحليل الكمي للمباريات</div><div className="quota"><span>الاستدعاءات الحية <b className="mono">{analysis?.usage?.live_calls??0}</b></span><span className="cached">من ذاكرة SQLite <b className="mono">{analysis?.usage?.cached_calls??0}</b></span><button className="reset" onClick={reset} title="إعادة ضبط"><RotateCcw size={16}/></button></div></header>
 <section className="context-bar"><div><div style={{fontSize:12,color:'#8E95A2',marginBottom:5}}>الفريق الأول / صاحب الأرض</div><TeamSearch label="ابحث بالعربية أو الإنجليزية" value={aName} setTeam={setTeamA}/></div><div><div style={{fontSize:12,color:'#8E95A2',marginBottom:5}}>الفريق الثاني / الضيف</div><TeamSearch label="ابحث بالعربية أو الإنجليزية" value={bName} setTeam={setTeamB}/></div><button className="run-button" onClick={run} disabled={loading}>{loading?'جارٍ جلب البيانات الحية...':'تشغيل التحليل الكمي'} </button></section>
 <section className="controls"><div className="control-block"><div className="control-title">إصابة لاعب مؤثر — التحكم اليدوي</div><div className="toggle-row"><button className={`chip ${injuryA===true?'active':''}`} onClick={()=>setInjuryA(injuryA===true?null:true)}>الفريق الأول: {injuryA===true?'نشط':'تلقائي'}</button><button className={`chip ${injuryB===true?'active':''}`} onClick={()=>setInjuryB(injuryB===true?null:true)}>الفريق الثاني: {injuryB===true?'نشط':'تلقائي'}</button></div></div><div className="control-block"><div className="control-title">دافع الفوز</div><div className="toggle-row">{motivationOptions.map(([v,l])=><button key={v} className={`chip ${motivation===v?'active':''}`} onClick={()=>setMotivation(v)}>{l}</button>)}</div></div></section>
 <section className="controls"><div className="control-block"><div className="control-title">احتساب الأهداف المستقبلة كخصم (المنطقي) / كإضافة</div><button className={`chip ${defenseDeduct?'active':''}`} onClick={()=>setDefenseDeduct(!defenseDeduct)}>{defenseDeduct?'خصم - مفعل':'إضافة + مفعل'}</button></div></section>
 {error&&<div className="error">{error}</div>}
 {analysis&&<><section className="scoreboard">
   <div className="team-score"><div className="score-label">الفريق الأول / صاحب الأرض</div><div className="team-name">{teamA?.arabicName||teamA?.name}</div><div className={`score mono ${analysis.spread>0?'winner':''}`}>{analysis.finalPointsA.toFixed(2)}</div>
     <details className="point-breakdown"><summary>تفصيل مجموع النقاط — 11 قاعدة</summary><div>{analysis.rows.map((r:any)=><div className="point-line" key={r.rule}><span>{String(r.rule).padStart(2,'0')} — {r.name}</span><b className={`mono ${r.pointsA>0?'positive':r.pointsA<0?'negative':'zero'}`}>{fmt(r.pointsA)}</b></div>)}</div></details>{analysis.spread>0&&<div className="goldbar"/>}</div>
   <div className="team-score"><div className="score-label">الفريق الثاني / الضيف</div><div className="team-name">{teamB?.arabicName||teamB?.name}</div><div className={`score mono ${analysis.spread<0?'winner':''}`}>{analysis.finalPointsB.toFixed(2)}</div>
     <details className="point-breakdown"><summary>تفصيل مجموع النقاط — 11 قاعدة</summary><div>{analysis.rows.map((r:any)=><div className="point-line" key={r.rule}><span>{String(r.rule).padStart(2,'0')} — {r.name}</span><b className={`mono ${r.pointsB>0?'positive':r.pointsB<0?'negative':'zero'}`}>{fmt(r.pointsB)}</b></div>)}</div></details>{analysis.spread<0&&<div className="goldbar"/>}</div>
   <div className="verdict"><span className="mono">الفارق: {analysis.spread>0?'＋':'−'}{Math.abs(analysis.spread).toFixed(2)} نقطة</span> — {analysis.verdict}</div>
 </section>
 <section className="ledger"><div className="section-title"><h2>سجل التدقيق الكامل — 11 قاعدة</h2><span className="mono" style={{color:'#8E95A2',fontSize:12}}>H2H: {analysis.h2h?.teamAWins} — {analysis.h2h?.teamBWins}</span></div><div className="table-wrap"><table><thead><tr><th>المعيار</th><th>بيانات الفريق الأول</th><th>نقاط الفريق الأول</th><th>نقاط الفريق الثاني</th><th>بيانات الفريق الثاني</th></tr></thead><tbody>{analysis.rows.map((r:any)=><tr key={r.rule}><td><span className="mono" style={{color:'#8E95A2',marginInlineEnd:8}}>{String(r.rule).padStart(2,'0')}</span>{r.name}</td><td>{r.dataA}</td><td className={`mono delta ${r.pointsA>0?'positive':r.pointsA<0?'negative':'zero'}`}>{fmt(r.pointsA)}</td><td className={`mono delta ${r.pointsB>0?'positive':r.pointsB<0?'negative':'zero'}`}>{fmt(r.pointsB)}</td><td>{r.dataB}</td></tr>)}</tbody></table></div></section>
 <section className="form-grid"><div className="form-team"><div className="section-title"><h2>{teamA?.arabicName||teamA?.name} — آخر 10 مباريات</h2></div><div className="ticker">{analysis.fixturesA.map((f:any)=><div className="fixture" key={f.fixtureId}><div className={`mono result-${f.result}`}>{f.goalsFor}-{f.goalsAgainst} <span className="badge">{f.isAway?'A':'H'}</span></div><div className="fixture-name">{f.opponentName}</div></div>)}</div></div><div className="form-team"><div className="section-title"><h2>{teamB?.arabicName||teamB?.name} — آخر 10 مباريات</h2></div><div className="ticker">{analysis.fixturesB.map((f:any)=><div className="fixture" key={f.fixtureId}><div className={`mono result-${f.result}`}>{f.goalsFor}-{f.goalsAgainst} <span className="badge">{f.isAway?'A':'H'}</span></div><div className="fixture-name">{f.opponentName}</div></div>)}</div></div></section></>}
 </main>
}
