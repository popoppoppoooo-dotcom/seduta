// Invio a Drive: il pacchetto che parte dall'app e lo script Google (drive/Codice.gs)
// fatto girare in node con finti DriveApp, SpreadsheetApp e PropertiesService.
const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");
require("../programma.js");
const M = require("../motore.js");
const G = require("../drive.js");
const P = globalThis.PROGRAMMA;

const sedute = [
  { id: "ini-A", iniziale: true, data: "2026-10-01", seduta: "A", esercizi: { "A.squat": { serie: [{ kg: 100, rip: 5 }] } } },
  { id: "s1", data: "2026-10-12", sett: 7, seduta: "A", durataMin: 70, forma: "ok", nota: "bene",
    esercizi: {
      "A.squat": { nome: "Squat bilanciere", serie: [{ kg: 110, rip: 4, rir: 2 }, { kg: 110, rip: 4, rir: 1 }] },
      "A.laterali": { nome: "Alzate laterali", serie: [{ kg: 12, rip: 9, rir: 0, drop: [{ kg: 10, rip: 3 }] }] },
      "A.trazioni": { nome: "Trazioni", serie: [{ kg: null, rip: 8, rir: 1 }] }
    } },
  { id: "s0", data: "2026-10-05", sett: 6, seduta: "B", esercizi: { "B.panca": { nome: "Panca piana manubri", serie: [{ kg: 20, rip: 10, rir: 1 }] } } }
];
const corpo = [{ id: "2026-10-12", data: "2026-10-12", peso: 80.4, misure: { vita: 82 }, foto: { fronte: "corpo-x" }, nota: "" }, { id: "2026-10-11", data: "2026-10-11", misure: {}, foto: {} }];

test("pacchetto: testi solo delle sedute cambiate, fogli con tutte, niente foto", () => {
  const p = G.pacchetto(P, M, sedute, corpo, { cambiate: ["s1"], togli: ["vecchia", "s0"] }, "2026-10-12T18:00:00Z");
  assert.equal(p.testi.length, 1);
  assert.equal(p.testi[0].nome, "2026-10-12 A - " + P.sedute.A.nome);
  assert.match(p.testi[0].testo, /Alzate laterali — 12×9\+10×3 \(0\)/);
  assert.match(p.testi[0].testo, /70 minuti/);
  assert.deepEqual(p.togli, ["vecchia"]); // s0 esiste ancora: non si cancella
  // Sedute: intestazione + 2 vere, in ordine di data, senza la partenza
  assert.deepEqual(p.fogli.Sedute.map(r => r[0]), ["Data", "2026-10-05", "2026-10-12"]);
  const r12 = p.fogli.Sedute[2];
  assert.equal(r12[6], 4); // serie
  assert.equal(r12[7], 4 + 4 + 12 + 8); // ripetizioni, scalo compreso
  assert.equal(r12[8], 110 * 8 + 12 * 9 + 10 * 3); // tonnellaggio
  const lat = p.fogli.Serie.find(r => r[4] === "A.laterali");
  assert.equal(lat[10], "10×3"); assert.equal(lat[11], 12); assert.equal(lat[12], 138);
  assert.equal(p.fogli.Corpo.length, 2); // il giorno vuoto non c'è
  assert.deepEqual(p.fogli.Corpo[1].slice(0, 3), ["2026-10-12", 80.4, 82]);
  assert.equal(p.dati.corpo[1].foto, undefined);
  assert.equal(p.dati.sedute.length, 3);
  assert.ok(!JSON.stringify(p).includes("chiave"));
});

test("indirizzo dello script e codice segreto", () => {
  assert.ok(G.urlValido("https://script.google.com/macros/s/AKfycbx-Ab_12/exec"));
  assert.ok(!G.urlValido("https://script.google.com/macros/s/AKfycbx/dev"));
  assert.ok(!G.urlValido("https://evil.example/exec"));
  const c = G.nuovoCodice();
  assert.match(c, /^[0-9a-f]{36}$/);
  assert.notEqual(c, G.nuovoCodice());
});

test("invio: errori leggibili", async () => {
  const ok = async () => ({ status: 200, text: async () => JSON.stringify({ ok: true, scritti: 1 }) });
  assert.equal((await G.invia("u", "t", {}, ok)).scritti, 1);
  const login = async () => ({ status: 200, text: async () => "<html>accounts.google.com ServiceLogin" });
  await assert.rejects(G.invia("u", "t", {}, login), /Chiunque/);
  const rifiuto = async () => ({ status: 200, text: async () => JSON.stringify({ ok: false, errore: "Codice dell'app diverso" }) });
  await assert.rejects(G.invia("u", "t", {}, rifiuto), /diverso/);
  const rete = async () => { throw new TypeError("Failed to fetch"); };
  await assert.rejects(G.invia("u", "t", {}, rete), /non raggiungibile/);
});

