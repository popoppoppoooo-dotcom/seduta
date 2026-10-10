// Work-out → Google Drive. Script da incollare una volta in script.google.com
// (istruzioni passo passo in drive/istruzioni.html).
// Riceve dall'app, a ogni "Fine seduta":
// - il testo di ogni seduta nuova o modificata → un file .txt in Assistenti/Palestra/Registro
// - le tabelle Sedute, Serie e Corpo → il foglio Google "Registro Work-out" (riscritte da capo)
// - tutti i dati (senza foto, chat e chiavi) → work-out-dati.json, per il coach sul Mac
// Gira con il tuo account: scrive solo nella cartella Registro e nei file che ha creato lui.
// La prima chiamata fissa il codice segreto dell'app; le altre devono avere lo stesso codice.

var CARTELLA = ["Assistenti", "Palestra", "Registro"];
var FOGLIO = "Registro Work-out";
var JSON_NOME = "work-out-dati.json";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var d = JSON.parse(e.postData.contents);
    var err = controllaCodice_(d.token);
    if (err) return risposta_({ ok: false, errore: err });
    var dir = cartella_();
    var p = PropertiesService.getScriptProperties();
    var scritti = 0, tolti = 0;
    (d.testi || []).forEach(function (t) {
      var nome = pulisci_(t.nome) + ".txt";
      var id = p.getProperty("f_" + t.id), f = null;
      if (id) { try { f = DriveApp.getFileById(id); if (f.isTrashed()) f = null; } catch (x) { f = null; } }
      if (f) { f.setContent(t.testo); if (f.getName() !== nome) f.setName(nome); }
      else { f = dir.createFile(nome, t.testo, MimeType.PLAIN_TEXT); p.setProperty("f_" + t.id, f.getId()); }
      scritti++;
    });
    (d.togli || []).forEach(function (sid) {
      var id = p.getProperty("f_" + sid);
      if (!id) return;
      try { DriveApp.getFileById(id).setTrashed(true); tolti++; } catch (x) {}
      p.deleteProperty("f_" + sid);
    });
    var url = "";
    if (d.fogli) url = scriviFogli_(dir, d.fogli, p);
    if (d.dati) scriviJson_(dir, JSON.stringify(d.dati), p);
    return risposta_({ ok: true, scritti: scritti, tolti: tolti, foglio: url });
  } catch (x) {
    return risposta_({ ok: false, errore: String(x && x.message || x) });
  } finally {
    lock.releaseLock();
  }
}

// Per un altro dispositivo: ?token=...&azione=dati restituisce l'ultimo work-out-dati.json
function doGet(e) {
  var q = (e && e.parameter) || {};
  if (q.azione !== "dati") return risposta_({ ok: true, app: "work-out", messaggio: "Collegamento attivo." });
  var p = PropertiesService.getScriptProperties();
  if (!q.token || q.token !== p.getProperty("TOKEN")) return risposta_({ ok: false, errore: "Codice non valido." });
  var id = p.getProperty("JSON");
  if (!id) return risposta_({ ok: false, errore: "Nessun dato ancora caricato." });
  return ContentService.createTextOutput(DriveApp.getFileById(id).getBlob().getDataAsString()).setMimeType(ContentService.MimeType.JSON);
}

function controllaCodice_(token) {
  if (!token || String(token).length < 16) return "Codice dell'app mancante.";
  var p = PropertiesService.getScriptProperties();
  var noto = p.getProperty("TOKEN");
  if (!noto) { p.setProperty("TOKEN", String(token)); return null; }
  return noto === String(token) ? null : "Codice dell'app diverso da quello registrato: questo script è già collegato a un altro telefono. Per ricollegarlo: in script.google.com → Impostazioni progetto → Proprietà dello script, cancella TOKEN.";
}

function cartella_() {
  var dir = DriveApp.getRootFolder();
  CARTELLA.forEach(function (n) {
    var it = dir.getFoldersByName(n);
    dir = it.hasNext() ? it.next() : dir.createFolder(n);
  });
  return dir;
}

function scriviFogli_(dir, fogli, p) {
  var ss = null, id = p.getProperty("FOGLIO");
  if (id) { try { ss = SpreadsheetApp.openById(id); if (DriveApp.getFileById(id).isTrashed()) ss = null; } catch (x) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create(FOGLIO);
    DriveApp.getFileById(ss.getId()).moveTo(dir);
    p.setProperty("FOGLIO", ss.getId());
  }
  Object.keys(fogli).forEach(function (nome) {
    var righe = fogli[nome];
    var sh = ss.getSheetByName(nome) || ss.insertSheet(nome);
    sh.clearContents();
    if (!righe.length) return;
    var larg = righe.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    var piene = righe.map(function (r) { var x = r.slice(); while (x.length < larg) x.push(""); return x; });
    sh.getRange(1, 1, piene.length, larg).setValues(piene);
    sh.setFrozenRows(1);
  });
  // il foglio vuoto creato con il file nuovo non serve
  var vuoto = ss.getSheetByName("Foglio1") || ss.getSheetByName("Sheet1");
  if (vuoto && ss.getSheets().length > 1) ss.deleteSheet(vuoto);
  return ss.getUrl();
}

function scriviJson_(dir, testo, p) {
  var f = null, id = p.getProperty("JSON");
  if (id) { try { f = DriveApp.getFileById(id); if (f.isTrashed()) f = null; } catch (x) { f = null; } }
  if (f) f.setContent(testo);
  else { f = dir.createFile(JSON_NOME, testo, "application/json"); p.setProperty("JSON", f.getId()); }
}

function pulisci_(s) { return String(s || "seduta").replace(/[\\/:*?"<>|]+/g, "-").slice(0, 120); }

function risposta_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Da eseguire una volta con il pulsante ▶ (Esegui) per dare i permessi a Drive e Fogli.
function prova() {
  var dir = cartella_();
  Logger.log("Cartella pronta: " + dir.getName() + " — ora pubblica come app web.");
}
