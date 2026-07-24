import type { LibraryResource } from '../types'

export const seedLibrary: LibraryResource[] = [
  {
    id: 'lib_maktubat_1',
    title: 'Maktubat Imam Rabbani — Volume 1',
    author: 'Shaykh Ahmad Sirhindi (Imam Rabbani)',
    kind: 'book',
    topic: 'spirituality',
    summary:
      'Urdu translation of the letters of Imam Rabbani. Scanned PDF reader (2-up), sourced from Internet Archive.',
    language: 'Urdu',
    readingMinutes: 0,
    coverColor: '#1a3f33',
    coverImage: '/covers/maktubat-1.png',
    format: 'pdf',
    pdf: {
      provider: 'archive',
      archiveId: 'MaktubatRabbaniUrdu',
      archiveFile: 'Maktubat-Rabbani-1',
      startPage: 43,
      mode: '2up',
      pageProgression: 'rtl',
      sourceUrl:
        'https://archive.org/details/MaktubatRabbaniUrdu/Maktubat-Rabbani-1/page/n43/mode/2up',
    },
  },
  {
    id: 'lib_maktubat_2',
    title: 'Maktubat Imam Rabbani — Volume 2',
    author: 'Shaykh Ahmad Sirhindi (Imam Rabbani)',
    kind: 'book',
    topic: 'spirituality',
    summary:
      'Second volume of the Urdu Maktubat. Open in the PDF book viewer with two-page spread.',
    language: 'Urdu',
    readingMinutes: 0,
    coverColor: '#122c24',
    coverImage: '/covers/maktubat-2.png',
    format: 'pdf',
    pdf: {
      provider: 'archive',
      archiveId: 'MaktubatRabbaniUrdu',
      archiveFile: 'Maktubat-Rabbani-2',
      startPage: 0,
      mode: '2up',
      pageProgression: 'rtl',
      sourceUrl: 'https://archive.org/details/MaktubatRabbaniUrdu/Maktubat-Rabbani-2',
    },
  },
  {
    id: 'lib_1',
    title: 'Forty Nawawi — Selected Hadith',
    author: 'Imam al-Nawawi',
    kind: 'book',
    topic: 'hadith',
    summary:
      'A short selection from the famous forty hadith, with plain English notes for daily practice.',
    language: 'English',
    readingMinutes: 12,
    coverColor: '#0f766e',
    coverImage: '/covers/forty-nawawi.png',
    format: 'text',
    pages: [
      {
        heading: 'Hadith 1 — Intention',
        body: 'Actions are judged by intentions, and each person will have what they intended. Whoever emigrates for Allah and His Messenger, their emigration is for Allah and His Messenger. Whoever emigrates for worldly gain or a woman to marry, their emigration is for what they emigrated for.\n\nNote: Begin every study session by renewing why you are reading — for Allah, not for display.',
      },
      {
        heading: 'Hadith 2 — Islam, Iman, Ihsan',
        body: 'When Jibril asked about Islam, Iman, and Ihsan, the Prophet ﷺ answered with clarity: outward practice, inward belief, and worshipping Allah as though you see Him.\n\nNote: Use this hadith as a map. Today, pick one of the three and improve it by a single concrete act.',
      },
      {
        heading: 'Hadith 5 — Innovation',
        body: 'Whoever introduces into this matter of ours that which is not from it, it is rejected.\n\nNote: In learning, prefer established paths from reliable teachers before chasing novel shortcuts.',
      },
    ],
  },
  {
    id: 'lib_2',
    title: 'A Soft Introduction to Tajweed',
    author: 'Ilm Library',
    kind: 'essay',
    topic: 'tajweed',
    summary:
      'What beginners should learn first: letters, madd, and qalqalah — without overwhelm.',
    language: 'English',
    readingMinutes: 8,
    coverColor: '#245544',
    coverImage: '/covers/tajweed.png',
    format: 'text',
    pages: [
      {
        heading: 'Start with the mouth',
        body: 'Tajweed begins with where each letter is formed. Before rules, listen carefully to a slow murattal and notice how lips, tongue, and throat change from letter to letter.\n\nPractice: Pick five letters you confuse. Say each one ten times slowly while watching your mouth in a mirror.',
      },
      {
        heading: 'Madd without fear',
        body: 'A madd is a stretch. Natural madd (two counts) appears often; longer madds are learned later. Do not force dramatic stretching at the start — accuracy beats volume.\n\nPractice: Read Al-Fatiha and mark every natural madd with a pencil. Recite once, stretching only those.',
      },
      {
        heading: 'Qalqalah lightly',
        body: 'Qalqalah is a light bounce on ق ط ب ج د when they carry sukoon. Soften it; do not punch the letter. It should sound clear, not harsh.\n\nPractice: Recite a short ayah containing ق and ب with sukoon, then record yourself and compare to a trusted qari.',
      },
    ],
  },
  {
    id: 'lib_3',
    title: 'Building a First Hifz Routine',
    author: 'Ustadha Fatima Noor',
    kind: 'article',
    topic: 'hifz',
    summary:
      'A practical weekly rhythm: new portion, same-day revision, and a protected review block.',
    language: 'English',
    readingMinutes: 10,
    coverColor: '#be185d',
    coverImage: '/covers/hifz-routine.png',
    format: 'text',
    pages: [
      {
        heading: 'Three baskets',
        body: 'Separate your time into three baskets: New (what you memorize today), Recent (the last week), and Distant (everything older). Most students fail by ignoring Distant until it collapses.\n\nRule of thumb: Never add New if Distant is overdue.',
      },
      {
        heading: 'Keep New small',
        body: 'Five clean lines remembered well beat a page half-remembered. End your New session by reciting the portion from memory twice without looking.\n\nIf you stumble twice, shorten tomorrow’s New portion.',
      },
      {
        heading: 'A sample week',
        body: 'Sat–Thu: 15 minutes New + 20 minutes Recent/Distant. Fri: revision only.\n\nWrite the plan on paper. A written routine beats a hopeful mood.',
      },
    ],
  },
  {
    id: 'lib_5',
    title: 'Adab of Seeking Knowledge',
    author: 'Classical notes (adapted)',
    kind: 'essay',
    topic: 'adab',
    summary:
      'Manners with teachers, books, and classmates — the etiquette that makes learning barakah-filled.',
    language: 'English',
    readingMinutes: 7,
    coverColor: '#b45309',
    coverImage: '/covers/adab.png',
    format: 'text',
    pages: [
      {
        heading: 'Before the lesson',
        body: 'Arrive prepared. Review yesterday’s notes. Make wudu if you can. Intention first: seek knowledge for Allah, then to benefit your family and community.',
      },
      {
        heading: 'With the teacher',
        body: 'Listen fully before you speak. Ask questions that show you tried. Do not interrupt to display what you know. Correct your own notes privately after class if needed.',
      },
      {
        heading: 'With books',
        body: 'Treat a mushaf and beneficial books with care. Do not place them on the floor. When you finish a sitting, close with a short dua of gratitude.',
      },
    ],
  },
]
