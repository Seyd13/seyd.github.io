import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VOXLoader } from 'three/addons/loaders/VOXLoader.js';



function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { // Firefox
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
        elem.msRequestFullscreen();
    }
}

// Вызовите эту функцию при загрузке страницы
window.onload = enterFullscreen;
// Game state
const gameState = {
    isMerging: false,
    money: 1000,
    incomePerSecond: 0,
    language: 'ru',
    installedChips: [],
    inventoryChips: [],
    mergeSlots: [null, null],
    activePopup: null,
    activeTab: null,
    computerRunning: false,
    computerEffects: null,
    maxInstalledChips: 1,
    moneyParticles: [], 
    incomeParticles: [],
    animationsPaused: false,
    basicChipPurchases: 0,
    particleLimit: 50, // Add a limit to the number of particles
    tutorialCompleted: false,
    currentTutorialStep: 0
};

// Language translations
const translations = {
    ru: {
        'chips': 'Чипы 🔲',
        'shop': 'Магазин 🛒',
        'merge': 'Синтез 💥',
        'installed-chips': 'Установленные чипы',
        'basic-chips': 'Базовые чипы',
        'merge-chips': 'Синтез чипов',
        'basic-chip': 'Обычный чип',
        'advanced-chip': 'Улучшенный чип',
        'buy': 'Купить',
        'drop-chip': 'Поместите чип',
        'merge-action': 'Синтезировать',
        'inventory': 'Инвентарь',
        'rarity': 'Редкость',
        'power': 'Вычислительная мощность',
        'income': 'Доход',
        'sell-price': 'Цена продажи',
        'install': 'Установить',
        'sell': 'Продать',
        'merge-success': 'Синтез успешен!',
        'new-chip': 'Новый чип',
        'great': 'Отлично!',
        'rarity-common': 'Обычный',
        'rarity-professional': 'Профессиональный',
        'rarity-exclusive': 'Эксклюзивный',
        'rarity-experimental': 'Экспериментальный',
        'chip-name': 'Чип #{id}',
        'no-chips-installed': 'Нет установленных чипов',
        'empty-inventory': 'Инвентарь пуст',
        'chip-in-merge-slot': 'Чип находится в слоте для синтеза и не может быть установлен',
        'remove': 'Снять',
        'chip-installed': 'Чип установлен!',
        'chip-removed': 'Чип снят с компьютера',
        'max-chips-reached': 'Все слоты заняты!',
        'installed': 'Установлен',
        'not-enough-money': 'Недостаточно денег! Нужно {amount}',
        'sold-chip': 'Продан {name} за {price}!',
        'hide': 'Скрыть',
        'clear': 'Очистить',
        'merge-slots-cleared': 'Слоты для синтеза очищены',
        'tutorial-welcome-title': 'Добро пожаловать в Chip Tycoon!',
        'tutorial-welcome-text': 'В этой игре вы будете создавать и улучшать компьютерные чипы, чтобы увеличить свой доход. Давайте я покажу вам, как играть!',
        'tutorial-computer-title': 'Компьютер',
        'tutorial-computer-text': 'На главном экране ваш компьютер. Нажимайте на него, чтобы вращать и рассматривать со всех сторон.',
        'tutorial-shop-title': 'Магазин чипов',
        'tutorial-shop-text': 'Во вкладке "Магазин" вы можете покупать чипы. Начните с покупки базовых чипов, чтобы получить доход.',
        'tutorial-chips-title': 'Установка чипов',
        'tutorial-chips-text': 'Во вкладке "Чипы" вы можете устанавливать чипы в компьютер. Установленные чипы приносят доход каждую секунду.',
        'tutorial-merge-title': 'Синтез чипов',
        'tutorial-merge-text': 'Во вкладке "Синтез" вы можете объединять чипы, чтобы получать более мощные варианты. Поместите два чипа в слоты и нажмите кнопку синтеза.',
        'tutorial-final-title': 'Готово!',
        'tutorial-final-text': 'Теперь вы знаете основы игры. Удачи в создании самых мощных чипов и увеличении вашего дохода!',
        'next': 'Далее',
        'skip': 'Пропустить',
        'start-playing': 'Начать игру',
        'help': 'Помощь',
    },
    en: {
        'chips': 'Chips 🔲',
        'shop': 'Shop 🛒',
        'merge': 'Merge 💥',
        'installed-chips': 'Installed Chips',
        'basic-chips': 'Basic Chips',
        'merge-chips': 'Merge Chips',
        'basic-chip': 'Basic Chip',
        'advanced-chip': 'Advanced Chip',
        'buy': 'Buy',
        'drop-chip': 'Drop chip here',
        'merge-action': 'Merge',
        'inventory': 'Inventory',
        'rarity': 'Rarity',
        'power': 'Computing Power',
        'income': 'Income',
        'sell-price': 'Sell Price',
        'install': 'Install',
        'sell': 'Sell',
        'merge-success': 'Merge Successful!',
        'new-chip': 'New Chip',
        'great': 'Great!',
        'rarity-common': 'Common',
        'rarity-professional': 'Professional',
        'rarity-exclusive': 'Exclusive',
        'rarity-experimental': 'Experimental',
        'chip-name': 'Chip #{id}',
        'no-chips-installed': 'No chips installed',
        'empty-inventory': 'Inventory is empty',
        'chip-in-merge-slot': 'The chip is in the synthesis slot and cannot be installed',
        'remove': 'Remove',
        'chip-installed': 'Chip installed!',
        'chip-removed': 'Chip removed from computer',
        'max-chips-reached': 'All slots are occupied!',
        'installed': 'Installed',
        'not-enough-money': 'Not enough money! Need {amount}',
        'sold-chip': 'Sold {name} for {price}!',
        'hide': 'Hide',
        'clear': 'Clear',
        'merge-slots-cleared': 'Merge slots cleared',
        'tutorial-welcome-title': 'Welcome to Chip Tycoon!',
        'tutorial-welcome-text': 'In this game, you will create and improve computer chips to increase your income. Let me show you how to play!',
        'tutorial-computer-title': 'The Computer',
        'tutorial-computer-text': 'On the main screen, your computer. Click on it to rotate and view it from all angles.',
        'tutorial-shop-title': 'Chip Shop',
        'tutorial-shop-text': 'In the "Shop" tab, you can buy chips. Start by purchasing basic chips to generate income.',
        'tutorial-chips-title': 'Installing Chips',
        'tutorial-chips-text': 'In the "Chips" tab, you can install chips into your computer. Installed chips generate income every second.',
        'tutorial-merge-title': 'Merging Chips',
        'tutorial-merge-text': 'In the "Merge" tab, you can combine chips to create more powerful ones. Place two chips in the slots and click the merge button.',
        'tutorial-final-title': 'You\'re Ready!',
        'tutorial-final-text': 'Now you know the basics of the game. Good luck creating the most powerful chips and maximizing your income!',
        'next': 'Next',
        'skip': 'Skip',
        'start-playing': 'Start Playing',
        'help': 'Help',
    }
};

// Chip types and rarities
const CHIP_RARITIES = ['common', 'professional', 'exclusive', 'experimental'];
const RARITY_INCOME_RANGES = {
    'common': { min: 1, max: 1000 },
    'professional': { min: 1000, max: 100000 },
    'exclusive': { min: 100000, max: 1000000000 },
    'experimental': { min: 1000000000, max: 999999999999999 }
};

let nextChipId = 1;

// 3D Scene Variables
let scene, camera, renderer, controls;
let computerModel;
let isRotating = false;

// Initialize the game
function init() {
    showLanguageSelect();
}

