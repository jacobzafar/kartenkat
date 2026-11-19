import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Circle, Fill, Stroke, Style } from 'ol/style'
import type { Coordinate } from 'ol/coordinate'

export type Synpunkt = {
  id: string
  coordinate: Coordinate
  text: string
  created: string
}

const STORAGE_KEY = 'kartdemo-synpunkter'

export function loadSynpunkter(): Synpunkt[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveSynpunkter(synpunkter: Synpunkt[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(synpunkter))
  } catch {
    // Privat läge eller full lagring: synpunkterna finns kvar tills sidan laddas om.
  }
}

function pointStyle(color: string) {
  return new Style({
    image: new Circle({
      radius: 7,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
    }),
  })
}

const savedStyle = pointStyle('#007aff')
const draftStyle = pointStyle('#ff9500')

export function createSynpunktLayer() {
  return new VectorLayer({ source: new VectorSource(), zIndex: 10 })
}

// Ritar om alla punkter utifrån React-state. Utkastet är punkten som ännu inte sparats.
export function drawSynpunkter(
  layer: VectorLayer,
  synpunkter: Synpunkt[],
  draft: Coordinate | null,
) {
  const features = synpunkter.map((synpunkt) => {
    const feature = new Feature(new Point(synpunkt.coordinate))
    feature.setId(synpunkt.id)
    feature.setStyle(savedStyle)
    return feature
  })

  if (draft) {
    const feature = new Feature(new Point(draft))
    feature.setStyle(draftStyle)
    features.push(feature)
  }

  const source = layer.getSource()!
  source.clear()
  source.addFeatures(features)
}
