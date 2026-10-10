// Assistente: chiama il modello direttamente dal telefono, nessun server in mezzo.
// Due fornitori (dal 10 ottobre 2026):
// - OpenRouter (a consumo, consigliato): DeepSeek v4.1 Flash, circa 1 centesimo la prima
//   domanda di una chat e 0,1-0,2 dopo (cache del contesto). OpenRouter accetta chiamate dal browser.
// - Gemini (gratis da aistudio.google.com): sul telefono si fermava dopo due messaggi con
//   "Failed to fetch" (la richiesta non arriva o Google risponde senza i permessi per il browser).
// Le chiavi restano solo nel telefono (IndexedDB), mai nei backup.
(function (root) {
  "use strict";
  const BASE = "https://generativelanguage.googleapis.com/v1beta";
  const OR = "https://openrouter.ai/api/v1/chat/completions";
  const MODELLI_OR = [
    ["deepseek/deepseek-v4.1-flash", "DeepSeek v4.1 Flash · consigliato, legge anche le foto"],
    ["google/gemini-3.8-flash", "Gemini 3.8 Flash · più caro, buono sulle foto"]
  ];
  // modelli che non leggono le foto: se la domanda ha foto si passa a DeepSeek v4.1 Flash
  const SOLO_TESTO = /deepseek-v4-pro|deepseek-chat|deepseek-r1|deepseek-v3/;

  async function blobBase64(blob) {
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = "";
    for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return btoa(s);
  }
  const pausa = ms => new Promise(ok => setTimeout(ok, ms));
  // "Failed to fetch" (TypeError): la richiesta non è arrivata o la risposta è stata bloccata dal browser
  const diRete = e => e && e.name === "TypeError";
  // un nuovo tentativo dopo un errore di rete (campo debole in palestra), non dopo un rifiuto vero
  async function conRiprova(chiama, signal) {
    try { return await chiama(); } catch (e) {
      if (!diRete(e) || (signal && signal.aborted)) throw e;
      await pausa(3000);
      return chiama();
    }
  }
  function erroreRete(chi) {
    const e = new Error(navigator.onLine === false ? "Sei offline: riprova quando c'è campo."
      : chi === "gemini" ? "Connessione a Google non riuscita (Failed to fetch), anche al secondo tentativo. Con la chiave gratuita succede dopo pochi messaggi: probabilmente il limite al minuto di Google, che risponde in un modo che il browser blocca. Usa OpenRouter in Altro → Assistente, o \"Manda all'app Gemini\"."
      : "Connessione a OpenRouter non riuscita (Failed to fetch), anche al secondo tentativo: controlla la rete e riprova.");
    e.rete = true;
    return e;
  }

  // ---------------- Gemini ----------------
  function erroreLeggibile(stato, corpo) {
    let msg = "";
    try { msg = JSON.parse(corpo).error.message || ""; } catch (_) { msg = corpo.slice(0, 200); }
    if (stato === 400 && /API key/i.test(msg)) return "Chiave API non valida: controllala in Altro → Assistente.";
    // 402: la chiave è valida, ma il suo progetto ha la fatturazione prepagata senza credito
    // (con la fatturazione attiva il livello gratuito non vale più)
    if (stato === 402) return "La chiave funziona, ma è in un progetto Google con fatturazione prepagata e credito finito (402). In AI Studio crea la chiave in un progetto nuovo, senza fatturazione: lì vale il livello gratuito. Intanto usa \"Manda all'app Gemini\".";
    if (stato === 403) {
      // le cause più comuni, dal testo di Google
      if (/has not been used|is disabled|SERVICE_DISABLED/i.test(msg)) return "La chiave è in un progetto Google dove l'API Gemini non è attiva (403). Crea la chiave da aistudio.google.com/apikey (\"Create API key in new project\"): lì l'API è già attiva.";
      if (/referer|referrer|API_KEY_.*BLOCKED|restrict/i.test(msg)) return "La chiave ha delle restrizioni (siti o API consentiti) che bloccano l'app (403). Togli le restrizioni dalla chiave nella console Google, o creane una nuova da AI Studio senza restrizioni.";
      if (/location is not supported/i.test(msg)) return "Google non offre l'API Gemini dal luogo o dalla rete da cui chiami (403): spegni VPN o relay privato e riprova, o usa \"Manda all'app Gemini\".";
      if (/leaked/i.test(msg)) return "Google ha bloccato questa chiave perché risulta pubblicata da qualche parte (403). Cancellala e creane una nuova in AI Studio, senza incollarla in chat o file condivisi.";
      if (/suspended|billing/i.test(msg)) return "Il progetto Google della chiave è sospeso o ha un problema di fatturazione (403). Crea la chiave in un progetto nuovo, senza fatturazione.";
      return "Chiave senza permesso per questo modello (403). Prova \"Trova modelli\" in Altro → Assistente e scegline un altro. Dettaglio di Google: " + msg;
    }
    // 404 senza testo: Google lo dà per qualche decina di secondi dopo molte richieste di fila
    if (stato === 404 && !corpo.trim()) return "Google non risponde per ora (404 senza dettagli, succede dopo molte richieste di fila): riprova tra un minuto, o passa a OpenRouter.";
    if (stato === 404) return "Modello non disponibile (404): in Altro → Assistente scrivi gemini-3.8-flash o tocca \"Trova modelli\". Dettaglio di Google: " + msg;
    if (stato === 429) return "Quota gratuita esaurita per ora (429): riprova tra qualche minuto, o passa a OpenRouter.";
    if (stato >= 500) return "Il servizio di Google non risponde (" + stato + "): riprova tra poco.";
    return "Errore " + stato + ": " + msg;
  }

  async function inviaGemini({ chiave, modello, sistema, messaggi, onTesto, signal }) {
    const contents = [];
    for (const m of messaggi) {
      const parts = [];
      for (const b of m.immagini || []) parts.push({ inline_data: { mime_type: b.type || "image/jpeg", data: await blobBase64(b) } });
      parts.push({ text: m.testo || "(foto)" });
      contents.push({ role: m.ruolo === "model" ? "model" : "user", parts });
    }
    const corpo = {
      systemInstruction: { parts: [{ text: sistema }] },
      contents,
      generationConfig: { temperature: 0.5, maxOutputTokens: 8192 }
    };
    const chiama = () => fetch(`${BASE}/models/${encodeURIComponent(modello)}:streamGenerateContent?alt=sse`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": chiave },
      body: JSON.stringify(corpo),
      signal
    });
    let r;
    try { r = await conRiprova(chiama, signal); } catch (e) { if (diRete(e)) throw erroreRete("gemini"); throw e; }
    // 404 vuoto o 503: blocchi momentanei di Google; un solo nuovo tentativo
    // (insistere allunga il blocco, secondo il parere di Gemini del 9 ottobre 2026)
    if (r.status === 503 || r.status === 404) {
      const testoErr = await r.text();
      if (r.status === 404 && testoErr.trim()) throw new Error(erroreLeggibile(404, testoErr));
      await pausa(5000);
      try { r = await chiama(); } catch (e) { if (diRete(e)) throw erroreRete("gemini"); throw e; }
    }
    if (!r.ok) throw new Error(erroreLeggibile(r.status, await r.text()));
    let testo = "", fine = null;
    await leggiSse(r, j => {
      const c = j.candidates && j.candidates[0];
      if (j.promptFeedback && j.promptFeedback.blockReason) throw new Error("Richiesta bloccata dal filtro di Google (" + j.promptFeedback.blockReason + ").");
      if (!c) return;
      for (const p of (c.content && c.content.parts) || []) if (p.text && !p.thought) testo += p.text;
      if (c.finishReason) fine = c.finishReason;
      if (onTesto) onTesto(testo);
    }, "gemini");
    if (!testo && fine && fine !== "STOP") throw new Error("Nessuna risposta (motivo: " + fine + ").");
    return { testo, fine, costo: 0, modello };
  }

  // risposta in streaming (server-sent events): una riga "data: {...}" per pezzo
  async function leggiSse(r, suEvento, chi) {
    const lettore = r.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    const righe = fine => {
      let i;
      while ((i = buf.indexOf("\n")) >= 0 || (fine && buf)) {
        const riga = (i >= 0 ? buf.slice(0, i) : buf).trim();
        buf = i >= 0 ? buf.slice(i + 1) : "";
        if (!riga.startsWith("data:")) continue;
        const dati = riga.slice(5).trim();
        if (!dati || dati === "[DONE]") continue;
        let j;
        try { j = JSON.parse(dati); } catch (_) { continue; }
        suEvento(j);
      }
    };
    for (;;) {
      let pezzo;
      // la connessione può cadere a metà risposta (campo debole): si tiene quello arrivato
      try { pezzo = await lettore.read(); } catch (e) { if (diRete(e)) { const x = erroreRete(chi); x.parziale = true; throw x; } throw e; }
      if (pezzo.done) break;
      buf += dec.decode(pezzo.value, { stream: true });
      righe(false);
    }
    buf += dec.decode();
    righe(true);
  }

  // ---------------- OpenRouter ----------------
  function erroreOR(stato, corpo) {
    let msg = "";
    try { msg = JSON.parse(corpo).error.message || ""; } catch (_) { msg = corpo.slice(0, 200); }
    if (stato === 401) return "Chiave OpenRouter mancante o non valida: controllala in Altro → Assistente.";
    if (stato === 402) return "Credito OpenRouter finito (o limite della chiave raggiunto): ricarica o alza il limite su openrouter.ai/settings/keys.";
    if (stato === 429) return "Troppe richieste per ora (429): riprova tra un minuto.";
    if (stato === 404 && /image/i.test(msg)) return "Questo modello non legge le foto: scegli DeepSeek v4.1 Flash in Altro → Assistente.";
    if (stato === 400 && /model/i.test(msg)) return "Modello non valido su OpenRouter: " + msg;
    if (stato >= 500) return "OpenRouter o il modello non rispondono (" + stato + "): riprova tra poco.";
    return "Errore OpenRouter " + stato + ": " + msg;
  }

  async function inviaOR({ chiave, modello, sistema, messaggi, onTesto, signal }) {
    const conFoto = messaggi.some(m => m.immagini && m.immagini.length);
    if (conFoto && SOLO_TESTO.test(modello)) modello = MODELLI_OR[0][0];
    const messages = [{ role: "system", content: sistema }];
    for (const m of messaggi) {
      const imgs = m.immagini || [];
      if (!imgs.length) { messages.push({ role: m.ruolo === "model" ? "assistant" : "user", content: m.testo || "" }); continue; }
      const content = [{ type: "text", text: m.testo || "(foto)" }];
      for (const b of imgs) content.push({ type: "image_url", image_url: { url: `data:${b.type || "image/jpeg"};base64,${await blobBase64(b)}` } });
      messages.push({ role: "user", content });
    }
    const chiama = () => fetch(OR, {
      method: "POST",
      headers: { Authorization: "Bearer " + chiave, "Content-Type": "application/json", "X-Title": "Work-out" },
      body: JSON.stringify({ model: modello, messages, stream: true, temperature: 0.5, max_tokens: 4000, usage: { include: true } }),
      signal
    });
    let r;
    try { r = await conRiprova(chiama, signal); } catch (e) { if (diRete(e)) throw erroreRete("openrouter"); throw e; }
    if (!r.ok) throw new Error(erroreOR(r.status, await r.text()));
    let testo = "", costo = null, usato = modello, fine = null;
    await leggiSse(r, j => {
      if (j.error) throw new Error("Errore dal modello: " + (j.error.message || JSON.stringify(j.error)));
      const c = j.choices && j.choices[0];
      if (c && c.delta && c.delta.content) { testo += c.delta.content; if (onTesto) onTesto(testo); }
      if (c && c.finish_reason) fine = c.finish_reason;
      if (j.usage && j.usage.cost != null) costo = j.usage.cost;
      if (j.model) usato = j.model;
    }, "openrouter");
    if (!testo) throw new Error("Nessuna risposta dal modello" + (fine ? " (motivo: " + fine + ")." : "."));
    return { testo, fine, costo, modello: usato };
  }

  // messaggi: [{ruolo: "user"|"model", testo, immagini: [Blob]}]
  function invia(o) { return o.fornitore === "gemini" ? inviaGemini(o) : inviaOR(o); }

  async function elencaModelli(chiave) {
    const r = await fetch(`${BASE}/models?pageSize=200`, { headers: { "x-goog-api-key": chiave } });
    if (!r.ok) throw new Error(erroreLeggibile(r.status, await r.text()));
    const j = await r.json();
    return (j.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map(m => ({ id: m.name.replace(/^models\//, ""), nome: m.displayName || m.name }))
      .filter(m => /gemini/i.test(m.id) && !/embed|tts|image|live|audio/i.test(m.id));
  }

  root.Assistente = { invia, elencaModelli, blobBase64, MODELLI_OR };
})(globalThis);
