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
// Stadia Maps works on localhost without an API key
// For production, either add an API key or use domain-based authentication
const MAP_STYLE = STADIA_KEY
  ? `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${STADIA_KEY}`
  : 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json'

export function MapContainer() {
  const mapRef = useRef<MapRef>(null)
  const { mapState, setViewport, setSelectedArea } = useMapState()
  const setHoveredAreaId = useAppStore((s) => s.setHoveredAreaId)
  const setTooltip = useAppStore((s) => s.setTooltip)

  // Store map reference globally for other components
  const setMapRef = useAppStore((s) => s.setMapRef)
  const setActiveLayer = useAppStore((s) => s.setActiveLayer)
  const setSelectedAreaId = useAppStore((s) => s.setSelectedAreaId)
  
  // Set mapRef when map loads
  const onLoad = useCallback(() => {
    if (mapRef.current) {
      setMapRef(mapRef.current)
    }
  }, [setMapRef])
  
  useEffect(() => {
    return () => setMapRef(null)
  }, [setMapRef])

  // Sync URL state to store
  useEffect(() => {
    setActiveLayer(mapState.layer)
  }, [mapState.layer, setActiveLayer])

  useEffect(() => {
    setSelectedAreaId(mapState.areaId)
  }, [mapState.areaId, setSelectedAreaId])

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
          const areaId = props.PLR_ID as string
          // Update URL, which will sync to store via effect
          setSelectedArea(areaId)
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
      onLoad={onLoad}
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

