const assert = require("node:assert/strict");
const test = require("node:test");
require("../programma.js");
const M = require("../motore.js");
const P = globalThis.PROGRAMMA;
const es = (serie, extra = {}) => Object.assign({ serie: serie.map(([kg, rip, rir]) => ({ kg, rip, rir })) }, extra);
const sed = (data, sett, seduta, esercizi) => ({ id: data + seduta, data, sett, seduta, esercizi });
const trova = (p, id) => p.esercizi.find(e => e.def.id === id);
// dal 9 ottobre C ha la panca inclinata 30°, non più la piana legata: per provare la logica
// "legatoA" si usa una copia del programma con la vecchia C.panca
const PL = JSON.parse(JSON.stringify(P));
PL.sedute.C.esercizi.push({ id: "C.panca", n: "5A", nome: "Panca piana manubri", tipo: "accessorio", serie: 3, range: [8, 10], kg: 20, inc: 2, legatoA: "B.panca", da: 7 });

test("settimane", () => {
  assert.equal(M.settimanaDi(P, "2026-10-12").n, 7);
  assert.equal(M.settimanaDi(P, "2026-10-18").n, 7);
  assert.equal(M.settimanaDi(P, "2026-12-20").n, 16);
  assert.equal(M.settimanaDi(P, "2026-12-21").n, 17); // dopo dicembre il programma continua da solo
  assert.equal(M.settimanaDi(P, "2027-02-01").n, 23);
  assert.equal(M.settimanaDi(P, "2028-06-19"), null);
  assert.equal(M.settimanaDi(P, "2026-08-01"), null);
});

test("A settimana 7 senza storico", () => {
  const p = M.pianoSeduta(P, "A", "2026-10-12", []);
  const sq = trova(p, "A.squat");
  assert.equal(sq.kg, 110); assert.deepEqual(sq.rip, [4, 4, 4, 4]);
  assert.equal(trova(p, "A.hack"), undefined); // dalla settimana 7 al suo posto la panca inclinata
  const inc = trova(p, "A.inclinata30");
  assert.deepEqual(inc.range, [8, 10]); assert.equal(inc.kg, 20); assert.equal(inc.rip.length, 3);
  assert.equal(trova(p, "A.bulgari"), undefined); assert.ok(trova(p, "A.legcurl"));
  assert.deepEqual(trova(p, "A.trazioni").rip, [4, 4, 4, 4]); // 65% di 7, senza storia
  assert.ok(trova(p, "A.salti")); assert.equal(trova(p, "A.salti").rip.length, 5);
  console.log(p.esercizi.map(e => `${e.def.nome}: ${e.rip.length}×${e.rip[0]} @ ${e.kg} — ${e.motivo}`).join("\n"));
});

test("squat: dopo il deload pulito segue la tabella", () => {
  const st = [sed("2026-10-05", 6, "A", { "A.squat": es([[102.5, 5, 4], [102.5, 5, 4]], { ripTarget: [5, 5] }) })];
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-10-12", st), "A.squat").kg, 110);
});
test("squat: ripetizione mancata -> scende di 5", () => {
  const st = [sed("2026-10-12", 7, "A", { "A.squat": es([[110, 4, 1], [110, 4, 1], [110, 4, 0], [110, 3, 0]], { ripTarget: [4, 4, 4, 4] }) })];
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-10-19", st), "A.squat").kg, 105);
});
test("squat: RIR 0 sull'ultima -> ripete", () => {
  const st = [sed("2026-10-12", 7, "A", { "A.squat": es([[110, 4, 2], [110, 4, 1], [110, 4, 1], [110, 4, 0]], { ripTarget: [4, 4, 4, 4] }) })];
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-10-19", st), "A.squat").kg, 110);
});
test("squat: indietro di 2,5 rispetto alla tabella, poi pulito -> mantiene lo scarto", () => {
  const st = [sed("2026-10-26", 9, "A", { "A.squat": es([[110, 4, 2], [110, 4, 2], [110, 4, 1], [110, 4, 1]], { ripTarget: [4, 4, 4, 4] }) })];
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-11-02", st), "A.squat").kg, 112.5);
});
test("stacco a settimane alterne: 2 settimane sono la norma, 4 una pausa", () => {
  const st = [sed("2026-10-14", 7, "C", { "C.stacco": es([[110, 4, 2], [110, 4, 2], [110, 4, 2]], { ripTarget: [4, 4, 4] }) })];
  assert.equal(trova(M.pianoSeduta(P, "C", "2026-10-28", st), "C.stacco").kg, 115); // tabella 97,5 + scarto 17,5
  assert.equal(trova(M.pianoSeduta(P, "C", "2026-11-12", st), "C.stacco").kg, 110); // settimana 11: riparte da 110
});

