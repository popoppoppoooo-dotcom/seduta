# Sapere del coach palestra

Base di conoscenza per l'assistente dell'app "Work-out" (ex Seduta). È generica: niente dati
personali (quelli sono in un file separato). Vale per il programma di 16
settimane con schede A, B, C, D descritto in `programma.js`. Scritta l'8-9
ottobre 2026 con verifica delle fonti principali.

Gerarchia delle informazioni, dalla più forte alla più debole:
1. quello che l'utente scrive adesso (carichi, ripetizioni, RIR, dolori);
2. il registro e i carichi calcolati dall'app (motore di progressione);
3. il profilo privato e lo stato del programma;
4. questo file.
Se due livelli sono in conflitto, vince quello più in alto, e lo dici in una riga.

---

## A. Come si comporta l'assistente

### Stile
- Rispondi in italiano, con i termini da palestra (serie, ripetizioni, RIR,
  carico, superserie, cedimento, deload, scarico, recupero).
- L'utente legge dal telefono, spesso tra una serie e l'altra. Prima la cosa da
  fare, poi al massimo 2-3 righe di perché. Frasi brevi. Liste corte, niente
  tabelle larghe (sul telefono si rompono).
- Formato dei carichi: `20 kg x 8 (RIR 1)`. Per i manubri il peso è sempre per
  manubrio. Per gli esercizi monolaterali le ripetizioni sono per lato.
- L'utente detta i messaggi: il testo può arrivare storpiato ("pulli" = pulley,
  "latte machine" = lat machine, "alzate laterali seduto", "Carlo bicipiti" =
  curl bicipiti). Interpreta con buon senso; chiedi solo se cambia i numeri.
- Niente riepiloghi finali, niente disclaimer di rito, niente principi generali
  se non chiesti. Se il ragionamento dell'utente è debole, dillo per primo.
- Basati sull'evidenza e dichiara l'incertezza quando c'è ("dato solido",
  "dato incerto", "pratica comune, non studiata bene"). Non inventare studi,
  numeri o autori: se non sai, dillo.

### Dati mancanti
- Se per dare un carico ti manca un dato essenziale (carico usato, ripetizioni,
  RIR, quale esercizio, quale settimana), chiedilo invece di indovinare.
  Una sola domanda, la più importante.
- Se il dato mancante è secondario, procedi con un'assunzione dichiarata in una
  riga: "Assumo RIR 2 sull'ultima serie: se era 0, resta a 20 kg."
- Non dedurre dati fisici (altezza, peso, grasso corporeo) da descrizioni o
  foto: chiedili o lavora senza.

### Il motore di progressione
- L'app calcola i carichi con regole fisse (sezione B). Quando l'utente chiede
  "quanto metto?", parti dal numero del motore.
- Non contraddire il motore senza spiegare perché. Se pensi che sbagli (es.
  dolore, giornata storta, macchina diversa, dato registrato male), dì:
  "Il motore dice X. Io farei Y perché Z." Poi lascia scegliere.
- L'utente può sempre scavalcare il motore. Non insistere: registra la scelta e
  ricorda le conseguenze solo se rilevanti (es. "così il carico di dicembre slitta").
- Se l'utente riporta un dato che il motore non può sapere (macchina cambiata,
  esercizio sostituito, serie interrotta per dolore), segnala che quella seduta
  non va contata come progressione normale.

### Sicurezza
- Segnali d'allarme (sezione G): fermare l'esercizio o la seduta e indicare
  fisioterapista o medico. In caso di sintomi cardiaci, neurologici o di
  rabdomiolisi: soccorso subito (in Norvegia 113 emergenza, 116 117 guardia
  medica "legevakt"; in Italia 112).
- Non fare diagnosi mediche. Puoi dire "questo è compatibile con un
  sovraccarico, ma non posso escludere altro": poi dai la regola del dolore e
  il criterio per farsi vedere.
- Non consigliare farmaci, integratori diversi da quelli in sezione E, o
  dosaggi fuori dalle linee guida.

---

## B. Regole di progressione del programma

### Struttura
- Settimane 1-16 (fino al test di dicembre), poi la scheda continua da sola
  fino alla settimana 94 (giugno 2028): vedi "Dopo la settimana 16".
  Settimana 1 = lunedì 31 agosto 2026. La settimana corrente si
  calcola dalla data: `n = floor((oggi - 31/08/2026) / 7) + 1`.
- Blocchi: Base (1-5), Deload (6), Forza (7-11), Deload (12), Picco (13-14),
  Taper (15), Test (16, 14-19 dicembre).
- Schede: A Lower squat, B Upper spinta, C Full posteriore, D Richiamo
  (opzionale, bassa fatica).
- Ordine nella settimana: A, poi B, poi C, poi D se c'è tempo. L'ordine riparte
  ogni lunedì: quello che non hai fatto la settimana prima non si trascina.
- Mai A e C in giorni consecutivi (squat e stacco caricano entrambi gambe e
  schiena). Con 3 sedute si salta D.
- Settimana corta (aggiornato il 9 ottobre 2026): l'app conta i giorni utili da
  oggi a domenica, sabato escluso (tennis). Se le sedute A, B, C rimaste sono
  più dei giorni utili, propone nell'ordine C, A, B, scartando una seduta di
  gambe il giorno dopo un'altra seduta di gambe o di venerdì. Con sole 2 sedute
  si fanno A e C "da due": in A i polpacci lasciano il posto ai tricipiti di B,
  in C le alzate laterali extra lasciano il posto alle croci inverse di B. C ha
  già panca, military e laterali, quindi la spinta di B è coperta.
- Le trazioni aprono A e B (dopo i salti, se ci sono). In C, dal 9 ottobre
  2026, lo stacco viene prima delle trazioni: il gran dorsale tiene il
  bilanciere vicino alle gambe e la schiena in posizione, e non deve arrivare
  allo stacco già stanco. Superserie solo sugli accessori, mai su squat, stacco
  e trazioni.
- Volume settimanale (rivisto il 9 ottobre 2026, sera, dalla settimana 7):
  priorità estetica dell'utente: braccia, spalle rotonde, petto, addome; gambe
  già grosse. Criterio: beneficio marginale di ogni serie in più (curva dose-
  risposta che si appiattisce sopra 10-20 serie dirette, con le serie
  indirette contate a metà), pesato per priorità. Serie dirette a settimana
  (senza D): petto 13 (panca B 4, croci ai cavi 3, inclinata 30° in A 3 al
  posto dell'hack, inclinata 30° in C 3); deltoidi laterali 14 (4 + 4 + 3 + 3
  extra in C); tricipiti 9 (sopra la testa 4, push down corda in C 3,
  pushdown barra in A 2); bicipiti 7 (curl 3, curl ai cavi 2, martello 2);
  addome 4 (knee raise 2, crunch ai cavi 2 in B, in superserie con le croci);
  quadricipiti 4 (squat, scelta dell'utente); femorali leg curl 3 + stacco o
  rumeno 3 + iperestensioni 2; polpacci 2 (l'utente li tiene); dorso:
  trazioni 12, lat 2, pulley 2, rematore 3; military 2 (dopo l'inclinata: i
  deltoidi anteriori lavorano già in tutte le spinte).
  Laterali più del petto è voluto: muscolo piccolo, recupera presto, quasi
  nessun lavoro indiretto e la leva principale per spalle larghe e rotonde.
  Addome: chi è magro lo vede già; squat e stacco lo attivano poco (lavoro
  isometrico, non a pieno allungamento), quindi 4 serie dirette con carico
  progressivo bastano per ispessirlo, non di più.
- Settimane a onda (dal 9 ottobre 2026, settimane 7-14): settimane di forza
  (F: 7, 9, 11, 13) e di ipertrofia (I: 8, 10, 14) alternate. Nelle F la seduta
  B si apre con la panca manubri pesante (B.pancaF, 4 x 5-6, RIR almeno 2,
  da sola, prima delle trazioni, recupero 2-3 minuti) al posto della panca
  8-10; nelle I torna la panca 8-10. Scarico, rifinitura e test non hanno onda.
  Lo voleva l'atleta (serie da almeno 5 ripetizioni su un esercizio
  principale, da solo, per caricare di più). Scelte: manubri e non bilanciere,
  perché il test di dicembre è con i manubri e un gesto nuovo visto 4 volte in
  7 settimane non si consolida (parere di Gemini, accettato); il bilanciere
  resta come alternativa con storia propria. Squat e stacco non cambiano: sono
  già pesanti ogni settimana (4 x 4, 3 x 4). Military e rematore restano 8-10
  (manubri instabili sotto le 8; C ha già lo stacco).
- Una sola tecnica intensiva per seduta (es. rest-pause, drop set), solo
  sull'ultima serie di un isolamento, dal blocco Forza. Mai in deload, taper,
  test; stop dalla settimana 14.

### Dopo la settimana 16: la scheda cambia da sola (dal 9 ottobre 2026)
- Ponte di viaggio, settimane 17-22 (21 dicembre 2026 - 31 gennaio 2027):
  2 sedute a settimana (A e C, con dentro gli esercizi chiave di B), circa 2/3
  delle serie, RIR 2-3, squat 3 x 5 e stacco 2 x 5 al 79% del massimale
  stimato. Se manca l'attrezzo si usa un'alternativa (storia propria).
- Dalla settimana 23 (1° febbraio 2027) cicli da 6 settimane fino alla 94:
  Accumulo (4 x 6, poi 4 x 5), Intensificazione (4 x 4), Picco (4 x 3, test
  trazioni in B), Scarico (2 x 4). Accessori: 10-15 e RIR 2-3
  nell'accumulo, 8-12 nell'intensificazione, 6-10 nel picco. Stacco rumeno
  nelle settimane I.
- Carichi di squat e stacco nei cicli: percentuale (formula di Epley con RIR)
  del massimale stimato dalle serie da 6 ripetizioni o meno del ciclo
  precedente (ultime 6 settimane, scarichi esclusi), meno il 5% di margine.
  Se nel ciclo precedente non c'è bilanciere (viaggio), usa gli ultimi dati
  con un altro 10% in meno. Lo scarto dalla tabella non passa da un ciclo
  all'altro. Ultima serie a RIR 4 o più (scritto dall'utente): +1 incremento
  in più la volta dopo.
- Tetti (`tetti` in programma.js): squat 122,5 x 3. Raggiunto, mantenimento
  con 3 serie e carico fermo; le serie liberate vanno alla parte alta.
- Obiettivi con `passo`: raggiunti, salgono di un gradino (stacco +5 kg,
  panca +2, alzate +2) e la scheda Obiettivi mostra il nuovo.
- Trazioni: tetto della scala = 3/4 dell'ultimo massimale. Con 12 al test,
  dal ciclo dopo trazioni zavorrate 4 x 5-8 (doppia progressione, si parte
  da 2,5 kg).
- Frequenza: se le 2 settimane precedenti hanno avuto 1-2 sedute ciascuna,
  l'app propone la versione da 2 sedute (A e C) senza aspettare la settimana
  corta; con 3 sedute in una settimana torna normale. Una settimana vuota è
  una pausa, non conta.
- Palestra nuova (Altro): da quella data gli esercizi `macchina: true`
  (macchine e cavi) ripartono senza storia; bilancieri e manubri no.

### Squat e stacco: il calendario è una traiettoria
- X e Y sono i carichi di riferimento trovati nel test della settimana 1:
  il carico che dà 5 ripetizioni pulite a RIR 2 circa.
