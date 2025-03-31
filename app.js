import { SUPABASE_URL, SUPABASE_KEY, MAP_CONFIG, CATEGORIES } from './config.js';
import { initiatePayment, checkPaymentStatus } from './Plata.js';

// Инициализация Supabase
const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const mapContainer = document.getElementById('map');
const addNewsBtn = document.getElementById('add-news-btn');
const accountIcon = document.getElementById('account-icon');
const filterChips = document.querySelectorAll('.filter-chip');
const authModal = document.getElementById('auth-modal');
const addNewsModal = document.getElementById('add-news-modal');
const profileModal = document.getElementById('profile-modal');
const closeButtons = document.querySelectorAll('.close');
const authTabs = document.querySelectorAll('.auth-tabs .tab');
const newsTextArea = document.getElementById('news-text');
const charCount = document.getElementById('char-count');
const publishNewsBtn = document.getElementById('publish-news-btn');
const logoutBtn = document.getElementById('logout-btn');
const addressInput = document.getElementById('address-input');

// App state
let currentUser = null;
let newsMap = null;
let locationMap = null;
let locationMarker = null;
let markers = [];
let markersMap = {};
let activeFilter = 'all';
let settings = null;
let previousMapState = null; // Для хранения состояния карты перед открытием карточки

async function initApp() {
    initMap();
    await loadSettings();

    supabase.auth.onAuthStateChange((event, session) => {
        currentUser = session ? session.user : null;
        if (currentUser) {
            updateUIForLoggedInUser();
            console.log('Пользователь вошел:', currentUser.id);
        } else {
            updateUIForLoggedOutUser();
            console.log('Пользователь вышел');
        }
    });

    await checkAuth();
    setupEventListeners();
    await loadNews();
    checkUrlForNews();
    checkPendingPayment();
}

function initMap() {
    newsMap = L.map('map', {
        center: MAP_CONFIG.center,
        zoom: MAP_CONFIG.zoom,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        maxBounds: MAP_CONFIG.bounds,
        maxBoundsViscosity: 1.0,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 60,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        tap: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ''
    }).addTo(newsMap);

    newsMap.setMaxBounds(MAP_CONFIG.bounds);
}

function initLocationMap() {
    if (locationMap) locationMap.remove();
    locationMap = L.map('location-map', {
        center: newsMap.getCenter(),
        zoom: newsMap.getZoom(),
        maxBounds: MAP_CONFIG.bounds,
        maxBoundsViscosity: 1.0
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ''
    }).addTo(locationMap);
    locationMarker = L.marker(newsMap.getCenter(), {
        draggable: true,
        icon: L.divIcon({
            className: 'location-marker',
            html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36"><path fill="none" d="M0 0h24v24H0z"/><path fill="#4CAF50" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
            iconSize: [36, 36],
            iconAnchor: [18, 36]
        })
    }).addTo(locationMap);

    locationMap.on('moveend', () => {
        const center = locationMap.getCenter();
        locationMarker.setLatLng(center);
    });
}

async function loadSettings() {
    try {
        const { data, error } = await supabase.from('settings').select('*');
        if (error) throw error;
        settings = data.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
        }, {});
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error.message);
        settings = {
            stories_limit: 5,
            stories_expiration_hours: 6,
            jobs_cost: 100,
            jobs_expiration_days: 7,
            services_cost: 500,
            services_expiration_days: 7
        };
    }
}

async function checkAuth() {
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        currentUser = data.session ? data.session.user : null;
        if (currentUser) {
            updateUIForLoggedInUser();
        } else {
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error.message);
        currentUser = null;
        updateUIForLoggedOutUser();
    }
}

function updateUIForLoggedInUser() {
    accountIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path fill="#4CAF50" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';
    addNewsBtn.style.display = 'flex';
}

function updateUIForLoggedOutUser() {
    accountIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';
    addNewsBtn.style.display = 'flex';
}