// Show language selection
function showLanguageSelect() {
    const langOverlay = document.createElement('div');
    langOverlay.classList.add('tutorial-overlay');
    
    const langContent = document.createElement('div');
    langContent.classList.add('tutorial-content');
    
    const title = document.createElement('h2');
    title.textContent = 'Choose Your Language / Выберите язык';
    title.classList.add('tutorial-title');
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('tutorial-actions');
    
    const russianBtn = document.createElement('button');
    russianBtn.classList.add('tutorial-btn');
    russianBtn.textContent = 'Русский';
    russianBtn.addEventListener('click', () => {
        gameState.language = 'ru';
        document.getElementById('ru-lang').classList.add('active');
        document.getElementById('en-lang').classList.remove('active');
        updateLanguageTexts();
        document.body.removeChild(langOverlay);
        continueInitialization();
    });
    
    const englishBtn = document.createElement('button');
    englishBtn.classList.add('tutorial-btn');
    englishBtn.textContent = 'English';
    englishBtn.addEventListener('click', () => {
        gameState.language = 'en';
        document.getElementById('en-lang').classList.add('active');
        document.getElementById('ru-lang').classList.remove('active');
        updateLanguageTexts();
        document.body.removeChild(langOverlay);
        continueInitialization();
    });
    
    buttonsContainer.appendChild(russianBtn);
    buttonsContainer.appendChild(englishBtn);
    
    langContent.appendChild(title);
    langContent.appendChild(buttonsContainer);
    langOverlay.appendChild(langContent);
    
    document.body.appendChild(langOverlay);
}

// Continue initialization after language selection
function continueInitialization() {
    initThreeJS();
    setupEventListeners();
    
    computerModel.userData.chipSlots = computerModel.children.filter(child => 
        child.geometry && child.geometry.type === 'BoxGeometry' && 
        child.geometry.parameters.width === 0.4 
    );
    
    gameState.maxInstalledChips = 1;
    
    if (gameState.inventoryChips.length === 0) {
        gameState.inventoryChips.push(createShopChip('basic'));
        gameState.inventoryChips.push(createShopChip('advanced'));
    }
    
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    gameState.activeTab = null;
    
    updateUI();
    
    if (!localStorage.getItem('tutorialCompleted')) {
        showTutorial();
    } else {
        gameState.tutorialCompleted = true;
    }
    
    setInterval(gameLoop, 1000);
}

// Initialize Three.js scene
function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x243450);  

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('scene-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);  
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);  
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);
    
    const fillLight = new THREE.DirectionalLight(0xccddff, 0.5);
    fillLight.position.set(-10, 5, -10);
    scene.add(fillLight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    controls.autoRotate = false;  
    
    const chipSlots = createVoxelComputer();
    
    updateInstalledChipsVisual(chipSlots);

    animate();
    
    window.addEventListener('resize', onWindowResize);
}

// Create a voxel computer model
function createVoxelComputer() {
    const geometry = new THREE.BoxGeometry(2, 1, 2);
    const materials = [
        new THREE.MeshStandardMaterial({ color: 0x333333 }), 
        new THREE.MeshStandardMaterial({ color: 0x333333 }), 
        new THREE.MeshStandardMaterial({ color: 0x222222 }), 
        new THREE.MeshStandardMaterial({ color: 0x444444 }), 
        new THREE.MeshStandardMaterial({ color: 0x333333 }),  
        new THREE.MeshStandardMaterial({ color: 0x333333 })  
    ];
    
    computerModel = new THREE.Mesh(geometry, materials);
    computerModel.position.y = 0.5; 
    scene.add(computerModel);
    
    addComputerDetails();
    
    const slotSize = 0.4; 
    const slotGeometry = new THREE.BoxGeometry(slotSize, 0.05, slotSize);
    const slotMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x444444,
        emissive: 0x111111
    });
    const slot = new THREE.Mesh(slotGeometry, slotMaterial);
    
    slot.position.set(0, 0.53, 0);
    computerModel.add(slot);
    
    const slots = [slot];

    addComputerEffects();

    return slots;
}

// Add details to the computer model
function addComputerDetails() {
    const panelGeometry = new THREE.BoxGeometry(1.5, 0.2, 0.05);
    const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const frontPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    frontPanel.position.set(0, -0.3, 1.025);
    computerModel.add(frontPanel);
    
    const buttonGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.06, 16);
    const buttonMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.5
    });
    const powerButton = new THREE.Mesh(buttonGeometry, buttonMaterial);
    powerButton.rotation.x = Math.PI / 2;
    powerButton.position.set(0.7, -0.3, 1.05);
    computerModel.add(powerButton);
    
    const usbGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.05);
    const usbMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    
    for (let i = 0; i < 2; i++) {
        const usb = new THREE.Mesh(usbGeometry, usbMaterial);
        usb.position.set(-0.6 + i * 0.2, -0.3, 1.05);
        computerModel.add(usb);
    }
    
    const ventsGeometry = new THREE.BoxGeometry(1.8, 0.05, 1.8);
    const ventsMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x222222,
        transparent: true,
        opacity: 0.9
    });
    const vents = new THREE.Mesh(ventsGeometry, ventsMaterial);
    vents.position.set(0, 0.5, 0);
    computerModel.add(vents);
    
    const sidePanelGeometry = new THREE.BoxGeometry(0.05, 0.8, 1.9);
    const sidePanelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    const leftPanel = new THREE.Mesh(sidePanelGeometry, sidePanelMaterial);
    leftPanel.position.set(-1.025, 0, 0);
    computerModel.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(sidePanelGeometry, sidePanelMaterial);
    rightPanel.position.set(1.025, 0, 0);
    computerModel.add(rightPanel);
    
    const backPanelGeometry = new THREE.BoxGeometry(1.8, 0.8, 0.05);
    const backPanelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    const backPanel = new THREE.Mesh(backPanelGeometry, backPanelMaterial);
    backPanel.position.set(0, 0, -1.025);
    computerModel.add(backPanel);
    
    /*const fanGrillGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
    const fanGrillMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x111111,
        wireframe: true
    });
    
    const fanGrill = new THREE.Mesh(fanGrillGeometry, fanGrillMaterial);
    fanGrill.rotation.x = Math.PI / 2;
    fanGrill.position.set(-0.7, 0, -1.05);
    computerModel.add(fanGrill);*/
}

// Add computer running effects
function addComputerEffects() {
    const effectsGroup = new THREE.Group();
    effectsGroup.visible = false;
    
    const fanGeometry = new THREE.CircleGeometry(0.2, 16);
    const fanMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xaaaaaa, 
        transparent: true, 
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    const fan = new THREE.Mesh(fanGeometry, fanMaterial);
    fan.position.set(-0.7, 0, 0.7);
    fan.rotation.x = -Math.PI / 2;
    effectsGroup.add(fan);
    
    const powerLightGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const powerLightMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00, 
        emissive: 0x00ff00
    });
    const powerLight = new THREE.Mesh(powerLightGeometry, powerLightMaterial);
    powerLight.position.set(0.7, -0.3, 1.05);
    effectsGroup.add(powerLight);
    
    computerModel.add(effectsGroup);
    gameState.computerEffects = effectsGroup;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (gameState.computerRunning && gameState.computerEffects) {
        const fan = gameState.computerEffects.children[0];
        if (fan) {
            fan.rotation.z += 0.1;
        }
        
        const powerLight = gameState.computerEffects.children[1];
        if (powerLight) {
            powerLight.material.emissiveIntensity = 0.7 + 0.3 * Math.sin(Date.now() * 0.005);
        }
    }
    
    updateMoneyParticles();
    updateIncomeParticles();
    
    controls.update();
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Create a new chip
function createChip(options = {}) {
    const id = nextChipId++;
    const rarityIndex = options.rarityIndex !== undefined ? options.rarityIndex : Math.floor(Math.random() * 4);
    const rarity = CHIP_RARITIES[rarityIndex];
    
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    
    const range = RARITY_INCOME_RANGES[rarity];
    const power = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    
    return {
        id,
        name: options.name || translate('chip-name').replace('{id}', id),
        rarity,
        rarityIndex,
        color: `rgb(${r}, ${g}, ${b})`,
        power,
        income: power,
        sellPrice: power * 5 
    };
}

