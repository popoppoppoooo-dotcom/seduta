// Motore di progressione: dato il programma e lo storico delle sedute,
// calcola i carichi previsti. Solo regole fisse, nessun modello AI.
// Funziona nel browser (globalThis.Motore) e in node (require) per i test.
(function (root) {
  "use strict";

  const GIORNO = 86400000;

  // ---------- date ----------
  function giorni(a, b) { // b - a in giorni, date "YYYY-MM-DD"
    return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / GIORNO);
  }
  function settimanaDi(P, data) {
    let w = null;
    for (const s of P.settimane) if (giorni(s.inizio, data) >= 0) w = s;
    if (!w) return null;
    if (w.n === P.settimane[P.settimane.length - 1].n && giorni(w.inizio, data) >= 7) return null;
    return w;
  }
  function settimana(P, n) { return P.settimane.find(s => s.n === n) || null; }

  // ---------- numeri ----------
  const arrot = (kg, inc) => Math.round(kg / inc) * inc;
  const giu = (kg, inc) => Math.floor(kg / inc + 1e-9) * inc;
  const incBil = kg => (kg < 80 ? 2.5 : 5);
  const e1rm = (kg, rip, rir) => kg * (1 + (rip + (rir == null ? 2 : Math.min(rir, 5))) / 30);
  // carico per fare "rip" ripetizioni lasciandone "rir" in riserva
  const kgPer = (e1, rip, rir) => e1 / (1 + (rip + rir) / 30);

  function moda(valori) { // valore più frequente; a parità il più alto
    const c = new Map();
    for (const v of valori) c.set(v, (c.get(v) || 0) + 1);
    let best = null, n = 0;
    for (const [v, k] of c) if (k > n || (k === n && v > best)) { best = v; n = k; }
    return best;
  }
  const fatte = es => (es && !es.saltato ? (es.serie || []).filter(s => s && s.rip != null && s.rip >= 0) : []);
  const kgDi = es => moda(fatte(es).map(s => s.kg ?? 0));
  const fmtKg = kg => (kg == null ? "?" : String(+kg.toFixed(2)).replace(".", ","));

  // ---------- storico ----------
  // storico: [{id, data, sett, seduta, conD, esercizi: {exId: {serie:[{kg,rip,rir}], range, ripTarget, tecnica, saltato, deload}}}]
  // Restituisce le registrazioni di questi esercizi, dalla più recente.
  function storia(storico, ids, primaDi) {
    const out = [];
    for (const s of storico) {
      if (primaDi && s.data >= primaDi) continue;
      for (const id of ids) {
        const es = s.esercizi && s.esercizi[id];
        if (fatte(es).some(x => x.rip > 0) || fatte(es).length) out.push(Object.assign({ data: s.data, sett: s.sett, seduta: s.seduta, id, iniziale: !!s.iniziale }, es));
      }
    }
    return out.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
  }

  // ---------- esercizi della seduta ----------
  function eserciziDi(P, lettera, w, opz) {
    const conD = !!(opz && opz.conD);
    const lista = P.sedute[lettera].esercizi.filter(e => {
      if (e.da && w.n < e.da) return false;
      if (e.fino && w.n > e.fino) return false;
      if (e.conD && !conD) return false;
      if (e.senzaD && conD) return false;
      // settimane a onda: onda "F" = solo nelle settimane di forza, "I" = in tutte le altre
      if (e.onda === "F" && w.onda !== "F") return false;
      if (e.onda === "I" && w.onda === "F") return false;
      // se / tranneSe: l'esercizio c'è solo nelle settimane con (o senza) quel segno, es. "rdl"
      if (e.se && !w[e.se]) return false;
      if (e.tranneSe && w[e.tranneSe]) return false;
      if (e.tipo === "salti") {
        if (!w.salti) return false;
        if (e.id.endsWith("balzi") && !w.balzi) return false;
      }
      // settimana dei test: il massimale di trazioni solo nella seduta indicata
      if (e.tipo === "trazioni" && w.traz === "max" && w.trazTestIn && w.trazTestIn !== lettera) return false;
      return true;
    });
    // settimana da 2 sedute (B salta): scambi per non perdere i muscoli di B
    const due = opz && opz.dueSedute && P.dueSedute && P.dueSedute[lettera];
    if (!due) return lista;
    const out = [];
    for (const e of lista) {
      const i = due.togli.indexOf(e.id);
      if (i < 0) { out.push(e); continue; }
      const nuovo = defDi(P, due.aggiungi[i]);
      if (nuovo) out.push(Object.assign({}, nuovo, { n: e.n, nota: (nuovo.nota ? nuovo.nota + " " : "") + "Settimana da 2 sedute: al posto di " + e.nome.toLowerCase() + "." }));
    }
    return out;
  }
  function defDi(P, id) {
    for (const L of Object.keys(P.sedute)) for (const e of P.sedute[L].esercizi) if (e.id === id) return e;
    return null;
  }

  function rangeDi(def, w) {
    if (def.cal && Array.isArray(w.acc) && (w.blocco !== "Base" || w.deload)) return w.acc.slice();
    return def.range.slice();
  }
  // in scarico, rifinitura e settimana dei test gli esercizi non testati restano lontani dal cedimento
  const rirDi = (def, w) => {
    const r = w.deload || w.taper ? [Math.max(w.rir[0], 3), Math.max(w.rir[1], 4)] : w.rir.slice();
    // rirMin: esercizi pesanti a poche ripetizioni restano almeno a quel margine
    return def.rirMin ? [Math.max(r[0], def.rirMin), Math.max(r[1], def.rirMin)] : r;
  };

  // ---------- bilanciere (squat, stacco) ----------
  function idsLift(P, lift) {
    const out = [];
    for (const L of Object.keys(P.sedute)) for (const e of P.sedute[L].esercizi) if (e.tipo === "bilanciere" && e.lift === lift) out.push(e.id);
    return out;
  }
  // Cicli dopo dicembre (settimane con pct): i carichi sono una percentuale del massimale
  // stimato dalle serie fino a 6 ripetizioni delle 6 settimane prima del ciclo (il ciclo
  // precedente), meno il 5%: la formula da poche ripetizioni sovrastima il lavoro a 5-6.
  // Sopra il tetto (es. squat 122,5 × 3) si ferma.
  function rifCiclo(P, lift, cicloN, storico) {
    const h = storia(storico || [], idsLift(P, lift)).filter(e => e.sett < cicloN && !e.deload);
    const finestra = h.filter(e => e.sett >= cicloN - 6);
    const usa = finestra.length ? finestra : h.slice(0, 2);
    let e1 = 0;
    for (const e of usa) for (const s of fatte(e)) if (s.kg && s.rip > 0 && s.rip <= 6) e1 = Math.max(e1, e1rm(s.kg, s.rip, s.rir));
    const pausa = !finestra.length && e1 > 0;
    if (!e1) e1 = e1rm(P.base[lift], 5, 2);
    const t = P.tetti && P.tetti[lift];
    const cap = t ? e1rm(t.kg, t.rip, 0) : Infinity;
    // tetto raggiunto solo con una serie vera (la stima dalla formula può gonfiare)
    const tetto = !!t && h.some(e => fatte(e).some(s => s.kg >= t.kg && s.rip >= t.rip));
    e1 *= pausa ? 0.9 * 0.95 : 0.95; // margine del 5%; dopo una pausa lunga si riparte più bassi
    return { e1: Math.min(e1, cap * 0.95), tetto, pausa };
  }
  function kgTabella(P, lift, n, storico) {
    const w = settimana(P, n);
    if (!w || !Array.isArray(w[lift])) return null;
    if (w.pct) return giu(rifCiclo(P, lift, w.cicloN, storico).e1 * w[lift][2], 2.5);
    return P.base[lift] + w[lift][2];
  }
  function pianoBilanciere(P, def, w, storico, primaDi) {
    const cal = w[def.lift];
    if (!Array.isArray(cal)) return { kg: null, rip: [5], rir: [0, 1], range: [5, 5], motivo: "Settimana di test: trova il carico massimo per 5." };
    let serieN = cal[0];
    const rip = cal[1];
    const tab = kgTabella(P, def.lift, w.n, storico);
    // tetto raggiunto (es. squat): mantenimento, meno serie, il carico non sale oltre
    const rif = w.pct ? rifCiclo(P, def.lift, w.cicloN, storico) : null;
    const tettoL = P.tetti && P.tetti[def.lift];
    const mant = rif && rif.tetto && tettoL ? `Tetto raggiunto (${fmtKg(tettoL.kg)} × ${tettoL.rip}): mantenimento, ${Math.min(serieN, tettoL.serie || 3)} serie. ` : "";
    if (mant) serieN = Math.min(serieN, tettoL.serie || 3);
    const h = storia(storico, [def.id], primaDi);
    let kg = tab, motivo = `Tabella: ${fmtKg(tab)} kg.`;
    const u = h[0];
    // ciclo nuovo: schema di ripetizioni diverso, si riparte dalla percentuale del massimale
    const nuovoCiclo = rif && (!u || (settimana(P, u.sett) || {}).cicloN !== w.cicloN);
    let pulito = !u || nuovoCiclo;
    if (u && nuovoCiclo) {
      if (u.dolore) { kg = tab - incBil(tab); pulito = false; motivo = `Ciclo nuovo, ma l'ultima volta hai segnato dolore: un gradino sotto (${fmtKg(kg)} kg). Se torna sopra 3 su 10, chiedi al coach.`; }
    } else if (u) {
      const ku = kgDi(u);
      const set = fatte(u);
      const target = u.ripTarget ? Math.min(...u.ripTarget) : rip;
      const mancata = set.some(s => s.rip < target) || set.length < (u.ripTarget ? u.ripTarget.length : 1);
      const ult = set[set.length - 1];
      const dura = (ult && ult.rir === 0) || u.tecnica;
      // lo scarto dalla tabella vale solo dentro lo stesso ciclo: un ciclo nuovo riparte dal massimale
      const wU = settimana(P, u.sett);
      const tabU = wU && wU.cicloN === w.cicloN ? kgTabella(P, def.lift, u.sett, storico) : null;
      const scarto = tabU == null ? 0 : ku - tabU;
      const salto = w.n - u.sett; // settimane di distanza
      const norma = def.alterno ? 2 : 1; // lo stacco a settimane alterne: 2 settimane sono la norma
      const giu_ = w.deload || w.taper;
      if (u.dolore) {
        kg = ku - incBil(ku);
        motivo = `L'ultima volta hai segnato dolore: scendi a ${fmtKg(kg)} kg. Se torna sopra 3 su 10, o c'è ancora il mattino dopo, chiedi al coach.`;
        if (giu_) kg = Math.min(kg, tab + Math.min(0, scarto));
      } else if (mancata) {
        kg = ku - incBil(ku);
        motivo = `L'ultima volta (${fmtKg(ku)} kg) è mancata una ripetizione: scendi di un incremento.`;
        if (giu_) kg = Math.min(kg, tab + Math.min(0, scarto));
      } else if (dura) {
        kg = ku;
        motivo = u.tecnica ? `L'ultima volta la tecnica è peggiorata: ripeti ${fmtKg(ku)} kg.` : `L'ultima serie era a RIR 0: ripeti ${fmtKg(ku)} kg.`;
        if (giu_) kg = Math.min(ku, tab + scarto);
      } else if (salto === 0) {
        kg = ku; motivo = `Stesso carico già fatto questa settimana.`;
      } else if (ult && ult.rir != null && ult.rir >= 4 && salto <= norma && !giu_ && !u.deload && !(wU && (wU.deload || wU.taper))) {
        // troppo leggero: l'ultima serie con 4 o più ripetizioni in riserva (scritto dall'utente)
        kg = Math.max(tab + scarto, ku) + incBil(ku);
        motivo = `L'ultima serie era a RIR ${ult.rir}: troppo leggera, sali di un incremento in più (${fmtKg(arrot(kg, 2.5))} kg).`;
      } else {
        kg = tab + scarto; pulito = true;
        motivo = scarto === 0 ? `Tutto pulito: segui la tabella (${fmtKg(tab)} kg).`
          : `Segui la tabella mantenendo lo scarto dell'ultima volta (${scarto > 0 ? "+" : ""}${fmtKg(scarto)} kg): ${fmtKg(kg)} kg.`;
        if (salto >= norma + 2) { kg = Math.min(kg, ku); motivo = `Pausa di ${salto} settimane: riparti da ${fmtKg(ku)} kg.`; }
        else if (salto === norma + 1 && !giu_ && tabU != null) {
          const passo = kgTabella(P, def.lift, u.sett + norma, storico) - tabU;
          if (passo > 0 && kg > ku + passo) { kg = ku + passo; motivo = `Hai saltato una settimana: sali di un solo passo (${fmtKg(kg)} kg).`; }
        }
      }
    }
    if (w.test) {
      // un solo tentativo: il più basso tra tabella e stima dalle ultime settimane pesanti
      const rec = h.filter(e => e.sett >= w.n - 3 && e.sett < w.n && !e.deload);
      const e1 = Math.max(0, ...rec.flatMap(e => fatte(e).filter(s => s.kg).map(s => e1rm(s.kg, s.rip, s.rir))));
      kg = tab; motivo = `Test: un solo tentativo a ${fmtKg(tab)} kg × ${rip}. Prima 3-4 serie di avvicinamento in salita.`;
      if (e1 > 0) {
        const stima = giu(kgPer(e1, rip, 0), 2.5);
        if (stima < tab) { kg = stima; motivo = `Test: tentativo a ${fmtKg(stima)} kg × ${rip}, la stima dalle ultime settimane (la tabella dice ${fmtKg(tab)}). Se l'avvicinamento vola, puoi salire.`; }
        else motivo += ` La stima dalle ultime settimane lo regge (${fmtKg(stima)} kg).`;
      }
      return { kg: arrot(kg, 2.5), rip: Array(serieN).fill(rip), rir: [0, 0], range: [rip, rip], test: true, motivo };
    }
    kg = arrot(kg, 2.5);
    if (nuovoCiclo && pulito) motivo = `Ciclo nuovo: ${Math.round(cal[2] * 100)}% del massimale stimato (${fmtKg(Math.round(rif.e1))} kg)${rif.pausa ? ", ridotto per la pausa lunga" : ""}: ${fmtKg(kg)} kg.`;
    return { kg, rip: Array(serieN).fill(rip), rir: w.rir.slice(), range: [rip, rip], motivo: mant + motivo };
  }

  // ---------- trazioni ----------
  const TRAZ = ["A.trazioni", "B.trazioni", "C.trazioni"];
  // ultimo massimale: dal test registrato, altrimenti dal programma
  function massimaleTrazioni(P, storico, primaDi) {
    const t = storia(storico, TRAZ, primaDi).find(e => e.test);
    const m = t ? Math.max(0, ...fatte(t).map(s => s.rip)) : 0;
    if (m > 0) return { max: m, data: t.data };
    return P.base && P.base.trazioniMax ? { max: P.base.trazioniMax, data: null } : null;
  }
  // Scala: dopo ogni seduta pulita +1 ripetizione su una sola serie, la prima tra le più basse
  // (6666 -> 7666 -> 7766 -> 7776 -> 7777 -> 8777); la prima serie non supera il tetto del calendario.
  function pianoTrazioni(P, def, w, storico, primaDi) {
    const lettera = def.id.split(".")[0];
    if (w.traz === "max" || w.trazTestIn === lettera) return { kg: 0, rip: [null], rir: [0, 0], range: null, test: true, motivo: "Test: una sola serie al massimo, ROM pieno. Scrivi quante ne hai fatte: da qui il motore ricalcola le serie." };
    const mx = massimaleTrazioni(P, storico, primaDi);
    // tetto null (cicli dopo dicembre): tre quarti dell'ultimo massimale
    const serieN = w.traz[0], tetto = w.traz[1] ?? (mx ? Math.max(5, Math.round(0.75 * mx.max)) : 8);
    // obiettivo raggiunto (es. 12): dai cicli dopo dicembre trazioni zavorrate in doppia progressione
    const ob = (P.obiettivi || []).find(o => o.tipo === "trazioni");
    if (w.cicloN && ob && mx && mx.max >= ob.rip) return pianoZavorra(P, def, w, storico, primaDi, serieN, ob);
    const h = storia(storico, TRAZ, primaDi).filter(e => !e.test);
    // senza storia si parte dal 65% del massimale (minimo 3), mai sopra il calendario
    const partenza = mx ? Math.min(tetto, Math.max(3, Math.floor(0.65 * mx.max))) : tetto;
    const piano = (rip, motivo) => ({ kg: 0, rip, rir: w.rir.slice(), range: [Math.min(...rip), Math.max(...rip)], motivo });
    const testo = r => r.join("-");
    if (w.deload || w.taper) return piano(Array(serieN).fill(partenza), `Settimana leggera: ${serieN} × ${partenza}, lontano dal cedimento.`);
    const norm = h.filter(e => !e.deload);
    const u = norm[0];
    if (!u) return piano(Array(serieN).fill(partenza), partenza < tetto ? `Partenza: ${partenza} per serie, circa due terzi del massimale (${mx.max}).` : `Calendario: ${serieN} × ${tetto}.`);
    const schemaDi = e => {
      const t = e.ripTarget && e.ripTarget[0] != null ? e.ripTarget.slice() : fatte(e).map(s => s.rip);
      const out = [];
      for (let i = 0; i < serieN; i++) out.push(Math.min(tetto, t[Math.min(i, t.length - 1)]));
      return out;
    };
    const pulita = e => {
      const t = e.ripTarget && e.ripTarget[0] != null ? e.ripTarget : null;
      const s = fatte(e);
      return !e.tecnica && t && s.length >= t.length && s.every((x, i) => x.rip >= (t[i] ?? t[t.length - 1]));
    };
    let r = schemaDi(u);
    const set = fatte(u);
    if (pulita(u)) {
      if (set[set.length - 1].rir === 0) return piano(r, `Tutte fatte, ma l'ultima a RIR 0: ripeti ${testo(r)}.`);
      const i = r.indexOf(Math.min(...r));
      if (i === 0 && r[0] >= tetto) return piano(r, `Tutte fatte: sei al tetto del calendario (${tetto} sulla prima serie), ripeti ${testo(r)}.`);
      r[i]++;
      return piano(r, `Ultima seduta pulita: +1 sulla serie ${i + 1} (${testo(r)}).`);
    }
    const prima = norm[1];
    if (prima && !pulita(prima) && testo(schemaDi(prima)) === testo(r)) {
      const giu = r.map((x, i) => Math.max(3, Math.min(x, set[i] ? set[i].rip : x)));
      return piano(giu, `Due sedute di fila sotto lo schema ${testo(r)}: riparti da quello che hai fatto (${testo(giu)}).`);
    }
    return piano(r, `L'ultima volta non tutte riuscite: ripeti ${testo(r)}.`);
  }

  function pianoZavorra(P, def, w, storico, primaDi, serieN, ob) {
    const conKg = storico.filter(s => fatte(s.esercizi && s.esercizi[def.id]).some(x => x.kg > 0));
    const d = { id: def.id, nome: def.nome, tipo: "accessorio", serie: serieN, range: [5, 8], kg: 2.5, inc: 2.5 };
    if (!storia(conKg, [def.id], primaDi).length) {
      const n = w.deload || w.taper ? Math.max(1, Math.ceil(serieN / 2)) : serieN;
      return { kg: 2.5, rip: Array(n).fill(5), rir: rirDi(d, w), range: [5, 8], zavorra: true, motivo: `Obiettivo di ${ob.rip} trazioni raggiunto: da qui con zavorra (cintura o manubrio tra i piedi). Parti da 2,5 kg × 5, poi doppia progressione fino a 8.` };
    }
    const p = pianoAccessorio(P, d, w, conKg, primaDi);
    return Object.assign(p, { zavorra: true, motivo: "Trazioni zavorrate. " + p.motivo });
  }

  // ---------- accessori (doppia progressione) ----------
  function pianoAccessorio(P, def, w, storico, primaDi) {
    const range = rangeDi(def, w);
    const rir = rirDi(def, w);
    const inc = def.inc || 2;
    let serieN = def.serie;
    const leggero = w.deload || w.taper;
    if (leggero) serieN = Math.max(1, Math.ceil(def.serie / 2));
    else if (w.fattoreSerie) serieN = Math.max(1, Math.round(def.serie * w.fattoreSerie)); // ponte: circa 2/3
    // storia: per gli esercizi legati usa anche quella dell'esercizio di riferimento
    const ids = def.legatoA ? [def.id, def.legatoA] : [def.id];
    const h = storia(storico, ids, primaDi);
    const kTest = w.testAccessori && w.testAccessori[def.id];
    if (kTest != null) {
      // test di un accessorio: una serie al carico obiettivo, se la storia lo regge
      const n = def.range[0];
      const e1 = Math.max(0, ...h.filter(e => !e.deload).slice(0, 3).flatMap(e => fatte(e).filter(s => s.kg).map(s => e1rm(s.kg, s.rip, s.rir))));
      let kg = kTest, motivo = `Test: un solo tentativo a ${fmtKg(kTest)} kg × ${n}, dopo 2 serie leggere di avvicinamento.`;
      if (e1 > 0) {
        const stima = giu(kgPer(e1, n, 0), inc);
        if (stima < kTest) { kg = Math.max(inc, stima); motivo = `Test: l'obiettivo è ${fmtKg(kTest)} kg × ${n}, la stima dalle ultime sedute dice ${fmtKg(kg)} kg. Parti da lì; se sale bene, prova l'obiettivo.`; }
      }
      return { kg, rip: [n], rir: [0, 0], range: [n, n], test: true, motivo };
    }
    const norm = h.filter(e => !e.deload);
    const u = norm[0] || h[0];
    let kg = def.macchina && storico && storico.nuovaPalestra ? null : def.kg, rips, motivo;

    if (!u) {
      if (kg == null) {
        return { kg: null, rip: Array(serieN).fill(range[0]), rir, range, motivo: "Carico da trovare: scegli un peso con cui arrivi a " + range[0] + "-" + range[1] + " ripetizioni lasciandone " + rir[0] + "-" + rir[1] + " in riserva." };
      }
      if (range[0] !== def.range[0] || range[1] !== def.range[1]) {
        const e1 = e1rm(kg, def.range[0], 2);
        kg = Math.max(inc, giu(kgPer(e1, range[0], rir[1]), inc));
        motivo = `Nuovo range ${range[0]}-${range[1]}: carico stimato da ${fmtKg(def.kg)} kg × ${def.range[0]}.`;
      } else motivo = `Carico di partenza del programma.`;
      return { kg, rip: Array(serieN).fill(range[0]), rir, range, motivo };
    }

    // C.panca segue sempre il carico più recente di B.panca, senza farlo salire da sola
    if (def.legatoA) {
      const hR = storia(storico, [def.legatoA], primaDi);
      const uR = hR.filter(e => !e.deload)[0] || hR[0];
      if (uR) {
        const sR = fatte(uR), rR = uR.range || def.range;
        const kR = Math.max(kgDi(uR), ...sR.filter(s => s.kg && s.rip >= rR[0]).map(s => s.kg));
        return { kg: kR, rip: Array(serieN).fill(range[0]), rir: leggero ? [3, 4] : rir, range, motivo: `Stesso carico di ${P_nome(P, def.legatoA)} (${fmtKg(kR)} kg).` };
      }
    }

    const set = fatte(u);
    const wU = settimana(P, u.sett);
    const rangeU = u.range || (wU ? rangeDi(def, wU) : def.range);
    // carico di riferimento: il più frequente, o il più alto con cui sei rimasto nel range
    const kMod = kgDi(u);
    const kAlto = Math.max(0, ...set.filter(s => s.kg && s.rip >= rangeU[0]).map(s => s.kg));
    const ku = kAlto > kMod ? kAlto : kMod;
    if (rangeU[0] !== range[0] || rangeU[1] !== range[1]) {
      // cambio di range (es. inizio blocco Forza): stima dal miglior set recente
      const recenti = h.slice(0, 3).flatMap(e => fatte(e).map(s => e1rm(s.kg ?? ku, s.rip, s.rir)));
      const e1 = Math.max(...recenti);
      kg = Math.max(inc, giu(kgPer(e1, range[0], rir[1]), inc));
      motivo = `Nuovo range ${range[0]}-${range[1]}: carico stimato dalle ultime sedute (${fmtKg(ku)} kg × ${set.map(s => s.rip).join("/")}).`;
      rips = Array(serieN).fill(range[0]);
    } else {
      const pianoN = u.ripTarget ? u.ripTarget.length : def.serie;
      // il RIR è facoltativo (dal 9 ottobre 2026): se manca si assume 2, come nel taccuino.
      // Se c'è, aiuta: RIR 0 sull'ultima serie blocca la salita, RIR 4 sulla prima la accelera.
      const ultimaRir = set.length ? set[set.length - 1].rir ?? 2 : null;
      // serie più leggere solo come avvicinamento (prima del carico pieno), non come scalo dopo;
      // una serie tentata più pesante non blocca la salita
      const iKu = set.findIndex(s => (s.kg ?? ku) === ku);
      const scalo = set.some((s, i) => i > iKu && (s.kg ?? ku) < ku);
      const tutteInCima = set.length >= Math.min(pianoN, def.serie) && ultimaRir != null && !scalo && set.every(s => (s.kg ?? ku) !== ku || (s.rip >= range[1] && (s.rir == null || s.rir >= 1)));
      const primaFacile = def.id !== "B.panca" && set[0] && set[0].rip >= range[1] && set[0].rir != null && set[0].rir >= 4 && (set[0].kg ?? ku) >= ku;
      const tutteSotto = set.every(s => s.rip < range[0]);
      if (kAlto > kMod && !def.legatoA) {
        kg = ku; rips = Array(serieN).fill(range[0]);
        motivo = `L'ultima volta una serie a ${fmtKg(ku)} kg nel range: ora tutte a ${fmtKg(ku)} kg, da ${range[0]} ripetizioni.`;
      } else if (primaFacile && !def.legatoA) {
        kg = ku + 2 * inc; rips = Array(serieN).fill(range[0]);
        motivo = `La prima serie era in cima al range con RIR ${set[0].rir}: troppo leggero, sali di due incrementi.`;
      } else if (tutteInCima && !def.legatoA) {
        kg = ku + inc; rips = Array(serieN).fill(range[0]);
        motivo = `Tutte le serie a ${range[1]}: sali a ${fmtKg(ku + inc)} kg e riparti da ${range[0]}.`;
        if (def.id === "B.panca" && set.length < 4) { kg = ku; motivo = `Panca: si sale solo dopo 4 × ${range[1]}.`; rips = Array(serieN).fill(range[1]); }
      } else if (tutteSotto && set.length >= 2) {
        kg = Math.max(inc, ku - inc); rips = Array(serieN).fill(range[0]);
        motivo = `L'ultima volta tutte le serie sotto ${range[0]}: scendi a ${fmtKg(kg)} kg.`;
      } else if (scalo && !def.legatoA) {
        // prima si portano tutte le serie al carico pieno, poi si aggiungono ripetizioni
        const rKu = Math.min(...set.filter(s => (s.kg ?? ku) === ku).map(s => s.rip));
        kg = ku; rips = Array(serieN).fill(Math.min(range[1], Math.max(range[0], rKu)));
        motivo = `L'ultima volta hai scalato il peso nelle ultime serie: ora tutte a ${fmtKg(ku)} kg × ${rips[0]}, poi si aggiungono ripetizioni.`;
      } else {
        kg = ku;
        rips = [];
        for (let i = 0; i < serieN; i++) {
          const prec = set[Math.min(i, set.length - 1)].rip;
          rips.push(Math.min(range[1], Math.max(range[0], prec + 1)));
        }
        motivo = `Stesso carico: prova ad aggiungere una ripetizione per serie (ultima volta ${set.map(s => s.rip).join("/")}).`;
      }
    }
    if (leggero) {
      // carico con cui fai range[0] ripetizioni lasciandone 4 in riserva, mai sopra l'ultimo
      const e1 = Math.max(...h.slice(0, 3).flatMap(e => fatte(e).map(s => e1rm(s.kg ?? ku, s.rip, s.rir))));
      kg = Math.min(ku, Math.max(inc, giu(kgPer(e1, range[0], 4), inc)));
      rips = Array(serieN).fill(range[0]);
      motivo = (w.taper ? "Taper" : "Scarico") + `: metà serie, carico per restare a 4 ripetizioni dal cedimento (${fmtKg(kg)} kg).`;
    }
    return { kg: kg == null ? null : +kg.toFixed(2), rip: rips, rir: leggero ? [Math.max(rir[0], 3), Math.max(rir[1], 4)] : rir, range, motivo };
  }
  function P_nome(P, id) {
    for (const L of Object.keys(P.sedute)) for (const e of P.sedute[L].esercizi) if (e.id === id) return e.nome + " (" + L + ")";
    return id;
  }

  // ---------- corpo libero e salti ----------
  function pianoSemplice(def, w) {
    if (def.tipo === "salti") {
      const [n, r] = def.id.endsWith("balzi") ? [3, 3] : w.salti;
      return { kg: 0, rip: Array(n).fill(r), rir: [3, 5], range: [r, r], motivo: "Esplosivi, da fresco: qualità prima del numero." };
    }
    const n = w.deload || w.taper ? Math.max(1, Math.ceil(def.serie / 2)) : w.fattoreSerie ? Math.max(1, Math.round(def.serie * w.fattoreSerie)) : def.serie;
    return { kg: 0, rip: Array(n).fill(def.range[0]), rir: rirDi(def, w), range: def.range.slice(), motivo: "" };
  }

  function pianoPer(P, def, w, storico, data) {
    if (def.tipo === "bilanciere") return pianoBilanciere(P, def, w, storico, data);
    if (def.tipo === "trazioni") return pianoTrazioni(P, def, w, storico, data);
    if (def.tipo === "accessorio") return pianoAccessorio(P, def, w, storico, data);
    return pianoSemplice(def, w);
  }

  // ---------- piano della seduta ----------
  function pianoSeduta(P, lettera, data, storico, opz) {
    const w = settimanaDi(P, data);
    if (!w) return null;
    const defs = eserciziDi(P, lettera, w, opz);
    const esercizi = defs.map(def => {
      const p = pianoPer(P, def, w, storico, data);
      const ultima = storia(storico, def.legatoA ? [def.id, def.legatoA] : [def.id], data)[0] || null;
      return Object.assign({ def, ultima }, p);
    });
    // un massimale di trazioni non va prima del test di un accessorio (panca 28 × 8)
    const iT = esercizi.findIndex(e => e.def.tipo === "trazioni" && e.test);
    let iA = -1; esercizi.forEach((e, i) => { if (e.test && e.def.tipo === "accessorio") iA = i; });
    if (iT >= 0 && iA > iT) { const [tr] = esercizi.splice(iT, 1); esercizi.splice(iA, 0, tr); tr.motivo += " Dopo il test di " + esercizi[iA - 1].def.nome.toLowerCase() + ", per non stancare spalle e presa prima."; }
    return adattaForma({ settimana: w, lettera, nome: P.sedute[lettera].nome, riscaldamento: P.sedute[lettera].riscaldamento, esercizi }, opz && opz.forma);
  }

  // ---------- esercizio alternativo (macchina occupata o dolore) ----------
  // Ha una storia sua (id "alt.*"): la progressione dell'originale non si sporca.
  function pianoAlternativa(P, defOrig, alt, data, storico, primaDi) {
    const w = settimanaDi(P, data);
    const pOrig = pianoPer(P, defOrig, w, storico, primaDi);
    const nSerie = pOrig.rip.length;
    const range = defOrig.tipo === "accessorio" ? rangeDi(defOrig, w)
      : defOrig.tipo === "bilanciere" ? [pOrig.rip[0], pOrig.rip[0] + 2] : (defOrig.range || [8, 12]).slice();
    const def = { id: alt.id, nome: alt.nome, tipo: "accessorio", serie: nSerie, range, kg: null, inc: alt.inc || 2.5, cal: false };
    const p = pianoAccessorio(P, def, Object.assign({}, w, { deload: false, taper: false }), storico, primaDi);
    p.rip = p.rip.slice(0, nSerie);
    while (p.rip.length < nSerie) p.rip.push(range[0]);
    if (p.kg == null) p.motivo = `Prima volta: ${alt.kgDa || "trova un carico"} per ${range[0]}-${range[1]} ripetizioni, ${pOrig.rir[0]}-${pOrig.rir[1]} in riserva.`;
    p.rir = pOrig.rir;
    return Object.assign({ def: Object.assign(def, { n: defOrig.n, nota: alt.nota, alPostoDi: defOrig.id }) }, p);
  }

  // ---------- giornata no: meno volume, più margine ----------
  function adattaForma(piano, forma) {
    if (forma !== "giu" && forma !== "rosso") return piano;
    const w = piano.settimana;
    // giornata rossa: anche niente salti né balzi
    if (forma === "rosso") piano.esercizi = piano.esercizi.filter(e => e.def.tipo !== "salti");
    // in scarico e rifinitura il volume è già ridotto: non si taglia altro
    if (w && (w.deload || w.taper)) {
      for (const e of piano.esercizi) e.motivo = (e.motivo ? e.motivo + " " : "") + "Giornata no: settimana già leggera, tieni il RIR alto e non forzare.";
      return piano;
    }
    for (const e of piano.esercizi) {
      const t = e.def.tipo, n = e.rip.length;
      if (t === "salti") { e.rip = e.rip.slice(0, Math.max(2, n - 2)); continue; }
      if (e.test) continue; // un test resta un tentativo singolo
      e.rip = e.rip.slice(0, Math.max(Math.min(2, n), n - 1));
      if (e.rir) e.rir = [e.rir[0] + 1, e.rir[1] + 1];
      e.motivo = (e.motivo ? e.motivo + " " : "") + "Giornata no: una serie in meno, un RIR in più.";
    }
    return piano;
  }

  // ---------- quale seduta oggi ----------
  function lunediDi(data) {
    const d = new Date(data + "T12:00:00Z");
    const g = (d.getUTCDay() + 6) % 7;
    return new Date(d - g * GIORNO).toISOString().slice(0, 10);
  }
  function prossimaSeduta(P, storico, oggi, opz) {
    const lun = lunediDi(oggi);
    const fatteSett = storico.filter(s => s.data >= lun && s.data <= oggi && !s.iniziale).map(s => s.seduta);
    const ordine = ["A", "B", "C", "D"];
    const avvisi = [];
    const ieri = new Date(Date.parse(oggi + "T12:00:00Z") - GIORNO).toISOString().slice(0, 10);
    const diIeri = storico.filter(s => s.data === ieri).map(s => s.seduta);
    const gambe = l => l === "A" || l === "C";
    const dow = new Date(oggi + "T12:00:00Z").getUTCDay(); // 0 domenica ... 5 venerdì, 6 sabato
    const vietata = l => gambe(l) && (diIeri.some(gambe) || dow === 5);
    // giorni utili da oggi a domenica, senza il sabato del tennis
    let giorniUtili = 0;
    for (let g = dow; ; g = (g + 1) % 7) { if (g !== 6) giorniUtili++; if (g === 0) break; }
    const rimaste = ["A", "B", "C"].filter(l => !fatteSett.includes(l));
    // settimane da 2 sedute: previste dal programma (ponte) o perché nelle ultime 2 settimane
    // ne hai fatte al massimo 2. Prima A e C con dentro gli esercizi chiave di B; B solo come terza.
    const wOggi = settimanaDi(P, oggi);
    const perDue = wOggi && wOggi.dueSedute ? "programma" : modoDue(P, storico, oggi) ? "frequenza" : null;
    const restaAC = ["A", "C"].filter(l => rimaste.includes(l));
    if (perDue && restaAC.length && restaAC.length <= giorniUtili) {
      const scelta = restaAC.find(l => !vietata(l)) || restaAC[0];
      avvisi.push(perDue === "programma" ? "Settimana da 2 sedute (A e C, con dentro gli esercizi chiave di B). Una terza, B, solo se ti va."
        : "Nelle ultime 2 settimane hai fatto al massimo 2 sedute: l'app passa alla versione da 2 (A e C, con dentro gli esercizi chiave di B). Torna a 3 appena una settimana ne conta 3.");
      if (vietata(scelta)) avvisi.push(diIeri.some(gambe) ? `Ieri hai fatto ${diIeri.find(gambe)}: tieni il RIR alto.` : "Domani c'è tennis: tieni il RIR alto.");
      if (dow === 2) avvisi.push("Stasera bachata: va bene qualsiasi seduta, ma non arrivarci distrutto.");
      return { scelta, fatte: fatteSett, avvisi, corta: false, senzaB: true, perDue };
    }
    const corta = rimaste.length > giorniUtili;
    let scelta;
    if (corta) {
      // non ci stanno tutte: prima C (stacco), poi A, poi B
      const pr = ["C", "A", "B"].filter(l => rimaste.includes(l));
      scelta = pr.find(l => !vietata(l)) || pr[0];
      avvisi.push(`Settimana corta: restano ${giorniUtili === 1 ? "un giorno" : giorniUtili + " giorni"} per ${rimaste.length} sedute. Oggi ${scelta}${rimaste.includes("B") && scelta !== "B" ? "; B salta e i suoi esercizi chiave entrano in A e C" : ""}.`);
      if (vietata(scelta)) avvisi.push(diIeri.some(gambe) ? `Ieri hai fatto ${diIeri.find(gambe)}: tieni il RIR alto.` : "Domani c'è tennis: tieni il RIR alto.");
    } else {
      scelta = ordine.find(l => !fatteSett.includes(l)) || null;
      if (scelta && gambe(scelta) && diIeri.some(gambe)) {
        avvisi.push(`Ieri hai fatto ${diIeri.find(gambe)}: mai A e C in giorni consecutivi.`);
        const alt = ordine.find(l => !fatteSett.includes(l) && !gambe(l));
        if (alt) scelta = alt;
      }
      if (scelta && gambe(scelta) && dow === 5) {
        const alt = ordine.find(l => !fatteSett.includes(l) && !gambe(l));
        if (alt) { avvisi.push(`Domani c'è tennis: oggi ${alt}, la seduta di gambe (${scelta}) la sposti a domenica.`); scelta = alt; }
        else avvisi.push("Domani c'è tennis: se fai gambe oggi, tieni il RIR alto.");
      }
    }
    if (opz && opz.forma === "rosso" && scelta && gambe(scelta) && !corta) {
      const alt = ["B", "D"].find(l => !fatteSett.includes(l));
      if (alt) { avvisi.push(`Oggi sei in rosso: meglio ${alt}, la seduta ${scelta} un altro giorno.`); scelta = alt; }
    }
    if (dow === 2) avvisi.push("Stasera bachata: va bene qualsiasi seduta, ma non arrivarci distrutto.");
    if (scelta === "D") avvisi.push("D è opzionale: falla solo se arrivi fresco.");
    return { scelta, fatte: fatteSett, avvisi, corta, senzaB: corta && rimaste.includes("B") };
  }

  // Al massimo 2 sedute (A, B, C) in ciascuna delle 2 settimane precedenti, almeno una per
  // settimana (una settimana vuota è una pausa, non un'abitudine). Le settimane da 2 previste
  // dal programma (ponte) non contano.
  function modoDue(P, storico, oggi) {
    const lun = lunediDi(oggi);
    for (let k = 1; k <= 2; k++) {
      const da = new Date(Date.parse(lun + "T12:00:00Z") - 7 * k * GIORNO).toISOString().slice(0, 10);
      const a = new Date(Date.parse(da + "T12:00:00Z") + 6 * GIORNO).toISOString().slice(0, 10);
      const w = settimanaDi(P, da);
      if (!w || w.dueSedute) return false;
      const n = new Set(storico.filter(s => s.data >= da && s.data <= a && !s.iniziale && "ABC".includes(s.seduta)).map(s => s.seduta)).size;
      if (n < 1 || n > 2) return false;
    }
    return true;
  }

  // ---------- palestra nuova ----------
  // Dalla data indicata le macchine e i cavi ripartono da zero (carichi non confrontabili);
  // bilancieri, manubri e corpo libero tengono la storia.
  function perPalestra(P, storico, dal) {
    if (!dal) return storico;
    const mac = new Set();
    for (const L of Object.keys(P.sedute)) for (const e of P.sedute[L].esercizi) if (e.macchina) mac.add(e.id);
    const out = storico.map(s => {
      if (s.data >= dal || !s.esercizi) return s;
      const es = {};
      for (const id of Object.keys(s.esercizi)) if (!mac.has(id)) es[id] = s.esercizi[id];
      return Object.assign({}, s, { esercizi: es });
    });
    out.nuovaPalestra = dal; // le macchine senza storia: carico da trovare, non quello del programma
    return out;
  }

  // ---------- prontezza: tre domande prima della seduta ----------
  // risposte: punti da 0 a 3 per sonno, indolenzimento, energia (mancante = 0)
  function prontezza(r) {
    const v = ["sonno", "dolori", "energia"].map(k => (r && r[k]) || 0);
    const somma = v.reduce((a, b) => a + b, 0), max = Math.max(...v);
    if (somma >= 5 || max >= 3) return "rosso";
    if (somma >= 3 || max >= 2) return "giu";
    return "ok";
  }

  // ---------- avvicinamento e dischi (squat e stacco) ----------
  // Serie in salita verso il carico di lavoro: 40-60-75-85% (più 90% nei test),
  // arrotondate a 2,5 kg. Lo stacco parte da 60 kg (dischi da 20: altezza giusta).
  function avvicinamento(kgLavoro, lift, test) {
    if (!kgLavoro || kgLavoro <= 20) return [];
    const base = lift === "stacco" ? Math.min(60, kgLavoro) : 20;
    const out = [{ kg: base, rip: lift === "stacco" ? 5 : 8 }];
    const passi = test ? [[0.4, 5], [0.6, 3], [0.75, 2], [0.85, 1], [0.9, 1]] : [[0.4, 5], [0.6, 3], [0.75, 2], [0.85, 1]];
    for (const [f, r] of passi) {
      const k = arrot(kgLavoro * f, 2.5);
      if (k >= out[out.length - 1].kg + 7.5 && k < kgLavoro) out.push({ kg: k, rip: r });
    }
    return out;
  }
  // dischi per lato con bilanciere da 20 kg; null se il carico non si compone
  function dischi(kg, bilanciere = 20, set = [25, 20, 15, 10, 5, 2.5, 1.25]) {
    let r = (kg - bilanciere) / 2;
    if (r < 0) return null;
    const out = [];
    for (const d of set) while (r >= d - 1e-9) { out.push(d); r -= d; }
    return r > 1e-6 ? null : out;
  }

  // ---------- obiettivi di dicembre ----------
  // Stima di oggi dalla serie migliore delle ultime 3 settimane (e1RM con RIR).
  function progressoObiettivi(P, storico, oggi) {
    const da = new Date(Date.parse(oggi + "T12:00:00Z") - 21 * 864e5).toISOString().slice(0, 10);
    return (P.obiettivi || []).map(o => {
      const r = { nome: o.nome, obiettivo: o, stima: null, data: null };
      const h = storia(storico, o.ids, null).filter(e => e.data >= da && e.data <= oggi);
      if (o.tipo === "trazioni") {
        const test = massimaleTrazioni(P, storico, null).max;
        let best = 0;
        for (const e of h) for (const s of fatte(e)) best = Math.max(best, s.rip + (s.rir == null ? 1 : Math.min(s.rir, 5)));
        r.stima = Math.max(test, best); r.daTest = test; r.data = h[0] ? h[0].data : null;
        if (test >= o.rip) r.obiettivo = Object.assign({}, o, { nota: "raggiunto al test: dal prossimo ciclo trazioni zavorrate" });
        return r;
      }
      let e1 = 0;
      for (const e of h) for (const s of fatte(e)) if (s.kg) { const x = e1rm(s.kg, s.rip, s.rir); if (x > e1) { e1 = x; r.data = e.data; } }
      if (e1 > 0) r.stima = giu(kgPer(e1, o.rip, 0), o.inc || 2.5);
      // obiettivo raggiunto con passo: sale da solo al gradino successivo
      if (o.passo && r.stima != null && r.stima >= o.kg) {
        let kg = o.kg;
        while (r.stima >= kg) kg += o.passo;
        r.obiettivo = Object.assign({}, o, { kg, nota: `${fmtKg(o.kg)} × ${o.rip} raggiunto, nuovo obiettivo` });
        r.raggiunto = o.kg;
      }
      return r;
    });
  }

  // ---------- testo stile taccuino ----------
  function riga(nome, es) {
    if (es.saltato) return `${nome} — saltato`;
    const s = fatte(es).map(x => (x.kg ? `${fmtKg(x.kg)}×${x.rip}` : `${x.rip}`) + (x.rir != null ? ` (${x.rir})` : ""));
    return `${nome} — ${s.join(", ")}${es.tecnica ? " [tecnica peggiorata]" : ""}${es.dolore ? " [dolore]" : ""}${es.nota ? " — " + es.nota : ""}`;
  }
  function testoSeduta(P, s) {
    const righe = [`${s.data} · Settimana ${s.sett} · Seduta ${s.seduta}`];
    for (const id of Object.keys(s.esercizi || {})) righe.push(riga(s.esercizi[id].nome || P_nome(P, id).replace(/ \([A-D]\)$/, ""), s.esercizi[id]));
    if (s.nota) righe.push("Note: " + s.nota);
    return righe.join("\n");
  }

  const Motore = { modoDue, perPalestra, rifCiclo, avvicinamento, dischi, progressoObiettivi, prontezza, massimaleTrazioni, defDi, pianoAlternativa, adattaForma, settimanaDi, settimana, eserciziDi, pianoSeduta, prossimaSeduta, testoSeduta, riga, storia, fatte, kgDi, e1rm, fmtKg, lunediDi, giorni };
  if (typeof module !== "undefined" && module.exports) module.exports = Motore;
  else root.Motore = Motore;
})(typeof globalThis !== "undefined" ? globalThis : this);
