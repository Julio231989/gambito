const { assert, prueba, archivo, plano } = require('./marco');
const { cargarApp } = require('./cargar_app');

archivo('P6 · Captura rápida (captura de pantalla → IA → JSON corto → formulario)');

// JSON tal como lo devolvería la IA para la captura de 1xBet (Israel State Cup, minuto 57, 0-0).
const JSON_VIVO = JSON.stringify({
  tipo_captura: 'vivo', fuente: '1xBet', liga: 'Fútbol. Israel. State Cup',
  local: 'Hapoel Nir Ramat HaSharon', visitante: 'FC Bnei Eilat', ronda: 'Ronda 6',
  minuto: 57, marcador_local: 0, marcador_visitante: 0,
  cuotas: { local: null, empate: null, visitante: null, over25: null, under25: null, btts_si: null, btts_no: null, mas_075: 1.35 },
  legibilidad: 'alta', dudas: null,
});
const JSON_PREMATCH = JSON.stringify({
  tipo_captura: 'prematch', fuente: '1xBet', liga: 'Ecuador - Serie A', local: 'Barcelona SC', visitante: 'Emelec', ronda: null,
  minuto: null, marcador_local: null, marcador_visitante: null,
  cuotas: { local: '1,85', empate: 3.4, visitante: 4.2, over25: 1.9, under25: 1.95, btts_si: 1.8, btts_no: 2.0, mas_075: 1.3 },
  legibilidad: 'alta', dudas: null,
});

prueba('el prompt de captura pide solo transcripción, el JSON exacto y no inventa', () => {
  const p = cargarApp().ev('construirPromptCaptura()');
  assert.match(p, /NO analices/); assert.match(p, /NUNCA inventes/);
  ['tipo_captura', 'liga', 'local', 'visitante', 'minuto', 'marcador_local', 'marcador_visitante', 'mas_075', 'legibilidad', 'dudas'].forEach(k => assert.ok(p.includes('"' + k + '"'), k));
  assert.match(p, /2\.944, no 2\.94/);
  assert.ok(!/null,\s*\n\s*"fuente"/.test(p));
});

prueba('limpiarLigaCaptura convierte «Fútbol. Israel. State Cup» en «Israel - State Cup» y respeta lo que ya viene bien', () => {
  const a = cargarApp();
  assert.strictEqual(a.ev("limpiarLigaCaptura('Fútbol. Israel. State Cup')"), 'Israel - State Cup');
  assert.strictEqual(a.ev("limpiarLigaCaptura('Ecuador - Serie A')"), 'Ecuador - Serie A');
  assert.strictEqual(a.ev("limpiarLigaCaptura('  Football. England. Premier League ')"), 'England - Premier League');
});

prueba('liga: se empareja con un perfil existente (exacta o aproximada) y, si es ambigua, se deja el texto', () => {
  const a = cargarApp();
  a.ev(`PERFIL_LIGAS = [{liga:'Israel - State Cup'},{liga:'Ecuador - Serie A'},{liga:'Ecuador - Serie B'}]`);
  assert.deepStrictEqual(plano(a.ev("(()=>{const r=resolverLigaConPerfil('israel state cup');return [r.liga,r.coincidencia]})()")), ['Israel - State Cup', 'exacta']);
  assert.deepStrictEqual(plano(a.ev("(()=>{const r=resolverLigaConPerfil('Copa Israel State Cup 2026');return [r.liga,r.coincidencia]})()")), ['Israel - State Cup', 'aproximada']);
  assert.deepStrictEqual(plano(a.ev("(()=>{const r=resolverLigaConPerfil('Ecuador');return [r.liga,r.coincidencia]})()")), ['Ecuador', 'ninguna']);
});

