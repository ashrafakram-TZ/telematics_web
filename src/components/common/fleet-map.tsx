import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MapPoint {
  id: number
  lat: number
  lng: number
  label: string
  sublabel?: string
  color: string
}

interface FleetMapProps {
  points: MapPoint[]
  className?: string
  emptyText?: string
  onSelect?: (id: number) => void
}

const DEFAULT_CENTER: L.LatLngTuple = [13.0827, 80.2707]

const tooltipContent = (point: MapPoint) => {
  const wrapper = document.createElement('div')
  const title = document.createElement('strong')
  title.textContent = point.label
  wrapper.append(title)
  if (point.sublabel) {
    const line = document.createElement('div')
    line.textContent = point.sublabel
    line.style.opacity = '0.75'
    wrapper.append(line)
  }
  return wrapper
}

export function FleetMap({
  points,
  className,
  emptyText = 'No positions yet',
  onSelect,
}: FleetMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const fittedKeyRef = useRef('')
  const onSelectRef = useRef(onSelect)

  useEffect(() => {
    onSelectRef.current = onSelect
  })

  useEffect(() => {
    if (!containerRef.current) return
    const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false }).setView(
      DEFAULT_CENTER,
      11
    )
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    map.on('focus', () => map.scrollWheelZoom.enable())
    map.on('blur', () => map.scrollWheelZoom.disable())
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
      layerRef.current = null
      fittedKeyRef.current = ''
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return

    layer.clearLayers()
    points.forEach((point) => {
      L.circleMarker([point.lat, point.lng], {
        radius: 9,
        color: '#ffffff',
        weight: 2.5,
        fillColor: point.color,
        fillOpacity: 1,
      })
        .bindTooltip(tooltipContent(point), { direction: 'top', offset: [0, -8] })
        .on('click', () => onSelectRef.current?.(point.id))
        .addTo(layer)
    })

    const key = points.map((point) => point.id).join(',')
    if (points.length && key !== fittedKeyRef.current) {
      fittedKeyRef.current = key
      const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]))
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 })
    }
  }, [points])

  return (
    <div className={cn('relative isolate overflow-hidden rounded-lg border', className)}>
      <div ref={containerRef} className='size-full' />
      {points.length === 0 && (
        <div className='pointer-events-none absolute inset-0 z-[500] grid place-items-center bg-background/40'>
          <span className='flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold shadow-sm'>
            <MapPin className='size-3.5 text-muted-foreground' />
            {emptyText}
          </span>
        </div>
      )}
    </div>
  )
}
