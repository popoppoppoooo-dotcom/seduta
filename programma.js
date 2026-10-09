// Programma palestra 31 agosto - 19 dicembre 2026, ricavato da
// Google Drive/Assistenti/Palestra/programma-attuale.txt e stato.md.
// Il coach (o un agente) modifica SOLO questo file; la pagina e il motore no.
// kg: null = "da testare": la pagina chiede il carico alla prima seduta.
globalThis.PROGRAMMA = {
  versione: "2026-10-12c",
  // Carichi di riferimento di squat (X) e stacco (Y): test della settimana 1.
  // Stacco: dal 9 ottobre la tabella riparte da 90 (settimane 5-6 riscritte con il reale),
  // poi +2,5 a settimana.
  base: { squat: 100, stacco: 90, trazioniMax: 7 },
  // Obiettivi della settimana 16 (14-19 dicembre). ids: dove contano le serie.
  obiettivi: [
    { nome: "Trazioni", tipo: "trazioni", rip: 12, ids: ["A.trazioni", "B.trazioni", "C.trazioni"] },
    { nome: "Squat", kg: 130, rip: 3, ids: ["A.squat"] },
    { nome: "Stacco", kg: 115, rip: 3, ids: ["C.stacco"], nota: "120 se la schiena resta a 0-1 su 10" },
    { nome: "Panca manubri", kg: 28, rip: 8, inc: 2, ids: ["B.panca", "C.panca"] },
    { nome: "Alzate laterali", kg: 14, rip: 12, inc: 2, ids: ["A.laterali", "B.laterali", "C.laterali", "C.lateraliExtra", "D.laterali"] }
  ],
  // Trazioni: traz = [serie, tetto della prima serie]. Senza storia si parte dal 65%
  // dell'ultimo massimale (test registrato o trazioniMax), minimo 3; poi scala serie per serie.

  // onda (dalla settimana 7): "F" = settimana di forza, in B la panca apre la seduta, da sola,
  // pesante (4 x 5-6); "I" = settimana di ipertrofia, panca 4 x 8-10 come prima.
  // Scarico, rifinitura e test non hanno onda: si usa la versione "I".
  // Una riga per settimana. acc = range di ripetizioni degli accessori che
  // seguono il calendario; rir = [minimo, massimo] previsto; traz = trazioni.
  settimane: [
    { n: 1,  inizio: "2026-08-31", blocco: "Base",   acc: [8, 12], rir: [2, 3], traz: [4, 5], squat: "test", stacco: "test", salti: [3, 3] },
    { n: 2,  inizio: "2026-09-07", blocco: "Base",   acc: [8, 12], rir: [2, 3], traz: [4, 5], squat: [3, 5, 0],    stacco: [3, 5, 0],    salti: [3, 3] },
    { n: 3,  inizio: "2026-09-14", blocco: "Base",   acc: [8, 12], rir: [2, 3], traz: [4, 6], squat: [3, 5, 2.5],  stacco: [3, 5, 5],    salti: [4, 3] },
    { n: 4,  inizio: "2026-09-21", blocco: "Base",   acc: [8, 12], rir: [2, 2], traz: [4, 6], squat: [3, 5, 5],    stacco: [3, 5, 10],   salti: [4, 3], nota: "Test trazioni a fine settimana: una sola serie a cedimento." },
    { n: 5,  inizio: "2026-09-28", blocco: "Base",   acc: [8, 12], rir: [2, 2], traz: [4, 6], squat: [3, 5, 7.5],  stacco: [3, 5, 0],   salti: [4, 3] },
    { n: 6,  inizio: "2026-10-05", blocco: "Deload", acc: [8, 10], rir: [4, 4], traz: [3, 5], squat: [2, 5, 2.5],  stacco: [2, 5, -5],  salti: null, deload: true, nota: "Deload: niente salti, niente tecniche." },
    { n: 7,  inizio: "2026-10-12", blocco: "Forza", onda: "F",  acc: [6, 10],  rir: [1, 2], traz: [4, 8], squat: [4, 4, 10],   stacco: [3, 4, 2.5],   salti: [5, 3], balzi: true, nota: "Inizia il blocco Forza. In C: panca piana al posto dell'inclinata, più i balzi." },
    { n: 8,  inizio: "2026-10-19", blocco: "Forza", onda: "I",  acc: [6, 10],  rir: [1, 2], traz: [4, 8], squat: [4, 4, 12.5], stacco: [3, 4, 5], salti: [5, 3], balzi: true },
    { n: 9,  inizio: "2026-10-26", blocco: "Forza", onda: "F",  acc: [6, 10],  rir: [1, 2], traz: [4, 8], squat: [4, 4, 15],   stacco: [3, 4, 7.5],   salti: [5, 3], balzi: true, trazTestIn: "B", nota: "Test trazioni in B: una sola serie a cedimento al posto delle serie normali." },
    { n: 10, inizio: "2026-11-02", blocco: "Forza", onda: "I",  acc: [6, 10],  rir: [1, 1], traz: [4, 9], squat: [4, 4, 17.5], stacco: [3, 4, 10], salti: [5, 3], balzi: true },
    { n: 11, inizio: "2026-11-09", blocco: "Forza", onda: "F",  acc: [6, 10],  rir: [1, 1], traz: [4, 9], squat: [4, 4, 20],   stacco: [3, 4, 12.5],   salti: [5, 3], balzi: true },
    { n: 12, inizio: "2026-11-16", blocco: "Deload", acc: [8, 10],  rir: [4, 4], traz: [3, 5], squat: [2, 4, 12.5], stacco: [2, 4, 2.5],   salti: null, deload: true, nota: "Deload: niente salti, niente tecniche." },
    { n: 13, inizio: "2026-11-23", blocco: "Picco", onda: "F",  acc: [6, 8],  rir: [1, 1], traz: [4, 10], squat: [4, 3, 22.5], stacco: [3, 3, 17.5], salti: [4, 3], balzi: true, trazTestIn: "B", nota: "Test trazioni in B: una sola serie a cedimento al posto delle serie normali." },
    { n: 14, inizio: "2026-11-30", blocco: "Picco", onda: "I",  acc: [6, 8],  rir: [1, 1], traz: [4, 10], squat: [4, 3, 27.5], stacco: [3, 3, 20],   salti: [4, 3], balzi: true, nota: "Stop tecniche intensive." },
    { n: 15, inizio: "2026-12-07", blocco: "Taper",  acc: [6, 8],  rir: [2, 3], traz: [3, 7], squat: [2, 3, 25],   stacco: [2, 3, 15], salti: null, taper: true, nota: "Metà volume, niente salti, niente cedimento." },
    { n: 16, inizio: "2026-12-14", blocco: "Test",   acc: [6, 8],  rir: [0, 0], traz: "max",  squat: [1, 3, 30],   stacco: [1, 3, 25], salti: null, test: true, taper: true, trazTestIn: "B", testAccessori: { "B.panca": 28, "C.laterali": 14 }, nota: "Settimana dei test: lunedì A (squat 130 × 3), martedì B (prima panca 28 × 8, trazioni al massimo a fine seduta), giovedì C (stacco 115 × 3, 120 se la schiena resta a 0-1 su 10, + laterali 14 × 12). Un solo tentativo per test; accessori leggeri." }
  ],

  // tipo: bilanciere (squat, stacco) | accessorio (doppia progressione) |
  // corpo (solo ripetizioni) | trazioni | salti.
  // cal: true = nel blocco Forza/Picco usa il range "acc" della settimana.
  // I manubri (bulgari, military, rematore) restano fuori: sotto le 8 ripetizioni
  // diventano scomodi e instabili.
  // inc = incremento minimo in kg. legatoA = usa lo stesso carico di un altro esercizio.
  // da / fino = settimane in cui l'esercizio esiste.
  // Settimana da 2 sedute (il motore la riconosce quando B non ci sta più):
  // gli esercizi "aggiungi" prendono il posto di quelli "togli" e tengono la loro storia.
  dueSedute: {
    A: { togli: ["A.polpacci"], aggiungi: ["B.tricipiti"] },
    C: { togli: ["C.lateraliExtra"], aggiungi: ["B.crociInv"] }
  },

  sedute: {
    A: {
      nome: "Lower squat",
      riscaldamento: "8': bici, 10 squat liberi, 10 slanci gamba per lato, 10 ponti glutei, 2 serie a bilanciere scarico.",
      esercizi: [
        { id: "A.salti", n: "0", nome: "Salti verticali", tipo: "salti", nota: "Recupero completo. Appena perdi altezza o l'atterraggio diventa rumoroso, chiudi." },
        { id: "A.trazioni", n: "1", nome: "Trazioni", tipo: "trazioni", nota: "Valgono solo a ROM identico alla prima ripetizione." },
        { id: "A.squat", n: "2", nome: "Squat bilanciere", tipo: "bilanciere", lift: "squat", nota: "Profondità uguale su tutte, almeno parallelo." },
        { id: "A.hack", n: "3", nome: "Hack squat", tipo: "accessorio", serie: 3, range: [10, 12], kg: 100, inc: 5, cal: true, dischiMacchina: true, nota: "Il carico è il totale dei dischi dei due lati, slitta esclusa (fino a settembre segnavi un lato solo: 50 = 100 di oggi)." },
        { id: "A.bulgari", n: "4A", nome: "Affondi bulgari", tipo: "accessorio", serie: 2, range: [8, 10], kg: 10, inc: 2, perLato: true, fino: 6, nota: "Primi da tagliare se il recupero è stretto." },
        { id: "A.legcurl", n: "4A", nome: "Leg curl seduto", tipo: "accessorio", serie: 3, range: [10, 12], kg: null, inc: 5, da: 7, nota: "Seduto se c'è. In superserie con il knee raise. Ritorno lento. Prende il posto dei bulgari: le gambe sono già il tuo punto forte." },
        { id: "A.knee", n: "4B", nome: "Hanging knee raise", tipo: "corpo", serie: 2, range: [15, 15], nota: "Porta il pube verso lo sterno (bacino che si arrotola), non solo le ginocchia in su. Quando 2 × 15 così è facile, passa a gambe tese." },
        { id: "A.laterali", n: "5A", nome: "Alzate laterali", tipo: "accessorio", serie: 3, range: [12, 15], kg: 10, inc: 2 },
        { id: "A.polpacci", n: "5B", nome: "Polpacci macchina", tipo: "accessorio", serie: 2, range: [12, 15], kg: 65, inc: 5, nota: "In superserie con le laterali." }
      ]
    },
    B: {
      nome: "Upper spinta",
      riscaldamento: "6': vogatore, band pull-apart, rotazioni spalle.",
      esercizi: [
        { id: "B.pancaF", n: "0", nome: "Panca piana manubri pesante", tipo: "accessorio", serie: 4, range: [5, 6], kg: 24, inc: 2, rirMin: 2, onda: "F", nota: "Settimana di forza: per prima, da sola, recupero 2-3 minuti. Manubri appoggiati sulle cosce e portati su rotolando indietro. Partenza 24 kg, stimata dal tuo 22 × 10. Storia a parte: non cambia il carico della panca 8-10." },
        { id: "B.trazioni", n: "0", nome: "Trazioni", tipo: "trazioni", nota: "Valgono solo a ROM identico alla prima ripetizione." },
        { id: "B.panca", n: "1", nome: "Panca piana manubri", tipo: "accessorio", serie: 4, range: [8, 10], kg: 20, inc: 2, onda: "I", nota: "Resta 8-10 in ogni blocco. +2 kg solo dopo 4 x 10 con RIR almeno 1 su tutte. Scapole addotte e depresse, gomiti a 45-60 gradi." },
        { id: "B.lat", n: "2A", nome: "Lat machine", tipo: "accessorio", serie: 3, range: [10, 12], kg: 60, inc: 5, cal: true, nota: "Fasce e presa a uncino se gli avambracci cedono." },
        { id: "B.tricipiti", n: "2B", nome: "Estensioni tricipiti sopra la testa, cavi", tipo: "accessorio", serie: 3, range: [10, 12], kg: null, inc: 2.5, nota: "Gomiti fermi, non aprirli." },
        { id: "B.pulley", n: "3A", nome: "Pulley basso", tipo: "accessorio", serie: 3, range: [10, 12], kg: 50, inc: 5, cal: true },
        { id: "B.laterali", n: "3B", nome: "Alzate laterali", tipo: "accessorio", serie: 3, range: [12, 15], kg: 12, inc: 2 },
        { id: "B.curl", n: "4A", nome: "Curl con rotazione", tipo: "accessorio", serie: 3, range: [12, 15], kg: 12, inc: 2 },
        { id: "B.crociInv", n: "4B", nome: "Croci inverse macchina", tipo: "accessorio", serie: 3, range: [12, 15], kg: null, inc: 2.5, nota: "Macchina occupata: panca inclinata 30 gradi con manubri leggeri." },
        { id: "B.pallof", n: "5", nome: "Pallof press", tipo: "accessorio", serie: 3, range: [10, 10], kg: null, inc: 2.5, perLato: true, fino: 6 },
        { id: "B.crociCavi", n: "5", nome: "Croci ai cavi dal basso", tipo: "accessorio", serie: 3, range: [12, 15], kg: 10, inc: 2.5, da: 7 }
      ]
    },
    C: {
      nome: "Full posteriore",
      riscaldamento: "8': bici, 10 stacchi a bilanciere scarico, 10 good morning a corpo libero, band pull-apart.",
      esercizi: [
        { id: "C.balzi", n: "0", nome: "Balzi in lungo", tipo: "salti", da: 7, nota: "Prima del pesante, da fresco. Chiudi appena l'atterraggio peggiora." },
        { id: "C.stacco", n: "1", nome: "Stacco da terra", tipo: "bilanciere", lift: "stacco", nota: "Prima delle trazioni: dorsali e presa freschi tengono il bilanciere vicino. Ogni ripetizione parte da terra. Se la schiena perde posizione anche solo nell'ultima, chiudi la serie. Filma di lato la seconda serie. Dolore alla schiena: tocca Dolore e chiudi l'esercizio." },
        { id: "C.trazioni", n: "2", nome: "Trazioni", tipo: "trazioni", nota: "Valgono solo a ROM identico alla prima ripetizione." },
        { id: "C.military", n: "3", nome: "Military press manubri", tipo: "accessorio", serie: 3, range: [8, 10], kg: 12, inc: 2 },
        { id: "C.rematore", n: "4A", nome: "Rematore manubrio un braccio", tipo: "accessorio", serie: 3, range: [8, 10], kg: 20, inc: 2, perLato: true, nota: "Mano e ginocchio sulla panca, schiena ferma: dopo lo stacco la schiena non deve reggere il carico." },
        { id: "C.laterali", n: "4B", nome: "Alzate laterali", tipo: "accessorio", serie: 3, range: [12, 15], kg: 10, inc: 2 },
        { id: "C.inclinata", n: "5A", nome: "Panca inclinata manubri", tipo: "accessorio", serie: 3, range: [10, 12], kg: 16, inc: 2, fino: 6 },
        { id: "C.panca", n: "5A", nome: "Panca piana manubri", tipo: "accessorio", serie: 3, range: [8, 10], kg: 20, inc: 2, legatoA: "B.panca", da: 7, nota: "Stesso carico che usi in B." },
        { id: "C.martello", n: "5B", nome: "Curl martello", tipo: "accessorio", serie: 3, range: [12, 15], kg: 12, inc: 2 },
        { id: "C.pushdown", n: "5C", nome: "Push down corda", tipo: "accessorio", serie: 2, range: [10, 15], kg: 17.5, inc: 2.5, da: 10, nota: "In superserie con il curl martello. Gomiti fermi ai fianchi." },
        { id: "C.scrollate", n: "6", nome: "Scrollate manubri", tipo: "accessorio", serie: 2, range: [15, 15], kg: 22, inc: 2, conD: true, nota: "Solo nelle settimane in cui fai anche D." },
        { id: "C.iper", n: "7", nome: "Iperestensioni 45°", tipo: "corpo", serie: 2, range: [12, 12], da: 7, nota: "Corpo libero, lente, lontano dal cedimento: spingi con i glutei, schiena neutra, niente iperestensione in alto. Servono a far reggere la schiena, non a stancarla." },
        { id: "C.lateraliExtra", n: "6", nome: "Alzate laterali (settimana senza D)", tipo: "accessorio", serie: 3, range: [12, 15], kg: 10, inc: 2, senzaD: true, legatoA: "C.laterali", nota: "Al posto delle scrollate quando salti D." }
      ]
    },
    D: {
      nome: "Richiamo (opzionale)",
      riscaldamento: "4'. Bassa fatica: niente cedimento, niente multiarticolari pesanti, niente gambe (dalla settimana 7 il leg curl è in A). Se arrivi stanco, saltala.",
      esercizi: [
        { id: "D.trazAss", n: "0", nome: "Trazioni assistite", tipo: "accessorio", serie: 2, range: [10, 12], kg: null, inc: 5, nota: "Volume extra, non contano nella progressione. Il carico è l'assistenza." },
        { id: "D.crociCavi", n: "1A", nome: "Croci ai cavi dal basso", tipo: "accessorio", serie: 3, range: [12, 15], kg: 10, inc: 2.5 },
        { id: "D.pulleyStretto", n: "1B", nome: "Pulley presa stretta", tipo: "accessorio", serie: 3, range: [12, 15], kg: 45, inc: 5 },
        { id: "D.laterali", n: "2A", nome: "Alzate laterali", tipo: "accessorio", serie: 3, range: [15, 20], kg: 10, inc: 2 },
        { id: "D.crociInv", n: "2B", nome: "Croci inverse", tipo: "accessorio", serie: 3, range: [15, 20], kg: null, inc: 2.5 },
        { id: "D.pushdown", n: "3A", nome: "Push down corda", tipo: "accessorio", serie: 3, range: [12, 15], kg: 17.5, inc: 2.5 },
        { id: "D.rotazioni", n: "3B", nome: "Rotazioni esterne ai cavi", tipo: "accessorio", serie: 2, range: [15, 15], kg: null, inc: 1, perLato: true, nota: "Carico ridicolo: servono la spalla, non il muscolo." },
        { id: "D.legcurl", n: "4", nome: "Leg curl", tipo: "accessorio", serie: 3, range: [12, 15], kg: null, inc: 5, fino: 6 }
      ]
    }
  }
};
