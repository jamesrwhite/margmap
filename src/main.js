import 'leaflet/dist/leaflet.css';
import './styles.css';
import L from 'leaflet';

// Make Leaflet available globally
window.L = L;

// Import app after Leaflet is available
import('./app.js');