test("panca: 8/8/7/8 -> stesso carico, +1 rip", () => {
  const st = [sed("2026-10-13", 7, "B", { "B.panca": es([[20, 8, 1], [20, 8, 1], [20, 7, 0], [20, 8, 1]], { range: [8, 10], ripTarget: [8, 8, 8, 8] }) })];
  const p = trova(M.pianoSeduta(P, "B", "2026-10-20", st), "B.panca");
  assert.equal(p.kg, 20); assert.deepEqual(p.rip, [9, 9, 8, 9]);
});
test("panca: 4x10 RIR1 -> 22 kg da 8", () => {
  const st = [sed("2026-10-13", 7, "B", { "B.panca": es([[20, 10, 1], [20, 10, 1], [20, 10, 1], [20, 10, 1]], { range: [8, 10] }) })];
  const p = trova(M.pianoSeduta(P, "B", "2026-10-20", st), "B.panca");
  assert.equal(p.kg, 22); assert.deepEqual(p.rip, [8, 8, 8, 8]);
});
test("C.panca segue B.panca", () => {
  const st = [sed("2026-10-13", 7, "B", { "B.panca": es([[22, 8, 2], [22, 8, 2], [22, 8, 1], [22, 8, 1]], { range: [8, 10] }) })];
  const p = trova(M.pianoSeduta(PL, "C", "2026-10-15", st), "C.panca");
  assert.equal(p.kg, 22); assert.equal(p.rip.length, 3);
});
test("lat: cambio range 10-12 -> 6-10 stima il carico", () => {
  const st = [sed("2026-09-29", 5, "B", { "B.lat": es([[60, 12, 2], [60, 11, 1], [60, 10, 1]], { range: [10, 12] }) })];
  const p = trova(M.pianoSeduta(P, "B", "2026-10-13", st), "B.lat");
  assert.deepEqual(p.range, [6, 10]); assert.ok(p.kg >= 60 && p.kg <= 70, "kg " + p.kg);
});
test("laterali: prima serie in cima a RIR 4 -> +2 incrementi", () => {
  const st = [sed("2026-10-12", 7, "A", { "A.laterali": es([[10, 15, 4], [10, 15, 3], [10, 15, 3]], { range: [12, 15] }) })];
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-10-19", st), "A.laterali").kg, 14);
});
test("carico sconosciuto -> null", () => {
  assert.equal(trova(M.pianoSeduta(P, "B", "2026-10-13", []), "B.tricipiti").kg, null);
});
test("trazioni: scala serie per serie, tetto sulla prima", () => {
  const t = (...r) => es(r.map((x, i) => [0, x, i === r.length - 1 ? 1 : 2]), { ripTarget: r });
  const dopo = (...r) => trova(M.pianoSeduta(P, "C", "2026-10-15", [sed("2026-10-14", 7, "B", { "B.trazioni": t(...r) })]), "C.trazioni").rip;
  assert.deepEqual(dopo(6, 6, 6, 6), [7, 6, 6, 6]);
  assert.deepEqual(dopo(7, 6, 6, 6), [7, 7, 6, 6]);
  assert.deepEqual(dopo(7, 7, 7, 6), [7, 7, 7, 7]);
  assert.deepEqual(dopo(7, 7, 7, 7), [8, 7, 7, 7]);
  // settimana 7: tetto 8 sulla prima serie
  assert.deepEqual(dopo(8, 8, 8, 8), [8, 8, 8, 8]);
  assert.match(trova(M.pianoSeduta(P, "C", "2026-10-15", [sed("2026-10-14", 7, "B", { "B.trazioni": t(8, 8, 8, 8) })]), "C.trazioni").motivo, /tetto/);
  // settimana 10: tetto 9
  assert.deepEqual(trova(M.pianoSeduta(P, "A", "2026-11-02", [sed("2026-10-30", 9, "C", { "C.trazioni": t(8, 8, 8, 8) })]), "A.trazioni").rip, [9, 8, 8, 8]);
  // ultima serie a RIR 0: ripete
  const r0 = es([[0, 6, 2], [0, 6, 1], [0, 6, 1], [0, 6, 0]], { ripTarget: [6, 6, 6, 6] });
  assert.deepEqual(trova(M.pianoSeduta(P, "C", "2026-10-15", [sed("2026-10-14", 7, "B", { "B.trazioni": r0 })]), "C.trazioni").rip, [6, 6, 6, 6]);
});
test("deload settimana 12: metà serie, niente salti", () => {
  const st = [sed("2026-11-09", 11, "A", { "A.inclinata30": es([[24, 9, 2], [24, 9, 1], [24, 8, 1]], { range: [8, 10] }) })];
  const p = M.pianoSeduta(P, "A", "2026-11-16", st);
  const h = trova(p, "A.inclinata30");
  assert.ok(h.kg <= 24 && h.kg >= 18, "kg " + h.kg); assert.equal(h.rip.length, 2);
  assert.equal(trova(p, "A.salti"), undefined);
  assert.equal(trova(p, "A.squat").kg, 110);
});
test("scrollate solo con D", () => {
  assert.ok(trova(M.pianoSeduta(P, "C", "2026-10-15", [], { conD: true }), "C.scrollate"));
  assert.ok(!trova(M.pianoSeduta(P, "C", "2026-10-15", [], { conD: true }), "C.lateraliExtra"));
  assert.ok(trova(M.pianoSeduta(P, "C", "2026-10-15", []), "C.lateraliExtra"));
});
test("prossima seduta", () => {
  assert.equal(M.prossimaSeduta(P, [], "2026-10-12").scelta, "A");
  const st = [sed("2026-10-12", 7, "A", {})];
  const r = M.prossimaSeduta(P, st, "2026-10-13");
  assert.equal(r.scelta, "B");
  const st2 = [sed("2026-10-12", 7, "A", {}), sed("2026-10-14", 7, "B", {})];
  const r2 = M.prossimaSeduta(P, st2, "2026-10-16");
  assert.equal(r2.scelta, "D"); assert.ok(r2.avvisi.some(a => a.includes("tennis") && a.includes("(C)")));
});
test("casi limite segnalati da Gemini", () => {
  assert.doesNotThrow(() => M.pianoSeduta(P, "A", "2026-08-31", []));
  const st = [sed("2026-10-12", 7, "A", { "A.squat": es([[110, 4, 1], [110, 0, 0]], { ripTarget: [4, 4] }) })];
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-10-19", st), "A.squat").kg, 105);
  const st2 = [sed("2026-10-13", 7, "B", { "B.panca": es([[20, 10, 4], [20, 9, 1], [20, 8, 1], [20, 8, 0]], { range: [8, 10] }) })];
  assert.equal(trova(M.pianoSeduta(P, "B", "2026-10-20", st2), "B.panca").kg, 20);
  const st3 = [sed("2026-10-13", 7, "B", { "B.panca": es([[22, 8, 2]], {}) }), sed("2026-10-15", 7, "C", { "C.panca": es([[20, 8, 2]], {}) }), sed("2026-10-20", 8, "B", { "B.panca": es([[24, 8, 2]], {}) })];
  assert.equal(trova(M.pianoSeduta(PL, "C", "2026-10-22", st3), "C.panca").kg, 24);
  // senza range salvato nel blocco Forza: non deve ricalcolare ogni volta
  const st4 = [sed("2026-10-13", 7, "B", { "B.lat": es([[75, 6, 2], [75, 6, 2], [75, 5, 1]]) })];
  const lat = trova(M.pianoSeduta(P, "B", "2026-10-20", st4), "B.lat");
  assert.equal(lat.kg, 75); assert.deepEqual(lat.rip, [7, 7]);
  // in cima senza RIR: il RIR è facoltativo (dal 9 ottobre), quindi sale
  const st5 = [sed("2026-10-12", 7, "A", { "A.laterali": es([[10, 15, null], [10, 15, null], [10, 15, null], [10, 15, null]], { range: [12, 15] }) })];
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-10-19", st5), "A.laterali").kg, 12);
});
test("alternativa e giornata no", () => {
  const def = P.sedute.B.esercizi.find(e => e.id === "B.lat");
  const a = M.pianoAlternativa(P, def, { id: "alt.trazioniPresaLarga", nome: "Pulldown manubri", inc: 2.5 }, "2026-10-13", []);
  assert.equal(a.kg, null); assert.equal(a.rip.length, 2); assert.deepEqual(a.range, [6, 10]);
  const st = [sed("2026-10-13", 7, "B", { "alt.x": es([[30, 10, 1], [30, 10, 1], [30, 10, 1]], { range: [6, 10] }) })];
  const a2 = M.pianoAlternativa(P, def, { id: "alt.x", nome: "X", inc: 2.5 }, "2026-10-20", st);
  assert.equal(a2.kg, 32.5);
  const sq = P.sedute.A.esercizi.find(e => e.id === "A.squat");
  const a3 = M.pianoAlternativa(P, sq, { id: "alt.y", nome: "Y", inc: 5 }, "2026-10-12", []);
  assert.deepEqual(a3.range, [4, 6]); assert.equal(a3.rip.length, 4);
  const g = M.pianoSeduta(P, "A", "2026-10-12", [], { forma: "giu" });
  assert.equal(trova(g, "A.squat").rip.length, 3); assert.deepEqual(trova(g, "A.squat").rir, [2, 3]);
});
test("testo taccuino", () => {
  const s = sed("2026-10-12", 7, "A", { "A.squat": es([[110, 4, 2], [110, 4, 0]]) });
  assert.equal(M.testoSeduta(P, s), "2026-10-12 · Settimana 7 · Seduta A\nSquat bilanciere — 110×4 (2), 110×4 (0)");
});

