export const YEAR = 2027;
export const schools = [
  {id:'kyonggi',name:'경기대학교',shortName:'경기대',color:'#7197e0',provider:'uway',url:'https://ratio.uwayapply.com/Sl5KJXJyV2FiOUpmJSY6Jko3ZlRm',track:'논술(논술우수자전형)',cutoff:'12:00',close:'17:00',resultsUrl:'https://enter.kyonggi.ac.kr/cms/FR_CON/index.do?MENU_ID=130'},
  {id:'suwon',name:'수원대학교',shortName:'수원대',color:'#b09ae2',provider:'jinhak',url:'https://addon.jinhakapply.com/RatioV1/RatioH/Ratio10970461.html',track:'교과논술전형',cutoff:'12:00',close:'18:00',resultsUrl:'https://ipsi.suwon.ac.kr/board/susi_result'},
  {id:'koreatech',name:'한국기술교육대학교',shortName:'한국기술교육대',color:'#e1a068',provider:'uway',url:'https://ratio.uwayapply.com/Sl5KfExgMDhgfWE5SmYlJjomSjdmVGY=',track:'논술전형',cutoff:'18:00',close:'19:00',resultsUrl:'https://www.koreatech.ac.kr/menu.es?mid=a40102010100'},
  {id:'tukorea',name:'한국공학대학교',shortName:'한국공학대',color:'#6eb6b2',provider:'jinhak',url:'https://addon.jinhakapply.com/RatioV1/RatioH/Ratio30170741.html',track:'논술(논술우수자)',cutoff:'12:00',close:'18:00',resultsUrl:'https://iphak.tukorea.ac.kr/susi/result.htm'},
  {id:'gachon',name:'가천대학교',shortName:'가천대',color:'#e58d94',provider:'jinhak',url:'https://addon.jinhakapply.com/RatioV1/RatioH/Ratio10190711.html',track:'논술 전형',cutoff:'12:00',close:'18:00',resultsUrl:'https://admission.gachon.ac.kr/admission/html/rolling/result.asp'},
  {id:'sahmyook',name:'삼육대학교',shortName:'삼육대',color:'#8cae77',provider:'jinhak',url:'https://addon.jinhakapply.com/RatioV1/RatioH/Ratio10760741.html',track:'논술우수자전형',cutoff:'15:00',close:'18:00',resultsUrl:'https://ipsi.syu.ac.kr/2016_syu/pages/index.asp?p=10&b=B_1_7&cate=%BC%F6%BD%C3'}
].map(s=>({...s,year:YEAR,intervalMinutes:10,cutoffAt:`2026-09-11T${s.cutoff}:00+09:00`,closeAt:`2026-09-11T${s.close}:00+09:00`}));
