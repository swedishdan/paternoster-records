/* Páternoster — catalogue data.
   Every artist, label and record here is fictional. */
(function () {
  'use strict';

  // cover styles: teige | grid | glow | lines | type | sun | collage
  // audio presets: see audio.js
  const NEW = [
    {
      id: 'pe009', cabin: 1, artist: 'Helena Mrázová', title: 'Noční provoz', en: 'Night Service',
      label: 'Páternoster Edice', cat: 'PE-009', year: 2026, orig: 1986, country: 'CZ', format: 'LP',
      genre: 'elektronika', tag: 'Minimal wave', price: 790, edice: true,
      note: 'Recorded on a borrowed Tesla deck in a panel flat in Jižní Město.',
      by: 'Marta',
      tracks: [['A1', 'Noční provoz', '4:12'], ['A2', 'Linka 177', '3:38'], ['A3', 'Sídliště ve snu', '5:02'], ['B1', 'Kontrolor', '3:20'], ['B2', 'Zelená vlna', '4:44'], ['B3', 'Poslední spoj', '6:10']],
      cover: { style: 'grid', ink: ['#E24A33', '#1B1C1A'], paper: '#E9E4D6' },
      audio: { preset: 'synthpop', bpm: 112, root: 45 }
    },
    {
      id: 'ot031', cabin: 2, artist: 'Kosmonaut Bureau', title: 'Telemetry for Beginners', en: null,
      label: 'Orbita Tapes', cat: 'OT-031', year: 2026, country: 'CZ', format: 'LP',
      genre: 'elektronika', tag: 'Kosmische', price: 690,
      note: 'Two brothers from Plzeň and a synthesiser they refuse to name.',
      by: 'Jonáš',
      tracks: [['A1', 'Countdown (Abridged)', '2:10'], ['A2', 'Telemetry', '7:45'], ['A3', 'Low Orbit Waltz', '6:02'], ['B1', 'Re-entry', '19:40']],
      cover: { style: 'lines', ink: ['#1D3BC4', '#F0EBDD'], paper: '#0F1013' },
      audio: { preset: 'kosmische', bpm: 96, root: 38 }
    },
    {
      id: 'pe007', cabin: 3, artist: 'Ondřej Vlk Kvartet', title: 'Mosty přes nic', en: 'Bridges over Nothing',
      label: 'Páternoster Edice', cat: 'PE-007', year: 2025, orig: 1972, country: 'CZ', format: 'LP',
      genre: 'jazz', tag: 'Modal jazz', price: 890, edice: true,
      note: 'Taped in one night for the radio, then shelved for fifty years.',
      by: 'Marta',
      tracks: [['A1', 'Mosty přes nic', '8:14'], ['A2', 'Karlín v dešti', '6:30'], ['B1', 'Smíchovská', '9:02'], ['B2', 'Ticho po bouři', '5:48']],
      cover: { style: 'teige', ink: ['#C8432B', '#141512'], paper: '#E6DFCB' },
      audio: { preset: 'jazz', bpm: 132, root: 41 }
    },
    {
      id: 'ru12', cabin: 4, artist: 'Žižkov Tape Club', title: 'Pavlač', en: 'The Balcony',
      label: 'Ruina', cat: 'RU-12', year: 2026, country: 'CZ', format: '12″ EP',
      genre: 'elektronika', tag: 'Lo-fi house', price: 450,
      note: 'House music recorded on a courtyard balcony.',
      by: 'Jonáš',
      tracks: [['A1', 'Pavlač', '6:40'], ['A2', 'Prádlo', '5:55'], ['B1', 'Sousedé', '6:12'], ['B2', 'Ždímání', '7:01']],
      cover: { style: 'collage', ink: ['#2E6B4F', '#E0B43A'], paper: '#DCD6C6' },
      audio: { preset: 'house', bpm: 122, root: 43 }
    },
    {
      id: 'hl004', cabin: 5, artist: 'Sněť', title: 'Rez', en: 'Rust',
      label: 'Hluk', cat: 'HL-004', year: 2025, country: 'CZ', format: 'LP',
      genre: 'kytary', tag: 'Post-punk', price: 620,
      note: 'One bass, two broken amps, no patience.',
      by: 'Jonáš',
      tracks: [['A1', 'Rez', '2:48'], ['A2', 'Ocel', '3:12'], ['A3', 'Zápach z továrny', '2:55'], ['B1', 'Dělník', '3:40'], ['B2', 'Komín', '4:20'], ['B3', 'Rez II', '5:01']],
      cover: { style: 'type', ink: ['#B8452A', '#121311'], paper: '#B9B3A3' },
      audio: { preset: 'postpunk', bpm: 148, root: 40 }
    },
    {
      id: 'ml02', cabin: 6, artist: 'Tereza Konopná', title: 'Pod hladinou', en: 'Below the Surface',
      label: 'Mělčina', cat: 'ML-02', year: 2026, country: 'CZ', format: 'LP',
      genre: 'klid', tag: 'Ambient / field recording', price: 740,
      note: 'Hydrophone recordings from the Vltava under Palackého most, slowed down and left alone.',
      by: 'Marta',
      tracks: [['A1', 'Pod hladinou', '11:20'], ['A2', 'Pilíř', '8:05'], ['B1', 'Proud', '19:30']],
      cover: { style: 'glow', ink: ['#6FA3A0', '#E8E2D0'], paper: '#0E1615' },
      audio: { preset: 'ambient', bpm: 60, root: 38 }
    },
    {
      id: 'pe011', cabin: 8, artist: 'Studio Rakovník Orchestra', title: 'Library Music Vol. 3', en: 'Industry & Leisure',
      label: 'Páternoster Edice', cat: 'PE-011', year: 2026, orig: 1979, country: 'CS', format: 'LP',
      genre: 'jazz', tag: 'Library music', price: 790, edice: true,
      note: 'Written for factory documentaries and weather reports on state television.',
      by: 'Marta',
      tracks: [['A1', 'Industry I', '2:00'], ['A2', 'Rolling Mill', '1:45'], ['A3', 'Leisure on the Dam', '2:30'], ['A4', 'Synthetic Fibres', '1:52'], ['B1', 'Weather over Moravia', '2:15'], ['B2', 'Holiday Camp', '2:02'], ['B3', 'Industry II', '3:10']],
      cover: { style: 'sun', ink: ['#D9842B', '#24443A'], paper: '#E8DFC7' },
      audio: { preset: 'library', bpm: 104, root: 43 }
    },
    {
      id: 'ot029', cabin: 9, artist: 'Lukáš Hořejší', title: 'Dálnice D1', en: 'Motorway D1',
      label: 'Orbita Tapes', cat: 'OT-029', year: 2026, country: 'CZ', format: 'LP',
      genre: 'elektronika', tag: 'Motorik', price: 690,
      note: 'Recorded in a Škoda Favorit between Prague and Brno.',
      by: 'Jonáš',
      tracks: [['A1', 'Exit 21 Mirošovice', '7:32'], ['A2', 'Humpolec', '6:10'], ['B1', 'Velké Meziříčí', '9:45'], ['B2', 'Brno-centrum', '5:30']],
      cover: { style: 'lines', ink: ['#E4B321', '#151515'], paper: '#D8D2C2', variant: 1 },
      audio: { preset: 'motorik', bpm: 128, root: 40 }
    },
    {
      id: 'hl005', cabin: 10, artist: 'Mlha', title: 'Bubny', en: 'Drums (the old station)',
      label: 'Hluk', cat: 'HL-005', year: 2026, country: 'CZ', format: '2LP',
      genre: 'klid', tag: 'Dub techno', price: 950,
      note: 'Dub techno named after the derelict station in Holešovice.',
      by: 'Jonáš',
      tracks: [['A1', 'Nástupiště 1', '9:12'], ['B1', 'Nástupiště 2', '8:40'], ['C1', 'Výpravčí', '10:05'], ['D1', 'Bez vlaku', '12:30']],
      cover: { style: 'glow', ink: ['#7C8A96', '#C9C3B4'], paper: '#121417', variant: 1 },
      audio: { preset: 'dub', bpm: 118, root: 36 }
    },
    {
      id: 'ru14', cabin: 11, artist: 'Eliška Brabcová & the Dispatchers', title: 'Signál', en: 'Signal',
      label: 'Ruina', cat: 'RU-14', year: 2026, country: 'CZ', format: 'LP',
      genre: 'kytary', tag: 'Soul', price: 790,
      note: 'She dispatches trams by day and sings like the last one home is waiting for her.',
      by: 'Marta',
      tracks: [['A1', 'Signál', '3:44'], ['A2', 'Výhybka', '3:10'], ['A3', 'Noční linka', '4:28'], ['B1', 'Vozovna', '3:52'], ['B2', 'Poslední zastávka', '5:15']],
      cover: { style: 'teige', ink: ['#1F4FA8', '#D7432C'], paper: '#ECE5D4', variant: 1 },
      audio: { preset: 'soul', bpm: 96, root: 45 }
    },
    {
      id: 'ac01', cabin: 12, artist: 'The Brno Accord', title: 'Vacuum Tubes', en: null,
      label: 'Accord', cat: 'AC-01', year: 2026, country: 'CZ / AT', format: 'LP',
      genre: 'jazz', tag: 'Jazz-funk', price: 720,
      note: 'Six players, two cities, one valve amplifier that caught fire during track four.',
      by: 'Jonáš',
      tracks: [['A1', 'Warm Up', '1:58'], ['A2', 'Vacuum Tubes', '5:40'], ['A3', 'Špilberk Shuffle', '4:22'], ['B1', 'Track Four (Fire)', '6:03'], ['B2', 'Cool Down', '4:50']],
      cover: { style: 'grid', ink: ['#2B6E5C', '#E07A2F'], paper: '#E4DDCB', variant: 1 },
      audio: { preset: 'funk', bpm: 104, root: 43 }
    },
    {
      id: 'pe010', cabin: 13, artist: 'Anna Kolářová', title: 'Tramvaj 22', en: 'Tram 22',
      label: 'Páternoster Edice', cat: 'PE-010', year: 2026, country: 'CZ', format: '7″',
      genre: 'kytary', tag: 'Chanson / indie', price: 290, edice: true,
      note: 'Side A goes up to the Castle. Side B is the ride home.',
      by: 'Marta',
      tracks: [['A', 'Tramvaj 22 (nahoru)', '3:31'], ['B', 'Tramvaj 22 (dolů)', '3:58']],
      cover: { style: 'type', ink: ['#C33A2A', '#1A1A18'], paper: '#E8E1CF', variant: 1 },
      audio: { preset: 'chanson', bpm: 88, root: 47 }
    }
  ];

  // Second-hand crate. Grades: media / sleeve (Goldmine scale).
  const BAZAR_SECTIONS = [
    { key: 'bigbit', cs: 'Beat', en: 'Czech beat, 1963–71' },
    { key: 'jazz', cs: 'Jazz', en: 'Radio bands & small groups' },
    { key: 'elektronika', cs: 'Electronic', en: 'Oscillators, early synths' },
    { key: 'disko', cs: 'Disco & Pop', en: 'Hotel bars, TV stars' },
    { key: 'film', cs: 'Film & TV', en: 'Soundtracks & idents' },
    { key: 'divne', cs: 'Odd', en: 'Very odd' }
  ];

  const BAZAR = [
    { id: 'b1', sec: 'bigbit', artist: 'Elektra Beat', title: 'Bigbít na dvoře', en: 'Courtyard Beat', label: 'Melodie', cat: 'MEL 1 13 0447', year: 1968, country: 'CS', format: 'LP', media: 'VG+', sleeve: 'VG', price: 1450,
      note: 'Somebody wrote “PAVEL!!” on the back in biro. We left it.', by: 'Jonáš', wear: { ring: .7, writing: 'PAVEL!!', seam: false },
      tracks: [['A1', 'Bigbít na dvoře', '2:31'], ['A2', 'Holky z Vršovic', '2:12'], ['A3', 'Kytara v kufru', '2:48'], ['B1', 'Léto bez konce', '3:05'], ['B2', 'Twist u Vltavy', '2:20']],
      cover: { style: 'collage', ink: ['#D1402A', '#1C4E8C'], paper: '#E3D6B8' }, audio: { preset: 'beat', bpm: 152, root: 40 } },
    { id: 'b2', sec: 'bigbit', artist: 'Kométy', title: 'Ve stínu katedrály', en: 'In the Shadow of the Cathedral', label: 'Melodie', cat: 'EP 20 0381', year: 1967, country: 'CS', format: '7″ EP', media: 'VG', sleeve: 'VG−', price: 380,
      note: 'Four songs, one fuzz pedal, built by the guitarist from a radio kit.', by: 'Jonáš', wear: { ring: .5, seam: true },
      tracks: [['A1', 'Ve stínu katedrály', '2:44'], ['A2', 'Kometa', '2:10'], ['B1', 'Noc na Kampě', '2:58'], ['B2', 'Šedá', '2:30']],
      cover: { style: 'sun', ink: ['#E1A12C', '#2A2622'], paper: '#D6CBB0', variant: 1 }, audio: { preset: 'beat', bpm: 138, root: 45 } },
    { id: 'b3', sec: 'bigbit', artist: 'Petra Jarošová', title: 'Holka z Libně', en: 'Girl from Libeň', label: 'Melodie', cat: 'MEL 1 13 0612', year: 1969, country: 'CS', format: 'LP', media: 'VG+', sleeve: 'VG+', price: 890,
      note: 'Her only album before she moved to Vienna and stopped singing.', by: 'Marta', wear: { ring: .25 },
      tracks: [['A1', 'Holka z Libně', '2:50'], ['A2', 'Na nábřeží', '3:12'], ['A3', 'Psaní', '2:40'], ['B1', 'Odjezd', '3:30'], ['B2', 'Vídeň', '4:01']],
      cover: { style: 'teige', ink: ['#B8364A', '#1E1E1E'], paper: '#E9DCC4', variant: 2 }, audio: { preset: 'chanson', bpm: 112, root: 45 } },
    { id: 'b4', sec: 'bigbit', artist: 'Dívčí kvartet Atlas', title: 'Twist v Karlíně', en: 'Twist in Karlín', label: 'Melodie', cat: 'EP 20 0217', year: 1964, country: 'CS', format: '7″ EP', media: 'VG', sleeve: 'VG', price: 420,
      note: 'Four sisters, close harmonies, a drummer borrowed from the fire brigade band.', by: 'Marta', wear: { ring: .6 },
      tracks: [['A1', 'Twist v Karlíně', '2:05'], ['A2', 'Pondělí', '2:20'], ['B1', 'Atlas', '2:14'], ['B2', 'Dobrou noc', '2:40']],
      cover: { style: 'grid', ink: ['#E05B3A', '#1D5A8A'], paper: '#E8DDC3', variant: 2 }, audio: { preset: 'beat', bpm: 160, root: 48 } },

    { id: 'j1', sec: 'jazz', artist: 'Jiří Šťastný Sextet', title: 'Hlavní nádraží 5:40', en: 'Main Station 5:40', label: 'Melodie', cat: 'MEL 1 15 1120', year: 1974, country: 'CS', format: 'LP', media: 'NM', sleeve: 'VG+', price: 1800,
      note: 'The rare first pressing, with the track they later cut.', by: 'Marta', wear: { ring: .2 },
      tracks: [['A1', 'Hlavní nádraží 5:40', '7:10'], ['A2', 'Nástupiště', '5:22'], ['A3', 'Rychlík', '4:40'], ['B1', 'Čekárna', '8:02'], ['B2', 'Výpravčí blues', '6:15'], ['B3', 'Mimo jízdní řád', '3:58']],
      cover: { style: 'type', ink: ['#1F1F1D', '#C9452D'], paper: '#E2D9C2', variant: 2 }, audio: { preset: 'jazz', bpm: 168, root: 43 } },
    { id: 'j2', sec: 'jazz', artist: 'Radiový taneční orchestr', title: 'Večerní vysílání', en: 'Evening Broadcast', label: 'Melodie', cat: 'MEL 0 15 0098', year: 1963, country: 'CS', format: 'LP', media: 'VG', sleeve: 'G+', price: 290,
      note: 'Big band from the radio house on Vinohradská.', by: 'Jonáš', wear: { ring: .9, seam: true, writing: '17/3' },
      tracks: [['A1', 'Znělka', '0:40'], ['A2', 'Večerní vysílání', '3:20'], ['A3', 'Swing na vlnách', '3:05'], ['B1', 'Nokturno', '4:12'], ['B2', 'Konec vysílání', '2:30']],
      cover: { style: 'sun', ink: ['#2F5F8F', '#CDB27A'], paper: '#D9CFB6', variant: 2 }, audio: { preset: 'swing', bpm: 150, root: 46 } },
    { id: 'j3', sec: 'jazz', artist: 'Zuzana Holá Trio', title: 'Barevné stíny', en: 'Coloured Shadows', label: 'Melodie', cat: 'MEL 1 15 1504', year: 1978, country: 'CS', format: 'LP', media: 'VG+', sleeve: 'VG', price: 650,
      note: 'Piano trio, very spacious.', by: 'Marta', wear: { ring: .45 },
      tracks: [['A1', 'Barevné stíny', '6:40'], ['A2', 'Modrá', '5:10'], ['B1', 'Šedá hodina', '7:22'], ['B2', 'Ráno', '4:45']],
      cover: { style: 'glow', ink: ['#C46B4B', '#E3D7BE'], paper: '#1C1A18', variant: 2 }, audio: { preset: 'jazz', bpm: 96, root: 41 } },
    { id: 'j4', sec: 'jazz', artist: 'Pražské cembalo & basa', title: 'Baroque Bop', en: null, label: 'Melodie', cat: 'MEL 1 15 0870', year: 1970, country: 'CS', format: 'LP', media: 'VG+', sleeve: 'VG', price: 560,
      note: 'Harpsichord and double bass playing bebop.', by: 'Jonáš', wear: { ring: .4 },
      tracks: [['A1', 'Bach na Václaváku', '3:30'], ['A2', 'Fuga v Es', '4:02'], ['B1', 'Bop pro cembalo', '5:15'], ['B2', 'Kánon', '3:48']],
      cover: { style: 'lines', ink: ['#8A2F2A', '#E6DCC2'], paper: '#1A1917', variant: 2 }, audio: { preset: 'baroque', bpm: 140, root: 45 } },

    { id: 'e1', sec: 'elektronika', artist: 'Ostravský elektronický ansámbl', title: 'Studie I–IV', en: 'Studies I–IV', label: 'Melodie', cat: 'MEL 1 19 0033', year: 1969, country: 'CS', format: 'LP', media: 'VG+', sleeve: 'VG', price: 2400,
      note: 'Made at night with test oscillators in a radio studio.', by: 'Marta', wear: { ring: .35, stamp: true },
      tracks: [['A1', 'Studie I', '9:40'], ['A2', 'Studie II', '8:12'], ['B1', 'Studie III', '11:05'], ['B2', 'Studie IV', '7:30']],
      cover: { style: 'lines', ink: ['#E6E0D0', '#D23B26'], paper: '#131411', variant: 3 }, audio: { preset: 'tones', bpm: 70, root: 50 } },
    { id: 'e2', sec: 'elektronika', artist: 'Pavel Bureš', title: 'Akordeon v kosmu', en: 'Accordion in Space', label: 'Melodie', cat: 'MEL 1 13 1890', year: 1976, country: 'CS', format: 'LP', media: 'VG+', sleeve: 'VG+', price: 520,
      note: 'Space-age accordion with a tape echo the size of a fridge.', by: 'Jonáš', wear: { ring: .3 },
      tracks: [['A1', 'Start', '2:30'], ['A2', 'Akordeon v kosmu', '3:12'], ['A3', 'Beztíže', '3:40'], ['B1', 'Měsíční polka', '2:50'], ['B2', 'Návrat', '4:05']],
      cover: { style: 'sun', ink: ['#E85D3A', '#1B2E5A'], paper: '#EBDFC4', variant: 3 }, audio: { preset: 'spacepop', bpm: 116, root: 45 } },
    { id: 'e3', sec: 'elektronika', artist: 'Synthi Praha', title: 'Rytmy pro práci', en: 'Rhythms for Work', label: 'Melodie', cat: 'MEL 1 19 2210', year: 1984, country: 'CS', format: 'LP', media: 'NM', sleeve: 'NM', price: 980,
      note: 'Commissioned to raise productivity on factory floors.', by: 'Jonáš', wear: { ring: .1 },
      tracks: [['A1', 'Ranní směna', '4:20'], ['A2', 'Pás', '5:05'], ['B1', 'Odpolední směna', '4:48'], ['B2', 'Noční směna', '6:30']],
      cover: { style: 'grid', ink: ['#D23B26', '#E9E2CF'], paper: '#171816', variant: 3 }, audio: { preset: 'synthpop', bpm: 120, root: 40 } },
    { id: 'e4', sec: 'elektronika', artist: 'Laboratoř zvuku ČSAV', title: 'Signály', en: 'Signals', label: 'Melodie', cat: 'SP 0 19 0007', year: 1972, country: 'CS', format: '7″', media: 'VG+', sleeve: 'VG', price: 680,
      note: 'Test signals from a research institute.', by: 'Marta', wear: { ring: .3, stamp: true },
      tracks: [['A', 'Signál 1 kHz', '5:00'], ['B', 'Rozmítání 20 Hz–20 kHz', '4:30']],
      cover: { style: 'type', ink: ['#141512', '#2E7A5E'], paper: '#DCD6C4', variant: 3 }, audio: { preset: 'tones', bpm: 60, root: 57 } },

    { id: 'd1', sec: 'disko', artist: 'Disco Interhotel', title: 'Interhotel Nights', en: null, label: 'Melodie', cat: 'MEL 1 13 2655', year: 1981, country: 'CS', format: 'LP', media: 'VG+', sleeve: 'VG', price: 750,
      note: 'The house band of a hotel chain, playing to tourists in Brno and Karlovy Vary.', by: 'Jonáš', wear: { ring: .55 },
      tracks: [['A1', 'Recepce', '4:30'], ['A2', 'Interhotel Nights', '6:12'], ['B1', 'Bar Panorama', '5:40'], ['B2', 'Pokoj 512', '5:05']],
      cover: { style: 'lines', ink: ['#E7B53C', '#B83A62'], paper: '#141210', variant: 1 }, audio: { preset: 'disco', bpm: 120, root: 41 } },
    { id: 'd2', sec: 'disko', artist: 'Věra Plachá', title: 'Zlaté kapky', en: 'Golden Drops', label: 'Melodie', cat: 'MEL 1 13 0990', year: 1971, country: 'CS', format: 'LP', media: 'VG', sleeve: 'VG', price: 190,
      note: 'Every grandmother in Bohemia owned this. They were right.', by: 'Marta', wear: { ring: .8, writing: 'for Mum' },
      tracks: [['A1', 'Zlaté kapky', '3:02'], ['A2', 'Jaro v Praze', '2:50'], ['B1', 'Slunce', '3:15'], ['B2', 'Dopis', '3:40']],
      cover: { style: 'sun', ink: ['#E3A92E', '#8C2F3A'], paper: '#EADCC0', variant: 2 }, audio: { preset: 'chanson', bpm: 100, root: 48 } },
    { id: 'd3', sec: 'disko', artist: 'Lední revue', title: 'Hvězdy na ledě', en: 'Stars on Ice', label: 'Melodie', cat: 'MEL 1 13 2010', year: 1979, country: 'CS', format: 'LP', media: 'VG+', sleeve: 'VG', price: 340,
      note: 'Soundtrack to a touring ice show.', by: 'Jonáš', wear: { ring: .5 },
      tracks: [['A1', 'Předehra na ledě', '3:20'], ['A2', 'Piruety', '4:10'], ['B1', 'Hvězdy', '4:40'], ['B2', 'Finále', '3:55']],
      cover: { style: 'glow', ink: ['#9FC3D9', '#E6E1D5'], paper: '#16222E', variant: 3 }, audio: { preset: 'disco', bpm: 124, root: 46 } },
    { id: 'd4', sec: 'disko', artist: 'Orchestr hotelu Zlatá kotva', title: 'Bar Alfa', en: null, label: 'Melodie', cat: 'MEL 1 13 2402', year: 1980, country: 'CS', format: 'LP', media: 'VG+', sleeve: 'VG', price: 260,
      note: 'Lounge disco for a hotel bar with mirrored walls.', by: 'Marta', wear: { ring: .4 },
      tracks: [['A1', 'Bar Alfa', '4:40'], ['A2', 'Zrcadla', '3:58'], ['B1', 'Půlnoc', '5:10'], ['B2', 'Účet, prosím', '3:30']],
      cover: { style: 'collage', ink: ['#2B7A6B', '#DA5A3A'], paper: '#E4D8BE', variant: 1 }, audio: { preset: 'disco', bpm: 112, root: 43 } },

    { id: 'f1', sec: 'film', artist: 'Vilém Šrámek', title: 'Muž, který prodal Měsíc', en: 'The Man Who Sold the Moon (OST)', label: 'Melodie', cat: 'MEL 1 17 1330', year: 1977, country: 'CS', format: 'LP', media: 'VG+', sleeve: 'VG', price: 1100,
      note: 'Score for a film that was banned for six weeks and then shown on television every Christmas.', by: 'Marta', wear: { ring: .4 },
      tracks: [['A1', 'Hlavní titul', '2:40'], ['A2', 'Prodej', '3:30'], ['A3', 'Pustá krajina', '4:12'], ['B1', 'Měsíc nad Prahou', '5:20'], ['B2', 'Závěrečné titulky', '3:00']],
      cover: { style: 'sun', ink: ['#E8E0C8', '#B23A2E'], paper: '#141618', variant: 4 }, audio: { preset: 'score', bpm: 72, root: 41 } },
    { id: 'f2', sec: 'film', artist: 'Různí interpreti', title: 'Přestávka', en: 'Intermission: TV Interlude Music, 1972', label: 'Melodie', cat: 'MEL 1 17 0540', year: 1972, country: 'CS', format: 'LP', media: 'VG', sleeve: 'VG', price: 420,
      note: 'The music that played under the test card when the signal went down.', by: 'Jonáš', wear: { ring: .6 },
      tracks: [['A1', 'Přestávka 1', '1:30'], ['A2', 'Přestávka 4', '1:12'], ['A3', 'Monoskop', '2:00'], ['B1', 'Porucha', '1:45'], ['B2', 'Omlouváme se', '1:20']],
      cover: { style: 'grid', ink: ['#3B7FB6', '#E6B533'], paper: '#E3DBC6', variant: 4 }, audio: { preset: 'library', bpm: 92, root: 48 } },
    { id: 'f3', sec: 'film', artist: 'Jan Rybář', title: 'Hudba k loutkovým filmům', en: 'Music for Puppet Films 1958–65', label: 'Melodie', cat: 'MEL 1 17 0210', year: 1966, country: 'CS', format: 'LP', media: 'VG', sleeve: 'VG', price: 880,
      note: 'Clarinets, celesta and a glockenspiel, for stop-motion films about clocks, kings and tin soldiers.', by: 'Marta', wear: { ring: .5 },
      tracks: [['A1', 'Hodinář', '3:10'], ['A2', 'Král a pták', '2:44'], ['B1', 'Plecháček', '3:30'], ['B2', 'Noc v dílně', '4:02']],
      cover: { style: 'collage', ink: ['#C44A2B', '#2F4C7E'], paper: '#E9DEC6', variant: 2 }, audio: { preset: 'music-box', bpm: 108, root: 57 } },
    { id: 'f4', sec: 'film', artist: 'Ivo Kalina', title: 'Kapitán Ponorka', en: 'Captain Submarine (TV OST)', label: 'Melodie', cat: 'MEL 1 17 2280', year: 1983, country: 'CS', format: 'LP', media: 'VG', sleeve: 'G+', price: 260,
      note: 'A previous owner drew a crayon submarine on the back.', by: 'Jonáš', wear: { ring: .8, writing: '~~~', seam: true },
      tracks: [['A1', 'Znělka', '0:55'], ['A2', 'Ponor', '2:30'], ['B1', 'Na dně', '3:10'], ['B2', 'Vynoření', '2:20']],
      cover: { style: 'teige', ink: ['#E2B72F', '#1C5C7E'], paper: '#E6DCC5', variant: 3 }, audio: { preset: 'synthpop', bpm: 130, root: 48 } },

    { id: 'o1', sec: 'divne', artist: 'Zvukový archiv', title: 'Zvuky domácnosti', en: 'Household Sounds, Vol. 2', label: 'Melodie', cat: 'MEL 0 19 0412', year: 1975, country: 'CS', format: 'LP', media: 'VG+', sleeve: 'VG+', price: 150,
      note: 'Side B, track 4: “Refrigerator, closing.”', by: 'Jonáš', wear: { ring: .3 },
      tracks: [['A1', 'Konvice', '0:40'], ['A2', 'Vysavač', '1:10'], ['A3', 'Budík', '0:30'], ['B1', 'Dveře, panelák', '0:25'], ['B4', 'Lednička, zavírání', '0:12']],
      cover: { style: 'type', ink: ['#2C6A55', '#1A1A18'], paper: '#E6E0CE', variant: 4 }, audio: { preset: 'household', bpm: 90, root: 45 } },
    { id: 'o2', sec: 'divne', artist: 'Kurz pro samouky', title: 'Němčina, lekce 1–8', en: 'German for Self-Learners, Lessons 1–8', label: 'Melodie', cat: 'MEL 0 20 1101', year: 1980, country: 'CS', format: '2LP', media: 'VG', sleeve: 'VG', price: 120,
      note: 'Lesson 6 is about ordering coffee in Leipzig.', by: 'Marta', wear: { ring: .4, writing: 'lesson 6!' },
      tracks: [['A', 'Lekce 1–2', '18:00'], ['B', 'Lekce 3–4', '19:10'], ['C', 'Lekce 5–6', '17:40'], ['D', 'Lekce 7–8', '20:05']],
      cover: { style: 'grid', ink: ['#1F3E7A', '#C93A2E'], paper: '#E8E3D3', variant: 5 }, audio: { preset: 'tones', bpm: 60, root: 62 } },
    { id: 'o3', sec: 'divne', artist: 'Dechová hudba Zbiroh', title: 'Polky pro kosmonauty', en: 'Polkas for Cosmonauts', label: 'Melodie', cat: 'MEL 1 14 1777', year: 1978, country: 'CS', format: 'LP', media: 'VG+', sleeve: 'VG', price: 480,
      note: 'Released the year a Czechoslovak went to space.', by: 'Jonáš', wear: { ring: .5 },
      tracks: [['A1', 'Start polka', '2:40'], ['A2', 'Na oběžné dráze', '3:05'], ['B1', 'Valčík beztíže', '3:30'], ['B2', 'Přistání', '2:50']],
      cover: { style: 'sun', ink: ['#CF3B2A', '#E2B23A'], paper: '#1A2340', variant: 5 }, audio: { preset: 'polka', bpm: 126, root: 46 } },
    { id: 'o4', sec: 'divne', artist: 'Ornitologická společnost', title: 'Ptáci Šumavy', en: 'Birds of the Bohemian Forest', label: 'Melodie', cat: 'MEL 0 19 0880', year: 1974, country: 'CS', format: 'LP', media: 'VG+', sleeve: 'VG', price: 180,
      note: 'Forty-one birds, recorded at dawn, each one announced by a very serious man.', by: 'Marta', wear: { ring: .35 },
      tracks: [['A1', 'Kos', '1:10'], ['A2', 'Drozd', '1:30'], ['A3', 'Tetřev hlušec', '2:05'], ['B1', 'Sýkora', '0:55'], ['B2', 'Ranní sbor', '6:40']],
      cover: { style: 'glow', ink: ['#B9C98A', '#E6E0CC'], paper: '#16201A', variant: 4 }, audio: { preset: 'birds', bpm: 60, root: 72 } }
  ];

  // Cabin Sessions — dated relative to today, always the next six.
  const SESSION_TEMPLATES = [
    { dow: 4, time: '19:00', artist: 'Tereza Konopná', what: 'Hydrophones, live, one cabin.', laps: 12, seats: 24, taken: 21,
      text: 'River recordings, played back live and slowed down.' },
    { dow: 6, time: '17:00', artist: 'Žižkov Tape Club', what: 'House at 0.3 metres per second.', laps: 16, seats: 32, taken: 32,
      text: 'A four-track tape machine, a drum computer and a very small crowd.' },
    { dow: 4, time: '19:30', artist: 'Ondřej Vlk', what: 'Double bass. Standing up, obviously.', laps: 10, seats: 20, taken: 12,
      text: 'Solo bass in a cabin 92 centimetres deep.' },
    { dow: 6, time: '16:00', artist: 'Sněť', what: 'Unplugged, which for Sněť means one amp.', laps: 8, seats: 16, taken: 15,
      text: 'The loudest band we stock, in the smallest room in Prague.' },
    { dow: 4, time: '18:00', artist: 'Listening lap', what: 'Library Music Vol. 3, on headphones.', laps: 20, seats: 40, taken: 9,
      text: 'No musicians. Headphones, one record, twenty laps.' },
    { dow: 6, time: '18:30', artist: 'Eliška Brabcová', what: 'Voice and a tram bell.', laps: 12, seats: 24, taken: 6,
      text: 'Three songs per lap, and a tram bell.' }
  ];

  function upcomingSessions(now) {
    const out = [];
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let t = 0;
    for (let i = 1; i < 60 && out.length < SESSION_TEMPLATES.length; i++) {
      const day = new Date(d); day.setDate(d.getDate() + i);
      const tpl = SESSION_TEMPLATES[t];
      if (day.getDay() === tpl.dow) { out.push(Object.assign({ date: day, n: t + 1 }, tpl)); t++; }
    }
    return out;
  }

  window.PATERNOSTER_DATA = { NEW, BAZAR, BAZAR_SECTIONS, upcomingSessions };
})();
