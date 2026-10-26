import assert from 'node:assert/strict';
import { CHORDS, ROOTS, TUNING, getChord } from './dist/music.js';
import { getInversionGroups } from './dist/inversions.js';

let checkedGroups = 0, checkedVoicings = 0;
const missing = [];
for (const root of ROOTS) for (const type of CHORDS) {
  const chord = getChord(root.pc, type.id);
  const groups = getInversionGroups(root.pc, type.id);
  assert.ok(groups.length >= 3, `${chord.symbol}: bass groups`);
  assert.strictEqual(groups, getInversionGroups(root.pc, type.id), 'cached result');
  const basics = ['major','minor','maj7','m7','7'].includes(type.id);
  if (['major','minor'].includes(type.id)) assert.equal(groups.length, 3);
  if (['maj7','m7','7'].includes(type.id)) assert.equal(groups.length, 4);
  for (const group of groups) {
    checkedGroups++;
    if (basics) assert.ok(group.voicings.length >= 2, `${chord.symbol} ${group.name}: two positions`);
    if (!group.voicings.length) missing.push(`${chord.symbol} ${group.name}`);
    const bassTone = chord.tones.find(tone => tone.degree === group.bassDegree);
    assert.equal(group.bassName, bassTone.name);
    for (const voicing of group.voicings) {
      checkedVoicings++;
      assert.equal(voicing.frets.length, 6);
      const notes = voicing.frets.flatMap((fret, string) => fret < 0 ? [] : [{ midi: TUNING[string] + fret, pc:(TUNING[string]+fret)%12 }]);
      const pcs = new Set(notes.map(note => note.pc));
      assert.equal(Math.min(...notes.map(note => note.midi)) % 12, bassTone.pc, `${voicing.symbol}: actual bass`);
      assert.ok(notes.every(note => chord.tones.some(tone => tone.pc === note.pc)), `${voicing.symbol}: chord members only`);
      assert.ok(voicing.frets.every(fret => Number.isInteger(fret) && fret >= -1 && fret <= 15));
      assert.ok(pcs.has(root.pc), `${voicing.symbol}: root present`);
      if (basics || chord.tones.length <= 4) assert.equal(pcs.size, chord.tones.length, `${voicing.symbol}: complete structure`);
      for (const degree of ['3','♭3','7','♭7']) if (chord.degrees.includes(degree)) assert.ok(pcs.has(chord.tones.find(tone => tone.degree === degree).pc), `${voicing.symbol}: ${degree} present`);
      assert.ok(pcs.has(chord.tones.at(-1).pc), `${voicing.symbol}: named extension`);
      if (type.id.includes('#11')) assert.ok(pcs.has(chord.tones.find(tone => tone.degree === '♯11').pc));
      if (type.id === '6/9') assert.ok(pcs.has(chord.tones.find(tone => tone.degree === '6').pc));
      assert.deepEqual(voicing.omitted, chord.tones.filter(tone => !pcs.has(tone.pc)).map(tone => tone.degree));
      const positive=voicing.frets.filter(fret=>fret>0);
      assert.ok(!positive.length || Math.max(...positive)-Math.min(...positive)<=4, `${voicing.symbol}: compact span`);
      assert.ok(voicing.fingers <= 4, `${voicing.symbol}: maximum four fretting fingers`);
      assert.equal(voicing.symbol, group.id === 'root' ? chord.symbol : `${chord.symbol}/${bassTone.name}`);
      assert.equal(voicing.notes[0].midi, Math.min(...notes.map(note => note.midi)));
    }
  }
}
const major=getInversionGroups(0,'major');
assert.deepEqual(major.map(group=>[group.id,group.name,group.bassName]),[['root','原位','C'],['third','第一转位','E'],['fifth','第二转位','G']]);
assert.deepEqual(getInversionGroups(0,'maj7').map(group=>group.bassName),['C','E','G','B']);
assert.deepEqual(getInversionGroups(0,'m7').map(group=>group.bassName),['C','E♭','G','B♭']);
assert.ok(getInversionGroups(0,'sus2').some(group=>group.name==='2音低音排列'));
assert.ok(!getInversionGroups(0,'sus2').some(group=>group.name==='第一转位'));
assert.ok(getInversionGroups(0,'6/9').some(group=>group.name==='6音低音排列'));
assert.throws(()=>getInversionGroups(12,'major'),RangeError);
console.log(`Inversion checks passed: ${checkedGroups} bass groups, ${checkedVoicings} practical voicings.`);
if(missing.length)console.log(`No recommended compact voicing: ${missing.join('; ')}`);
