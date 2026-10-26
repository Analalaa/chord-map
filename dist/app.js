import { ROOTS, TUNING, CHORDS, getChord, getVoicings, getCaged } from './music.js';
import { PRACTICES, CORRECTIONS, SOURCE_NOTES } from './practice.js';
import { getInversionGroups } from './inversions.js';

const $ = id => document.getElementById(id);
const families = {all:'全部',major:'大和弦',minor:'小和弦',dominant:'属和弦',other:'挂留 / 附加'};
const familyLabels = {major:'MAJOR FAMILY / 大和弦家族',minor:'MINOR FAMILY / 小和弦家族',dominant:'DOMINANT FAMILY / 属和弦家族',other:'SUSPENDED & ADDED / 挂留与附加音'};
const state = {root:0,type:'major',family:'all',label:'both',range:'practice',showAll:false,focus:'all',selected:null,practice:0,target:0,practiceActive:false};
let chord, voicings, caged, inversionGroups=[], audio, metroTimer, beat=0, started=false, toastTimer;
let playing=[];
let inversionExpanded=new Set();
try {
  const currentSaved=localStorage.getItem('fretboard-study-v2');
  const saved=JSON.parse(currentSaved||localStorage.getItem('fretboard-study-v1')||'null');
  if(saved && Number.isInteger(saved.root) && saved.root>=0 && saved.root<12) state.root=saved.root;
  if(saved && CHORDS.some(c=>c.id===saved.type)) state.type=saved.type;
  if(saved && ['both','degree','note'].includes(saved.label)) state.label=saved.label;
  if(currentSaved && saved && ['practice','low','full'].includes(saved.range)) state.range=saved.range;
} catch {}
function remember(){try{localStorage.setItem('fretboard-study-v2',JSON.stringify({root:state.root,type:state.type,label:state.label,range:state.range}));}catch{}}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3000);}
function isGuide(degree){return ['3','♭3','7','♭7'].includes(degree);}
function color(degree){return degree==='1'?'#dc795b':isGuide(degree)?'#7b75ba':'#566879';}
function noteAt(midi){return ROOTS[((midi%12)+12)%12].label;}
function focusTone(tone){return state.focus==='all'||(state.focus==='root'&&tone.degree==='1')||(state.focus==='guide'&&isGuide(tone.degree));}
function fretCode(frets){return frets.map(f=>f<0?'×':f).join(' ');}
function soundingNotes(frets){return frets.flatMap((f,s)=>f<0?[]:[{string:s,fret:f,midi:TUNING[s]+f,name:chord.tones.find(t=>t.pc===(TUNING[s]+f)%12)?.name||noteAt(TUNING[s]+f)}]).sort((a,b)=>a.midi-b.midi||a.string-b.string);}
function minimumMidi(frets){return Math.min(...frets.flatMap((f,s)=>f<0?[]:[TUNING[s]+f]));}
function esc(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function setSelection(root,type,selection=null,fromPractice=false){
  if(!fromPractice&&state.practiceActive){stopMetronome();state.practiceActive=false;}
  if(root!==state.root||type!==state.type)inversionExpanded=new Set();
  state.root=root;state.type=type;state.selected=selection;
  if(state.family!=='all'&&getChord(root,type).family!==state.family)state.family='all';
  render();remember();
}

function renderControls(){
  $('root-picker').innerHTML=ROOTS.map(r=>`<button type="button" data-root="${r.pc}" aria-pressed="${r.pc===state.root}">${r.label}</button>`).join('');
  $('family-picker').innerHTML=Object.entries(families).map(([key,label])=>`<button type="button" data-family="${key}" aria-pressed="${state.family===key}">${label}</button>`).join('');
  const available=CHORDS.filter(c=>state.family==='all'||c.family===state.family);
  $('chord-type').innerHTML=available.map(c=>`<option value="${c.id}">${ROOTS[state.root].label}${c.suffix} · ${c.name}</option>`).join('');
  $('chord-type').value=state.type;
  $('board-range').value=state.range;$('show-all').checked=state.showAll;
  document.querySelectorAll('[data-label]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.label===state.label)));
  document.querySelectorAll('[data-focus]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.focus===state.focus)));
}
function renderOverview(){
  $('family-label').textContent=familyLabels[chord.family];$('chord-symbol').textContent=state.selected?.symbol||chord.symbol;$('chord-name').textContent=state.selected?.inversion?`${chord.name} · ${state.selected.inversion}`:chord.name;
  $('chord-description').textContent=chord.description;$('chord-tip').textContent=chord.tip;
  $('tone-chips').innerHTML=chord.tones.map(t=>`<span class="tone-chip ${t.degree==='1'?'root-tone':isGuide(t.degree)?'guide-tone':''}"><strong>${t.name}</strong><span>${t.degree} 音</span></span>`).join('');
}

function boardSVG(start,end){
  const width=1120,height=282,left=79,right=24,top=49,bottom=247,count=end-start+1;
  const cell=(width-left-right)/count;
  const x=f=>left+(f-start+.5)*cell;
  const y=s=>top+(5-s)*(bottom-top)/5;
  const selected=state.selected?.frets;
  const bassMidi=selected?minimumMidi(selected):null;
  let out=`<svg class="fretboard-svg" viewBox="0 0 ${width} ${height}" role="group" aria-label="${chord.symbol}，第${start}至${end}品，1弦在上6弦在下"><title>${chord.symbol} 全指板构成音，第${start}至${end}品</title>`;
  out+=`<text x="10" y="20" class="board-caption">${start}–${end} 品</text>`;
  for(let f=start;f<=end;f++){
    out+=`<text x="${x(f)}" y="22" text-anchor="middle" class="fret-label">${f===0?'0 / 空弦':f}</text>`;
    if(f!==end){const line=x(f)+cell/2;out+=`<line x1="${line}" y1="${top-10}" x2="${line}" y2="${bottom+10}" class="${f===0?'board-nut':'board-fret'}"/>`;}
    if([3,5,7,9,15,17,19,21].includes(f))out+=`<circle cx="${x(f)}" cy="${bottom+24}" r="2.6" class="board-inlay"/>`;
    if([12,24].includes(f))out+=`<circle cx="${x(f)-5}" cy="${bottom+24}" r="2.6" class="board-inlay"/><circle cx="${x(f)+5}" cy="${bottom+24}" r="2.6" class="board-inlay"/>`;
  }
  for(let s=5;s>=0;s--){
    out+=`<text x="8" y="${y(s)+4}" class="string-label">${6-s}弦 ${['E','A','D','G','B','e'][s]}</text><line x1="${left}" y1="${y(s)}" x2="${width-right}" y2="${y(s)}" stroke-width="${.65+(5-s)*.21}" class="board-string"/>`;
  }
  for(let s=5;s>=0;s--)for(let f=start;f<=end;f++){
    const midi=TUNING[s]+f,pc=midi%12,tone=chord.tones.find(t=>t.pc===pc),isSelected=selected?.[s]===f,isBass=isSelected&&state.selected?.source==='inversion'&&midi===bassMidi;
    if(tone){
      const dim=!focusTone(tone)||Boolean(selected&&!isSelected);
      const noteLabel=`${6-s}弦${f}品，${tone.name}，${tone.degree}音${isBass?'，当前最低音':''}`;
      out+=`<g class="tone-point${dim?' is-dim':''}${isSelected?' is-selected':''}" role="button" tabindex="0" data-midi="${midi}" aria-label="${noteLabel}"><circle cx="${x(f)}" cy="${y(s)}" r="${state.label==='both'?17:14.5}" fill="${color(tone.degree)}"/>`;
      if(isSelected)out+=`<circle class="selection-ring" cx="${x(f)}" cy="${y(s)}" r="21"/>`;
      if(isBass)out+=`<circle class="bass-ring" cx="${x(f)}" cy="${y(s)}" r="24"/>`;
      if(state.label==='both')out+=`<text x="${x(f)}" y="${y(s)-1}">${tone.name}</text><text x="${x(f)}" y="${y(s)+10}" class="degree-text">${tone.degree}</text>`;
      else out+=`<text x="${x(f)}" y="${y(s)+4}">${state.label==='note'?tone.name:tone.degree}</text>`;
      out+='</g>';
    }else if(state.showAll){out+=`<text x="${x(f)}" y="${y(s)+3}" class="neutral-note" role="button" tabindex="0" data-midi="${midi}" aria-label="${6-s}弦${f}品，${noteAt(midi)}，非当前和弦音">${noteAt(midi)}</text>`;}
  }
  return out+'</svg>';
}
function renderBoards(){
  const ranges=state.range==='full'?[[0,12],[12,24]]:state.range==='low'?[[0,12]]:[[0,15]];
  const previous=[...$('board-container').children].map(el=>el.scrollLeft);
  $('board-container').innerHTML=ranges.map(([start,end])=>`<div class="fretboard-scroll">${boardSVG(start,end)}</div>`).join('');
  [...$('board-container').children].forEach((el,i)=>{
    const [start,end]=ranges[i],frets=state.selected?.frets.filter(f=>f>=start&&f<=end);
    if(frets?.length){const middle=(Math.min(...frets)+Math.max(...frets))/2;const scale=el.scrollWidth/1120;el.scrollLeft=Math.min(...frets)<=start+2?0:(79+(middle-start+.5)*(1120-79-24)/(end-start+1))*scale-el.clientWidth/2;}
    else el.scrollLeft=previous[i]||0;
  });
  $('selected-legend').hidden=!state.selected;$('clear-voicing').hidden=!state.selected;
  if(state.selected){
    const omitted=state.selected.omitted?.length?`；省略 ${state.selected.omitted.join('、')} 音`:'；包含全部构成音';
    const inversionLabel=state.selected.inversion?`${state.selected.symbol} · ${state.selected.inversion} · 最低音 ${state.selected.bass}；`:'';
    $('board-status').textContent=`${inversionLabel}当前按法：${fretCode(state.selected.frets)}${omitted}。深色外圈标记实际要弹的位置${state.selected.source==='inversion'?'，双圈标记最低音':''}，其余亮点只是可选位置。`;
  }else $('board-status').textContent=`当前显示 ${chord.symbol} 的全部构成音位置。先找到 ${ROOTS[state.root].label} 根音，再找三音与七音；这些亮点不是一只手要同时按下的指法。`;
  renderInversionDock();
}

function miniSVG(frets,showBass=false){
  const positive=frets.filter(f=>f>0),max=Math.max(...positive,0),base=max<=4?1:Math.min(...positive),rows=Math.max(4,max-base+1),rowH=Math.min(22,92/rows),x=s=>27+s*15,top=30;
  const bassMidi=showBass?minimumMidi(frets):null;
  let svg=`<svg class="mini-chord" viewBox="0 0 128 141" role="img" aria-label="六弦到一弦品位：${fretCode(frets)}"><title>${fretCode(frets)}</title>`;
  if(base>1)svg+=`<text x="4" y="${top+rowH*.65}">${base}</text>`;
  for(let s=0;s<6;s++)svg+=`<line class="diagram-line" x1="${x(s)}" y1="${top}" x2="${x(s)}" y2="${top+rows*rowH}"/><text x="${x(s)}" y="16" text-anchor="middle">${frets[s]<0?'×':frets[s]===0?'○':''}</text><text x="${x(s)}" y="136" text-anchor="middle">${6-s}</text>`;
  for(let r=0;r<=rows;r++)svg+=`<line class="${r===0&&base===1?'diagram-nut':'diagram-line'}" x1="27" y1="${top+r*rowH}" x2="102" y2="${top+r*rowH}"/>`;
  frets.forEach((f,s)=>{if(f>0)svg+=`<circle cx="${x(s)}" cy="${top+(f-base+.5)*rowH}" r="5.4" class="${(TUNING[s]+f)%12===state.root?'diagram-root':'diagram-dot'}"/>`;if(showBass&&f>=0&&TUNING[s]+f===bassMidi)svg+=`<circle cx="${x(s)}" cy="${f===0?12:top+(f-base+.5)*rowH}" r="8" class="diagram-bass-ring"/>`;});
  return svg+'</svg>';
}
function renderVoicings(){
  $('voicing-grid').innerHTML=voicings.length?voicings.map((v,i)=>`<button class="voicing-card" type="button" data-voicing="${i}" aria-pressed="${state.selected?.source==='voicing'&&state.selected.index===i}"><strong>${esc(v.label)}${v.caged?' · '+v.caged+' 型':''}</strong>${miniSVG(v.frets)}<span class="fret-code">${fretCode(v.frets)}</span><small>${v.omitted.length?'省略 '+v.omitted.join('、')+' 音':'完整构成音'} · 最低音 ${v.bass}</small></button>`).join(''):'<div class="no-voicing">这个结构先以全指板构成音进行找音练习。</div>';
}
function inversionCard(group,groupIndex,v,index){
  const active=state.selected?.source==='inversion'&&state.selected.groupId===group.id&&state.selected.index===index;
  const noteSequence=soundingNotes(v.frets).map(n=>n.name).join(' – ');
  return `<button class="voicing-card inversion-card" type="button" data-inversion-group="${groupIndex}" data-inversion-voice="${index}" aria-pressed="${active}" aria-label="${esc(v.symbol)}，${esc(group.name)}，最低音${esc(v.bass)}，六弦到一弦品位${fretCode(v.frets)}"><strong class="inversion-symbol">${esc(v.symbol)}</strong>${miniSVG(v.frets,true)}<span class="fret-code">${fretCode(v.frets)}</span><span class="inversion-bass">最低音 ${esc(v.bass||group.bassName)} · ${esc(group.bassDegree)} 音</span><span class="inversion-sequence">低 → 高：${esc(noteSequence)}</span><small>${esc(v.label)}<br>${v.omitted.length?'省略 '+v.omitted.join('、')+' 音':'完整构成音'}</small></button>`;
}
function renderInversions(){
  $('inversion-current').textContent=`${chord.symbol} · ${inversionGroups.length} 种低音位置`;
  $('inversion-groups').innerHTML=inversionGroups.map((group,i)=>{
    const expanded=inversionExpanded.has(group.id),shown=expanded?group.voicings:group.voicings.slice(0,2);
    return `<article class="inversion-group"><div class="inversion-group-heading"><h3>${esc(group.name)}</h3><span>${esc(group.bassDegree)} 音低音 · <b>${esc(group.bassName)}</b></span></div><p>${esc(group.description)}</p><div class="inversion-shapes">${shown.length?shown.map((v,j)=>inversionCard(group,i,v,j)).join(''):'<div class="inversion-empty">0–15 品内暂无符合条件的完整练习按法。</div>'}</div>${group.voicings.length>2?`<button class="text-button inversion-more" type="button" data-inversion-more="${esc(group.id)}" aria-expanded="${expanded}">${expanded?'收起更多把位':'更多把位（'+(group.voicings.length-2)+'）'}</button>`:''}</article>`;
  }).join('');
  const selected=state.selected?.source==='inversion'?state.selected:null;
  $('inversion-selection').textContent=selected?`${selected.symbol} · ${selected.inversion} · 最低音 ${selected.bass} · ${fretCode(selected.frets)}`:'先选一个按法，或点“下一转位”从原位开始。';
  const hasVoicings=inversionGroups.some(g=>g.voicings.length);
  $('inversion-previous').disabled=!hasVoicings;$('inversion-next').disabled=!hasVoicings;
  $('inversion-play').disabled=!hasVoicings;$('inversion-show-board').disabled=!hasVoicings;
  const extended=chord.degrees.some(d=>Number(d.replace(/[^0-9]/g,''))>7);
  $('inversion-note').textContent=extended?'延伸和弦按三／七和弦骨架标记转位；9、11、13 等色彩音的省略情况写在每张按法下。若某种低音无法在当前范围内形成满足条件的按法，会保留说明。':'练习顺序：先弹最低音，再分解各音，最后齐奏；保持和弦性质，依次比较各个转位。换到另一把位，不一定改变转位。';
  renderInversionDock();
}
function renderInversionDock(){
  const dock=$('inversion-dock'),selected=state.selected?.source==='inversion'?state.selected:null;
  dock.hidden=!selected;if(!selected)return;
  dock.innerHTML=`<div><span class="field-caption">顺序练转位 / 最低音决定转位</span><strong>${esc(selected.symbol)} <span>${esc(selected.inversion)} · 最低音 ${esc(selected.bass)}</span></strong></div><div class="dock-actions"><button type="button" class="button" data-inversion-action="previous">← 上一转位</button><button type="button" class="button button-dark" data-inversion-action="next">下一转位 →</button><button type="button" class="button" data-inversion-action="play">▶ 试听</button><button type="button" class="text-button" data-inversion-action="list">回转位对照 ↓</button></div>`;
}
function selectInversion(groupIndex,voiceIndex=0,scroll=false){
  const group=inversionGroups[groupIndex],v=group?.voicings[voiceIndex];if(!v)return false;
  if(state.practiceActive){stopMetronome();state.practiceActive=false;}
  state.focus='all';state.range='practice';state.selected={...v,source:'inversion',groupId:group.id,index:voiceIndex,inversion:group.name,bass:v.bass||group.bassName};
  renderControls();renderOverview();renderBoards();renderVoicings();renderCaged();renderInversions();renderPractice();
  if(scroll)$('fretboard').scrollIntoView({behavior:'smooth'});return true;
}
function stepInversion(direction=1){
  const groups=inversionGroups.map((g,i)=>g.voicings.length?i:null).filter(i=>i!==null);if(!groups.length)return;
  const current=state.selected?.source==='inversion'?groups.findIndex(i=>inversionGroups[i].id===state.selected.groupId):-1;
  const next=current<0?(direction>0?0:groups.length-1):(current+direction+groups.length)%groups.length;
  selectInversion(groups[next]);
}
function ensureInversionSelected(){if(state.selected?.source!=='inversion')stepInversion(1);}
function renderCaged(){
  $('caged-current').textContent=ROOTS[state.root].label+' 大三和弦';
  $('caged-grid').innerHTML=caged.map((v,i)=>`<button class="voicing-card" type="button" data-caged="${i}" aria-pressed="${state.selected?.source==='caged'&&state.selected.index===i}"><span class="shape-letter">${v.shape}</span><strong>${ROOTS[state.root].label} 和弦 · ${v.shape} 型</strong>${miniSVG(v.frets)}<span class="fret-code">${fretCode(v.frets)}</span><small>${v.minFret}–${v.maxFret} 品区域</small></button>`).join('');
}
function renderTable(){
  const filter=$('catalog-family').value;
  $('chord-table').innerHTML=CHORDS.filter(c=>filter==='all'||c.family===filter).map(c=>{
    const item=getChord(state.root,c.id);
    return `<tr class="${c.id===state.type?'active-row':''}" data-chord="${c.id}" tabindex="0" aria-label="查看${item.symbol} ${item.name}"><td>${item.symbol}</td><td>${item.name}</td><td>${item.degrees.join(' · ')}</td><td>${item.tones.map(t=>t.name).join(' · ')}</td><td>${esc(item.tip)}</td></tr>`;
  }).join('');
}
function render(){chord=getChord(state.root,state.type);voicings=getVoicings(state.root,state.type);caged=getCaged(state.root);inversionGroups=getInversionGroups(state.root,state.type);renderControls();renderOverview();renderBoards();renderVoicings();renderInversions();renderCaged();renderTable();renderPractice();}

async function ensureAudio(){
  if(!audio){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw new Error('当前浏览器不支持合成音，请在吉他上核对声音。');audio=new Context();}
  if(audio.state!=='running')await audio.resume();return audio;
}
function stopNotes(){playing.forEach(o=>{try{o.stop();}catch{}});playing=[];}
function sound(midi,at,duration=.9,level=.1,kind='triangle'){
  const o=audio.createOscillator(),g=audio.createGain();o.type=kind;o.frequency.value=440*2**((midi-69)/12);o.connect(g);g.connect(audio.destination);g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(level,at+.012);g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.start(at);o.stop(at+duration+.025);o.onended=()=>{o.disconnect();g.disconnect();playing=playing.filter(v=>v!==o);};playing.push(o);
}
async function playNote(midi){try{await ensureAudio();stopNotes();sound(midi,audio.currentTime+.01,.9,.16);}catch(e){toast(e.message);}}
async function playChord(arp=false){
  try{await ensureAudio();stopNotes();const notes=state.selected?state.selected.frets.flatMap((f,s)=>f<0?[]:[TUNING[s]+f]).sort((a,b)=>a-b):chord.tones.map(t=>48+state.root+t.interval);notes.forEach((m,i)=>sound(m,audio.currentTime+.02+(arp?i*.27:0),arp?1.3:1.8,.3/notes.length));}catch(e){toast(e.message);}
}

function renderPractice(){
  const p=PRACTICES[state.practice];
  $('practice-tabs').innerHTML=PRACTICES.map((p,i)=>`<button type="button" data-practice="${i}" aria-pressed="${i===state.practice}">${['01 / 性质对照','02 / CAGED 地图','03 / 和弦连接','04 / 延伸音比较'][i]}</button>`).join('');
  $('practice-name').textContent=p.title;$('practice-subtitle').textContent=p.subtitle;$('practice-steps').innerHTML=p.steps.map(s=>`<li>${esc(s)}</li>`).join('');$('practice-goal').textContent='练习目标：'+p.goal;
  $('practice-targets').innerHTML=p.targets.map((t,i)=>`<button type="button" data-target="${i}" aria-pressed="${state.practiceActive&&i===state.target}">${esc(t.label||getChord(t.root,t.type).symbol)}</button>`).join('');
  renderPracticeDock();
}
function renderPracticeDock(){
  const dock=$('practice-dock');dock.hidden=!state.practiceActive;if(!state.practiceActive)return;
  const p=PRACTICES[state.practice];
  dock.innerHTML=`<div><span class="field-caption">跟练 / ${esc(p.title)}</span><div class="dock-targets">${p.targets.map((t,i)=>`<button type="button" data-dock-target="${i}" aria-pressed="${i===state.target}">${esc(t.shape?t.shape+' 型':getChord(t.root,t.type).symbol)}</button>`).join('')}</div></div><div class="dock-actions"><button class="button" type="button" data-dock-action="next">下一个 →</button><button class="button button-dark" type="button" data-dock-action="metro">${started?'停止节拍':'开启节拍'} · ${$('bpm').value} BPM</button><label class="check-label"><input type="checkbox" data-dock-auto ${$('auto-next').checked?'checked':''}>四拍换和弦</label><button type="button" class="text-button" data-dock-action="close">结束跟练</button></div>`;
}
function selectTarget(index,quiet=false){
  state.practiceActive=true;
  const p=PRACTICES[state.practice];state.target=(index+p.targets.length)%p.targets.length;const t=p.targets[state.target];
  let selected=null;
  if(t.shape){const i=getCaged(t.root).findIndex(v=>v.shape===t.shape);if(i>=0)selected={...getCaged(t.root)[i],source:'caged',index:i,omitted:[]};}
  else if(t.frets){const targetChord=getChord(t.root,t.type),present=new Set(t.frets.flatMap((f,s)=>f<0?[]:[(TUNING[s]+f)%12]));selected={frets:t.frets,source:'practice',omitted:targetChord.tones.filter(tone=>!present.has(tone.pc)).map(tone=>tone.degree)};}
  else {const choices=getVoicings(t.root,t.type);if(choices.length)selected={...choices[0],source:'voicing',index:0};}
  state.focus=state.practice===2?'guide':'all';state.range='practice';setSelection(t.root,t.type,selected,true);renderPractice();
  if(!quiet)toast('指板已切换至 '+(t.label||getChord(t.root,t.type).symbol));
}
function stopMetronome(){clearInterval(metroTimer);metroTimer=null;started=false;beat=0;$('metronome-button').textContent='开启节拍器';$('metronome-button').setAttribute('aria-pressed','false');[...$('beat-dots').children].forEach(d=>d.classList.remove('on'));renderPracticeDock();}
function tick(){
  if(!started)return;
  if(beat>0&&beat%4===0&&$('auto-next').checked)selectTarget(state.target+1,true);
  [...$('beat-dots').children].forEach((d,i)=>d.classList.toggle('on',i===beat%4));
  sound(beat%4===0?88:81,audio.currentTime+.008,.055,beat%4===0?.16:.1,'sine');beat++;
}
async function startMetronome(){
  if(!state.practiceActive)selectTarget(state.target,true);
  try{await ensureAudio();const bpm=Math.max(40,Math.min(180,Number($('bpm').value)||60));$('bpm').value=bpm;started=true;beat=0;$('metronome-button').textContent='停止节拍器';$('metronome-button').setAttribute('aria-pressed','true');renderPracticeDock();tick();metroTimer=setInterval(tick,60000/bpm);}catch(e){toast(e.message);}
}

$('root-picker').addEventListener('click',e=>{const b=e.target.closest('[data-root]');if(b)setSelection(Number(b.dataset.root),state.type);});
$('family-picker').addEventListener('click',e=>{const b=e.target.closest('[data-family]');if(!b)return;stopMetronome();state.practiceActive=false;state.family=b.dataset.family;if(state.family!=='all'&&chord.family!==state.family)state.type=CHORDS.find(c=>c.family===state.family).id;state.selected=null;render();renderPractice();remember();});
$('chord-type').addEventListener('change',e=>setSelection(state.root,e.target.value));
$('label-mode').addEventListener('click',e=>{const b=e.target.closest('[data-label]');if(b){state.label=b.dataset.label;renderControls();renderBoards();remember();}});
$('focus-picker').addEventListener('click',e=>{const b=e.target.closest('[data-focus]');if(b){state.focus=b.dataset.focus;renderControls();renderBoards();}});
$('board-range').addEventListener('change',e=>{state.range=e.target.value;renderBoards();remember();});
$('show-all').addEventListener('change',e=>{state.showAll=e.target.checked;renderBoards();});
$('board-container').addEventListener('click',e=>{const p=e.target.closest('[data-midi]');if(p)playNote(Number(p.dataset.midi));});
$('board-container').addEventListener('keydown',e=>{const p=e.target.closest('[data-midi]');if(p&&(e.key==='Enter'||e.key===' ')){e.preventDefault();playNote(Number(p.dataset.midi));}});
$('voicing-grid').addEventListener('click',e=>{const b=e.target.closest('[data-voicing]');if(!b)return;const i=Number(b.dataset.voicing);state.selected={...voicings[i],source:'voicing',index:i};state.focus='all';state.range='practice';renderControls();renderOverview();renderBoards();renderVoicings();renderInversions();renderCaged();$('fretboard').scrollIntoView({behavior:'smooth'});});
$('caged-grid').addEventListener('click',e=>{const b=e.target.closest('[data-caged]');if(!b)return;const i=Number(b.dataset.caged),v=getCaged(state.root)[i];state.focus='all';state.range='practice';setSelection(state.root,'major',{...v,source:'caged',index:i,omitted:[]});$('fretboard').scrollIntoView({behavior:'smooth'});});
$('clear-voicing').addEventListener('click',()=>{state.selected=null;renderOverview();renderBoards();renderVoicings();renderInversions();renderCaged();});
$('inversion-groups').addEventListener('click',e=>{const more=e.target.closest('[data-inversion-more]');if(more){const id=more.dataset.inversionMore;inversionExpanded.has(id)?inversionExpanded.delete(id):inversionExpanded.add(id);renderInversions();return;}const b=e.target.closest('[data-inversion-group]');if(b){selectInversion(Number(b.dataset.inversionGroup),Number(b.dataset.inversionVoice),true);playChord(false);}});
$('inversion-previous').addEventListener('click',()=>stepInversion(-1));$('inversion-next').addEventListener('click',()=>stepInversion(1));
$('inversion-play').addEventListener('click',()=>{ensureInversionSelected();playChord(false);});
$('inversion-show-board').addEventListener('click',()=>{ensureInversionSelected();$('fretboard').scrollIntoView({behavior:'smooth'});});
$('inversion-dock').addEventListener('click',e=>{const b=e.target.closest('[data-inversion-action]');if(!b)return;const action=b.dataset.inversionAction;if(action==='previous')stepInversion(-1);if(action==='next')stepInversion(1);if(action==='play')playChord(false);if(action==='list')$('inversions').scrollIntoView({behavior:'smooth'});});
$('play-chord').addEventListener('click',()=>playChord(false));$('play-arp').addEventListener('click',()=>playChord(true));
$('catalog-family').addEventListener('change',renderTable);
function activateRow(e){const row=e.target.closest('[data-chord]');if(row){state.focus='all';setSelection(state.root,row.dataset.chord);$('fretboard').scrollIntoView({behavior:'smooth'});}}
$('chord-table').addEventListener('click',activateRow);$('chord-table').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activateRow(e);}});
$('practice-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-practice]');if(!b)return;stopMetronome();state.practice=Number(b.dataset.practice);state.target=0;renderPractice();selectTarget(0);});
$('practice-targets').addEventListener('click',e=>{const b=e.target.closest('[data-target]');if(b)selectTarget(Number(b.dataset.target));});
$('previous-target').addEventListener('click',()=>selectTarget(state.target-1));$('next-target').addEventListener('click',()=>selectTarget(state.target+1));
$('go-practice-board').addEventListener('click',()=>{selectTarget(state.target,true);$('fretboard').scrollIntoView({behavior:'smooth'});});
$('practice-dock').addEventListener('click',e=>{const target=e.target.closest('[data-dock-target]');if(target){selectTarget(Number(target.dataset.dockTarget),true);return;}const b=e.target.closest('[data-dock-action]');if(!b)return;if(b.dataset.dockAction==='next')selectTarget(state.target+1,true);if(b.dataset.dockAction==='metro')started?stopMetronome():startMetronome();if(b.dataset.dockAction==='close'){stopMetronome();state.practiceActive=false;renderPractice();}});
$('practice-dock').addEventListener('change',e=>{if(e.target.matches('[data-dock-auto]'))$('auto-next').checked=e.target.checked;});
$('auto-next').addEventListener('change',renderPracticeDock);
$('metronome-button').addEventListener('click',()=>started?stopMetronome():startMetronome());$('bpm').addEventListener('change',()=>{if(started){stopMetronome();startMetronome();}});
$('print').addEventListener('click',()=>window.print());
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMetronome();stopNotes();}});
$('correction-grid').innerHTML=CORRECTIONS.map(c=>`<article><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></article>`).join('');
$('source-list').innerHTML=SOURCE_NOTES.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noreferrer">${esc(s.title)} ↗</a><br>${esc(s.note)}</p>`).join('');
render();renderPractice();
