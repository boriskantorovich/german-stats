import { useCallback, useEffect, useRef } from 'react'
import Map, { type MapRef, type ViewStateChangeEvent, type MapLayerMouseEvent } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import 'maplibre-gl/dist/maplibre-gl.css'

import { LORLayer } from './LORLayer'
import { Tooltip } from './Tooltip'
import { useMapState } from '../../hooks/useMapState'
import { useAppStore } from '../../store/appStore'

// Register PMTiles protocol once
const protocol = new Protocol()
maplibregl.addProtocol('pmtiles', protocol.tile)

const STADIA_KEY = import.meta.env.VITE_STADIA_API_KEY as string | undefined
const MAP_STYLE = STADIA_KEY
  ? `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${STADIA_KEY}`
  : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

export function MapContainer() {
  const mapRef = useRef<MapRef>(null)
  const { mapState, setViewport, setSelectedArea } = useMapState()
  const setHoveredAreaId = useAppStore((s) => s.setHoveredAreaId)
  const setTooltip = useAppStore((s) => s.setTooltip)

  // Store map reference globally for other components
  useEffect(() => {
    if (mapRef.current) {
      // Map is ready
    }
  }, [])

  const onMove = useCallback(
    (evt: ViewStateChangeEvent) => {
      // Debounce URL updates to avoid excessive history entries
      const { latitude, longitude, zoom } = evt.viewState
      setViewport(latitude, longitude, zoom)
    },
    [setViewport]
  )

  const onMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0]
        if (feature?.properties) {
          const props = feature.properties as Record<string, unknown>
          setHoveredAreaId(props.PLR_ID as string)
          setTooltip({
            areaId: props.PLR_ID as string,
            name: props.PLR_NAME as string,
            value: 0, // Will be filled by Tooltip component
            x: e.point.x,
            y: e.point.y,
          })
        }
      }
    },
    [setHoveredAreaId, setTooltip]
  )

  const onMouseLeave = useCallback(() => {
    setHoveredAreaId(null)
    setTooltip(null)
  }, [setHoveredAreaId, setTooltip])

  const onClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0]
        if (feature?.properties) {
          const props = feature.properties as Record<string, unknown>
          setSelectedArea(props.PLR_ID as string)
        }
      } else {
        // Click on empty area - deselect
        setSelectedArea(null)
      }
    },
    [setSelectedArea]
  )

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        longitude: mapState.lng,
        latitude: mapState.lat,
        zoom: mapState.zoom,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={MAP_STYLE}
      onMoveEnd={onMove}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      interactiveLayerIds={['lor-fill']}
      cursor="pointer"
      attributionControl={true}
    >
      <LORLayer />
      <Tooltip />
    </Map>
  )
}