test("giornata no: in deload non taglia, altrove mai sotto 2 serie", () => {
  const d = M.pianoSeduta(P, "B", "2026-10-09", [], { forma: "giu" });
  const n = M.pianoSeduta(P, "B", "2026-10-09", [], {});
  for (let i = 0; i < d.esercizi.length; i++) assert.equal(d.esercizi[i].rip.length, n.esercizi[i].rip.length);
  const g = M.pianoSeduta(P, "B", "2026-10-14", [], { forma: "giu" });
  const g0 = M.pianoSeduta(P, "B", "2026-10-14", [], {});
  for (let i = 0; i < g.esercizi.length; i++) assert.equal(g.esercizi[i].rip.length, Math.max(Math.min(2, g0.esercizi[i].rip.length), g0.esercizi[i].rip.length - 1));
});

test("trazioni: due sedute non riuscite allo stesso schema -> riparte da quello fatto", () => {
  const brutta = es([[0, 6, 0], [0, 5, 0], [0, 4, 0], [0, 4, 0]], { ripTarget: [6, 6, 6, 6] });
  const st = [sed("2026-10-12", 7, "A", { "A.trazioni": brutta }), sed("2026-10-14", 7, "B", { "B.trazioni": brutta })];
  const p = trova(M.pianoSeduta(P, "C", "2026-10-15", st), "C.trazioni");
  assert.deepEqual(p.rip, [6, 5, 4, 4]); assert.match(p.motivo, /riparti/);
  // una sola non riuscita: ripete
  assert.deepEqual(trova(M.pianoSeduta(P, "B", "2026-10-14", st.slice(0, 1)), "B.trazioni").rip, [6, 6, 6, 6]);
});
test("test trazioni: settimana 9 solo in B, poi il massimale guida la partenza", () => {
  const b = trova(M.pianoSeduta(P, "B", "2026-10-28", []), "B.trazioni");
  assert.deepEqual(b.rip, [null]); assert.ok(b.test);
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-10-26", []), "A.trazioni").rip.length, 4);
  const st = [sed("2026-10-28", 9, "B", { "B.trazioni": es([[0, 10, 0]], { ripTarget: [null], test: true }) })];
  assert.equal(M.massimaleTrazioni(P, st, "2026-11-02").max, 10);
  // senza altre sedute: 65% di 10 = 6
  assert.deepEqual(trova(M.pianoSeduta(P, "A", "2026-11-02", st), "A.trazioni").rip, [6, 6, 6, 6]);
  // la serie di test non entra nella scala: si sale dall'ultima seduta normale
  const st2 = st.concat([sed("2026-10-26", 9, "A", { "A.trazioni": es([[0, 6, 1], [0, 6, 1], [0, 6, 1], [0, 6, 1]], { ripTarget: [6, 6, 6, 6] }) })]);
  assert.deepEqual(trova(M.pianoSeduta(P, "A", "2026-11-02", st2), "A.trazioni").rip, [7, 6, 6, 6]);
});
test("settimana 16: test singoli, accessori leggeri, trazioni solo in B dopo la panca", () => {
  const b = M.pianoSeduta(P, "B", "2026-12-15", []);
  const ids = b.esercizi.map(e => e.def.id);
  assert.ok(ids.indexOf("B.trazioni") > ids.indexOf("B.panca"), ids.join(","));
  const pa = trova(b, "B.panca"); assert.equal(pa.kg, 28); assert.deepEqual(pa.rip, [8]); assert.ok(pa.test);
  assert.equal(trova(b, "B.lat").rip.length, 1); assert.deepEqual(trova(b, "B.lat").rir, [3, 4]);
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-12-14", []), "A.trazioni"), undefined);
  // squat: tentativo = min(tabella 122,5, stima dalle settimane 13-14)
  const forte = [sed("2026-12-01", 14, "A", { "A.squat": es([[120, 3, 1], [120, 3, 1]]) })];
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-12-14", forte), "A.squat").kg, 122.5);
  const debole = [sed("2026-12-01", 14, "A", { "A.squat": es([[115, 3, 1], [115, 3, 1]]) })];
  const sq = trova(M.pianoSeduta(P, "A", "2026-12-14", debole), "A.squat");
  assert.equal(sq.kg, 117.5); assert.deepEqual(sq.rip, [3]); assert.deepEqual(sq.rir, [0, 0]);
  // laterali: storia sotto l'obiettivo -> parte dalla stima
  const lat = [sed("2026-12-10", 15, "C", { "C.laterali": es([[12, 12, 2]]) }), sed("2026-11-26", 13, "C", { "C.laterali": es([[12, 13, 1]]) })];
  const l = trova(M.pianoSeduta(P, "C", "2026-12-17", lat), "C.laterali");
  assert.ok(l.test && l.kg < 14 && l.kg >= 10, "kg " + l.kg);
  // la giornata no non taglia i test
  assert.deepEqual(trova(M.pianoSeduta(P, "B", "2026-12-15", [], { forma: "giu" }), "B.panca").rip, [8]);
});
test("prontezza e giornata rossa", () => {
  assert.equal(M.prontezza({}), "ok");
  assert.equal(M.prontezza({ sonno: 1, dolori: 1 }), "ok");
  assert.equal(M.prontezza({ sonno: 2 }), "giu");
  assert.equal(M.prontezza({ sonno: 1, dolori: 1, energia: 1 }), "giu");
  assert.equal(M.prontezza({ energia: 3 }), "rosso");
  assert.equal(M.prontezza({ sonno: 2, dolori: 2, energia: 1 }), "rosso");
  const r = M.pianoSeduta(P, "A", "2026-10-12", [], { forma: "rosso" });
  assert.equal(trova(r, "A.salti"), undefined); assert.equal(trova(r, "A.squat").rip.length, 3);
  const pr = M.prossimaSeduta(P, [], "2026-10-12", { forma: "rosso" });
  assert.equal(pr.scelta, "B"); assert.ok(pr.avvisi.some(a => a.includes("rosso")));
});
test("settimana corta: C, poi A; B salta e i suoi esercizi entrano in A e C", () => {
  const dom = M.prossimaSeduta(P, [], "2026-10-18");
  assert.equal(dom.scelta, "C"); assert.ok(dom.corta && dom.senzaB);
  const st = [sed("2026-10-16", 7, "B", {})];
  assert.ok(!M.prossimaSeduta(P, st, "2026-10-18").senzaB);
  const c = M.pianoSeduta(P, "C", "2026-10-18", [], { dueSedute: true });
  assert.ok(trova(c, "B.crociInv")); assert.equal(trova(c, "C.lateraliExtra"), undefined);
  const a = M.pianoSeduta(P, "A", "2026-10-18", [], { dueSedute: true });
  assert.ok(trova(a, "B.tricipiti")); assert.equal(trova(a, "A.polpacci"), undefined);
  // giovedì con solo A fatta: ci stanno ancora (gio, ven, dom)
  assert.ok(!M.prossimaSeduta(P, [sed("2026-10-12", 7, "A", {})], "2026-10-15").corta);
});
test("push down in C dalla settimana 7 (era dalla 10 fino al 9 ottobre)", () => {
  assert.equal(trova(M.pianoSeduta(P, "C", "2026-10-08", []), "C.pushdown"), undefined);
  assert.ok(trova(M.pianoSeduta(P, "C", "2026-10-15", []), "C.pushdown"));
  assert.ok(trova(M.pianoSeduta(P, "C", "2026-11-05", []), "C.pushdown"));
  assert.equal(trova(M.pianoSeduta(P, "D", "2026-10-18", []), "D.legcurl"), undefined);
});

