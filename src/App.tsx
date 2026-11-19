import { useEffect, useRef, useState } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import type TileLayer from 'ol/layer/Tile'
import { fromLonLat } from 'ol/proj'
import 'ol/ol.css'
import { createBaseLayer, createOrtofotoLayer } from './map/layers'
import './App.css'

const GOTEBORG_CENTRUM = fromLonLat([11.9668, 57.7072])

function App() {
  const mapElement = useRef<HTMLDivElement>(null)
  const ortofotoLayer = useRef<TileLayer | null>(null)
  const [showOrtofoto, setShowOrtofoto] = useState(true)

  // Kartan och lagren skapas här så att varje karta får egna lagerobjekt
  // (StrictMode kör effekten två gånger i utvecklingsläge).
  useEffect(() => {
    const ortofoto = createOrtofotoLayer()
    ortofotoLayer.current = ortofoto

    const map = new Map({
      target: mapElement.current!,
      layers: [createBaseLayer(), ortofoto],
      view: new View({ center: GOTEBORG_CENTRUM, zoom: 14 }),
    })
    return () => map.setTarget(undefined)
  }, [])

  useEffect(() => {
    ortofotoLayer.current?.setVisible(showOrtofoto)
  }, [showOrtofoto])

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
      </aside>
      <div ref={mapElement} className="map" />
    </div>
  )
}

export default App