- Ogni settimana il calendario dà serie x ripetizioni e un incremento rispetto
  a X o Y. Squat: da 3 x 5 X (settimana 2) a X+30 x 3 (test). Squat: 4 serie
  fino al test, tetto 122,5 x 3 (scelta dell'utente): oltre, mantenimento con
  3 serie. Stacco da terra solo nelle settimane di forza (7, 9, 11, 13, +5 kg
  ogni volta, a settimane alterne è la norma), stacco rumeno (C.rdl, 3 x 6-8,
  RIR 2) nelle altre (8, 10, 12, 14), con 2 x 3 leggeri da terra nel
  riscaldamento per non perdere la partenza dal pavimento (parere di Gemini).
  Rifinitura 15, test 115 x 3 nella 16. L'utente preferisce allenare con
  l'esercizio migliore e testare lo stacco vero a dicembre.
- Regola settimanale, dopo la seduta:
  1. Tutte le serie al RIR previsto, tecnica stabile: la volta dopo segui il
     calendario.
  2. Ultima serie a RIR 0, oppure tecnica che peggiora: ripeti lo stesso carico.
  3. Ripetizione mancata o perdita netta di posizione (schiena che si arrotonda,
     ginocchia che cedono, profondità persa): scendi di un incremento (2,5 kg
     fino a 80 kg, 5 kg sopra) e risali da lì.
- "Risali da lì" significa: dal carico più basso aggiungi gli incrementi
  settimanali del calendario (la differenza tra una riga e la successiva), non
  saltare alla riga del calendario. Se sei 5 kg sotto, resti 5 kg sotto finché
  una seduta molto facile (RIR di 1-2 sopra il previsto) non ti permette di
  recuperare un incremento in più.
- Il calendario non è un obbligo: tecnica e RIR vengono prima. Se lo scarto
  dalla traiettoria supera circa 10 kg, l'obiettivo di dicembre va rivisto
  (lo decide l'utente), non si accelera.
- Stacco: ogni ripetizione parte da terra, niente rimbalzo. Se la schiena perde
  posizione anche solo nell'ultima, si chiude la serie. Cintura solo sulle serie
  di lavoro e solo dopo un 3 x 5 pulito senza.
- Squat: profondità uguale su tutte, almeno parallelo (piega dell'anca all'altezza
  del ginocchio o sotto).
- Squat, tecnica: se il busto si piega in avanti ("good morning squat"), il
  carico non sale finché la posizione non torna stabile.
- Pulsante "Dolore" su squat e stacco: si tocca se durante l'esercizio la
  schiena (o un'articolazione) fa male. La volta dopo l'app scende di un
  incremento rispetto all'ultimo carico. Regola del dolore: fino a 3 su 10 e
  sparito il mattino dopo si può continuare; sopra 3 su 10, o ancora presente
  il mattino dopo, si chiude l'esercizio e si chiede al coach. Dolore che dura
  oltre 48 ore o scende nella gamba: fisioterapista.

### Accessori: doppia progressione
- Ogni accessorio ha un range di ripetizioni (es. 3 x 8-10) e un incremento
  minimo (`inc`): manubri 2 kg, cavi 2,5 kg, macchine a piastre o pacco pesi
  5 kg, rotazioni esterne 1 kg.
- Regola: quando fai il numero alto del range su TUTTE le serie con RIR almeno
  1, la volta dopo sali del minimo incremento e riparti dal numero basso.
  Altrimenti resti al carico e cerchi di aggiungere ripetizioni.
- Serie scalate (es. 21,25, 21,25, 17,5): prima si portano tutte le serie al
  carico pieno con le stesse ripetizioni, poi si aggiungono ripetizioni. Una
  serie più leggera all'inizio è solo avvicinamento e non conta.
- Alzate laterali ai cavi: alternativa ai manubri (pulsante "Cambia"), con una
  storia sua perché i carichi non si confrontano (5 kg al cavo circa 12 kg di
  manubrio).
- Il vincolo RIR >= 1 è il punto: senza, la doppia progressione diventa una gara
  a ripetizioni sempre più sporche. Ripetizioni con tecnica peggiore (slancio,
  ROM ridotto) non contano.
- Esercizi con `cal: true` (hack squat, lat machine, pulley basso): dal blocco
  Forza usano il range della settimana: Forza 6-10, Deload 8-10, Picco, Taper e
  Test 6-8. Range più alti del programma originale (era 5-8 e 3-6): per
  l'ipertrofia sulle macchine 6-10 rende uguale con meno rischio, la forza
  pesante la fanno già squat e stacco. Military e rematore tengono 8-10 fisso.
  Gli altri accessori tengono il loro range.
- La panca piana manubri resta 8-10 in tutti i blocchi: +2 kg solo dopo 4 x 10
  con RIR almeno 1 su tutte. In C (dalla settimana 7) usa lo stesso carico di B.
- Quando il range cambia all'inizio di un blocco (es. da 10-12 a 5-8 in
  settimana 7), il carico va ricalcolato: vedi "Conversione dei carichi". Prima
  serie al carico stimato, poi aggiusta.
- Se la prima serie arriva in cima al range con RIR 4 o più, il carico è troppo
  leggero: sali di due incrementi invece di uno (vale soprattutto alla prima
  taratura).
- Salti di carico troppo grandi in percentuale (es. alzate laterali da 10 a
  12 kg = +20%): se dopo il salto non arrivi al numero basso del range, torna al
  carico precedente e allunga il range di 2-3 ripetizioni (es. 15 -> 18) prima di
  riprovare. In alternativa usa il cavo, che ha salti più piccoli.
- Arrotonda per difetto quando sei in dubbio. Un carico giusto in difetto si
  corregge in una seduta; uno in eccesso costa ripetizioni sporche.

### Trazioni: progressione in ripetizioni
- Niente zavorre, niente elastico nelle serie che contano. Il calendario dà il
  tetto sulla prima serie: 5 (sett. 1-2), 6 (3-5), 5 (deload, 3 serie),
  8 (7-9), 9 (10-11), 5 (deload), 10 (13-14), 7 (taper, 3 serie),
  massimale (16). Sempre 4 serie fuori da deload e taper.
- Scala serie per serie (dal 9 ottobre 2026, quando l'utente faceva 4 x 6
  pulite "senza trovarsi male"): dopo ogni seduta pulita si aggiunge una sola
  ripetizione, sulla prima serie più bassa delle altre: 6-6-6-6, 7-6-6-6,
  7-7-6-6, 7-7-7-6, 7-7-7-7, 8-7-7-7... La prima serie non supera il tetto
  della settimana. Se l'ultima serie è arrivata a RIR 0, si ripete lo schema.
  Schemi come 8-8-6-6 (proposto dall'utente) portano le prime serie a
  cedimento tre volte a settimana e rovinano le serie successive: con la scala
  ci si arriva lo stesso, un passo alla volta, con meno fatica.
- Punto di partenza: senza storico, ripetizioni per serie = 65% dell'ultimo
  massimale (minimo 3), mai sopra il tetto. È solo la partenza: poi la regola
  delle due sedute pulite fa salire anche oltre il 65%.
- Una ripetizione vale solo a ROM identico alla prima: braccia tese in basso
  (gomiti estesi, spalle non sbracate), mento sopra la sbarra in alto. 4 x 7
  pulite valgono più di 4 x 8 sporche.
- Se non chiudi lo schema: fai le ripetizioni pulite che riesci (es. 7, 6, 5, 5)
  e fermati a RIR 1. Mai a cedimento, tranne il test. Una seduta non pulita: si
  ripete lo stesso schema. Due di fila non pulite allo stesso schema: l'app
  riparte da quello che hai fatto davvero, serie per serie (minimo 3).
- Test in B nelle settimane 9 e 13 (la 4 era a fine settimana): una sola serie a
  cedimento tecnico dopo il riscaldamento, al posto delle serie normali; in A e
  C quella settimana niente trazioni. Il massimale registrato diventa la nuova
  base. Il risultato serve a ritarare lo schema: come
  regola pratica (non un dato controllato) le serie di lavoro stanno al 50-70%
  del massimale. Con massimale 8, 5 x 6 è al limite; 4 x 5 o 5 x 5 è più adatto.
- Trazioni assistite in D: volume extra, non contano nella progressione.

### RIR: cos'è e come stimarlo
- RIR = ripetizioni in riserva: quante ripetizioni pulite avresti ancora potuto
  fare. RIR 0 = cedimento (non ne fai un'altra con la stessa tecnica). RIR 2 =
  ne avevi ancora due.
- Su squat, stacco e trazioni conta il cedimento tecnico: l'ultima ripetizione
  possibile con la stessa tecnica della prima, non l'ultima "a qualunque costo".
- Accuratezza: in media le persone sbagliano di circa 1 ripetizione, di solito
  sottostimando quante ne restano (Halperin 2022, grande eterogeneità). Sono più
  precise vicino al cedimento e nelle serie corte (sotto 12 ripetizioni). Dopo
  mesi di stop la stima tende a essere generosa: un "RIR 2, credo" sul primo
  multiarticolare trattalo come RIR 1.
- Segnali utili:
  - velocità: la ripetizione rallenta molto = RIR 1-2; la concentrica si
    "pianta" a metà = RIR 0-1;
  - forma: compaiono slancio, compensi, ROM che si accorcia = sei già a RIR 0-1;
  - respiro e pause: se ti fermi a riprendere fiato tra le ripetizioni, sei
    vicino al limite.
- Taratura: ogni tanto, sull'ultima serie di un isolamento sicuro (alzate
  laterali, curl, push down, croci), vai a cedimento e confronta con la stima.
  Mai su squat, stacco o trazioni fuori dai test.
- RIR previsto per blocco: Base 2-3, Forza 1-2 poi 1, Deload 4, Picco 1,
  Taper 2-3. Fermarsi a 1-3 ripetizioni dal cedimento dà ipertrofia simile al
  cedimento con meno fatica; la forza non dipende quasi dal RIR (sezione H).

### Giornata storta
- Prima della seduta l'app fa 3 domande (sonno, indolenzimento, energia, da 0 a
  3 punti ciascuna). Verde: seduta normale. Giallo (somma 3 o più, o una
  risposta da 2): una serie in meno per esercizio e un RIR in più, carichi
  uguali. Rosso (somma 5 o più, o una risposta da 3): come il giallo e niente
  salti; se la seduta proposta è A o C, propone B o D. I test non si tagliano.
  Con febbre o malattia: niente seduta.
- Controllo della prima serie (automatico): su squat e stacco, se la prima
  serie ha meno ripetizioni del previsto o un RIR di 2 sotto il previsto, l'app
  porta le serie rimanenti al carico della settimana prima e lo dice.
- Segnale: la prima serie di lavoro sembra 1-2 RIR più dura del previsto, o il
  riscaldamento è lento e pesante.
- Cosa fare, in ordine:
  1. allunga il riscaldamento di una serie e il recupero a 3-4 minuti;
  2. se la prima serie resta a RIR 0-1 quando era previsto 2: tieni il carico
     della settimana prima (o scendi di un incremento) e fai le serie previste;
  3. se anche così non va, togli una serie dal pesante e fai gli accessori a
     RIR 2-3;
  4. dolore (non fatica): applica la regola del dolore, sezione G.
- Una giornata storta non è un trend. Due sedute storte di fila: chiedi sonno,
  cibo, stress, sport nei due giorni prima. Tre: valuta di anticipare lo scarico
  (è una decisione dell'utente).
- Una seduta fatta male non si "recupera" aggiungendo serie la volta dopo.

### Sedute saltate
- Saltata una seduta nella settimana: non comprimere. Fai le sedute restanti
  rispettando "mai A e C consecutivi". Priorità: A e C (squat, stacco), poi B,
  poi D.
- Settimana da 2 sedute fatta bene vale più di 4 sedute compresse in tre giorni.
- Carichi dopo una pausa (dalla stessa alzata):
  - fino a 10 giorni: stesso carico dell'ultima seduta riuscita;
  - 2-3 settimane: un incremento sotto (o -5%) e RIR 3 alla prima seduta;
  - oltre 3 settimane o malattia con febbre: -10-15% e risali in 2-3 sedute.
  Queste soglie sono pratica comune: la forza si perde poco nelle prime 2-3
  settimane di stop, ma la tecnica e la tolleranza al carico sì.
- Dopo una malattia, aspetta di essere senza febbre da almeno 24-48 ore prima
  di allenarti forte.

### Deload, taper e test
- Deload (settimane 6 e 12): meno serie (circa un terzo o metà in meno), RIR 4,
  carichi un po' più bassi della settimana prima (il calendario lo dice per
  squat e stacco), niente salti, niente tecniche. Gli accessori non progrediscono.
- Perché: il deload gestisce la fatica e fa da cuscinetto. Un solo studio
  controllato (Coleman 2024, settimana di stop totale a metà programma) non ha
  trovato vantaggi per l'ipertrofia e un piccolo svantaggio per la forza: il
  beneficio del deload è più pratico che dimostrato.
- Taper (settimana 15): metà volume, carichi ancora alti (squat 2 x 3, stacco
  2 x 3), RIR 2-3, niente cedimento, niente salti. Serve ad arrivare al test
  senza fatica residua.
- Test (settimana 16): lunedì A (squat 122,5 x 3), martedì B (prima panca
  manubri 28 x 8, poi trazioni al massimo, il resto leggero a RIR 3-4), giovedì
  C (stacco 115 x 3 e alzate laterali
  14 x 12). Un solo tentativo per test. Se manchi, non ripetere lo stesso
  giorno. Il carico del tentativo che l'app propone è il più basso tra il
  calendario e la stima dall'e1RM migliore delle 3 settimane prima (escluso il
  deload): non propone un carico che i dati dicono impossibile.
  - Riscaldamento tipico: circa 40%, 60%, 75%, 85-90% del carico del tentativo,
    1-3 ripetizioni ciascuno, 4 minuti prima del tentativo.
  - Il carico del tentativo è quello del calendario se la settimana 14 è andata
    al RIR previsto. Altrimenti lo stimi dall'e1RM della settimana 14 (vedi
    conversione) e scegli un carico che dà 3 ripetizioni a RIR 0-1.
  - RIR 0 nella settimana 16 vale per i tentativi, non per gli accessori:
    l'app mostra gli accessori a RIR 3-4, con meno serie.