test("avvicinamento e dischi", () => {
  assert.deepEqual(M.avvicinamento(110, "squat").map(x => x.kg), [20, 45, 65, 82.5, 92.5]);
  assert.equal(M.avvicinamento(110, "stacco")[0].kg, 60);
  assert.ok(M.avvicinamento(127.5, "stacco", true).every((x, i, a) => i === 0 || x.kg >= a[i - 1].kg + 7.5));
  assert.ok(M.avvicinamento(127.5, "stacco", true).every(x => x.kg < 127.5));
  assert.deepEqual(M.dischi(110), [25, 20]);
  assert.deepEqual(M.dischi(127.5), [25, 25, 2.5, 1.25]);
  assert.equal(M.dischi(61), null);
});

test("progressi verso dicembre", () => {
  const st = [
    sed("2026-10-12", 7, "A", { "A.squat": es([[110, 4, 2], [110, 4, 1]]), "A.laterali": es([[10, 14, 1]]) }),
    sed("2026-10-28", 9, "B", { "B.trazioni": es([[null, 9, 0]], { test: true }) })
  ];
  const r = Object.fromEntries(M.progressoObiettivi(P, st, "2026-10-29").map(x => [x.nome, x.stima]));
  assert.equal(r["Squat"], 120);
  assert.equal(r["Trazioni"], 9);
  assert.equal(r["Stacco"], null);
  assert.ok(r["Alzate laterali"] >= 10 && r["Alzate laterali"] <= 12);
  // dopo 3 settimane senza squat la stima sparisce
  assert.equal(Object.fromEntries(M.progressoObiettivi(P, st, "2026-11-10").map(x => [x.nome, x.stima]))["Squat"], null);
});

