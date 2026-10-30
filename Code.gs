/**
 * Receiver for the Trip Planning Pilot intake form.
 * Bound to a Google Sheet: each submission becomes one row.
 * Deploy as a Web app: Execute as "Me", access "Anyone".
 */
var SHEET_NAME = 'Intake';
var FIELDS = [
  'when', 'tripStart', 'tripEnd', 'month', 'days', 'who', 'groupSize', 'constraints', 'groupNote',
  'from', 'to', 'exploring', 'feel', 'effort', 'weather', 'budget',
  'lovedText', 'lovedTags', 'pace', 'vibes', 'water', 'why', 'avoid',
  'arrive', 'depart', 'booked', 'base',
  'planHours', 'planSources', 'contact', 'consent',
  'intakeSeconds', 'submittedAt'
];
var MAX_LEN = 2000;

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.website) return json_({ ok: true }); // honeypot: pretend success

    lock.waitLock(10000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['testerId', 'receivedAt'].concat(FIELDS));
      sheet.setFrozenRows(1);
    }
    var testerId = 'T' + ('00' + sheet.getLastRow()).slice(-3); // first data row -> T001
    var row = [testerId, new Date()];
    FIELDS.forEach(function (k) { row.push(clean_(data[k])); });
    sheet.appendRow(row);
    return json_({ ok: true, testerId: testerId });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet() {
  return ContentService.createTextOutput('ok');
}

function clean_(v) {
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) v = v.join(', ');
  v = String(v).slice(0, MAX_LEN);
  // stop spreadsheet formula injection
  if (/^[=+\-@]/.test(v) && !/^\+?[\d\s\-()]+$/.test(v)) v = "'" + v;
  return v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