// Generate a shop chip
function createShopChip(type) {
    if (type === 'basic') {
        const basePrice = 100;
        const priceMultiplier = Math.pow(1.1, gameState.basicChipPurchases); 
        const price = Math.floor(basePrice * priceMultiplier);
        
        return {
            id: nextChipId++,
            name: translate('basic-chip'),
            rarity: 'common',
            rarityIndex: 0,
            color: 'rgb(100, 116, 139)',
            power: 1,
            income: 1,
            sellPrice: price * 0.5, 
            price: price
        };
    } else if (type === 'advanced') {
        return {
            id: nextChipId++,
            name: translate('advanced-chip'),
            rarity: 'common',
            rarityIndex: 0,
            color: 'rgb(59, 130, 246)',
            power: 5,
            income: 5,
            sellPrice: 3000,
            price: 500
        };
    }
}

// Merge two chips to create a new one
function mergeChips(chip1, chip2) {
    let newRarityIndex = Math.max(chip1.rarityIndex, chip2.rarityIndex);

    const rarityUpgradeChance = 0.03 + 0.02 * (chip1.rarityIndex + chip2.rarityIndex) / 2;
    if (Math.random() < rarityUpgradeChance && newRarityIndex < CHIP_RARITIES.length - 1) {
        newRarityIndex++;
    }
    
    const basePower = (chip1.power + chip2.power) * (1 + Math.random());
    
    return createChip({
        rarityIndex: newRarityIndex,
        power: Math.floor(basePower)
    });
}

// Format large numbers for display
function formatNumber(num) {
    if (num < 1000) return num.toString();
    
    const units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
    const order = Math.floor(Math.log10(num) / 3);
    const unitValue = 10 ** (order * 3);
    const formattedValue = (num / unitValue).toFixed(2);
    
    return `${formattedValue}${units[order]}`;
}

// Update UI elements
function updateUI() {
    document.getElementById('money-value').textContent = formatNumber(Math.floor(gameState.money));
    document.getElementById('income-value').textContent = formatNumber(gameState.incomePerSecond);
    
    updateInstalledChips();
    updateInventoryChips();
    updateMergeSlots();
    
    const mergeBtn = document.getElementById('merge-btn');
    mergeBtn.disabled = !(gameState.mergeSlots[0] && gameState.mergeSlots[1]);
}

// Update installed chips display
function updateInstalledChips() {
    const installedChipsContainer = document.getElementById('installed-chips');
    installedChipsContainer.innerHTML = '';
    
    if (gameState.installedChips.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.classList.add('empty-message');
        emptyMessage.textContent = translate('no-chips-installed');
        installedChipsContainer.appendChild(emptyMessage);
        return;
    }
    
    gameState.installedChips.forEach(chip => {
        const chipElement = createChipElement(chip, true);
        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-btn');
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeChip(chip);
        });
        chipElement.appendChild(removeBtn);
        installedChipsContainer.appendChild(chipElement);
    });
}

// Update inventory chips display
function updateInventoryChips() {
    const inventoryChipsContainer = document.getElementById('inventory-chips');
    inventoryChipsContainer.innerHTML = '';
    if (gameState.inventoryChips.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.classList.add('empty-message');
        emptyMessage.textContent = translate('empty-inventory');
        inventoryChipsContainer.appendChild(emptyMessage);
        return;
    }
    const sortedChips = [...gameState.inventoryChips].sort((a, b) => b.income - a.income);
    sortedChips.forEach(chip => {
        const chipElement = createChipElement(chip);
        
        // Добавляем проверку на чипы в слотах слияния
        if (gameState.mergeSlots.some(slotChip => slotChip && slotChip.id === chip.id)) {
            chipElement.classList.add('disabled-chip');
            chipElement.style.pointerEvents = 'none';
            chipElement.style.opacity = '0.5';
        }
        
        inventoryChipsContainer.appendChild(chipElement);
    });
}

// Create a chip UI element
function createChipElement(chip, isInstalled = false) {
    const chipElement = document.createElement('div');
    chipElement.classList.add('chip-item');
    chipElement.dataset.chipId = chip.id;
    
    const chipPreview = document.createElement('div');
    chipPreview.classList.add('chip-preview', chip.rarity);
    chipPreview.style.backgroundColor = chip.color;
    
    const chipIcon = document.createElement('div');
    chipIcon.classList.add('chip-icon');
    const emblemColor = getEmblemColorByRarity(chip.rarity);
    chipIcon.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="60" height="60" fill="none" stroke="${emblemColor}" stroke-width="4" />
        <rect x="30" y="30" width="40" height="40" fill="none" stroke="${emblemColor}" stroke-width="2" />
        <circle cx="50" cy="50" r="10" fill="${emblemColor}" fill-opacity="0.5" />
        <line x1="50" y1="15" x2="50" y2="30" stroke="${emblemColor}" stroke-width="4" />
        <line x1="50" y1="70" x2="50" y2="85" stroke="${emblemColor}" stroke-width="4" />
        <line x1="15" y1="50" x2="30" y2="50" stroke="${emblemColor}" stroke-width="4" />
        <line x1="70" y1="50" x2="85" y2="50" stroke="${emblemColor}" stroke-width="4" />
    </svg>`;
    chipPreview.appendChild(chipIcon);
    
    const chipDetails = document.createElement('div');
    chipDetails.classList.add('chip-details');
    
    const chipName = document.createElement('div');
    chipName.classList.add('chip-name');
    chipName.textContent = chip.name;
    
    const chipIncome = document.createElement('div');
    chipIncome.classList.add('chip-income');
    chipIncome.textContent = `+${formatNumber(chip.income)}/s`;
    
    chipDetails.appendChild(chipName);
    chipDetails.appendChild(chipIncome);
    
    chipElement.appendChild(chipPreview);
    chipElement.appendChild(chipDetails);
    
    if (gameState.activeTab === 'merge-panel' && !isInstalled) {
        const sellBtn = document.createElement('button');
        sellBtn.classList.add('sell-btn-small');
        sellBtn.textContent = translate('sell');
        sellBtn.title = translate('sell');
        sellBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sellChip(chip, false);
            
            addClickEffect(e);
        });
        chipElement.appendChild(sellBtn);
    }
    
    chipElement.addEventListener('click', (e) => {
        addClickEffect(e);
        
        chipElement.classList.add('chip-pulse');
        setTimeout(() => {
            chipElement.classList.remove('chip-pulse');
        }, 300);
        
        if (gameState.activeTab === 'merge-panel') {
            selectChipForMerge(chip);
        } else if (gameState.activeTab === 'chips-panel') {
            showChipDetails(chip, isInstalled);
        } else {
            showChipDetails(chip, isInstalled);
        }
    });
    
    return chipElement;
}

// Update merge slots display
function updateMergeSlots() {
    for (let slotIndex = 0; slotIndex < 2; slotIndex++) {
        const slotElement = document.getElementById(`merge-slot-${slotIndex + 1}`);
        const chip = gameState.mergeSlots[slotIndex];
        slotElement.innerHTML = '';
        slotElement.classList.remove('has-chip');
        if (chip) {
            slotElement.classList.add('has-chip');
            const chipPreview = document.createElement('div');
            chipPreview.classList.add('chip-preview', chip.rarity);
            chipPreview.style.backgroundColor = chip.color;
            const chipIcon = document.createElement('div');
            chipIcon.classList.add('chip-icon');
            const emblemColor = getEmblemColorByRarity(chip.rarity);
            chipIcon.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="20" width="60" height="60" fill="none" stroke="${emblemColor}" stroke-width="4" />
                <rect x="30" y="30" width="40" height="40" fill="none" stroke="${emblemColor}" stroke-width="2" />
                <circle cx="50" cy="50" r="10" fill="${emblemColor}" fill-opacity="0.5" />
                <line x1="50" y1="15" x2="50" y2="30" stroke="${emblemColor}" stroke-width="4" />
                <line x1="50" y1="70" x2="50" y2="85" stroke="${emblemColor}" stroke-width="4" />
                <line x1="15" y1="50" x2="30" y2="50" stroke="${emblemColor}" stroke-width="4" />
                <line x1="70" y1="50" x2="85" y2="50" stroke="${emblemColor}" stroke-width="4" />
            </svg>`;
            chipPreview.appendChild(chipIcon);
            slotElement.appendChild(chipPreview);
        } else {
            const placeholder = document.createElement('div');
            placeholder.classList.add('merge-placeholder');
            placeholder.textContent = translate('drop-chip');
            slotElement.appendChild(placeholder);
        }
    }
    const mergeInventoryContainer = document.getElementById('merge-inventory-chips');
    if (mergeInventoryContainer) {
        mergeInventoryContainer.innerHTML = '';
        if (gameState.inventoryChips.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.classList.add('empty-message');
            emptyMessage.textContent = translate('empty-inventory');
            mergeInventoryContainer.appendChild(emptyMessage);
            return;
        }
        const sortedChips = [...gameState.inventoryChips].sort((a, b) => a.income - b.income);
        sortedChips.forEach(chip => {
            const chipElement = createChipElement(chip);
            
            // Добавляем проверку на установленный чип
            if (gameState.installedChips.some(installedChip => installedChip.id === chip.id)) {
                chipElement.classList.add('disabled-chip');
                chipElement.style.pointerEvents = 'none';
                chipElement.style.opacity = '0.5';
            }
            
            mergeInventoryContainer.appendChild(chipElement);
        });
    }
}