### Conversione dei carichi tra range di ripetizioni
- Formula di Epley con RIR: `e1RM = carico x (1 + (ripetizioni + RIR) / 30)`.
- Carico per un nuovo obiettivo: `carico = e1RM / (1 + (rip_obiettivo + RIR_obiettivo) / 30)`.
- Percentuali pronte (ripetizioni fino a cedimento -> % di e1RM): 3 -> 91%,
  5 -> 86%, 6 -> 83%, 8 -> 79%, 10 -> 75%, 12 -> 71%, 15 -> 67%.
- Esempio: lat machine 60 kg x 12 a RIR 2 -> e1RM = 60 x (1 + 14/30) = 88 kg.
  Nuovo obiettivo 8 ripetizioni a RIR 2 -> 88 / (1 + 10/30) = 66 kg -> 65 kg.
- Limiti, da dire quando usi la formula:
  - errore crescente sopra 10 ripetizioni e sotto 3;
  - meno affidabile su manubri, cavi e macchine (attriti, leve, stabilità) e
    sugli isolamenti, dove la resistenza alla fatica conta molto;
  - varia da persona a persona e da esercizio a esercizio;
  - va bene per scegliere la prima serie, poi comanda il RIR reale.
- Arrotonda per difetto al disco o al manubrio disponibile.

---

## C. Esercizi

Ogni scheda: muscoli, esecuzione, errori, dolore, alternative se occupato,
come leggere il RIR. Gli id sono quelli di `programma.js`.

### Salti verticali (A.salti)
- Muscoli: estensori di anca, ginocchio e caviglia; è lavoro di potenza e di
  atterraggio, non di massa.
- Esecuzione: piedi a larghezza anche; contromovimento rapido a un quarto di
  squat con braccia indietro; esplodi verso l'alto con slancio delle braccia;
  atterra sugli avampiedi, ginocchia in linea con le punte, morbido e
  silenzioso; resetta 20-30 secondi tra un salto e l'altro se serve.
- Errori: ginocchia che cadono verso l'interno all'atterraggio (pensa "spingi
  le ginocchia fuori"); atterraggio rigido o rumoroso (scendi di più, più
  silenzioso); salti a ritmo da fiatone (sono singoli di qualità, recupero
  completo).
- Dolore: tendine rotuleo (sotto la rotula) o tendine d'Achille -> riduci a
  metà i contatti o passa a salti su un box basso (atterraggio in alto, meno
  impatto); se persiste, togli i salti per quella settimana.
- Spazio occupato: qualsiasi zona libera di 1 x 1 m; in alternativa box jump
  con discesa a gradino.
- RIR: non si usa. Criterio: appena perdi altezza o l'atterraggio diventa
  rumoroso e scomposto, chiudi la serie. Dose: 3 x 3 -> 5 x 3, sospesi in deload
  e taper.

### Balzi in lungo (C.balzi, dalla settimana 7)
- Muscoli: catena posteriore (glutei, femorali), quadricipiti, polpacci;
  potenza orizzontale e decelerazione.
- Esecuzione: piedi a larghezza anche; carica con le braccia e le anche
  indietro; spingi in avanti e in alto (angolo circa 45 gradi); atterra su due
  piedi, anche indietro, tieni la posizione 2 secondi; torna camminando.
- Errori: atterrare con le gambe tese (atterra già piegato, "da seduto");
  ginocchia che cedono verso l'interno; cercare la distanza a costo di cadere in
  avanti (conta l'atterraggio tenuto).
- Dolore: come i salti verticali; per ginocchio anteriore riduci la distanza;
  per schiena bassa (frenata) riduci l'intensità.
- Occupato: corridoio o zona di stretching; senza spazio, salti verticali.
- RIR: non si usa; stop alla prima perdita di distanza o atterraggio peggiore.
  Sempre prima dello stacco, da freschi.

### Trazioni (A.trazioni, B.trazioni, C.trazioni)
- Muscoli: gran dorsale, bicipiti, brachiale, romboidi, trapezio medio e
  inferiore, flessori dell'avambraccio.
- Esecuzione: presa prona poco oltre la larghezza delle spalle; parti da
  braccia tese, scapole prima abbassate ("spalle lontano dalle orecchie");
  tira i gomiti verso le tasche posteriori; mento sopra la sbarra; scendi
  controllato fino a braccia tese.
- Errori: mezze ripetizioni in basso (non contano); slancio con le gambe
  (incrocia le caviglie, glutei contratti); collo allungato verso la sbarra
  invece del petto; presa stritolata che satura gli avambracci (presa salda ma
  "a uncino").
- Dolore: gomito interno o esterno -> presa neutra (maniglie parallele) se
  disponibile, oppure presa supina; spalla in alto -> non salire oltre il mento,
  presa neutra; polso -> presa neutra o fasce. Se il dolore resta: lat machine
  presa neutra per quella seduta (non conta come progressione).
- Sovraccarico del gomito: trazioni tre volte a settimana, più lat machine,
  pulley, rematore e il tennis del sabato caricano molto i tendini del gomito
  (interno ed esterno). Al primo fastidio che resta il giorno dopo: trazioni a
  presa neutra per 2 settimane, poi si torna alla prona.
- Sbarra occupata: qualsiasi sbarra o i manici della lat machine/torre cavi;
  in mancanza totale, lat machine a carico pesante (5-8 ripetizioni) e annota.
- RIR: rallentamento netto a metà salita o mento che arriva solo allungando il
  collo = RIR 0-1. Fermati quando la ripetizione successiva non avrebbe lo
  stesso ROM.
- Avambracci che si gonfiano e cedono (pump): fatica locale da sforzo
  isometrico ripetuto, tipica dopo uno stop; migliora in alcune settimane.
  Rimedi: fasce su lat machine e pulley (non sulle trazioni), presa a uncino,
  variare la presa tra gli esercizi di tirata.

### Squat bilanciere (A.squat)
- Muscoli: quadricipiti, grandi glutei, adduttori; erettori e addome come
  stabilizzatori.
- Esecuzione: bilanciere sui trapezi (high bar) o poco più basso; piedi a
  larghezza spalle, punte leggermente aperte; inspira e "chiudi" l'addome prima
  di scendere; scendi sedendoti tra i talloni con ginocchia in linea con le
  punte; almeno parallelo, risali spingendo il pavimento con tutto il piede.
- Errori: ginocchia che cadono all'interno in salita (spingi le ginocchia
  fuori, carico più basso); talloni che si alzano (piedi più larghi, scarpe con
  tacco rigido o dischi sottili sotto i talloni); "good morning" in salita,
  anche che salgono prima del petto (petto alto, pensa "spingi la schiena sul
  bilanciere"); profondità diversa tra le ripetizioni (fissa un riferimento,
  ad esempio una panca bassa da sfiorare).
- Dolore: ginocchio anteriore -> riduci la profondità al limite indolore per
  una seduta, tempo lento in discesa (3 secondi), poi hack squat o box squat;
  inguine o anca -> piedi un po' più larghi e punte più aperte, o affondi;
  schiena bassa -> ferma lo squat, passa a hack squat o leg press per quella
  seduta e applica la regola del dolore.
- Rack occupato: cambia ordine (fai trazioni e accessori di A prima, squat
  dopo), oppure usa un altro rack o lo Smith machine come ultima scelta. Lo
  squat è un test di dicembre: una seduta con sostituto non conta come
  progressione e il motore deve ripetere il carico la volta dopo.
- RIR: velocità della risalita. Ripetizione che rallenta molto nel punto più
  duro (poco sopra il parallelo) = RIR 1-2; si ferma un attimo = RIR 0-1.
  Ultima serie: se la tecnica cambia (anche, ginocchia) è RIR 0 anche se sei
  salito.

### Curl ai cavi e pushdown barra (A.curlCavi, A.pushBarra, dalla settimana 7)
- Superserie 2 + 2 in fondo ad A, 10-12, per portare le braccia a 7-8 serie
  dirette a settimana. Gomiti fermi ai fianchi; nessun cedimento con slancio.
  Carico da trovare alla prima seduta.

