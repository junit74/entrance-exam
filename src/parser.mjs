import { load } from 'cheerio';
import { createHash } from 'node:crypto';

export const clean = s => String(s ?? '').replace(/\s+/g,' ').trim();
const compact = s => clean(s).replace(/\s/g,'');
export function parseSourceTime(text) {
  const m = text.match(/(20\d{2})[-년.\s]+(\d{1,2})[-월.\s]+(\d{1,2})[일.\s]*(오전|오후)?\s*(\d{1,2})[:시]\s*(\d{2})/);
  if (!m) return null;
  let [,y,mo,d,ampm,h,mi]=m; h=Number(h);
  if (ampm) h=h%12+(ampm==='오후'?12:0);
  if(h>23 || Number(mi)>59 || Number(mo)<1 || Number(mo)>12 || Number(d)<1 || Number(d)>31) throw Error('자료 기준 시각 형식 오류');
  const value=`${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}T${String(h).padStart(2,'0')}:${mi}:00+09:00`;
  if(!Number.isFinite(Date.parse(value))) throw Error('자료 기준 시각 오류');
  if(new Date(Date.parse(value)+9*3600_000).toISOString().slice(0,10)!==value.slice(0,10))throw Error('자료 기준 날짜 오류');
  return value;
}

// Expand row/column spans before interpreting columns, including split majors.
export function expandTable($,table) {
  const grid=[];
  $(table).find('tr').each((r,tr)=>{
    grid[r]??=[]; let c=0;
    $(tr).children('th,td').each((_,cell)=>{
      while(grid[r][c]!==undefined)c++;
      const val=clean($(cell).text()), rs=Number($(cell).attr('rowspan')||1), cs=Number($(cell).attr('colspan')||1);
      if(rs>300 || cs>40)throw Error('표 병합 범위 오류');
      for(let rr=r;rr<r+rs;rr++){grid[rr]??=[];for(let cc=c;cc<c+cs;cc++)grid[rr][cc]=val;}
      c+=cs;
    });
  });
  return grid;
}
function integer(s) { if(!/^\d[\d,]*$/.test(s??''))throw Error(`인원 형식 오류: ${s}`); return Number(s.replaceAll(',','')); }
function columns(header) {
  return { seats:header.findIndex(s=>/^(총)?모집인원$/.test(s)), applicants:header.findIndex(s=>/^(지원인원|지원자수|지원자)$/.test(s)), ratio:header.findIndex(s=>s==='경쟁률'), units:header.map((s,i)=>/모집단위|전공/.test(s)&&!s.includes('개설')?i:-1).filter(i=>i>=0), campus:header.indexOf('캠퍼스'), college:header.findIndex(s=>/^(대학|소속|계열)$/.test(s)),note:header.indexOf('비고') };
}
export function parseRatio(html,school,{allowUndatedFinal=false}={}) {
  const $=load(html); $('script,style').remove();
  const text=clean($('body').text());
  const year=Number(text.match(/(20\d{2})학년도/)?.[1]);
  if(year!==school.year)throw Error(`학년도 불일치 (${year||'확인 불가'})`);
  const title=clean($('title').text());
  if(!title.includes(school.sourceName||school.name))throw Error('학교명 불일치');
  const timeText=clean($('#RatioTime').text()) || clean($('body').text()).slice(0,1800);
  const sourceAt=parseSourceTime(timeText);
  // Instructions saying a final result WILL be published do not mean final.
  const isFinal=/최종\s*(경쟁률\s*)?마감\s*현황(?:입니다|\s|$)/.test(timeText) || /최종\s*경쟁률\s*현황입니다/.test(timeText);
  if(!sourceAt && !(isFinal && allowUndatedFinal))throw Error(isFinal?'최종 현황의 발표 일시 없음: 검토 필요':'자료 기준 일시 확인 불가');
  const candidates=[];
  $('table').each((_,el)=>{
    const caption=clean($(el).find('caption').text());
    const heading=clean($(el).prevAll('h2,h3,h4').first().text());
    if(compact(caption)===compact(school.track)||compact(heading)===compact(school.track+' 경쟁률 현황'))candidates.push(el);
  });
  if(candidates.length!==1)throw Error(`논술 상세 표 식별 실패 (${candidates.length}개)`);
  const grid=expandTable($,candidates[0]);
  const hi=grid.findIndex(row=>row.includes('경쟁률')&&row.some(s=>/모집인원/.test(s)));
  if(hi<0)throw Error('논술 표 머리글 없음');
  const col=columns(grid[hi]);
  if(col.seats<0||col.applicants<0||col.ratio<0||!col.units.length)throw Error('필수 열 없음');
  let rows=[];let total=null;
  for(const cells of grid.slice(hi+1)) {
    if(!cells?.length || cells[col.seats]==='모집인원')continue;
    if(cells.slice(0,col.seats).some(s=>/^(총계|소계|합계)$/.test(s))){
      total={seats:integer(cells[col.seats]),applicants:integer(cells[col.applicants])};continue;
    }
    const unitParts=[...new Set(col.units.map(i=>cells[i]).filter(Boolean))];
    if(!unitParts.length)throw Error('모집단위 이름 없음');
    const name=unitParts.join(' · '), seats=integer(cells[col.seats]),applicants=integer(cells[col.applicants]);
    const ratio=Number(cells[col.ratio]?.match(/^([\d,.]+)\s*:\s*1$/)?.[1]?.replaceAll(',',''));
    if(!seats||!Number.isFinite(ratio)||Math.abs(ratio-applicants/seats)>0.011)throw Error(`경쟁률 검증 실패: ${name}`);
    const campus=col.campus<0?'':cells[col.campus];
    const id=createHash('sha256').update(`${school.id}|${school.track}|${campus}|${name}`).digest('hex').slice(0,16);
    rows.push({id,name,campus,college:col.college<0?'':cells[col.college],note:col.note<0?'':cells[col.note],seats,applicants,ratio});
  }
  if(!rows.length||new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('모집단위 누락 또는 중복');
  const sums=rows.reduce((a,r)=>({seats:a.seats+r.seats,applicants:a.applicants+r.applicants}),{seats:0,applicants:0});
  if(!total||sums.seats!==total.seats||sums.applicants!==total.applicants)throw Error('논술 합계 불일치');
  // Reconcile the entire official track before narrowing to a requested campus.
  const sourceTotal={...total};
  if(school.campusFilter){
    if(col.campus<0)throw Error('캠퍼스 구분 열 없음');
    rows=rows.filter(r=>compact(r.campus)===compact(school.campusFilter));
    if(!rows.length)throw Error('선택 캠퍼스의 논술 모집단위 없음');
    total=rows.reduce((a,r)=>({seats:a.seats+r.seats,applicants:a.applicants+r.applicants}),{seats:0,applicants:0});
  }
  return {year,sourceAt,isFinal,sourceUrl:school.url,track:school.track,rows,total:{...total,ratio:Math.round(total.applicants/total.seats*100)/100},...(school.campusFilter?{sourceTotal}:{}),contentHash:createHash('sha256').update(JSON.stringify(rows)).digest('hex')};
}