// ---------- finto Google ----------
function google() {
  let n = 0;
  const file = new Map(), cartelle = [];
  const props = new Map();
  const mkFile = (nome, testo, dir) => { const f = { id: "f" + ++n, nome, testo, cestino: false, dir,
    getId: () => f.id, getName: () => f.nome, setName: x => { f.nome = x; }, setContent: x => { f.testo = x; }, isTrashed: () => f.cestino, setTrashed: x => { f.cestino = x; },
    moveTo: d => { f.dir = d; }, getBlob: () => ({ getDataAsString: () => f.testo }) }; file.set(f.id, f); return f; };
  const mkDir = (nome, padre) => { const d = { nome, padre, figli: [],
    getName: () => nome,
    getFoldersByName: x => { const t = d.figli.filter(c => c.nome === x); return { hasNext: () => t.length > 0, next: () => t.shift() }; },
    createFolder: x => { const c = mkDir(x, d); d.figli.push(c); return c; },
    createFile: (nm, testo) => mkFile(nm, testo, d) }; cartelle.push(d); return d; };
  const radice = mkDir("My Drive", null);
  radice.createFolder("Assistenti").createFolder("Palestra");
  const fogli = new Map();
  const mkSS = nome => { const f = mkFile(nome, "", radice); const ss = { schede: new Map([["Foglio1", []]]), url: "https://docs/" + f.id,
    getId: () => f.id, getUrl: () => ss.url, getSheets: () => [...ss.schede.keys()],
    getSheetByName: x => (ss.schede.has(x) ? scheda(ss, x) : null), insertSheet: x => { ss.schede.set(x, []); return scheda(ss, x); },
    deleteSheet: s => ss.schede.delete(s.nome) }; fogli.set(f.id, ss); return ss; };
  const scheda = (ss, nome) => ({ nome, clearContents: () => ss.schede.set(nome, []), setFrozenRows: () => {},
    getRange: (r, c, nr, nc) => ({ setValues: v => { assert.equal(v.length, nr); v.forEach(x => assert.equal(x.length, nc)); ss.schede.set(nome, v); } }) });
  const ctx = {
    DriveApp: { getRootFolder: () => radice, getFileById: id => { if (!file.has(id)) throw new Error("no"); return file.get(id); } },
    SpreadsheetApp: { create: mkSS, openById: id => { if (!fogli.has(id)) throw new Error("no"); return fogli.get(id); } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (props.has(k) ? props.get(k) : null), setProperty: (k, v) => props.set(k, v), deleteProperty: k => props.delete(k) }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    ContentService: { createTextOutput: t => ({ t, setMimeType() { return this; } }), MimeType: { JSON: "json" } },
    MimeType: { PLAIN_TEXT: "text/plain" },
    Logger: { log: () => {} }
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(__dirname + "/../drive/Codice.gs", "utf8"), ctx);
  const post = o => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(o) } }).t);
  const get = q => ctx.doGet({ parameter: q }).t;
  return { ctx, post, get, file, fogli, props, radice };
}

test("script Google: crea cartella, file, foglio e JSON; aggiorna senza duplicare", () => {
  const g = google();
  const tok = "a".repeat(36);
  const p = G.pacchetto(P, M, sedute, corpo, { cambiate: ["s1", "s0"] });
  const r = g.post(Object.assign({ token: tok }, p));
  assert.equal(r.ok, true, r.errore); assert.equal(r.scritti, 2);
  const reg = g.radice.figli[0].figli[0].figli.find(d => d.nome === "Registro");
  assert.ok(reg, "cartella Registro creata dentro Assistenti/Palestra");
  const txt = [...g.file.values()].filter(f => f.dir === reg && f.nome.endsWith(".txt"));
  assert.equal(txt.length, 2);
  const ss = g.fogli.get(g.props.get("FOGLIO"));
  assert.deepEqual(ss.getSheets(), ["Sedute", "Serie", "Corpo"]); // Foglio1 tolto
  assert.equal(ss.schede.get("Sedute").length, 3);
  assert.equal(g.file.get(g.props.get("FOGLIO")).dir, reg);
  // seconda volta: la seduta modificata riscrive lo stesso file
  const s1b = JSON.parse(JSON.stringify(sedute)); s1b[1].nota = "modificata";
  const r2 = g.post(Object.assign({ token: tok }, G.pacchetto(P, M, s1b, corpo, { cambiate: ["s1"] })));
  assert.equal(r2.ok, true);
  const txt2 = [...g.file.values()].filter(f => f.dir === reg && f.nome.endsWith(".txt"));
  assert.equal(txt2.length, 2);
  assert.match(txt2.find(f => f.nome.startsWith("2026-10-12")).testo, /Note: modificata/);
  assert.equal([...g.file.values()].filter(f => f.nome === "work-out-dati.json").length, 1);
  // eliminata dall'app → nel cestino
  const r3 = g.post({ token: tok, togli: ["s0"] });
  assert.equal(r3.tolti, 1);
  assert.equal(txt2.find(f => f.nome.startsWith("2026-10-05")).cestino, true);
  // un altro codice viene rifiutato
  const r4 = g.post({ token: "b".repeat(36), testi: [] });
  assert.equal(r4.ok, false); assert.match(r4.errore, /diverso/);
  // lettura dei dati da un altro dispositivo
  assert.equal(JSON.parse(g.get({ azione: "dati", token: tok })).app, "seduta");
  assert.match(g.get({ azione: "dati", token: "x" }), /non valido/);
  assert.match(g.get({}), /attivo/);
  // una nota che sembra una formula resta testo
  const g2 = google();
  g2.post({ token: tok, fogli: { Sedute: [["Data", "Note"], ["2026-10-12", '=IMAGE("https://x")'], ["2026-10-13", -3]] } });
  const sh = g2.fogli.get(g2.props.get("FOGLIO")).schede.get("Sedute");
  assert.equal(sh[1][1], `'=IMAGE("https://x")`); assert.equal(sh[2][1], -3);
});
