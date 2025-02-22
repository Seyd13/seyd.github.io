import { supabase } from "./supabase.js";

export async function addNewsMarkers(map, existingMarkers) {
    const categories = ['Истории', 'Работа', 'Услуги'];
    const categoryButtons = document.getElementById('categoryButtons');
    categoryButtons.innerHTML = '';
    categoryButtons.style.display = 'flex';
    categoryButtons.style.flexDirection = 'column';
    categoryButtons.style.alignItems = 'center';

    categories.forEach(cat => {
        const button = document.createElement('button');
        button.textContent = cat;
        button.addEventListener('click', () => showTextInput(map, cat, existingMarkers));
        categoryButtons.appendChild(button);
    });

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Закрыть';
    closeButton.className = 'close';
    closeButton.addEventListener('click', () => {
        categoryButtons.style.display = 'none';
        document.getElementById('addNewsButton').style.display = 'block'; // Показываем кнопку "Добавить новость"
    });
    categoryButtons.appendChild(closeButton);
}

function showTextInput(map, category, existingMarkers) {
    const categoryButtons = document.getElementById('categoryButtons');
    categoryButtons.style.display = 'none';

    const formContainer = document.createElement('div');
    formContainer.className = 'form-container';
    formContainer.style.position = 'fixed';
    formContainer.style.top = '50%';
    formContainer.style.left = '50%';
    formContainer.style.transform = 'translate(-50%, -50%)';
    formContainer.style.backgroundColor = 'white';
    formContainer.style.padding = '20px';
    formContainer.style.borderRadius = '10px';
    formContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    formContainer.style.zIndex = '1000';
    formContainer.style.width = '300px';

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Введите текст новости (максимум 280 символов)';
    textarea.style.width = '100%';
    textarea.style.height = '100px';
    textarea.style.marginBottom = '10px';
    textarea.style.resize = 'none';

    const continueButton = document.createElement('button');
    continueButton.textContent = 'Продолжить';
    continueButton.style.marginRight = '10px';
    continueButton.style.padding = '6px 12px';
    continueButton.style.backgroundColor = '#4CAF50';
    continueButton.style.color = 'white';
    continueButton.style.border = 'none';
    continueButton.style.borderRadius = '4px';
    continueButton.style.cursor = 'pointer';
    continueButton.style.fontSize = '14px';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Закрыть';
    closeButton.style.padding = '6px 12px';
    closeButton.style.backgroundColor = '#f44336';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '4px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '14px';

    formContainer.appendChild(textarea);
    formContainer.appendChild(continueButton);
    formContainer.appendChild(closeButton);
    document.body.appendChild(formContainer);

    continueButton.addEventListener('click', () => {
        const content = textarea.value.trim();
        if (!content) {
            alert("Текст новости не может быть пустым.");
            return;
        }

        if (content.length > 280) {
            alert("Текст новости не должен превышать 280 символов.");
            return;
        }

        formContainer.remove();
        showMarkerPlacement(map, category, content, existingMarkers);
    });

    closeButton.addEventListener('click', () => {
        formContainer.remove();
        categoryButtons.style.display = 'flex';
        document.getElementById('addNewsButton').style.display = 'block'; // Показываем кнопку "Добавить новость"
    });
}

