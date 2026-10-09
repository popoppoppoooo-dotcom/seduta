const assert = require("node:assert/strict");
const test = require("node:test");
require("../programma.js");
const M = require("../motore.js");
const P = globalThis.PROGRAMMA;
const es = (serie, extra = {}) => Object.assign({ serie: serie.map(([kg, rip, rir]) => ({ kg, rip, rir })) }, extra);
const sed = (data, sett, seduta, esercizi) => ({ id: data + seduta, data, sett, seduta, esercizi });
const trova = (p, id) => p.esercizi.find(e => e.def.id === id);

test("settimane", () => {
  assert.equal(M.settimanaDi(P, "2026-10-12").n, 7);
  assert.equal(M.settimanaDi(P, "2026-10-18").n, 7);
  assert.equal(M.settimanaDi(P, "2026-12-20").n, 16);
  assert.equal(M.settimanaDi(P, "2026-12-21"), null);
  assert.equal(M.settimanaDi(P, "2026-08-01"), null);
});

test("A settimana 7 senza storico", () => {
  const p = M.pianoSeduta(P, "A", "2026-10-12", []);
  const sq = trova(p, "A.squat");
  assert.equal(sq.kg, 110); assert.deepEqual(sq.rip, [4, 4, 4, 4]);
  const hack = trova(p, "A.hack");
  assert.deepEqual(hack.range, [6, 10]); assert.equal(hack.kg, 110); // 100 totale (due lati) × 12 → 110 × 6
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
  const st = [sed("2026-10-19", 8, "A", { "A.squat": es([[110, 4, 2], [110, 4, 2], [110, 4, 1], [110, 4, 1]], { ripTarget: [4, 4, 4, 4] }) })];
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-10-26", st), "A.squat").kg, 112.5);
});
test("stacco: settimana saltata -> un solo passo", () => {
  const st = [sed("2026-10-14", 7, "C", { "C.stacco": es([[110, 4, 2], [110, 4, 2], [110, 4, 2]], { ripTarget: [4, 4, 4] }) })];
  assert.equal(trova(M.pianoSeduta(P, "C", "2026-10-28", st), "C.stacco").kg, 112.5);
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
  const p = trova(M.pianoSeduta(P, "C", "2026-10-15", st), "C.panca");
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
  const st = [sed("2026-11-09", 11, "A", { "A.hack": es([[70, 7, 2], [70, 7, 1], [70, 6, 1]], { range: [5, 8] }) })];
  const p = M.pianoSeduta(P, "A", "2026-11-16", st);
  const h = trova(p, "A.hack");
  assert.ok(h.kg <= 70 && h.kg >= 60, "kg " + h.kg); assert.equal(h.rip.length, 2); assert.deepEqual(h.range, [8, 10]);
  assert.equal(trova(p, "A.salti"), undefined);
  assert.equal(trova(p, "A.squat").kg, 112.5);
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
  assert.equal(trova(M.pianoSeduta(P, "C", "2026-10-22", st3), "C.panca").kg, 24);
  // senza range salvato nel blocco Forza: non deve ricalcolare ogni volta
  const st4 = [sed("2026-10-13", 7, "B", { "B.lat": es([[75, 6, 2], [75, 6, 2], [75, 5, 1]]) })];
  const lat = trova(M.pianoSeduta(P, "B", "2026-10-20", st4), "B.lat");
  assert.equal(lat.kg, 75); assert.deepEqual(lat.rip, [7, 7, 6]);
  // in cima senza RIR: non sale
  const st5 = [sed("2026-10-12", 7, "A", { "A.laterali": es([[10, 15, null], [10, 15, null], [10, 15, null]], { range: [12, 15] }) })];
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-10-19", st5), "A.laterali").kg, 10);
});
test("alternativa e giornata no", () => {
  const def = P.sedute.B.esercizi.find(e => e.id === "B.lat");
  const a = M.pianoAlternativa(P, def, { id: "alt.trazioniPresaLarga", nome: "Pulldown manubri", inc: 2.5 }, "2026-10-13", []);
  assert.equal(a.kg, null); assert.equal(a.rip.length, 3); assert.deepEqual(a.range, [6, 10]);
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
  assert.equal(trova(b, "B.lat").rip.length, 2); assert.deepEqual(trova(b, "B.lat").rir, [3, 4]);
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-12-14", []), "A.trazioni"), undefined);
  // squat: tentativo = min(tabella 130, stima dalle settimane 13-14)
  const forte = [sed("2026-12-01", 14, "A", { "A.squat": es([[127.5, 3, 1], [127.5, 3, 1]]) })];
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-12-14", forte), "A.squat").kg, 130);
  const debole = [sed("2026-12-01", 14, "A", { "A.squat": es([[120, 3, 1], [120, 3, 1]]) })];
  const sq = trova(M.pianoSeduta(P, "A", "2026-12-14", debole), "A.squat");
  assert.equal(sq.kg, 122.5); assert.deepEqual(sq.rip, [3]); assert.deepEqual(sq.rir, [0, 0]);
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
test("push down in C dalla settimana 10", () => {
  assert.equal(trova(M.pianoSeduta(P, "C", "2026-10-29", []), "C.pushdown"), undefined);
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
  const b = trova(M.pianoSeduta(P, "B", "2026-10-14", [ini("B.panca", [[20, 10], [20, 10], [22, 10], [20, 10]], [8, 10])]), "B.panca");
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
  // fuori dal taccuino, senza RIR: ripete
  const st = [sed("2026-10-12", 7, "A", { "A.polpacci": es([[105, 15, null], [105, 15, null]], { range: [12, 15] }) })];
  assert.equal(trova(M.pianoSeduta(P, "A", "2026-10-19", st), "A.polpacci").kg, 105);
});
test("dolore su squat e stacco: scende di un gradino", () => {
  const st = [sed("2026-10-15", 7, "C", { "C.stacco": es([[92.5, 4, 2], [92.5, 4, 2], [92.5, 4, 2]], { ripTarget: [4, 4, 4], dolore: true }) })];
  const p = trova(M.pianoSeduta(P, "C", "2026-10-22", st), "C.stacco");
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
