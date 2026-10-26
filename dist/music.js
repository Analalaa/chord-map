/** Standard tuning, from string 6 (low E) to string 1 (high E). */
export const TUNING = Object.freeze([40, 45, 50, 55, 59, 64]);
export const ROOTS = Object.freeze([
  { pc: 0, label: 'C' }, { pc: 1, label: 'D♭' }, { pc: 2, label: 'D' },
  { pc: 3, label: 'E♭' }, { pc: 4, label: 'E' }, { pc: 5, label: 'F' },
  { pc: 6, label: 'F♯' }, { pc: 7, label: 'G' }, { pc: 8, label: 'A♭' },
  { pc: 9, label: 'A' }, { pc: 10, label: 'B♭' }, { pc: 11, label: 'B' }
]);

const definition = (id, name, suffix, family, intervals, degrees, description, tip) =>
  Object.freeze({ id, name, suffix, family, intervals: Object.freeze(intervals), degrees: Object.freeze(degrees), description, tip });

/** These are theoretical pitch collections, not a demand to play every note. */
export const CHORDS = Object.freeze([
  definition('major', '大三和弦', '', 'major', [0,4,7], ['1','3','5'], '根音、大三度与纯五度组成的基础和弦。', '先找到根音与三音。把三音降低半音，便得到同根音小三和弦。'),
  definition('maj7', '大七和弦', 'maj7', 'major', [0,4,7,11], ['1','3','5','7'], '在大三和弦上加入大七度。', 'maj7 的七音与根音相差一个半音的音级距离；留意音区与旋律。'),
  definition('maj9', '大九和弦', 'maj9', 'major', [0,4,7,11,14], ['1','3','5','7','9'], '大七和弦加入自然九音。', '区别 add9：maj9 的结构包含大七音。练习按法可以省去五音。'),
  definition('maj11', '大十一和弦', 'maj11', 'major', [0,4,7,11,14,17], ['1','3','5','7','9','11'], '大七体系加入自然十一音；完整理论结构也包括九音。', '自然11与大三音可能产生强摩擦。这里保留3与11作对照，不把它误记成sus；可比较maj7(#11)。'),
  definition('maj13', '大十三和弦', 'maj13', 'major', [0,4,7,11,14,17,21], ['1','3','5','7','9','11','13'], '大七体系延伸到自然十三音。', '完整理论结构有七种音；吉他练习排列保留1、3、7、13，并明确省略5、9、11。'),
  definition('maj7#11', '大七升十一', 'maj7(#11)', 'major', [0,4,7,11,18], ['1','3','5','7','♯11'], '大七和弦加入升十一音。', '升高的是11而非根音；Cmaj7(#11) 中的升十一音为F♯。'),
  definition('maj13#11', '大十三升十一', 'maj13(#11)', 'major', [0,4,7,11,14,18,21], ['1','3','5','7','9','♯11','13'], '大十三体系采用升十一音。', '练习排列保留1、3、7、♯11、13，通常省略5与9；不是所有音都必须同时弹出。'),
  definition('minor', '小三和弦', 'm', 'minor', [0,3,7], ['1','♭3','5'], '根音、小三度与纯五度组成。', '与同根音大三和弦比较，只改变三音：3降低半音成为♭3。'),
  definition('m7', '小七和弦', 'm7', 'minor', [0,3,7,10], ['1','♭3','5','♭7'], '小三和弦加入小七度。', '与属七和弦比较：两者都有♭7，三音分别是♭3与3。'),
  definition('m9', '小九和弦', 'm9', 'minor', [0,3,7,10,14], ['1','♭3','5','♭7','9'], '小七和弦加入自然九音。', '先听m7，再只加入9；练习排列常省略五音。'),
  definition('m11', '小十一和弦', 'm11', 'minor', [0,3,7,10,14,17], ['1','♭3','5','♭7','9','11'], '小七体系加入自然十一音。', '先抓住♭3、♭7、11；练习排列可以省略5与9。'),
  definition('m13', '小十三和弦', 'm13', 'minor', [0,3,7,10,14,17,21], ['1','♭3','5','♭7','9','11','13'], '小七体系延伸到自然十三音（大六度）。', '13能否使用取决于调式、旋律与排列；例如部分Dorian语境可用。不能把它当成普遍禁音。'),
  definition('7', '属七和弦', '7', 'dominant', [0,4,7,10], ['1','3','5','♭7'], '大三和弦加入小七度，三音与七音之间形成三全音。', '属七是和弦性质，不保证它在每首歌中都承担V7功能。先练G7→C，听B→C与F→E。'),
  definition('9', '属九和弦', '9', 'dominant', [0,4,7,10,14], ['1','3','5','♭7','9'], '属七和弦加入自然九音。', '单独写9通常包含♭7；与maj9以及add9区别开。'),
  definition('11', '属十一和弦', '11', 'dominant', [0,4,7,10,14,17], ['1','3','5','♭7','9','11'], '属七体系延伸到自然十一音。', '3与11可能摩擦；此处给保留两者的色彩排列。若把3替换为4，应另写7sus4或9sus4。'),
  definition('13', '属十三和弦', '13', 'dominant', [0,4,7,10,14,17,21], ['1','3','5','♭7','9','11','13'], '属七体系延伸到自然十三音。', '常用排列保留1、3、♭7、13；5、9、11可省略。连接小和弦时，♭9或♭13是可选张力而非必需。'),
  definition('6', '大六和弦', '6', 'other', [0,4,7,9], ['1','3','5','6'], '大三和弦加入自然六音，不包含七音。', 'C6的音集合为C–E–G–A，与Am7/C相同；Am/C少了G，不能直接等同。'),
  definition('m6', '小六和弦', 'm6', 'other', [0,3,7,9], ['1','♭3','5','6'], '小三和弦加入大六度。', 'm6中的6通常是自然6，不是♭6；与m7比较，只把♭7降低半音至6。'),
  definition('6/9', '六九和弦', '6/9', 'other', [0,4,7,9,14], ['1','3','5','6','9'], '大三和弦加入六音和九音，不包含七音。', '6/9并不是maj13的同义词；七音的有无是重要区别。'),
  definition('sus2', '挂二和弦', 'sus2', 'other', [0,2,7], ['1','2','5'], '用二音替代三音。', '没有3或♭3，因此不能只凭它确定大小性质；比较sus2→大三。'),
  definition('sus4', '挂四和弦', 'sus4', 'other', [0,5,7], ['1','4','5'], '用四音替代三音。', '先唱4→3，再弹sus4→大三，听同一根音下的变化。'),
  definition('add9', '加九和弦', 'add9', 'other', [0,4,7,14], ['1','3','5','9'], '保留大三和弦的三音，再加入九音；不含七音。', 'Csus2没有E，Cadd9保留E；C9还包含B♭，三者不能混用。'),
  definition('7sus4', '属七挂四', '7sus4', 'other', [0,5,7,10], ['1','4','5','♭7'], '用四音替换属七和弦的三音，保留小七音。', '可试G7sus4→G7→C，听4→3，再听属解决；此处不会偷偷加入三音。')
]);

