'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom green marker icon
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface NodeMapProps {
  latitude: number
  longitude: number
  city?: string
  country?: string
  ip: string
}

export function NodeMap({ latitude, longitude, city, country, ip }: NodeMapProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={6}
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
      scrollWheelZoom={false}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={greenIcon}>
        <Popup>
          <div className="text-sm">
            <div className="font-semibold text-gray-900">{ip}</div>
            {city && country && (
              <div className="text-gray-600">{city}, {country}</div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