function setupEventListeners() {
    accountIcon.addEventListener('click', () => currentUser ? showProfileModal() : showAuthModal());
    addNewsBtn.addEventListener('click', () => currentUser ? showAddNewsModal() : showAuthModal());
    closeButtons.forEach(btn => btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        modal.style.display = 'none';
        if (modal.id === 'add-news-modal' && locationMap) {
            locationMap.remove();
            locationMap = null;
            publishNewsBtn.disabled = false;
            publishNewsBtn.textContent = 'Опубликовать';
        }
    }));
    authTabs.forEach(tab => tab.addEventListener('click', () => {
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        document.getElementById(`${tab.dataset.tab}-form`).classList.add('active');
    }));
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('register-btn').addEventListener('click', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);
    filterChips.forEach(chip => chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeFilter = chip.dataset.category;
        filterMarkers(activeFilter);
    }));
    newsTextArea.addEventListener('input', () => charCount.textContent = newsTextArea.value.length);
    publishNewsBtn.addEventListener('click', handlePublishNews);
    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal') && !e.target.classList.contains('news-card-modal')) {
            e.target.style.display = 'none';
            if (e.target.id === 'add-news-modal' && locationMap) {
                locationMap.remove();
                locationMap = null;
                publishNewsBtn.disabled = false;
                publishNewsBtn.textContent = 'Опубликовать';
            }
        }
        if (e.target.classList.contains('news-card-modal')) {
            closeNewsCardModal(e.target);
        }
    });
    document.getElementById('news-category').addEventListener('change', toggleImageUpload);
    addressInput.addEventListener('input', handleAddressInput);
}

function showAuthModal() { authModal.style.display = 'block'; }

function showAddNewsModal() {
    if (!currentUser) {
        showAuthModal();
        return;
    }
    addNewsModal.style.display = 'block';
    document.getElementById('news-category').value = 'stories';
    document.getElementById('news-text').value = '';
    charCount.textContent = '0';
    toggleImageUpload();
    setTimeout(() => initLocationMap(), 100);
}

async function showProfileModal() {
    if (!currentUser) {
        console.log('Пользователь не авторизован');
        showAuthModal();
        return;
    }

    try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session || sessionData.session.user.id !== currentUser.id) {
            console.error('Сессия недействительна:', sessionError?.message || 'Нет активной сессии');
            currentUser = null;
            updateUIForLoggedOutUser();
            showAuthModal();
            return;
        }

        let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (profileError) throw profileError;
        if (!profile) {
            const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert({ id: currentUser.id, display_name: 'Не указано' })
                .select()
                .single();
            if (insertError) throw insertError;
            profile = newProfile;
        }

        const { count: newsCount, error: countError } = await supabase
            .from('news')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id);
        if (countError) throw countError;

        const { data: viewsData, error: viewsError } = await supabase
            .from('news')
            .select('views')
            .eq('user_id', currentUser.id);
        if (viewsError) throw viewsError;

        let { data: limitData, error: limitError } = await supabase
            .from('user_limits')
            .select('stories_free_count')
            .eq('user_id', currentUser.id)
            .maybeSingle();
        if (limitError) throw limitError;

        if (!limitData) {
            const { data: newLimit, error: insertError } = await supabase
                .from('user_limits')
                .insert({ user_id: currentUser.id, stories_free_count: settings.stories_limit || 5 })
                .select()
                .single();
            if (insertError) throw insertError;
            limitData = newLimit;
        }

        const totalViews = viewsData ? viewsData.reduce((sum, item) => sum + (item.views || 0), 0) : 0;
        document.getElementById('profile-email').textContent = currentUser.email || 'Не указано';
        document.getElementById('profile-name').textContent = profile.display_name || 'Не указано';
        document.getElementById('profile-posts-count').textContent = newsCount || 0;
        document.getElementById('profile-total-views').textContent = totalViews;
        document.getElementById('profile-stories-limit').textContent = `Осталось бесплатных публикаций в "Истории": ${limitData.stories_free_count}/${settings.stories_limit || 5}`;
        profileModal.style.display = 'block';
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error.message);
        alert('Ошибка загрузки профиля: ' + error.message);
    }
}

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');

    if (!email || !password) {
        errorElement.textContent = 'Введите email и пароль';
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        currentUser = data.user;
        authModal.style.display = 'none';
        updateUIForLoggedInUser();
        errorElement.textContent = '';
    } catch (error) {
        console.error('Ошибка входа:', error.message);
        errorElement.textContent = error.message;
    }
}