prueba('captura en vivo → Nuevo registro: rellena liga, partido, minuto y marcador (no toca otras cosas)', () => {
  const a = cargarApp();
  const r = plano(a.ev(`procesarCaptura(${JSON.stringify(JSON_VIVO)}, 'gh')`));
  assert.strictEqual(r.cancelado, false);
  assert.strictEqual(a.getEl('f_liga').value, 'Israel - State Cup');
  assert.strictEqual(a.getEl('f_partido').value, 'Hapoel Nir Ramat HaSharon vs FC Bnei Eilat');
  assert.strictEqual(a.getEl('f_minuto').value, '57');
  assert.strictEqual(a.getEl('f_score_entrada_l').value, '0'); assert.strictEqual(a.getEl('f_score_entrada_v').value, '0');
  assert.strictEqual(a.getEl('sc_liga').value, '');
});

prueba('captura en vivo → Scout Core: rellena liga y partido, NO carga cuotas en vivo y lo avisa', () => {
  const a = cargarApp();
  const r = plano(a.ev(`procesarCaptura(${JSON.stringify(JSON_VIVO)}, 'sc')`));
  assert.strictEqual(a.getEl('sc_partido').value, 'Hapoel Nir Ramat HaSharon vs FC Bnei Eilat');
  assert.strictEqual(a.getEl('sc_cuota_local').value, '');
  assert.ok(r.avisos.some(x => /en vivo/.test(x)));
  assert.strictEqual(a.ev('window.__capOu075'), null);
});

prueba('captura prematch → Scout Core: carga las cuotas (coma decimal incluida) y deja lista la de Más de 0.75', () => {
  const a = cargarApp();
  a.ev(`PERFIL_LIGAS = [{liga:'Ecuador - Serie A'}]`);
  const r = plano(a.ev(`procesarCaptura(${JSON.stringify(JSON_PREMATCH)}, 'sc')`));
  assert.strictEqual(a.getEl('sc_cuota_local').value, '1.85');
  assert.strictEqual(a.getEl('sc_cuota_btts_no').value, '2');
  assert.strictEqual(a.getEl('sc_liga').value, 'Ecuador - Serie A');
  assert.strictEqual(a.ev('window.__capOu075'), 1.3);
  assert.ok(!r.avisos.some(x => /Sin perfil/.test(x)));
});

prueba('captura prematch → Nuevo registro: solo liga y partido, y avisa que para prematch existe Scout Core', () => {
  const a = cargarApp();
  const r = plano(a.ev(`procesarCaptura(${JSON.stringify(JSON_PREMATCH)}, 'gh')`));
  assert.strictEqual(a.getEl('f_minuto').value, '');
  assert.ok(r.avisos.some(x => /Scout Core/.test(x)));
});

prueba('validación: sin equipos, equipos iguales, cuotas absurdas y números inválidos', () => {
  const a = cargarApp();
  assert.throws(() => a.ev(`validarCaptura({liga:'x', local:'A', visitante:null})`), /local o el visitante/);
  assert.throws(() => a.ev(`validarCaptura({liga:'x', local:'Real', visitante:'real'})`), /iguales/);
  const v = plano(a.ev(`validarCaptura({liga:'x',local:'A',visitante:'B',tipo_captura:'vivo',minuto:'abc',marcador_local:99,cuotas:{local:0.5,over25:'1,90',mas_075:5000}})`));
  assert.strictEqual(v.datos.minuto, null); assert.strictEqual(v.datos.marcador_local, null);
  assert.deepStrictEqual(v.datos.cuotas, { over25: 1.9 });
  assert.ok(v.avisos.length >= 4);
});

prueba('legibilidad baja y dudas de la IA llegan al usuario como avisos', () => {
  const a = cargarApp();
  const v = plano(a.ev(`validarCaptura({liga:'x',local:'A',visitante:'B',legibilidad:'baja',dudas:'cuota cortada'})`));
  assert.ok(v.avisos.some(x => /legibilidad baja/.test(x))); assert.ok(v.avisos.some(x => /cuota cortada/.test(x)));
});