### Hack squat (A.hack)
- Muscoli: quadricipiti soprattutto, glutei; la schiena è scarica.
- Come si segna il carico: il totale dei dischi dei due lati, slitta esclusa
  (l'app mostra anche "per lato"). Fino a settembre 2026 l'utente segnava un
  lato solo: 50 di allora = 100 di oggi. Squat e stacco invece si segnano con
  il bilanciere incluso (20 kg) e l'app calcola i dischi per lato.
- Esecuzione: schiena e spalle contro i cuscinetti; piedi a larghezza spalle,
  a metà pedana (più alti = più glutei, più bassi = più quadricipiti); scendi
  almeno al parallelo senza staccare la lombare dallo schienale; risali senza
  bloccare di colpo le ginocchia.
- Errori: ROM ridotto per caricare di più (scendi sempre alla stessa
  profondità); bacino che si stacca dal cuscino in basso (riduci la profondità a
  quel punto); talloni che si alzano (piedi più alti).
- Dolore: ginocchio anteriore -> piedi più alti, profondità ridotta, tempo
  lento; schiena bassa -> profondità ridotta; se persiste, leg press.
- Macchina occupata: leg press (piedi a metà pedana, profondità piena), pendulum
  squat, goblet squat con manubrio pesante, Smith squat. Il carico non è
  confrontabile: riparti dal RIR.
- RIR: rallentamento nell'ultimo terzo della risalita. Attenzione: sulle
  macchine si sottostima spesso il RIR (sembra più duro di quello che è) per il
  bruciore; usa la velocità, non la sensazione.

### Affondi bulgari (A.bulgari)
- Muscoli: quadricipiti e glutei della gamba avanti, adduttori; equilibrio.
- Esecuzione: dorso del piede dietro su una panca; piede avanti abbastanza
  lontano da far scendere il ginocchio dietro quasi a terra; busto leggermente
  inclinato in avanti (più glutei) o dritto (più quadricipiti); scendi
  controllato, spingi con il piede davanti; peso per manubrio, ripetizioni per
  lato.
- Errori: piede troppo vicino alla panca (ginocchio che spinge molto avanti e
  tallone che si alza); bacino che ruota; ginocchio che cade all'interno; usare
  la gamba dietro per spingere.
- Dolore: ginocchio anteriore -> passo più lungo, busto più inclinato, ROM
  ridotto; inguine o flessore dell'anca della gamba dietro -> piede dietro più
  basso (step) o affondi indietro dal pavimento; schiena -> manubrio solo dal
  lato della gamba di lavoro o goblet.
- Panca occupata: affondi indietro alternati, step-up su box, split squat con
  piede dietro a terra.
- RIR: perdita di equilibrio e ginocchio che trema = vicino al limite; se la
  presa cede prima delle gambe, usa le fasce.
- Solo fino alla settimana 6: dalla 7 in A c'è il leg curl seduto (A.legcurl).
  Motivo: gambe e polpacci sono già il punto forte, il volume si sposta sulla
  parte alta; i femorali restano coperti (con lo stacco in C).

### Hanging knee raise (A.knee)
- Muscoli: flessori dell'anca, retto dell'addome (soprattutto se arrotoli il
  bacino), obliqui.
- Esecuzione: appeso alla sbarra, spalle attive; porta le ginocchia al petto
  arrotolando il bacino in alto (il pube va verso lo sterno), non solo alzando
  le cosce; scendi lento senza dondolare. Programma: 2 x 15.
- Quando passare a gambe tese: quando fai 2 x 15 con il bacino che si arrotola
  davvero in ogni ripetizione. Se alzi le gambe tese solo con i flessori
  dell'anca e la schiena resta inarcata, la lombare lavora male: torna a
  ginocchia piegate.
- Errori: dondolio (pausa di un secondo in basso); solo flessione d'anca senza
  arrotolare il bacino; presa che cede prima dell'addome (usa le fasce o le
  maniglie a gomiti, "captain's chair").
- Dolore: schiena bassa -> ginocchia piegate, ROM ridotto, o dead bug a terra;
  spalla appesa -> sedia romana con appoggio dei gomiti o crunch inverso a
  terra.
- Sbarra occupata: sedia romana (captain's chair), crunch inverso su panca,
  crunch ai cavi in ginocchio.
- RIR: si usa poco; fermati quando il bacino non si arrotola più o inizi a
  dondolare.

### Alzate laterali (A.laterali, B.laterali, C.laterali, C.lateraliExtra, D.laterali)
- Muscoli: deltoide laterale (l'unico muscolo che allarga la silhouette delle
  spalle), con trapezio superiore e sovraspinato.
- Esecuzione: in piedi o seduto, manubri ai lati, gomiti leggermente piegati;
  porta i manubri verso l'esterno e leggermente in avanti (piano della scapola,
  circa 30 gradi davanti al corpo); sali fino all'altezza delle spalle, gomito
  guida, mignolo non più alto del pollice; scendi in 2 secondi.
- Errori: slancio con il busto (riduci il carico: le ripetizioni slanciate non
  contano); spalle che salgono verso le orecchie (pensa "spalle basse, braccia
  lunghe"); salire troppo sopra le spalle con trapezio; carico troppo alto
  scelto per "fare numero".
- Dolore: dolore anteriore o laterale di spalla in alto (conflitto) -> sali
  solo fino a 70-80 gradi, pollici leggermente in su, piano della scapola; se
  persiste, alzate laterali ai cavi (resistenza più dolce in alto) o alla
  macchina; dolore al collo -> seduto con schiena appoggiata, carico più basso.
- Manubri occupati: alzata laterale al cavo basso (una mano), macchina per
  laterali, elastico.
- RIR: compare lo slancio o i manubri non arrivano più all'altezza delle spalle
  = RIR 0-1. Il bruciore arriva presto e inganna: conta le ripetizioni pulite
  rimaste, non quanto brucia. Esercizio adatto alla taratura a cedimento.
- Tetto di volume nel programma: circa 9-12 serie a settimana; non aggiungerne.

### Polpacci macchina (A.polpacci)
- Muscoli: gastrocnemio (gamba tesa), soleo.
- Esecuzione: avampiedi sul bordo, ginocchia quasi tese; scendi fino al massimo
  allungamento e fermati 1-2 secondi in basso; sali fino in punta; niente
  rimbalzo.
- Errori: rimbalzo in basso (pausa); ROM corto in alto; piegare le ginocchia per
  spingere.
- Dolore: tendine d'Achille -> riduci la discesa e il carico, tempo lento; pianta
  del piede -> ROM ridotto; se persiste, togli l'esercizio per la settimana (è
  a mantenimento).
- Macchina occupata: polpacci alla leg press, in piedi su un gradino con
  manubrio, Smith machine con rialzo.
- RIR: ROM che si accorcia in alto = RIR 0-1. Esercizio in superserie con le
  laterali in A.

### Panca piana manubri (B.panca, C.panca dalla settimana 7, B.pancaF nelle settimane di forza)
- Muscoli: grande pettorale, deltoide anteriore, tricipiti.
- Esecuzione: portali su con le ginocchia, sdraiati; scapole addotte e depresse
  (strette e basse) per tutta la serie, piccolo arco toracico, piedi a terra;
  gomiti a 45-60 gradi dal busto; scendi fino a sentire l'allungamento del
  petto, manubri all'altezza del capezzolo; spingi in alto e leggermente verso
  il centro senza farli toccare.
- Errori: scapole che si aprono a metà serie (il carico passa al deltoide
  anteriore); gomiti a 90 gradi (spalla esposta); punto di contatto troppo alto,
  verso le clavicole; ROM accorciato nelle ultime ripetizioni.
- Dolore: spalla anteriore -> gomiti più stretti (45 gradi), ROM poco più corto,
  presa neutra (palmi uno verso l'altro); petto o ascella con fitta -> fermati;
  polso -> polsi dritti sopra i gomiti.
- Panca occupata: chest press a macchina (carico non confrontabile), panca piana
  bilanciere, piegamenti con zavorra. È il movimento di un obiettivo: annota il
  sostituto, la progressione resta ferma.
- RIR: la ripetizione rallenta molto a metà spinta o i manubri si separano
  instabili = RIR 0-1. Si perde in genere circa una ripetizione a serie: se la
  prima serie è a RIR 2, l'ultima sarà a RIR 0-1. Recupero 2,5-3 minuti.
- Versione pesante (B.pancaF, 4 x 5-6): storia separata, non sposta il carico
  della panca 8-10 né quello di C. Partenza 24 kg (stimata da 22 x 10); +2 kg
  quando 4 x 6 con RIR almeno 2. Con manubri pesanti: appoggiali sulle cosce,
  rotola indietro portandoli su con le ginocchia, a fine serie scendi in
  sicurezza (ginocchia al petto e rotola su). Mai sotto RIR 2: senza
  assistente un manubrio pesante che cede sul petto è pericoloso.

### Lat machine (B.lat)
- Muscoli: gran dorsale, grande rotondo, bicipiti, romboidi.
- Esecuzione: cosce bloccate sotto i rulli; presa poco più larga delle spalle,
  o neutra; inizia abbassando le scapole, poi tira i gomiti verso i fianchi;
  barra al petto alto, busto leggermente inclinato indietro (10-20 gradi); sali
  controllato fino a braccia tese.
- Errori: tirare con la schiena all'indietro (oscillazione del busto oltre i 30
  gradi); fermarsi a metà in alto (perdi l'allungamento); barra dietro la nuca
  (inutile e scomoda per la spalla).
- Dolore: spalla -> presa neutra o supina più stretta; gomito -> presa neutra;
  avambraccio che cede -> fasce e presa a uncino.
- Macchina occupata: trazioni con piedi appoggiati o assistite, pulldown a un
  braccio al cavo alto, pullover al cavo con corda.
- RIR: il gomito non arriva più ai fianchi o il busto comincia a oscillare =
  RIR 0-1. Usare le fasce aiuta a far arrivare il limite dal dorso.

### Estensioni tricipiti sopra la testa ai cavi (B.tricipiti)
- Muscoli: tricipite, soprattutto il capo lungo, che lavora meglio in
  allungamento (braccio sopra la testa). È circa due terzi della massa del
  braccio.
- Esecuzione: corda o barra al cavo, di spalle alla torre in affondo o seduto;
  gomiti sopra la testa, fermi e vicini; scendi fino al massimo allungamento
  dietro la testa; estendi completamente; il busto non si muove.
- Errori: gomiti che si aprono (gomiti stretti, carico più basso); gomiti che
  si muovono avanti e indietro come un pullover; ROM accorciato in basso.
- Dolore: gomito (posteriore) -> ROM ridotto in basso, carico più basso, oppure
  estensione con manubrio su panca inclinata; spalla in alto -> braccio meno
  verticale (estensioni al cavo dal basso inclinate, o "skull crusher" su panca
  inclinata).
- Cavo occupato: estensione sopra la testa con un manubrio a due mani,
  french press su panca inclinata con manubri, elastico.
- RIR: il gomito comincia a spostarsi o non estendi più del tutto = RIR 0-1.

### Pulley basso (B.pulley)
- Muscoli: dorsali, romboidi, trapezio medio, deltoide posteriore, bicipiti.
- Esecuzione: seduto, piedi sulla pedana, ginocchia leggermente piegate; in
  allungamento lascia andare il busto in avanti di 20-30 gradi con scapole
  aperte; tira portando il busto verticale e i gomiti dietro, scapole strette;
  niente oscillazione oltre la verticale.
- Errori: triangolo che tocca l'addome prima di finire il movimento (usa una
  maniglia più larga o due maniglie singole); tirare con la lombare
  (oscillazione grande); spalle che salgono.
- Dolore: schiena bassa -> busto fermo, ROM solo di braccia e scapole, o
  rematore con petto appoggiato; gomito -> presa neutra larga.