async function handleRegister() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const displayName = document.getElementById('register-display-name').value;
    const errorElement = document.getElementById('register-error');

    if (!email || !password || !displayName) {
        errorElement.textContent = 'Введите все данные';
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName }, emailRedirectTo: null }
        });
        if (error) throw error;
        if (!data.session) {
            alert('Регистрация успешна! Пожалуйста, войдите в систему.');
            authModal.style.display = 'none';
            return;
        }
        currentUser = data.user;
        await supabase.from('profiles').insert({ id: currentUser.id, display_name: displayName });
        authModal.style.display = 'none';
        updateUIForLoggedInUser();
        alert('Регистрация успешна! Вы можете начать использовать приложение.');
        errorElement.textContent = '';
    } catch (error) {
        console.error('Ошибка регистрации:', error.message);
        errorElement.textContent = error.message;
    }
}

async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        currentUser = null;
        updateUIForLoggedOutUser();
        profileModal.style.display = 'none';
    } catch (error) {
        console.error('Ошибка выхода:', error.message);
        alert('Ошибка при выхода: ' + error.message);
    }
}

async function handlePublishNews() {
    if (!currentUser) {
        alert('Авторизуйтесь для публикации');
        showAuthModal();
        return;
    }

    try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session || sessionData.session.user.id !== currentUser.id) {
            console.error('Сессия недействительна:', sessionError?.message || 'Нет активной сессии');
            currentUser = null;
            updateUIForLoggedOutUser();
            alert('Ошибка: сессия недействительна, пожалуйста, войдите снова');
            showAuthModal();
            return;
        }

        publishNewsBtn.disabled = true;
        publishNewsBtn.textContent = 'Публикация...';

        const category = document.getElementById('news-category').value;
        const text = document.getElementById('news-text').value.trim();
        const imageInput = document.getElementById('news-image');
        const file = imageInput?.files[0];

        if (!text) {
            alert('Введите текст новости');
            publishNewsBtn.disabled = false;
            publishNewsBtn.textContent = 'Опубликовать';
            return;
        }
        if (text.length > 280) {
            alert('Текст не должен превышать 280 символов');
            publishNewsBtn.disabled = false;
            publishNewsBtn.textContent = 'Опубликовать';
            return;
        }
        if (!locationMarker) {
            alert('Выберите местоположение');
            publishNewsBtn.disabled = false;
            publishNewsBtn.textContent = 'Опубликовать';
            return;
        }

        const position = locationMarker.getLatLng();
        if (!isWithinBounds(position)) {
            alert('Выбранное местоположение находится за пределами Крыма');
            publishNewsBtn.disabled = false;
            publishNewsBtn.textContent = 'Опубликовать';
            return;
        }

        let imageUrl = null;

        if (file && (category === 'stories' || category === 'services')) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Размер файла не должен превышать 5 МБ');
                publishNewsBtn.disabled = false;
                publishNewsBtn.textContent = 'Опубликовать';
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert('Загружайте только изображения');
                publishNewsBtn.disabled = false;
                publishNewsBtn.textContent = 'Опубликовать';
                return;
            }
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const { error: uploadError } = await supabase.storage.from('news-images').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('news-images').getPublicUrl(fileName);
            imageUrl = data.publicUrl;
        }

        if (category === 'stories') {
            let { data: limitData, error: limitError } = await supabase
                .from('user_limits')
                .select('stories_free_count')
                .eq('user_id', currentUser.id)
                .maybeSingle();
            if (limitError) throw limitError;
            if (!limitData) {
                const { data: newLimit, error: insertError } = await supabase
                    .from('user_limits')
                    .insert({ user_id: currentUser.id, stories_free_count: settings.stories_limit || 5 })
                    .select()
                    .single();
                if (insertError) throw insertError;
                limitData = newLimit;
            }
            if (limitData.stories_free_count <= 0) {
                showLimitExceededModal('stories');
                publishNewsBtn.disabled = false;
                publishNewsBtn.textContent = 'Опубликовать';
                return;
            }
            await publishNews(category, text, position, imageUrl, limitData.stories_free_count - 1);
        } else {
            const cost = category === 'jobs' ? (settings.jobs_cost || 100) : (settings.services_cost || 500);
            showPaymentModal(category, cost, async () => {
                const paymentSuccess = await initiatePayment(currentUser.id, category, cost);
                if (paymentSuccess) {
                    await publishNews(category, text, position, imageUrl);
                } else {
                    alert('Платеж не удался');
                    publishNewsBtn.disabled = false;
                    publishNewsBtn.textContent = 'Опубликовать';
                }
            });
        }
    } catch (error) {
        console.error('Ошибка публикации:', error.message);
        alert('Ошибка публикации: ' + error.message);
        publishNewsBtn.disabled = false;
        publishNewsBtn.textContent = 'Опубликовать';
    }
}

