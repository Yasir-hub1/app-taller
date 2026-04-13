import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

function latitudeDeltaToZoom(latitudeDelta) {
  if (!latitudeDelta || latitudeDelta <= 0) return 13;
  const z = Math.log2(360 / latitudeDelta) - 1;
  return Math.min(18, Math.max(4, Math.round(z)));
}

function escapeForInlineJson(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function buildMapHtml(cfg) {
  const json = escapeForInlineJson(cfg);
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .leaflet-control-attribution { font-size: 10px; max-width: 50%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script>
    (function () {
      var cfg = ${json};
      var map = L.map('map', { zoomControl: true }).setView([cfg.userLat, cfg.userLng], cfg.zoom);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);
      L.circle([cfg.userLat, cfg.userLng], {
        radius: cfg.radiusMeters,
        color: '#3b82f6',
        weight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.08
      }).addTo(map);
      L.circleMarker([cfg.userLat, cfg.userLng], {
        radius: 10,
        color: '#1d4ed8',
        fillColor: '#3b82f6',
        fillOpacity: 1,
        weight: 2
      }).addTo(map).bindPopup('Tu ubicación');
      (cfg.workshops || []).forEach(function (w) {
        var icon = L.divIcon({
          className: 'ws-m',
          html: '<div style="background:#dc2626;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);font-size:18px;line-height:1;">&#128295;</div>',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });
        var marker = L.marker([w.lat, w.lng], { icon: icon }).addTo(map);
        if (w.name || w.distanceKm != null) {
          marker.bindPopup(
            '<b>' + (w.name || 'Taller') + '</b>' +
            (w.distanceKm != null ? '<br/>' + Number(w.distanceKm).toFixed(1) + ' km' : '')
          );
        }
        marker.on('click', function () {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'workshop', id: w.id }));
          }
        });
      });

      // Ajustar encuadre para incluir usuario y talleres visibles
      if ((cfg.workshops || []).length > 0) {
        var points = [[cfg.userLat, cfg.userLng]];
        (cfg.workshops || []).forEach(function (w) {
          points.push([w.lat, w.lng]);
        });
        var bounds = L.latLngBounds(points);
        map.fitBounds(bounds.pad(0.2), { maxZoom: cfg.zoom });
      }
    })();
  </script>
</body>
</html>`;
}

/**
 * Mapa con teselas OpenStreetMap (Leaflet en WebView). No usa Google Maps ni API key.
 */
export default function OsmLeafletMap({
  style,
  userLocation,
  latitudeDelta = 0.05,
  longitudeDelta = 0.05,
  circleRadiusMeters = 20000,
  workshops = [],
  onWorkshopPress,
}) {
  const html = useMemo(() => {
    const zoom = latitudeDeltaToZoom(latitudeDelta);
    const cfg = {
      userLat: userLocation.latitude,
      userLng: userLocation.longitude,
      zoom,
      radiusMeters: circleRadiusMeters,
      workshops: workshops.map((w) => ({
        id: w.id,
        lat: Number(w.latitude),
        lng: Number(w.longitude),
        name: w.name,
        distanceKm: w.distance_km ?? w.distance ?? null,
      })),
    };
    return buildMapHtml(cfg);
  }, [
    userLocation.latitude,
    userLocation.longitude,
    latitudeDelta,
    circleRadiusMeters,
    workshops,
  ]);

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.type === 'workshop' && onWorkshopPress) {
              onWorkshopPress(msg.id);
            }
          } catch {
            /* ignore */
          }
        }}
        userAgent="EmergenciasVehiculares/1.0 (mapa OSM; +https://openstreetmap.org/copyright)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: '#e8eef3' },
});
