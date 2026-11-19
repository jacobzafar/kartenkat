import { useEffect, useRef, useState } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import type Feature from 'ol/Feature'
import type { Coordinate } from 'ol/coordinate'
import type TileLayer from 'ol/layer/Tile'
import type VectorLayer from 'ol/layer/Vector'
import { fromLonLat } from 'ol/proj'
import 'ol/ol.css'
import { createBaseLayer, createOrtofotoLayer } from './map/layers'
import { createDesoLayer, fetchRegsoName, selectedDesoStyle } from './map/deso'
import {
  createSynpunktLayer,
  drawSynpunkter,
  loadSynpunkter,
  saveSynpunkter,
  type Synpunkt,
} from './map/synpunkter'
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
  const synpunktLayer = useRef<VectorLayer | null>(null)

  const [showOrtofoto, setShowOrtofoto] = useState(true)
  const [showDeso, setShowDeso] = useState(true)
  const [desoInfo, setDesoInfo] = useState<DesoInfo | null>(null)

  const [synpunkter, setSynpunkter] = useState<Synpunkt[]>(loadSynpunkter)
  const [placing, setPlacing] = useState(false)
  const [draft, setDraft] = useState<Coordinate | null>(null)
  const [draftText, setDraftText] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Klickhanteraren skapas en gång, så den läser läget via en ref i stället för state.
  const placingRef = useRef(placing)
  useEffect(() => {
    placingRef.current = placing
  }, [placing])

  // Kartan och lagren skapas här så att varje karta får egna lagerobjekt
  // (StrictMode kör effekten två gånger i utvecklingsläge).
  useEffect(() => {
    const ortofoto = createOrtofotoLayer()
    const deso = createDesoLayer()
    const synpunktLager = createSynpunktLayer()
    ortofotoLayer.current = ortofoto
    desoLayer.current = deso
    synpunktLayer.current = synpunktLager

    const map = new Map({
      target: mapElement.current!,
      layers: [createBaseLayer(), ortofoto, deso, synpunktLager],
      view: new View({ center: GOTEBORG_CENTRUM, zoom: 14 }),
    })

    let selected: Feature | null = null

    map.on('singleclick', async (event) => {
      if (placingRef.current) {
        setDraft(event.coordinate)
        return
      }

      const synpunkt = map.forEachFeatureAtPixel(event.pixel, (f) => f as Feature, {
        layerFilter: (layer) => layer === synpunktLager,
      })
      setSelectedId((synpunkt?.getId() as string | undefined) ?? null)
      if (synpunkt) return

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

  useEffect(() => {
    if (synpunktLayer.current) drawSynpunkter(synpunktLayer.current, synpunkter, draft)
  }, [synpunkter, draft])

  useEffect(() => {
    saveSynpunkter(synpunkter)
  }, [synpunkter])

  function cancelDraft() {
    setPlacing(false)
    setDraft(null)
    setDraftText('')
  }

  function saveDraft() {
    if (!draft || !draftText.trim()) return
    const synpunkt: Synpunkt = {
      id: crypto.randomUUID(),
      coordinate: draft,
      text: draftText.trim(),
      created: new Date().toISOString(),
    }
    setSynpunkter([...synpunkter, synpunkt])
    cancelDraft()
  }

  function removeSynpunkt(id: string) {
    setSynpunkter(synpunkter.filter((s) => s.id !== id))
  }

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

        <section className="info">
          <h2>Synpunkter</h2>
          {!placing && <button onClick={() => setPlacing(true)}>Lämna synpunkt</button>}
          {placing && !draft && (
            <p>
              Klicka i kartan där synpunkten gäller.{' '}
              <button className="link" onClick={cancelDraft}>
                Avbryt
              </button>
            </p>
          )}
          {draft && (
            <div className="draft">
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Kort kommentar"
                maxLength={280}
                rows={3}
                autoFocus
              />
              <div className="buttons">
                <button onClick={saveDraft} disabled={!draftText.trim()}>
                  Spara
                </button>
                <button className="secondary" onClick={cancelDraft}>
                  Avbryt
                </button>
              </div>
            </div>
          )}
          <ul className="synpunkter">
            {synpunkter.map((s) => (
              <li key={s.id} className={s.id === selectedId ? 'selected' : undefined}>
                <span>{s.text}</span>
                <small>{new Date(s.created).toLocaleString('sv-SE')}</small>
                <button className="link" onClick={() => removeSynpunkt(s.id)}>
                  Ta bort
                </button>
              </li>
            ))}
          </ul>
          <p className="note">Sparas bara i den här webbläsaren.</p>
        </section>
      </aside>
      <div ref={mapElement} className={placing ? 'map placing' : 'map'} />
    </div>
  )
}

export default App