async function publishNews(category, text, position, imageUrl, newStoriesCount = null) {
    try {
        const expiresAt = new Date();
        if (category === 'stories') {
            expiresAt.setHours(expiresAt.getHours() + (settings.stories_expiration_hours || 6));
        } else {
            expiresAt.setDate(expiresAt.getDate() + (category === 'jobs' ? (settings.jobs_expiration_days || 7) : (settings.services_expiration_days || 7)));
        }

        const newsData = {
            text,
            category,
            lat: position.lat,
            lng: position.lng,
            user_id: currentUser.id,
            views: 0,
            image_url: imageUrl,
            expires_at: expiresAt.toISOString()
        };

        const { data: insertedNews, error: insertError } = await supabase
            .from('news')
            .insert([newsData])
            .select()
            .single();
        if (insertError) throw insertError;

        if (newStoriesCount !== null) {
            const { error: updateError } = await supabase
                .from('user_limits')
                .update({ stories_free_count: newStoriesCount })
                .eq('user_id', currentUser.id);
            if (updateError) throw updateError;
        }

        const { data: newsWithProfile, error: fetchError } = await supabase
            .from('news')
            .select('*, profiles:profiles!fk_news_user(display_name)')
            .eq('id', insertedNews.id)
            .single();
        if (fetchError) throw fetchError;

        if (!newsWithProfile.profiles || !newsWithProfile.profiles.display_name) {
            newsWithProfile.profiles = { display_name: 'Неизвестно' };
            const { data: profile } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', currentUser.id)
                .maybeSingle();
            if (profile) newsWithProfile.profiles.display_name = profile.display_name;
        }
        addMarker(newsWithProfile);
        newsMap.flyTo([position.lat, position.lng], 10, { duration: 0.5 });

        addNewsModal.style.display = 'none';
        if (locationMap) {
            locationMap.remove();
            locationMap = null;
        }
        alert('Новость успешно опубликована!');
    } catch (error) {
        console.error('Ошибка публикации новости:', error.message);
        alert('Ошибка публикации новости: ' + error.message);
    } finally {
        publishNewsBtn.disabled = false;
        publishNewsBtn.textContent = 'Опубликовать';
    }
}

async function loadNews() {
    clearMarkers();
    try {
        const { data, error } = await supabase
            .from('news')
            .select('*, profiles:profiles!fk_news_user(display_name)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (!data || data.length === 0) {
            console.log('Новости не найдены');
            return;
        }
        data.forEach(news => {
            news.profiles = { display_name: news.profiles?.display_name || 'Неизвестно' };
            addMarker(news);
        });
        if (activeFilter !== 'all') filterMarkers(activeFilter);
    } catch (error) {
        console.error('Ошибка загрузки новостей:', error.message);
        alert('Не удалось загрузить новости: ' + error.message);
    }
}

async function getAddress(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await response.json();
        if (data && data.address) {
            const { city, town, village, road, house_number } = data.address;
            const cityPart = city || town || village || 'Неизвестно';
            const streetPart = road ? `${road}${house_number ? ', ' + house_number : ''}` : '';
            return streetPart ? `${cityPart}, ${streetPart}` : cityPart;
        }
        return 'Адрес не найден';
    } catch (error) {
        console.error('Ошибка геокодирования:', error.message);
        return 'Ошибка адреса';
    }
}