const LETTERS = ['C','D','E','F','G','A','B'];
const NATURAL = [0,2,4,5,7,9,11];
const ROOT_LETTERS = [0,1,1,2,2,3,3,4,5,5,6,6];
const ALIASES = { maj: 'major', min: 'minor', min7: 'm7', dom7: '7', six: '6' };
const mod = n => ((n % 12) + 12) % 12;

function checkRoot(rootPc) {
  if (!Number.isInteger(rootPc) || rootPc < 0 || rootPc > 11) throw new RangeError('根音应为0至11的音级编号。');
}

function spelling(rootPc, interval, degree) {
  const number = Number(degree.replace(/[^0-9]/g, ''));
  const letter = (ROOT_LETTERS[rootPc] + number - 1) % 7;
  let alteration = mod(rootPc + interval - NATURAL[letter]);
  if (alteration > 6) alteration -= 12;
  return LETTERS[letter] + (alteration < 0 ? '♭'.repeat(-alteration) : '♯'.repeat(alteration));
}

export function getChord(rootPc, chordId) {
  checkRoot(rootPc);
  const id = ALIASES[chordId] || chordId;
  const chord = CHORDS.find(item => item.id === id);
  if (!chord) throw new RangeError(`未知和弦类型：${chordId}`);
  return {
    ...chord,
    symbol: ROOTS[rootPc].label + chord.suffix,
    tones: chord.intervals.map((interval, index) => ({
      pc: mod(rootPc + interval), name: spelling(rootPc, interval, chord.degrees[index]),
      degree: chord.degrees[index], interval
    }))
  };
}

/*
 * Reviewed C-root templates. -1 means mute, 0 means open. All six positions are
 * present, ordered low E → high E. Extended templates deliberately keep their
 * third and seventh and the named top extension. Missing theoretical tones are
 * computed below and displayed rather than silently renamed.
 */
