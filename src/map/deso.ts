import GeoJSON from 'ol/format/GeoJSON'
import VectorLayer from 'ol/layer/Vector'
import { bbox as bboxStrategy } from 'ol/loadingstrategy'
import VectorSource from 'ol/source/Vector'
import { Fill, Stroke, Style } from 'ol/style'

// SCB:s öppna WFS. Tjänsten skickar CORS-headers, så ingen proxy behövs.
const SCB_WFS = 'https://geodata.scb.se/geoserver/stat/wfs'

function wfsUrl(params: Record<string, string>) {
  const query = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    outputFormat: 'application/json',
    ...params,
  })
  return `${SCB_WFS}?${query}`
}

export const desoStyle = new Style({
  stroke: new Stroke({ color: '#ffd400', width: 1.5 }),
  fill: new Fill({ color: 'rgba(255, 212, 0, 0.05)' }),
})

export const selectedDesoStyle = new Style({
  stroke: new Stroke({ color: '#ff3b30', width: 3 }),
  fill: new Fill({ color: 'rgba(255, 59, 48, 0.15)' }),
})

// Hämtar bara de DeSO-områden som syns i kartan (bbox-strategi).
export function createDesoLayer() {
  const source = new VectorSource({
    format: new GeoJSON(),
    url: (extent) =>
      wfsUrl({
        typeNames: 'stat:DeSO_2025',
        srsName: 'EPSG:3857',
        bbox: `${extent.join(',')},EPSG:3857`,
      }),
    strategy: bboxStrategy,
    attributions: 'DeSO: SCB',
  })
  return new VectorLayer({ source, style: desoStyle, minZoom: 11 })
}

// DeSO har bara koder. Namnet hämtas från RegSO-området som DeSO ligger i.
export async function fetchRegsoName(regsokod: string) {
  if (!/^\d{4}R\d{3}$/.test(regsokod)) return null

  const response = await fetch(
    wfsUrl({
      typeNames: 'stat:RegSO_2025',
      propertyName: 'regsonamn',
      cql_filter: `regsokod='${regsokod}'`,
    }),
  )
  if (!response.ok) return null

  const data = await response.json()
  return (data.features[0]?.properties.regsonamn as string) ?? null
}