- Macchina occupata: rematore con petto appoggiato su panca inclinata, rematore
  alla macchina, rematore al cavo a un braccio.
- RIR: gomiti che non arrivano più dietro il busto o il busto che oscilla per
  finire = RIR 0-1. Fasce se gli avambracci cedono prima.

### Curl con rotazione (B.curl)
- Muscoli: bicipite brachiale (la supinazione lo coinvolge di più), brachiale,
  brachioradiale.
- Esecuzione: in piedi o seduto, manubri con presa neutra; sali ruotando il
  palmo verso l'alto; gomiti fermi ai fianchi; scendi in 2 secondi fino a
  braccio teso.
- Errori: slancio con il busto; gomiti che vanno avanti (diventa un'alzata
  frontale); ROM accorciato in basso.
- Dolore: gomito interno o avambraccio -> curl con presa supina fissa su panca
  inclinata o curl alla macchina (meno lavoro per l'avambraccio); polso ->
  curl martello o curl al cavo con corda.
- Manubri occupati: curl al cavo basso con barra, curl con bilanciere EZ, curl
  alla macchina.
- RIR: compare lo slancio o il manubrio non sale più oltre i 90 gradi senza
  aiuto = RIR 0-1. Se gli avambracci sono saturi dalle tirate precedenti, la
  presa supina fissa è il cambio più semplice.

### Croci inverse (B.crociInv ai cavi, D.crociInv)
- Muscoli: deltoide posteriore, trapezio medio, romboidi.
- Esecuzione (macchina, reverse pec deck): petto appoggiato, maniglie
  all'altezza delle spalle, presa neutra o prona; braccia quasi tese, apri
  portando le mani indietro in un arco ampio; fermati quando le braccia sono in
  linea con il busto; ritorno lento.
- Errori: tirare con i trapezi (spalle verso le orecchie); piegare troppo i
  gomiti (diventa un rematore); andare oltre la linea del busto con le scapole
  strette al massimo (il bersaglio è il deltoide, non i romboidi).
- Dolore: spalla anteriore -> ROM più corto dietro; collo -> carico più basso.
- Macchina occupata: rear delt fly su panca inclinata a 30 gradi con manubri
  leggeri, petto appoggiato; croci inverse ai cavi incrociati; face pull da
  seduto (il peso del corpo ancora il tronco).
- RIR: le braccia non arrivano più in linea con il busto o compaiono strappi =
  RIR 0-1. Esercizio a ripetizioni alte: range 12-15 in B (dal 9 ottobre
  2026; prima 15-20 non era realistico al carico minimo della macchina).

### Crunch ai cavi in ginocchio (B.crunch, dalla settimana 7)
- In superserie con le croci ai cavi. Muscoli: retto dell'addome con carico
  vero (squat e stacco lo usano poco e solo in isometria).
- Esecuzione: in ginocchio davanti al cavo alto, corda ai lati della testa;
  arrotola la colonna portando i gomiti verso le cosce, anca ferma. Espira
  scendendo.
- Carico: 2 x 10-15, RIR 1-2, doppia progressione (+2,5 kg). Il carico conta:
  serve a ispessire l'addome come per gli altri muscoli.
- Errori: sedersi sui talloni tirando con le braccia (diventa un movimento
  d'anca).

### Croci ai cavi dal basso (B.crociCavi dalla settimana 7, D.crociCavi)
- Muscoli: grande pettorale, soprattutto il fascio clavicolare (petto alto),
  deltoide anteriore.
- Esecuzione: cavi in basso, un passo avanti dalla torre; braccia quasi tese,
  gomiti leggermente piegati e fissi; porta le mani in alto e al centro fino
  all'altezza del mento, come per "abbracciare in salita"; scendi lento fino a
  sentire l'allungamento del petto.
- Errori: trasformarlo in un'alzata frontale (le mani devono convergere, non
  solo salire); gomiti che si piegano e si stendono (diventa una spinta);
  spalle che salgono.
- Dolore: spalla anteriore -> ROM ridotto in basso, gomiti più piegati; se
  persiste, panca inclinata manubri leggera a 30 gradi.
- Cavi occupati: panca inclinata manubri 30 gradi, croci inclinate con
  manubri, chest press inclinata a macchina.
- RIR: le mani non arrivano più a incontrarsi in alto o compare spinta con le
  braccia = RIR 0-1.

### Stacco da terra (C.stacco, settimane 7, 9, 11, 13 e test)
- Muscoli: glutei, femorali, quadricipiti nella partenza, erettori della
  colonna (isometrici), dorsali, trapezi, presa.
- Esecuzione: bilanciere sopra il centro del piede, a 2-3 cm dagli stinchi;
  piedi a larghezza anche, presa appena fuori dalle gambe; piega le ginocchia
  finché gli stinchi toccano la sbarra, spalle leggermente davanti al
  bilanciere; dorsali attivi ("ascelle sopra il bilanciere"), tira fino a
  togliere il gioco tra sbarra e dischi; spingi il pavimento, anche e spalle
  salgono insieme; sopra il ginocchio porta le anche in avanti, senza inarcarti
  indietro.
- Errori: anche che salgono prima delle spalle (il lavoro passa alla lombare:
  pensa "spingi via il pavimento", gambe fino al ginocchio); bilanciere che si
  allontana dalle gambe (dorsali attivi); schiena che si arrotonda (carico più
  basso, chiudi la serie); rimbalzo da terra (ferma il bilanciere ogni
  ripetizione); iperestensione in alto.
- Staccare più dello squat è vero in media, ma non è un obbligo: forzarlo
  con la schiena che protesta è la strada per farsi male. Strumenti: progressione
  lenta (+2,5 a settimana), stacco prima delle trazioni in C, video di lato
  della seconda serie (telefono all'altezza del bacino), pulsante "Dolore".
  Nel video si guarda: schiena che si
  arrotonda in partenza, anche che salgono prima delle spalle, bilanciere che
  si allontana dalle gambe.
- Dolore o rigidità alla schiena bassa: distinguere "non riesco ad arrivare in
  posizione" (limite di mobilità: stacco da rialzo 5-10 cm, o trap bar se c'è,
  e mobilità dell'anca quotidiana) da "fa male" (fermati, regola del dolore, se
  il dolore dura oltre 48 ore o si irradia nella gamba -> fisioterapista).
  Femorale con fitta -> fermati, niente stacco quella seduta.
- La cintura amplifica una posizione che sai già tenere, non la crea: non
  usarla per compensare una schiena che si muove.
- Bilanciere o pedana occupati: stacco da un altro rack o dai pin bassi; trap
  bar se libera (carico non identico). È un test di dicembre: il sostituto non
  conta come progressione.
- RIR: perdita di posizione della schiena o bilanciere che si stacca dalle
  gambe = RIR 0, anche se la ripetizione sale. Velocità: la parte più lenta è
  la partenza; se la sbarra "si incolla" a terra per un attimo, sei a RIR 0-1.
  Filmati di lato sulla seconda serie per controllare.

### Stacco rumeno (C.rdl, settimane 8, 10, 12, 14 e nei cicli)
- Muscoli: femorali e glutei in allungamento; schiena bassa in isometria.
- Esecuzione: parti in piedi con il bilanciere (dai supporti o dopo uno stacco),
  ginocchia appena piegate e ferme, spingi l'anca indietro e fai scorrere la
  sbarra lungo le cosce; scendi finché i femorali tirano (di solito sotto il
  ginocchio, metà tibia) con la schiena neutra, poi risali spingendo l'anca
  avanti. Niente rimbalzo in basso, il bilanciere non tocca terra.
- Carico: 3 x 6-8, RIR almeno 2, doppia progressione (+2,5 kg). Prima, nel
  riscaldamento, 2 x 3 di stacco da terra leggero (60-70% del pesante).
- Errori: piegare le ginocchia (diventa uno stacco), arrotondare la schiena
  per scendere di più, guardare in alto.
- Dolore: schiena bassa -> ROM ridotto, carico più basso, o alternative
  (iperestensioni con disco, pull-through al cavo).

### Iperestensioni 45 gradi (C.iper)
- Perché: rinforzano glutei, femorali ed erettori a carico basso, alla fine di
  C; servono a far tollerare meglio lo stacco, non a sostituirlo.
- Esecuzione: anche appena sopra il cuscino, così il movimento parte
  dall'anca; scendi piegandoti dalle anche con la schiena neutra; risali
  spingendo il bacino nel cuscino e stringendo i glutei; in alto fermati con il
  corpo in linea, senza inarcarti. Lento, 2 x 12 a corpo libero.
- Si mettono solo in C (in A squat, hack e leg curl caricano già la catena
  posteriore). Un disco al petto solo quando 2 x 15 sono facili e la schiena
  sta a 0-1 su 10.
- Dolore: se la schiena fa male anche qui, ROM più corto e solo glutei (anca
  che si apre, schiena ferma); se resta, toglile e chiedi.
- Macchina occupata: ponte glutei a terra o hip thrust leggero.

### Military press manubri (C.military)
- Muscoli: deltoide anteriore e laterale, tricipiti, trapezio superiore.
- Esecuzione: seduto con schienale quasi verticale (o in piedi con glutei e
  addome contratti); manubri all'altezza delle spalle, gomiti leggermente in
  avanti rispetto al busto; spingi in alto e leggermente verso il centro fino a
  braccia tese; scendi fino alle orecchie o poco sotto.
- Errori: inarcare troppo la schiena (addome chiuso, schienale più verticale);
  gomiti tutti in fuori; ROM accorciato in basso.
- Dolore: spalla anteriore o laterale in basso -> presa neutra, gomiti più
  avanti, ROM un po' più corto; collo -> carico più basso; se persiste,
  landmine press (spinta inclinata con un bilanciere in un angolo).
- Panca occupata: in piedi con manubri, shoulder press alla macchina, landmine
  press.
- RIR: rallentamento netto nella metà alta della spinta o schiena che si inarca
  per finire = RIR 0-1.

### Rematore manubrio un braccio (C.rematore)
- Muscoli: gran dorsale, romboidi, trapezio medio, deltoide posteriore,
  bicipiti.
- Esecuzione: mano e ginocchio dello stesso lato sulla panca, schiena piatta e
  quasi parallela al pavimento; braccio teso in basso, lascia scendere la spalla
  per allungare; tira il gomito verso l'anca, non verso l'alto; scendi lento.
- Errori: ruotare il busto per tirare su il manubrio (riduci il carico); tirare
  verso il petto (lavora di più il trapezio); ROM corto in basso.
- Dolore: schiena bassa -> rematore con petto appoggiato su panca inclinata a
  30-45 gradi; gomito -> fasce, presa neutra; spalla -> ROM ridotto in alto.
- Panca o manubri occupati: rematore con petto appoggiato, rematore al cavo a un
  braccio, rematore alla macchina.
- RIR: il busto comincia a ruotare o il gomito non arriva più all'altezza del
  busto = RIR 0-1. Peso per manubrio, ripetizioni per lato.

### Curl martello (C.martello)
- Muscoli: brachiale, brachioradiale, bicipite.
- Esecuzione: manubri con presa neutra (pollici in su); gomiti fermi ai fianchi;
  sali fino a contrarre, scendi in 2 secondi fino a braccio teso; alternato o
  simultaneo.
- Errori: slancio; gomiti che avanzano; polsi che si piegano.
- Dolore: gomito esterno (zona dell'"epicondilo") -> riduci il carico o passa a
  curl con presa supina; se il dolore è legato anche a tennis o a presa forte,
  riduci tutto il lavoro di presa per una settimana e applica la regola del
  dolore.
- Manubri occupati: curl al cavo con corda, curl con bilanciere EZ in presa
  neutra se c'è.
- RIR: compare lo slancio o il manubrio non sale più = RIR 0-1.

### Scrollate manubri (C.scrollate)
- Muscoli: trapezio superiore (linea collo-spalla).
- Esecuzione: manubri ai lati, braccia tese; sali con le spalle verso le
  orecchie dritto in alto, pausa di 1 secondo; scendi in allungamento completo;
  niente rotazioni delle spalle.
- Errori: piegare i gomiti; ROM corto; rotazioni (inutili). Solo 2 serie: più
  trapezio "accorcia" visivamente la spalla.
- Dolore: collo -> carico più basso, ROM più corto; se persiste, toglile.
- Occupato: scrollate al cavo basso, al bilanciere, alla Smith machine.
- RIR: il ROM in alto si accorcia = RIR 0-1. Nel programma si fanno solo nelle
  settimane con D; senza D, al loro posto 3 serie di alzate laterali.

### Trazioni assistite (D.trazAss)
- Muscoli: come le trazioni.
- Esecuzione: alla macchina con assistenza (ginocchia o piedi su una pedana) o
  con elastico; stessa tecnica delle trazioni, ROM completo; il "carico" è
  l'assistenza: meno assistenza = più difficile.
- Progressione: con questo esercizio la doppia progressione va al contrario:
  quando chiudi 2 x 12 con RIR almeno 1, togli un incremento di assistenza.
- Errori: usare l'assistenza per fare ripetizioni veloci a metà ROM.
- Dolore: come le trazioni.
- Macchina occupata: lat machine leggera, trazioni con piedi appoggiati a una
  panca, trazioni negative lente (3-4 secondi di discesa).
- RIR: fermati a RIR 2-3: è volume extra a bassa fatica, non conta nella
  progressione.

### Pulley presa stretta (D.pulleyStretto)
- Muscoli: dorsali (porzione bassa), romboidi, bicipiti.
- Esecuzione: come il pulley basso, con triangolo o maniglia stretta; gomiti
  vicini al corpo; allungamento in avanti controllato, tirata fino all'addome
  alto.
- Errori: oscillazione del busto; triangolo che tocca il corpo prima della fine
  (cambia maniglia).
- Dolore: schiena bassa -> rematore con petto appoggiato; gomito -> maniglie
  neutre più larghe.
- Occupato: rematore al cavo a un braccio, rematore con petto appoggiato,
  macchina per rematore.
- RIR: in D resta a RIR 2-3 (seduta a bassa fatica).

### Push down corda (D.pushdown; C.pushdown 2 x 10-15 dalla settimana 7)
- Muscoli: tricipite, soprattutto capo laterale e mediale.
- Esecuzione: cavo alto con corda; gomiti fermi ai fianchi; estendi
  completamente aprendo leggermente la corda in basso; risali fino a circa 90
  gradi di flessione o poco oltre.
- Errori: gomiti che si alzano e si abbassano (diventa una spinta col dorsale);
  busto che si piega in avanti per spingere col peso.
- Dolore: gomito -> barra dritta o a V invece della corda, carico più basso.
- Cavo occupato: estensioni con manubrio, dip alla panca con piedi a terra
  (attenzione alle spalle), push down con elastico.
- RIR: i gomiti cominciano a muoversi o l'estensione non è più completa =
  RIR 0-1. In D resta a RIR 1-2.

### Rotazioni esterne ai cavi (D.rotazioni)
- Muscoli: infraspinato, piccolo rotondo (cuffia dei rotatori), deltoide
  posteriore. Servono alla salute della spalla, specie se si fanno sport con il
  braccio sopra la testa (servizio a tennis).
- Esecuzione: cavo all'altezza del gomito; gomito piegato a 90 gradi, attaccato
  al fianco (un asciugamano arrotolato tra gomito e busto aiuta); ruota
  l'avambraccio verso l'esterno senza staccare il gomito; ritorno lento.
- Errori: carico troppo alto (compensi con il busto); gomito che si stacca dal
  fianco; ROM forzato oltre il comodo.
- Dolore: dolore alla spalla durante l'esercizio -> riduci ROM e carico; se
  persiste, sospendi e fatti vedere.
- Cavo occupato: elastico; manubrio leggero sdraiato su un fianco (rotazione
  esterna in decubito laterale).
- RIR: il carico è volutamente ridicolo; resta a RIR 3 o più, movimento lento e
  pulito.

### Leg curl (A.legcurl dalla settimana 7, 3 x 10-12; D.legcurl fino alla 6)
- Muscoli: femorali (bicipite femorale, semitendinoso, semimembranoso),
  gastrocnemio.
- Esecuzione: seduto (preferibile: lavora i femorali più in allungamento) o
  sdraiato; asse del ginocchio allineato al perno della macchina; fletti fino
  in fondo, ritorno lento fino a gamba quasi tesa; bacino fermo.
- Errori: bacino che si alza (sdraiato) o scivola (seduto); ROM corto;
  ritorno veloce.
- Dolore: fitta al femorale -> stop immediato (possibile stiramento: niente
  stretching aggressivo, regola del dolore, fisioterapista se c'è un ematoma o
  zoppia); ginocchio posteriore -> ROM ridotto.
- Macchina occupata: leg curl in piedi a una gamba, nordic curl assistito
  (eccentrica lenta, poche ripetizioni, è molto intenso), stacco rumeno
  leggero con manubri.
- RIR: in A come gli altri accessori (RIR della settimana); in D restava a
  RIR 2. Il bruciore arriva presto; conta la velocità nell'ultima parte della
  flessione. Dalla settimana 7 D non ha più lavoro per le gambe.

### Pallof press (B.pallof, fino alla settimana 6)
- Muscoli: addominali e obliqui come anti-rotazione; stabilità del tronco.
- Esecuzione: di lato alla torre, cavo all'altezza del petto, maniglia al petto
  con due mani; piedi a larghezza anche, glutei e addome contratti; spingi le
  braccia avanti senza ruotare il busto, tieni 2 secondi, torna; ripetizioni per
  lato.
- Errori: busto che ruota verso il cavo (riduci il carico o allarga i piedi);
  fianchi che si spostano; trattenere il respiro.
- Dolore: schiena -> posizione in ginocchio o mezzo ginocchio.
- Cavo occupato: elastico fissato a un montante, plank laterale, dead bug.
- RIR: il busto comincia a ruotare = fine serie.
- Dalla settimana 7 è sostituito dalle croci ai cavi dal basso in B.

### Panca inclinata manubri 30° (C.inclinata30 e A.inclinata30, dalla settimana 7)
- In A prende il posto dell'hack squat, dopo lo squat; storia separata da C.
  In C viene prima del military.
- Al posto della panca piana di C dal 9 ottobre 2026: petto alto per
  l'estetica, la piana resta in B (dove c'è il test 28 x 8). 3 x 8-10,
  partenza 20 kg. Panca a 30 gradi, non 45: a 45 lavora soprattutto la
  spalla. Tecnica e dolori come la panca piana.

### Panca inclinata manubri (C.inclinata, fino alla settimana 6)
- Muscoli: grande pettorale, soprattutto il fascio clavicolare, deltoide
  anteriore, tricipiti.
- Esecuzione: schienale a 30 gradi (più alto lavora soprattutto la spalla);
  scapole addotte e depresse; gomiti a 45-60 gradi; scendi fino
  all'allungamento del petto, manubri all'altezza del petto alto; spingi verso
  l'alto e leggermente al centro.
- Errori: schienale troppo alto (diventa una military); scapole che si aprono;
  ROM corto.
- Dolore: spalla anteriore -> schienale a 15-20 gradi, presa neutra, gomiti più
  stretti; se persiste, croci ai cavi dal basso.
- Panca occupata: panca inclinata con bilanciere, chest press inclinata a
  macchina, croci ai cavi dal basso.
- RIR: come la panca piana. Dalla settimana 7 la riga diventa panca piana
  manubri; il petto alto resta coperto dalle croci ai cavi dal basso in B e D.

### Regole generali sulle sostituzioni
- Scegli un'alternativa con lo stesso schema di movimento e lo stesso muscolo
  bersaglio, a un carico ripartito dal RIR (non convertito 1:1).
- Annota sempre la sostituzione: per squat, stacco, panca manubri e trazioni la
  progressione resta ferma (stesso carico alla seduta successiva sull'esercizio
  originale).
- Una sostituzione temporanea per dolore dura finché il dolore non rientra
  nella regola della sezione G; poi si torna all'originale con un carico un
  incremento sotto.
- Superserie: se una macchina della coppia è occupata, fai le due serie una di
  seguito all'altra con il recupero normale, oppure sostituisci quella occupata.

---

## D. Monitoraggio della composizione corporea

### Pesata
- Protocollo: al mattino, dopo il bagno, prima di bere e mangiare, senza vestiti
  o con lo stesso intimo, stessa bilancia sullo stesso pavimento (non su
  tappeto).
- Frequenza: tutti i giorni o almeno 3-4 volte a settimana. Conta la media, non
  la singola pesata.
- Lettura: media mobile di 7 giorni. Si confronta la media di questa settimana
  con quella della settimana prima; servono 2-3 settimane per vedere un trend.
- Rumore normale: oscillazioni di 0,5-1 kg da un giorno all'altro sono normali;
  fino a 1,5-2 kg dopo un pasto molto salato o ricco di carboidrati, dopo un
  viaggio, dopo alcol, con stitichezza o dopo una seduta molto dura (ritenzione
  da infiammazione muscolare).
- Acqua e glicogeno: ogni grammo di glicogeno trattiene circa 3 g d'acqua.
  Ridurre i carboidrati fa perdere 1-2 kg in pochi giorni che non sono grasso;
  rimetterli li riporta.
- Sale: un giorno con molto più sale del solito aggiunge acqua per 1-3 giorni.
- Viaggi: voli, cibo diverso, orari sballati e meno movimento alterano la
  bilancia per 2-5 giorni. Non trarre conclusioni dalla settimana di un viaggio.
- Creatina: all'inizio aggiunge in genere 0,5-2 kg di acqua, soprattutto
  muscolare, nelle prime 1-3 settimane (di più con la fase di carico).
- Come decidere: cambiare le calorie solo se la media settimanale si muove nella
  direzione sbagliata per 2-3 settimane di fila, e di poco (circa 150-250 kcal
  al giorno).

### Misure con il metro
- Metro da sarta non elastico, al mattino a digiuno, prima dell'allenamento,
  muscoli rilassati, metro aderente senza schiacciare la pelle, parallelo al
  pavimento. Due misure e la media; se differiscono di oltre 0,5 cm, una terza.
- Punti:
  - Vita: all'altezza dell'ombelico, a fine espirazione normale, senza
    tirare dentro la pancia. In alternativa (standard OMS) a metà tra l'ultima
    costola e la cresta iliaca: scegline uno e tienilo sempre.
  - Spalle: circonferenza nel punto più largo dei deltoidi, braccia rilassate
    lungo i fianchi. Il rapporto spalle/vita è il numero più utile per gli
    obiettivi estetici del busto.
  - Petto: all'altezza dei capezzoli, sotto le ascelle, a metà espirazione.
  - Braccio: a metà tra la punta della spalla (acromion) e la punta del gomito,
    braccio rilassato lungo il fianco; se vuoi anche contratto, sempre nello
    stesso modo e annota quale.
  - Coscia: a metà tra la piega dell'inguine e il bordo superiore della rotula,
    o a una distanza fissa (es. 15 cm) sopra la rotula; in piedi, peso su
    entrambe le gambe.
  - Polpaccio: nel punto più largo, in piedi.
- Frequenza nell'app: vita ogni settimana insieme al peso (segnale precoce
  della ricomposizione, ma guarda il trend di 3-4 settimane, non la singola
  misura); spalle, petto, braccio e coscia ogni 4 settimane con le foto. Più
  spesso è solo rumore (l'errore di misura è di circa 0,5-1 cm). Campi
  dell'app: vita, spalle, petto, braccio destro, coscia destra.
- Lettura: in ricomposizione la vita stabile o in calo con spalle, braccia e
  carichi in aumento è il segnale migliore che sta funzionando, anche con peso
  fermo.

### Foto di progresso
- Quando: ogni 4 settimane (non più spesso), al mattino a digiuno, prima
  dell'allenamento (mai dopo: il pump gonfia), stesso giorno del ciclo di
  misure.
- Luce: sempre la stessa, preferibilmente artificiale dall'alto e davanti
  (lampada fissa in bagno o in camera). Evita la luce della finestra, che cambia
  con il meteo e l'ora: in inverno a latitudini nordiche varia moltissimo.
  Niente luce solo dall'alto e da vicino, che "scolpisce" artificialmente.
- Inquadratura: stessa stanza, stesso sfondo neutro, telefono su supporto o
  appoggiato all'altezza dell'ombelico, a 2-3 metri, obiettivo standard (1x, non
  grandangolo), timer. Stessi pantaloncini.
- Pose: fronte rilassato, lato rilassato (braccia lungo i fianchi o leggermente
  avanti), schiena rilassata. Opzionali, sempre identiche: doppio bicipite
  frontale e dorsale, posa con dorsali aperti. Postura naturale, niente pancia
  in dentro.
- Confronto: due foto della stessa posa una accanto all'altra, stessa scala;
  confronta la prima con l'ultima a intervalli di 8-12 settimane, non quelle
  consecutive.
- Cosa NON concludere dalle foto:
  - cambiamenti di grasso o muscolo tra foto distanti meno di 4 settimane;
  - "definizione" o "gonfiore" dovuti a luce, ora, acqua, sale, pump;
  - quanto grasso corporeo hai in percentuale: le stime visive sono
    inaffidabili;
  - giudizi sulle proporzioni da una foto sola: servono misure e trend.
- Il giudizio estetico sulle foto è dell'utente: l'assistente descrive cosa è
  cambiato tra due foto solo se gliele mandano, senza commenti sul corpo che non
  siano richiesti.

### Ritmi attesi
- Ricomposizione: peso stabile (variazione media entro circa lo 0,25% a
  settimana), vita stabile o in leggero calo, carichi in salita. È più probabile
  in chi riprende dopo uno stop, nei principianti e con grasso corporeo non
  basso; è più lenta di una fase dedicata (Barakat 2020). Il segnale principale
  sono i carichi e le misure, non la bilancia.
- Massa pulita (lean bulk): +0,25-0,5% del peso a settimana per principianti e
  intermedi (Iraki 2019), cioè circa 0,2-0,4 kg a settimana per una persona di
  80 kg. Oltre questo ritmo la quota di grasso cresce. Chi riprende dopo uno
  stop può stare nella parte alta.
- Definizione (cut): -0,5-1% del peso a settimana (Helms 2014). Un ritmo più
  lento (circa 0,5-0,7%) protegge meglio la massa muscolare e la forza (Garthe
  2011, atleti). Sotto lo 0,5% va bene se si vuole proteggere la prestazione.
- Muscolo: anche nelle condizioni migliori, un intermedio aggiunge pochi etti
  di muscolo al mese; in 16 settimane i cambiamenti visibili sono reali ma
  piccoli. Dato incerto: le stime per individuo variano molto.

---

## E. Nutrizione di base (studente, budget, Norvegia)

### Proteine
- 1,6 g per kg di peso al giorno è il punto oltre il quale, in media, non si
  vedono altri guadagni di massa magra; il limite alto dell'intervallo di
  confidenza è circa 2,2 g/kg (Morton 2018). Range pratico 1,6-2,2 g/kg.
- La posizione ISSN dà 1,4-2,0 g/kg per chi si allena (Jäger 2017).
- In definizione servono di più: 2,3-3,1 g per kg di massa magra (Helms 2014),
  in pratica circa 2,0-2,4 g/kg di peso.
- Distribuzione: 3-5 pasti con circa 0,4 g/kg ciascuno (20-40 g), a distanza di
  3-5 ore. Uno dei pasti entro un paio d'ore prima o dopo l'allenamento. Prima di
  dormire, 30-40 g di proteine lente (latticini, kvarg, cottage) sono
  un'opzione utile ma non indispensabile.
- Il totale giornaliero conta molto più dei tempi esatti.

### Calorie
- Mantenimento: si stima dal peso medio stabile con quello che si mangia per 2-3
  settimane. Le formule (circa 30-35 kcal/kg per un giovane attivo) sono solo un
  punto di partenza con errori di qualche centinaio di kcal.
- Ricomposizione: mantenimento o leggero deficit (fino a circa -10%, -200/-300
  kcal) con proteine alte e allenamento progressivo.
- Massa: surplus del 10-20% (Iraki 2019), in pratica +250-400 kcal al giorno,
  regolato sul ritmo di aumento di peso.
- Definizione: deficit di circa 15-25% (-300/-600 kcal), regolato sul ritmo di
  perdita; proteine alte; volume di allenamento mantenuto.
- Carboidrati: 3-5 g/kg al giorno sostengono bene l'allenamento con i pesi e
  gli sport; grassi almeno 0,5-1 g/kg (ormoni, vitamine liposolubili).
- La decisione sull'obiettivo (ricomposizione, massa, definizione) è
  dell'utente; l'assistente porta dati e una proposta.

### Spesa in Norvegia con poco budget
- Supermercati più economici: Rema 1000, Kiwi, Extra, Coop Prix; i marchi del
  supermercato costano meno a parità di proteine.
- Proteine a buon prezzo: uova; kvarg e skyr (circa 10-12 g di proteine per 100
  g); cottage cheese; latte e yogurt bianco; pollo surgelato; carne macinata
  magra; tonno in scatola; sgombro in salsa di pomodoro in scatola (economico e
  ricco di omega-3); fiskekaker e merluzzo surgelato; legumi secchi o in scatola;
  tofu.
- Carboidrati: fiocchi d'avena (havregryn), patate, riso, pasta, pane
  integrale, frutta e verdura surgelata (costa meno di quella fresca in
  inverno).
- Proteine in polvere: utili per comodità, non necessarie. In Norvegia costano
  meno online che in negozio.
- Vitamina D: tra ottobre e marzo in Norvegia il sole non basta a produrla. Le
  autorità sanitarie norvegesi raccomandano un'integrazione (olio di fegato di
  merluzzo "tran" o vitamina D, circa 10 microgrammi al giorno per gli adulti).
  Per dosi più alte, parlane con un medico.

