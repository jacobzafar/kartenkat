import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import TileWMS from 'ol/source/TileWMS'

export function createBaseLayer() {
  return new TileLayer({ source: new OSM() })
}

// Göteborgs Stads ortofoto, öppen data (CC0). Lagret "orto" är senaste årgången.
export function createOrtofotoLayer() {
  return new TileLayer({
    source: new TileWMS({
      url: 'https://opengeodata.goteborg.se/services/ortofoto/wms/v1',
      params: { LAYERS: 'orto', FORMAT: 'image/jpeg', TILED: true },
      attributions: 'Ortofoto: Göteborgs Stad (CC0)',
    }),
  })
}
