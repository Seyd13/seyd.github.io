import * as mapModule from "./mapModule.js";
import * as authModule from "./authModule.js";
import { supabase } from "./supabase.js";

runOnStartup(async runtime => {
    runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime) {
    // Загружаем Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Загружаем Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initializeMap(runtime); // Инициализируем карту после загрузки Leaflet
    document.head.appendChild(script);

    // Обработчик для кнопки "Добавить новость"
    document.getElementById('addNewsButton').addEventListener('click', async () => {
        if (await authModule.checkAuthAndShowPopup() && runtime.globalVars.map) {
            await mapModule.addNewsMarkers(runtime.globalVars.map, runtime.globalVars.newsMarkers);
            updateAccountInfo();
        }
    });

    // Обработчики для кнопок фильтров
    document.getElementById('filterAll').addEventListener('click', () => filterNews(runtime.globalVars.map, runtime.globalVars.newsMarkers, 'all'));
    document.getElementById('filterStories').addEventListener('click', () => filterNews(runtime.globalVars.map, runtime.globalVars.newsMarkers, 'Истории'));
    document.getElementById('filterWork').addEventListener('click', () => filterNews(runtime.globalVars.map, runtime.globalVars.newsMarkers, 'Работа'));
    document.getElementById('filterServices').addEventListener('click', () => filterNews(runtime.globalVars.map, runtime.globalVars.newsMarkers, 'Услуги'));

    // Обработчик для иконки аккаунта
    document.getElementById('accountIcon').addEventListener('click', async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            await authModule.checkAuthAndShowPopup();
        } else {
            showAccountInfo(user);
        }
    });

    // Обработчик для кнопки выхода
    document.getElementById('logoutButton').addEventListener('click', async () => {
        await authModule.logout();
    });

    // Обновляем информацию о пользователе при изменении состояния авторизации
    window.addEventListener('authChange', () => updateAccountInfo());
}

async function initializeMap(runtime) {
    // Инициализируем карту
    const map = L.map('map').setView([44.9521, 34.1024], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
    runtime.globalVars.map = map;

    // Загружаем новости
    await loadNews(runtime);

    // Обновляем информацию о пользователе
    updateAccountInfo();
}

async function loadNews(runtime) {
    // Загружаем новости из Supabase
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
            icon: getIconByCategory(news.category),
            draggable: false
        }).addTo(runtime.globalVars.map).bindPopup(`<div style="padding: 20px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); text-align: center;">
            <h3>${news.content}</h3>
            <p>Автор: ${displayName}</p>
            <p>Категория: ${news.category}</p>
            <p>Просмотры: ${news.views}</p>
            <button onclick="closePopup()" style="margin-top: 10px; padding: 5px 10px; background-color: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; display: block; margin-left: auto; margin-right: auto;">Закрыть</button>
        </div>`, {
            closeButton: false,
            autoPan: true,
            autoPanPaddingTopLeft: [20, 20],
            autoPanPaddingBottomRight: [20, 20],
            offset: [0, -20]
        });

        // Добавляем категорию в маркер
        marker.options.category = news.category;

        // Обработчик клика для перемещения карты к маркеру
        marker.on('click', () => {
            const markerLatLng = marker.getLatLng();
            const offsetY = -100; // Смещение по вертикали (в пикселях)
            const offsetLatLng = runtime.globalVars.map.containerPointToLatLng(
                runtime.globalVars.map.latLngToContainerPoint(markerLatLng).add([0, offsetY])
            );

            runtime.globalVars.map.panTo(offsetLatLng, {
                animate: true,
                duration: 0.5
            });
        });

        return marker;
    });
}

async function updateAccountInfo() {
    // Обновляем информацию о пользователе
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, email, subscription_type')
            .eq('id', user.id)
            .single();

        const { data: newsData } = await supabase
            .from('news')
            .select('*')
            .eq('user_id', user.id);

        const totalViews = newsData.reduce((sum, news) => sum + news.views, 0);

        document.getElementById('accountInfo').innerHTML = `
            <div style="padding: 20px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);">
                <h3>Аккаунт</h3>
                <p>Логин: ${profileData.display_name}</p>
                <p>Почта: ${profileData.email}</p>
                <p>Публикаций: ${newsData.length}</p>
                <p>Просмотры: ${totalViews}</p>
                <p>Режим подписки: ${profileData.subscription_type || 'Обычный'}</p>
                <button id="logoutButtonInside" style="margin-top: 10px; padding: 5px 10px; background-color: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">Выйти</button>
                <button onclick="document.getElementById('accountInfo').style.display = 'none'" style="margin-top: 10px; padding: 5px 10px; background-color: #ccc; color: black; border: none; border-radius: 5px; cursor: pointer;">Закрыть</button>
            </div>
        `;

        // Обработчик для кнопки выхода внутри окна информации
        document.getElementById('logoutButtonInside').addEventListener('click', async () => {
            await authModule.logout();
        });
    } else {
        document.getElementById('accountInfo').innerHTML = '';
    }
}

async function showAccountInfo(user = null) {
    // Показываем информацию о пользователе
    if (!user) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return; // Если пользователь не авторизован, выходим
        user = currentUser;
    }

    const accountInfo = document.getElementById('accountInfo');
    accountInfo.style.display = 'block';
    accountInfo.style.position = 'fixed';
    accountInfo.style.top = '50%';
    accountInfo.style.left = '50%';
    accountInfo.style.transform = 'translate(-50%, -50%)';
    accountInfo.style.zIndex = '1000';

    // Обновляем информацию о пользователе
    updateAccountInfo();
}

function filterNews(map, markers, category) {
    // Фильтруем новости по категории
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
    // Возвращаем иконку в зависимости от категории
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

function closePopup() {
    // Закрываем попап
    const popup = document.querySelector('.leaflet-popup');
    if (popup) popup.remove();
}