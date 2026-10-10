// Client del coach: OpenRouter in streaming, costo, nuovo tentativo dopo "Failed to fetch".
const assert = require("node:assert/strict");
const test = require("node:test");
require("../assistente.js");
const A = globalThis.Assistente;

const sse = righe => {
  const testo = righe.map(r => "data: " + (typeof r === "string" ? r : JSON.stringify(r)) + "\n\n").join("");
  const pezzi = [testo.slice(0, 37), testo.slice(37)]; // una riga spezzata a metà tra due pezzi
  return { ok: true, status: 200, body: { getReader: () => { let i = 0; return { read: async () => (i < pezzi.length ? { done: false, value: new TextEncoder().encode(pezzi[i++]) } : { done: true }) }; } } };
};
const RISPOSTA = [": OPENROUTER PROCESSING", { choices: [{ delta: { content: "Ciao" } }] }, { choices: [{ delta: { content: " a te" }, finish_reason: "stop" }], model: "deepseek/deepseek-v4.1-flash" }, { choices: [], usage: { cost: 0.0012 } }, "[DONE]"];

test("OpenRouter: testo, costo e immagini come data URL", async () => {
  let corpo;
  globalThis.fetch = async (url, o) => { corpo = JSON.parse(o.body); assert.match(o.headers.Authorization, /^Bearer sk-or-/); return sse(RISPOSTA); };
  const parziali = [];
  const r = await A.invia({ fornitore: "openrouter", chiave: "sk-or-x", modello: "deepseek/deepseek-v4.1-flash", sistema: "S", onTesto: t => parziali.push(t),
    messaggi: [{ ruolo: "user", testo: "ciao" }, { ruolo: "model", testo: "eccomi" }, { ruolo: "user", testo: "guarda", immagini: [new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" })] }] });
  assert.equal(r.testo, "Ciao a te"); assert.equal(r.costo, 0.0012);
  assert.deepEqual(parziali, ["Ciao", "Ciao a te"]);
  assert.equal(corpo.messages[0].role, "system"); assert.equal(corpo.messages[2].role, "assistant");
  assert.equal(corpo.messages[3].content[1].image_url.url, "data:image/jpeg;base64,AQID");
  assert.equal(corpo.stream, true);
});

test("Failed to fetch: un nuovo tentativo, poi messaggio chiaro", async () => {
  let n = 0;
  globalThis.fetch = async () => { if (++n === 1) throw new TypeError("Failed to fetch"); return sse(RISPOSTA); };
  const t0 = Date.now();
  const r = await A.invia({ fornitore: "openrouter", chiave: "k", modello: "m", sistema: "", messaggi: [{ ruolo: "user", testo: "x" }] });
  assert.equal(r.testo, "Ciao a te"); assert.equal(n, 2); assert.ok(Date.now() - t0 >= 2900);
  globalThis.fetch = async () => { throw new TypeError("Failed to fetch"); };
  await assert.rejects(A.invia({ fornitore: "gemini", chiave: "k", modello: "gemini-3.8-flash", sistema: "", messaggi: [{ ruolo: "user", testo: "x" }] }), e => e.rete && /OpenRouter/.test(e.message));
});

test("errori OpenRouter leggibili", async () => {
  for (const [st, re] of [[401, /non valida/], [402, /Credito/], [429, /Troppe/]]) {
    globalThis.fetch = async () => ({ ok: false, status: st, text: async () => JSON.stringify({ error: { message: "x" } }) });
    await assert.rejects(A.invia({ fornitore: "openrouter", chiave: "k", modello: "m", sistema: "", messaggi: [{ ruolo: "user", testo: "x" }] }), re);
  }
});
