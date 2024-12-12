
// Карта и ее начальная конфигурация
let map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Геолокация пользователя
map.locate({setView: true, maxZoom: 16});

// Обработчик для добавления точки
document.getElementById('addPointButton').addEventListener('click', () => {
    map.once('click', (e) => {
        let lat = e.latlng.lat;
        let lng = e.latlng.lng;
        let marker = L.marker([lat, lng]).addTo(map);
        alert(`Точка создана: ${lat}, ${lng}`); // Место для формы создания поста
    });
});

// "Что происходит?" - примерная логика для перемещения камеры
document.getElementById('trendingButton').addEventListener('click', () => {
    alert("Пока что не реализовано"); // Заглушка
});
