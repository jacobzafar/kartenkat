import { useEffect, useRef, useState } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import type Feature from 'ol/Feature'
import type TileLayer from 'ol/layer/Tile'
import type VectorLayer from 'ol/layer/Vector'
import { fromLonLat } from 'ol/proj'
import 'ol/ol.css'
import { createBaseLayer, createOrtofotoLayer } from './map/layers'
import { createDesoLayer, fetchRegsoName, selectedDesoStyle } from './map/deso'
import './App.css'

const GOTEBORG_CENTRUM = fromLonLat([11.9668, 57.7072])

type DesoInfo = {
  desokod: string
  regsokod: string
  namn: string | null
}

function App() {
  const mapElement = useRef<HTMLDivElement>(null)
  const ortofotoLayer = useRef<TileLayer | null>(null)
  const desoLayer = useRef<VectorLayer | null>(null)
  const [showOrtofoto, setShowOrtofoto] = useState(true)
  const [showDeso, setShowDeso] = useState(true)
  const [desoInfo, setDesoInfo] = useState<DesoInfo | null>(null)

  // Kartan och lagren skapas här så att varje karta får egna lagerobjekt
  // (StrictMode kör effekten två gånger i utvecklingsläge).
  useEffect(() => {
    const ortofoto = createOrtofotoLayer()
    const deso = createDesoLayer()
    ortofotoLayer.current = ortofoto
    desoLayer.current = deso

    const map = new Map({
      target: mapElement.current!,
      layers: [createBaseLayer(), ortofoto, deso],
      view: new View({ center: GOTEBORG_CENTRUM, zoom: 14 }),
    })

    let selected: Feature | null = null

    map.on('singleclick', async (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (f) => f as Feature, {
        layerFilter: (layer) => layer === deso,
      })

      selected?.setStyle(undefined)
      selected = feature ?? null
      selected?.setStyle(selectedDesoStyle)

      if (!feature) {
        setDesoInfo(null)
        return
      }

      const desokod = feature.get('desokod')
      const regsokod = feature.get('regsokod')
      setDesoInfo({ desokod, regsokod, namn: null })

      const namn = await fetchRegsoName(regsokod)
      // Användaren kan ha klickat på ett annat område medan namnet hämtades.
      if (selected === feature) {
        setDesoInfo({ desokod, regsokod, namn })
      }
    })

    return () => map.setTarget(undefined)
  }, [])

  useEffect(() => {
    ortofotoLayer.current?.setVisible(showOrtofoto)
  }, [showOrtofoto])

  useEffect(() => {
    desoLayer.current?.setVisible(showDeso)
  }, [showDeso])

  return (
    <div className="app">
      <aside className="panel">
        <h1>Kartdemo Göteborg</h1>
        <label>
          <input
            type="checkbox"
            checked={showOrtofoto}
            onChange={(e) => setShowOrtofoto(e.target.checked)}
          />
          Ortofoto (Göteborgs Stad)
        </label>
        <label>
          <input type="checkbox" checked={showDeso} onChange={(e) => setShowDeso(e.target.checked)} />
          DeSO-områden (SCB)
        </label>

        <section className="info">
          <h2>DeSO</h2>
          {desoInfo ? (
            <dl>
              <dt>Område</dt>
              <dd>{desoInfo.namn ?? 'Hämtar ...'}</dd>
              <dt>DeSO-kod</dt>
              <dd>{desoInfo.desokod}</dd>
              <dt>RegSO-kod</dt>
              <dd>{desoInfo.regsokod}</dd>
            </dl>
          ) : (
            <p>Klicka på ett område i kartan.</p>
          )}
        </section>
      </aside>
      <div ref={mapElement} className="map" />
    </div>
  )
}

export default App
