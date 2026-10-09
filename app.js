// Seduta: interfaccia. Dati solo sul telefono (IndexedDB), backup su Drive
// tramite il pannello "Condividi" di Android.
(function () {
  "use strict";
  const P = globalThis.PROGRAMMA, M = globalThis.Motore, A = globalThis.Assistente;
  const $ = s => document.querySelector(s);
  const vista = $("#vista");

  // ---------------- archivio (IndexedDB) ----------------
  const DB = (() => {
    let p;
    const apri = () => p || (p = new Promise((ok, ko) => {
      const r = indexedDB.open("seduta", 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        for (const n of ["sedute", "corpo", "foto", "chat"]) d.createObjectStore(n, { keyPath: "id" });
        d.createObjectStore("kv", { keyPath: "k" });
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ko(r.error);
    }));
    async function tx(store, modo, fn) {
      const d = await apri();
      return new Promise((ok, ko) => {
        const t = d.transaction(store, modo);
        const req = fn(t.objectStore(store));
        t.oncomplete = () => ok(req && "result" in req ? req.result : undefined);
        t.onerror = () => ko(t.error);
        t.onabort = () => ko(t.error || new Error("transazione annullata"));
      });
    }
    return {
      tutti: s => tx(s, "readonly", st => st.getAll()),
      prendi: (s, k) => tx(s, "readonly", st => st.get(k)),
      metti: (s, v) => tx(s, "readwrite", st => st.put(v)),
      togli: (s, k) => tx(s, "readwrite", st => st.delete(k)),
      kv: async k => ((await tx("kv", "readonly", st => st.get(k))) || {}).v,
      kvMetti: (k, v) => tx("kv", "readwrite", st => st.put({ k, v }))
    };
  })();

  // ---------------- stato ----------------
  const S = {
    vista: "oggi", sedute: [], corpo: [], chat: [], imp: {}, bozza: null,
    alternative: {}, sapere: "", forma: "ok", pront: {}, riepilogo: null, allegati: [], inCorso: null, sotto: null
  };
  const IMP0 = { modello: "gemini-flash-latest", chiave: "", profilo: "", tema: "auto", ultimoBackup: null };

  // ---------------- utilità ----------------
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const oggi = () => new Date().toLocaleDateString("sv");
  const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  const GG = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
  const dataBreve = d => { const x = new Date(d + "T12:00:00"); return `${GG[x.getDay()]} ${x.getDate()} ${MESI[x.getMonth()]}`; };
  const num = v => { if (v === "" || v == null) return null; const n = Number(String(v).replace(",", ".")); return isFinite(n) ? n : null; };
  const kg = M.fmtKg;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  function toast(t, ms = 2400) {
    const d = document.createElement("div"); d.className = "toast"; d.textContent = t;
    document.body.appendChild(d); setTimeout(() => d.remove(), ms);
  }
  const vibra = () => { try { navigator.vibrate && navigator.vibrate(12); } catch (_) {} };
  const urlFoto = new Map();
  async function srcFoto(id) {
    if (urlFoto.has(id)) return urlFoto.get(id);
    const f = await DB.prendi("foto", id);
    if (!f) return "";
    const u = URL.createObjectURL(f.blob); urlFoto.set(id, u); return u;
  }
  async function riempiFoto(radice) {
    for (const el of radice.querySelectorAll("[data-foto]")) {
      const u = await srcFoto(el.dataset.foto);
      if (el.tagName === "IMG") el.src = u; else el.style.backgroundImage = `url("${u}")`;
    }
  }
  async function comprimi(file, lato = 1600, q = 0.82) {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const f = Math.min(1, lato / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * f); c.height = Math.round(bmp.height * f);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise(ok => c.toBlob(ok, "image/jpeg", q));
  }
  async function salvaImp() { await DB.kvMetti("imp", S.imp); }
  let timerBozza;
  function salvaBozza() { clearTimeout(timerBozza); timerBozza = setTimeout(() => DB.kvMetti("bozza", S.bozza), 250); }

  // ---------------- avvio ----------------
  async function avvio() {
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (_) {}
    S.imp = Object.assign({}, IMP0, (await DB.kv("imp")) || {});
    S.bozza = (await DB.kv("bozza")) || null;
    S.sedute = await DB.tutti("sedute");
    S.corpo = await DB.tutti("corpo");
    S.chat = (await DB.tutti("chat")).sort((a, b) => a.ts - b.ts);
    applicaTema();
    try { S.alternative = await (await fetch("alternative.json")).json(); } catch (_) { S.alternative = {}; }
    if (location.hash.slice(1)) S.vista = location.hash.slice(1);
    render();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").then(reg => {
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          nw && nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) toast("Nuova versione pronta: chiudi e riapri l'app.", 5000);
          });
        });
      }).catch(() => {});
    }
  }
  function applicaTema() {
    const t = S.imp.tema;
    if (t === "chiaro" || t === "scuro") document.documentElement.dataset.tema = t; else delete document.documentElement.dataset.tema;
  }

  function vai(v) { S.vista = v; history.replaceState(null, "", "#" + v); render(); window.scrollTo(0, 0); }
  function render() {
    for (const b of document.querySelectorAll("#nav button")) b.setAttribute("aria-current", String(b.dataset.vai === S.vista.split("/")[0]));
    const f = { oggi: vOggi, corpo: vCorpo, coach: vCoach, altro: vAltro, storico: vStorico, partenza: vPartenza, assistente: vImpAssistente, aiuto: vAiuto, settimana: vSettimana }[S.vista.split("/")[0]] || vOggi;
    f();
  }

  // ================= ALLENAMENTO =================
  function vOggi() {
    if (S.bozza) return vSeduta();
    if (S.riepilogo) return vRiepilogo();
    const d = oggi();
    const w = M.settimanaDi(P, d);
    const pr = M.prossimaSeduta(P, S.sedute, d, { forma: S.forma });
    let h = `<h1>${w ? `Settimana ${w.n} · ${esc(w.blocco)}${ondaTxt(w)}` : "Fuori programma"}</h1>`;
    if (w) {
      h += `<p class="tenue">${dataBreve(d)} · RIR ${w.rir[0]}${w.rir[1] !== w.rir[0] ? "-" + w.rir[1] : ""}${w.deload ? " · scarico" : ""}</p>`;
      if (w.nota) h += `<div class="avviso">${esc(w.nota)}</div>`;
    } else {
      h += `<div class="avviso">Il programma copre dal 31 agosto al 20 dicembre 2026. Per il prossimo blocco chiedi al coach un nuovo programma.js.</div>`;
    }
    for (const a of pr.avvisi) h += `<div class="avviso">${esc(a)}</div>`;
    const giorniBackup = S.imp.ultimoBackup ? M.giorni(S.imp.ultimoBackup, d) : null;
    if (S.sedute.length && (giorniBackup == null || giorniBackup > 7)) h += `<div class="avviso errore">Backup su Drive ${giorniBackup == null ? "mai fatto" : "di " + giorniBackup + " giorni fa"}. <a href="#" data-az="esporta">Fallo ora</a></div>`;
    if (w) {
      const domande = [["sonno", "Sonno stanotte", ["7 h +", "6-7 h", "5-6 h", "< 5 h"]], ["dolori", "Indolenzimento (muscoli di oggi)", ["nessuno", "leggero", "evidente", "forte"]], ["energia", "Energia", ["buona", "normale", "bassa", "a terra"]]];
      const esito = { ok: "Verde: seduta normale.", giu: "Giallo, giornata no: una serie in meno per esercizio e un RIR in più. I carichi non cambiano.", rosso: "Rosso: giornata no e niente salti. Se la seduta è A o C, meglio B o D oggi." }[S.forma];
      h += `<div class="card"><span class="etich">Come stai oggi? (3 tocchi, facoltativo)</span>
        ${domande.map(([k, t, opz]) => `<div class="tenue3" style="margin-top:8px">${t}</div><div class="rir pront">${opz.map((o, i) => `<button class="${S.pront[k] === i ? "si" : ""}" data-az="pront" data-k="${k}" data-v="${i}">${o}</button>`).join("")}</div>`).join("")}
        <p class="${S.forma === "ok" ? "tenue3" : "avviso"}" style="margin-top:8px">${esito}${S.forma === "rosso" ? " Con febbre o malattia: niente seduta." : ""}</p></div>`;
      h += `<span class="etich">Seduta</span><div class="sedute" style="margin-top:6px">${["A", "B", "C", "D"].map(l =>
        `<button data-az="inizia" data-l="${l}" class="${pr.fatte.includes(l) ? "fatta" : ""} ${pr.scelta === l ? "consigliata" : ""}">${l}<small>${pr.fatte.includes(l) ? "fatta" : esc(P.sedute[l].nome.split(" ")[0])}</small></button>`).join("")}</div>`;
      if (pr.scelta) h += `<button class="btn prim largo" style="margin-top:12px;min-height:56px;font-size:18px" data-az="inizia" data-l="${pr.scelta}">Inizia ${pr.scelta} · ${esc(P.sedute[pr.scelta].nome)}</button>`;
      else h += `<p class="tenue" style="margin-top:12px">Settimana completa. Recupera.</p>`;
      h += `<p style="margin-top:14px"><a href="#" data-az="vai" data-v="settimana">Vedi il piano della settimana</a></p>`;
    }
    const ult = [...S.sedute].filter(s => !s.iniziale).sort((a, b) => (a.data < b.data ? 1 : -1))[0];
    if (ult) h += `<h2>Ultima seduta</h2><pre class="testo">${esc(M.testoSeduta(P, ult))}</pre>`;
    else if (!S.sedute.length) h += `<div class="card"><b>Primo avvio.</b> Inserisci i carichi da cui partire in <a href="#" data-az="vai" data-v="partenza">Altro → Carichi di partenza</a>, oppure importa il file preparato sul Mac in <a href="#" data-az="vai" data-v="altro">Altro → Importa</a>. Puoi anche iniziare subito: dove manca il carico l'app te lo chiede.</div>`;
    vista.innerHTML = h;
  }

  function vSettimana() {
    const d = oggi(), w = M.settimanaDi(P, d);
    let h = `<p><a href="#" data-az="vai" data-v="oggi">← Allenamento</a></p><h1>Piano della settimana</h1>`;
    if (!w) { vista.innerHTML = h + "<p>Fuori programma.</p>"; return; }
    h += `<p class="tenue">Settimana ${w.n} (${dataBreve(w.inizio)}) · ${esc(w.blocco)}${ondaTxt(w)}</p>`;
    h += cartaObiettivi(d, w);
    h += `<div class="card"><b>Giorni consigliati</b><p class="tenue" style="font-size:14px">Bachata il martedì sera, tennis il sabato. Ordine A → B → C (→ D). Mai A e C in giorni consecutivi; niente A o C il venerdì.<br>4 sedute: lun A · mer B · gio C · dom D (oppure ven D leggera).<br>3 sedute: lun A · mer B · gio C (o dom C).<br>Solo 2: C e A. L'app se ne accorge da sola quando i giorni non bastano: B salta, i tricipiti vanno in A (al posto dei polpacci) e le croci inverse in C.</p></div>`;
    for (const l of ["A", "B", "C", "D"]) {
      const p = M.pianoSeduta(P, l, d < w.inizio ? w.inizio : d, S.sedute, {});
      h += `<div class="card"><b>${l} · ${esc(p.nome)}</b>${p.esercizi.map(e => `<div class="tenue" style="font-size:14px">${esc(e.def.nome)}: ${pianoBreve(e)}</div>`).join("")}</div>`;
    }
    vista.innerHTML = h;
  }
  // Verso dicembre: stima di oggi dalla serie migliore delle ultime 3 settimane.
  function cartaObiettivi(d, w) {
    const pr = M.progressoObiettivi(P, S.sedute, d);
    const righe = pr.map(r => {
      const o = r.obiettivo, tr = o.tipo === "trazioni";
      const meta = tr ? `${o.rip}` : `${kg(o.kg)} × ${o.rip}`;
      const ora = r.stima == null ? "nessun dato recente" : tr ? `circa ${r.stima}` : `circa ${kg(r.stima)} × ${o.rip}`;
      const frac = r.stima == null ? 0 : Math.min(1, r.stima / (tr ? o.rip : o.kg));
      return `<div style="margin:8px 0"><div class="fila" style="justify-content:space-between"><b>${esc(o.nome)}</b><span class="tenue3">obiettivo ${meta}</span></div>
        <div style="height:6px;background:var(--pan2);border-radius:3px;margin:4px 0"><div style="height:6px;width:${Math.round(frac * 100)}%;background:${frac >= 1 ? "var(--ok)" : "var(--acc)"};border-radius:3px"></div></div>
        <div class="tenue3">Oggi ${ora}${o.nota ? ` · ${esc(o.nota)}` : ""}</div></div>`;
    }).join("");
    return `<details class="card"><summary><b>Verso dicembre</b> <span class="tenue3">· mancano ${Math.max(0, 16 - w.n)} settimane</span></summary>${righe}<p class="tenue3">Stima dalla tua serie migliore delle ultime 3 settimane (ripetizioni + RIR). È una stima: il numero vero lo dà il test.</p></details>`;
  }
  function pianoBreve(e) {
    const r = e.rip; const uguali = r.every(x => x === r[0]);
    const rip = r[0] == null ? "max" : uguali ? `${r.length} × ${r[0]}` : r.join("/");
    const peso = e.def.tipo === "accessorio" || e.def.tipo === "bilanciere" ? (e.kg == null ? " · carico da trovare" : ` · ${kg(e.kg)} kg`) : "";
    return rip + (e.def.perLato ? " per lato" : "") + peso;
  }

  // ---- crea la bozza della seduta ----
  function voceDaPiano(e, w) {
    const mostraKg = e.def.tipo === "accessorio" || e.def.tipo === "bilanciere";
    const u = e.ultima;
    return {
      id: e.def.id, n: e.def.n, nome: e.def.nome, tipo: e.def.tipo, inc: e.def.tipo === "bilanciere" ? 2.5 : (e.def.inc || 2),
      perLato: !!e.def.perLato, dischiMacchina: !!e.def.dischiMacchina, nota: e.def.nota || "", motivo: e.motivo || "", rir: e.rir, range: e.range,
      ripTarget: e.rip.slice(), kgPiano: e.kg, mostraKg, lift: e.def.tipo === "bilanciere" ? e.def.lift : null, test: !!e.test, kgPrec: kgRipiego(e, w), alPostoDi: e.def.alPostoDi || null, deload: !!(w && (w.deload || w.taper)),
      ultima: u ? `${u.iniziale ? "(partenza)" : dataBreve(u.data)}: ${M.fatte(u).map(s => (s.kg ? kg(s.kg) + "×" : "") + s.rip + (s.rir != null ? ` (${s.rir})` : "")).join(", ")}${u.nome && u.id !== e.def.id ? " · " + u.nome : ""}` : "",
      serie: e.rip.map(r => ({ kg: mostraKg ? e.kg : null, rip: r, rir: null, ok: false })),
      tecnica: false, dolore: false, saltato: false, notaUtente: "", aperto: false
    };
  }
  // squat e stacco: carico dell'ultima seduta pesante, per la prima serie andata storta
  function kgRipiego(e, w) {
    if (e.def.tipo !== "bilanciere" || e.test || e.kg == null || !w) return null;
    const u = M.storia(S.sedute, [e.def.id], oggi()).find(x => !x.deload && x.sett < w.n);
    const k = u ? M.kgDi(u) : null;
    return k != null && k < e.kg ? k : e.kg - (e.kg < 80 ? 2.5 : 5);
  }
  function controlloPrima(v) {
    const s = v.serie[0];
    if (v.controllato || v.kgPrec == null || !s.ok || !v.rir) return;
    const soglia = Math.max(0, v.rir[1] - 2);
    const corta = num(s.rip) != null && num(s.rip) < v.ripTarget[0];
    if (!corta && (s.rir == null || s.rir > soglia)) return;
    if (num(s.kg) <= v.kgPrec) return;
    v.controllato = true;
    for (let j = 1; j < v.serie.length; j++) if (!v.serie[j].ok) v.serie[j].kg = v.kgPrec;
    v.motivo += ` Prima serie più dura del previsto: le altre a ${kg(v.kgPrec)} kg.`;
    toast(`Prima serie più dura del previsto: le altre a ${kg(v.kgPrec)} kg.`);
  }
  function inizia(l, conD) {
    const d = oggi();
    const w = M.settimanaDi(P, d);
    if (!w) return toast("Oggi è fuori dal programma.");
    if (conD == null) conD = S.sedute.some(s => s.seduta === "D" && s.data >= M.lunediDi(d));
    const dueSedute = M.prossimaSeduta(P, S.sedute, d).senzaB && (l === "A" || l === "C");
    const p = M.pianoSeduta(P, l, d, S.sedute, { conD, forma: S.forma, dueSedute });
    S.bozza = { id: uid(), data: d, sett: w.n, seduta: l, conD, dueSedute, forma: S.forma, inizio: Date.now(), nota: "", ordine: [], esercizi: {}, riscaldamento: p.riscaldamento, nome: p.nome };
    for (const e of p.esercizi) { const v = voceDaPiano(e, w); S.bozza.ordine.push(v.id); S.bozza.esercizi[v.id] = v; }
    salvaBozza(); render(); window.scrollTo(0, 0);
  }
  function cambiaConD(conD) {
    const b = S.bozza, w = M.settimanaDi(P, b.data);
    const p = M.pianoSeduta(P, b.seduta, b.data, S.sedute, { conD, forma: b.forma, dueSedute: b.dueSedute });
    const nuovo = [], es = {};
    for (const e of p.esercizi) {
      const vecchio = Object.values(b.esercizi).find(v => v.id === e.def.id || v.alPostoDi === e.def.id);
      const v = vecchio || voceDaPiano(e, w);
      nuovo.push(v.id); es[v.id] = v;
    }
    b.ordine = nuovo; b.esercizi = es; b.conD = conD; salvaBozza(); render();
  }

  // ---- vista seduta ----
  function vSeduta() {
    const b = S.bozza;
    const fatteN = Object.values(b.esercizi).reduce((n, v) => n + v.serie.filter(s => s.ok).length, 0);
    const totN = Object.values(b.esercizi).reduce((n, v) => n + (v.saltato ? 0 : v.serie.length), 0);
    let h = `<div class="fila"><h1 class="cresci">${b.seduta} · ${esc(b.nome)}</h1><span class="pill">${fatteN}/${totN}</span></div>
      <p class="tenue">${dataBreve(b.data)} · settimana ${b.sett}${b.forma === "giu" ? " · giornata no" : b.forma === "rosso" ? " · giornata rossa" : ""}${b.dueSedute ? " · settimana da 2" : ""}${b.modifica ? " · modifica" : ""}</p>
      <details class="card" style="padding:10px 14px"><summary>Riscaldamento</summary><p style="font-size:14px">${esc(b.riscaldamento)}</p></details>`;
    if (b.seduta === "C") h += `<div class="fila" style="margin:6px 0"><span class="tenue cresci" style="font-size:14px">Questa settimana fai anche D?</span>
      <button class="btn piccolo ${b.conD ? "prim" : ""}" data-az="conD" data-v="1">Sì</button><button class="btn piccolo ${!b.conD ? "prim" : ""}" data-az="conD" data-v="0">No</button></div>`;
    for (const id of b.ordine) h += cartaEsercizio(b.esercizi[id]);
    h += `<div class="card"><label class="etich" for="notaSed">Note della seduta</label><textarea id="notaSed" data-campo="notaSeduta" placeholder="Sensazioni, dolori, cose da ricordare">${esc(b.nota)}</textarea></div>
      <button class="btn prim largo" style="min-height:56px;font-size:18px" data-az="fine">Fine seduta</button>
      <div class="fila" style="margin-top:10px"><button class="btn piccolo cresci" data-az="annulla">Annulla seduta</button></div>`;
    vista.innerHTML = h;
  }
  function cartaEsercizio(v) {
    const fatte = v.serie.filter(s => s.ok).length;
    const chiuso = v.saltato || (fatte === v.serie.length && fatte > 0);
    const rir = v.rir ? `RIR ${v.rir[0]}${v.rir[1] !== v.rir[0] ? "-" + v.rir[1] : ""}` : "";
    const rip = v.ripTarget.every(x => x === v.ripTarget[0]) ? `${v.ripTarget.length} × ${v.ripTarget[0] ?? "max"}` : v.ripTarget.join("/");
    const peso = v.mostraKg ? (v.kgPiano == null ? " · carico ?" : ` @ ${kg(v.kgPiano)} kg${v.dischiMacchina ? ` (${kg(v.kgPiano / 2)} per lato)` : ""}`) : "";
    let h = `<div class="card es ${chiuso ? "chiuso" : ""}" id="es-${esc(v.id)}">
      <div class="es-testa"><span class="es-num">${esc(v.n || "")}</span><span class="es-nome">${esc(v.nome)}${v.perLato ? ' <small class="tenue3">per lato</small>' : ""}</span></div>
      <div class="es-piano">${v.test ? '<span class="pill">test</span> ' : ""}${rip}${peso}${rir ? " · " + rir : ""}</div>`;
    if (v.alPostoDi) h += `<div class="es-motivo">Al posto di ${esc(nomeDi(v.alPostoDi))}.</div>`;
    if (v.motivo) h += `<div class="es-motivo">${esc(v.motivo)}</div>`;
    if (v.ultima) h += `<div class="es-ultima">Ultima volta ${esc(v.ultima)}</div>`;
    if (v.lift) {
      const kl = v.serie[0].kg ?? v.kgPiano, av = M.avvicinamento(kl, v.lift, v.test), ds = M.dischi(kl);
      if (av.length) h += `<details class="es-avv"><summary>Avvicinamento${ds ? ` · per lato a ${kg(kl)}: ${ds.length ? ds.map(kg).join(" + ") : "solo bilanciere"}` : ""}</summary>${av.map(x => `${kg(x.kg)}×${x.rip}`).join(" · ")}<br><span class="tenue3">Recupero breve tra queste, 2-3 minuti prima della prima serie di lavoro. Bilanciere da 20 kg.</span></details>`;
    }
    if (v.saltato) {
      h += `<div class="es-azioni"><button class="btn" data-az="salta" data-id="${esc(v.id)}">Riprendi esercizio</button></div></div>`;
      return h;
    }
    v.serie.forEach((s, i) => {
      h += `<div class="serie ${s.ok ? "fatta" : ""}"><span class="n">${i + 1}</span>`;
      if (v.mostraKg) h += passo(v.id, i, "kg", s.kg, "kg");
      else h += `<span class="tenue3" style="align-self:center;text-align:center">${v.tipo === "trazioni" ? "corpo libero" : v.tipo === "salti" ? "esplosivi" : ""}</span>`;
      h += passo(v.id, i, "rip", s.rip, "rip");
      h += `<button class="ok ${s.ok ? "si" : ""}" data-az="ok" data-id="${esc(v.id)}" data-i="${i}" aria-label="Conferma serie ${i + 1}">✓</button>`;
      if (s.ok && v.tipo !== "salti") h += `<div class="rir"><span>RIR</span>${[0, 1, 2, 3, 4].map(r => `<button class="${s.rir === r ? "si" : ""}" data-az="rir" data-id="${esc(v.id)}" data-i="${i}" data-v="${r}">${r === 4 ? "4+" : r}</button>`).join("")}</div>`;
      h += `</div>`;
    });
    const alt = altPer(v);
    h += `<div class="es-azioni">
      <button class="btn" data-az="piuSerie" data-id="${esc(v.id)}">+ serie</button>
      ${v.serie.length > 1 ? `<button class="btn" data-az="menoSerie" data-id="${esc(v.id)}">− serie</button>` : ""}
      ${v.tipo === "bilanciere" || v.tipo === "trazioni" ? `<button class="btn ${v.tecnica ? "attivo" : ""}" data-az="tecnica" data-id="${esc(v.id)}">${v.tipo === "trazioni" ? "ROM peggiorato" : "Tecnica peggiorata"}</button>` : ""}
      ${v.tipo === "bilanciere" ? `<button class="btn ${v.dolore ? "attivo" : ""}" data-az="dolore" data-id="${esc(v.id)}">Dolore</button>` : ""}
      ${alt.length || v.alPostoDi ? `<button class="btn" data-az="cambia" data-id="${esc(v.id)}">Cambia</button>` : ""}
      <button class="btn" data-az="salta" data-id="${esc(v.id)}">Salta</button>
      <button class="btn" data-az="info" data-id="${esc(v.id)}">Info</button></div>`;
    if (S.sotto && S.sotto.id === v.id) h += sottopannello(v, alt);
    h += `</div>`;
    return h;
  }
  function passo(id, i, campo, val, u) {
    const vuoto = val == null || val === "";
    return `<div class="passo ${vuoto ? "vuoto" : ""}"><button data-az="passo" data-id="${esc(id)}" data-i="${i}" data-c="${campo}" data-d="-1" aria-label="meno">−</button>
      <input inputmode="decimal" data-campo="serie" data-id="${esc(id)}" data-i="${i}" data-c="${campo}" value="${vuoto ? "" : esc(campo === "kg" ? kg(val) : val)}" placeholder="?" aria-label="${u}">
      <span class="u">${u}</span><button data-az="passo" data-id="${esc(id)}" data-i="${i}" data-c="${campo}" data-d="1" aria-label="più">+</button></div>`;
  }
  function nomeDi(id) {
    for (const l of Object.keys(P.sedute)) { const e = P.sedute[l].esercizi.find(x => x.id === id); if (e) return e.nome; }
    return id;
  }
  function defDi(id) {
    for (const l of Object.keys(P.sedute)) { const e = P.sedute[l].esercizi.find(x => x.id === id); if (e) return e; }
    return null;
  }
  function ondaTxt(w) { return w.onda === "F" ? " · panca pesante" : w.onda === "I" ? " · panca 8-10" : ""; }
  function altPer(v) { return S.alternative[v.alPostoDi || v.id] || []; }
  function sottopannello(v, alt) {
    if (S.sotto.tipo === "info") {
      const d = defDi(v.alPostoDi || v.id);
      return `<div class="card" style="margin:10px 0 0;background:var(--pan2)">
        ${v.nota ? `<p style="font-size:14px">${esc(v.nota)}</p>` : ""}
        ${d && d.nota && v.alPostoDi ? `<p class="tenue3">Originale: ${esc(d.nota)}</p>` : ""}
        <label class="etich">Nota per questo esercizio</label>
        <input data-campo="notaEs" data-id="${esc(v.id)}" value="${esc(v.notaUtente)}" placeholder="es. macchina 3, sedile 4">
        <div class="fila" style="margin-top:8px"><button class="btn piccolo" data-az="chiediCoach" data-id="${esc(v.id)}">Chiedi al coach come si fa</button></div></div>`;
    }
    let h = `<div class="card" style="margin:10px 0 0;background:var(--pan2)"><b style="font-size:14px">Cambia esercizio solo per oggi</b>`;
    if (v.alPostoDi) h += `<button class="btn piccolo largo" style="margin-top:8px" data-az="scegliAlt" data-id="${esc(v.id)}" data-alt="">Torna a ${esc(nomeDi(v.alPostoDi))}</button>`;
    for (const a of alt) {
      if (a.id === v.id) continue;
      h += `<button class="btn piccolo largo" style="margin-top:8px;justify-content:flex-start;text-align:left;min-height:48px" data-az="scegliAlt" data-id="${esc(v.id)}" data-alt="${esc(a.id)}">
        <span><b>${esc(a.nome)}</b>${a.quando === "dolore" ? " · se fa male" : a.quando === "occupato" ? " · se occupato" : ""}<br><small>${esc(a.nota || "")}</small></span></button>`;
    }
    h += `<div class="fila" style="margin-top:8px"><input class="cresci" id="altLibero" placeholder="Altro esercizio (scrivi il nome)" style="flex:1"><button class="btn piccolo" data-az="altLibero" data-id="${esc(v.id)}">Usa</button></div></div>`;
    return h;
  }
  function scegliAlternativa(idVoce, altId, nomeLibero) {
    const b = S.bozza, v = b.esercizi[idVoce];
    const origId = v.alPostoDi || v.id;
    const defO = defDi(origId) || { id: origId, nome: v.nome, tipo: "accessorio", inc: v.inc || 2.5, serie: v.serie.length, range: v.range || [8, 12] };
    const w = M.settimanaDi(P, b.data);
    let nv;
    if (!altId && !nomeLibero) {
      const p = M.pianoSeduta(P, b.seduta, b.data, S.sedute, { conD: b.conD, forma: b.forma, dueSedute: b.dueSedute });
      const e = p.esercizi.find(x => x.def.id === origId);
      nv = voceDaPiano(e, w);
    } else {
      const alt = nomeLibero
        ? { id: "alt.libero." + nomeLibero.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "_").slice(0, 30), nome: nomeLibero, inc: defO.inc || 2.5, nota: "" }
        : altPer(v).find(a => a.id === altId);
      if (!alt) return;
      const e = M.pianoAlternativa(P, defO, alt, b.data, S.sedute, b.data);
      const pOrig = M.adattaForma({ settimana: w, esercizi: [e] }, b.forma).esercizi[0];
      const u = M.storia(S.sedute, [alt.id], b.data)[0];
      nv = voceDaPiano(Object.assign(pOrig, { ultima: u || null }), w);
      nv.alPostoDi = origId;
      nv.mostraKg = true;
      nv.serie.forEach(s => { s.kg = e.kg; });
    }
    const i = b.ordine.indexOf(idVoce);
    delete b.esercizi[idVoce];
    b.ordine[i] = nv.id; b.esercizi[nv.id] = nv;
    S.sotto = null; salvaBozza(); render();
    const el = document.getElementById("es-" + nv.id); el && el.scrollIntoView({ block: "start" });
  }

  async function fineSeduta() {
    const b = S.bozza;
    const nonConf = Object.values(b.esercizi).reduce((n, v) => n + (v.saltato ? 0 : v.serie.filter(s => !s.ok).length), 0);
    if (nonConf && !confirm(`${nonConf} serie non confermate: verranno ignorate. Chiudo la seduta?`)) return;
    const rec = { id: b.id, data: b.data, sett: b.sett, seduta: b.seduta, conD: b.conD, dueSedute: b.dueSedute || undefined, forma: b.forma, nota: b.nota, durataMin: b.modifica ? b.durataMin : Math.round((Date.now() - b.inizio) / 60000), esercizi: {} };
    for (const id of b.ordine) {
      const v = b.esercizi[id];
      const serie = v.serie.filter(s => s.ok).map(s => ({ kg: v.mostraKg ? num(s.kg) : null, rip: num(s.rip), rir: s.rir }));
      if (!serie.length && !v.saltato) continue;
      rec.esercizi[id] = { nome: v.nome, range: v.range, ripTarget: v.ripTarget, kgPiano: v.kgPiano, deload: v.deload, tecnica: v.tecnica, dolore: v.dolore || undefined, saltato: v.saltato, nota: v.notaUtente || undefined, alPostoDi: v.alPostoDi || undefined, test: v.test || undefined, serie };
    }
    await DB.metti("sedute", rec);
    S.sedute = S.sedute.filter(s => s.id !== rec.id).concat(rec);
    S.bozza = null; await DB.kvMetti("bozza", null);
    S.riepilogo = rec.id; S.forma = "ok"; S.pront = {};
    vibra(); render(); window.scrollTo(0, 0);
  }
  function vRiepilogo() {
    const s = S.sedute.find(x => x.id === S.riepilogo);
    if (!s) { S.riepilogo = null; return vOggi(); }
    const t = M.testoSeduta(P, s);
    vista.innerHTML = `<h1>Seduta salvata ✓</h1><p class="tenue">${s.durataMin ? s.durataMin + " minuti · " : ""}come sul taccuino:</p>
      <pre class="testo">${esc(t)}</pre>
      <div class="fila"><button class="btn cresci" data-az="copia">Copia</button><button class="btn cresci" data-az="condividiTesto">Condividi</button></div>
      <button class="btn prim largo" style="margin-top:10px" data-az="esporta">Backup su Drive</button>
      <button class="btn largo" style="margin-top:10px" data-az="chiudiRiepilogo">Fatto</button>`;
  }

  // ================= CORPO =================
  // Vita ogni settimana; le altre ogni 4 settimane con le foto (errore di misura 0,5-1 cm).
  const MISURE = [
    ["vita", "Vita all'ombelico", "All'altezza dell'ombelico, a fine espirazione normale, pancia rilassata (non tirarla dentro)."],
    ["spalle", "Spalle", "Nel punto più largo dei deltoidi, braccia rilassate lungo i fianchi. Meglio con un aiuto o davanti allo specchio."],
    ["petto", "Petto", "All'altezza dei capezzoli, sotto le ascelle, a metà espirazione."],
    ["braccio", "Braccio dx", "A metà tra la punta della spalla e la punta del gomito, braccio rilassato lungo il fianco."],
    ["coscia", "Coscia dx", "A metà tra la piega dell'inguine e la rotula, in piedi, peso su entrambe le gambe."]];
  const POSE = [["fronte", "Fronte"], ["lato", "Lato"], ["retro", "Retro"]];
  function vCorpo() {
    const d = S.corpoData || oggi();
    const e = S.corpo.find(x => x.id === d) || { id: d, data: d, misure: {}, foto: {} };
    let h = `<h1>Corpo</h1><div class="card">
      <div class="fila"><input type="date" value="${d}" data-campo="corpoData" style="max-width:180px"><span class="tenue3 cresci">Pesati al mattino, dopo il bagno, prima di mangiare.</span></div>
      <div class="griglia2" style="margin-top:10px">
        <div class="campo"><label>Peso (kg)</label><input inputmode="decimal" data-campo="corpo" data-k="peso" value="${esc(e.peso != null ? kg(e.peso) : "")}"></div>
        ${MISURE.map(([k, t]) => `<div class="campo"><label>${t} (cm)</label><input inputmode="decimal" data-campo="corpo" data-k="${k}" value="${esc(e.misure && e.misure[k] != null ? kg(e.misure[k]) : "")}"></div>`).join("")}
      </div>
      <p class="tenue3">Vita una volta a settimana, insieme al peso. Le altre misure e le foto ogni 4 settimane, stesso giorno: al mattino, a digiuno, prima dell'allenamento (mai dopo: il pump gonfia). Lascia vuoto quello che non misuri.</p>
      <details class="tenue3" style="margin-top:4px"><summary>Come misurare</summary><p>Metro da sarta non elastico, aderente senza schiacciare la pelle, parallelo al pavimento. Due misure e la media; se differiscono di oltre mezzo centimetro, una terza.</p><ul>${MISURE.map(([, t, c]) => `<li><b>${t}</b>: ${c}</li>`).join("")}</ul><p>Senza metro: un cordino non elastico, segna il punto con le dita e misuralo su un righello. Va bene, purché sempre nello stesso modo.</p></details>
      <div class="foto3" style="margin-top:8px">${POSE.map(([k, t]) => `<label class="foto-slot" ${e.foto && e.foto[k] ? `data-foto="${esc(e.foto[k])}"` : ""}><span>${t}</span><input type="file" accept="image/*" data-campo="fotoCorpo" data-k="${k}"></label>`).join("")}</div>
      <div class="campo" style="margin-top:8px"><label>Nota</label><input data-campo="corpo" data-k="nota" value="${esc(e.nota || "")}" placeholder="es. cena salata ieri"></div>
    </div>`;
    h += graficoPeso();
    h += tabellaSettimane();
    h += tabellaMisure();
    const conFoto = S.corpo.filter(x => x.foto && Object.keys(x.foto).length).sort((a, b) => (a.data < b.data ? -1 : 1));
    if (conFoto.length >= 1) {
      const a = S.confrontoA || conFoto[0].id, b = S.confrontoB || conFoto[conFoto.length - 1].id;
      const ea = S.corpo.find(x => x.id === a) || conFoto[0], eb = S.corpo.find(x => x.id === b) || conFoto[conFoto.length - 1];
      const opz = sel => conFoto.map(x => `<option value="${x.id}" ${x.id === sel ? "selected" : ""}>${dataBreve(x.data)}</option>`).join("");
      h += `<h2>Confronta le foto</h2><div class="card"><div class="griglia2"><select data-campo="confronto" data-k="A">${opz(ea.id)}</select><select data-campo="confronto" data-k="B">${opz(eb.id)}</select></div>
        ${POSE.map(([k, t]) => (ea.foto[k] || eb.foto[k]) ? `<p class="tenue3" style="margin-top:8px">${t}</p><div class="confronto">${[ea, eb].map(x => x.foto[k] ? `<img data-foto="${esc(x.foto[k])}" alt="${t} ${x.data}">` : `<div class="foto-slot"><span>manca</span></div>`).join("")}</div>` : "").join("")}
        <button class="btn piccolo largo" style="margin-top:10px" data-az="coachFoto" data-a="${ea.id}" data-b="${eb.id}">Chiedi al coach un confronto</button></div>`;
    }
    vista.innerHTML = h;
    riempiFoto(vista);
  }
  function serieSettimanali() {
    const pesi = S.corpo.filter(x => x.peso != null).sort((a, b) => (a.data < b.data ? -1 : 1));
    const per = new Map();
    for (const p of pesi) { const l = M.lunediDi(p.data); if (!per.has(l)) per.set(l, []); per.get(l).push(p.peso); }
    return [...per].map(([l, v]) => ({ l, media: v.reduce((a, b) => a + b, 0) / v.length, n: v.length }));
  }
  function graficoPeso() {
    const pesi = S.corpo.filter(x => x.peso != null).sort((a, b) => (a.data < b.data ? -1 : 1)).slice(-90);
    if (pesi.length < 2) return pesi.length ? `<p class="tenue">Un peso registrato: il grafico appare dal secondo.</p>` : "";
    const t0 = Date.parse(pesi[0].data), t1 = Date.parse(pesi[pesi.length - 1].data) || t0 + 1;
    const vals = pesi.map(p => p.peso), lo = Math.min(...vals) - 0.5, hi = Math.max(...vals) + 0.5;
    const W = 340, H = 150, x = d => 8 + (W - 16) * (Date.parse(d) - t0) / Math.max(1, t1 - t0), y = v => 8 + (H - 24) * (1 - (v - lo) / (hi - lo));
    const media = pesi.map((p, i) => {
      const fin = pesi.filter(q => q.data <= p.data && M.giorni(q.data, p.data) < 7);
      return { d: p.data, v: fin.reduce((a, b) => a + b.peso, 0) / fin.length };
    });
    const pts = pesi.map(p => `<circle cx="${x(p.data).toFixed(1)}" cy="${y(p.peso).toFixed(1)}" r="2.5" fill="var(--tx3)"/>`).join("");
    const linea = media.map((m, i) => `${i ? "L" : "M"}${x(m.d).toFixed(1)},${y(m.v).toFixed(1)}`).join(" ");
    const ult = media[media.length - 1];
    return `<h2>Peso</h2><div class="card grafico"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Andamento del peso">
      <text x="8" y="${H - 2}" font-size="10" fill="var(--tx3)">${dataBreve(pesi[0].data)}</text>
      <text x="${W - 8}" y="${H - 2}" font-size="10" fill="var(--tx3)" text-anchor="end">${dataBreve(pesi[pesi.length - 1].data)}</text>
      <text x="${W - 8}" y="14" font-size="10" fill="var(--tx3)" text-anchor="end">${kg(hi - 0.5)} kg</text>
      ${pts}<path d="${linea}" fill="none" stroke="var(--acc)" stroke-width="2.5"/></svg>
      <p class="tenue3">Punti = pesate; linea = media degli ultimi 7 giorni (${kg(+ult.v.toFixed(1))} kg). Conta la linea, non il singolo giorno.</p></div>`;
  }
  function tabellaSettimane() {
    const s = serieSettimanali().slice(-8);
    if (s.length < 2) return "";
    return `<div class="card"><table><tr><th>Settimana</th><th class="num">Media</th><th class="num">Diff.</th><th class="num">Pesate</th></tr>
      ${s.map((r, i) => `<tr><td>${dataBreve(r.l)}</td><td class="num">${kg(+r.media.toFixed(1))}</td><td class="num">${i ? ((r.media - s[i - 1].media) >= 0 ? "+" : "") + kg(+(r.media - s[i - 1].media).toFixed(1)) : ""}</td><td class="num">${r.n}</td></tr>`).join("")}</table></div>`;
  }
  function tabellaMisure() {
    const r = S.corpo.filter(x => x.misure && Object.values(x.misure).some(v => v != null)).sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 6);
    if (!r.length) return "";
    const usate = MISURE.filter(([k]) => r.some(x => x.misure[k] != null));
    return `<h2>Misure (cm)</h2><div class="card" style="overflow-x:auto"><table><tr><th>Data</th>${usate.map(([k, t]) => `<th class="num">${t.split(" ")[0]}</th>`).join("")}</tr>
      ${r.map(x => `<tr><td>${dataBreve(x.data)}</td>${usate.map(([k]) => `<td class="num">${x.misure[k] != null ? kg(x.misure[k]) : ""}</td>`).join("")}</tr>`).join("")}</table></div>`;
  }
  async function salvaCorpo(d, modifica) {
    const e = S.corpo.find(x => x.id === d) || { id: d, data: d, misure: {}, foto: {} };
    modifica(e);
    await DB.metti("corpo", e);
    S.corpo = S.corpo.filter(x => x.id !== d).concat(e);
  }

  // ================= COACH =================
  const CHIP = [
    ["Come si esegue…", () => { const v = S.bozza && S.bozza.ordine.map(i => S.bozza.esercizi[i]).find(x => !x.saltato && x.serie.some(s => !s.ok)); return `Come si esegue bene ${v ? v.nome : "[esercizio]"}? Errori da evitare e come capire il RIR.`; }],
    ["Macchina occupata", () => "La macchina per [esercizio] è occupata: con cosa la sostituisco oggi e con che carico parto?"],
    ["Mi fa male…", () => "Durante [esercizio] sento dolore a [dove], intensità [0-10]/10, tipo [acuto/sordo]. Cosa faccio oggi?"],
    ["Com'è andata la settimana?", () => "Guarda le ultime sedute: cosa sta andando bene, cosa è fermo e cosa cambieresti la prossima settimana?"],
    ["Peso e misure", () => "Analizza l'andamento di peso e misure: sto andando nella direzione giusta per il mio obiettivo? Cosa aggiusto con l'alimentazione?"],
    ["Rivedi il programma", () => "Rivedi il programma dei prossimi blocchi alla luce dei miei dati: cosa cambieresti e perché? Indica modifiche concrete."]
  ];
  function vCoach() {
    let h = `<div class="fila"><h1 class="cresci">Coach</h1>${S.chat.length ? `<button class="btn piccolo" data-az="nuovaChat">Nuova chat</button>` : ""}</div>`;
    if (!S.imp.chiave) h += `<div class="avviso">Senza chiave Gemini puoi comunque usare <b>Manda all'app Gemini</b> (testo + dati copiati). Per le risposte qui dentro: <a href="#" data-az="vai" data-v="assistente">Altro → Assistente</a>.</div>`;
    h += `<div class="chat" id="chat">`;
    if (!S.chat.length) h += `<p class="tenue">Chiedi di esercizi, dolori, alternative, peso, misure e foto. Il coach vede il programma, le ultime sedute e i dati del corpo.</p>`;
    for (const m of S.chat) h += bolla(m);
    if (S.inCorso) h += `<div class="msg model" id="inCorso">${S.inCorso.testo ? md(S.inCorso.testo) : "<span class='tenue'>Sto pensando…</span>"}</div>`;
    h += `</div><div class="compositore"><div class="interno">
      <div class="chips">${CHIP.map(([t], i) => `<button data-az="chip" data-i="${i}">${t}</button>`).join("")}<button data-az="allegaCorpo">+ foto fisico</button></div>
      ${S.allegati.length ? `<div class="allegati">${S.allegati.map((a, i) => `<img data-foto="${esc(a)}" data-az="togliAllegato" data-i="${i}" alt="allegato">`).join("")}</div>` : ""}
      <div class="fila" style="flex-wrap:nowrap;margin-top:6px">
        <label class="btn" style="min-width:48px;padding:0;position:relative" aria-label="Allega foto">📷<input type="file" accept="image/*" data-campo="allegaFoto" style="position:absolute;inset:0;opacity:0"></label>
        <textarea id="domanda" rows="1" placeholder="Scrivi…" style="flex:1">${esc(S.bozzaDomanda || "")}</textarea>
        <button class="btn prim" data-az="invia" ${S.inCorso ? "disabled" : ""}>${S.imp.chiave ? "Invia" : "Gemini"}</button>
      </div>
      ${S.imp.chiave ? `<div style="text-align:right"><a href="#" class="tenue3" data-az="mandaApp">Manda all'app Gemini</a></div>` : ""}
    </div></div>`;
    vista.innerHTML = h;
    riempiFoto(vista);
    S.ctxPronto = contesto().catch(() => "");
    const t = $("#domanda"); if (t && t.value) t.style.height = Math.min(140, t.scrollHeight) + "px";
    const c = $("#chat"); if (c) window.scrollTo(0, document.body.scrollHeight);
  }
  function bolla(m) {
    return `<div class="msg ${m.ruolo === "user" ? "user" : "model"}">${(m.foto || []).map(f => `<img data-foto="${esc(f)}" alt="foto">`).join("")}${m.ruolo === "model" ? md(m.testo) : esc(m.testo).replace(/\n/g, "<br>")}${m.errore ? `<div class="avviso errore">${esc(m.errore)}</div>` : ""}</div>`;
  }
  function md(t) {
    const righe = esc(t).split("\n");
    let h = "", lista = null;
    const inl = s => s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<i>$2</i>").replace(/`(.+?)`/g, "<code>$1</code>");
    for (const r of righe) {
      const ul = r.match(/^\s*[-*•]\s+(.*)/), ol = r.match(/^\s*\d+[.)]\s+(.*)/), hd = r.match(/^#{1,4}\s+(.*)/);
      if (ul || ol) {
        const tipo = ul ? "ul" : "ol";
        if (lista !== tipo) { if (lista) h += `</${lista}>`; h += `<${tipo}>`; lista = tipo; }
        h += `<li>${inl((ul || ol)[1])}</li>`; continue;
      }
      if (lista) { h += `</${lista}>`; lista = null; }
      if (hd) h += `<h3>${inl(hd[1])}</h3>`;
      else if (r.trim()) h += `<p>${inl(r)}</p>`;
    }
    if (lista) h += `</${lista}>`;
    return h;
  }

  async function caricaSapere() {
    if (S.sapere) return S.sapere;
    try { S.sapere = await (await fetch("sapere.md")).text(); } catch (_) { S.sapere = ""; }
    return S.sapere;
  }
  // Il contesto che il coach vede: conoscenze generali + profilo + dati recenti.
  async function contesto() {
    const d = oggi(), w = M.settimanaDi(P, d);
    const pr = M.prossimaSeduta(P, S.sedute, d);
    const parti = [];
    parti.push(await caricaSapere());
    if (S.imp.profilo) parti.push("# Profilo dell'utente (privato)\n" + S.imp.profilo);
    let st = `# Situazione al ${d} (${dataBreve(d)})\n`;
    if (w) st += `Settimana ${w.n} di 16, blocco ${w.blocco}${w.onda ? (w.onda === "F" ? " (settimana di forza: in B panca manubri pesante 4×5-6 per prima)" : " (settimana di ipertrofia: panca 8-10)") : ""}, RIR previsto ${w.rir.join("-")}, range accessori multiarticolari ${w.acc.join("-")}. ${w.nota || ""}\n`;
    st += `Sedute fatte questa settimana: ${pr.fatte.join(", ") || "nessuna"}. Prossima consigliata: ${pr.scelta || "nessuna"}. ${pr.avvisi.join(" ")}\n`;
    if (S.bozza) st += `\n## Seduta in corso (${S.bozza.seduta})\n` + S.bozza.ordine.map(id => {
      const v = S.bozza.esercizi[id];
      const f = v.serie.filter(s => s.ok).map(s => (s.kg ? kg(s.kg) + "×" : "") + s.rip + (s.rir != null ? ` (${s.rir})` : "")).join(", ");
      return `- ${v.nome}: piano ${v.ripTarget.join("/")}${v.kgPiano != null ? " @ " + kg(v.kgPiano) + " kg" : ""}; fatto: ${f || "niente"}${v.saltato ? " (saltato)" : ""}`;
    }).join("\n") + "\n";
    else if (w && pr.scelta) {
      const p = M.pianoSeduta(P, pr.scelta, d, S.sedute, {});
      st += `\n## Piano della prossima seduta (${pr.scelta})\n` + p.esercizi.map(e => `- ${e.def.nome}: ${pianoBreve(e)} — ${e.motivo}`).join("\n") + "\n";
    }
    const recenti = S.sedute.filter(s => M.giorni(s.data, d) <= 28).sort((a, b) => (a.data < b.data ? -1 : 1));
    st += `\n## Sedute delle ultime 4 settimane (formato: kg×ripetizioni (RIR))\n` + (recenti.map(s => M.testoSeduta(P, s) + (s.forma === "giu" ? "\n(giornata no)" : s.forma === "rosso" ? "\n(giornata rossa: dormito male, indolenzito o senza energia)" : "")).join("\n\n") || "nessuna") + "\n";
    const pob = M.progressoObiettivi(P, S.sedute, d);
    st += `\n## Obiettivi di dicembre: stima di oggi (serie migliore delle ultime 3 settimane)\n` + pob.map(r => `- ${r.nome}: obiettivo ${r.obiettivo.tipo === "trazioni" ? r.obiettivo.rip : kg(r.obiettivo.kg) + " × " + r.obiettivo.rip}; oggi ${r.stima == null ? "nessun dato" : r.obiettivo.tipo === "trazioni" ? "circa " + r.stima : "circa " + kg(r.stima) + " × " + r.obiettivo.rip}`).join("\n") + "\n";
    const sett = serieSettimanali().slice(-10);
    if (sett.length) st += `\n## Peso: media settimanale\n` + sett.map(r => `${r.l}: ${r.media.toFixed(1)} kg (${r.n} pesate)`).join("\n") + "\n";
    const mis = S.corpo.filter(x => x.misure && Object.values(x.misure).some(v => v != null)).sort((a, b) => (a.data < b.data ? -1 : 1)).slice(-6);
    if (mis.length) st += `\n## Misure (cm)\n` + mis.map(x => `${x.data}: ` + MISURE.filter(([k]) => x.misure[k] != null).map(([k, t]) => `${t} ${x.misure[k]}`).join(", ")).join("\n") + "\n";
    const note = S.corpo.filter(x => x.nota).slice(-5);
    if (note.length) st += note.map(x => `Nota ${x.data}: ${x.nota}`).join("\n") + "\n";
    const fotoDate = S.corpo.filter(x => x.foto && Object.keys(x.foto).length).map(x => x.data);
    st += `\nFoto del fisico salvate nelle date: ${fotoDate.join(", ") || "nessuna"} (le vedi solo se allegate al messaggio).\n`;
    st += `\n## Programma\nIl motore dell'app calcola i carichi con regole fisse (vedi sopra). Se proponi modifiche al programma, scrivile come elenco di cambi concreti (esercizio, serie, ripetizioni, carico, da quale settimana): l'utente le passerà al Mac per aggiornare programma.js.\n`;
    st += P.settimane.map(s => `Sett. ${s.n} (${s.inizio}) ${s.blocco}${s.onda ? " " + s.onda : ""}: squat ${Array.isArray(s.squat) ? s.squat[0] + "×" + s.squat[1] + " @ " + (P.base.squat + s.squat[2]) : s.squat}, stacco ${Array.isArray(s.stacco) ? s.stacco[0] + "×" + s.stacco[1] + " @ " + (P.base.stacco + s.stacco[2]) : s.stacco}, trazioni ${Array.isArray(s.traz) ? s.traz.join("×") : s.traz}`).join("\n");
    parti.push(st);
    return parti.filter(Boolean).join("\n\n---\n\n");
  }

  async function invia() {
    const ta = $("#domanda");
    const testo = (ta && ta.value.trim()) || "";
    if (!testo && !S.allegati.length) return toast("Scrivi una domanda.");
    if (!S.imp.chiave) return mandaApp();
    const msg = { id: uid(), ts: Date.now(), ruolo: "user", testo, foto: S.allegati.slice() };
    S.chat.push(msg); await DB.metti("chat", msg);
    S.allegati = []; S.bozzaDomanda = "";
    S.inCorso = { testo: "" }; S.ctrl = new AbortController(); render();
    try {
      const storia = S.chat.slice(-12);
      const messaggi = [];
      for (let i = 0; i < storia.length; i++) {
        const m = storia[i];
        const ultimo = i === storia.length - 1;
        const immagini = [];
        if (ultimo) for (const f of m.foto || []) { const r = await DB.prendi("foto", f); if (r) immagini.push(r.blob); }
        messaggi.push({ ruolo: m.ruolo, testo: m.testo + (!ultimo && m.foto && m.foto.length ? `\n[${m.foto.length} foto allegate a questo messaggio]` : ""), immagini });
      }
      const sistema = await contesto();
      const { testo: risposta } = await A.invia({
        chiave: S.imp.chiave, modello: S.imp.modello || IMP0.modello, sistema, messaggi, signal: S.ctrl.signal,
        onTesto: t => { S.inCorso.testo = t; const el = $("#inCorso"); if (el) { el.innerHTML = md(t); } }
      });
      const r = { id: uid(), ts: Date.now(), ruolo: "model", testo: risposta };
      S.chat.push(r); await DB.metti("chat", r);
    } catch (e) {
      const r = { id: uid(), ts: Date.now(), ruolo: "model", testo: S.inCorso.testo || "", errore: e.name === "AbortError" ? "Interrotto." : (e.message || String(e)) + (navigator.onLine ? "" : " (sei offline)") };
      S.chat.push(r); await DB.metti("chat", r);
    }
    S.inCorso = null; render();
  }
  async function mandaApp() {
    const ta = $("#domanda");
    const domanda = (ta && ta.value.trim()) || "";
    const ctx = await (S.ctxPronto || contesto());
    const testo = `${ctx}\n\n---\n\n# Domanda\n${domanda || "(scrivi qui la domanda)"}\n\nRispondi in italiano, breve e pratico.`;
    const files = [];
    for (const f of S.allegati) { const r = await DB.prendi("foto", f); if (r) files.push(new File([r.blob], `foto-${f}.jpg`, { type: "image/jpeg" })); }
    try {
      if (files.length && navigator.canShare && navigator.canShare({ files })) {
        // con dei file Android scarta il testo: lo metto negli appunti e condivido le foto
        try { await navigator.clipboard.writeText(testo); } catch (_) {}
        toast("Testo copiato: nell'app Gemini incollalo insieme alle foto.", 4000);
        await navigator.share({ files });
        return;
      }
      if (navigator.share) { await navigator.share({ text: testo }); return; }
    } catch (e) { if (e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(testo); toast("Copiato: incollalo nell'app Gemini."); } catch (_) { toast("Condivisione non disponibile."); }
  }

  // ================= ALTRO =================
  function vAltro() {
    vista.innerHTML = `<h1>Altro</h1>
      <div class="card"><b>Backup</b><p class="tenue" style="font-size:14px">I dati stanno solo su questo telefono. Il backup crea un file con sedute, corpo, foto e chat: salvalo su Drive in Assistenti/Palestra/Registro (così lo legge anche il coach sul Mac).
      ${S.imp.ultimoBackup ? `Ultimo: ${dataBreve(S.imp.ultimoBackup)}.` : "Mai fatto."}</p>
      <div class="fila"><button class="btn prim cresci" data-az="esporta">Esporta</button><button class="btn cresci" data-az="esporta" data-v="file">Scarica file</button><label class="btn cresci" style="position:relative">Importa<input type="file" accept=".json,.txt,application/json,text/plain" data-campo="importa" style="position:absolute;inset:0;opacity:0"></label></div></div>
      <button class="btn largo" style="margin-top:8px" data-az="vai" data-v="storico">Storico sedute (${S.sedute.filter(s => !s.iniziale).length})</button>
      <button class="btn largo" style="margin-top:8px" data-az="vai" data-v="partenza">Carichi di partenza</button>
      <button class="btn largo" style="margin-top:8px" data-az="vai" data-v="assistente">Assistente (Gemini)</button>
      <button class="btn largo" style="margin-top:8px" data-az="vai" data-v="aiuto">Niente distrazioni: blocca l'app sullo schermo</button>
      <div class="card"><b>Tema</b><div class="fila" style="margin-top:8px">${[["auto", "Automatico"], ["scuro", "Scuro"], ["chiaro", "Chiaro"]].map(([k, t]) => `<button class="btn piccolo cresci ${S.imp.tema === k ? "prim" : ""}" data-az="tema" data-v="${k}">${t}</button>`).join("")}</div></div>
      <p class="tenue3">Programma versione ${esc(P.versione)} · i dati non lasciano il telefono, tranne i messaggi al coach (vanno a Google) e i backup che condividi tu.</p>`;
  }
  function vStorico() {
    const s = [...S.sedute].filter(x => !x.iniziale).sort((a, b) => (a.data < b.data ? 1 : -1));
    vista.innerHTML = `<p><a href="#" data-az="vai" data-v="altro">← Altro</a></p><h1>Storico sedute</h1>` + (s.length ? s.map(x => `<div class="card"><pre class="testo" style="margin:0">${esc(M.testoSeduta(P, x))}</pre>
      <div class="fila" style="margin-top:8px"><button class="btn piccolo" data-az="modificaSed" data-id="${esc(x.id)}">Modifica</button><button class="btn piccolo" data-az="eliminaSed" data-id="${esc(x.id)}">Elimina</button></div></div>`).join("") : "<p class='tenue'>Ancora nessuna seduta.</p>");
  }
  function modificaSeduta(id) {
    const s = S.sedute.find(x => x.id === id);
    if (!s) return;
    if (S.bozza && !confirm("C'è una seduta in corso: la sostituisco?")) return;
    const b = { id: s.id, data: s.data, sett: s.sett, seduta: s.seduta, conD: s.conD, dueSedute: s.dueSedute, forma: s.forma || "ok", inizio: Date.now(), nota: s.nota || "", ordine: [], esercizi: {}, riscaldamento: (P.sedute[s.seduta] || {}).riscaldamento || "", nome: (P.sedute[s.seduta] || {}).nome || s.seduta, modifica: true, durataMin: s.durataMin };
    for (const [eid, e] of Object.entries(s.esercizi)) {
      const d = defDi(eid);
      b.ordine.push(eid);
      b.esercizi[eid] = { id: eid, n: d ? d.n : "", nome: e.nome || (d && d.nome) || eid, tipo: d ? d.tipo : "accessorio", inc: d && d.inc || 2.5, perLato: !!(d && d.perLato), dischiMacchina: !!(d && d.dischiMacchina), nota: d && d.nota || "", motivo: "", rir: null, range: e.range, ripTarget: e.ripTarget || e.serie.map(x => x.rip), kgPiano: e.kgPiano, mostraKg: e.serie.some(x => x.kg), alPostoDi: e.alPostoDi || null, deload: e.deload, test: !!e.test, ultima: "", serie: e.serie.map(x => Object.assign({ ok: true }, x)), tecnica: !!e.tecnica, dolore: !!e.dolore, saltato: !!e.saltato, notaUtente: e.nota || "" };
    }
    S.bozza = b; salvaBozza(); vai("oggi");
  }

  // Carichi di partenza: diventano una seduta "iniziale" per lettera, datata prima della settimana 7.
  function vPartenza() {
    let h = `<p><a href="#" data-az="vai" data-v="altro">← Altro</a></p><h1>Carichi di partenza</h1>
      <p class="tenue" style="font-size:14px">L'ultima volta che hai fatto ogni esercizio (dal taccuino): carico e ripetizioni per serie, es. <code>20</code> e <code>8 8 7</code>. RIR facoltativo (dell'ultima serie). Lascia vuoto ciò che non sai: te lo chiederà in palestra.</p>`;
    for (const l of ["A", "B", "C", "D"]) {
      const ini = S.sedute.find(s => s.iniziale && s.seduta === l);
      h += `<h2>${l} · ${esc(P.sedute[l].nome)}</h2><div class="card">`;
      for (const e of P.sedute[l].esercizi) {
        if (e.tipo === "salti" || e.tipo === "corpo" || e.legatoA || (e.fino && e.fino < 7)) continue;
        const v = ini && ini.esercizi[e.id];
        const s = v ? v.serie : [];
        h += `<div style="margin:6px 0 10px"><div style="font-size:14px;font-weight:600">${esc(e.nome)} <span class="tenue3">${e.tipo === "bilanciere" ? "" : e.range ? e.serie + "×" + e.range.join("-") : ""}</span></div>
          <div class="fila" style="flex-wrap:nowrap">${e.tipo === "trazioni" ? "" : `<input inputmode="decimal" placeholder="kg" style="max-width:80px" data-p="${e.id}" data-c="kg" value="${s[0] && s[0].kg != null ? kg(s[0].kg) : ""}">`}
          <input placeholder="ripetizioni per serie" data-p="${e.id}" data-c="rip" value="${s.map(x => x.rip).join(" ")}">
          <input inputmode="numeric" placeholder="RIR" style="max-width:62px" data-p="${e.id}" data-c="rir" value="${s.length && s[s.length - 1].rir != null ? s[s.length - 1].rir : ""}"></div></div>`;
      }
      h += `</div>`;
    }
    h += `<button class="btn prim largo" data-az="salvaPartenza">Salva carichi di partenza</button>`;
    vista.innerHTML = h;
  }
  async function salvaPartenza() {
    for (const l of ["A", "B", "C", "D"]) {
      const rec = { id: "iniziale-" + l, data: "2026-10-02", sett: 5, seduta: l, iniziale: true, esercizi: {} };
      for (const e of P.sedute[l].esercizi) {
        const val = c => { const el = document.querySelector(`[data-p="${e.id}"][data-c="${c}"]`); return el ? el.value.trim() : ""; };
        const rip = val("rip").split(/[\s,;/]+/).map(num).filter(x => x != null);
        if (!rip.length) continue;
        const k = num(val("kg")), rir = num(val("rir"));
        rec.esercizi[e.id] = { nome: e.nome, range: e.range ? e.range.slice() : null, ripTarget: rip.slice(), serie: rip.map((r, i) => ({ kg: e.tipo === "trazioni" ? null : k, rip: r, rir: i === rip.length - 1 ? rir : null })) };
      }
      if (Object.keys(rec.esercizi).length) { await DB.metti("sedute", rec); S.sedute = S.sedute.filter(s => s.id !== rec.id).concat(rec); }
      else { await DB.togli("sedute", rec.id); S.sedute = S.sedute.filter(s => s.id !== rec.id); }
    }
    toast("Salvati. I carichi previsti partono da qui."); vai("oggi");
  }

  function vImpAssistente() {
    vista.innerHTML = `<p><a href="#" data-az="vai" data-v="altro">← Altro</a></p><h1>Assistente</h1>
      <div class="card"><b>Chiave Gemini (gratuita)</b>
      <ol style="font-size:14px;padding-left:20px"><li>Apri <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> con il tuo account Google.</li><li>"Create API key", copiala, incollala qui sotto.</li></ol>
      <p class="tenue3">Livello gratuito: nessun costo, ma Google può usare i messaggi per migliorare i suoi modelli. Per le foto del fisico evita il viso. La chiave resta solo su questo telefono e non entra nei backup.</p>
      <input type="password" autocomplete="off" data-campo="imp" data-k="chiave" value="${esc(S.imp.chiave)}" placeholder="Incolla la chiave">
      <label class="etich" style="margin-top:10px">Modello</label>
      <div class="fila" style="flex-wrap:nowrap"><input data-campo="imp" data-k="modello" value="${esc(S.imp.modello)}"><button class="btn piccolo" data-az="trovaModelli">Trova modelli</button></div>
      <div id="modelli"></div></div>
      <div class="card"><b>Profilo per il coach</b><p class="tenue3">Chi sei, obiettivi, dolori, attrezzatura della palestra. Si compila da solo con il file di partenza preparato sul Mac; puoi modificarlo.</p>
      <textarea data-campo="imp" data-k="profilo" style="min-height:200px">${esc(S.imp.profilo)}</textarea></div>`;
  }
  function vAiuto() {
    vista.innerHTML = `<p><a href="#" data-az="vai" data-v="altro">← Altro</a></p><h1>Niente distrazioni</h1>
      <div class="card"><b>Una volta sola (Pixel 9a)</b><ol style="font-size:15px;padding-left:20px">
      <li>Impostazioni → Sicurezza e privacy → Altre impostazioni di sicurezza → <b>Blocco app</b> (o "Fissa app"): attivalo.</li>
      <li>Attiva anche <b>"Chiedi il PIN prima di sbloccare"</b>.</li></ol></div>
      <div class="card"><b>In palestra</b><ol style="font-size:15px;padding-left:20px">
      <li>Apri Seduta.</li><li>Tocca il pulsante delle app recenti (o scorri dal basso e fermati).</li><li>Tocca l'icona di Seduta in alto → <b>Blocca</b>.</li></ol>
      <p class="tenue" style="font-size:14px">Il telefono resta su Seduta: niente notifiche, niente altre app. Per uscire: tieni premuti indietro + recenti (o scorri in su e tieni premuto) e metti il PIN. Il PIN è la frizione che ti fa fermare un secondo.</p></div>
      <div class="card"><b>In più</b><p style="font-size:14px">Modalità Non disturbare programmata negli orari della palestra (Impostazioni → Notifiche → Non disturbare → Pianificazioni).</p></div>`;
  }

  // ---------------- backup ----------------
  async function esporta(soloFile) {
    const foto = [];
    for (const f of await DB.tutti("foto")) foto.push({ id: f.id, data: f.data, posa: f.posa, mime: f.blob.type, b64: await A.blobBase64(f.blob) });
    const imp = Object.assign({}, S.imp); delete imp.chiave;
    const dati = { app: "seduta", formato: 1, esportato: new Date().toISOString(), programma: P.versione, sedute: S.sedute, corpo: S.corpo, chat: S.chat, impostazioni: imp, foto };
    const testo = JSON.stringify(dati);
    const nome = `seduta-backup-${oggi()}.txt`;
    const file = new File([testo], nome, { type: "text/plain" });
    let fatto = false;
    try {
      if (!soloFile && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: nome }); fatto = true; }
    } catch (e) { if (e.name === "AbortError") return; }
    if (!fatto) {
      const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = nome; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000); fatto = true;
    }
    S.imp.ultimoBackup = oggi(); await salvaImp();
    toast("Backup creato (" + Math.round(testo.length / 1024) + " KB). Salvalo in Drive → Assistenti/Palestra/Registro.", 4000);
    render();
  }
  async function importa(file) {
    let d;
    try { d = JSON.parse(await file.text()); } catch (_) { return toast("File non valido."); }
    if (d.app !== "seduta") return toast("Non è un backup di Seduta.");
    const n = { sedute: 0, corpo: 0, foto: 0, chat: 0 };
    for (const s of d.sedute || []) { await DB.metti("sedute", s); n.sedute++; }
    for (const c of d.corpo || []) { await DB.metti("corpo", c); n.corpo++; }
    for (const c of d.chat || []) { await DB.metti("chat", c); n.chat++; }
    for (const f of d.foto || []) {
      const bin = atob(f.b64); const u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      await DB.metti("foto", { id: f.id, data: f.data, posa: f.posa, blob: new Blob([u], { type: f.mime || "image/jpeg" }) }); n.foto++;
    }
    if (d.impostazioni) {
      const imp = Object.assign({}, d.impostazioni); delete imp.chiave;
      for (const k of Object.keys(imp)) if (imp[k] !== "" && imp[k] != null) S.imp[k] = imp[k];
      await salvaImp(); applicaTema();
    }
    S.sedute = await DB.tutti("sedute"); S.corpo = await DB.tutti("corpo"); S.chat = (await DB.tutti("chat")).sort((a, b) => a.ts - b.ts);
    toast(`Importati: ${n.sedute} sedute, ${n.corpo} giorni di dati corpo, ${n.foto} foto.`, 4000);
    vai("oggi");
  }

  // ---------------- eventi ----------------
  document.addEventListener("click", async ev => {
    const nav = ev.target.closest("#nav button");
    if (nav) { S.riepilogo = S.vista === "oggi" ? S.riepilogo : S.riepilogo; return vai(nav.dataset.vai); }
    const el = ev.target.closest("[data-az]");
    if (!el) return;
    const az = el.dataset.az, b = S.bozza;
    if (el.tagName === "A") ev.preventDefault();
    const v = b && el.dataset.id ? b.esercizi[el.dataset.id] : null;
    const i = el.dataset.i != null ? +el.dataset.i : null;
    switch (az) {
      case "vai": return vai(el.dataset.v);
      case "pront": { const k = el.dataset.k, x = +el.dataset.v; if (S.pront[k] === x) delete S.pront[k]; else S.pront[k] = x; S.forma = M.prontezza(S.pront); return render(); }
      case "inizia":
        if (S.sedute.some(s => s.seduta === el.dataset.l && s.data >= M.lunediDi(oggi()) && !s.iniziale) && !confirm(`Hai già fatto ${el.dataset.l} questa settimana. La rifai?`)) return;
        return inizia(el.dataset.l);
      case "conD": return cambiaConD(el.dataset.v === "1");
      case "ok": {
        const s = v.serie[i];
        const fila = el.closest(".serie");
        const ik = fila && fila.querySelector('input[data-c="kg"]'), ir = fila && fila.querySelector('input[data-c="rip"]');
        if (ik && v.mostraKg) s.kg = num(ik.value);
        if (ir) s.rip = num(ir.value);
        s.ok = !s.ok;
        if (s.ok) {
          vibra();
          if (v.mostraKg && s.kg == null) { s.ok = false; toast("Inserisci il carico."); return render(); }
          if (s.rip == null) { s.ok = false; toast("Inserisci le ripetizioni."); return render(); }
          // il carico corretto passa alle serie successive non ancora fatte
          for (let j = i + 1; j < v.serie.length; j++) if (!v.serie[j].ok && v.mostraKg) v.serie[j].kg = s.kg;
          if (i === 0) controlloPrima(v);
        }
        salvaBozza(); return render();
      }
      case "rir": v.serie[i].rir = v.serie[i].rir === +el.dataset.v ? null : +el.dataset.v; if (i === 0) controlloPrima(v); salvaBozza(); return render();
      case "passo": {
        const c = el.dataset.c, s = v.serie[i], dlt = +el.dataset.d;
        const inp = el.parentElement.querySelector("input");
        if (inp) s[c] = num(inp.value);
        if (c === "kg") {
          const base = num(s.kg) ?? (v.kgPiano ?? 0);
          s.kg = Math.max(0, +(base + dlt * v.inc).toFixed(2));
          for (let j = i + 1; j < v.serie.length; j++) if (!v.serie[j].ok) v.serie[j].kg = s.kg;
        } else s.rip = Math.max(0, (num(s.rip) ?? 0) + dlt);
        salvaBozza(); return render();
      }
      case "piuSerie": { const u = v.serie[v.serie.length - 1]; v.serie.push({ kg: u.kg, rip: u.rip, rir: null, ok: false }); v.ripTarget.push(v.ripTarget[v.ripTarget.length - 1]); salvaBozza(); return render(); }
      case "menoSerie": { const u = v.serie[v.serie.length - 1]; if (u.ok && !confirm("L'ultima serie è già confermata. La tolgo?")) return; v.serie.pop(); v.ripTarget.pop(); salvaBozza(); return render(); }
      case "tecnica": v.tecnica = !v.tecnica; salvaBozza(); return render();
      case "dolore": v.dolore = !v.dolore; if (v.dolore) toast("Segnato. Dolore sopra 3 su 10: chiudi l'esercizio qui."); salvaBozza(); return render();
      case "salta": v.saltato = !v.saltato; salvaBozza(); return render();
      case "cambia": S.sotto = S.sotto && S.sotto.id === v.id && S.sotto.tipo === "cambia" ? null : { id: v.id, tipo: "cambia" }; return render();
      case "info": S.sotto = S.sotto && S.sotto.id === v.id && S.sotto.tipo === "info" ? null : { id: v.id, tipo: "info" }; return render();
      case "scegliAlt": return scegliAlternativa(el.dataset.id, el.dataset.alt || null, null);
      case "altLibero": { const n = ($("#altLibero").value || "").trim(); if (!n) return toast("Scrivi il nome dell'esercizio."); return scegliAlternativa(el.dataset.id, null, n); }
      case "chiediCoach": S.bozzaDomanda = `Come si esegue bene ${v.nome}? Punti chiave, errori comuni e come capire il RIR.`; return vai("coach");
      case "fine": return fineSeduta();
      case "annulla":
        if (!confirm(b.modifica ? "Annullo la modifica? La seduta salvata resta com'era." : "Annullo la seduta? Le serie segnate andranno perse.")) return;
        S.bozza = null; await DB.kvMetti("bozza", null); return render();
      case "chiudiRiepilogo": S.riepilogo = null; return render();
      case "copia": case "condividiTesto": {
        const s = S.sedute.find(x => x.id === S.riepilogo), t = s ? M.testoSeduta(P, s) : "";
        if (az === "copia") { try { await navigator.clipboard.writeText(t); toast("Copiato."); } catch (_) { toast("Copia non riuscita."); } }
        else { try { await navigator.share({ text: t }); } catch (e) { if (e.name !== "AbortError") { try { await navigator.clipboard.writeText(t); toast("Copiato."); } catch (_) {} } } }
        return;
      }
      case "esporta": return esporta(el.dataset.v === "file");
      case "modificaSed": return modificaSeduta(el.dataset.id);
      case "eliminaSed": if (confirm("Elimino questa seduta?")) { await DB.togli("sedute", el.dataset.id); S.sedute = S.sedute.filter(s => s.id !== el.dataset.id); render(); } return;
      case "salvaPartenza": return salvaPartenza();
      case "tema": S.imp.tema = el.dataset.v; await salvaImp(); applicaTema(); return render();
      case "trovaModelli": {
        const box = $("#modelli"); box.innerHTML = "<p class='tenue3'>Cerco…</p>";
        try {
          const ms = await A.elencaModelli(S.imp.chiave);
          box.innerHTML = ms.length ? ms.map(m => `<button class="btn piccolo" style="margin:4px 4px 0 0" data-az="scegliModello" data-v="${esc(m.id)}">${esc(m.id)}</button>`).join("") : "<p>Nessun modello trovato.</p>";
        } catch (e) { box.innerHTML = `<div class="avviso errore">${esc(e.message)}</div>`; }
        return;
      }
      case "scegliModello": S.imp.modello = el.dataset.v; await salvaImp(); toast("Modello: " + el.dataset.v); return render();
      case "chip": { S.bozzaDomanda = CHIP[+el.dataset.i][1](); render(); const t = $("#domanda"); if (t) { t.focus(); const k = t.value.indexOf("["); if (k >= 0) t.setSelectionRange(k, t.value.indexOf("]", k) + 1); } return; }
      case "allegaCorpo": {
        const c = S.corpo.filter(x => x.foto && Object.keys(x.foto).length).sort((a, b) => (a.data < b.data ? 1 : -1))[0];
        if (!c) return toast("Nessuna foto del fisico: aggiungile in Corpo.");
        S.allegati = [...new Set([...S.allegati, ...Object.values(c.foto)])].slice(0, 6);
        S.bozzaDomanda = ($("#domanda") || {}).value || `Ecco le mie foto del ${dataBreve(c.data)}. Cosa noti? Cosa devo migliorare?`; return render();
      }
      case "coachFoto": {
        const a = S.corpo.find(x => x.id === el.dataset.a), bb = S.corpo.find(x => x.id === el.dataset.b);
        S.allegati = [...Object.values(a.foto), ...(a.id !== bb.id ? Object.values(bb.foto) : [])].slice(0, 6);
        S.bozzaDomanda = `Confronta le foto del ${dataBreve(a.data)} (le prime) con quelle del ${dataBreve(bb.data)} (le ultime), stessa posa. Tieni conto di luce e postura; dimmi cosa è cambiato davvero e cosa no.`;
        return vai("coach");
      }
      case "togliAllegato": S.allegati.splice(i, 1); return render();
      case "invia": return invia();
      case "mandaApp": return mandaApp();
      case "nuovaChat":
        if (!confirm("Cancello la conversazione? (Le sedute e i dati non si toccano.)")) return;
        for (const m of S.chat) await DB.togli("chat", m.id);
        S.chat = []; return render();
    }
  });

  document.addEventListener("input", ev => {
    const el = ev.target;
    if (el.id === "domanda") { S.bozzaDomanda = el.value; el.style.height = "auto"; el.style.height = Math.min(140, el.scrollHeight) + "px"; }
  });
  document.addEventListener("change", async ev => {
    const el = ev.target, c = el.dataset.campo;
    if (!c) return;
    const b = S.bozza;
    if (c === "serie") {
      const v = b.esercizi[el.dataset.id], i = +el.dataset.i, s = v.serie[i];
      const x = num(el.value);
      if (el.dataset.c === "kg") {
        s.kg = x;
        for (let j = i + 1; j < v.serie.length; j++) if (!v.serie[j].ok) {
          v.serie[j].kg = x;
          const inp = document.querySelector(`input[data-campo="serie"][data-id="${CSS.escape(v.id)}"][data-i="${j}"][data-c="kg"]`);
          if (inp) inp.value = x == null ? "" : kg(x);
        }
      } else s.rip = x;
      // niente render qui: su Android il change arriva quando si tocca ✓ e il ridisegno farebbe perdere il tocco
      return salvaBozza();
    }
    if (c === "notaSeduta") { b.nota = el.value; return salvaBozza(); }
    if (c === "notaEs") { b.esercizi[el.dataset.id].notaUtente = el.value; return salvaBozza(); }
    if (c === "corpoData") { S.corpoData = el.value || oggi(); return render(); }
    if (c === "corpo") {
      const d = S.corpoData || oggi(), k = el.dataset.k;
      await salvaCorpo(d, e => {
        if (k === "peso") e.peso = num(el.value);
        else if (k === "nota") e.nota = el.value;
        else { e.misure = e.misure || {}; e.misure[k] = num(el.value); }
      });
      toast("Salvato."); return k === "peso" ? render() : undefined;
    }
    if (c === "fotoCorpo" && el.files[0]) {
      const d = S.corpoData || oggi(), k = el.dataset.k;
      const f = el.files[0]; el.value = "";
      const blob = await comprimi(f);
      const id = "corpo-" + d + "-" + k;
      await DB.metti("foto", { id, data: d, posa: k, blob });
      urlFoto.delete(id);
      await salvaCorpo(d, e => { e.foto = e.foto || {}; e.foto[k] = id; });
      toast("Foto salvata."); return render();
    }
    if (c === "confronto") { if (el.dataset.k === "A") S.confrontoA = el.value; else S.confrontoB = el.value; return render(); }
    if (c === "allegaFoto" && el.files[0]) {
      const f = el.files[0]; el.value = "";
      const blob = await comprimi(f, 1280, 0.8);
      const id = "chat-" + uid();
      await DB.metti("foto", { id, data: oggi(), posa: "chat", blob });
      S.allegati.push(id); return render();
    }
    if (c === "imp") { S.imp[el.dataset.k] = el.value.trim(); await salvaImp(); return toast("Salvato."); }
    if (c === "importa" && el.files[0]) { const f = el.files[0]; el.value = ""; return importa(f); }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && S.bozza) { clearTimeout(timerBozza); DB.kvMetti("bozza", S.bozza); }
  });
  window.addEventListener("hashchange", () => { const h = location.hash.slice(1); if (h && h !== S.vista) { S.vista = h; render(); } });

  avvio().catch(e => { vista.innerHTML = `<div class="avviso errore">Errore all'avvio: ${esc(e.message)}</div>`; });
})();
