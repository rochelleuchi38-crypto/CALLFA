<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">🗺️ Mapping</h1>
      <p class="page-subtitle">View farm locations, mapping tools, and geographical information</p>
    </div>

    <div class="content-grid">
      <!-- Map View (full width) -->
      <div class="card map-card">
        <div class="map-top-controls">
          <div class="left-controls">
            <input v-model="searchQuery" @keyup.enter="geocodeSearch" placeholder="Search barangay / town" class="search-input" />
            <button class="control-btn" @click="geocodeSearch">Search</button>
            <button class="control-btn" @click="toggleBaseLayer">Toggle Satellite</button>
            <button class="control-btn" @click="toggleWeather">Toggle Weather</button>
            <button class="control-btn" @click="fitAll">Fit All</button>
          </div>
          <div class="right-controls">
            <button class="control-btn" @click="locateMe">My Location</button>
            <button class="control-btn" @click="zoomIn">＋</button>
            <button class="control-btn" @click="zoomOut">－</button>
            <button class="control-btn" @click="resetView">Reset</button>
          </div>
        </div>

        <!-- Leaflet Map -->
        <div ref="mapEl" class="map-container"></div>

        <div class="map-legend">
          <small>Click on map to pick coordinates. Draw polygon to save farm boundary.</small>
        </div>
      </div>

      <!-- Farm Locations List -->
      <div class="card">
        <h2 class="card-title">My Farm Locations</h2>
        <div class="locations-list">
          <div
            v-for="location in farmLocations"
            :key="location.id"
            class="location-item"
            @click="zoomToLocation(location)"
          >
            <div class="location-icon">📍</div>
            <div class="location-info">
              <div class="location-name">{{ location.name }}</div>
              <div class="location-address">{{ location.address }}</div>
              <div class="location-size">{{ location.size }} hectares</div>
            </div>
            <div class="location-arrow">→</div>
          </div>
        </div>
        <button class="add-location-btn" @click="scrollToForm">+ Add Location</button>
      </div>

      <!-- Add/Edit Location Form -->
      <div class="card" id="locationFormCard">
        <h2 class="card-title">Add Farm Location</h2>
        <form @submit.prevent="saveLocation" class="location-form">
          <div class="form-row">
            <div class="form-group">
              <label>Farm Name</label>
              <input type="text" v-model="locationForm.name" placeholder="Enter farm name" required />
            </div>
            <div class="form-group">
              <label>Size (hectares)</label>
              <input type="number" v-model.number="locationForm.size" placeholder="Enter size" required min="0.1" step="0.1" />
            </div>
          </div>

          <div class="form-group">
            <label>Address</label>
            <input type="text" v-model="locationForm.address" placeholder="Enter address" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Coordinates (Latitude)</label>
              <input type="number" v-model.number="locationForm.latitude" placeholder="e.g., 14.5995" step="0.0001" />
            </div>
            <div class="form-group">
              <label>Coordinates (Longitude)</label>
              <input type="number" v-model.number="locationForm.longitude" placeholder="e.g., 120.9842" step="0.0001" />
            </div>
          </div>

          <div class="form-group">
            <label>Boundary (geo points saved when drawing)</label>
            <textarea rows="3" :value="boundaryPreview" readonly></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="control-btn" @click="enableDraw">Draw Boundary</button>
            <button type="submit" class="submit-btn">Save Location</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
// leaflet-geoman for drawing
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import '@geoman-io/leaflet-geoman-free'
// markercluster
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'

// NOTE: you must install packages:
// npm install leaflet @geoman-io/leaflet-geoman-free leaflet.markercluster
// and in your project (vite) make sure to copy leaflet images if needed

const mapEl = ref(null)
let map = null
let markersLayer = null
let markerClusterGroup = null
let drawnItems = null
let userTempMarker = null
let weatherLayer = null
let satelliteLayer = null
let baseLayer = null

const searchQuery = ref('')

const locationForm = ref({
  name: '',
  address: '',
  latitude: null,
  longitude: null,
  size: null,
  boundary: null // GeoJSON array or null
})

const farmLocations = ref([
  {
    id: 1,
    name: 'Main Rice Field',
    address: 'Barangay San Jose, Nueva Ecija',
    size: 2.5,
    coordinates: { lat: 14.5995, lng: 120.9842 }
  },
  {
    id: 2,
    name: 'Corn Farm',
    address: 'Barangay Poblacion, Nueva Ecija',
    size: 1.8,
    coordinates: { lat: 14.61, lng: 120.99 }
  }
])

