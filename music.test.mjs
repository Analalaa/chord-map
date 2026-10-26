import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('./dist/music.js', import.meta.url), 'utf8');
const { CHORDS, ROOTS, TUNING, getChord, getVoicings, getCaged } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const mod = n => ((n % 12) + 12) % 12;
const naturalPitches = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
assert.equal(ROOTS.length, 12);
assert.equal(CHORDS.length, 23);
assert.deepEqual(TUNING, [40,45,50,55,59,64]);
let chords = 0;
let voicings = 0;
let shapes = 0;

for (const root of ROOTS) {
  for (const type of CHORDS) {
    const chord = getChord(root.pc, type.id);
    assert.equal(chord.tones.length, type.intervals.length);
    assert.equal(chord.tones.length, type.degrees.length);
    assert.equal(new Set(chord.tones.map(tone => tone.pc)).size, chord.tones.length);
    chord.tones.forEach((tone, index) => {
      assert.equal(tone.pc, mod(root.pc + type.intervals[index]));
      assert.match(tone.name, /^[A-G][♭♯]*$/);
      const accidental = [...tone.name.slice(1)].reduce((sum, sign) => sum + (sign === '♯' ? 1 : -1), 0);
      assert.equal(mod(naturalPitches[tone.name[0]] + accidental), tone.pc, `${chord.symbol}: spelling matches pitch`);
    });
    const positions = getVoicings(root.pc, type.id);
    assert.ok(positions.length >= 2, `${chord.symbol}: at least two reviewed positions`);
    for (const position of positions) {
      assert.equal(position.frets.length, 6);
      const actual = new Set();
      for (let string = 0; string < 6; string++) {
        const fret = position.frets[string];
        assert.ok(Number.isInteger(fret) && fret >= -1 && fret <= 15);
        if (fret >= 0) actual.add(mod(TUNING[string] + fret));
      }
      assert.ok(actual.has(root.pc), `${chord.symbol}: root present`);
      const bassString = position.frets.findIndex(fret => fret >= 0);
      assert.equal(mod(TUNING[bassString] + position.frets[bassString]), root.pc, `${chord.symbol}: root in bass`);
      actual.forEach(pc => assert.ok(chord.tones.some(tone => tone.pc === pc), `${chord.symbol}: foreign tone ${pc}`));
      assert.deepEqual(position.omitted, chord.tones.filter(tone => !actual.has(tone.pc)).map(tone => tone.degree));
      const essential = ['1', type.degrees.includes('♭3') ? '♭3' : (type.degrees.includes('3') ? '3' : type.degrees[1])];
      if (type.degrees.includes('7')) essential.push('7');
      if (type.degrees.includes('♭7')) essential.push('♭7');
      essential.push(type.degrees.at(-1));
      if (type.id.includes('#11')) essential.push('♯11');
      if (type.id === '6/9') essential.push('6');
      for (const degree of essential) assert.ok(!position.omitted.includes(degree), `${chord.symbol}: preserve ${degree}`);
      const positive = position.frets.filter(fret => fret > 0);
      assert.ok(Math.max(...positive) - Math.min(...positive) <= 4, `${chord.symbol}: fret span`);
      voicings++;
    }
    chords++;
  }
  const positions = getCaged(root.pc);
  assert.deepEqual(positions.map(position => position.shape).sort(), ['A','C','D','E','G']);
  assert.ok(positions.every((position, index) => index === 0 || position.minFret >= positions[index-1].minFret));
  for (const position of positions) {
    const actual = new Set(position.frets.flatMap((fret, string) => fret < 0 ? [] : [mod(TUNING[string] + fret)]));
    assert.deepEqual([...actual].sort((a,b) => a-b), [root.pc,mod(root.pc+4),mod(root.pc+7)].sort((a,b) => a-b));
    assert.ok(position.minFret >= 0 && position.maxFret <= 15);
    shapes++;
  }
}

assert.deepEqual(getChord(0, '6').tones.map(tone => tone.name), ['C','E','G','A']);
assert.deepEqual(getChord(2, 'm7').tones.map(tone => tone.name), ['D','F','A','C']);
assert.deepEqual(getChord(6, 'major').tones.map(tone => tone.name), ['F♯','A♯','C♯']);
assert.deepEqual(getChord(1, 'm13').tones.map(tone => tone.name), ['D♭','F♭','A♭','C♭','E♭','G♭','B♭']);
assert.deepEqual(getChord(0, 'sus2').tones.map(tone => tone.name), ['C','D','G']);
assert.deepEqual(getChord(0, 'add9').tones.map(tone => tone.name), ['C','E','G','D']);
assert.equal(getChord(0, 'dom7').id, '7');
assert.throws(() => getChord(12, 'major'), RangeError);
assert.throws(() => getChord(0, 'unknown'), RangeError);
console.log(`Music checks passed: ${chords} chord collections, ${voicings} reviewed/transposed voicings, ${shapes} CAGED shapes.`);