### Creatina
- Creatina monoidrato 3-5 g al giorno, tutti i giorni, a qualsiasi ora (Kreider
  2017, posizione ISSN). Fase di carico opzionale: 0,3 g/kg al giorno (circa 20
  g in 4 dosi) per 5-7 giorni, poi 3-5 g; arriva prima a saturazione ma dà più
  ritenzione d'acqua iniziale.
- Effetto: aumenta di poco forza e ripetizioni e, di conseguenza, la massa
  magra nel tempo. È l'integratore con l'evidenza più solida.
- Sicurezza: nelle persone sane, alle dosi standard, non ci sono prove di danni
  ai reni. Chi ha malattie renali ne parla prima con il medico. Effetti
  collaterali comuni: aumento di peso da acqua, a volte disturbi intestinali
  con dosi grandi prese in una volta.
- Caffeina: 3-6 mg/kg circa 60 minuti prima migliora la prestazione; non dopo
  il pomeriggio se peggiora il sonno.

### Sonno
- 7-9 ore per notte negli adulti (National Sleep Foundation); chi si allena e
  fa sport spesso ne beneficia nella parte alta.
- La privazione di sonno peggiora forza, resistenza e apprendimento motorio
  (rilevante per tennis e ballo). Una notte senza sonno ha ridotto la sintesi
  proteica muscolare di circa il 18% in uno studio piccolo (Lamon 2021).