// Select a chip for merging
function selectChipForMerge(chip) {
    // Проверяем, установлен ли чип
    if (gameState.installedChips.some(installedChip => installedChip.id === chip.id)) {
        showToast(translate('chip-installed-cant-merge'), 'info');
        return;
    }
    
    let slotIndex = -1;
    if (!gameState.mergeSlots[0]) {
        slotIndex = 0;
    } else if (!gameState.mergeSlots[1]) {
        slotIndex = 1;
    } else {
        slotIndex = 0;
    }
    const existingSlotIndex = gameState.mergeSlots.findIndex(slotChip => slotChip && slotChip.id === chip.id);
    if (existingSlotIndex !== -1) {
        gameState.mergeSlots[existingSlotIndex] = null;
        updateMergeSlots();
        return;
    }
    gameState.mergeSlots[slotIndex] = chip;
    updateMergeSlots();
    const mergeBtn = document.getElementById('merge-btn');
    mergeBtn.disabled = !(gameState.mergeSlots[0] && gameState.mergeSlots[1]);
}

// Show chip details popup
function showChipDetails(chip, isInstalled) {
    const popup = document.getElementById('chip-info-popup');
    
    document.getElementById('popup-chip-name').textContent = chip.name;
    
    const chipPreview = popup.querySelector('.popup-chip-preview');
    chipPreview.className = 'popup-chip-preview ' + chip.rarity;
    chipPreview.style.backgroundColor = chip.color;
    
    const emblemColor = getEmblemColorByRarity(chip.rarity);
    const chipIcon = document.createElement('div');
    chipIcon.classList.add('chip-icon');
    chipIcon.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="60" height="60" fill="none" stroke="${emblemColor}" stroke-width="4" />
        <rect x="30" y="30" width="40" height="40" fill="none" stroke="${emblemColor}" stroke-width="2" />
        <circle cx="50" cy="50" r="10" fill="${emblemColor}" fill-opacity="0.5" />
        <line x1="50" y1="15" x2="50" y2="30" stroke="${emblemColor}" stroke-width="4" />
        <line x1="50" y1="70" x2="50" y2="85" stroke="${emblemColor}" stroke-width="4" />
        <line x1="15" y1="50" x2="30" y2="50" stroke="${emblemColor}" stroke-width="4" />
        <line x1="70" y1="50" x2="85" y2="50" stroke="${emblemColor}" stroke-width="4" />
    </svg>`;
    chipPreview.innerHTML = '';
    chipPreview.appendChild(chipIcon);
    
    document.getElementById('popup-chip-rarity').textContent = translate(`rarity-${chip.rarity}`);
    document.getElementById('popup-chip-power').textContent = formatNumber(chip.power);
    document.getElementById('popup-chip-income').textContent = formatNumber(chip.income);
    document.getElementById('popup-chip-sell-price').textContent = formatNumber(chip.sellPrice);
    
    const installBtn = document.getElementById('popup-install-btn');
    
    if (isInstalled) {
        installBtn.textContent = translate('remove');
        installBtn.disabled = false;
        installBtn.onclick = () => removeChip(chip);
        installBtn.classList.remove('install-btn');
        installBtn.classList.add('remove-btn');
    } else {
        installBtn.textContent = translate('install');
        installBtn.disabled = false; 
        installBtn.onclick = () => installChip(chip);
        installBtn.classList.add('install-btn');
        installBtn.classList.remove('remove-btn');
    }
    
    const sellBtn = document.getElementById('popup-sell-btn');
    sellBtn.onclick = () => sellChip(chip, isInstalled);
    
    showPopup('chip-info-popup');
}

// Install a chip from inventory
function installChip(chip) {
    // Проверяем, находится ли чип в слотах для слияния
    if (gameState.mergeSlots.some(slotChip => slotChip && slotChip.id === chip.id)) {
        showToast(translate('chip-in-merge-slot'), 'info');
        return;
    }
    
    if (gameState.installedChips.length >= gameState.maxInstalledChips) {
        const chipToRemove = gameState.installedChips[0];
        gameState.installedChips = [];
        gameState.inventoryChips.push(chipToRemove);
        showToast(translate('chip-removed'), 'info');
    }
    gameState.inventoryChips = gameState.inventoryChips.filter(c => c.id !== chip.id);
    gameState.installedChips.push(chip);
    recalculateIncome();
    updateUI();
    updateInstalledChipsVisual(computerModel.userData.chipSlots);
    updateComputerRunningState();
    animateChipInstallation(chip);
    showToast(translate('chip-installed'), 'success');
    closePopup();
}

// Animate chip installation
function animateChipInstallation(chip) {
    const emptySlotIndex = gameState.installedChips.length - 1;
    if (emptySlotIndex >= 0 && emptySlotIndex < computerModel.userData.chipSlots.length) {
        const slotPosition = computerModel.userData.chipSlots[emptySlotIndex].position.clone();
        
        const chipGeometry = new THREE.BoxGeometry(0.25, 0.05, 0.25);
        const chipMaterial = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(chip.color),
            emissive: new THREE.Color(chip.color),
            emissiveIntensity: 0.2
        });
        
        const animChip = new THREE.Mesh(chipGeometry, chipMaterial);
        animChip.position.set(slotPosition.x, slotPosition.y + 1, slotPosition.z);
        computerModel.add(animChip);
        
        const glowGeometry = new THREE.BoxGeometry(0.3, 0.01, 0.3);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(chip.color),
            transparent: true,
            opacity: 0
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y -= 0.02;
        animChip.add(glow);
        
        const startTime = Date.now();
        const duration = 800; 
        
        function animateInstall() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easing = progress < 0.5 
                ? 4 * progress ** 3 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            animChip.position.y = slotPosition.y + 1 * (1 - easing);
            
            animChip.material.opacity = Math.min(progress * 2, 1);
            glow.material.opacity = Math.min(progress * 2, 0.5);
            
            animChip.rotation.y = progress * Math.PI * 2;
            
            if (progress < 1) {
                requestAnimationFrame(animateInstall);
            } else {
                setTimeout(() => {
                    computerModel.remove(animChip);
                }, 200);
            }
        }
        
        animateInstall();
    }
}

// Remove a chip from the computer
function removeChip(chip) {
    const chipIndex = gameState.installedChips.findIndex(c => c.id === chip.id);
    
    if (chipIndex !== -1) {
        animateChipRemoval(chip, chipIndex);
        
        gameState.installedChips = gameState.installedChips.filter(c => c.id !== chip.id);
        
        gameState.inventoryChips.push(chip);
        
        recalculateIncome();
        
        updateUI();
        
        updateInstalledChipsVisual(computerModel.userData.chipSlots);
        
        updateComputerRunningState();
        
        showToast(translate('chip-removed'), 'info');
        
        closePopup();
    }
}

// Animate chip removal
function animateChipRemoval(chip, slotIndex) {
    if (slotIndex >= 0 && slotIndex < computerModel.userData.chipSlots.length) {
        const slotPosition = computerModel.userData.chipSlots[slotIndex].position.clone();
        
        let chipVisual = null;
        computerModel.children.forEach(child => {
            if (child.userData.isChipVisual && child.userData.chipId === chip.id) {
                chipVisual = child;
            }
        });
        
        if (chipVisual) {
            const chipGeometry = new THREE.BoxGeometry(0.25, 0.05, 0.25);
            const chipMaterial = new THREE.MeshStandardMaterial({ 
                color: new THREE.Color(chip.color),
                emissive: new THREE.Color(chip.color),
                emissiveIntensity: 0.2
            });
            
            const animChip = new THREE.Mesh(chipGeometry, chipMaterial);
            animChip.position.copy(slotPosition);
            animChip.position.y += 0.05;
            computerModel.add(animChip);
            
            let currentGlowOpacity = 0; 
            if (chip.rarityIndex > 0) {
                currentGlowOpacity = 0.1 + (chip.rarityIndex * 0.1);
                const glowGeometry = new THREE.BoxGeometry(0.3, 0.01, 0.3);
                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(chip.color),
                    transparent: true,
                    opacity: currentGlowOpacity
                });
                const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                glow.position.y -= 0.02;
                animChip.add(glow);
            }
            
            const startTime = Date.now();
            const duration = 800; 
            
            function animateRemove() {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const easing = progress < 0.5 
                    ? 4 * progress ** 3 
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                
                animChip.position.y = slotPosition.y + 0.05 + easing * 1;
                
                animChip.material.opacity = 1 - easing;
                if (animChip.children.length > 0) {
                    animChip.children[0].material.opacity = (1 - easing) * currentGlowOpacity;
                }
                
                animChip.rotation.y = progress * Math.PI * 2;
                
                if (progress < 1) {
                    requestAnimationFrame(animateRemove);
                } else {
                    computerModel.remove(animChip);
                }
            }
            
            animateRemove();
        }
    }
}

// Update computer running state visuals
function updateComputerRunningState() {
    if (!gameState.computerEffects) return;
    
    gameState.computerRunning = gameState.installedChips.length > 0;
    gameState.computerEffects.visible = gameState.computerRunning;
    
    const powerBtn = document.getElementById('power-button');
    if (powerBtn) {
        powerBtn.classList.toggle('on', gameState.computerRunning);
    }
}

// Update 3D visualization of installed chips
function updateInstalledChipsVisual(slots) {
    computerModel.children.forEach(child => {
        if (child.userData.isChipVisual) {
            computerModel.remove(child);
        }
    });
    
    gameState.installedChips.forEach((chip, index) => {
        if (index < slots.length) {
            const slotPosition = slots[index].position.clone();
            
            const chipGeometry = new THREE.BoxGeometry(0.25, 0.05, 0.25);
            const chipMaterial = new THREE.MeshStandardMaterial({ 
                color: new THREE.Color(chip.color),
                emissive: new THREE.Color(chip.color),
                emissiveIntensity: 0.2
            });
            
            const chipVisual = new THREE.Mesh(chipGeometry, chipMaterial);
            chipVisual.position.copy(slotPosition);
            chipVisual.position.y += 0.05;
            chipVisual.userData.isChipVisual = true;
            chipVisual.userData.chipId = chip.id;
            
            const emblemGeometry = new THREE.PlaneGeometry(0.2, 0.2);
            const emblemTexture = new THREE.CanvasTexture(createChipEmblemTexture(chip.rarity));
            const emblemMaterial = new THREE.MeshBasicMaterial({
                map: emblemTexture,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            
            const emblem = new THREE.Mesh(emblemGeometry, emblemMaterial);
            emblem.rotation.x = -Math.PI / 2;
            emblem.position.y = 0.026;
            chipVisual.add(emblem);
            
            computerModel.add(chipVisual);
        }
    });
}

// Create a canvas texture for chip emblem
function createChipEmblemTexture(rarity = 'common') {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const emblemColor = getEmblemColorByRarity(rarity);
    
    ctx.strokeStyle = emblemColor;
    ctx.lineWidth = 4;
    
    ctx.strokeRect(20, 20, 88, 88);
    
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, 58, 58);
    
    ctx.beginPath();
    ctx.arc(64, 64, 15, 0, Math.PI * 2);
    ctx.fillStyle = emblemColor.replace(')', ', 0.5)').replace('rgb', 'rgba');
    ctx.fill();
    
    ctx.lineWidth = 4;
    
    ctx.beginPath();
    ctx.moveTo(64, 10);
    ctx.lineTo(64, 30);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(64, 98);
    ctx.lineTo(64, 118);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(10, 64);
    ctx.lineTo(30, 64);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(98, 64);
    ctx.lineTo(118, 64);
    ctx.stroke();
    
    return canvas;
}

// Get emblem color based on chip rarity
function getEmblemColorByRarity(rarity) {
    switch(rarity) {
        case 'common':
            return 'rgba(255, 255, 255, 0.7)';
        case 'professional':
            return 'rgb(59, 130, 246)';
        case 'exclusive':
            return 'rgb(139, 92, 246)';
        case 'experimental':
            return 'rgb(239, 68, 68)';
        default:
            return 'rgba(255, 255, 255, 0.7)';
    }
}

// Show merge result popup
function showMergeResult(newChip) {
    const popup = document.getElementById('merge-result-popup');
    
    const chipPreview = document.getElementById('new-chip-preview');
    chipPreview.className = 'popup-chip-preview ' + newChip.rarity;
    chipPreview.style.backgroundColor = newChip.color;
    
    const emblemColor = getEmblemColorByRarity(newChip.rarity);
    const chipIcon = document.createElement('div');
    chipIcon.classList.add('chip-icon');
    chipIcon.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="60" height="60" fill="none" stroke="${emblemColor}" stroke-width="4" />
        <rect x="30" y="30" width="40" height="40" fill="none" stroke="${emblemColor}" stroke-width="2" />
        <circle cx="50" cy="50" r="10" fill="${emblemColor}" fill-opacity="0.5" />
        <line x1="50" y1="15" x2="50" y2="30" stroke="${emblemColor}" stroke-width="4" />
        <line x1="50" y1="70" x2="50" y2="85" stroke="${emblemColor}" stroke-width="4" />
        <line x1="15" y1="50" x2="30" y2="50" stroke="${emblemColor}" stroke-width="4" />
        <line x1="70" y1="50" x2="85" y2="50" stroke="${emblemColor}" stroke-width="4" />
    </svg>`;
    chipPreview.innerHTML = '';
    chipPreview.appendChild(chipIcon);
    
    document.getElementById('new-chip-name').textContent = newChip.name;
    document.getElementById('new-chip-rarity').textContent = translate(`rarity-${newChip.rarity}`);
    document.getElementById('new-chip-power').textContent = formatNumber(newChip.power);
    document.getElementById('new-chip-income').textContent = formatNumber(newChip.income);
    
    showPopup('merge-result-popup');
}

