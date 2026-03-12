import { Source, Layer } from 'react-map-gl/maplibre'
import { useAppStore } from '@/store/appStore'
import { useLayerConfig } from '@/hooks/useLayerConfig'
import { NO_DATA_COLOR, SELECTED_OUTLINE_COLOR, DEFAULT_OUTLINE_COLOR } from '../../data/layers'
import type { FillLayerSpecification, LineLayerSpecification } from 'maplibre-gl'

// PMTiles URLs by city (served from R2 public dev URL)
const PMTILES_URLS = {
  berlin: 'pmtiles://https://pub-98958c4b3a3a491a85571566a6bad518.r2.dev/berlin-lor.pmtiles',
  hamburg: 'pmtiles://https://pub-98958c4b3a3a491a85571566a6bad518.r2.dev/hamburg.pmtiles',
  munich: 'pmtiles://https://pub-98958c4b3a3a491a85571566a6bad518.r2.dev/munich.pmtiles',
} as const

// Layer configuration by admin level (Berlin-specific)
const BERLIN_LAYER_CONFIG = {
  planungsraum: {
    sourceLayer: 'planungsraeume',
    idProperty: 'PLR_ID',
  },
  bezirk: {
    sourceLayer: 'bezirke',
    idProperty: 'BEZ_ID',
  },
} as const

// Generic layer config for other cities (single level)
const GENERIC_LAYER_CONFIG = {
  sourceLayer: 'areas',
  idProperty: 'id',
}

export function LORLayer() {
  const adminLevel = useAppStore((s) => s.adminLevel)
  const currentCityId = useAppStore((s) => s.cityId)
  const selectedAreaId = useAppStore((s) => s.selectedAreaId)
  const hoveredAreaId = useAppStore((s) => s.hoveredAreaId)
  const { colorExpression, indicator } = useLayerConfig()

  // Select PMTiles URL based on current city
  const pmtilesUrl = PMTILES_URLS[currentCityId as keyof typeof PMTILES_URLS]

  // Select layer config based on city
  const config = currentCityId === 'berlin' 
    ? BERLIN_LAYER_CONFIG[adminLevel]
    : GENERIC_LAYER_CONFIG
  
  const { sourceLayer, idProperty } = config

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
      ['==', ['get', idProperty], selectedAreaId ?? ''],
      0.9,
      ['==', ['get', idProperty], hoveredAreaId ?? ''],
      0.8,
      0.65,
    ],
  }

  // Outline layer paint specification
  const linePaint: LineLayerSpecification['paint'] = {
    'line-color': [
      'case',
      ['==', ['get', idProperty], selectedAreaId ?? ''],
      SELECTED_OUTLINE_COLOR,
      DEFAULT_OUTLINE_COLOR,
    ],
    'line-width': [
      'case',
      ['==', ['get', idProperty], selectedAreaId ?? ''],
      2.5,
      ['==', ['get', idProperty], hoveredAreaId ?? ''],
      1.5,
      // Thicker default lines for Bezirke since they're larger
      adminLevel === 'bezirk' ? 1.0 : 0.5,
    ],
  }

  // Use key prop to force remount when admin level OR city changes
  // This ensures MapLibre properly switches source layers
  return (
    <Source key={`${currentCityId}-source`} id="lor-source" type="vector" url={pmtilesUrl}>
      <Layer
        key={`${currentCityId}-${adminLevel}-fill`}
        id="lor-fill"
        type="fill"
        source-layer={sourceLayer}
        paint={fillPaint}
      />
      <Layer
        key={`${currentCityId}-${adminLevel}-outline`}
        id="lor-outline"
        type="line"
        source-layer={sourceLayer}
        paint={linePaint}
      />
    </Source>
  )
}
