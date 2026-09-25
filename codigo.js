/* ═══════════════════════════════════════════════════════════════════════════
   VDH · Club — dibujar el código de barras de la tarjeta.

   Code 128, juego C. Sesenta líneas y ninguna librería: este proyecto no
   tiene una sola dependencia y no vale la pena estrenar uno para esto.

   ── Por qué Code 128 y no un QR ──
   Las pistolas que hay en los locales son láser, y **un láser no puede leer
   un QR nunca**: barre una línea y el QR guarda la información en dos
   dimensiones. Un código de barras común lo lee cualquier lector, láser o
   2D. El QR sólo lo leen los 2D.

   ── Por qué el juego C ──
   El juego C empaqueta DOS dígitos en cada símbolo de 11 módulos. Los doce
   dígitos del código entran en seis símbolos en vez de doce: la mitad de
   ancho, que en la pantalla de un celular es la diferencia entre que se lea
   y que no.

   ── Lo único que no se puede comprobar desde acá ──
   Que un lector de verdad lo lea. La tabla de patrones se valida sola más
   abajo —todo patrón de Code 128 suma 11 módulos y sus barras suman par—,
   pero eso descarta un error de transcripción, no un lector que no llegue a
   enfocar. Eso se prueba con una pistola y un celular, y es la prueba que
   Mauricio va a hacer.
   ═══════════════════════════════════════════════════════════════════════════ */

/* Los 107 patrones, en anchos: barra, espacio, barra, espacio, barra, espacio.
   El 105 es el arranque del juego C y el 106 es el final (siete anchos). */
var CODE128 = [
  '212222','222122','222221','121223','121322','131222','122213','122312',
  '132212','221213','221312','231212','112232','122132','122231','113222',
  '123122','123221','223211','221132','221231','213212','223112','312131',
  '311222','321122','321221','312212','322112','322211','212123','212321',
  '232121','111323','131123','131321','112313','132113','132311','211313',
  '231113','231311','112133','112331','132131','113123','113321','133121',
  '313121','211331','231131','213113','213311','213131','311123','311321',
  '331121','312113','312311','332111','314111','221411','431111','111224',
  '111422','121124','121421','141122','141221','112214','112412','122114',
  '122411','142112','142211','241211','221114','413111','241112','134111',
  '111242','121142','121241','114212','124112','124211','411212','421112',
  '421211','212141','214121','412121','111143','111341','131141','114113',
  '114311','411113','411311','113141','114131','311141','411131','211412',
  '211214','211232','2331112'
];

/**
 * La tabla, comprobada contra dos propiedades del estándar.
 *
 * No prueba que un lector lo lea, pero sí que ningún patrón se haya copiado
 * mal: un dígito cambiado rompe casi siempre una de las dos. Se corre una
 * vez al cargar y, si algo está mal, lo dice en la consola en vez de dibujar
 * un código que nadie va a poder escanear.
 */
(function validarTabla() {
  var malos = [];
  for (var i = 0; i < CODE128.length; i++) {
    var p = CODE128[i], total = 0, barras = 0;
    for (var j = 0; j < p.length; j++) {
      var n = +p[j];
      total += n;
      if (j % 2 === 0) barras += n;
    }
    var esperado = (i === 106) ? 13 : 11;
    if (total !== esperado || barras % 2 !== 0) malos.push(i);
  }
  if (malos.length && typeof console !== 'undefined') {
    console.error('Code 128: patrones mal copiados en ' + malos.join(', '));
  }
})();

/**
 * Devuelve el SVG del código, listo para meter en un innerHTML.
 *
 * `digitos` tiene que ser una cantidad PAR de dígitos: el juego C va de a
 * pares y uno suelto no se puede codificar.
 */
function codigoDeBarras(digitos, alto) {
  var d = String(digitos || '').replace(/[^0-9]/g, '');
  if (!d || d.length % 2 !== 0) return '';

  var valores = [105];                       // arranque del juego C
  for (var i = 0; i < d.length; i += 2) valores.push(+d.substr(i, 2));

  /* La suma de control: el arranque más cada valor por su posición, módulo
     103. Sin esto el lector lee el código y lo descarta. */
  var suma = 105;
  for (var k = 1; k < valores.length; k++) suma += valores[k] * k;
  valores.push(suma % 103);
  valores.push(106);                         // final

  /* Se dibuja en unidades de módulo y el SVG lo estira: así el ancho lo
     decide el CSS y no hace falta saber acá cuánto mide la pantalla. */
  var x = 0, barras = '';
  valores.forEach(function (v) {
    var p = CODE128[v];
    for (var j = 0; j < p.length; j++) {
      var w = +p[j];
      if (j % 2 === 0) barras += '<rect x="' + x + '" y="0" width="' + w + '" height="100"/>';
      x += w;
    }
  });

  /* Diez módulos de margen a cada lado. El estándar los pide y no es un
     detalle decorativo: sin zona muda el lector no sabe dónde empieza. */
  var ancho = x + 20;
  return '<svg viewBox="0 0 ' + ancho + ' 100" preserveAspectRatio="none" ' +
         'style="width:100%;height:' + (alto || 90) + 'px;display:block" ' +
         'shape-rendering="crispEdges" aria-hidden="true">' +
         '<rect x="0" y="0" width="' + ancho + '" height="100" fill="#fff"/>' +
         '<g fill="#000" transform="translate(10,0)">' + barras + '</g></svg>';
}

/** Los doce dígitos, agrupados de a cuatro para poder dictarlos. */
function codigoBonito(d) {
  var s = String(d || '').replace(/[^0-9]/g, '');
  return s.replace(/(\d{4})(?=\d)/g, '$1 ');
}