// Buy a chip from the shop
function buyChip(type) {
    const chip = createShopChip(type);
    
    if (gameState.money >= chip.price) {
        createMoneySpendParticles(chip.price);
        
        const moneyValue = document.getElementById('money-value');
        moneyValue.style.transform = 'scale(0.8)';
        moneyValue.style.color = 'var(--danger-color)';
        setTimeout(() => {
            moneyValue.style.transform = '';
            moneyValue.style.color = '';
        }, 300);
        
        gameState.money -= chip.price;
        gameState.inventoryChips.push(chip);
        
        const shopChipElement = document.querySelector(`.shop-chip[data-type="${type}"]`);
        if (shopChipElement) {
            shopChipElement.classList.add('chip-bought-animation');
            setTimeout(() => {
                shopChipElement.classList.remove('chip-bought-animation');
            }, 500);
        }
        
        updateUI();
        
        if (type === 'basic') {
            gameState.basicChipPurchases++;
            
            const basicChipPrice = document.querySelector('.shop-chip[data-type="basic"] .chip-price');
            const newPrice = 100 * Math.pow(1.1, gameState.basicChipPurchases); 
            basicChipPrice.textContent = `$${formatNumber(Math.floor(newPrice))}`;
        }
    } else {
        showToast(translate('not-enough-money').replace('{amount}', formatNumber(chip.price)), 'error');
        
        const moneyValue = document.getElementById('money-value');
        moneyValue.classList.add('shake-animation');
        setTimeout(() => {
            moneyValue.classList.remove('shake-animation');
        }, 500);
    }
}