function isNewsViewed(newsId) {
    const viewedNews = JSON.parse(localStorage.getItem('viewedNews') || '[]');
    return viewedNews.includes(newsId);
}

function addMarker(news) {
    const categoryConfig = CATEGORIES[news.category];
    const icon = L.divIcon({
        className: `marker-icon marker-${news.category} ${!isNewsViewed(news.id) ? 'unviewed' : ''}`,
        html: `<div style="background-color: ${categoryConfig.color}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px;">${categoryConfig.icon}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
    const marker = L.marker([news.lat, news.lng], { icon }).addTo(newsMap);
    markers.push(marker);
    markersMap[news.id] = marker;
    marker.news = news;
    marker.category = news.category;

    marker.on('click', () => showNewsCard(news));
}

function showNewsCard(news) {
    const existingModal = document.querySelector('.news-card-modal');
    if (existingModal) existingModal.remove();

    // Сохраняем текущее состояние карты перед зумом
    previousMapState = {
        center: newsMap.getCenter(),
        zoom: newsMap.getZoom()
    };

    // Плавный зум к маркеру
    newsMap.flyTo([news.lat, news.lng], 14, { duration: 1 });

    const modal = document.createElement('div');
    modal.className = 'news-card-modal';
    const categoryConfig = CATEGORIES[news.category];
    const authorName = news.profiles.display_name || 'Неизвестно';
    const isAuthor = currentUser && currentUser.id === news.user_id;
    const deleteButton = isAuthor ? `<button class="delete-btn" data-news-id="${news.id}">Удалить</button>` : '';

    modal.innerHTML = `
        <span class="close" title="Закрыть">×</span>
        <div class="news-card">
            ${news.image_url ? `<img src="${news.image_url}" alt="News image">` : ''}
            <div class="content">
                <div class="category">${categoryConfig.name}</div>
                <div class="text">${news.text}</div>
                <div class="address">Загрузка адреса...</div>
                <div class="meta">
                    <span class="author">Автор: ${authorName}</span>
                    <span class="views">Просмотры: ${news.views || 0}</span>
                    <button class="share-btn" data-news-id="${news.id}">Поделиться</button>
                    ${deleteButton}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.classList.add('active');

    getAddress(news.lat, news.lng).then(address => {
        modal.querySelector('.address').textContent = address;
    });

    if (!isNewsViewed(news.id)) {
        updateNewsViews(news.id, news.views);
        const viewedNews = JSON.parse(localStorage.getItem('viewedNews') || '[]');
        viewedNews.push(news.id);
        localStorage.setItem('viewedNews', JSON.stringify(viewedNews));
        markersMap[news.id].setIcon(L.divIcon({
            className: `marker-icon marker-${news.category}`,
            html: `<div style="background-color: ${categoryConfig.color}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px;">${categoryConfig.icon}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        }));
    }

    modal.querySelector('.share-btn').addEventListener('click', () => {
        const shareUrl = `${window.location.origin}${window.location.pathname}?news=${news.id}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Ссылка скопирована в буфер обмена');
        });
    });

    if (isAuthor) {
        modal.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите удалить эту публикацию?')) {
                handleDeleteNews(news.id, modal);
            }
        });
    }

    modal.querySelector('.close').addEventListener('click', () => closeNewsCardModal(modal));
}

async function updateNewsViews(newsId, currentViews) {
    try {
        const { error } = await supabase
            .from('news')
            .update({ views: (currentViews || 0) + 1 })
            .eq('id', newsId);
        if (error) throw error;
        const viewsElement = document.querySelector(`.news-card-modal .views`);
        if (viewsElement) {
            viewsElement.textContent = `Просмотры: ${(currentViews || 0) + 1}`;
        }
        markersMap[newsId].news.views = (currentViews || 0) + 1;
    } catch (error) {
        console.error('Ошибка обновления просмотров:', error.message);
    }
}