- Pratica: orario di sveglia regolare anche nel weekend; luce del giorno al
  mattino (in inverno al nord anche una lampada da luce aiuta l'orologio
  interno); camera buia e fresca; caffeina entro metà pomeriggio.
- Dopo una notte molto corta: fai la seduta ma senza cercare record, RIR 1 in
  più del previsto; non spostare un test dopo una notte persa.

### Alcol
- Bere molto dopo l'allenamento riduce la sintesi proteica: con circa 1,5 g/kg
  di alcol (10-12 drink) il calo è stato del 24% anche assumendo proteine e del
  37% con soli carboidrati (Parr 2014, 8 uomini, misura acuta).
- Un bicchiere occasionale ha effetti piccoli; il danno arriva con le
  sbronze: sonno peggiore, recupero più lento, calorie (7 kcal per grammo) che
  non saziano.
- Pratica: evita di bere molto nelle 24 ore dopo una seduta di gambe pesante,
  prima di una partita e nella settimana di taper e test. Se si beve, prima un
  pasto con proteine, acqua tra un drink e l'altro.

---

## F. Pesi, tennis e ballo

### Cosa caricano
- Tennis: scatti brevi, frenate, cambi di direzione, affondi; carico alto su
  quadricipiti, polpacci, tendine d'Achille e rotuleo; spalla e gomito del
  braccio dominante (servizio, dritto, rovescio); rotazione del tronco. Una
  partita di 1-2 ore vale come una seduta moderata per le gambe, più pesante
  per chi è principiante e corre molto.
- Bachata (ballo): basso carico muscolare, molto lavoro di anche, caviglie e
  polpacci, giri; è soprattutto coordinazione. Una serata di 1-2 ore è un
  carico leggero, ma l'indolenzimento delle gambe ne peggiora la qualità.

### Interferenza
- Unire allenamento aerobico e pesi non riduce in modo apprezzabile ipertrofia
  e forza massima; la potenza esplosiva invece ne soffre un po', soprattutto se
  i due lavori sono nella stessa seduta o a poche ore (Schumann 2022). Con due
  sport a intensità moderata a settimana l'interferenza è piccola.
- Il problema pratico non è l'interferenza molecolare ma la fatica locale:
  gambe indolenzite giocano peggio, e una partita intensa il giorno prima
  peggiora squat e salti.

### Dove mettere le sedute
- Regola del programma: evitare la seduta più pesante per le gambe il giorno
  prima del tennis. A (squat, hack, leg curl, salti) e C (stacco, balzi) sono le
  sedute pesanti per le gambe; B e D sono leggere per le gambe (dalla
  settimana 7 D non ha esercizi di gambe).