const TEMPLATES = {
  major: [[-1,3,2,0,1,0],[-1,3,5,5,5,3],[8,10,10,9,8,8]],
  minor: [[-1,3,5,5,4,3],[8,10,10,8,8,8]],
  maj7: [[-1,3,2,0,0,0],[-1,3,5,4,5,3],[8,-1,9,9,8,-1]],
  maj9: [[-1,3,2,4,3,-1],[8,7,9,7,-1,-1]],
  maj11: [[-1,3,3,4,5,-1],[8,8,9,9,-1,-1]],
  maj13: [[-1,3,-1,4,5,5],[8,-1,9,9,10,-1]],
  'maj7#11': [[-1,3,4,4,5,-1],[8,-1,9,9,7,-1]],
  'maj13#11': [[-1,3,4,4,5,5],[8,9,9,9,10,-1]],
  m7: [[-1,3,5,3,4,3],[8,-1,8,8,8,-1]],
  m9: [[-1,3,1,3,3,-1],[8,6,8,7,-1,-1]],
  m11: [[-1,3,3,3,4,-1],[8,8,8,8,-1,-1]],
  m13: [[-1,3,-1,3,4,5],[8,-1,8,8,10,-1]],
  '7': [[-1,3,2,3,1,0],[-1,3,5,3,5,3],[8,-1,8,9,8,-1]],
  '9': [[-1,3,2,3,3,-1],[8,7,8,7,-1,-1]],
  '11': [[-1,3,3,3,5,-1],[8,8,8,9,-1,-1]],
  '13': [[-1,3,-1,3,5,5],[8,-1,8,9,10,-1]],
  '6': [[-1,3,2,2,1,3],[8,-1,7,9,8,-1]],
  m6: [[-1,3,1,2,1,3],[8,-1,7,8,8,-1]],
  '6/9': [[-1,3,2,2,3,3],[8,7,7,7,-1,-1]],
  sus2: [[-1,3,5,5,3,3],[-1,3,0,0,1,3]],
  sus4: [[-1,3,5,5,6,3],[8,10,10,10,8,8]],
  add9: [[-1,3,2,0,3,0],[8,-1,10,9,8,10]],
  '7sus4': [[-1,3,3,3,1,1],[8,10,8,10,8,8]]
};

function moved(template, amount, reduceOctave = true) {
  let frets = template.map(fret => fret < 0 ? -1 : fret + amount);
  if (reduceOctave) {
    while (Math.min(...frets.filter(fret => fret >= 0)) >= 12) {
      frets = frets.map(fret => fret < 0 ? -1 : fret - 12);
    }
  }
  return frets;
}

export function getVoicings(rootPc, chordId) {
  const chord = getChord(rootPc, chordId);
  const seen = new Set();
  return TEMPLATES[chord.id].map((template, index) => {
    const frets = moved(template, rootPc);
    const present = new Set(frets.flatMap((fret, string) => fret < 0 ? [] : [mod(TUNING[string] + fret)]));
    const minFret = Math.min(...frets.filter(fret => fret > 0));
    const maxFret = Math.max(...frets);
    const firstString = frets.findIndex(fret => fret >= 0);
    const bassPc = mod(TUNING[firstString] + frets[firstString]);
    const bass = chord.tones.find(tone => tone.pc === bassPc)?.name || ROOTS[bassPc].label;
    const omitted = chord.tones.filter(tone => !present.has(tone.pc)).map(tone => tone.degree);
    return {
      frets,
      label: frets.includes(0) ? '开放弦排列' : `第${minFret}品附近`,
      omitted, bass, minFret: Number.isFinite(minFret) ? minFret : 0, maxFret,
      rootString: 6 - firstString,
      ...(chord.id === 'major' ? { caged: ['C','A','E'][index] } : {})
    };
  }).filter(voicing => {
    const key = voicing.frets.join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const CAGED_C = [
  { shape: 'C', frets: [-1,3,2,0,1,0] },
  { shape: 'A', frets: [-1,3,5,5,5,3] },
  { shape: 'G', frets: [8,7,5,5,5,8] },
  { shape: 'E', frets: [8,10,10,9,8,8] },
  { shape: 'D', frets: [-1,-1,10,12,13,12] }
];

export function getCaged(rootPc) {
  checkRoot(rootPc);
  return CAGED_C.map(({ shape, frets }) => {
    // Use the lowest complete occurrence of each shape in the practice window.
    const position = moved(frets, rootPc, true);
    return { shape, frets: position, minFret: Math.min(...position.filter(fret => fret >= 0)), maxFret: Math.max(...position) };
  }).sort((a, b) => a.minFret - b.minFret || a.maxFret - b.maxFret);
}
