/**
 * GAMBITO — backend en Google Apps Script
 * Sirve dos colecciones en el mismo Sheet: Registros (Goal Hunter) y Scout_Core
 * (motor prematch Gambito v3.0). Además expone lectura de Bitácora (escalado).
 * Despliega como Web App; la URL de despliegue es lo único que necesita el HTML.
 */

const TZ = 'America/Guayaquil'; // Ecuador, sin horario de verano

const BITACORA_SHEET_NAME = 'Bitacora';
const BITACORA_HEADERS = ['Bank roll inicial','stake','BR final planificado','BR final real','Reserva','Dif','Dia','fecha','Meta',
  'Excedente L2','Saldo L2 cierre','Resultado L2 dia','Saldo L2 vigente','Chequeo'];
// Columnas calculadas por el Sheet: la app NO puede escribirlas (así no se pisan las fórmulas por accidente).
const BITACORA_SOLO_LECTURA = ['stake','BR final planificado','Reserva','Dif','Excedente L2','Resultado L2 dia','Saldo L2 vigente','Chequeo'];

const REGISTROS_HEADERS = [
  'id','estado','fecha','minuto_entrada','score_entrada','partido','liga',
  'favorito','cuota_prepartido','posicion_tabla1','posicion_tabla2',
  'partidos_revisados_1','partidos_00_1','pct_00_1',
  'partidos_revisados_2','partidos_00_2','pct_00_2',
  'lluvia','corners1','tiros1','posesion1','xg1','corners2','tiros2','posesion2','xg2',
  'confianza','mercado','escenario_entrada','patron_tipo','cuota','stake',
  'prob_estimada','edge','ev','estrategia',
  'minuto_gol','score_final','resultado','cuota_cierre','clv','pl','observacion','fecha_cierre',
  'check_sofascore','check_flashscore','check_overlyzer','check_tarjeta_roja_previa','check_alineacion_ok',
  'dia_semana','nomarco_1','pct_nomarco_1','nomarco_2','pct_nomarco_2',
  'impulso_hubo','impulso_pensamiento','impulso_sesgos',
  'reflexion_seguiste_sistema','reflexion_rompiste_regla','reflexion_cual_regla',
  'reflexion_repetiria','reflexion_sesgos','reflexion_aprendizaje','icd_calidad',
  'minuto_inicio_analisis','minuto_fin_analisis','evento_durante_analisis','evento_detalle',
  'notas_alineacion_gh','notas_motivacion_gh'
];

const SCOUT_CORE_HEADERS = [
  'id','estado','fecha','partido','liga',
  'forma_l_anot','forma_l_rec','temp_l_anot','temp_l_rec',
  'forma_v_anot','forma_v_rec','temp_v_anot','temp_v_rec',
  'pts_l','pts_v','susp_l','susp_v','motivacion','sede_neutral','suerte_l','suerte_v',
  'cuota_local','cuota_empate','cuota_visitante','cuota_over25','cuota_under25','cuota_btts_si','cuota_btts_no',
  'apertura_local','apertura_visitante','xgs_local','xgs_empate','xgs_visitante',
  'rho_usado','lambda_local','lambda_visitante','adjustments_log',
  'mercado_recomendado','probabilidad_modelo','cuota_tomada','edge','ev','veto','divergencia_pp',
  'stake_kelly','semaforo','estrategia',
  'resultado','pl','cuota_cierre','clv','observacion','fecha_cierre',
  'dia_semana',
  'notas_alineacion_local','notas_alineacion_visitante',
  'notas_sentimiento_local','notas_sentimiento_visitante',
  'notas_h2h','notas_motivacion_contextual','notas_clima'
];

const PERFIL_LIGAS_HEADERS = ['id','liga','fecha_actualizacion','informe_completo','resumen_clave'];

const COLLECTIONS = {
  registros:    { sheetName: 'Registros',     headers: REGISTROS_HEADERS },
  scout_core:   { sheetName: 'Scout_Core',    headers: SCOUT_CORE_HEADERS },
  perfil_ligas: { sheetName: 'Perfil_Ligas',  headers: PERFIL_LIGAS_HEADERS }
};

function getCollection(name) {
  return COLLECTIONS[name] || COLLECTIONS.registros;
}

function getSheetFor(collectionName) {
  const col = getCollection(collectionName);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(col.sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(col.sheetName);
    sheet.appendRow(col.headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doGet(e) {
  const action = (e.parameter.action || 'list');
  const collection = e.parameter.collection || 'registros';
  if (action === 'list') return jsonResponse(getAllRecords(collection));
  if (action === 'bitacora') return jsonResponse(getBitacoraRow(e.parameter.fecha));
  if (action === 'bitacora_all') return jsonResponse(getBitacoraAll());
  return jsonResponse({ error: 'accion no reconocida' });
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ error: 'payload invalido' });
  }
  // Candado: con la bandeja de salida offline pueden llegar varios envíos casi a la vez;
  // sin esto, dos creaciones simultáneas pueden escribir en la misma fila.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return jsonResponse({ ok: false, error: 'servidor ocupado, reintenta' });
  }
  try {
    if (data.action === 'bitacora_set') return jsonResponse(setBitacoraValue(data.fecha, data.campo, data.valor));
    if (data.action === 'bitacora_activar_dia') return jsonResponse(activarDiaBitacora(data.fecha));
    const collection = data.collection || 'registros';
    if (data.action === 'create') return jsonResponse(createRecord(collection, data.record));
    if (data.action === 'update') return jsonResponse(updateRecord(collection, data.id, data.record));
    return jsonResponse({ error: 'accion no reconocida' });
  } finally {
    lock.releaseLock();
  }
}

