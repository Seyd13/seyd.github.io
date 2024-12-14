import * as mapModule from "./mapModule.js";
import * as authModule from "./authModule.js";
import { supabase } from "./supabase.js";

runOnStartup(async runtime => {
    runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initializeMap(runtime);
    document.head.appendChild(script);

    document.getElementById('addNewsButton').addEventListener('click', async () => {
        if (await authModule.checkAuthAndShowPopup() && runtime.globalVars.map) {
            mapModule.addNewsMarkers(runtime.globalVars.map);
        }
        updateLogoutButtonVisibility();
    });

    document.getElementById('logoutButton').addEventListener('click', async () => {
        await authModule.logout();
        updateLogoutButtonVisibility();
    });
}

async function initializeMap(runtime) {
    const map = L.map('map').setView([44.9521, 34.1024], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
    runtime.globalVars.map = map;

    map.locate({ setView: true, maxZoom: 16 });
    map.on('locationfound', e => L.marker(e.latlng, { icon: L.divIcon({ className: 'user-marker', html: '<div style="width: 20px; height: 20px; background-color: #f44336; border-radius: 50%;"></div>', iconSize: [20, 20] }) }).addTo(map).bindPopup("Ваше местоположение").openPopup());
    map.on('locationerror', e => alert("Не удалось определить ваше местоположение: " + e.message));

    const { data, error } = await supabase.from('news').select('*');
    if (error) return console.error('Ошибка загрузки новостей:', error.message);
    data.forEach(news => L.marker([news.latitude, news.longitude], { icon: L.divIcon({ className: 'flat-marker', html: '<div style="width: 20px; height: 20px; background-color: #4CAF50; border-radius: 50%;"></div>', iconSize: [20, 20] }) }).addTo(map).bindPopup(`<div style="padding: 20px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);"><h3>${news.content}</h3><p>Автор: ${news.user_id}</p><p>Категория: ${news.category}</p><p>Просмотры: ${news.views}</p></div>`).openPopup());

    updateLogoutButtonVisibility();
}

async function updateLogoutButtonVisibility() {
    document.getElementById('logoutButton').style.display = (await supabase.auth.getUser()).data.user ? 'block' : 'none';
}