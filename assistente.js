// Assistente: chiama l'API Gemini direttamente dal telefono con la chiave
// dell'utente (gratuita da aistudio.google.com). Nessun server in mezzo.
// La chiave resta solo nel telefono (IndexedDB), mai nei backup.
(function (root) {
  "use strict";
  const BASE = "https://generativelanguage.googleapis.com/v1beta";

  async function blobBase64(blob) {
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = "";
    for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return btoa(s);
  }

  function erroreLeggibile(stato, corpo) {
    let msg = "";
    try { msg = JSON.parse(corpo).error.message || ""; } catch (_) { msg = corpo.slice(0, 200); }
    if (stato === 400 && /API key/i.test(msg)) return "Chiave API non valida: controllala in Altro → Assistente.";
    // 402: la chiave è valida, ma il suo progetto ha la fatturazione prepagata senza credito
    // (con la fatturazione attiva il livello gratuito non vale più)
    if (stato === 402) return "La chiave funziona, ma è in un progetto Google con fatturazione prepagata e credito finito (402). In AI Studio crea la chiave in un progetto nuovo, senza fatturazione: lì vale il livello gratuito. Intanto usa \"Manda all'app Gemini\".";
    if (stato === 403) return "Chiave senza permesso per questo modello (403). " + msg;
    if (stato === 404) return "Modello non trovato (404): in Altro → Assistente tocca \"Trova modelli\" e scegline uno.";
    if (stato === 429) return "Quota gratuita esaurita per ora (429): riprova tra qualche minuto, o usa \"Manda all'app Gemini\".";
    if (stato >= 500) return "Il servizio di Google non risponde (" + stato + "): riprova tra poco.";
    return "Errore " + stato + ": " + msg;
  }

  // messaggi: [{ruolo: "user"|"model", testo, immagini: [Blob]}]
  async function invia({ chiave, modello, sistema, messaggi, onTesto, signal }) {
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
    const r = await fetch(`${BASE}/models/${encodeURIComponent(modello)}:streamGenerateContent?alt=sse`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": chiave },
      body: JSON.stringify(corpo),
      signal
    });
    if (!r.ok) throw new Error(erroreLeggibile(r.status, await r.text()));
    const lettore = r.body.getReader();
    const dec = new TextDecoder();
    let buf = "", testo = "", fine = null;
    for (;;) {
      const { value, done } = await lettore.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const riga = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!riga.startsWith("data:")) continue;
        let j;
        try { j = JSON.parse(riga.slice(5)); } catch (_) { continue; }
        const c = j.candidates && j.candidates[0];
        if (j.promptFeedback && j.promptFeedback.blockReason) throw new Error("Richiesta bloccata dal filtro di Google (" + j.promptFeedback.blockReason + ").");
        if (!c) continue;
        for (const p of (c.content && c.content.parts) || []) if (p.text && !p.thought) testo += p.text;
        if (c.finishReason) fine = c.finishReason;
        if (onTesto) onTesto(testo);
      }
    }
    if (!testo && fine && fine !== "STOP") throw new Error("Nessuna risposta (motivo: " + fine + ").");
    return { testo, fine };
  }

  async function elencaModelli(chiave) {
    const r = await fetch(`${BASE}/models?pageSize=200`, { headers: { "x-goog-api-key": chiave } });
    if (!r.ok) throw new Error(erroreLeggibile(r.status, await r.text()));
    const j = await r.json();
    return (j.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map(m => ({ id: m.name.replace(/^models\//, ""), nome: m.displayName || m.name }))
      .filter(m => /gemini/i.test(m.id) && !/embed|tts|image|live|audio/i.test(m.id));
  }

  root.Assistente = { invia, elencaModelli, blobBase64 };
})(globalThis);