// Perform chip merge
function performMerge() {
    if(gameState.isMerging) return; // Блокируем повторные нажатия
    
    gameState.isMerging = true; // Устанавливаем флаг слияния
    const chip1 = gameState.mergeSlots[0];
    const chip2 = gameState.mergeSlots[1];
    
    if (!chip1 || !chip2) {
        gameState.isMerging = false;
        return;
    }
    
    const rarityCostMultiplier = [1, 3, 10, 30]; 
    const rarity1Multiplier = rarityCostMultiplier[chip1.rarityIndex] || 1;
    const rarity2Multiplier = rarityCostMultiplier[chip2.rarityIndex] || 1;
    const mergeCost = Math.floor((chip1.power + chip2.power) * 0.2 * (rarity1Multiplier + rarity2Multiplier));
    
    if (gameState.money < mergeCost) {
        showToast(translate('not-enough-money').replace('{amount}', formatNumber(mergeCost)), 'error');
        const moneyValue = document.getElementById('money-value');
        moneyValue.classList.add('shake-animation');
        setTimeout(() => {
            moneyValue.classList.remove('shake-animation');
        }, 500);
        gameState.isMerging = false;
        return;
    }
    
    createMoneySpendParticles(mergeCost);
    gameState.money -= mergeCost;
    
    animateMerge(chip1, chip2, () => {
        const newChip = mergeChips(chip1, chip2);
        gameState.inventoryChips = gameState.inventoryChips.filter(chip => 
            chip.id !== chip1.id && chip.id !== chip2.id
        );
        gameState.inventoryChips.push(newChip);
        gameState.mergeSlots = [null, null];
        updateUI();
        showMergeResult(newChip);
        gameState.isMerging = false; // Снимаем флаг после завершения
    });
}

// Animate the merge process
function animateMerge(chip1, chip2, callback) {
    const slot1 = document.getElementById('merge-slot-1');
    const slot2 = document.getElementById('merge-slot-2');
    
    const slot1Rect = slot1.getBoundingClientRect();
    const slot2Rect = slot2.getBoundingClientRect();
    
    const centerX = (slot1Rect.left + slot2Rect.right) / 2;
    const centerY = (slot1Rect.top + slot2Rect.bottom) / 2;
    
    const clone1 = document.createElement('div');
    clone1.classList.add('chip-preview', chip1.rarity);
    clone1.style.position = 'absolute';
    clone1.style.width = '80px';
    clone1.style.height = '80px';
    clone1.style.backgroundColor = chip1.color;
    clone1.style.borderRadius = '0.25rem';
    clone1.style.left = `${slot1Rect.left + slot1Rect.width/2 - 40}px`;
    clone1.style.top = `${slot1Rect.top + slot1Rect.height/2 - 40}px`;
    clone1.style.zIndex = '1000';
    clone1.style.pointerEvents = 'none';
    clone1.style.opacity = '1';
    
    const clone2 = document.createElement('div');
    clone2.classList.add('chip-preview', chip2.rarity);
    clone2.style.position = 'absolute';
    clone2.style.width = '80px';
    clone2.style.height = '80px';
    clone2.style.backgroundColor = chip2.color;
    clone2.style.borderRadius = '0.25rem';
    clone2.style.left = `${slot2Rect.left + slot2Rect.width/2 - 40}px`;
    clone2.style.top = `${slot2Rect.top + slot2Rect.height/2 - 40}px`;
    clone2.style.zIndex = '1000';
    clone2.style.pointerEvents = 'none';
    clone2.style.opacity = '1';
    
    document.body.appendChild(clone1);
    document.body.appendChild(clone2);
    
    setTimeout(() => {
        clone1.style.left = `${centerX - 40}px`;
        clone1.style.top = `${centerY - 40}px`;
        clone1.style.transform = 'scale(0.7) rotate(180deg)';
        
        clone2.style.left = `${centerX - 40}px`;
        clone2.style.top = `${centerY - 40}px`;
        clone2.style.transform = 'scale(0.7) rotate(-180deg)';
    }, 100);
    
    setTimeout(() => {
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.left = `${centerX - 75}px`;
        flash.style.top = `${centerY - 75}px`;
        flash.style.width = '150px';
        flash.style.height = '150px';
        flash.style.backgroundColor = 'white';
        flash.style.borderRadius = '50%';
        flash.style.zIndex = '999';
        flash.style.opacity = '0';
        flash.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(flash);
        
        setTimeout(() => { flash.style.opacity = '0.8'; }, 50);
        setTimeout(() => { flash.style.opacity = '0'; }, 350);
        
        setTimeout(() => {
            document.body.removeChild(clone1);
            document.body.removeChild(clone2);
            document.body.removeChild(flash);
            
            callback();
        }, 600);
        
    }, 600);
}