prueba('si el campo ya tiene otro dato pide confirmación; si cancelas, no cambia nada', () => {
  const a = cargarApp();
  a.getEl('f_partido').value = 'Otro vs Otro';
  a.sandbox.confirm = () => false;
  const r = plano(a.ev(`procesarCaptura(${JSON.stringify(JSON_VIVO)}, 'gh')`));
  assert.strictEqual(r.cancelado, true); assert.strictEqual(a.getEl('f_partido').value, 'Otro vs Otro'); assert.strictEqual(a.getEl('f_minuto').value, '');
});

prueba('tolera texto y ```json alrededor y no rompe el contrato del registro (solo rellena campos del formulario)', () => {
  const a = cargarApp();
  a.ev(`procesarCaptura('Claro, aquí está:\\n\`\`\`json\\n${JSON_VIVO.replace(/\\/g, '\\\\')}\\n\`\`\`', 'gh')`);
  assert.strictEqual(a.getEl('f_liga').value, 'Israel - State Cup');
  assert.strictEqual(a.ev('RECORDS.length'), 0); assert.strictEqual(a.ev('SCOUT_RECORDS.length'), 0); assert.strictEqual(a.ev('OUTBOX.length'), 0);
});

prueba('los dos paneles de captura se montan con sus botones', () => {
  const a = cargarApp();
  ['gh', 'sc'].forEach(t => { assert.ok(a.getEl('capturaBox' + (t === 'gh' ? 'Gh' : 'Sc')).innerHTML.includes('capPegar_' + t)); });
  assert.ok(a.html.includes('id="capturaBoxGh"') && a.html.includes('id="capturaBoxSc"'));
});

/* ---- Pantalla de ESTADÍSTICAS (la captura real de RC Lens - Sporting CP, minuto 65, 0-1) ---- */
const M = (xg, at, atp, pos, tp, tf, am, par, co, ro, pen, sus, pc, pp, cr) => ({ xg, ataques: at, ataques_peligrosos: atp, posesion: pos, tiros_puerta: tp, tiros_fuera: tf, amarillas: am, rojas: ro, paradas: par, corners: co, penaltis: pen, sustituciones: sus, pases_clave: pc, precision_pases: pp, centros: cr });
const JSON_STATS = JSON.stringify({
  tipo_captura: 'vivo', fuente: '1xBet', liga: 'UEFA - Liga de Campeones', local: 'RC Lens', visitante: 'Sporting CP',
  minuto: 65, marcador_local: 0, marcador_visitante: 1,
  metricas: { local: M(1.45, 88, 48, 56, 5, 12, 0, 3, 5, 0, 0, 2, 12, 88, 16), visitante: M(1.01, 55, 28, 44, 4, 4, 0, 5, 3, 0, 0, 1, 7, 83, 9) },
  cuotas: {}, legibilidad: 'alta', dudas: null,
});

prueba('el prompt describe la pantalla de estadísticas, el orden local/visitante y las 15 métricas con etiquetas en otros idiomas', () => {
  const p = cargarApp().ev('construirPromptCaptura()');
  ['xg', 'ataques', 'ataques_peligrosos', 'posesion', 'tiros_puerta', 'tiros_fuera', 'amarillas', 'rojas', 'paradas', 'corners', 'penaltis', 'sustituciones', 'pases_clave', 'precision_pases', 'centros'].forEach(k => assert.ok(p.includes('"' + k + '"'), k));
  assert.match(p, /Key Passes/); assert.match(p, /RC Lens - Sporting CP/); assert.match(p, /UEFA - Liga de Campeones/);
  assert.match(p, /No calcules, no sumes/);
});

