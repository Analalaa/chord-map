import { getChord, TUNING } from './music.js';

// A voicing is classified by its lowest sounding MIDI pitch, never by the
// first string in a diagram. Names of inversions refer to the tertian skeleton.
const invCache = new Map();
const invBasicTypes = new Set(['major', 'minor', 'maj7', 'm7', '7']);

function invGroupDefinitions(chord) {
  const hasThird = chord.degrees.includes('3') || chord.degrees.includes('♭3');
  return chord.tones.filter(tone => {
    if (['1', '3', '♭3', '5', '7', '♭7'].includes(tone.degree)) return true;
    return !hasThird || ['6', 'm6', '6/9', 'add9'].includes(chord.id);
  }).map(tone => {
    let id = `degree-${tone.degree}`;
    let name = `${tone.degree}音低音排列`;
    if (tone.degree === '1') { id = 'root'; name = '原位'; }
    else if (hasThird && ['3', '♭3'].includes(tone.degree)) { id = 'third'; name = '第一转位'; }
    else if (hasThird && tone.degree === '5') { id = 'fifth'; name = '第二转位'; }
    else if (hasThird && ['7', '♭7'].includes(tone.degree)) { id = 'seventh'; name = '第三转位'; }
    const degreeName = tone.degree === '1' ? '根音' : `${tone.degree}音`;
    let description = `${degreeName} ${tone.name} 作为实际最低音，和弦根音仍为 ${chord.tones[0].name}。`;
    if (chord.tones.length > 4) description += '转位按三／七和弦骨架命名，延伸音的取舍见各按法的省略标记。';
    if (!hasThird) description += '挂留结构以低音音名标注，不套用含三音和弦的转位编号。';
    return { id, name, bassDegree: tone.degree, bassName: tone.name, description, tone };
  });
}

function invRequiredDegrees(chord, bassDegree) {
  // Complete basic triads and seventh chords. For extended chords preserve the
  // root, quality, seventh and named extension; a fifth in the bass is retained.
  if (invBasicTypes.has(chord.id) || chord.tones.length <= 4) return chord.degrees;
  const required = new Set(['1', bassDegree]);
  for (const degree of ['3', '♭3', '7', '♭7']) if (chord.degrees.includes(degree)) required.add(degree);
  required.add(chord.degrees.at(-1));
  if (chord.degrees.includes('♯11')) required.add('♯11');
  if (chord.id === '6/9') required.add('6');
  return [...required];
}

function invFingerPlan(frets) {
  const pressed = frets.flatMap((fret, string) => fret > 0 ? [{ fret, string }] : []);
  if (!pressed.length) return { fingers: 0, barres: [] };
  const wholeMask = (1 << pressed.length) - 1;
  const options = pressed.map((point, index) => ({ mask: 1 << index, barre: null }));
  for (const fret of new Set(pressed.map(point => point.fret))) {
    const atFret = pressed.filter(point => point.fret === fret);
    for (let a = 0; a < atFret.length; a++) for (let b = a + 1; b < atFret.length; b++) {
      const first = atFret[a].string, last = atFret[b].string;
      // The barre cannot cover a ringing open string or a lower pressed fret.
      if (frets.slice(first, last + 1).some(value => value >= 0 && value < fret)) continue;
      let mask = 0;
      pressed.forEach((point, index) => { if (point.fret === fret && point.string >= first && point.string <= last) mask |= 1 << index; });
      options.push({ mask, barre: { fret, fromString: 6 - first, toString: 6 - last } });
    }
  }
  const best = new Map();
  function solve(mask) {
    if (mask === wholeMask) return { fingers: 0, barres: [] };
    if (best.has(mask)) return best.get(mask);
    const first = pressed.findIndex((_, index) => !(mask & (1 << index)));
    let answer = { fingers: 99, barres: [] };
    for (const option of options) {
      if (!(option.mask & (1 << first))) continue;
      const remaining = solve(mask | option.mask);
      const candidate = { fingers: 1 + remaining.fingers, barres: option.barre ? [option.barre, ...remaining.barres] : remaining.barres };
      if (candidate.fingers < answer.fingers || (candidate.fingers === answer.fingers && candidate.barres.length < answer.barres.length)) answer = candidate;
    }
    best.set(mask, answer);
    return answer;
  }
  return solve(0);
}

function invStringSets(requiredCount) {
  const sets = [];
  // Start with consecutive string groups, adding a single muted inner string
  // when this makes a compact shell or five/six-tone extension practical.
  for (let length = Math.max(3, requiredCount); length <= 6; length++) {
    for (let start = 0; start + length <= 6; start++) sets.push(Array.from({ length }, (_, index) => start + index));
    if (length < 6) for (let start = 0; start + length + 1 <= 6; start++) {
      for (let skip = start + 1; skip < start + length; skip++) sets.push(Array.from({ length: length + 1 }, (_, index) => start + index).filter(string => string !== skip));
    }
  }
  return sets;
}

