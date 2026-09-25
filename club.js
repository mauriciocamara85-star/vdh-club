/* ═══════════════════════════════════════════════════════════════════════════
   VDH · Club — lo que necesita la página del CLIENTE, y nada más.

   No usa `datos.js` a propósito. Ese archivo tiene las llamadas de adentro
   —el panel, los beneficios, la configuración— y la página del cliente no
   tiene por qué llevarlas en el celular de nadie. Acá hay dos funciones.

   La clave que viaja es la publicable de siempre, la misma que ya está en el
   repo. Lo que protege los datos no es esa clave: son las funciones de la
   base, que sólo devuelven una tarjeta si se les da su código.
   ═══════════════════════════════════════════════════════════════════════════ */

var BASE  = 'https://gfjdjupuwxohkgchqykx.supabase.co';
var CLAVE = 'sb_publishable_A81zY5i4zCXZyIv2fOpokA_jOxiccNU';

function llamar(fn, args) {
  return fetch(BASE + '/rest/v1/rpc/' + fn, {
    method: 'POST',
    headers: { apikey: CLAVE, 'Content-Type': 'application/json' },
    body: JSON.stringify(args || {})
  }).then(function (r) {
    return r.text().then(function (t) {
      var cuerpo = null;
      try { cuerpo = JSON.parse(t); } catch (e) { cuerpo = t; }
      if (!r.ok) {
        /* El mensaje de Postgres es el que sabe qué pasó —"ese número ya
           está anotado", "falta el nombre"—; el genérico es para cuando no
           hay ninguno. */
        var e = new Error((cuerpo && cuerpo.message) || 'No se pudo. Probá de nuevo.');
        e.delServidor = true;
        throw e;
      }
      return cuerpo;
    });
  });
}

var club = {
  /** Anotarse. Devuelve {alta:true, codigo} o {alta:false, porque}. */
  alta: function (nombre, telefono, local, cumple, acepta, mail) {
    return llamar('club_alta', {
      p_nombre: nombre, p_telefono: telefono,
      p_local: local || null, p_cumple: cumple || null,
      p_acepta: !!acepta, p_mail: mail || null
    });
  },

  /** La tarjeta, por su código y nada más. */
  tarjeta: function (codigo) {
    return llamar('club_tarjeta', { p_codigo: codigo });
  },

  /**
   * La tarjeta de este teléfono. Devuelve {hay:true, codigo, nombre} o
   * {hay:false, porque}.
   *
   * Desde el 24/09/2026 el teléfono TAMBIÉN es una credencial: quien lo
   * tiene puede abrir esa tarjeta. Es un cambio de modelo y está explicado
   * en club.sql, arriba de club_recuperar. La base frena el barrido de
   * números por origen; acá no hay nada que frenar.
   */
  recuperar: function (telefono) {
    return llamar('club_recuperar', { p_telefono: telefono });
  },

  /**
   * El cartel de la promo. La base lo devuelve sólo si está vigente, así
   * que acá no hay ninguna fecha que comparar: una tarjeta abierta con una
   * copia vieja de la página tampoco puede mostrar algo que ya venció.
   */
  aviso: function () {
    return llamar('club_aviso_ver', {});
  },

  /** Todas las promociones vigentes hoy, la más nueva primero. */
  promos: function () {
    return llamar('club_promos_ver', {});
  }
};

/** Guardar el código en el celular, para que la tarjeta se abra sola. */
var K_CLUB = 'vdh_club';
function guardarCodigo(c) { try { localStorage.setItem(K_CLUB, c); } catch (e) {} }
function codigoGuardado() { try { return localStorage.getItem(K_CLUB) || ''; } catch (e) { return ''; } }

/** El local por el que entró, que viene en el QR: club/?local=RIVADAVIA */
function localDelQR() {
  var m = /[?&]local=([^&]+)/.exec(location.search);
  return m ? decodeURIComponent(m[1]) : '';
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * "Mar del Plata" a partir de "MAR DEL PLATA".
 *
 * Las palabras cortas que unen —de, del, la, los, y— van en minúscula salvo
 * que arranquen el nombre. Poner mayúscula después de cada espacio dejaba
 * "Mar Del Plata" y "Villa Del Parque", que se lee como un cartel de oferta.
 *
 * Para los nombres de los locales conviene igual la lista de locales.js, que
 * los tiene escritos a mano: ahí DOT sigue siendo DOT y no "Dot".
 */
var MENUDAS = { de: 1, del: 1, la: 1, las: 1, los: 1, el: 1, y: 1 };

/* Las siglas se quedan como son. Hoy es una sola —el local del shopping
   DOT— pero sin esto quedaba "Dot", que parece un error de tipeo. */
var SIGLAS = { dot: 'DOT' };

function bonito(s) {
  return String(s || '').toLowerCase().split(/(\s+|-)/).map(function (p, i) {
    if (!/[a-záéíóúñ]/.test(p)) return p;
    if (SIGLAS[p]) return SIGLAS[p];
    if (i > 0 && MENUDAS[p]) return p;
    return p.charAt(0).toUpperCase() + p.slice(1);
  }).join('');
}