test("accessori: serie più pesante nel range, avvicinamento, scalo, RIR dal taccuino", () => {
  const ini = (id, serie, range) => Object.assign(sed("2026-10-02", 5, id[0], { [id]: es(serie, { range, ripTarget: serie.map(x => x[1]) }) }), { iniziale: true });
  // 20, 20, 22, 20 × 10: tutte a 22 da 8
  const b = trova(M.pianoSeduta(P, "B", "2026-10-21", [ini("B.panca", [[20, 10], [20, 10], [22, 10], [20, 10]], [8, 10])]), "B.panca");
  assert.equal(b.kg, 22); assert.deepEqual(b.rip, [8, 8, 8, 8]);
  // avvicinamento 95 poi 105 × 15, RIR non scritto (taccuino = 2): sale
  const pol = trova(M.pianoSeduta(P, "A", "2026-10-12", [ini("A.polpacci", [[95, 15], [105, 15]], [12, 15])]), "A.polpacci");
  assert.equal(pol.kg, 110);
  // 21,25 21,25 poi scalo a 17,5: non sale
  const tri = trova(M.pianoSeduta(P, "B", "2026-10-14", [ini("B.tricipiti", [[21.25, 12], [21.25, 12], [17.5, 12]], [10, 12])]), "B.tricipiti");
  assert.equal(tri.kg, 21.25);
  // 12 × 15, 15 e un tentativo a 14 × 10: sale a 14
  const lat = trova(M.pianoSeduta(P, "A", "2026-10-12", [ini("A.laterali", [[12, 15], [12, 15], [14, 10]], [12, 15])]), "A.laterali");
  assert.equal(lat.kg, 14);
  // RIR facoltativo: senza RIR, tutte in cima → sale lo stesso; con RIR 0 sull'ultima → ripete
  const st = [sed("2026-10-12", 7, "A", { "A.polpacci": es([[105, 15, null], [105, 15, null]], { range: [12, 15] }) })];
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-10-19", st), "A.polpacci").kg, 110);
  const st0 = [sed("2026-10-12", 7, "A", { "A.polpacci": es([[105, 15, null], [105, 15, 0]], { range: [12, 15] }) })];
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-10-19", st0), "A.polpacci").kg, 105);
});
test("settimane a onda: in forza la panca pesante apre B, la panca 8-10 resta a parte", () => {
  const ini = Object.assign(sed("2026-10-02", 5, "B", { "B.panca": es([[20, 10], [20, 10], [22, 10], [20, 10]], { range: [8, 10] }) }), { iniziale: true });
  // settimana 7 (F): pesante per prima, niente panca 8-10, RIR almeno 2
  const f = M.pianoSeduta(P, "B", "2026-10-14", [ini]);
  const ids = f.esercizi.map(e => e.def.id);
  assert.equal(ids[0], "B.pancaF"); assert.ok(!ids.includes("B.panca"), ids.join(","));
  const pf = trova(f, "B.pancaF"); assert.equal(pf.kg, 24); assert.deepEqual(pf.rip, [5, 5, 5, 5]); assert.deepEqual(pf.rir, [2, 2]);
  // la panca di C nella stessa settimana segue ancora la panca 8-10, non quella pesante
  const st = [ini, sed("2026-10-14", 7, "B", { "B.pancaF": es([[24, 6, 2], [24, 6, 2], [24, 6, 2], [24, 6, 2]], { range: [5, 6] }) })];
  assert.equal(trova(M.pianoSeduta(PL, "C", "2026-10-16", st), "C.panca").kg, 22);
  // settimana 8 (I): torna la panca 8-10, la pesante sparisce
  const i = M.pianoSeduta(P, "B", "2026-10-21", st).esercizi.map(e => e.def.id);
  assert.ok(i.includes("B.panca") && !i.includes("B.pancaF"), i.join(","));
  // settimana 9 (F): 4 × 6 a 24 con RIR 2 → sale a 26
  assert.equal(trova(M.pianoSeduta(P, "B", "2026-10-28", st), "B.pancaF").kg, 26);
  // scarico (12) e test (16): solo la panca 8-10
  for (const d of ["2026-11-18", "2026-12-16"]) assert.ok(!M.pianoSeduta(P, "B", d, st).esercizi.some(e => e.def.id === "B.pancaF"), d);
});
test("ricalibrazione del 9 ottobre: più braccia e spalle, meno gambe e dorso", () => {
  const serie = (L, d) => Object.fromEntries(M.pianoSeduta(P, L, d, []).esercizi.map(e => [e.def.id, e.rip.length]));
  const a = serie("A", "2026-10-12"), b = serie("B", "2026-10-21"), c = serie("C", "2026-10-15");
  assert.equal(a["A.inclinata30"], 3); assert.ok(!("A.hack" in a)); assert.equal(a["A.laterali"], 4); assert.equal(a["A.curlCavi"], 2); assert.equal(a["A.pushBarra"], 2);
  assert.equal(b["B.lat"], 2); assert.equal(b["B.pulley"], 2); assert.equal(b["B.laterali"], 4);
  assert.equal(c["C.inclinata30"], 3); assert.equal(c["C.pushdown"], 3); assert.equal(c["C.martello"], 2); assert.equal(c["C.military"], 2); assert.ok(!("C.panca" in c));
  assert.equal(b["B.tricipiti"], 4); assert.equal(b["B.crunch"], 2);
  // in scarico le serie si dimezzano come prima
  assert.equal(serie("A", "2026-11-16")["A.curlCavi"], 1);
});
test("dolore su squat e stacco: scende di un gradino", () => {
  const st = [sed("2026-10-15", 7, "C", { "C.stacco": es([[92.5, 4, 2], [92.5, 4, 2], [92.5, 4, 2]], { ripTarget: [4, 4, 4], dolore: true }) })];
  const p = trova(M.pianoSeduta(P, "C", "2026-10-29", st), "C.stacco");
  assert.equal(p.kg, 87.5); assert.match(p.motivo, /dolore/);
  assert.match(M.riga("Stacco", st[0].esercizi["C.stacco"]), /\[dolore\]/);
});
test("stacco: tabella da 90, prima delle trazioni in C, iperestensioni in fondo", () => {
  const c = M.pianoSeduta(P, "C", "2026-10-15", []);
  const ids = c.esercizi.map(e => e.def.id);
  assert.ok(ids.indexOf("C.stacco") < ids.indexOf("C.trazioni"));
  assert.ok(ids.includes("C.iper"));
  assert.equal(trova(c, "C.stacco").kg, 92.5);
  assert.equal(trova(M.pianoSeduta(P, "C", "2026-12-17", []), "C.stacco").kg, 115);
  // dopo 3 × 5 a 90 nella settimana 5: segue la tabella, niente scarto
  const st = [sed("2026-10-02", 5, "C", { "C.stacco": es([[90, 5, 2], [90, 5, 2], [90, 5, 2]], { ripTarget: [5, 5, 5] }) })];
  assert.equal(trova(M.pianoSeduta(P, "C", "2026-10-15", st), "C.stacco").kg, 92.5);
});

