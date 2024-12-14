import { supabase } from "./supabase.js";

export async function addNewsMarkers(map) {
    const categories = ['чат', 'афиша', 'новости', 'услуги'];
    const categoryButtons = document.getElementById('categoryButtons');
    categoryButtons.style.display = 'flex'; // Показываем кнопки категорий

    categories.forEach(cat => {
        const button = document.createElement('button');
        button.textContent = cat;
        button.addEventListener('click', () => addShadowMarker(map, cat));
        categoryButtons.appendChild(button);
    });

    function addShadowMarker(map, category) {
        const shadowMarker = L.marker([0, 0], {
            icon: L.divIcon({
                className: 'shadow-marker',
                html: '<div style="width: 20px; height: 20px; background-color: rgba(0, 0, 0, 0.2); border-radius: 50%;"></div>',
                iconSize: [20, 20]
            })
        }).addTo(map);

        map.on('mousemove', e => shadowMarker.setLatLng(e.latlng));

        map.on('click', async e => {
            const content = prompt("Введите текст новости:");
            if (!content) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Пользователь не авторизован. Пожалуйста, войдите в систему.");
                return;
            }

            const { error } = await supabase
                .from('news')
                .insert([{ content, category, latitude: e.latlng.lat, longitude: e.latlng.lng, user_id: user.id }]);

            if (error) {
                console.error('Ошибка сохранения новости:', error.message);
                return;
            }

            const marker = L.marker([e.latlng.lat, e.latlng.lng], {
                icon: L.divIcon({
                    className: 'flat-marker',
                    html: '<div style="width: 20px; height: 20px; background-color: #4CAF50; border-radius: 50%;"></div>',
                    iconSize: [20, 20]
                }),
                draggable: true
            }).addTo(map);

            marker.bindPopup(`<div style="padding: 20px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);">
                <h3>${content}</h3>
                <p>Автор: ${user.email}</p>
                <p>Категория: ${category}</p>
                <p>Просмотры: 0</p>
            </div>`);

            // Убираем теневой маркер и сбрасываем режим создания
            map.off('mousemove');
            map.off('click');
            shadowMarker.remove();
            categoryButtons.style.display = 'none'; // Скрываем кнопки категорий
        });
    }
}