const boundaryPreview = ref('No boundary drawn')

// Replace with your OpenWeatherMap API key if you want weather overlay
const OPENWEATHERMAP_API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'

const initMap = () => {
  // initialize map
  map = L.map(mapEl.value, {
    center: [14.5995, 120.9842],
    zoom: 12,
    zoomControl: false
  })

  // base tile (OpenStreetMap)
  baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map)

  // satellite layer (Esri World Imagery)
  satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri'
  })

  // marker cluster group
  markerClusterGroup = L.markerClusterGroup()
  markersLayer = L.layerGroup()
  markerClusterGroup.addLayer(markersLayer)
  map.addLayer(markerClusterGroup)

  // drawn items for polygons
  drawnItems = new L.FeatureGroup()
  map.addLayer(drawnItems)

  // enable leaflet.pm with options
  map.pm.addControls({
    position: 'topleft',
    drawMarker: false,
    drawCircleMarker: false,
    drawPolyline: false,
    drawRectangle: false,
    drawCircle: false,
    cutPolygon: false
  })

  // handle created polygon
  map.on('pm:create', function (e) {
    const layer = e.layer
    // save coordinates
    const latlngs = layer.getLatLngs()[0]
    const coords = latlngs.map((p) => [p.lat, p.lng])
    locationForm.value.boundary = coords
    boundaryPreview.value = JSON.stringify(coords)
    drawnItems.clearLayers()
    drawnItems.addLayer(layer)
  })

  // click to add temp marker and fill form
  map.on('click', function (e) {
    const { lat, lng } = e.latlng
    setTemporaryMarker(lat, lng)
    locationForm.value.latitude = lat
    locationForm.value.longitude = lng
  })

  // add existing farm markers
  renderFarmMarkers()
}

const renderFarmMarkers = () => {
  if (!markersLayer) return
  markersLayer.clearLayers()

  farmLocations.value.forEach((loc) => {
    const marker = L.marker([loc.coordinates.lat, loc.coordinates.lng], {
      title: loc.name
    })

    const popupHtml = `
      <div style="min-width:160px">
        <strong>${loc.name}</strong><br />
        ${loc.address}<br />
        Size: ${loc.size} ha<br />
        <button class="popup-btn" onclick="window.__vue_map_zoom_to(${loc.coordinates.lat}, ${loc.coordinates.lng})">Zoom</button>
      </div>
    `

    marker.bindPopup(popupHtml)
    markersLayer.addLayer(marker)
  })
  // reset cluster group (re-add)
  markerClusterGroup.clearLayers()
  markerClusterGroup.addLayer(markersLayer)
}

// helper to expose zoom from popup button (bridge)
window.__vue_map_zoom_to = (lat, lng) => {
  if (map) {
    map.setView([lat, lng], 16)
  }
}

const setTemporaryMarker = (lat, lng) => {
  if (userTempMarker) {
    map.removeLayer(userTempMarker)
  }
  userTempMarker = L.marker([lat, lng], { draggable: true }).addTo(map)
  userTempMarker.on('dragend', function (ev) {
    const p = ev.target.getLatLng()
    locationForm.value.latitude = p.lat
    locationForm.value.longitude = p.lng
  })
}

const zoomIn = () => map.zoomIn()
const zoomOut = () => map.zoomOut()
const resetView = () => map.setView([14.5995, 120.9842], 12)

const fitAll = () => {
  const group = L.featureGroup()
  farmLocations.value.forEach((loc) => {
    group.addLayer(L.marker([loc.coordinates.lat, loc.coordinates.lng]))
  })
  if (group.getLayers().length) map.fitBounds(group.getBounds().pad(0.2))
}

const zoomToLocation = (loc) => {
  map.setView([loc.coordinates.lat, loc.coordinates.lng], 16)
}

const scrollToForm = () => {
  document.getElementById('locationFormCard')?.scrollIntoView({ behavior: 'smooth' })
}