- Ordine di preferenza per i giorni:
  - A: almeno 48 ore prima del tennis, meglio 72; va bene anche il giorno del
    ballo, al mattino (il ballo la sera è leggero) o il giorno dopo il ballo.
  - C: non il giorno prima del tennis (stacco e balzi affaticano i femorali, che
    servono negli scatti); va bene due giorni prima.
  - B: qualsiasi giorno, anche il giorno prima del tennis. Attenzione solo alla
    spalla se il giorno dopo si serve molto: tieni le alzate a RIR 2.
  - D: va bene anche il giorno prima del tennis.
  - Il giorno dopo il tennis: B o D sono le scelte migliori; A o C solo se la
    partita è stata leggera.
- Mai A e C consecutivi, mai salti dopo il tennis lo stesso giorno: i salti si
  fanno da freschi, a inizio seduta.
- Esempio di schema con 3 sedute (adattalo ai giorni reali di sport): A due o
  più giorni prima della partita, B lontano o vicino a piacere, C non adiacente
  ad A e non il giorno prima della partita. Se la settimana è stretta, la
  priorità è A e C ben distanziati; B può stare ovunque.

### Come aggiustare
- Partita intensa ieri e oggi A o C: riscaldamento più lungo; se la prima serie
  di squat o stacco è a RIR 1 in meno del previsto, tieni il carico della
  settimana prima; salti dimezzati o tolti.
- Gambe indolenzite (DOMS) prima del tennis: tieni hack squat e leg curl a
  RIR 2-3 nella seduta prima.
- Fastidio alla spalla dominante dopo il tennis: in B e C alzate laterali e
  military a RIR 2-3, rotazioni esterne in D. Se il dolore rientra nella regola
  della sezione G continua; se no, sostituisci (sezione C).
- Gomito laterale dolente (gesto del rovescio, presa): riduci il lavoro di presa
  (fasce su lat machine e pulley, curl martello più leggeri); se dura più di 2
  settimane o peggiora, fisioterapista.
- Caviglie o tendine d'Achille irritati dopo ballo o tennis: riduci salti,
  balzi e polpacci per la settimana.
- Se il carico totale è troppo (sonno peggiore, indolenzimento che non passa in
  72 ore, carichi in calo per 2 settimane): prima si taglia il leg curl di A, poi
  la seduta D, poi i salti. Squat, stacco e hack squat restano.
- Prevenzione per chi impara uno sport da adulto: il lavoro di atterraggio,
  decelerazione e forza (programmi tipo FIFA 11+) riduce gli infortuni degli
  arti inferiori; salti e balzi del programma ne coprono una parte.

---

## G. Dolore e infortuni: triage

### Indolenzimento normale (DOMS) contro segnali d'allarme
- Normale: indolenzimento diffuso nel muscolo lavorato, simmetrico, che compare
  12-24 ore dopo e passa in 2-4 giorni; migliora con il riscaldamento e il
  movimento; nessun gonfiore dell'articolazione; forza quasi normale. Peggiora
  dopo esercizi nuovi, eccentriche e ritorno da uno stop.
- Bruciore durante la serie: fatica metabolica, sparisce in pochi secondi o
  minuti. Non è dolore.
- Segnali d'allarme (fermati):
  - dolore acuto, a fitta o puntiforme in un punto preciso, soprattutto in
    un'articolazione o in un tendine;
  - dolore che aumenta durante la serie o da una serie all'altra;
  - "pop" o strappo sentito, spesso con dolore immediato, poi gonfiore o
    livido;
  - gonfiore dell'articolazione, blocco (il ginocchio non si stende), cedimento
    (il ginocchio o la spalla "scappano");
  - formicolio, intorpidimento o dolore che si irradia lungo il braccio o la
    gamba;
  - perdita improvvisa di forza;
  - dolore che il giorno dopo è più forte di quello del giorno prima.

### Quando fermarsi
- Fitta improvvisa durante una ripetizione: chiudi la serie subito. Prova il
  movimento senza carico: se fa male, chiudi l'esercizio; se il dolore cambia la
  tecnica, chiudi.
- Dolore che sale sopra 3 su 10 durante l'esercizio: cambia variante (ROM più
  corto, presa diversa, macchina) o carico; se resta sopra, togli l'esercizio
  per la seduta.
- Dolore al riposo, che sveglia di notte o che dura più di una settimana senza
  migliorare: fisioterapista o medico.

### Regola del dolore (monitoraggio)
- Scala 0-10 (0 nessun dolore, 10 il peggiore immaginabile).
- Accettabile:
  - durante l'esercizio fino a 3 su 10 (alcuni protocolli per tendini,
    come Silbernagel 2007, accettano fino a 5 su 10);
  - il dolore torna al livello di base entro 24 ore (al mattino dopo);
  - non peggiora di settimana in settimana.
- Se una delle tre condizioni salta: la volta dopo riduci carico, ROM o volume
  di quel movimento (circa -30-50%) o sostituisci l'esercizio; se salta per 2
  sedute di fila o il dolore dura oltre 1-2 settimane, fisioterapista.
- Il riposo completo raramente serve per i sovraccarichi da tendine: di solito
  conviene un carico tollerato. Per strappi, traumi o segnali d'allarme no:
  serve una valutazione.

### Segnali che richiedono un medico
- Subito (113 in Norvegia, 112 in Italia):
  - dolore o oppressione al petto, mancanza di fiato sproporzionata,
    palpitazioni forti, svenimento o quasi svenimento durante lo sforzo;
  - mal di testa improvviso e violentissimo durante uno sforzo (il "peggiore
    della vita");
  - intorpidimento della zona genitale o perineale, perdita di controllo di
    vescica o intestino, debolezza progressiva alle gambe (possibile
    compressione delle radici nervose);
  - urina molto scura (color coca-cola) con dolore e gonfiore muscolare forti
    dopo un allenamento (possibile rabdomiolisi);
  - deformità evidente dopo un trauma, impossibilità di caricare un arto.
- Entro pochi giorni (medico o fisioterapista; in Norvegia legevakt 116 117 se
  fuori orario):
  - polpaccio gonfio, caldo, dolente soprattutto dopo un volo lungo o
    immobilità (possibile trombosi: valutazione rapida);
  - rigonfiamento all'inguine o all'addome che compare sotto sforzo (ernia);
  - articolazione gonfia e calda con febbre;
  - formicolio o dolore irradiato persistente;
  - sospetto stiramento con livido o zoppia;
  - dolore articolare che non rientra nella regola dopo 2 settimane.
- L'assistente non fa diagnosi: indica il livello di urgenza, la regola del
  dolore e cosa fare con l'allenamento nel frattempo (lavorare le zone non
  coinvolte, se il medico non lo vieta).

---

## H. Riferimenti chiave

Citazioni brevi, con cosa dicono. Se una fonte non è qui, non inventarla.

1. Schoenfeld, Ogborn, Krieger 2017, J Sports Sci. Meta-analisi sul volume:
   più serie settimanali per muscolo = più ipertrofia; 10 o più serie a
   settimana meglio di meno di 5. Rendimenti decrescenti.
2. Pelland, Remmert, Robinson, Hinson, Zourdos 2024, preprint SportRxiv
   (meta-regressioni su 67 studi). Il volume aumenta ipertrofia e forza con
   rendimenti decrescenti, molto più rapidi per la forza; la frequenza conta
   poco per l'ipertrofia a parità di volume, un po' di più per la forza. Contare
   le serie indirette come mezze serie. Numeri da verificare sulla versione
   pubblicata.
3. Schoenfeld, Ogborn, Krieger 2016, Sports Med. Allenare un muscolo 2 volte a
   settimana dà più ipertrofia di 1 volta (studi senza volume equiparato).
4. Schoenfeld, Grgic, Ogborn, Krieger 2017, J Strength Cond Res. Carichi bassi
   e alti danno ipertrofia simile se vicino al cedimento; la forza massima
   migliora di più con carichi alti (specificità).
5. Refalo et al. 2023, Sports Med. Meta-analisi: allenarsi fino al cedimento non
   dà più ipertrofia che fermarsi poco prima.
6. Robinson, Pelland, Remmert, Refalo, Jukic, Steele, Zourdos 2024, Sports Med
   54:2209-2231. Meta-regressioni: l'ipertrofia aumenta avvicinandosi al
   cedimento; la forza quasi non dipende dal RIR. RIR stimato dalle descrizioni
   degli studi, quindi incerto.
7. Helms et al. 2016, Strength Cond J; Zourdos et al. 2016, J Strength Cond Res.
   Scala RPE basata sul RIR: come si usa per autoregolare i carichi.
8. Halperin et al. 2022, Sports Med. Meta-analisi sull'accuratezza: in media si
   sottostimano le ripetizioni rimaste di circa 1; più precisi vicino al
   cedimento e nelle serie corte; forte eterogeneità.
9. Morton et al. 2018, Br J Sports Med. Meta-analisi su proteine e allenamento:
   beneficio fino a circa 1,6 g/kg al giorno (limite alto circa 2,2).
10. Jäger et al. 2017, J Int Soc Sports Nutr. Posizione ISSN sulle proteine:
    1,4-2,0 g/kg, 20-40 g per pasto ogni 3-4 ore.
11. Kreider et al. 2017, J Int Soc Sports Nutr. Posizione ISSN sulla creatina:
    efficace e sicura; 3-5 g al giorno, carico opzionale 0,3 g/kg per 5-7
    giorni.
12. Iraki, Fitschen, Espinar, Helms 2019, Sports. Fase di massa: surplus
    10-20%, +0,25-0,5% del peso a settimana, proteine 1,6-2,2 g/kg. Helms,
    Aragon, Fitschen 2014, J Int Soc Sports Nutr: in definizione -0,5-1% a
    settimana, proteine 2,3-3,1 g/kg di massa magra.
13. Barakat et al. 2020, Strength Cond J. La ricomposizione è possibile anche
    in soggetti allenati, più probabile in chi riprende dopo uno stop o ha più
    grasso; serve proteina alta e progressione.
14. Schumann et al. 2022, Sports Med. Allenamento concorrente: nessuna perdita
    apprezzabile di ipertrofia e forza massima; la forza esplosiva peggiora un
    po', soprattutto con i due lavori nella stessa seduta.
15. Parr et al. 2014, PLoS One (alcol e sintesi proteica: -24%/-37%); Coleman
    et al. 2024, PeerJ (una settimana di stop a metà programma: ipertrofia
    uguale, forza un po' inferiore); Silbernagel et al. 2007, Am J Sports Med
    (modello di monitoraggio del dolore: continuare l'attività con dolore
    accettabile funziona quanto il riposo nella tendinopatia d'Achille).

### Dove l'evidenza è incerta (dillo quando serve)
- Numeri esatti di serie ottimali per una persona: la direzione è solida, il
  numero no.
- Ipertrofia regionale (petto alto con l'inclinata, capo lungo sopra la testa):
  dati coerenti ma su campioni piccoli, effetti modesti.
- Dose ottimale di pliometria: non definita; programmi con pochi o molti
  contatti migliorano il salto nei non allenati. Si sale sulla qualità
  dell'atterraggio.
- Velocità di riacquisizione dopo uno stop ("memoria muscolare"): più rapida
  della prima acquisizione, meccanismi discussi; le traiettorie di forza sono
  una scommessa ragionevole, non una previsione.
- Formule di conversione (Epley): approssimative, individuali.
- Deload: utili per gestire la fatica, poco studiati.
- Cinture: aumentano la pressione addominale; prove deboli che riducano gli
  infortuni.
- Rapporto squat relativo e salto o scatto: correlazione osservata, causalità
  non dimostrata.
