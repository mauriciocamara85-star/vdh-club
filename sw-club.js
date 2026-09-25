/* ═══════════════════════════════════════════════════════════════════════════
   VDH Club · el service worker de la tarjeta del CLIENTE.

   Es otro que el `sw.js` de la raíz, y a propósito: aquel es de la
   herramienta de trabajo —cinco pantallas, la cola de registros, la base— y
   esto lo lleva en el celular alguien que compra ropa. No tienen por qué
   compartir caché ni versiones.

   Sirve para dos cosas:

   1. Que Android ofrezca instalar la tarjeta. Chrome pide un manifest Y un
      service worker con manejador de fetch para mostrar el botón; sin esto
      el cliente tiene que ir a buscar "Agregar a la pantalla principal" en
      el menú, que es donde se pierde el 90%.

   2. Que la tarjeta ABRA SIN SEÑAL. Es lo que más vale de todo esto: el
      cliente está parado en la caja de un shopping, que es exactamente
      donde no hay señal —el mismo motivo por el que el formulario de los
      vendedores tiene una cola offline—. Lo único que necesita ahí es que
      se vea el código de barras.

   Los DATOS de la tarjeta no se cachean acá: viajan en un POST y la Cache
   API no guarda respuestas de POST. De eso se encarga la propia página,
   que se guarda la última tarjeta que vio. Ver tarjeta.html.

   Estrategia: RED PRIMERO. Con señal siempre se ve lo publicado; el caché
   es la red de contención.

   Al tocar cualquiera de estos archivos, subir CACHE. Ese cambio de nombre
   es lo que borra el caché viejo de los celulares.
   ═══════════════════════════════════════════════════════════════════════════ */
const CACHE = 'vdh-club-v18';

const BASICOS = [
  './tarjeta.html',
  './index.html',
  './club.js',
  './locales.js',
  './codigo.js',
  './tarjeta.webmanifest',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', (evento) => {
  self.skipWaiting();
  evento.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(BASICOS)).catch(() => { /* sin caché, anda igual */ })
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nombres) => Promise.all(
      /* Sólo los del club: el caché de la app de los vendedores vive en el
         mismo origen y no es asunto de este service worker. */
      nombres.filter((n) => n.indexOf('vdh-club-') === 0 && n !== CACHE)
             .map((n) => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

/* ── Las notificaciones ──
   El 'push' llega con el navegador cerrado: lo despierta el sistema
   operativo, no la página. Por eso vive acá y no en tarjeta.html.

   Si el mensaje viniera roto igual se muestra algo: un push que llega y no
   dibuja nada le deja al cliente una notificación fantasma —el teléfono
   vibró y no hay nada— y encima algunos navegadores castigan al sitio que
   recibe un push y no notifica. */
self.addEventListener('push', (evento) => {
  let d = {};
  try { d = evento.data ? evento.data.json() : {}; } catch (e) { d = {}; }

  const titulo = d.titulo || 'VDH Club';
  evento.waitUntil(
    self.registration.showNotification(titulo, {
      body: d.cuerpo || '',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      /* Con tag, un aviso nuevo REEMPLAZA al anterior en vez de apilarse.
         Nadie quiere despertar con seis notificaciones de la misma tienda. */
      tag: 'vdh-club',
      renotify: true,
      data: { url: d.enlace || 'tarjeta.html' }
    })
  );
});

/* Al tocarla: si la tarjeta ya está abierta en alguna pestaña se trae ésa,
   en vez de abrir una nueva encima. */
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const destino = new URL((evento.notification.data && evento.notification.data.url) || 'tarjeta.html',
                          self.location.origin).href;

  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((pestanas) => {
      for (const p of pestanas) {
        if (p.url.indexOf(self.location.origin) === 0 && 'focus' in p) {
          p.navigate(destino);
          return p.focus();
        }
      }
      return self.clients.openWindow(destino);
    })
  );
});

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;

  /* Sólo GET del propio sitio. Las llamadas a la base son POST y van
     derecho a la red: una tarjeta cacheada mostraría sellos viejos, que es
     peor que no mostrar nada. */
  if (pedido.method !== 'GET') return;
  if (new URL(pedido.url).origin !== location.origin) return;

  evento.respondWith(
    fetch(pedido)
      .then((respuesta) => {
        if (respuesta && respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(CACHE).then((c) => c.put(pedido, copia)).catch(() => {});
        }
        return respuesta;
      })
      .catch(() => caches.match(pedido).then((guardada) => guardada || caches.match('./tarjeta.html')))
  );
});
