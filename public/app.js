const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=new Intl.NumberFormat('ko-KR');
const num=n=>n==null?'—':nf.format(n);
const rate=n=>n==null?'—':Number(n).toFixed(2);
const time=(s,full=false)=>s?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,...(full?{year:'numeric'}:{})}).format(new Date(s)):'원문 일시 미표기';
const hour=s=>s?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(s)):'—';
const categories={engineering:'공학',mixed:'자유·융합',humanities:'인문·사회',health:'의약·보건',other:'기타',unknown:'분류 확인 중',natural:'자연과학'};
const rank={engineering:0,mixed:1,humanities:2,health:3,other:4,unknown:5,natural:9};
let favorites;
try{favorites=new Set(JSON.parse(localStorage.getItem('essay-favorites')||'[]'));}catch{favorites=new Set();}
const state={data:null,catalog:{},historical:{},runtime:{mode:'github'},school:null,query:'',category:'all',sort:'priority',favoritesOnly:false,historyYear:2026,historyCache:new Map()};
let loading=false,detailGeneration=0;
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3000);}
async function json(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error(`자료를 읽지 못했습니다 (${r.status}).`);return r.json();}
function category(r){return state.catalog.units?.[r.id]?.category||'unknown';}
function allRows(){return state.data.schools.flatMap(s=>(s.snapshot?.rows||[]).map(r=>({...r,school:s,category:category(r)})));}
function visibleRows(){return allRows().filter(r=>r.category!=='natural'&&(!state.school||r.school.id===state.school)&&(!state.favoritesOnly||favorites.has(r.id))&&(state.category==='all'||r.category===state.category)&&state.query.toLowerCase().split(/\s+/).every(q=>(r.name+' '+r.school.name+' '+r.campus).toLowerCase().includes(q))).sort((a,b)=>{
  if(state.sort==='priority')return rank[a.category]-rank[b.category]||a.ratio-b.ratio||a.name.localeCompare(b.name,'ko');
  if(state.sort==='high')return b.ratio-a.ratio;
  if(state.sort==='seats')return b.seats-a.seats;
  return a.ratio-b.ratio;
});}
function sums(rows){const t=rows.reduce((a,r)=>({seats:a.seats+r.seats,applicants:a.applicants+r.applicants}),{seats:0,applicants:0});return {...t,ratio:t.seats?t.applicants/t.seats:null};}
function status(s){
  if(s.outcome==='error')return {label:'원문 확인 실패',warning:true};
  if(s.outcome==='review')return {label:'원문 변경 검토 필요',warning:true};
  if(!s.snapshot)return {label:'자료 대기',warning:true};
  if(s.snapshot.isFinal)return {label:'최종 발표',warning:false};
  if(Date.now()>Date.parse(s.cutoffAt))return {label:'최종 발표 대기',warning:false};
  if(Date.now()-Date.parse(s.lastCheckedAt)>25*60_000)return {label:'수집 확인 지연',warning:true};
  if(s.outcome==='older')return {label:'이전 응답 · 기존 자료 유지',warning:true};
  return {label:'접수 중',warning:false};
}
function sourceLink(url,label='공식 원문 ↗'){return /^https?:\/\//.test(url||'')?`<a class="source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`:'';}
function schoolCards(){return `<div class="school-cards">${state.data.schools.map(s=>{const t=s.snapshot?.total,st=status(s);return `<a href="#school/${s.id}" class="school-card" style="--school:${s.color}"><div class="card-name"><i class="school-dot"></i>${s.shortName}</div><div class="card-number">${rate(t?.ratio)}<small>: 1</small></div><div class="card-caption">논술 전체 · 모집 ${num(t?.seats)}명</div><div class="card-time ${st.warning?'warning':''}"><i></i>${time(s.snapshot?.sourceAt)} 기준 · ${st.label}</div></a>`;}).join('')}</div>`;}
function filterControls(){return `<div class="table-toolbar"><label class="search"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="대학 또는 모집단위 검색" aria-label="대학 또는 모집단위 검색" value="${esc(state.query)}"></label><select id="category" aria-label="계열 필터"><option value="all">전체 계열 · 자연과학 제외</option>${['engineering','mixed','humanities','health','other','unknown'].map(c=>`<option value="${c}" ${state.category===c?'selected':''}>${categories[c]}</option>`).join('')}</select><select id="sort" aria-label="정렬"><option value="priority">공학 우선 · 낮은 경쟁률</option><option value="low" ${state.sort==='low'?'selected':''}>낮은 경쟁률순</option><option value="high" ${state.sort==='high'?'selected':''}>높은 경쟁률순</option><option value="seats" ${state.sort==='seats'?'selected':''}>많은 모집인원순</option></select><label class="favorite-filter"><input type="checkbox" id="favorites-only" ${state.favoritesOnly?'checked':''}> 관심 모집단위</label></div>`;}
function delta(r){const before=r.school.previousApplicants?.[r.id];if(before==null)return '—';const d=r.applicants-before;return `${d>0?'+':''}${num(d)}`;}
function currentTable(rows){return `<div class="table-wrap"><table><thead><tr><th aria-label="관심"></th><th>대학</th><th>모집단위</th><th>계열</th><th class="number">모집인원</th><th class="number">지원인원</th><th class="number" title="직전 저장 현황 대비 지원인원 변화">직전 대비</th><th class="number">경쟁률</th><th>자료 기준</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td><button class="star ${favorites.has(r.id)?'on':''}" data-star="${r.id}" aria-label="${esc(r.name)} 관심 ${favorites.has(r.id)?'해제':'등록'}" aria-pressed="${favorites.has(r.id)}">${favorites.has(r.id)?'★':'☆'}</button></td><td style="white-space:nowrap"><a href="#school/${r.school.id}">${r.school.shortName}</a></td><td class="unit-cell"><button class="unit-link" data-detail="${r.id}">${esc(r.name)}</button><small>${esc(r.campus||r.school.track)}</small></td><td><span class="tag ${r.category}">${categories[r.category]}</span></td><td class="number">${num(r.seats)}</td><td class="number">${num(r.applicants)}</td><td class="number delta" title="${time(r.school.previousSourceAt,true)} 대비">${delta(r)}</td><td class="number"><span class="ratio-value">${rate(r.ratio)}<small>: 1</small></span></td><td style="white-space:nowrap">${time(r.school.snapshot.sourceAt)}</td><td><button class="unit-link" data-detail="${r.id}" aria-label="${esc(r.name)} 상세보기">↗</button></td></tr>`).join('')}</tbody></table>${rows.length?'':`<div class="empty">조건에 맞는 모집단위가 없습니다.<br>검색어나 계열 필터를 변경해 주세요.</div>`}</div>`;}
function summary(rows){const totals=sums(rows),series=state.data.schools.map(s=>({...s,...sums(rows.filter(r=>r.school.id===s.id))})).filter(s=>s.seats);const max=Math.max(1,...series.map(s=>s.ratio));return `<section class="panel"><div class="panel-head"><div><h2>한눈에 보는 경쟁률</h2><p>현재 필터에 포함된 논술 모집단위 기준</p></div><span class="pill green">자연과학 제외</span></div><div class="summary-layout"><div class="bar-chart" role="img" aria-label="학교별 경쟁률 비교">${series.map(s=>`<div class="bar-row"><span>${s.shortName}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(0,s.ratio/max*100)}%;background:${s.color}"></div></div><span class="bar-value">${rate(s.ratio)} <small>: 1</small></span></div>`).join('')||'<div class="empty">표시할 자료가 없습니다.</div>'}<p class="chart-note">지원인원 합계 ÷ 모집인원 합계 · 대학별 자료 기준 시각은 다를 수 있습니다.</p></div><div class="summary-stats"><div class="summary-stat">비교 중인 모집단위<strong>${num(rows.length)}<small>개</small></strong></div><div class="summary-stat">모집인원 합계<strong>${num(totals.seats)}<small>명</small></strong></div><div class="summary-stat">지원인원 합계<strong>${num(totals.applicants)}<small>명</small></strong></div><div class="summary-tip">지금의 경쟁률은 접수 중 현황입니다.<br>모집단위를 선택하면 과거 최종 경쟁률도 함께 볼 수 있습니다.</div></div></div></section>`;}
function examInfo(s){const policy=state.catalog.schools?.[s.id]?.minimum;return `<div class="info-card"><h2>수능최저학력기준</h2><p>${esc(policy?.text||'2027학년도 공식 모집요강의 세부 조건 확인 중입니다.')}</p>${policy?.exceptions?.map(e=>`<p><strong>${esc(e.label)}</strong> · ${esc(e.text)}</p>`).join('')||''}${sourceLink(policy?.sourceUrl||s.resultsUrl,policy?.sourceUrl?'2027 공식 자료 ↗':'입학처 자료 ↗')}</div>`;}
function historyTable(s){const data=state.historical.schools?.[s.id]?.[state.historyYear];const rows=data?.rows||[];return `<section class="panel"><div class="panel-head history-head"><div><h2>지난 입시결과</h2><p>해당 학년도에 실제 모집한 논술 모집단위 · 이름이 바뀐 모집단위는 별도로 확인하세요.</p></div><div class="history-tabs">${[2026,2025,2024].map(y=>`<button data-year="${y}" class="${state.historyYear===y?'active':''}" aria-pressed="${state.historyYear===y}">${y}</button>`).join('')}</div></div>${rows.length?`<div class="table-wrap"><table><thead><tr><th>당시 모집단위</th><th class="number">모집인원</th><th class="number">지원인원</th><th class="number">최종 경쟁률</th><th>충원 관련 공개값</th></tr></thead><tbody>${rows.filter(r=>r.category!=='natural').sort((a,b)=>(rank[a.category]??5)-(rank[b.category]??5)||a.ratio-b.ratio).map(r=>`<tr><td><span class="history-label">${esc(r.name)}</span></td><td class="number">${num(r.seats)}</td><td class="number">${num(r.applicants)}</td><td class="number"><b>${rate(r.ratio)} : 1</b></td><td>${admissionValue(r)}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty">${state.historyYear}학년도 논술 자료 ${esc(data?.status||'확인 중')}<br>확인되지 않은 수치를 추정해서 표시하지 않습니다.</div>`}<div class="table-bottom"><span>${esc(data?.note||'충원합격 인원과 최종 예비번호는 서로 다른 항목입니다.')}</span><span>${sourceLink(data?.sourceUrl||s.resultsUrl,'입시결과 원문 ↗')} ${sourceLink(data?.reserveSourceUrl,'충원·예비 원문 ↗')}</span></div></section>`;}
function admissionValue(r){if(r.reserveRank!=null)return `예비 ${num(r.reserveRank)}번`;if(r.additionalAdmissions!=null)return `충원 ${num(r.additionalAdmissions)}명`;if(r.admissionText)return esc(r.admissionText);return '<span class="muted">공개값 없음</span>';}
function render(){
  if(!state.data)return;
  const s=state.data.schools.find(s=>s.id===state.school),rows=visibleRows();
  $('#breadcrumb-current').textContent=s?s.shortName:'전체 비교';
  $('.nav-main').classList.toggle('active',!s);
  $('#school-nav').innerHTML=state.data.schools.map(s=>`<a href="#school/${s.id}" class="school-nav ${state.school===s.id?'active':''}" style="--school:${s.color}"><i class="school-dot"></i>${s.shortName}<span>↗</span></a>`).join('');
  const failed=state.data.schools.filter(s=>status(s).warning);
  const head=`<div class="page-head"><div><div class="eyebrow">2027 ADMISSIONS ${s?'DETAIL':'OVERVIEW'}</div><h1>${s?s.name:'논술 경쟁률 비교'}</h1><p>${s?esc(s.track)+' · 모집단위별 현황과 지난 입시결과':'공학계열을 먼저, 지원할 모집단위를 한눈에.'}</p></div><div class="date-label"><b>${time(state.data.generatedAt,true)}</b>마지막 전체 확인 · 한국 표준시</div></div>`;
  let intro='';
  if(s){const t=s.snapshot?.total,st=status(s);intro=`<div class="stats-row"><div class="stats-box"><p>논술 전체 경쟁률</p><strong>${rate(t?.ratio)}<small>: 1</small></strong></div><div class="stats-box"><p>논술 전체 모집인원</p><strong>${num(t?.seats)}<small>명</small></strong></div><div class="stats-box"><p>논술 전체 지원인원</p><strong>${num(t?.applicants)}<small>명</small></strong></div></div><div class="info-grid">${examInfo(s)}<div class="info-card"><h2>발표 및 수집 현황 <span class="pill ${st.warning?'orange':'green'}">${st.label}</span></h2><p>자료 기준 <strong>${time(s.snapshot?.sourceAt,true)}</strong><br>마지막 확인 ${time(s.lastCheckedAt,true)}<br>9월 11일 경쟁률 공개 ${s.cutoff}까지 · 접수 마감 ${s.close}</p>${s.error?`<p>${esc(s.error)} · 기존 확인 자료를 유지합니다.</p>`:''}${s.outcome==='review'?'<p>같은 기준 시각 또는 발표 시각이 없는 원문 변경을 감지했습니다. 최신 여부를 확인할 수 없어 기존 수치를 유지합니다.</p>':''}${sourceLink(s.url)}</div></div>`;}
  else intro=schoolCards()+`<div class="notice"><span class="notice-icon">i</span><span><strong>발표 시각까지 함께 확인하세요.</strong> 카드에는 논술 전체 경쟁률을, 아래 표와 그래프에는 자연과학을 제외한 현황을 표시합니다.${failed.length?` <strong>${failed.map(s=>s.shortName).join('·')} 확인 지연 또는 오류</strong> · 마지막 정상 자료를 유지합니다.`:''}</span></div>`;
  $('#app').innerHTML=head+intro+`<div id="summary">${summary(rows)}</div><section class="panel"><div class="panel-head"><div class="table-heading"><h2>모집단위 비교</h2><span class="count" id="row-count">${rows.length}</span></div><span class="pill">☆ 관심 모집단위 저장</span></div>${filterControls()}<div id="current-table">${currentTable(rows)}</div><div class="table-bottom"><span>모집단위를 눌러 시간별 추이 · 과거 경쟁률 · 충원 정보를 확인하세요.</span><span>출처: 진학어플라이 · 유웨이</span></div></section>`+(s?`<div id="school-history">${historyTable(s)}</div>`:'');
  document.title=`${s?s.shortName+' · ':''}논술 나침반 · 2027`;
}
function renderFiltered(){const rows=visibleRows();$('#summary').innerHTML=summary(rows);$('#row-count').textContent=rows.length;$('#current-table').innerHTML=currentTable(rows);}
function lookupHistorical(r,year){const data=state.historical.schools?.[r.school.id]?.[year];if(!data)return null;const mapping=state.catalog.units?.[r.id]?.historicalNames?.[year];const name=mapping||r.name;return data.rows?.find(h=>h.name.replace(/\s/g,'')===name.replace(/\s/g,'')&&(!h.campus||h.campus===r.campus))||null;}
function lineChart(points,{years=false}={}){
  if(!points.length)return '<div class="empty">아직 확인된 데이터가 없습니다.</div>';
  const w=630,h=200,l=42,rr=35,t=23,b=37,values=points.filter(p=>p.value!=null);if(!values.length)return '<div class="empty">비교 가능한 자료가 없습니다.</div>';
  const max=Math.max(1,...values.map(p=>p.value))*1.15;const positions=points.map((p,i)=>years?i:Date.parse(p.at));const minX=Math.min(...positions),maxX=Math.max(...positions);
  const x=i=>maxX===minX?w/2:l+(positions[i]-minX)/(maxX-minX)*(w-l-rr),y=v=>h-b-v/max*(h-t-b);
  let paths=[],segment=[];
  for(let i=0;i<points.length;i++){const p=points[i];if(p.value==null||(i>0&&!years&&positions[i]-positions[i-1]>25*60_000)){if(segment.length)paths.push(segment.join(' '));segment=[];}if(p.value!=null)segment.push(`${segment.length?'L':'M'}${x(i)},${y(p.value)}`);}
  if(segment.length)paths.push(segment.join(' '));
  return `<svg class="line-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${years?'학년도별 최종':'시간별'} 경쟁률 그래프"><title>${points.map(p=>`${p.label}: ${p.value==null?'자료 없음':rate(p.value)}`).join(', ')}</title>${[0,.5,1].map(f=>`<line class="grid" x1="${l}" y1="${y(max*f)}" x2="${w-rr}" y2="${y(max*f)}"/><text x="${l-9}" y="${y(max*f)+4}" text-anchor="end">${(max*f).toFixed(1)}</text>`).join('')}${paths.map(d=>`<path class="line" d="${d}"/>`).join('')}${points.map((p,i)=>p.value==null?'':`<circle cx="${x(i)}" cy="${y(p.value)}" r="${points.length>40?2:4}"><title>${esc(p.label)} · ${rate(p.value)} : 1</title></circle>${(years||points.length<5)?`<text x="${x(i)}" y="${y(p.value)-10}" text-anchor="middle">${rate(p.value)}</text>`:''}`).join('')}${points.map((p,i)=>(years||i===0||i===points.length-1)?`<text x="${x(i)}" y="${h-12}" text-anchor="middle">${esc(p.label)}</text>`:'').join('')}</svg>`;
}
async function openDetail(id){
  const r=allRows().find(r=>r.id===id);if(!r)return;const generation=++detailGeneration;
  const historical=[2024,2025,2026].map(year=>({year,row:lookupHistorical(r,year)}));
  const unit=state.catalog.units?.[id],s=r.school;
  $('#detail-content').innerHTML=`<div class="detail-top"><div><div class="eyebrow">${esc(s.shortName)} · ${categories[r.category]}</div><h2>${esc(r.name)}</h2></div><button class="close-dialog" data-close aria-label="닫기">×</button></div><p class="detail-subtitle">${esc(r.note||unit?.note||s.track)}<br>자료 기준 ${time(s.snapshot.sourceAt,true)}</p><div class="detail-stats"><div><p>현재 경쟁률</p><strong>${rate(r.ratio)} <small>: 1</small></strong></div><div><p>모집인원</p><strong>${num(r.seats)} <small>명</small></strong></div><div><p>지원인원</p><strong>${num(r.applicants)} <small>명</small></strong></div></div><section class="detail-section"><h3>시간별 경쟁률 추이</h3><div id="timeline"><div class="empty">저장된 이력을 불러오고 있습니다…</div></div></section><section class="detail-section"><h3>지난 3개년 최종 경쟁률</h3>${lineChart(historical.map(h=>({label:`${h.year}`,value:h.row?.ratio??null})),{years:true})}<div class="table-wrap"><table><thead><tr><th>학년도</th><th class="number">모집</th><th class="number">지원</th><th class="number">최종 경쟁률</th><th>충원 공개값</th><th>출처</th></tr></thead><tbody>${historical.map(h=>`<tr><td>${h.year}</td><td class="number">${num(h.row?.seats)}</td><td class="number">${num(h.row?.applicants)}</td><td class="number">${h.row?rate(h.row.ratio)+' : 1':'—'}</td><td>${h.row?admissionValue(h.row):'<span class="muted">비교 자료 없음</span>'}</td><td>${h.row?sourceLink(h.row.sourceUrl||state.historical.schools?.[s.id]?.[h.year]?.sourceUrl,'원문 ↗')+' '+sourceLink(h.row.reserveSourceUrl||state.historical.schools?.[s.id]?.[h.year]?.reserveSourceUrl,'충원·예비 ↗'):''}</td></tr>`).join('')}</tbody></table></div><p>2027년 접수 중 현황과 과거 최종 경쟁률은 서로 다른 시점입니다. 모집단위 개편·신설 또는 미확인 자료는 연결하지 않습니다.</p></section><section class="detail-section"><h3>수능최저학력기준</h3><p>${esc(unit?.minimumText||state.catalog.schools?.[s.id]?.minimum?.text||'공식 모집요강 확인 중')}</p>${sourceLink(state.catalog.schools?.[s.id]?.minimum?.sourceUrl,'2027 공식 자료 ↗')}</section><div class="detail-source"><span>충원 인원과 예비번호를 구분하여 표시합니다.</span>${sourceLink(s.url)}</div>`;
  $('#detail').showModal();document.body.classList.add('modal-open');
  try{
    const archive=await json(`./data/history/${s.id}.json`);
    if(generation!==detailGeneration||!$('#detail').open)return;
    const points=archive.snapshots.filter(p=>p.sourceAt).map(p=>({at:p.sourceAt,label:time(p.sourceAt),value:p.rows.find(u=>u.id===id)?.ratio??null,applicants:p.rows.find(u=>u.id===id)?.applicants??null}));
    const last=points.at(-1),prev=points.at(-2),delta=prev?.applicants!=null&&last?.applicants!=null?last.applicants-prev.applicants:null;
    $('#timeline').innerHTML=lineChart(points)+`<p class="chart-note">${points.length===0?'원문 발표 시각이 없어 시간 그래프에 표시하지 않습니다.':points.length<2?'첫 현황을 저장했습니다. 다음 발표가 수집되면 변화가 표시됩니다.':`저장된 현황 ${num(points.length)}회${delta==null?'':` · 직전 저장 현황 대비 지원자 ${delta>0?'+':''}${num(delta)}명`}`}</p><p class="gap-notice">수집 시작 전 이력은 없습니다. 25분을 초과한 미수집 구간은 선으로 연결하지 않습니다.</p>`;
  }catch(e){if(generation===detailGeneration&&$('#timeline'))$('#timeline').innerHTML=`<div class="empty">${esc(e.message)}<br>현재 경쟁률은 위 표에서 확인할 수 있습니다.</div>`;}
}
async function load({initial=false}={}){
  if(loading)return;loading=true;$('#reload').disabled=true;
  try{
    const [data,catalog,historical,runtime]=await Promise.all([json('./data/latest.json'),json('./data/catalog.json'),json('./data/historical.json'),json('./runtime.json')]);
    if(!Array.isArray(data.schools))throw Error('경쟁률 데이터 형식이 올바르지 않습니다.');
    Object.assign(state,{data,catalog,historical,runtime});
    $('#runtime-label').textContent=runtime.mode==='local'?'로컬 수집 서버':'GitHub 자동 수집';render();
    if(!initial)toast('저장된 최신 자료를 읽었습니다.');
  }catch(e){if(!state.data)$('#app').innerHTML=`<div class="error-box"><strong>자료를 불러오지 못했습니다.</strong><p>${esc(e.message)}</p><p>초기 수집과 사이트 배포가 완료되었는지 확인해 주세요.</p><button class="button" data-retry>다시 읽기</button></div>`;else toast('자료를 다시 읽지 못했습니다. 기존 화면을 유지합니다.');}
  finally{loading=false;$('#reload').disabled=false;}
}
function route(){const match=location.hash.match(/^#school\/([a-z]+)$/);state.school=match?.[1]||null;if(state.data&&!state.data.schools.some(s=>s.id===state.school))state.school=null;state.query='';state.category='all';render();}
document.addEventListener('input',e=>{if(e.target.id==='search'){state.query=e.target.value;renderFiltered();}});
document.addEventListener('change',e=>{if(e.target.id==='category')state.category=e.target.value;else if(e.target.id==='sort')state.sort=e.target.value;else if(e.target.id==='favorites-only')state.favoritesOnly=e.target.checked;else return;renderFiltered();});
document.addEventListener('click',e=>{
  const star=e.target.closest('[data-star]');if(star){const id=star.dataset.star;favorites.has(id)?favorites.delete(id):favorites.add(id);try{localStorage.setItem('essay-favorites',JSON.stringify([...favorites]));}catch{toast('이 브라우저에서는 관심 목록을 저장할 수 없습니다.');}renderFiltered();return;}
  const detail=e.target.closest('[data-detail]');if(detail){openDetail(detail.dataset.detail);return;}
  if(e.target.closest('[data-close]'))$('#detail').close();
  const year=e.target.closest('[data-year]');if(year){state.historyYear=Number(year.dataset.year);const s=state.data.schools.find(s=>s.id===state.school);$('#school-history').innerHTML=historyTable(s);}
  if(e.target.closest('[data-retry]'))load();
});
$('#detail').addEventListener('close',()=>{document.body.classList.remove('modal-open');detailGeneration++;});
$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('#reload').addEventListener('click',()=>load());
window.addEventListener('hashchange',()=>{route();window.scrollTo(0,0);});
state.school=location.hash.match(/^#school\/([a-z]+)$/)?.[1]||null;
load({initial:true});setInterval(()=>{if(!document.hidden&&!$('#detail').open&&!$('#search')?.matches(':focus'))load({initial:true});},60_000);