function invCandidates(chord, group) {
  const required = invRequiredDegrees(chord, group.bassDegree);
  const requiredPcs = required.map(degree => chord.tones.find(tone => tone.degree === degree).pc);
  const toneForPc = new Map(chord.tones.map(tone => [tone.pc, tone]));
  const found = new Map();
  const targetCount = required.length;
  const sets = invStringSets(targetCount);
  const allowedOnString = TUNING.map((open, string) => Array.from({ length: 16 }, (_, fret) => ({ fret, midi: open + fret, string })).filter(note => toneForPc.has(note.midi % 12)));

  for (const strings of sets) for (let windowStart = 0; windowStart <= 12; windowStart++) {
    const windowEnd = Math.min(15, windowStart + 4);
    const choices = strings.map(string => allowedOnString[string].filter(note => note.fret >= windowStart && note.fret <= windowEnd || note.fret === 0 && windowStart <= 4));
    if (choices.some(notes => notes.length === 0)) continue;
    const frets = [-1,-1,-1,-1,-1,-1];
    const picked = [];
    function visit(index, coverage) {
      if (index === strings.length) {
        if (!requiredPcs.every(pc => coverage.has(pc))) return;
        const lowest = picked.reduce((a,b) => a.midi <= b.midi ? a : b);
        if (lowest.midi % 12 !== group.tone.pc) return;
        const key = frets.join(',');
        if (found.has(key)) return;
        const positive = frets.filter(fret => fret > 0);
        const minFret = positive.length ? Math.min(...positive) : 0;
        const maxFret = Math.max(...frets);
        if (positive.length && maxFret - minFret > 4) return;
        const fingerPlan = invFingerPlan(frets);
        if (fingerPlan.fingers > 4) return;
        const notes = picked.map(note => ({
          string: 6 - note.string, stringIndex: note.string, fret: note.fret, midi: note.midi,
          name: toneForPc.get(note.midi % 12).name, degree: toneForPc.get(note.midi % 12).degree
        })).sort((a,b) => a.midi - b.midi || a.stringIndex - b.stringIndex);
        const omitted = chord.tones.filter(tone => !coverage.has(tone.pc)).map(tone => tone.degree);
        const stringLabel = `${6 - strings[0]}–${6 - strings.at(-1)}弦`;
        const label = `${stringLabel} · ${frets.includes(0) ? '含开放弦' : `${minFret}–${maxFret}品`}`;
        const symbol = group.bassDegree === '1' ? chord.symbol : `${chord.symbol}/${group.bassName}`;
        const span = positive.length ? maxFret - minFret : 0;
        const gaps = strings.at(-1) - strings[0] + 1 - strings.length;
        const score = (strings.length - targetCount) * 8 + span * 2.8 + fingerPlan.fingers * 1.4 + gaps * 7 + minFret * .13 + omitted.length * 1.2 + fingerPlan.barres.length * .15;
        found.set(key, { frets: [...frets], label, omitted, bass: group.bassName, symbol, inversion: group.name, minFret, maxFret, notes, fingers: fingerPlan.fingers, barres: fingerPlan.barres, score, stringSet: strings.join(',') });
        return;
      }
      const remaining = strings.length - index;
      const missing = requiredPcs.filter(pc => !coverage.has(pc));
      if (missing.length > remaining) return;
      for (const note of choices[index]) {
        // Once the target bass is lower than the others, no still lower note
        // of another pitch class can become part of this inversion.
        if (note.midi % 12 !== group.tone.pc && picked.some(p => p.midi % 12 === group.tone.pc && note.midi < p.midi)) continue;
        frets[note.string] = note.fret;
        picked.push(note);
        visit(index + 1, new Set([...coverage, note.midi % 12]));
        picked.pop();
        frets[note.string] = -1;
      }
    }
    visit(0, new Set());
  }
  return [...found.values()].sort((a,b) => a.score - b.score || a.minFret - b.minFret || a.frets.join(',').localeCompare(b.frets.join(',')));
}

function invChooseVoicings(candidates) {
  if (candidates.length <= 3) return candidates;
  const chosen = [candidates[0]];
  // A second string group makes the same inversion visible across the neck.
  const alternateStrings = candidates.find(candidate => candidate.stringSet !== chosen[0].stringSet);
  if (alternateStrings) chosen.push(alternateStrings);
  const alternatePosition = candidates.find(candidate => !chosen.includes(candidate) && chosen.every(existing => Math.abs(candidate.minFret - existing.minFret) >= 3));
  if (alternatePosition) chosen.push(alternatePosition);
  for (const candidate of candidates) {
    if (chosen.length === 3) break;
    if (!chosen.includes(candidate)) chosen.push(candidate);
  }
  return chosen;
}

export function getInversionGroups(rootPc, chordId) {
  const chord = getChord(rootPc, chordId);
  const key = `${rootPc}:${chord.id}`;
  if (invCache.has(key)) return invCache.get(key);
  const groups = invGroupDefinitions(chord).map(group => {
    const voicings = invChooseVoicings(invCandidates(chord, group));
    const { tone, ...publicGroup } = group;
    return { ...publicGroup, description: voicings.length ? group.description : `${group.description}在0–15品与四指限制下，暂不推荐完整保留必要音的紧凑按法；请先练其他低音排列。`, voicings: voicings.map(({ score, stringSet, ...voicing }) => voicing) };
  });
  invCache.set(key, groups);
  return groups;
}
