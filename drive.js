// Invio automatico a Google Drive (dal 10 ottobre 2026).
// L'app manda i dati a uno script Google (drive/Codice.gs) che gira con l'account dell'utente
// e li scrive in Assistenti/Palestra/Registro: un .txt per seduta, il foglio "Registro Work-out"
// e work-out-dati.json. Nessun server nostro; foto, chat e chiavi non partono mai.
// Le funzioni che preparano il pacchetto sono pure: si provano in node (test/drive.test.js).
(function (root) {
  "use strict";
  const MIS = [["vita", "Vita"], ["spalle", "Spalle"], ["petto", "Petto"], ["braccio", "Braccio"], ["coscia", "Coscia"]];
  const n2 = x => (x == null ? "" : Math.round(x * 100) / 100);

  function nomeSeduta(P, s) {
    const l = P.sedute[s.seduta];
    return `${s.data} ${s.seduta}${l ? " - " + l.nome : ""}`;
  }
  function testoFile(P, M, s) {
    const extra = [s.durataMin ? s.durataMin + " minuti" : "", s.forma === "giu" ? "giornata no" : s.forma === "rosso" ? "giornata rossa" : ""].filter(Boolean).join(" · ");
    return M.testoSeduta(P, s) + (extra ? "\n" + extra : "") + "\n";
  }

  function righeSedute(P, M, sedute) {
    const r = [["Data", "Settimana", "Seduta", "Minuti", "Forma", "Esercizi", "Serie", "Ripetizioni", "Tonnellaggio (kg)", "Note"]];
    for (const s of sedute) {
      let es = 0, ser = 0, rip = 0, ton = 0;
      for (const e of Object.values(s.esercizi || {})) {
        const f = M.fatte(e);
        if (f.length) es++;
        for (const x of f) { ser++; rip += M.ripTot(x); ton += M.tonnellaggio(x); }
      }
      r.push([s.data, s.sett || "", s.seduta, s.durataMin || "", s.forma || "ok", es, ser, rip, n2(ton), s.nota || ""]);
    }
    return r;
  }
  function righeSerie(P, M, sedute) {
    const r = [["Data", "Settimana", "Seduta", "Esercizio", "Codice", "Al posto di", "Serie", "kg", "Ripetizioni", "RIR", "Scalo", "Ripetizioni totali", "Tonnellaggio (kg)"]];
    for (const s of sedute) for (const [id, e] of Object.entries(s.esercizi || {})) {
      M.fatte(e).forEach((x, i) => {
        const sc = M.scali(x).map(d => (d.kg ? M.fmtKg(d.kg) + "×" : "") + d.rip).join(" + ");
        r.push([s.data, s.sett || "", s.seduta, e.nome || (M.defDi(P, id) || {}).nome || id, id, e.alPostoDi || "", i + 1, x.kg == null ? "" : n2(x.kg), x.rip, x.rir == null ? "" : x.rir, sc, M.ripTot(x), n2(M.tonnellaggio(x))]);
      });
    }
    return r;
  }
  function righeCorpo(corpo) {
    const r = [["Data", "Peso (kg)"].concat(MIS.map(m => m[1] + " (cm)"), ["Nota"])];
    for (const c of corpo) {
      const m = c.misure || {};
      if (c.peso == null && !MIS.some(([k]) => m[k] != null) && !c.nota) continue;
      r.push([c.data, c.peso == null ? "" : c.peso].concat(MIS.map(([k]) => (m[k] == null ? "" : m[k])), [c.nota || ""]));
    }
    return r;
  }

  // coda: {cambiate: [id], togli: [id]}; restituisce il corpo della richiesta senza il codice
  function pacchetto(P, M, sedute, corpo, coda, ora) {
    const vere = sedute.filter(s => !s.iniziale).sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
    const cambiate = new Set(coda.cambiate || []);
    const corpoOrd = corpo.slice().sort((a, b) => (a.data < b.data ? -1 : 1));
    return {
      testi: vere.filter(s => cambiate.has(s.id)).map(s => ({ id: s.id, nome: nomeSeduta(P, s), testo: testoFile(P, M, s) })),
      togli: (coda.togli || []).filter(id => !vere.some(s => s.id === id)),
      fogli: { Sedute: righeSedute(P, M, vere), Serie: righeSerie(P, M, vere), Corpo: righeCorpo(corpoOrd) },
      dati: {
        app: "seduta", formato: 1, esportato: ora || new Date().toISOString(), programma: P.versione,
        sedute, corpo: corpoOrd.map(c => { const x = Object.assign({}, c); delete x.foto; return x; })
      }
    };
  }

  // POST come testo semplice: il browser non fa la richiesta preliminare che Google rifiuterebbe
  async function invia(url, token, corpo, fetchImpl) {
    const f = fetchImpl || fetch;
    let r;
    try {
      r = await f(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(Object.assign({ token }, corpo)), redirect: "follow" });
    } catch (e) {
      throw new Error(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "Drive non raggiungibile (rete o indirizzo dello script).");
    }
    const t = await r.text();
    let j;
    try { j = JSON.parse(t); } catch (_) {
      throw new Error(/accounts\.google|signin|ServiceLogin/i.test(t) ? "Lo script chiede l'accesso: nella pubblicazione imposta \"Chi ha accesso: Chiunque\"." : "Risposta strana dallo script (" + r.status + "): controlla l'indirizzo, deve finire con /exec.");
    }
    if (!j.ok) throw new Error(j.errore || "Errore dello script.");
    return j;
  }

  const urlValido = u => /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(String(u || "").trim());
  function nuovoCodice() {
    const a = new Uint8Array(18);
    (root.crypto || require("crypto").webcrypto).getRandomValues(a);
    return Array.from(a, b => b.toString(16).padStart(2, "0")).join("");
  }

  const Drive = { pacchetto, invia, urlValido, nuovoCodice, righeSedute, righeSerie, righeCorpo, nomeSeduta };
  if (typeof module !== "undefined" && module.exports) module.exports = Drive;
  else root.Drive = Drive;
})(typeof globalThis !== "undefined" ? globalThis : this);
