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
    script.onload = () => initializeMap(runtime); // Вызываем initializeMap после загрузки Leaflet
    document.head.appendChild(script);

    document.getElementById('addNewsButton').addEventListener('click', async () => {
        if (await authModule.checkAuthAndShowPopup() && runtime.globalVars.map) {
            await mapModule.addNewsMarkers(runtime.globalVars.map, runtime.globalVars.newsMarkers); // Передаем текущие маркеры
            updateLogoutButtonVisibility();
        }
    });

    document.getElementById('logoutButton').addEventListener('click', async () => {
        await authModule.logout();
        updateLogoutButtonVisibility();
    });

    // Добавляем обработчики для кнопок фильтров
    document.getElementById('filterAll').addEventListener('click', () => filterNews(runtime.globalVars.map, runtime.globalVars.newsMarkers, 'all'));
    document.getElementById('filterStories').addEventListener('click', () => filterNews(runtime.globalVars.map, runtime.globalVars.newsMarkers, 'Истории'));
    document.getElementById('filterWork').addEventListener('click', () => filterNews(runtime.globalVars.map, runtime.globalVars.newsMarkers, 'Работа'));
    document.getElementById('filterServices').addEventListener('click', () => filterNews(runtime.globalVars.map, runtime.globalVars.newsMarkers, 'Услуги'));
}

async function initializeMap(runtime) {
    const map = L.map('map').setView([44.9521, 34.1024], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
    runtime.globalVars.map = map;

    // Загружаем новости
    await loadNews(runtime);

    updateLogoutButtonVisibility();
}

async function loadNews(runtime) {
    const { data: newsData, error: newsError } = await supabase.from('news').select('*');
    if (newsError) return console.error('Ошибка загрузки новостей:', newsError.message);

    // Загружаем display_name для всех пользователей из таблицы profiles
    const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('id, display_name');
    if (profilesError) return console.error('Ошибка загрузки профилей:', profilesError.message);

    const profilesMap = profilesData.reduce((map, profile) => {
        map[profile.id] = profile.display_name || 'Unknown';
        return map;
    }, {});

    // Отображаем новости на карте
    runtime.globalVars.newsMarkers = newsData.map(news => {
        const displayName = profilesMap[news.user_id] || 'Unknown';
        const marker = L.marker([news.latitude, news.longitude], {
            icon: getIconByCategory(news.category), // Используем иконку в соответствии с категорией
            draggable: false // Убираем возможность перетаскивания
        }).addTo(runtime.globalVars.map).bindPopup(`<div style="padding: 20px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);">
            <h3 style="font-size: 1.5em; color: #333;">${news.content}</h3>
            <p><strong>Автор:</strong> ${displayName}</p>
            <p><strong>Категория:</strong> ${news.category}</p>
            <p><strong>Просмотры:</strong> ${news.views}</p>
            <div id="comments-${news.id}" class="comments-section">
                <h4>Комментарии:</h4>
                <ul id="comments-list-${news.id}" class="comments-list"></ul>
                <textarea id="comment-input-${news.id}" placeholder="Оставьте комментарий"></textarea>
                <button id="submit-comment-${news.id}">Отправить</button>
            </div>
        </div>`);

        // Добавляем категорию в маркер
        marker.options.category = news.category;

        // Обработчик для загрузки и добавления комментариев
        marker.on('popupopen', () => {
            const commentsList = document.getElementById(`comments-list-${news.id}`);
            const commentInput = document.getElementById(`comment-input-${news.id}`);
            const submitCommentButton = document.getElementById(`submit-comment-${news.id}`);

            // Загружаем комментарии
            loadComments(news.id, commentsList);

            // Обработчик для отправки комментария
            submitCommentButton.addEventListener('click', async () => {
                const content = commentInput.value.trim();
                if (!content) return;

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    // Если пользователь не авторизован, вызываем окно авторизации или регистрации
                    const isAuthenticated = await authModule.checkAuthAndShowPopup();
                    if (!isAuthenticated) {
                        alert('Пожалуйста, войдите в систему, чтобы оставить комментарий.');
                        return;
                    }

                    // Повторно проверяем авторизацию после попытки входа
                    const { data: { user: newUser } } = await supabase.auth.getUser();
                    if (!newUser) {
                        alert('Ошибка авторизации. Пожалуйста, попробуйте снова.');
                        return;
                    }
                }

                const { error } = await supabase
                    .from('comments')
                    .insert([{ news_id: news.id, user_id: user.id, content }]);

                if (error) {
                    console.error('Ошибка добавления комментария:', error.message);
                    return;
                }

                // Очищаем поле ввода
                commentInput.value = '';

                // Обновляем список комментариев
                loadComments(news.id, commentsList);
            });

            // Центрируем карту с учетом смещения
            centerMapWithOffset(runtime.globalVars.map, marker.getLatLng());
        });

        return marker;
    });
}

async function loadComments(newsId, commentsList) {
    const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*, profiles (display_name)')
        .eq('news_id', newsId)
        .order('created_at', { ascending: true });

    if (commentsError) {
        console.error('Ошибка загрузки комментариев:', commentsError.message);
        return;
    }

    commentsList.innerHTML = ''; // Очищаем список комментариев
    commentsData.forEach(comment => {
        const li = document.createElement('li');
        li.textContent = `${comment.profiles.display_name}: ${comment.content}`;
        commentsList.appendChild(li);
    });
}

async function updateLogoutButtonVisibility() {
    document.getElementById('logoutButton').style.display = (await supabase.auth.getUser()).data.user ? 'block' : 'none';
}

function filterNews(map, markers, category) {
    if (!markers) {
        console.error('Маркеры не загружены. Пожалуйста, дождитесь загрузки данных.');
        return;
    }

    // Удаляем все маркеры с карты
    markers.forEach(marker => marker.removeFrom(map));

    // Добавляем только те маркеры, которые соответствуют выбранной категории
    markers.forEach(marker => {
        if (category === 'all' || marker.options.category === category) {
            marker.addTo(map);
        }
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
        iconAnchor: [1, 32], // Точка привязки иконки
        popupAnchor: [0, -32] // Точка привязки всплывающего окна
    });
}

// Функция для центрирования карты с учетом смещения
function centerMapWithOffset(map, latlng) {
    const offset = L.point(0, -100); // Смещение вниз на 100 пикселей
    const center = map.latLngToLayerPoint(latlng);
    const newCenter = center.add(offset);
    const newLatLng = map.layerPointToLatLng(newCenter);
    map.setView(newLatLng, map.getZoom());
}