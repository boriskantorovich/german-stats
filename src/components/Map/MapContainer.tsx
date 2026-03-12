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

// Using Stadia Maps with domain-based authentication.
// Domains (including localhost) must be configured in the Stadia dashboard.
const MAP_STYLE = 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json'

// ID property by admin level
const ID_PROPERTY = {
  planungsraum: 'PLR_ID',
  bezirk: 'BEZ_ID',
} as const

// Name property by admin level
const NAME_PROPERTY = {
  planungsraum: 'PLR_NAME',
  bezirk: 'BEZ_NAME',
} as const

export function MapContainer() {
  const mapRef = useRef<MapRef>(null)
  const { mapState, setViewport, setSelectedArea } = useMapState()
  const adminLevel = useAppStore((s) => s.adminLevel)
  const currentCityId = useAppStore((s) => s.cityId)
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
    return () => {
      setMapRef(null)
    }
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
          
          // Use city-specific property names
          let idProp: string
          let nameProp: string
          
          if (currentCityId === 'berlin') {
            idProp = ID_PROPERTY[adminLevel]
            nameProp = NAME_PROPERTY[adminLevel]
          } else {
            // Hamburg and Munich use 'id' and 'name'
            idProp = 'id'
            nameProp = 'name'
          }
          
          const areaId = props[idProp] as string
          const areaName = props[nameProp] as string || areaId
          
          setHoveredAreaId(areaId)
          setTooltip({
            areaId,
            name: areaName,
            value: 0, // Will be filled by Tooltip component
            x: e.point.x,
            y: e.point.y,
          })
        }
      }
    },
    [adminLevel, currentCityId, setHoveredAreaId, setTooltip]
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
          
          // Use city-specific property names
          const idProp = currentCityId === 'berlin' ? ID_PROPERTY[adminLevel] : 'id'
          const areaId = props[idProp] as string
          
          // Update URL, which will sync to store via effect
          setSelectedArea(areaId)
        }
      } else {
        // Click on empty area - deselect
        setSelectedArea(null)
      }
    },
    [adminLevel, currentCityId, setSelectedArea]
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
