// Original practice material based on the linked note and the theory references below.
// Target `type` values match the canonical CHORDS ids in music.js.
export const PRACTICES = [
  {
    id: 'compare',
    title: '改变一个音，听懂和弦性质',
    subtitle: '先固定 C 根音，把指型和三音、七音联系起来。',
    minutes: 5,
    goal: '能指出变化的音，并说出它是三音还是七音。',
    steps: [
      '先弹 C，再弹 Cm。逐个弹出构成音，找到 E 降为 E♭ 的位置；其余音尽量保持相同。',
      '比较 Cmaj7 与 C7，听 B→B♭；再比较 C7 与 Cm7，听 E→E♭。每组先齐奏，再分解弹并跟唱变化音。',
      '录下这几组对照，回听时先说出变化的音和和弦性质，再查看指板核对。熟悉后把同一练习移到 D 根音。'
    ],
    targets: [
      { root: 0, type: 'major', label: 'C · 大三' },
      { root: 0, type: 'minor', label: 'Cm · 小三' },
      { root: 0, type: 'maj7', label: 'Cmaj7 · 大七' },
      { root: 0, type: 'm7', label: 'Cm7 · 小七' },
      { root: 0, type: '7', label: 'C7 · 属七' }
    ]
  },
  {
    id: 'caged',
    title: '沿 CAGED 找到同一个和弦',
    subtitle: '五个区域都是 C 大和弦，先找根音，再找三音和五音。',
    minutes: 5,
    goal: '在两个相邻区域找到 C、E、G，并解释它们如何重叠。',
    steps: [
      '从 C 型区域开始，找出每个 C 根音，再逐个弹出附近的 E 和 G，边弹边说 1、3、5。',
      '依次查看 A、G、E、D 型区域。先只弹容易按的三根弦，比较相邻区域共享的音和位置。',
      '选两个相邻区域交替弹 C 和弦，保持均匀节拍。随后换一个根音，重新找根音定位，核对构成音。'
    ],
    targets: [
      { root: 0, type: 'major', shape: 'C', label: 'C 型区域' },
      { root: 0, type: 'major', shape: 'A', label: 'A 型区域' },
      { root: 0, type: 'major', shape: 'G', label: 'G 型区域' },
      { root: 0, type: 'major', shape: 'E', label: 'E 型区域' },
      { root: 0, type: 'major', shape: 'D', label: 'D 型区域' }
    ]
  },
  {
    id: 'connection',
    title: '让和弦之间的音平稳移动',
    subtitle: 'Dm7 → G7 → Cmaj7：用三音与七音听见连接。',
    minutes: 5,
    tempo: 60,
    beatsPerChord: 4,
    goal: '每和弦四拍，连续四轮保持节奏，并听见至少一条声部线。',
    steps: [
      '先找到各和弦的三音与七音：Dm7 是 F、C；G7 是 B、F；Cmaj7 是 E、B。逐对弹奏并跟唱。',
      '选相近把位，按 F–C → F–B → E–B 的音对练习：先保留 F、把 C 降为 B；再保留 B、把 F 降为 E。',
      '加入根音或使用完整练习按法，在 60 BPM 下每个和弦弹四拍。连续四轮后回听，检查换和弦时是否掉拍。'
    ],
    targets: [
      { root: 2, type: 'm7', label: 'Dm7 · ii7', frets: [-1,5,3,5,-1,-1] },
      { root: 7, type: '7', label: 'G7 · V7', frets: [3,-1,3,4,-1,-1] },
      { root: 0, type: 'maj7', label: 'Cmaj7 · Imaj7', frets: [-1,3,2,4,-1,-1] }
    ]
  },
  {
    id: 'extensions',
    title: '分清 sus2、add9 与 maj9',
    subtitle: '同样出现 D，是否保留 E 和 B，会改变和弦名称与声音。',
    minutes: 5,
    goal: '能通过构成音解释这三个名字，而不依赖背图。',
    steps: [
      '从 C 的 C–E–G 出发，用 D 替换 E，得到 Csus2：C–D–G。弹前先确认三音 E 已被替换。',
      '回到 C，保留 E 并加入 D，得到 Cadd9：C–E–G–D。交替弹 Csus2 与 Cadd9，单独听 E 带来的区别。',
      '在 Cadd9 中再加入大七音 B，得到 Cmaj9。先分解唱出各音，再在一段熟悉旋律下比较，选择适合的版本。'
    ],
    targets: [
      { root: 0, type: 'major', label: 'C · 起点' },
      { root: 0, type: 'sus2', label: 'Csus2 · 用 2 替换 3' },
      { root: 0, type: 'add9', label: 'Cadd9 · 保留 3，加入 9' },
      { root: 0, type: 'maj9', label: 'Cmaj9 · 再加入大七音' }
    ]
  }
];

export const CORRECTIONS = [
  {
    title: 'sus2、add9、9 是不同结构',
    text: 'Csus2＝C–D–G；Cadd9＝C–E–G–D；C9＝C–E–G–B♭–D。分别检查三音是否保留、七音是否存在；2 与 9 对应同一音级，不代表这些和弦相同。'
  },
  {
    title: 'C6 的音集合对应 Am7/C',
    text: 'C6＝C–E–G–A，与 Am7/C 的音集合相同；Am/C 只有 C–E–A。相同音集合在不同低音和进行中，也可能承担不同作用。'
  },
  {
    title: '自然 11 与 13 需要结合语境',
    text: '大和弦中的自然 11 可能与三音产生明显摩擦；小和弦的自然 13 要结合调式、旋律和排列判断。它们不是所有风格中的禁用音。升高十一音应明确写成 Cmaj7(#11) 等形式。'
  },
  {
    title: '完整构成、实际按法与调内级数要分清',
    text: '9、11、13 和弦的实际按法常省略部分音；对照实际发声与省略标记来练。构成音的 1、3、5 相对该和弦根音；进行中的 I、ii、V 则相对调的主音。'
  }
];

export const SOURCE_NOTES = [
  {
    title: '和弦笔记（一）大、小、属家族',
    url: 'https://scns251qkxyc.feishu.cn/wiki/IPIiwXLbAiJmcmkWf8Sc5pxBnje',
    note: '原笔记以 CAGED 组织吉他和弦，比较大、小、属家族的构造与延伸音，并强调排列会改变声音。本页将其整理为可移调的指板对照，并补充练习步骤与概念修正。'
  },
  {
    title: 'Open Music Theory · Chord Symbols',
    url: 'https://viva.pressbooks.pub/openmusictheorycopy/chapter/chord-symbols/',
    note: '用于核对和弦符号、构成音、延伸音及斜线低音的记法。'
  },
  {
    title: 'Fender · Sus Chords',
    url: 'https://www.fender.com/articles/chords/the-sus-piciously-easy-way-to-liven-up-basic-chords',
    note: '用于核对 sus2、sus4 以二音或四音替换三音的基本构造。'
  },
  {
    title: 'The Chord Scale Theory & Jazz Harmony · 出版社节选',
    url: 'https://content.alfred.com/catpages/01-ADV11216.pdf',
    note: '用于补充可用张力与回避音的语境；自然 13 的取舍需要结合调式与具体音乐。'
  }
];
