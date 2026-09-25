/* ═══════════════════════════════════════════════════════════════════════════
   Los locales VDH, para la pantalla que ve el CLIENTE.

   ¿Por qué acá y no en la base, si existe la tabla `locales`?

   Porque esa tabla guarda el NOMBRE y nada más: es la lista del selector de
   la pantalla de Carga, no un directorio. Las direcciones no están ahí, así
   que no hay nada que duplicar.

   Y porque esto lo abre un cliente parado en la calle: un archivo que viaja
   con la página se ve al instante y sin señal, y no cuesta un viaje a la
   base para mostrar catorce direcciones que cambian una vez por año.

   **El `codigo` tiene que coincidir con la tabla `locales`.** Es lo único
   que ata este archivo al resto del sistema, y ya nos mordió una vez: el
   24/09/2026 hubo que renombrar dos locales en siete tablas porque el
   nombre viaja adentro de cada registro.

   El día que haya que editar esto desde Configuración, se muda a la base con
   dos columnas más. Hoy sería una cañería para nada.
   ═══════════════════════════════════════════════════════════════════════════ */

var LOCALES_VDH = [
  { codigo: 'CASEROS',            nombre: 'Caseros',
    lat: -34.6082063, lng: -58.5641809,
    dir: '3 de Febrero 2823',                             zona: 'Caseros',
    hora: 'Lunes a sábados de 9 a 20:30' },

  { codigo: 'DOT',                nombre: 'DOT',
    lat: -34.5457549, lng: -58.4886799,
    dir: 'Vedia 3600, local 056',                         zona: 'Shopping DOT · CABA',
    hora: 'Todos los días de 10 a 22' },

  { codigo: 'FLORES',             nombre: 'Flores',
    lat: -34.6280613, lng: -58.4607126,
    dir: 'Av. Rivadavia 6757',                            zona: 'CABA',
    hora: 'Lunes a sábados de 9 a 20:30' },

  { codigo: 'GRAND BOURG',        nombre: 'Grand Bourg',
    lat: -34.4864512, lng: -58.7256373,
    dir: 'Av. Eva Perón 1434',                            zona: 'Grand Bourg',
    hora: 'Lunes a sábados de 9 a 20:30' },

  { codigo: 'ITUZAINGÓ',          nombre: 'Ituzaingó',
    lat: -34.6592212, lng: -58.6682757,
    dir: 'Coronel Pablo Zufriategui 940',                 zona: 'Ituzaingó',
    hora: 'Lunes a sábados de 9 a 20:30' },

  { codigo: 'LOMAS DE ZAMORA',    nombre: 'Lomas de Zamora',
    lat: -34.7605528, lng: -58.4019821,
    dir: 'Laprida 380',                                   zona: 'Lomas de Zamora',
    hora: 'Lunes a sábados de 9 a 20:30' },

  { codigo: 'MAR DEL PLATA',      nombre: 'Mar del Plata',
    lat: -38.0003352, lng: -57.5472193,
    dir: 'Rivadavia 2579',                                zona: 'Mar del Plata',
    hora: 'Lunes a sábados de 9 a 21 · domingos de 10 a 21' },

  { codigo: 'MORÓN',              nombre: 'Morón',
    lat: -34.6493715, lng: -58.6209339,
    dir: 'Av. Rivadavia 18290',                           zona: 'Morón',
    hora: 'Lunes a sábados de 9 a 20:30' },

  { codigo: 'PACHECO',            nombre: 'Pacheco',
    lat: -34.4601914, lng: -58.6346208,
    dir: 'Av. Hipólito Yrigoyen 871',                     zona: 'General Pacheco',
    hora: 'Lunes a sábados de 9 a 20:30' },

  { codigo: 'PARQUE BROWN',       nombre: 'Parque Brown',
    lat: -34.675453, lng: -58.459394,
    dir: 'Av. F. Fernández de la Cruz 4602, local 1038',  zona: 'Shopping Parque Brown · CABA',
    hora: 'Todos los días de 10 a 22' },

  { codigo: 'SAN JUSTO',          nombre: 'San Justo',
    lat: -34.678939, lng: -58.5601992,
    dir: 'Av. Dr. Ignacio Arieta 3163',                   zona: 'San Justo',
    hora: 'Lunes a sábados de 9 a 20:30' },

  { codigo: 'SAN JUSTO SHOPPING', nombre: 'San Justo Shopping',
    lat: -34.6848089, lng: -58.5573727,
    dir: 'Av. Brig. J. M. de Rosas 3910, local 11',       zona: 'San Justo',
    hora: 'Todos los días de 10 a 22' },

  { codigo: 'UNICENTER',          nombre: 'Unicenter',
    lat: -34.5081762, lng: -58.527121,
    dir: 'Paraná 3745, local 2152',                       zona: 'Unicenter · Martínez',
    hora: 'Todos los días de 10 a 22' },

  { codigo: 'VILLA DEL PARQUE',   nombre: 'Villa del Parque',
    lat: -34.6029909, lng: -58.4939357,
    dir: 'Cuenca 2889',                                   zona: 'CABA',
    hora: 'Lunes a sábados de 9 a 20:30' }
];

/**
 * El enlace para "cómo llegar".
 *
 * Va con la dirección en TEXTO aunque ahora haya coordenadas, y es a
 * propósito: así Maps muestra el nombre del lugar como destino. Con
 * "query=-34.54,-58.48" el cliente ve un par de números donde debería decir
 * VDH, y encima pierde la ficha del local que Google ya tiene armada.
 *
 * Las coordenadas están para otra cosa: calcular cuál queda más cerca.
 *
 * `api=1` es la forma oficial y estable: abre la app de Maps en el celular
 * y el sitio en la computadora, sin necesitar ninguna clave.
 */
function comoLlegar(local) {
  var q = local.nombre + ', ' + local.dir + ', ' + local.zona + ', Argentina';
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
}

/**
 * Cuántos kilómetros hay entre dos puntos, en línea recta.
 *
 * Fórmula del semiverseno. Es la distancia "de pájaro", no la que se maneja:
 * para ordenar catorce locales y decir cuál queda más cerca alcanza y sobra,
 * y calcular la distancia real pediría una clave de Google y un viaje a sus
 * servidores por cada local.
 *
 * Las coordenadas salen del "Mis Mapas" que armó Mauricio —las mismas
 * chinches que él corrigió a mano— así que apuntan a la puerta del local y
 * no a la esquina.
 */
function distanciaKm(lat1, lng1, lat2, lng2) {
  var R = 6371;                                  // radio de la Tierra, km
  var aRad = Math.PI / 180;
  var dLat = (lat2 - lat1) * aRad;
  var dLng = (lng2 - lng1) * aRad;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * aRad) * Math.cos(lat2 * aRad) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** "1,2 km" o "800 m": abajo del kilómetro, los metros se leen mejor. */
function distanciaLinda(km) {
  if (km < 1) return Math.round(km * 100) * 10 + ' m';
  if (km < 10) return km.toFixed(1).replace('.', ',') + ' km';
  return Math.round(km) + ' km';
}
