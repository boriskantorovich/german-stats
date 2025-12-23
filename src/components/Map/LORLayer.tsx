import { Source, Layer } from 'react-map-gl/maplibre'
import { useAppStore } from '../../store/appStore'
import { useLayerConfig } from '../../hooks/useLayerConfig'
import { NO_DATA_COLOR, SELECTED_OUTLINE_COLOR, DEFAULT_OUTLINE_COLOR } from '../../data/layers'
import type { FillLayerSpecification, LineLayerSpecification } from 'maplibre-gl'

const PMTILES_URL = 'pmtiles:///data/berlin-lor.pmtiles'
const SOURCE_LAYER = 'planungsraeume'

export function LORLayer() {
  const selectedAreaId = useAppStore((s) => s.selectedAreaId)
  const hoveredAreaId = useAppStore((s) => s.hoveredAreaId)
  const { colorExpression, indicator } = useLayerConfig()

  // Fill layer paint specification
  const fillPaint: FillLayerSpecification['paint'] = {
    'fill-color': [
      'case',
      ['has', indicator],
      colorExpression as unknown as string,
      NO_DATA_COLOR,
    ],
    'fill-opacity': [
      'case',
      ['==', ['get', 'PLR_ID'], selectedAreaId ?? ''],
      0.9,
      ['==', ['get', 'PLR_ID'], hoveredAreaId ?? ''],
      0.8,
      0.65,
    ],
  }

  // Outline layer paint specification
  const linePaint: LineLayerSpecification['paint'] = {
    'line-color': [
      'case',
      ['==', ['get', 'PLR_ID'], selectedAreaId ?? ''],
      SELECTED_OUTLINE_COLOR,
      DEFAULT_OUTLINE_COLOR,
    ],
    'line-width': [
      'case',
      ['==', ['get', 'PLR_ID'], selectedAreaId ?? ''],
      2.5,
      ['==', ['get', 'PLR_ID'], hoveredAreaId ?? ''],
      1.5,
      0.5,
    ],
  }

  return (
    <Source id="lor-source" type="vector" url={PMTILES_URL}>
      <Layer
        id="lor-fill"
        type="fill"
        source-layer={SOURCE_LAYER}
        paint={fillPaint}
      />
      <Layer
        id="lor-outline"
        type="line"
        source-layer={SOURCE_LAYER}
        paint={linePaint}
      />
    </Source>
  )
}