test("accessori: serie scalate → prima tutte al carico pieno", () => {
  const st = [{ id: "i", data: "2026-09-28", sett: 5, seduta: "B", iniziale: true, esercizi: { "B.tricipiti": { range: [10, 12], ripTarget: [12, 12, 12], serie: [{ kg: 21.25, rip: 12, rir: null }, { kg: 21.25, rip: 12, rir: null }, { kg: 17.5, rip: 12, rir: null }] } } }];
  const p = M.pianoSeduta(P, "B", "2026-10-01", st, {}).esercizi.find(e => e.def.id === "B.tricipiti");
  assert.equal(p.kg, 21.25); assert.ok(p.rip.every(r => r === 12), String(p.rip));
  assert.match(p.motivo, /scalato/);
});

// ---------- scheda a lungo termine (9 ottobre 2026, sera) ----------
test("stacco da terra nelle settimane F, rumeno nelle altre e nello scarico; test a dicembre", () => {
  const ids = d => M.pianoSeduta(P, "C", d, []).esercizi.map(e => e.def.id);
  for (const d of ["2026-10-15", "2026-10-29", "2026-11-12", "2026-11-26", "2026-12-10", "2026-12-17"]) { assert.ok(ids(d).includes("C.stacco"), d); assert.ok(!ids(d).includes("C.rdl"), d); }
  for (const d of ["2026-10-22", "2026-11-05", "2026-11-19", "2026-12-03"]) { assert.ok(ids(d).includes("C.rdl"), d); assert.ok(!ids(d).includes("C.stacco"), d); }
  const rdl = trova(M.pianoSeduta(P, "C", "2026-10-22", []), "C.rdl");
  assert.equal(rdl.kg, 65); assert.deepEqual(rdl.rip, [6, 6, 6]); assert.deepEqual(rdl.rir, [2, 2]);
  assert.equal(trova(M.pianoSeduta(P, "C", "2026-11-19", []), "C.rdl").rip.length, 2); // scarico
  // ordine in C: inclinata prima del military
  const c = ids("2026-10-15");
  assert.ok(c.indexOf("C.inclinata30") < c.indexOf("C.military"));
});
test("squat: ultima serie a RIR 4 -> un incremento in più", () => {
  const st = [sed("2026-10-12", 7, "A", { "A.squat": es([[110, 4, 4], [110, 4, 4], [110, 4, 4], [110, 4, 4]], { ripTarget: [4, 4, 4, 4] }) })];
  const p = trova(M.pianoSeduta(P, "A", "2026-10-19", st), "A.squat");
  assert.equal(p.kg, 117.5); assert.match(p.motivo, /troppo leggera/);
});
test("ponte di viaggio: 2 sedute, 2/3 delle serie, squat dal massimale di dicembre", () => {
  const st = [sed("2026-12-14", 16, "A", { "A.squat": es([[122.5, 3, 0]], { ripTarget: [3] }) })];
  const p = M.pianoSeduta(P, "A", "2026-12-21", st);
  assert.equal(p.settimana.blocco, "Ponte");
  const sq = trova(p, "A.squat");
  // 122,5 × 3 a RIR 0 → massimale stimato 134,75, meno 5% = 128; 3 × 5 al 78,9% = 101 → 100
  assert.equal(sq.kg, 100); assert.deepEqual(sq.rip, [5, 5, 5]);
  assert.equal(trova(p, "A.laterali").rip.length, 3); // 4 × 0,67
  assert.equal(trova(p, "A.trazioni").rip.length, 3);
  const pr = M.prossimaSeduta(P, [], "2026-12-21");
  assert.equal(pr.scelta, "A"); assert.ok(pr.senzaB); assert.equal(pr.perDue, "programma");
});
test("cicli da febbraio: percentuale del massimale del ciclo precedente, scarto azzerato", () => {
  const st = [sed("2027-01-25", 22, "A", { "A.squat": es([[105, 5, 2], [105, 5, 2], [105, 5, 2]], { ripTarget: [5, 5, 5] }) })];
  const sq = trova(M.pianoSeduta(P, "A", "2027-02-01", st), "A.squat");
  // 105 × 5 a RIR 2 → 127,75 − 5% = 121,4; 4 × 6 al 76,9% = 93,3 → 92,5
  assert.equal(sq.kg, 92.5); assert.deepEqual(sq.rip, [6, 6, 6, 6]); assert.match(sq.motivo, /Ciclo nuovo/);
  // senza dati nel ciclo precedente (viaggio senza bilanciere): ultimi dati, ridotti per la pausa
  const vecchio = [sed("2026-12-14", 16, "A", { "A.squat": es([[122.5, 3, 0]], { ripTarget: [3] }) })];
  const sv = trova(M.pianoSeduta(P, "A", "2027-02-01", vecchio), "A.squat");
  assert.ok(sv.kg <= 90 && sv.kg >= 80, "kg " + sv.kg);
});
test("tetto squat: oltre 122,5 × 3 si passa a mantenimento con 3 serie", () => {
  const st = [sed("2027-03-01", 27, "A", { "A.squat": es([[125, 3, 1], [125, 3, 1], [125, 3, 1], [125, 3, 1]], { ripTarget: [3, 3, 3, 3] }) })];
  const sq = trova(M.pianoSeduta(P, "A", "2027-03-15", st), "A.squat"); // settimana 29, ciclo 2
  assert.equal(sq.rip.length, 3); assert.match(sq.motivo, /Tetto raggiunto/);
  assert.ok(sq.kg <= 105, "kg " + sq.kg); // 76,9% del massimale fermato al tetto (134,75 × 0,95)
});
test("trazioni: obiettivo 12 al test -> nei cicli trazioni zavorrate", () => {
  const st = [sed("2027-03-02", 27, "B", { "B.trazioni": es([[0, 12, 0]], { test: true, ripTarget: [null] }) })];
  const t = trova(M.pianoSeduta(P, "A", "2027-03-15", st), "A.trazioni");
  assert.ok(t.zavorra); assert.equal(t.kg, 2.5); assert.deepEqual(t.rip, [5, 5, 5, 5]);
  // seduta pulita a 8 con 2,5 kg -> sale
  const st2 = st.concat([sed("2027-03-15", 29, "A", { "A.trazioni": es([[2.5, 8, 2], [2.5, 8, 2], [2.5, 8, 1], [2.5, 8, 1]], { range: [5, 8], ripTarget: [5, 5, 5, 5] }) })]);
  assert.equal(trova(M.pianoSeduta(P, "A", "2027-03-22", st2), "A.trazioni").kg, 5);
  // sotto l'obiettivo resta la scala a corpo libero, tetto = 3/4 del massimale
  const st3 = [sed("2027-03-02", 27, "B", { "B.trazioni": es([[0, 10, 0]], { test: true, ripTarget: [null] }) })];
  const t3 = trova(M.pianoSeduta(P, "A", "2027-03-15", st3), "A.trazioni");
  assert.ok(!t3.zavorra); assert.deepEqual(t3.rip, [6, 6, 6, 6]);
});
test("frequenza: 2 settimane con 2 sedute -> versione da 2; una con 3 -> si torna a 3", () => {
  const due = [sed("2026-10-12", 7, "A", {}), sed("2026-10-15", 7, "C", {}), sed("2026-10-19", 8, "A", {}), sed("2026-10-22", 8, "C", {})];
  const pr = M.prossimaSeduta(P, due, "2026-10-26");
  assert.equal(pr.perDue, "frequenza"); assert.equal(pr.scelta, "A"); assert.ok(pr.senzaB);
  // fatte A e C: B resta possibile come terza
  const pr2 = M.prossimaSeduta(P, due.concat([sed("2026-10-26", 9, "A", {}), sed("2026-10-28", 9, "C", {})]), "2026-10-29");
  assert.equal(pr2.scelta, "B");
  const tre = due.concat([sed("2026-10-21", 8, "B", {})]);
  assert.equal(M.prossimaSeduta(P, tre, "2026-10-26").perDue, undefined);
  // una settimana vuota è una pausa, non un'abitudine
  assert.equal(M.modoDue(P, due.slice(2), "2026-10-26"), false);
});
test("palestra nuova: macchine e cavi da zero, bilancieri e manubri no", () => {
  const st = [sed("2027-01-28", 22, "B", { "B.lat": es([[70, 10, 2]]), "B.panca": es([[26, 9, 2]]) })];
  const nuovo = M.perPalestra(P, st, "2027-02-01");
  assert.ok(!nuovo[0].esercizi["B.lat"]); assert.ok(nuovo[0].esercizi["B.panca"]);
  assert.equal(st[0].esercizi["B.lat"].serie[0].kg, 70); // l'originale non cambia
  assert.equal(M.perPalestra(P, st, null), st);
  const lat = trova(M.pianoSeduta(P, "B", "2027-02-03", nuovo), "B.lat");
  assert.equal(lat.kg, null); assert.match(lat.motivo, /Carico da trovare/);
});
test("obiettivi raggiunti salgono da soli", () => {
  const st = [sed("2026-12-17", 16, "C", { "C.laterali": es([[14, 13, 1]]) })];
  const r = M.progressoObiettivi(P, st, "2026-12-18").find(x => x.nome === "Alzate laterali");
  assert.equal(r.obiettivo.kg, 16); assert.equal(r.raggiunto, 14);
});
test("tetto: la stima non basta, serve la serie vera", () => {
  const st = [sed("2026-10-02", 5, "A", { "A.squat": es([[110, 5, null], [110, 5, null]], { ripTarget: [5, 5] }) })];
  const sq = trova(M.pianoSeduta(P, "A", "2027-02-01", st), "A.squat");
  assert.equal(sq.rip.length, 4); assert.doesNotMatch(sq.motivo, /Tetto/);
});

