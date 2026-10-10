// Andamento (dal 10 ottobre 2026): KPI e grafici sul trend di allenamento.
// calcola() è puro (si prova in node: test/andamento.test.js); html() disegna in SVG
// con i colori dell'app (una serie = colore accento, il resto grigio). Si ricalcola
// a ogni apertura della scheda, quindi ogni seduta nuova entra subito.
(function (root) {
  "use strict";
  // gruppo muscolare dal codice dell'esercizio (parte dopo "A.", "B.", ...); salti e balzi esclusi
  const GRUPPI = [
    ["Dorso", ["trazioni", "lat", "trazAss", "pulley", "pulleyStretto", "rematore"]],
    ["Petto", ["pancaF", "panca", "inclinata", "inclinata30", "crociCavi"]],
    ["Spalle", ["military", "laterali", "lateraliExtra", "crociInv", "rotazioni"]],
    ["Bicipiti", ["curl", "curlCavi", "martello"]],
    ["Tricipiti", ["tricipiti", "pushBarra", "pushdown"]],
    ["Gambe (quadricipiti)", ["squat", "hack", "bulgari"]],
    ["Catena posteriore", ["legcurl", "rdl", "stacco", "iper"]],
    ["Polpacci", ["polpacci"]],
    ["Addome", ["knee", "crunch", "pallof"]],
    ["Trapezi", ["scrollate"]]
  ];
  const GRUPPO = new Map();
  for (const [g, ids] of GRUPPI) for (const i of ids) GRUPPO.set(i, g);
  const suff = id => String(id).split(".").pop();
  // le tendenze che contano per gli obiettivi; trazioni in ripetizioni, il resto in kg stimati
  const TREND = [
    { nome: "Squat", ids: ["A.squat"] },
    { nome: "Stacco da terra", ids: ["C.stacco"] },
    { nome: "Panca piana manubri", ids: ["B.panca", "B.pancaF"] },
    { nome: "Panca inclinata 30°", ids: ["A.inclinata30", "C.inclinata30"] },
    { nome: "Trazioni", ids: ["A.trazioni", "B.trazioni", "C.trazioni"], rip: true },
    { nome: "Alzate laterali", ids: ["A.laterali", "B.laterali", "C.laterali", "D.laterali", "C.lateraliExtra"] }
  ];

  const g0 = s => Date.parse(s + "T12:00:00Z");
  const piuGiorni = (d, n) => new Date(g0(d) + n * 864e5).toISOString().slice(0, 10);

  function calcola(P, M, sedute, corpo, oggi) {
    const vere = sedute.filter(s => !s.iniziale && s.data <= oggi).sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
    const lun = M.lunediDi(oggi);
    const fatte = e => M.fatte(e).filter(x => x.rip > 0);
    const serieDi = s => Object.values(s.esercizi || {}).reduce((n, e) => n + fatte(e).length, 0);
    const tonnDi = s => Object.values(s.esercizi || {}).reduce((t, e) => t + fatte(e).reduce((a, x) => a + M.tonnellaggio(x), 0), 0);

    // settimane (lunedì → lunedì), le ultime 12
    const settimane = [];
    for (let k = 11; k >= 0; k--) {
      const da = piuGiorni(lun, -7 * k), a = piuGiorni(da, 7);
      const ss = vere.filter(s => s.data >= da && s.data < a);
      settimane.push({ lun: da, sedute: ss.length, serie: ss.reduce((n, s) => n + serieDi(s), 0), tonn: ss.reduce((t, s) => t + tonnDi(s), 0) });
    }
    const q = settimane[11], prec = settimane[10];

    // miglior stima per seduta di ogni esercizio: e1RM (kg) o ripetizioni possibili (trazioni)
    const migliore = (e, rip) => {
      let b = null;
      for (const x of fatte(e)) {
        const v = rip ? x.rip + (x.rir == null ? 1 : Math.min(x.rir, 5)) : x.kg ? M.e1rm(x.kg, x.rip, x.rir) : null;
        if (v != null && (b == null || v > b)) b = v;
      }
      return b;
    };
    const trend = TREND.map(t => {
      const punti = [];
      for (const s of vere) {
        let b = null;
        for (const id of t.ids) { const e = s.esercizi && s.esercizi[id]; if (!e || e.alPostoDi) continue; const v = migliore(e, t.rip); if (v != null && (b == null || v > b)) b = v; }
        if (b != null) punti.push({ d: s.data, v: Math.round(b * 10) / 10 });
      }
      return { nome: t.nome, unita: t.rip ? "rip" : "kg", punti };
    });

    // record: seduta in cui la stima di un esercizio supera tutte le precedenti (dalla seconda volta)
    const meglio = new Map();
    const record = [];
    for (const s of vere) for (const [id, e] of Object.entries(s.esercizi || {})) {
      const rip = suff(id) === "trazioni" || suff(id) === "knee" || suff(id) === "iper";
      const v = migliore(e, rip);
      if (v == null) continue;
      const prima = meglio.get(id);
      if (prima != null && v > prima * 1.005) record.push({ d: s.data, id, nome: e.nome || (M.defDi(P, id) || {}).nome || id });
      if (prima == null || v > prima) meglio.set(id, v);
    }
    const da28 = piuGiorni(oggi, -27);
    const record28 = record.filter(r => r.d >= da28);

    // serie a settimana per gruppo muscolare, media delle ultime 4 settimane (o da quando hai iniziato)
    const recenti = vere.filter(s => s.data >= da28);
    const primo = recenti.length ? recenti[0].data : oggi;
    const nSett = Math.max(1, Math.min(4, Math.ceil((M.giorni(primo, oggi) + 1) / 7)));
    const conta = new Map(GRUPPI.map(([g]) => [g, 0]));
    for (const s of recenti) for (const [id, e] of Object.entries(s.esercizi || {})) {
      const g = GRUPPO.get(suff(e.alPostoDi || id));
      if (g) conta.set(g, conta.get(g) + fatte(e).length);
    }
    const muscoli = GRUPPI.map(([g]) => ({ gruppo: g, serie: Math.round(conta.get(g) / nSett * 10) / 10 }));

    // esercizi che salgono o sono fermi: ultime 4 volte
    const perEs = new Map();
    for (const s of vere) for (const [id, e] of Object.entries(s.esercizi || {})) {
      if (e.alPostoDi || e.deload) continue;
      const rip = suff(id) === "trazioni" || suff(id) === "knee" || suff(id) === "iper";
      const v = migliore(e, rip);
      if (v == null) continue;
      if (!perEs.has(id)) perEs.set(id, { id, nome: e.nome || (M.defDi(P, id) || {}).nome || id, rip, v: [] });
      perEs.get(id).v.push({ d: s.data, v });
    }
    const esercizi = [...perEs.values()].filter(x => x.v.length >= 2 && M.giorni(x.v[x.v.length - 1].d, oggi) <= 42).map(x => {
      const u = x.v.slice(-4), ult = u[u.length - 1].v, base = u[0].v, best = Math.max(...u.slice(0, -1).map(p => p.v));
      const delta = (ult - base) / base;
      // fermo: da almeno 3 volte nessun miglioramento rispetto al meglio precedente
      let ferme = 0;
      for (let i = x.v.length - 1; i >= 0; i--) { if (x.v[i].v > Math.max(...x.v.slice(0, i).map(p => p.v), -Infinity) * 1.005) break; ferme++; }
      // in crescita: sopra di oltre l'1% rispetto a 4 volte fa e record nelle ultime due volte
      const stato = ferme >= 3 ? "fermo" : delta < -0.03 ? "giu" : delta > 0.01 && ferme <= 1 && ult >= best ? "su" : "stabile";
      return { id: x.id, nome: x.nome, stato, delta: Math.round(delta * 1000) / 10, volte: x.v.length, ferme, rip: x.rip };
    }).sort((a, b) => ({ su: 0, fermo: 1, giu: 2, stabile: 3 }[a.stato] - { su: 0, fermo: 1, giu: 2, stabile: 3 }[b.stato]) || b.delta - a.delta);

    // corpo: media settimanale del peso e vita
    const pesi = new Map();
    for (const c of corpo) if (c.peso != null && c.data <= oggi) { const l = M.lunediDi(c.data); if (!pesi.has(l)) pesi.set(l, []); pesi.get(l).push(c.peso); }
    const peso = [...pesi].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([l, v]) => ({ d: l, v: Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10 })).slice(-16);
    const vita = corpo.filter(c => c.misure && c.misure.vita != null && c.data <= oggi).sort((a, b) => (a.data < b.data ? -1 : 1)).map(c => ({ d: c.data, v: c.misure.vita })).slice(-16);

    const sedute4 = settimane.slice(8).reduce((n, w) => n + w.sedute, 0);
    return {
      kpi: {
        sedute4, previste4: 12,
        serie: q.serie, seriePrec: prec.serie,
        tonn: Math.round(q.tonn), tonnPrec: Math.round(prec.tonn),
        record: record28.length, recordNomi: [...new Set(record28.map(r => r.nome))].slice(0, 4)
      },
      settimane, trend, muscoli, nSett, esercizi, peso, vita, totale: vere.length
    };
  }

  // ---------------- disegno ----------------
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  const dBreve = d => { const x = new Date(d + "T12:00:00"); return `${x.getDate()} ${MESI[x.getMonth()]}`; };
  const fmt = (v, dec = 0) => (v == null ? "–" : (+v).toFixed(dec).replace(".", ","));
  const migliaia = v => Math.round(v).toLocaleString("it-IT");

  function tile(etich, valore, sotto) {
    return `<div class="kpi"><div class="kpi-e">${etich}</div><div class="kpi-v">${valore}</div><div class="kpi-s">${sotto}</div></div>`;
  }
  const variaz = (a, b, u) => {
    if (!b) return a ? "settimana scorsa 0" : "nessun dato";
    const p = Math.round((a - b) / b * 100);
    return `${p > 0 ? "▲ +" : p < 0 ? "▼ " : "= "}${p}% sulla settimana scorsa (${u(b)})`;
  };

  // grafico a linea con crocino: i punti finiscono in data-punti, il tocco li legge (vedi app.js)
  function linea(punti, o) {
    const W = 320, H = o.h || 120, sx = 30, dx = 8, su = 10, gi = 20;
    if (!punti.length) return `<p class="tenue3">${o.vuoto || "Ancora nessun dato."}</p>`;
    const t = punti.map(p => g0(p.d)), v = punti.map(p => p.v);
    let lo = Math.min(...v), hi = Math.max(...v);
    const pad = Math.max((hi - lo) * 0.15, o.minPad || 1);
    lo -= pad; hi += pad;
    const t0 = t[0], t1 = t.length > 1 ? t[t.length - 1] : t0 + 864e5;
    const X = x => sx + (W - sx - dx) * (punti.length > 1 ? (x - t0) / (t1 - t0) : 0.5), Y = y => su + (H - su - gi) * (1 - (y - lo) / (hi - lo));
    // griglia: 3 valori arrotondati
    const passi = [lo + (hi - lo) * 0.2, (lo + hi) / 2, lo + (hi - lo) * 0.8];
    let s = `<svg viewBox="0 0 ${W} ${H}" class="graf" role="img" aria-label="${esc(o.titolo)}">`;
    for (const g of passi) s += `<line x1="${sx}" x2="${W - dx}" y1="${Y(g).toFixed(1)}" y2="${Y(g).toFixed(1)}" class="griglia"/><text x="${sx - 4}" y="${(Y(g) + 4).toFixed(1)}" class="asse" text-anchor="end">${fmt(g, hi - lo < 6 ? 1 : 0)}</text>`;
    s += `<text x="${sx}" y="${H - 4}" class="asse">${dBreve(punti[0].d)}</text>`;
    if (punti.length > 1) s += `<text x="${W - dx}" y="${H - 4}" class="asse" text-anchor="end">${dBreve(punti[punti.length - 1].d)}</text>`;
    const pts = punti.map((p, i) => `${X(t[i]).toFixed(1)},${Y(p.v).toFixed(1)}`);
    if (punti.length > 1) s += `<polyline points="${pts.join(" ")}" class="linea"/>`;
    const ul = punti.length - 1;
    s += `<circle cx="${X(t[ul]).toFixed(1)}" cy="${Y(punti[ul].v).toFixed(1)}" r="4" class="punto"/>`;
    s += `<line class="croce" x1="0" x2="0" y1="${su}" y2="${H - gi}" visibility="hidden"/><circle class="croce-p" r="5" visibility="hidden"/>`;
    s += `</svg>`;
    const dati = punti.map((p, i) => [+(X(t[i]) / W).toFixed(4), +Y(p.v).toFixed(1), dBreve(p.d) + ": " + fmt(p.v, o.dec ?? 0) + " " + o.unita]);
    return `<div class="graf-box" data-punti='${esc(JSON.stringify(dati))}' data-h="${H}">${s}<div class="suggerimento" hidden></div></div>`;
  }

  function colonne(sett) {
    const W = 320, H = 120, sx = 22, dx = 4, su = 8, gi = 20, max = Math.max(4, ...sett.map(w => w.sedute));
    const bw = Math.min(16, (W - sx - dx) / sett.length - 6), passo = (W - sx - dx) / sett.length;
    const Y = v => su + (H - su - gi) * (1 - v / max);
    let s = `<svg viewBox="0 0 ${W} ${H}" class="graf" role="img" aria-label="Sedute per settimana">`;
    for (const g of [1, 2, 3, 4].filter(g => g <= max)) s += `<line x1="${sx}" x2="${W - dx}" y1="${Y(g)}" y2="${Y(g)}" class="griglia${g === 3 ? " rif" : ""}"/><text x="${sx - 4}" y="${Y(g) + 4}" class="asse" text-anchor="end">${g}</text>`;
    const dati = [];
    sett.forEach((w, i) => {
      const x = sx + i * passo + (passo - bw) / 2, y = Y(w.sedute), h = H - gi - y;
      if (w.sedute) s += `<path d="M${x},${H - gi}V${y + 4}q0,-4 4,-4h${bw - 8}q4,0 4,4V${H - gi}Z" class="${i === sett.length - 1 ? "barra-ora" : "barra"}"/>`;
      if (i % 3 === 2 || i === sett.length - 1) s += `<text x="${x + bw / 2}" y="${H - 4}" class="asse" text-anchor="middle">${i === sett.length - 1 ? "ora" : dBreve(w.lun)}</text>`;
      dati.push([+((x + bw / 2) / W).toFixed(4), Math.min(y, H - gi - 2), `settimana del ${dBreve(w.lun)}: ${w.sedute} sedute, ${w.serie} serie`]);
    });
    s += `<line class="croce" x1="0" x2="0" y1="${su}" y2="${H - gi}" visibility="hidden"/><circle class="croce-p" r="0" visibility="hidden"/></svg>`;
    return `<div class="graf-box" data-punti='${esc(JSON.stringify(dati))}' data-h="${H}">${s}<div class="suggerimento" hidden></div></div>`;
  }

  function barreMuscoli(m) {
    const max = Math.max(22, ...m.map(x => x.serie));
    const pc = v => (v / max * 100).toFixed(1) + "%";
    return `<div class="muscoli">${m.map(x => `<div class="mu-riga" title="${esc(x.gruppo)}: ${fmt(x.serie, 1)} serie a settimana">
      <span class="mu-nome">${esc(x.gruppo)}</span>
      <span class="mu-pista"><span class="mu-banda" style="left:${pc(10)};width:${pc(10)}"></span><span class="mu-barra" style="width:${pc(x.serie)}"></span></span>
      <span class="mu-v">${fmt(x.serie, x.serie < 10 ? 1 : 0)}</span></div>`).join("")}</div>`;
  }

  const STATO = { su: ["▲", "in crescita"], fermo: ["■", "fermo"], giu: ["▼", "in calo"], stabile: ["→", "stabile"] };

  function html(R) {
    if (!R.totale) return `<h1>Andamento</h1><p class="tenue">Qui vedrai grafici e numeri sul tuo allenamento dopo la prima seduta salvata. Si aggiorna da solo a ogni Fine seduta.</p>`;
    const k = R.kpi;
    let h = `<h1>Andamento</h1><p class="tenue3">${R.totale} sedute registrate · si aggiorna a ogni Fine seduta.</p>`;
    h += `<div class="kpi-griglia">
      ${tile("Sedute, ultime 4 settimane", `${k.sedute4}<small> / ${k.previste4}</small>`, `A, B e C ogni settimana; D è in più`)}
      ${tile("Serie questa settimana", k.serie, variaz(k.serie, k.seriePrec, String))}
      ${tile("Tonnellaggio questa settimana", `${migliaia(k.tonn)}<small> kg</small>`, variaz(k.tonn, k.tonnPrec, v => migliaia(v) + " kg"))}
      ${tile("Record nelle ultime 4 settimane", k.record, k.recordNomi.length ? esc(k.recordNomi.join(", ")) : "nessuno ancora")}
    </div>`;
    h += `<div class="card"><b>Sedute per settimana</b><p class="tenue3">Ultime 12 settimane. La linea a 3 è il minimo del programma.</p>${colonne(R.settimane)}
      <details class="tenue3"><summary>Tabella</summary><table><tr><th>Settimana</th><th>Sedute</th><th>Serie</th><th>Tonn. kg</th></tr>${R.settimane.map(w => `<tr><td>${dBreve(w.lun)}</td><td>${w.sedute}</td><td>${w.serie}</td><td>${migliaia(w.tonn)}</td></tr>`).join("")}</table></details></div>`;
    h += `<h2>Forza stimata</h2><p class="tenue3">Il massimo che potresti sollevare una volta (stima dalla serie migliore di ogni seduta, contando il RIR). Trazioni: ripetizioni possibili. Tocca il grafico per i valori.</p><div class="multipli">`;
    for (const t of R.trend) {
      const p = t.punti, ult = p.length ? p[p.length - 1].v : null, d = p.length > 1 ? ult - p[0].v : null;
      h += `<div class="card mini"><div class="fila" style="justify-content:space-between;align-items:baseline"><b>${esc(t.nome)}</b><span class="mini-v">${ult == null ? "–" : fmt(ult, t.unita === "rip" ? 0 : 0) + " " + t.unita}</span></div>
        <div class="tenue3">${d == null ? "&nbsp;" : (d >= 0 ? "+" : "") + fmt(d, t.unita === "rip" ? 0 : 1) + " " + t.unita + " dal " + dBreve(p[0].d)}</div>
        ${linea(p, { titolo: t.nome, unita: t.unita, h: 90, minPad: t.unita === "rip" ? 1 : 2, vuoto: "Ancora nessuna seduta." })}</div>`;
    }
    h += `</div>`;
    h += `<div class="card"><b>Serie a settimana per muscolo</b><p class="tenue3">Media ${R.nSett === 1 ? "di questa settimana" : "delle ultime " + R.nSett + " settimane"}. La fascia chiara è 10-20 serie, la zona utile per crescere.</p>${barreMuscoli(R.muscoli)}</div>`;
    if (R.esercizi.length) h += `<div class="card"><b>Esercizi: chi sale e chi è fermo</b><p class="tenue3">Ultime 4 volte di ogni esercizio, stima di forza.</p><table>${R.esercizi.map(e => `<tr><td>${esc(e.nome)}</td><td class="st-${e.stato}">${STATO[e.stato][0]} ${STATO[e.stato][1]}${e.stato === "fermo" ? " da " + e.ferme + " volte" : ""}</td><td style="text-align:right">${e.delta > 0 ? "+" : ""}${fmt(e.delta, 1)}%</td></tr>`).join("")}</table></div>`;
    h += `<h2>Corpo</h2><div class="multipli">
      <div class="card mini"><b>Peso, media settimanale</b>${linea(R.peso, { titolo: "Peso medio settimanale", unita: "kg", dec: 1, h: 90, minPad: 0.5, vuoto: "Pesati al mattino in Corpo." })}</div>
      <div class="card mini"><b>Vita all'ombelico</b>${linea(R.vita, { titolo: "Vita", unita: "cm", dec: 1, h: 90, minPad: 0.5, vuoto: "Misurala una volta a settimana in Corpo." })}</div></div>`;
    return h;
  }

  const Andamento = { calcola, html, GRUPPI, TREND };
  if (typeof module !== "undefined" && module.exports) module.exports = Andamento;
  else root.Andamento = Andamento;
})(typeof globalThis !== "undefined" ? globalThis : this);