function showMarkerPlacement(map, category, content, existingMarkers) {
    // Скрываем кнопку "Добавить новость"
    const addNewsButton = document.getElementById('addNewsButton');
    addNewsButton.style.display = 'none';

    // Создаем зеленую стрелку (крупнее)
    const shadowMarker = L.marker([map.getCenter().lat, map.getCenter().lng], {
        icon: L.icon({
            iconUrl: './green-arrow.png', // Путь к изображению зеленой стрелки
            iconSize: [50, 50], // Увеличиваем размер стрелки
            iconAnchor: [25, 50], // Центрируем стрелку
            popupAnchor: [0, -50] // Смещаем всплывающее окно
        }),
        draggable: true,
        zIndexOffset: 1000 // Убедимся, что стрелка поверх всех иконок
    }).addTo(map);

    // Приближаем карту к стрелке
    map.setView(shadowMarker.getLatLng(), map.getZoom(), { animate: true });

    // Сообщение "Укажите место на карте" (черный текст)
    const message = document.createElement('div');
    message.textContent = 'Укажите место на карте';
    message.style.position = 'fixed';
    message.style.top = '120px'; // Смещаем сообщение ниже
    message.style.left = '50%';
    message.style.transform = 'translateX(-50%)';
    message.style.backgroundColor = 'white';
    message.style.padding = '10px 20px';
    message.style.borderRadius = '5px';
    message.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    message.style.zIndex = '1000';
    message.style.color = 'black'; // Черный текст
    document.body.appendChild(message);

    // Контейнер для кнопок (привязываем к контейнеру карты)
    const buttonContainer = document.createElement('div');
    buttonContainer.style.position = 'absolute';
    buttonContainer.style.zIndex = '1000';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.gap = '10px';
    document.getElementById('map').appendChild(buttonContainer);

    // Кнопка "Опубликовать" (фиксированного размера, отцентрована относительно стрелки)
    const publishButton = document.createElement('button');
    publishButton.textContent = 'Опубликовать';
    publishButton.style.padding = '10px 20px';
    publishButton.style.backgroundColor = '#4CAF50';
    publishButton.style.color = 'white';
    publishButton.style.border = 'none';
    publishButton.style.borderRadius = '5px';
    publishButton.style.cursor = 'pointer';
    publishButton.style.fontSize = '16px'; // Увеличиваем размер текста
    publishButton.style.whiteSpace = 'nowrap'; // Предотвращаем растягивание
    buttonContainer.appendChild(publishButton);

    // Кнопка "Закрыть" (фиксированного размера, рядом с кнопкой "Опубликовать")
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Закрыть';
    closeButton.style.padding = '10px 20px';
    closeButton.style.backgroundColor = '#f44336';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '16px'; // Увеличиваем размер текста
    closeButton.style.whiteSpace = 'nowrap'; // Предотвращаем растягивание
    buttonContainer.appendChild(closeButton);

    // Функция для обновления позиции кнопок относительно стрелки
    const updateButtonPositions = () => {
        const markerPosition = shadowMarker.getLatLng();
        const pixelPosition = map.latLngToContainerPoint(markerPosition);

        // Центрируем контейнер кнопок относительно стрелки
        buttonContainer.style.left = `${pixelPosition.x - buttonContainer.offsetWidth / 2}px`;
        buttonContainer.style.top = `${pixelPosition.y + 60}px`; // Смещаем ниже стрелки
    };

    // Показываем кнопки сразу после появления стрелки
    updateButtonPositions();
    buttonContainer.style.display = 'flex'; // Отображаем кнопки

    // Скрываем кнопки при начале перемещения стрелки
    shadowMarker.on('dragstart', () => {
        buttonContainer.style.display = 'none';
    });

    // Показываем кнопки и обновляем их позицию при окончании перемещения стрелки
    shadowMarker.on('dragend', () => {
        updateButtonPositions();
        buttonContainer.style.display = 'flex';

        // Перемещаем карту за стрелкой
        map.panTo(shadowMarker.getLatLng(), {
            animate: true,
            duration: 0.5
        });
    });

    // Обновляем позиции кнопок при изменении масштаба карты
    map.on('zoomend', updateButtonPositions);

    // Обновляем позиции при изменении размера окна
    window.addEventListener('resize', updateButtonPositions);

    // Обновляем позиции кнопок в реальном времени при перемещении карты
    map.on('move', updateButtonPositions);

    // Обработчик для кнопки "Опубликовать"
    publishButton.addEventListener('click', async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Пользователь не авторизован. Пожалуйста, войдите в систему.");
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
            .insert([{ content, category, latitude: shadowMarker.getLatLng().lat, longitude: shadowMarker.getLatLng().lng, user_id: user.id }]);

        if (error) {
            console.error('Ошибка сохранения новости:', error.message);
            return;
        }

        const marker = L.marker([shadowMarker.getLatLng().lat, shadowMarker.getLatLng().lng], {
            icon: getIconByCategory(category),
            draggable: false
        }).addTo(map);

        marker.bindPopup(`<div style="padding: 20px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); text-align: center;">
            <h3 style="font-size: 16px; margin: 0;">${content}</h3>
            <p style="font-size: 12px; color: #666; margin: 5px 0;">Автор: ${displayName}</p>
            <p style="font-size: 12px; color: #666; margin: 5px 0;">Категория: ${category}</p>
            <p style="font-size: 12px; color: #666; margin: 5px 0;">Просмотры: 0</p>
            <button onclick="closePopup()" style="margin-top: 10px; padding: 5px 10px; background-color: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; display: block; margin-left: auto; margin-right: auto;">Закрыть</button>
        </div>`, {
            closeButton: false,
            autoPan: true,
            autoPanPaddingTopLeft: [20, 20],
            autoPanPaddingBottomRight: [20, 20],
            offset: [0, -20]
        });

        marker.options.category = category;
        existingMarkers.push(marker);

        shadowMarker.remove();
        buttonContainer.remove();
        message.remove();
        addNewsButton.style.display = 'block'; // Показываем кнопку "Добавить новость" снова
    });

    // Обработчик для кнопки "Закрыть"
    closeButton.addEventListener('click', () => {
        shadowMarker.remove();
        buttonContainer.remove();
        message.remove();
        addNewsButton.style.display = 'block'; // Показываем кнопку "Добавить новость" снова
        document.getElementById('categoryButtons').style.display = 'flex';
    });
}

function getIconByCategory(category) {
    let iconUrl;
    switch (category) {
        case 'Истории':
            iconUrl = './sprhist.png';
            break;
        case 'Работа':
            iconUrl = './sprwork.png';
            break;
        case 'Услуги':
            iconUrl = './sprserv.png';
            break;
        default:
            iconUrl = './sprhist.png';
    }

    return L.icon({
        iconUrl: iconUrl,
        iconSize: [35, 35],
        iconAnchor: [17, 35],
        popupAnchor: [0, -35]
    });
}