// Serie divisa (10 ottobre 2026): parte al carico pieno, finisce le ripetizioni con uno scalo.
const conScalo = (righe, extra = {}) => Object.assign({ serie: righe.map(([kg, rip, drop]) => ({ kg, rip, rir: null, drop: drop ? [{ kg: drop[0], rip: drop[1] }] : undefined })) }, extra);
test("serie divisa: resta al carico pieno con lo stesso obiettivo, non scende", () => {
  const st = [sed("2026-10-12", 7, "A", { "A.laterali": conScalo([[12, 9, [10, 3]], [12, 8, [10, 4]], [12, 7, [10, 5]], [12, 7, [10, 5]]], { ripTarget: [12, 12, 12, 12], range: [12, 15] }) })];
  const e = trova(M.pianoSeduta(P, "A", "2026-10-19", st), "A.laterali");
  assert.equal(e.kg, 12); // senza la regola nuova "tutte sotto 12" lo avrebbe fatto scendere a 10
  assert.deepEqual(e.rip, [12, 12, 12, 12]);
  assert.match(e.motivo, /diviso la serie \(12×9\+10×3\)/);
});
test("serie divisa: tutte in cima al range senza scalo -> sale come sempre", () => {
  const st = [
    sed("2026-10-12", 7, "A", { "A.laterali": conScalo([[12, 9, [10, 3]], [12, 8, [10, 4]], [12, 8, [10, 4]], [12, 8, [10, 4]]], { ripTarget: [12, 12, 12, 12], range: [12, 15] }) }),
    sed("2026-10-19", 8, "A", { "A.laterali": es([[12, 15, 1], [12, 15, 1], [12, 15, 1], [12, 15, 1]], { ripTarget: [12, 12, 12, 12], range: [12, 15] }) })];
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-10-26", st), "A.laterali").kg, 14);
});
test("serie divisa: testo del taccuino, ripetizioni totali e tonnellaggio", () => {
  const s = { kg: 20, rip: 8, rir: 0, drop: [{ kg: 17.5, rip: 4 }] };
  assert.equal(M.fmtSerie(s), "20×8+17,5×4 (0)");
  assert.equal(M.ripTot(s), 12);
  assert.equal(M.tonnellaggio(s), 230);
  assert.equal(M.riga("Lat machine", { serie: [s, { kg: 20, rip: 12, rir: 1 }] }), "Lat machine — 20×8+17,5×4 (0), 20×12 (1)");
});
test("serie divisa sul bilanciere: conta come ripetizione mancata (la tabella scende)", () => {
  const st = [sed("2026-10-12", 7, "A", { "A.squat": conScalo([[110, 4], [110, 3, [100, 1]], [110, 4], [110, 4]], { ripTarget: [4, 4, 4, 4] }) })];
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-10-19", st), "A.squat").kg, 105);
});
