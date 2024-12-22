import { supabase } from "./supabase.js";

export async function addNewsMarkers(map, existingMarkers) {
    const categories = ['Истории', 'Работа', 'Услуги']; // Новые категории
    const categoryButtons = document.getElementById('categoryButtons');
    categoryButtons.innerHTML = ''; // Очищаем предыдущие кнопки категорий
    categoryButtons.style.display = 'flex'; // Показываем контейнер с категориями
    categoryButtons.style.flexDirection = 'column'; // Устанавливаем направление столбца
    categoryButtons.style.alignItems = 'center'; // Центрируем по горизонтали

    categories.forEach(cat => {
        const button = document.createElement('button');
        button.textContent = cat;
        button.addEventListener('click', () => addShadowMarker(map, cat, existingMarkers));
        categoryButtons.appendChild(button);
    });

    function addShadowMarker(map, category, existingMarkers) {
        // Скрываем кнопки категорий
        categoryButtons.style.display = 'none';

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
            if (!content) {
                // Если пользователь отменил ввод, восстанавливаем кнопки категорий
                categoryButtons.style.display = 'flex';
                shadowMarker.remove();
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Пользователь не авторизован. Пожалуйста, войдите в систему.");
                // Восстанавливаем кнопки категорий
                categoryButtons.style.display = 'flex';
                shadowMarker.remove();
                return;
            }

            const { data: profileData } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', user.id)
                .single();

            const displayName = profileData ? profileData.display_name : 'Unknown';

            const { error } = await supabase
                .from('news')
                .insert([{ content, category, latitude: e.latlng.lat, longitude: e.latlng.lng, user_id: user.id }]);

            if (error) {
                console.error('Ошибка сохранения новости:', error.message);
                // Восстанавливаем кнопки категорий
                categoryButtons.style.display = 'flex';
                shadowMarker.remove();
                return;
            }

            const marker = L.marker([e.latlng.lat, e.latlng.lng], {
                icon: getIconByCategory(category), // Используем иконку в соответствии с категорией
                draggable: false // Убираем возможность перетаскивания
            }).addTo(map);

            marker.bindPopup(`<div style="padding: 20px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);">
                <h3 style="font-size: 1.5em; color: #333;">${content}</h3>
                <p><strong>Автор:</strong> ${displayName}</p>
                <p><strong>Категория:</strong> ${category}</p>
                <p><strong>Просмотры:</strong> 0</p>
            </div>`);

            // Добавляем категорию в маркер
            marker.options.category = category;

            // Добавляем новый маркер в список существующих маркеров
            existingMarkers.push(marker);

            map.off('mousemove');
            map.off('click');
            shadowMarker.remove();
        });
    }

    function getIconByCategory(category) {
        let iconUrl;
        switch (category) {
            case 'Истории':
                iconUrl = './sprhist.png'; // Путь к изображению из папки Files
                break;
            case 'Работа':
                iconUrl = './sprwork.png'; // Путь к изображению из папки Files
                break;
            case 'Услуги':
                iconUrl = './sprserv.png'; // Путь к изображению из папки Files
                break;
            default:
                iconUrl = './sprhist.png'; // По умолчанию используем sprhist
        }

        return L.icon({
            iconUrl: iconUrl,
            iconSize: [35, 35], // Размер иконки
            iconAnchor: [16, 32], // Точка привязки иконки
            popupAnchor: [0, -32] // Точка привязки всплывающего окна
        });
    }
}