prueba('captura de estadísticas → Nuevo registro: liga, partido, minuto 65, marcador 0-1, córners, tiros a puerta, posesión y xG', () => {
  const a = cargarApp();
  const r = plano(a.ev(`procesarCaptura(${JSON.stringify(JSON_STATS)}, 'gh')`));
  const v = (id) => a.getEl(id).value;
  assert.strictEqual(v('f_liga'), 'UEFA - Liga de Campeones'); assert.strictEqual(v('f_partido'), 'RC Lens vs Sporting CP');
  assert.strictEqual(v('f_minuto'), '65'); assert.strictEqual(v('f_score_entrada_l'), '0'); assert.strictEqual(v('f_score_entrada_v'), '1');
  assert.deepStrictEqual([v('f_corners1'), v('f_corners2'), v('f_tiros1'), v('f_tiros2'), v('f_pos1'), v('f_pos2'), v('f_xg1'), v('f_xg2')], ['5', '3', '5', '4', '56', '44', '1.45', '1.01']);
  assert.strictEqual(a.getEl('f_roja_previa').checked, false, 'sin rojas no se marca');
  assert.ok(r.avisos.some(x => /ataques peligrosos 48-28/.test(x) && /no se guarda/.test(x)));
});

prueba('las métricas sin campo en el registro no se guardan: el registro y el contrato quedan intactos', () => {
  const a = cargarApp();
  a.ev(`procesarCaptura(${JSON.stringify(JSON_STATS)}, 'gh')`);
  assert.strictEqual(a.ev('RECORDS.length'), 0); assert.strictEqual(a.ev('OUTBOX.length'), 0);
  const ids = plano(a.ev(`(() => { const d = validarCaptura(${JSON_STATS}).datos; return Object.keys(d.metricas.local); })()`));
  assert.strictEqual(ids.length, 15);
});

prueba('una tarjeta roja visible marca «Ya hubo tarjeta roja» y lo avisa; sin rojas nunca la desmarca', () => {
  const a = cargarApp();
  const conRoja = JSON.parse(JSON_STATS); conRoja.metricas.visitante.rojas = 1;
  const r = plano(a.ev(`procesarCaptura(${JSON.stringify(JSON.stringify(conRoja))}, 'gh')`));
  assert.strictEqual(a.getEl('f_roja_previa').checked, true); assert.ok(r.avisos.some(x => /tarjeta\(s\) roja/.test(x)));
  a.getEl('f_roja_previa').checked = true;
  a.ev(`procesarCaptura(${JSON.stringify(JSON_STATS)}, 'gh')`);
  assert.strictEqual(a.getEl('f_roja_previa').checked, true);
});

prueba('captura incompleta: filas ausentes quedan vacías y el resto se rellena; datos imposibles se ignoran con aviso', () => {
  const a = cargarApp();
  const j = JSON.parse(JSON_STATS);
  j.metricas.local.xg = null; j.metricas.visitante.xg = null; j.metricas.local.corners = 'abc'; j.metricas.local.posesion = 70; // suma 114
  const r = plano(a.ev(`procesarCaptura(${JSON.stringify(JSON.stringify(j))}, 'gh')`));
  assert.strictEqual(a.getEl('f_xg1').value, ''); assert.strictEqual(a.getEl('f_corners1').value, '');
  assert.strictEqual(a.getEl('f_corners2').value, '3'); assert.strictEqual(a.getEl('f_tiros1').value, '5');
  assert.ok(r.avisos.some(x => /corners/.test(x))); assert.ok(r.avisos.some(x => /posesión suma 114/.test(x)));
});

prueba('la misma captura en Scout Core: solo liga y partido y un aviso (las métricas en vivo no entran en el análisis prematch)', () => {
  const a = cargarApp();
  const r = plano(a.ev(`procesarCaptura(${JSON.stringify(JSON_STATS)}, 'sc')`));
  assert.strictEqual(a.getEl('sc_partido').value, 'RC Lens vs Sporting CP');
  assert.strictEqual(a.getEl('f_xg1').value, ''); assert.ok(r.avisos.some(x => /en vivo/.test(x)));
});