async function handleDeleteNews(newsId, modal) {
    if (!currentUser) {
        alert('Авторизуйтесь для удаления');
        showAuthModal();
        return;
    }
    try {
        const { error } = await supabase
            .from('news')
            .delete()
            .eq('id', newsId)
            .eq('user_id', currentUser.id);
        if (error) throw error;
        newsMap.removeLayer(markersMap[newsId]);
        delete markersMap[newsId];
        markers = markers.filter(m => m.news.id !== newsId);
        modal.remove();
        if (previousMapState) {
            newsMap.flyTo(previousMapState.center, previousMapState.zoom, { duration: 1 });
            previousMapState = null;
        }
    } catch (error) {
        console.error('Ошибка удаления:', error.message);
        alert('Ошибка при удалении публикации: ' + error.message);
    }
}

function closeNewsCardModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => {
        modal.remove();
        if (previousMapState) {
            newsMap.flyTo(previousMapState.center, previousMapState.zoom, { duration: 1 });
            previousMapState = null;
        }
    }, 300); // Совпадает с длительностью transition в CSS
}

function clearMarkers() {
    markers.forEach(marker => newsMap.removeLayer(marker));
    markers = [];
    markersMap = {};
}

function filterMarkers(category) {
    markers.forEach(marker => {
        if (category === 'all' || marker.category === category) {
            if (!newsMap.hasLayer(marker)) newsMap.addLayer(marker);
        } else {
            if (newsMap.hasLayer(marker)) newsMap.removeLayer(marker);
        }
    });
}

function toggleImageUpload() {
    const category = document.getElementById('news-category').value;
    const imageUpload = document.getElementById('image-upload');
    imageUpload.style.display = (category === 'stories' || category === 'services') ? 'block' : 'none';
}

function checkUrlForNews() {
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('news');
    if (newsId && markersMap[newsId]) {
        const marker = markersMap[newsId];
        newsMap.flyTo(marker.getLatLng(), 14, { duration: 1 });
        showNewsCard(marker.news);
    }
}

async function handleAddressInput() {
    const query = addressInput.value;
    const suggestionsContainer = document.getElementById('address-suggestions');
    if (query.length < 3) {
        suggestionsContainer.innerHTML = '';
        return;
    }
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&bounded=1&viewbox=32.5,46.2,36.6,44.3`);
        const data = await response.json();
        suggestionsContainer.innerHTML = '';
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'suggestion';
            div.textContent = item.display_name;
            div.addEventListener('click', () => {
                addressInput.value = item.display_name;
                suggestionsContainer.innerHTML = '';
                locationMap.setView([item.lat, item.lon], 14);
                locationMarker.setLatLng([item.lat, item.lon]);
            });
            suggestionsContainer.appendChild(div);
        });
    } catch (error) {
        console.error('Ошибка поиска адреса:', error.message);
    }
}

function showLimitExceededModal(category) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" title="Закрыть">×</span>
            <h2>Лимит публикаций исчерпан</h2>
            <p>В категории "${CATEGORIES[category].name}" у вас закончились бесплатные публикации (${settings.stories_limit || 5}).</p>
            <p>Попробуйте другую категорию или подождите, пока лимит обновится вручную.</p>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
    modal.querySelector('.close').addEventListener('click', () => modal.remove());
}

function showPaymentModal(category, cost, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" title="Закрыть">×</span>
            <h2>Требуется оплата</h2>
            <p>Публикация в категории "${CATEGORIES[category].name}" стоит ${cost} RUB.</p>
            <button id="pay-btn">Оплатить</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
    modal.querySelector('.close').addEventListener('click', () => {
        modal.remove();
        publishNewsBtn.disabled = false;
        publishNewsBtn.textContent = 'Опубликовать';
    });
    modal.querySelector('#pay-btn').addEventListener('click', () => {
        onConfirm();
        modal.remove();
    });
}

async function checkPendingPayment() {
    const pendingPaymentId = localStorage.getItem('pending_payment_id');
    if (pendingPaymentId && currentUser) {
        await checkPaymentStatus(pendingPaymentId, currentUser.id);
    }
}

function isWithinBounds(position) {
    const bounds = L.latLngBounds(MAP_CONFIG.bounds);
    return bounds.contains(position);
}

document.addEventListener('DOMContentLoaded', initApp);