function activarDiaBitacora(fechaStr) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(BITACORA_SHEET_NAME);
  if (!sheet) return { ok: false, error: 'no existe la pesta\u00f1a Bitacora' };
  const data = sheet.getDataRange().getValues();
  const fechaCol = BITACORA_HEADERS.indexOf('fecha');
  const diaCol = BITACORA_HEADERS.indexOf('Dia');
  // Si ya existe una fila con esa fecha, no duplicar — solo confirmar.
  for (let i = 1; i < data.length; i++) {
    const cell = data[i][fechaCol];
    const cellStr = cell instanceof Date ? Utilities.formatDate(cell, TZ, 'yyyy-MM-dd') : String(cell || '').trim();
    if (cellStr === fechaStr) {
      return { ok: true, ya_existia: true, dia: data[i][diaCol] };
    }
  }
  // Si no existe, usar la primera fila con fecha vacía (las filas ya vienen con fórmulas precargadas).
  for (let i = 1; i < data.length; i++) {
    const cell = data[i][fechaCol];
    const cellStr = cell instanceof Date ? Utilities.formatDate(cell, TZ, 'yyyy-MM-dd') : String(cell || '').trim();
    const bankrollInicial = data[i][BITACORA_HEADERS.indexOf('Bank roll inicial')];
    if (cellStr === '' && bankrollInicial !== '') {
      sheet.getRange(i + 1, fechaCol + 1).setNumberFormat('@').setValue(fechaStr);
      return { ok: true, ya_existia: false, dia: data[i][diaCol] };
    }
  }
  return { ok: false, error: 'no quedan filas libres en Bitacora (se acabó el rango precargado)' };
}

function setBitacoraValue(fechaStr, campo, valor) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(BITACORA_SHEET_NAME);
  if (!sheet) return { ok: false, error: 'no existe la pesta\u00f1a Bitacora' };
  const data = sheet.getDataRange().getValues();
  const fechaCol = BITACORA_HEADERS.indexOf('fecha');
  const campoCol = BITACORA_HEADERS.indexOf(campo);
  if (campoCol === -1) return { ok: false, error: 'campo invalido: ' + campo };
  if (BITACORA_SOLO_LECTURA.indexOf(campo) !== -1) return { ok: false, error: 'el campo "' + campo + '" lo calcula el Sheet y no se puede escribir desde la app' };
  if (campoCol + 1 > sheet.getMaxColumns()) return { ok: false, error: 'faltan las columnas de Linea 2 en Bitacora (J a N): agregalas como indica el README' };
  if (campo === 'Saldo L2 cierre') {
    // Único dato manual de la Línea 2: número >= 0, o vacío para borrar el cierre de ese día.
    if (valor === '' || valor === null || valor === undefined) {
      valor = '';
    } else {
      const n = Number(valor);
      if (!isFinite(n) || n < 0) return { ok: false, error: 'Saldo L2 invalido: debe ser un numero mayor o igual a 0' };
      valor = Math.round(n * 100) / 100;
    }
  }
  for (let i = 1; i < data.length; i++) {
    const cell = data[i][fechaCol];
    const cellStr = cell instanceof Date ? Utilities.formatDate(cell, TZ, 'yyyy-MM-dd') : String(cell || '').trim();
    if (cellStr === fechaStr) {
      sheet.getRange(i + 1, campoCol + 1).setValue(valor);
      return { ok: true };
    }
  }
  return { ok: false, error: 'no hay fila de Bitacora para esa fecha' };
}

const DATE_FIELDS = new Set(['fecha', 'fecha_cierre', 'fecha_actualizacion']);

function createRecord(collection, record) {
  const col = getCollection(collection);
  const sheet = getSheetFor(collection);
  // Idempotente: si el envío llegó pero la respuesta se perdió (señal débil), la app reintenta
  // el mismo 'create'. Si el id ya existe, se actualiza esa fila en vez de duplicarla.
  const idCol = col.headers.indexOf('id');
  if (record && record.id !== undefined && record.id !== '' && sheet.getLastRow() > 1) {
    const ids = sheet.getRange(2, idCol + 1, sheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(record.id)) {
        return updateRecord(collection, record.id, record);
      }
    }
  }
  const row = col.headers.map(h => (record[h] !== undefined ? record[h] : ''));
  const targetRow = sheet.getLastRow() + 1;
  col.headers.forEach((h, idx) => {
    if (DATE_FIELDS.has(h)) sheet.getRange(targetRow, idx + 1).setNumberFormat('@');
  });
  sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
  return { ok: true };
}