const saveLocation = () => {
  // simple local save - replace with API call to backend
  const id = Date.now()
  const newLoc = {
    id,
    name: locationForm.value.name,
    address: locationForm.value.address,
    size: locationForm.value.size,
    coordinates: { lat: locationForm.value.latitude || 0, lng: locationForm.value.longitude || 0 },
    boundary: locationForm.value.boundary || null
  }
  farmLocations.value.push(newLoc)
  renderFarmMarkers()
  alert('Location saved (locally)')
  // clear form
  locationForm.value = { name: '', address: '', latitude: null, longitude: null, size: null, boundary: null }
  boundaryPreview.value = 'No boundary drawn'
}

const enableDraw = () => {
  // activate polygon draw
  map.pm.enableDraw('Polygon', { snappable: true })
}

const geocodeSearch = async () => {
  if (!searchQuery.value) return
  // use Nominatim (OpenStreetMap) for free geocoding
  const q = encodeURIComponent(searchQuery.value)
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ph`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Farm-App' } })
    const data = await res.json()
    if (data && data.length) {
      const place = data[0]
      const lat = parseFloat(place.lat)
      const lon = parseFloat(place.lon)
      map.setView([lat, lon], 14)
      setTemporaryMarker(lat, lon)
      locationForm.value.latitude = lat
      locationForm.value.longitude = lon
    } else {
      alert('Location not found')
    }
  } catch (err) {
    console.error(err)
    alert('Geocoding failed')
  }
}

const toggleBaseLayer = () => {
  if (map.hasLayer(satelliteLayer)) {
    map.removeLayer(satelliteLayer)
    baseLayer.addTo(map)
  } else {
    map.removeLayer(baseLayer)
    satelliteLayer.addTo(map)
  }
}

const toggleWeather = () => {
  if (!OPENWEATHERMAP_API_KEY || OPENWEATHERMAP_API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') {
    alert('Set OPENWEATHERMAP_API_KEY in the component to use weather overlay')
    return
  }
  if (weatherLayer && map.hasLayer(weatherLayer)) {
    map.removeLayer(weatherLayer)
    weatherLayer = null
    return
  }
  weatherLayer = L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}`, {
    maxZoom: 12,
    opacity: 0.6
  })
  weatherLayer.addTo(map)
}

const locateMe = () => {
  if (!navigator.geolocation) {
    alert('Geolocation not supported')
    return
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      map.setView([lat, lng], 16)
      setTemporaryMarker(lat, lng)
      locationForm.value.latitude = lat
      locationForm.value.longitude = lng
    },
    (err) => {
      alert('Unable to get your location')
      console.error(err)
    }
  )
}

onMounted(async () => {
  await nextTick()
  initMap()
})

onBeforeUnmount(() => {
  if (map) map.remove()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-title { font-size: 28px; font-weight: 700; color: #0f3d2e }
.page-subtitle { color: #6b7280; margin-top: 6px }

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.card { background: white; border-radius: 12px; padding: 18px; box-shadow: 0 6px 20px rgba(2,6,23,0.06); border: 1px solid #e6eef0 }
.map-card { grid-column: 1 / -1 }

.map-top-controls { display:flex; justify-content:space-between; gap:12px; margin-bottom:12px }
.left-controls { display:flex; gap:8px; align-items:center }
.right-controls { display:flex; gap:8px; align-items:center }
.search-input { padding:8px 10px; border-radius:8px; border:1px solid #d1d5db }

.map-container { width:100%; height:520px; border-radius:8px; overflow:hidden; border:1px solid #e5e7eb }
.map-legend { margin-top:8px; color:#6b7280 }

.control-btn { padding:8px 12px; background:#f3f4f6; border:1px solid #e5e7eb; border-radius:8px; cursor:pointer }
.control-btn:hover { background:#e8f5ee }

.locations-list { display:flex; flex-direction:column; gap:10px; margin-bottom:12px }
.location-item { display:flex; align-items:center; gap:12px; padding:12px; background:#f9fafb; border-radius:8px; cursor:pointer }
.location-item:hover { background:#f3f4f6 }
.add-location-btn { width:100%; padding:12px; background:#166534; color:white; border:none; border-radius:8px }

.location-form { display:flex; flex-direction:column; gap:12px }
.form-row { display:flex; gap:12px }
.form-group { display:flex; flex-direction:column; gap:8px; flex:1 }
.form-group input, .form-group textarea { padding:10px; border-radius:8px; border:1px solid #d1d5db }
.submit-btn { padding:12px; background:#166534; color:white; border:none; border-radius:8px }

/* small responsive */
@media (max-width: 720px) {
  .map-container { height: 420px }
  .form-row { flex-direction:column }
}
</style>
