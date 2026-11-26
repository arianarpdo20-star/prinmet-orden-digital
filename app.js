/* PRINMET · Orden Digital — funciones compartidas */
const App = (() => {
  const KEY = 'prinmet_ordenes_v1';
  const ESTADOS = ['Recibida', 'Cotizada', 'En reparación', 'Lista'];
  const CLASE = { 'Recibida': 'recibida', 'Cotizada': 'cotizada', 'En reparación': 'reparacion', 'Lista': 'lista' };
  const H = 36e5, D = 864e5;
  const TARIFA_TORNO = 80;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const qs = n => new URLSearchParams(location.search).get(n);
  const money = n => 'S/ ' + Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const iso = ms => new Date(ms).toISOString();
  const hoy = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const enDias = n => new Date(Date.now() + n * D - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

  function fecha(v) {
    if (!v) return '—';
    const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + 'T12:00:00') : new Date(v);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function fechaDia(v) {
    if (!v) return '—';
    const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + 'T12:00:00') : new Date(v);
    const t = d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function fechaHora(v) {
    if (!v) return '—';
    return new Date(v).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  const maquinaId = t => String(t || '').trim().toUpperCase().replace(/\s+/g, '-');

  /* ---------- Datos de ejemplo (tablero del PDF) ---------- */
  function seed() {
    const n = Date.now();
    const t = h => iso(n - h * H);
    const hist = (...p) => p.map(([estado, h]) => ({ estado, fecha: t(h) }));
    const q = (materialDesc, material, horas, manoObra) => ({ materialDesc, material, horas, tarifa: TARIFA_TORNO, manoObra, total: material + horas * TARIFA_TORNO + manoObra });
    const h = (...a) => a.map(([texto, ok]) => ({ texto, ok }));
    return [
      {
        numero: 'OT-210', cliente: 'Metalmecánica Andina S.A.C.', maquina: 'TORNO-CNC-2',
        falla: 'Buje de bronce', urgencia: 'Baja', estado: 'Lista',
        creada: t(100), cotizadaEn: t(95), entrega: enDias(-1), limiteCliente: enDias(1),
        hallazgos: h(['Buje original con desgaste excesivo', true], ['Alojamiento sin deformaciones', true]),
        fotos: [], cotizacion: q('bronce SAE 40, barra 1½ pulgada', 95, 2, 60),
        historial: hist(['Recibida', 100], ['Cotizada', 95], ['En reparación', 80], ['Lista', 30])
      },
      {
        numero: 'OT-212', cliente: 'Bombas del Sur E.I.R.L.', maquina: 'BOMBA-2',
        falla: 'Eje de bomba', urgencia: 'Media', estado: 'En reparación',
        creada: t(70), cotizadaEn: t(40), entrega: enDias(2), limiteCliente: enDias(3),
        hallazgos: h(['Eje doblado 0.4 mm', true], ['Chavetero dañado', true], ['Sello mecánico por cambiar', false]),
        fotos: [], cotizacion: q('acero 4140, barra 1 pulgada', 150, 3, 100),
        historial: hist(['Recibida', 70], ['Cotizada', 40], ['En reparación', 30])
      },
      {
        numero: 'OT-214', cliente: 'Plásticos Lima S.A.C.', maquina: 'TORNO-CNC-2',
        falla: 'Eje detenido, ruido metálico', urgencia: 'Alta', estado: 'En reparación',
        creada: t(6), cotizadaEn: t(2.5), entrega: enDias(1), limiteCliente: enDias(0),
        hallazgos: h(['Eje principal desgastado', true], ['Rodamiento con juego', true], ['Sin fisuras visibles en el cabezal', true]),
        fotos: [], notaVoz: { seg: 18, simulada: true }, cotizacion: q('acero, barra 2 pulgadas', 180, 3, 120),
        historial: hist(['Recibida', 6], ['Cotizada', 2.5], ['En reparación', 1])
      },
      {
        numero: 'OT-215', cliente: 'Transmisiones Rímac S.A.C.', maquina: 'FRESADORA-1',
        falla: 'Piñón de acero', urgencia: 'Media', estado: 'Cotizada',
        creada: t(22), cotizadaEn: t(4), entrega: enDias(3), limiteCliente: enDias(5),
        hallazgos: h(['Piñón con dientes rotos, se fabrica uno nuevo', true]),
        fotos: [], cotizacion: q('acero 1045, barra 3 pulgadas', 220, 4, 150),
        historial: hist(['Recibida', 22], ['Cotizada', 4])
      },
      {
        numero: 'OT-216', cliente: 'Estructuras Callao S.A.C.', maquina: 'SOLDADORA-1',
        falla: 'Soldadura de bastidor', urgencia: 'Media', estado: 'Recibida',
        creada: t(1.5), cotizadaEn: null, entrega: '', limiteCliente: enDias(4),
        hallazgos: [], fotos: [], cotizacion: null, historial: hist(['Recibida', 1.5])
      }
    ].map(o => ({ ...o, actualizada: Date.parse(o.historial[o.historial.length - 1].fecha) }));
  }

  /* ---------- Almacenamiento ---------- */
  function leerRaw() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function guardar(lista) {
    try { localStorage.setItem(KEY, JSON.stringify(lista)); return true; }
    catch (e) { toast('No se pudo guardar: el almacenamiento está lleno. Usa menos fotos.'); return false; }
  }
  function ordenes() {
    let l = leerRaw();
    if (!Array.isArray(l)) { l = seed(); guardar(l); }
    return l;
  }
  const ordenesSinSeed = () => { const l = leerRaw(); return Array.isArray(l) ? l : []; };
  const get = num => ordenes().find(o => o.numero === num);
  function guardarOrden(o) {
    o.actualizada = Date.now();
    const l = ordenesSinSeed();
    const i = l.findIndex(x => x.numero === o.numero);
    if (i >= 0) l[i] = o; else l.push(o);
    return guardar(l);
  }
  function nextNumero() {
    const max = ordenes().reduce((m, o) => Math.max(m, parseInt(String(o.numero).replace(/\D/g, ''), 10) || 0), 0);
    return 'OT-' + (max + 1);
  }
  function crearOrden(d) {
    const o = {
      numero: nextNumero(), cliente: d.cliente, maquina: maquinaId(d.maquina), falla: d.falla,
      urgencia: d.urgencia, estado: 'Recibida', creada: iso(Date.now()), cotizadaEn: null,
      entrega: '', limiteCliente: d.limiteCliente || '', hallazgos: [], fotos: d.fotos || [],
      cotizacion: null, historial: [{ estado: 'Recibida', fecha: iso(Date.now()) }]
    };
    return guardarOrden(o) ? o : null;
  }
  function setEstado(o, estado, nota) {
    o.estado = estado;
    o.historial = o.historial || [];
    o.historial.push({ estado, fecha: iso(Date.now()), ...(nota ? { nota } : {}) });
    return guardarOrden(o);
  }
  function siguiente(o) {
    const i = ESTADOS.indexOf(o.estado);
    return i >= 0 && i < ESTADOS.length - 1 ? ESTADOS[i + 1] : null;
  }
  const totalCot = c => c ? (Number(c.material) || 0) + (Number(c.horas) || 0) * (Number(c.tarifa) || 0) + (Number(c.manoObra) || 0) : 0;

  /* ---------- Medición ---------- */
  function metricas(lista = ordenes()) {
    const cot = lista.filter(o => o.cotizadaEn);
    const rapidas = cot.filter(o => Date.parse(o.cotizadaEn) - Date.parse(o.creada) < D);
    // "Registro completo": la orden tiene diagnóstico (hallazgos) y fecha estimada de entrega.
    const completas = lista.filter(o => (o.hallazgos || []).length > 0 && o.entrega);
    return {
      total: lista.length, cotizadas: cot.length, rapidas: rapidas.length,
      pctRapidas: cot.length ? Math.round(rapidas.length / cot.length * 100) : 0,
      completas: completas.length,
      pctCompletas: lista.length ? Math.round(completas.length / lista.length * 100) : 0
    };
  }

  /* ---------- Link de cliente y WhatsApp ---------- */
  // El link lleva una copia compacta de la orden (sin fotos) para que el cliente la vea desde su propio celular.
  function enc(o) {
    const s = {
      numero: o.numero, cliente: o.cliente, maquina: o.maquina, falla: o.falla, urgencia: o.urgencia,
      estado: o.estado, creada: o.creada, cotizadaEn: o.cotizadaEn, entrega: o.entrega, limiteCliente: o.limiteCliente,
      hallazgos: o.hallazgos, cotizacion: o.cotizacion, historial: o.historial, actualizada: o.actualizada
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(s)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function dec(t) {
    try {
      t = t.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(t))));
    } catch (e) { return null; }
  }
  function urlCliente(o) {
    const u = new URL('cliente.html', location.href);
    u.search = ''; u.hash = '';
    u.searchParams.set('orden', o.numero);
    u.searchParams.set('d', enc(o));
    return u.toString();
  }
  function mensajeWA(o) {
    const maq = String(o.maquina).toLowerCase().replace(/-/g, ' ').replace('cnc', 'CNC');
    const ref = `${o.numero} (${maq})`;
    const entrega = o.entrega ? ` Entrega estimada: ${fechaDia(o.entrega).toLowerCase()}.` : '';
    let cuerpo;
    if (o.estado === 'Recibida') cuerpo = `Recibido. Registramos su orden ${ref}. Le enviaremos el diagnóstico y la cotización lo antes posible.`;
    else if (o.estado === 'Cotizada') cuerpo = `Le enviamos la cotización de la ${ref}. Total: ${money(o.cotizacion ? (o.cotizacion.total ?? totalCot(o.cotizacion)) : 0)}.${entrega}
¿Desea aprobarla para iniciar la reparación?`;
    else if (o.estado === 'En reparación') cuerpo = `Gracias. Su orden ${ref} está ahora EN REPARACIÓN.${entrega}
Le avisaremos cuando esté lista.`;
    else cuerpo = `Su orden ${ref} está LISTA. Puede recogerla en el taller de Villa El Salvador o coordinamos la entrega.
Quedó registrada en el historial de su máquina.`;
    return `PRINMET Taller
${cuerpo}

Estado: ${o.estado}
Ver estado de mi orden: ${urlCliente(o)}`;
  }
  const waLink = o => 'https://wa.me/?text=' + encodeURIComponent(mensajeWA(o));
  const waGenerico = txt => 'https://wa.me/?text=' + encodeURIComponent(txt);

  /* ---------- UI ---------- */
  function topbar(activo) {
    const el = $('#topbar');
    if (!el) return;
    el.innerHTML = `
      <a class="marca" href="index.html"><span class="logo">P</span><span>PRINMET<small>Orden Digital</small></span></a>
      <nav>
        <a href="index.html" class="${activo === 'tablero' ? 'on' : ''}">Tablero</a>
        <a href="nueva-orden.html" class="nueva ${activo === 'nueva' ? 'on' : ''}">+ Nueva</a>
      </nav>`;
  }
  function hero(titulo, sub) {
    const h = document.querySelector('header.topbar') || document.body.firstElementChild;
    let el = $('#hero');
    if (!el) { el = document.createElement('div'); el.id = 'hero'; el.className = 'hero'; h.insertAdjacentElement('afterend', el); }
    el.innerHTML = `<div class="k">PRINMET</div><h1>${esc(titulo)}</h1><p>${esc(sub || '')}</p>`;
  }
  const badgeEstado = e => `<span class="badge e-${CLASE[e] || 'recibida'}">${esc(e)}</span>`;
  const badgeUrg = u => `<span class="badge u-${esc(String(u).toLowerCase().replace('í', 'i'))}">${esc(String(u).toUpperCase())}</span>`;

  let toastTimer;
  function toast(msg) {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 3200);
  }

  function comprimir(file, max = 900, q = 0.65) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onerror = rej;
      r.onload = () => {
        const img = new Image();
        img.onerror = rej;
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', q));
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }

  function reiniciar() {
    if (confirm('Se borrarán todas las órdenes y se volverán a cargar las 5 de ejemplo. ¿Continuar?')) {
      try { localStorage.removeItem(KEY); } catch (e) { }
      location.href = 'index.html';
    }
  }

  return {
    ESTADOS, TARIFA_TORNO, $, $$, esc, qs, money, fecha, fechaDia, fechaHora, hoy, enDias, maquinaId,
    ordenes, ordenesSinSeed, get, guardarOrden, crearOrden, nextNumero, setEstado, siguiente, totalCot,
    metricas, urlCliente, enc, dec, mensajeWA, waLink, waGenerico,
    topbar, hero, badgeEstado, badgeUrg, toast, comprimir, reiniciar
  };
})();
