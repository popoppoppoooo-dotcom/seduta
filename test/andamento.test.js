const assert = require("node:assert/strict");
const test = require("node:test");
require("../programma.js");
const M = require("../motore.js");
const AN = require("../andamento.js");
const P = globalThis.PROGRAMMA;
const S = (id, data, seduta, esercizi) => ({ id, data, seduta, esercizi });
const ser = (...xs) => ({ serie: xs.map(([kg, rip, rir, drop]) => ({ kg, rip, rir, drop })) });

const storico = [
  S("i", "2026-10-01", "A", { "A.squat": ser([100, 5, 2]) }),
  Object.assign(S("i2", "2026-10-01", "A", {}), { iniziale: true }),
  S("a1", "2026-10-12", "A", { "A.squat": ser([110, 4, 2], [110, 4, 2]), "A.laterali": ser([10, 15, 1], [10, 14, 0]), "A.trazioni": ser([null, 8, 1]) }),
  S("b1", "2026-10-14", "B", { "B.panca": ser([20, 10, 1]), "B.lat": ser([60, 12, 1], [60, 11, 1]) }),
  S("c1", "2026-10-16", "C", { "C.stacco": ser([140, 3, 2]) }),
  S("a2", "2026-10-19", "A", { "A.squat": ser([112.5, 4, 2]), "A.laterali": ser([12, 9, 0, [{ kg: 10, rip: 3 }]]), "A.trazioni": ser([null, 9, 1]) }),
  S("b2", "2026-10-21", "B", { "B.panca": ser([20, 10, 1]), "B.lat": ser([60, 12, 1]) }),
  S("a3", "2026-10-26", "A", { "A.squat": ser([112.5, 4, 2]), "A.trazioni": ser([null, 9, 1]) }),
  S("a4", "2026-11-02", "A", { "A.squat": ser([112.5, 4, 2]), "A.trazioni": ser([null, 9, 1]) })
];
const corpo = [{ data: "2026-10-12", peso: 80 }, { data: "2026-10-13", peso: 80.6 }, { data: "2026-10-20", peso: 80.9, misure: { vita: 82 } }];

test("KPI, settimane e tendenze", () => {
  const R = AN.calcola(P, M, storico, corpo, "2026-11-04");
  assert.equal(R.totale, 8); // la partenza non conta
  assert.equal(R.settimane.length, 12);
  assert.equal(R.settimane[11].lun, "2026-11-02");
  assert.equal(R.settimane[11].sedute, 1);
  assert.equal(R.settimane[9].sedute, 2); // 19 e 21 ottobre
  assert.equal(R.kpi.sedute4, 7); // dal 12 ottobre: 3+2+1+1
  assert.equal(R.kpi.tonn, 450);
  assert.equal(R.kpi.tonnPrec, 450);
  const sq = R.trend.find(t => t.nome === "Squat");
  assert.deepEqual(sq.punti.map(p => p.d), ["2026-10-01", "2026-10-12", "2026-10-19", "2026-10-26", "2026-11-02"]);
  assert.equal(sq.punti[1].v, Math.round(M.e1rm(110, 4, 2) * 10) / 10);
  const tz = R.trend.find(t => t.nome === "Trazioni");
  assert.equal(tz.unita, "rip"); assert.equal(tz.punti[0].v, 9);
  // record: squat 112,5 il 19 ottobre e trazioni 10 il 19 ottobre (tutto negli ultimi 28 giorni dal 4 novembre: dal 8 ottobre)
  assert.ok(R.kpi.recordNomi.includes("A.squat") || R.kpi.record >= 2);
});

test("serie per muscolo: media su 4 settimane, scalo conta una serie", () => {
  const R = AN.calcola(P, M, storico, corpo, "2026-11-04");
  const m = Object.fromEntries(R.muscoli.map(x => [x.gruppo, x.serie]));
  assert.equal(R.nSett, 4);
  assert.equal(m["Gambe (quadricipiti)"], 1.3); // (2 + 1 + 1 + 1) / 4 serie di squat, a un decimale
  assert.equal(m["Spalle"], 0.8); // 3 serie di laterali: quella divisa conta una
  assert.equal(m["Dorso"], 1.8); // trazioni 4 + lat machine 3, su 4 settimane
  assert.equal(m["Catena posteriore"], 0.3); // una serie di stacco in 4 settimane
});

test("esercizi fermi e in crescita", () => {
  const R = AN.calcola(P, M, storico, corpo, "2026-11-04");
  // squat: record il 19 ottobre, poi due volte uguale → stabile (non ancora fermo)
  const sq = R.esercizi.find(e => e.id === "A.squat");
  assert.equal(sq.stato, "stabile"); assert.equal(sq.ferme, 2);
  // una terza volta uguale → fermo
  const piu = storico.concat(S("a5", "2026-11-04", "A", { "A.squat": ser([112.5, 4, 2]) }));
  assert.equal(AN.calcola(P, M, piu, corpo, "2026-11-04").esercizi.find(e => e.id === "A.squat").stato, "fermo");
  // in crescita: record nell'ultima volta
  const su = storico.concat(S("a5", "2026-11-04", "A", { "A.squat": ser([117.5, 4, 2]) }));
  assert.equal(AN.calcola(P, M, su, corpo, "2026-11-04").esercizi.find(e => e.id === "A.squat").stato, "su");
  assert.equal(R.esercizi.find(e => e.id === "B.panca").stato, "stabile");
});

test("corpo e pagina", () => {
  const R = AN.calcola(P, M, storico, corpo, "2026-11-04");
  assert.deepEqual(R.peso, [{ d: "2026-10-12", v: 80.3 }, { d: "2026-10-19", v: 80.9 }]);
  assert.deepEqual(R.vita, [{ d: "2026-10-20", v: 82 }]);
  const h = AN.html(R);
  assert.match(h, /Sedute per settimana/);
  assert.match(h, /data-punti=/);
  assert.ok(!/NaN|undefined/.test(h), "niente NaN o undefined nella pagina");
  assert.match(AN.html(AN.calcola(P, M, [], [], "2026-10-12")), /dopo la prima seduta/);
});

test("senza nome salvato, il nome viene dal programma", () => {
  const R = AN.calcola(P, M, storico, corpo, "2026-11-04");
  assert.equal(R.esercizi.find(e => e.id === "A.squat").nome, M.defDi(P, "A.squat").nome);
  assert.ok(!R.kpi.recordNomi.some(n => /^[A-D]\./.test(n)));
});