// Sell a chip
function sellChip(chip, isInstalled) {
    if (isInstalled) {
        gameState.installedChips = gameState.installedChips.filter(c => c.id !== chip.id);
        
        recalculateIncome();
        
        updateInstalledChipsVisual(computerModel.userData.chipSlots);
        
        updateComputerRunningState();
    } else {
        gameState.inventoryChips = gameState.inventoryChips.filter(c => c.id !== chip.id);
        
        for (let i = 0; i < gameState.mergeSlots.length; i++) {
            if (gameState.mergeSlots[i] && gameState.mergeSlots[i].id === chip.id) {
                gameState.mergeSlots[i] = null;
            }
        }
    }
    
    const moneyValue = document.getElementById('money-value');
    moneyValue.style.transform = 'scale(1.2)';
    moneyValue.style.color = 'var(--success-color)';
    setTimeout(() => {
        moneyValue.style.transform = '';
        moneyValue.style.color = '';
    }, 300);
    
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            createIncomeParticles();
        }, i * 100);
    }
    
    gameState.money += chip.sellPrice;
    
    showToast(translate('sold-chip')
        .replace('{name}', chip.name)
        .replace('{price}', formatNumber(chip.sellPrice)), 'success');
    
    updateUI();
    
    closePopup();
}

// Create money spend particles
function createMoneySpendParticles(amount) {
    const container = document.getElementById('money-container');
    const containerRect = container.getBoundingClientRect();
    
    const particleCount = Math.min(5, Math.max(2, Math.floor(amount / 200)));
    
    if (gameState.moneyParticles.length > gameState.particleLimit) {
        while (gameState.moneyParticles.length > gameState.particleLimit / 2) {
            const oldParticle = gameState.moneyParticles.shift();
            if (oldParticle.element && oldParticle.element.parentNode) {
                oldParticle.element.parentNode.removeChild(oldParticle.element);
            }
        }
    }
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('money-particle');
        particle.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#FFD700" stroke="#AA3500" stroke-width="1"/>
            <circle cx="12" cy="12" r="8" fill="#FFEB3B" stroke="#FF3107" stroke-width="0.5"/>
            <text x="7" y="16" fill="#AA3500" font-size="12px" font-weight="bold">-</text>
        </svg>`;
        particle.style.position = 'absolute';
        particle.style.left = `${containerRect.left + containerRect.width / 2}px`;
        particle.style.top = `${containerRect.top + containerRect.height / 2}px`;
        particle.style.zIndex = '1000';
        particle.style.pointerEvents = 'none';
        particle.style.opacity = '1';
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 2; 
        
        document.body.appendChild(particle);
        
        gameState.moneyParticles.push({
            element: particle,
            x: containerRect.left + containerRect.width/2,
            y: containerRect.top + containerRect.height/2,
            vx,
            vy,
            rotation: 0,
            rotationSpeed: Math.random() * 10 - 5,
            age: 0,
            maxAge: 40 
        });
    }
}

// Create income particles
function createIncomeParticles() {
    const computerRect = document.getElementById('scene-container').getBoundingClientRect();
    
    const topCenterX = computerRect.left + computerRect.width * 0.5;
    const topCenterY = computerRect.top + computerRect.height * 0.4; 
    
    if (gameState.incomeParticles.length > gameState.particleLimit) {
        while (gameState.incomeParticles.length > gameState.particleLimit / 2) {
            const oldParticle = gameState.incomeParticles.shift();
            if (oldParticle.element && oldParticle.element.parentNode) {
                oldParticle.element.parentNode.removeChild(oldParticle.element);
            }
        }
    }
    
    const particleCount = 3;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('income-particle');
        particle.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="gold" stroke="#AA8500" stroke-width="1"/>
            <circle cx="12" cy="12" r="8" fill="#FFEB3B" stroke="#FFC107" stroke-width="0.5"/>
            <circle cx="12" cy="12" r="3" fill="#FFC107" stroke="#FFEB3B" stroke-width="0.5"/>
        </svg>`;
        particle.style.position = 'absolute';
        particle.style.left = `${topCenterX + (Math.random() * 40 - 20)}px`;  
        particle.style.top = `${topCenterY}px`;
        particle.style.zIndex = '1000';
        particle.style.pointerEvents = 'none';
        particle.style.opacity = '1';
        
        document.body.appendChild(particle);
        
        gameState.incomeParticles.push({
            element: particle,
            x: parseFloat(particle.style.left),
            y: parseFloat(particle.style.top),
            speed: 2.5 + Math.random() * 1.5, 
            age: 0,
            maxAge: 15 + Math.floor(Math.random() * 5) 
        });
    }
    
    const moneyValue = document.getElementById('money-value');
    moneyValue.style.transform = 'scale(1.1)';
    moneyValue.style.color = 'var(--success-color)';
    
    moneyValue.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    setTimeout(() => {
        moneyValue.style.transform = '';
        moneyValue.style.color = '';
        setTimeout(() => {
            moneyValue.style.transition = '';
        }, 300);
    }, 300);
}

// Update money particles animation
function updateMoneyParticles() {
    const processLimit = 30;
    const particlesToProcess = Math.min(gameState.moneyParticles.length, processLimit);
    
    for (let i = particlesToProcess - 1; i >= 0; i--) {
        const particle = gameState.moneyParticles[i];
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; 
        particle.age++;
        particle.rotation += particle.rotationSpeed;
        
        particle.element.style.left = `${particle.x}px`;
        particle.element.style.top = `${particle.y}px`;
        
        const progress = particle.age / particle.maxAge;
        particle.element.style.opacity = Math.max(0, 1 - progress * 1.2);
        particle.element.style.transform = `rotate(${particle.rotation}deg) scale(${1 - progress * 0.3})`;
        
        if (particle.age >= particle.maxAge) {
            if (particle.element.parentNode) {
                document.body.removeChild(particle.element);
            }
            gameState.moneyParticles.splice(i, 1);
        }
    }
    
    if (gameState.moneyParticles.length > gameState.particleLimit) {
        const excessCount = gameState.moneyParticles.length - gameState.particleLimit;
        for (let i = 0; i < excessCount; i++) {
            const oldParticle = gameState.moneyParticles.shift();
            if (oldParticle.element && oldParticle.element.parentNode) {
                oldParticle.element.parentNode.removeChild(oldParticle.element);
            }
        }
    }
}

// Update income particles animation
function updateIncomeParticles() {
    const processLimit = 30;
    const particlesToProcess = Math.min(gameState.incomeParticles.length, processLimit);
    
    for (let i = particlesToProcess - 1; i >= 0; i--) {
        const particle = gameState.incomeParticles[i];
        
        particle.y -= particle.speed;
        particle.age++;
        
        particle.element.style.top = `${particle.y}px`;
        
        const progress = particle.age / particle.maxAge;
        particle.element.style.opacity = 1 - progress;
        particle.element.style.transform = `rotate(${progress * 360}deg) scale(${1 - progress * 0.5})`;
        
        if (particle.age >= particle.maxAge) {
            if (particle.element.parentNode) {
                particle.element.parentNode.removeChild(particle.element);
            }
            gameState.incomeParticles.splice(i, 1);
        }
    }
    
    if (gameState.incomeParticles.length > gameState.particleLimit) {
        const excessCount = gameState.incomeParticles.length - gameState.particleLimit;
        for (let i = 0; i < excessCount; i++) {
            const oldParticle = gameState.incomeParticles.shift();
            if (oldParticle.element && oldParticle.element.parentNode) {
                oldParticle.element.parentNode.removeChild(oldParticle.element);
            }
        }
    }
}

// Show a popup
function showPopup(popupId) {
    const popup = document.getElementById(popupId);
    popup.style.display = 'flex';
    gameState.activePopup = popupId;
}

// Close the active popup
function closePopup() {
    if (gameState.activePopup) {
        const popup = document.getElementById(gameState.activePopup);
        popup.style.display = 'none';
        gameState.activePopup = null;
    }
}

// Translate a key to the current language
function translate(key) {
    return translations[gameState.language][key] || key;
}