function updateRecord(collection, id, patch) {
  const col = getCollection(collection);
  const sheet = getSheetFor(collection);
  const data = sheet.getDataRange().getValues();
  const idCol = col.headers.indexOf('id');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      col.headers.forEach((h, colIdx) => {
        if (patch[h] !== undefined) {
          const cell = sheet.getRange(i + 1, colIdx + 1);
          if (DATE_FIELDS.has(h)) cell.setNumberFormat('@');
          cell.setValue(patch[h]);
        }
      });
      return { ok: true };
    }
  }
  return { ok: false, error: 'id no encontrado' };
}

function normalizeCell(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  }
  return v;
}

function getAllRecords(collection) {
  const col = getCollection(collection);
  const sheet = getSheetFor(collection);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const records = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    col.headers.forEach((h, idx) => obj[h] = normalizeCell(data[i][idx]));
    records.push(obj);
  }
  return records;
}

function getBitacoraRow(fechaStr) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(BITACORA_SHEET_NAME);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  const fechaCol = BITACORA_HEADERS.indexOf('fecha');
  for (let i = 1; i < data.length; i++) {
    const cell = data[i][fechaCol];
    let cellStr;
    if (cell instanceof Date) {
      cellStr = Utilities.formatDate(cell, TZ, 'yyyy-MM-dd');
    } else {
      cellStr = String(cell || '').trim();
    }
    if (cellStr === fechaStr) {
      const obj = {};
      BITACORA_HEADERS.forEach((h, idx) => obj[h] = data[i][idx]);
      return obj;
    }
  }
  return null; // no hay fila de Bitácora para esa fecha todavía
}

function fechaComoTexto(cell) {
  if (cell instanceof Date) return Utilities.formatDate(cell, TZ, 'yyyy-MM-dd');
  return String(cell === null || cell === undefined ? '' : cell).trim();
}

/**
 * Foto completa de la Bitácora para la app (consulta offline + chequeos).
 * Además cruza Registros de forma independiente de las fórmulas del Sheet:
 *  - suma_pl_registros por día (para comparar contra BR final real − Bank roll inicial)
 *  - huerfanos: registros con P/L cuya fecha no existe en Bitácora (no suman al bankroll)
 *  - plTexto: registros con P/L guardado como texto (SUMIFS lo ignora)
 */
function getBitacoraAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(BITACORA_SHEET_NAME);
  if (!sheet) return { ok: false, error: 'no existe la pestana Bitacora' };
  const nCols = Math.min(sheet.getMaxColumns(), BITACORA_HEADERS.length);
  const lastRow = sheet.getLastRow();
  const data = lastRow >= 1 ? sheet.getRange(1, 1, lastRow, nCols).getValues() : [];
  const cabecera = data.length ? data[0] : [];
  const l2Listo = BITACORA_HEADERS.slice(9).every(function (h, i) { return String(cabecera[9 + i] || '').trim() === h; });
  const fechaCol = BITACORA_HEADERS.indexOf('fecha');
  const filas = [];
  const fechas = {};
  for (let i = 1; i < data.length; i++) {
    const fecha = fechaComoTexto(data[i][fechaCol]);
    if (!fecha) continue; // filas futuras sin activar
    const obj = { fila: i + 1 };
    BITACORA_HEADERS.forEach(function (h, idx) {
      obj[h] = idx < nCols ? normalizeCell(data[i][idx]) : '';
    });
    obj.fecha = fecha;
    fechas[fecha] = true;
    filas.push(obj);
  }
  // Cruce con Registros
  const col = getCollection('registros');
  const regSheet = getSheetFor('registros');
  const sumaPorFecha = {};
  const huerfanos = [];
  const plTexto = [];
  const lastReg = regSheet.getLastRow();
  if (lastReg > 1) {
    const iId = col.headers.indexOf('id'), iFecha = col.headers.indexOf('fecha');
    const iPl = col.headers.indexOf('pl'), iPartido = col.headers.indexOf('partido');
    const reg = regSheet.getRange(2, 1, lastReg - 1, col.headers.length).getValues();
    reg.forEach(function (row) {
      const pl = row[iPl];
      if (pl === '' || pl === null) return; // abierto o sin cerrar
      const f = fechaComoTexto(row[iFecha]);
      const base = { id: row[iId], fecha: f, partido: row[iPartido] };
      if (typeof pl !== 'number') { base.pl = String(pl); plTexto.push(base); return; }
      base.pl = pl;
      if (!f || !fechas[f]) { huerfanos.push(base); return; }
      sumaPorFecha[f] = (sumaPorFecha[f] || 0) + pl;
    });
  }
  filas.forEach(function (f) { f.suma_pl_registros = Math.round((sumaPorFecha[f.fecha] || 0) * 100) / 100; });
  return {
    ok: true,
    ts: Date.now(),
    l2Listo: l2Listo,
    sheetUrl: ss.getUrl() + '#gid=' + sheet.getSheetId(),
    filas: filas,
    huerfanos: huerfanos,
    plTexto: plTexto
  };
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
