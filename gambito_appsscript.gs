/**
 * GAMBITO — backend en Google Apps Script
 * Sirve dos colecciones en el mismo Sheet: Registros (Goal Hunter) y Scout_Core
 * (motor prematch Gambito v3.0). Además expone lectura de Bitácora (escalado).
 * Despliega como Web App; la URL de despliegue es lo único que necesita el HTML.
 */

const TZ = 'America/Guayaquil'; // Ecuador, sin horario de verano

const BITACORA_SHEET_NAME = 'Bitacora';
const BITACORA_HEADERS = ['Bank roll inicial','stake','BR final planificado','BR final real','Reserva','Dif','Dia','fecha','Meta'];

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
  return jsonResponse({ error: 'accion no reconocida' });
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ error: 'payload invalido' });
  }
  if (data.action === 'bitacora_set') return jsonResponse(setBitacoraValue(data.fecha, data.campo, data.valor));
  if (data.action === 'bitacora_activar_dia') return jsonResponse(activarDiaBitacora(data.fecha));
  const collection = data.collection || 'registros';
  if (data.action === 'create') return jsonResponse(createRecord(collection, data.record));
  if (data.action === 'update') return jsonResponse(updateRecord(collection, data.id, data.record));
  return jsonResponse({ error: 'accion no reconocida' });
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

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