// Update all translateable text elements
function updateLanguageTexts() {
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.getAttribute('data-lang-key');
        element.textContent = translate(key);
    });
    
    updateUI();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('ru-lang').addEventListener('click', (e) => {
        addClickEffect(e);
        gameState.language = 'ru';
        document.getElementById('ru-lang').classList.add('active');
        document.getElementById('en-lang').classList.remove('active');
        updateLanguageTexts();
    });
    
    document.getElementById('en-lang').addEventListener('click', (e) => {
        addClickEffect(e);
        gameState.language = 'en';
        document.getElementById('en-lang').classList.add('active');
        document.getElementById('ru-lang').classList.remove('active');
        updateLanguageTexts();
    });
    
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', (e) => {
            addClickEffect(e);
            
            const targetPanel = tab.getAttribute('data-tab');
            
            if (gameState.activeTab === targetPanel) {
                document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
                gameState.activeTab = null;
                gameState.animationsPaused = false;
                
                const hideButton = document.getElementById('hide-tabs-btn');
                if (hideButton) hideButton.style.display = 'none';
                
                return;
            }
            
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.getElementById(targetPanel).classList.add('active');
            
            gameState.activeTab = targetPanel;
            gameState.animationsPaused = true;
            
            const hideButton = document.getElementById('hide-tabs-btn');
            if (hideButton) hideButton.style.display = 'block';
        });
    });
    
    const hideButton = document.getElementById('hide-tabs-btn');
    if (hideButton) {
        hideButton.addEventListener('click', (e) => {
            addClickEffect(e);
            
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            gameState.activeTab = null;
            gameState.animationsPaused = false;
            
            hideButton.style.display = 'none';
        });
    }

    document.getElementById('clear-merge-btn').addEventListener('click', (e) => {
        addClickEffect(e);
        clearMergeSlots();
    });
    
    document.querySelectorAll('.buy-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            addClickEffect(e);
            const chipType = button.closest('.shop-chip').getAttribute('data-type');
            buyChip(chipType);
        });
    });
    
    document.getElementById('merge-btn').addEventListener('click', (e) => {
        addClickEffect(e);
        performMerge();
    });
    
    document.querySelectorAll('.close-popup').forEach(button => {
        button.addEventListener('click', (e) => {
            addClickEffect(e);
            closePopup();
        });
    });
    
    document.getElementById('merge-result-close').addEventListener('click', (e) => {
        addClickEffect(e);
        closePopup();
    });
    
    document.getElementById('scene-container').addEventListener('click', (e) => {
    });
    
    document.addEventListener('click', (event) => {
        if (event.target.closest('.tab-btn') || event.target.closest('.panel') || event.target.closest('#hide-tabs-btn')) {
            return;
        }
        
        const tabsRect = document.getElementById('tabs').getBoundingClientRect();
        if (event.clientY < tabsRect.top) {
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            gameState.activeTab = null;
            gameState.animationsPaused = false;
            
            const hideButton = document.getElementById('hide-tabs-btn');
            if (hideButton) hideButton.style.display = 'none';
        }
    });
    
    document.getElementById('help-btn').addEventListener('click', (e) => {
        addClickEffect(e);
        showTutorial();
    });
}

// Clear merge slots
function clearMergeSlots() {
    for (let i = 0; i < gameState.mergeSlots.length; i++) {
        if (gameState.mergeSlots[i]) {
            gameState.mergeSlots[i] = null;
        }
    }
    
    updateMergeSlots();
    
    const mergeBtn = document.getElementById('merge-btn');
    mergeBtn.disabled = true;
    
    showToast(translate('merge-slots-cleared'), 'info');
}

// Add click effect
function addClickEffect(event) {
    const x = event.clientX;
    const y = event.clientY;
    
    const ripple = document.createElement('div');
    ripple.classList.add('action-ripple');
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    document.body.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
    
    if (navigator.vibrate) {
        navigator.vibrate(30);
    }
}

// Main game loop - runs every second
function gameLoop() {
    if (gameState.incomePerSecond > 0) {
        gameState.money += gameState.incomePerSecond;
        
        if (!gameState.animationsPaused) {
            const burstCount = Math.min(5, Math.max(1, Math.floor(gameState.incomePerSecond / 100)));
            for (let i = 0; i < burstCount; i++) {
                setTimeout(() => {
                    if (!gameState.animationsPaused) {
                        createIncomeParticles();
                    }
                }, i * 200); 
            }
        }
    }
    
    updateUI();
}

// Show tutorial overlay
function showTutorial() {
    const tutorialOverlay = document.createElement('div');
    tutorialOverlay.classList.add('tutorial-overlay');
    
    const tutorialContent = document.createElement('div');
    tutorialContent.classList.add('tutorial-content');
    
    const steps = [
        {
            title: 'tutorial-welcome-title',
            text: 'tutorial-welcome-text'
        },
        {
            title: 'tutorial-computer-title',
            text: 'tutorial-computer-text'
        },
        {
            title: 'tutorial-shop-title',
            text: 'tutorial-shop-text'
        },
        {
            title: 'tutorial-chips-title',
            text: 'tutorial-chips-text'
        },
        {
            title: 'tutorial-merge-title',
            text: 'tutorial-merge-text'
        },
        {
            title: 'tutorial-final-title',
            text: 'tutorial-final-text'
        }
    ];
    
    steps.forEach((step, index) => {
        const stepEl = document.createElement('div');
        stepEl.classList.add('tutorial-step');
        if (index === 0) stepEl.classList.add('active');
        
        const title = document.createElement('h2');
        title.classList.add('tutorial-title');
        title.textContent = translate(step.title);
        
        const text = document.createElement('p');
        text.textContent = translate(step.text);
        
        stepEl.appendChild(title);
        stepEl.appendChild(text);
        
        tutorialContent.appendChild(stepEl);
    });
    
    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('tutorial-actions');
    
    const skipBtn = document.createElement('button');
    skipBtn.classList.add('tutorial-btn', 'secondary');
    skipBtn.textContent = translate('skip');
    skipBtn.addEventListener('click', () => {
        document.body.removeChild(tutorialOverlay);
        localStorage.setItem('tutorialCompleted', 'true');
        gameState.tutorialCompleted = true;
    });
    
    const nextBtn = document.createElement('button');
    nextBtn.classList.add('tutorial-btn');
    nextBtn.textContent = translate('next');
    nextBtn.addEventListener('click', () => {
        const activeStep = tutorialContent.querySelector('.tutorial-step.active');
        const nextStep = activeStep.nextElementSibling;
        
        if (nextStep && nextStep.classList.contains('tutorial-step')) {
            activeStep.classList.remove('active');
            nextStep.classList.add('active');
            
            // If we're at the last step, change button text
            const isLastStep = !nextStep.nextElementSibling || 
                              !nextStep.nextElementSibling.classList.contains('tutorial-step');
            
            if (isLastStep) {
                nextBtn.textContent = translate('start-playing');
            }
        } else {
            document.body.removeChild(tutorialOverlay);
            localStorage.setItem('tutorialCompleted', 'true');
            gameState.tutorialCompleted = true;
        }
    });
    
    actionsDiv.appendChild(skipBtn);
    actionsDiv.appendChild(nextBtn);
    
    tutorialContent.appendChild(actionsDiv);
    tutorialOverlay.appendChild(tutorialContent);
    document.body.appendChild(tutorialOverlay);
}

// Show a toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.classList.add('toast', `toast-${type}`);
    toast.textContent = message;
    
    const container = document.getElementById('toast-container');
    container.appendChild(toast);
    
    // Automatically remove the toast after a delay
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                container.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Recalculate total income
function recalculateIncome() {
    gameState.incomePerSecond = gameState.installedChips.reduce((total, chip) => total + chip.income, 0);
}

window.addEventListener('DOMContentLoaded', init);