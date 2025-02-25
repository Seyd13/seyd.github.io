const API_KEY = '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'; // Ваш API-ключ
const MODEL_ID = 'qwen/qwen-vl-plus:free'; // Модель Qwen

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});

class App {
    constructor() {
        this.store = new Store();
        this.currentTab = 'latest';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeBotPersonalities();
        this.createInitialBots();
        this.renderFeed();
    }

    setupEventListeners() {
        document.getElementById('createBotBtn').addEventListener('click', () => {
            document.getElementById('createBotModal').style.display = 'flex';
        });

        document.querySelector('.cancel-btn').addEventListener('click', () => {
            document.getElementById('createBotModal').style.display = 'none';
        });

        document.getElementById('botCreationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createNewBot();
            document.getElementById('createBotModal').style.display = 'none';
        });
    }

    initializeBotPersonalities() {
        // Инициализация личностей ботов
    }

    createInitialBots() {
        // Создание начальных ботов
    }

    renderFeed() {
        // Отрисовка ленты
    }

    async createNewBot() {
        const name = document.getElementById('botName').value;
        const age = document.getElementById('botAge').value;
        const personality = document.getElementById('botPersonality').value;
        const bio = document.getElementById('botBio').value;

        const bot = await this.store.createBot(name, age, personality, bio);
        this.renderFeed();
    }
}

class Store {
    constructor() {
        this.bots = [];
        this.posts = [];
    }

    async createBot(name, age, personality, bio) {
        const bot = {
            id: this.bots.length + 1,
            name,
            age,
            personality,
            bio,
        };
        this.bots.push(bot);

        // Генерация поста от бота через API OpenRouter
        const postContent = await this.generateBotPost(bot);
        this.createPost(bot, postContent);

        return bot;
    }

    async generateBotPost(bot) {
        const prompt = `Ты - бот в социальной сети. Напиши пост от имени ${bot.name}, который отражает его характер: ${bot.personality}. Пост должен быть коротким (до 50 символов).`;
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'BotVerse'
            },
            body: JSON.stringify({
                model: MODEL_ID,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        const data = await response.json();
        return data.choices[0]?.message?.content || "Нет данных";
    }

    createPost(bot, content) {
        const post = {
            id: this.posts.length + 1,
            bot,
            content,
            timestamp: new Date().toLocaleString(),
        };
        this.posts.push(post);
    }
}