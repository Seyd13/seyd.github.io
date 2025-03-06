import * as THREE from 'three';

class Chip {
  constructor(damage = 0, fireRate = 0, critChance = 0) {
    this.damage = damage;
    this.fireRate = fireRate;
    this.critChance = critChance;
    this.id = Math.random().toString(36).substr(2, 9);
    // Will be set by the game class
    this.name = null;
  }
}

class Game {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(this.renderer.domElement);

    this.camera.position.z = 15;
    
    this.bullets = [];
    this.bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    
    this.score = 0;
    this.credits = 100;
    this.chips = []; 
    this.inventory = []; 
    this.equippedChip = null;
    this.mergeSlots = [];
    this.nextChipNumber = 1; // Track the next available chip number
    
    // Initialize base ship stats
    this.shipStats = {
      damage: 1,
      fireRate: 1,
      critChance: 0.05
    };

    // Update shooting interval when fireRate changes
    this.shootingInterval = null;
    this.updateShootingInterval();
    
    this.initGame();
    this.initShop();
    this.initInventory();
    this.animate();
    
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    this.addChipToMergeArea = (chipId) => {
      const chip = this.inventory.find(c => c.id === chipId);
      if (!chip || this.mergeSlots.length >= 2) return;
      
      this.mergeSlots.push(chip);
      if (this.mergeSlots.length === 2) {
        document.getElementById('merge-btn').style.display = 'block';
      }
      this.updateInventoryDisplay();
    };

    document.getElementById('clear-merge-btn').onclick = () => {
      this.mergeSlots = [];
      document.getElementById('merge-btn').style.display = 'none';
      this.updateInventoryDisplay();
    };

    // Add stats toggle functionality
    const statsToggleBtn = document.getElementById('stats-toggle');
    const statsPanel = document.getElementById('stats');
    statsToggleBtn.onclick = () => {
      if (statsPanel.style.display === 'none') {
        statsPanel.style.display = 'block';
        statsToggleBtn.textContent = 'Hide Stats';
      } else {
        statsPanel.style.display = 'none';
        statsToggleBtn.textContent = 'Show Stats';
      }
    };
  }

  initGame() {
    // Ship
    const shipGeometry = new THREE.ConeGeometry(0.5, 1, 32);
    this.ship = new THREE.Mesh(shipGeometry, new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    this.scene.add(this.ship);
    
    this.createNewPlanet();
  }

  createNewPlanet() {
    if (this.planet) {
      this.scene.remove(this.planet);
    }
    
    const radius = 3;
    const segments = Math.floor(Math.random() * 8) + 8;
    const planetGeometry = new THREE.SphereGeometry(radius, segments, segments);
    const planetMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(Math.random(), Math.random(), Math.random()),
      wireframe: true
    });
    
    this.planet = new THREE.Mesh(planetGeometry, planetMaterial);
    this.scene.add(this.planet);
    
    this.planetHealth = Math.floor(Math.random() * 100) + 50;
    this.planetMaxHealth = this.planetHealth;

    // Create health bar
    if (this.healthBar) {
      this.scene.remove(this.healthBar);
    }
    const healthBarGeometry = new THREE.BoxGeometry(6, 0.2, 0.1);
    const healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
    this.healthBar.position.y = 4;
    this.scene.add(this.healthBar);

    // Create health bar background
    if (this.healthBarBg) {
      this.scene.remove(this.healthBarBg);
    }
    const healthBarBgGeometry = new THREE.BoxGeometry(6, 0.2, 0.05);
    const healthBarBgMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    this.healthBarBg = new THREE.Mesh(healthBarBgGeometry, healthBarBgMaterial);
    this.healthBarBg.position.y = 4;
    this.scene.add(this.healthBarBg);
  }

  shoot() {
    // Create bullet
    const bullet = new THREE.Mesh(this.bulletGeometry, this.bulletMaterial);
    bullet.position.copy(this.ship.position);
    this.scene.add(bullet);
    this.bullets.push({
      mesh: bullet,
      velocity: new THREE.Vector3()
        .subVectors(new THREE.Vector3(0, 0, 0), this.ship.position)
        .normalize()
        .multiplyScalar(0.2)
    });

    // Calculate and apply damage
    const damage = this.calculateDamage();
    this.planetHealth -= damage;
    
    // Update health bar
    const healthPercent = this.planetHealth / this.planetMaxHealth;
    this.healthBar.scale.x = Math.max(0, healthPercent);
    this.healthBar.position.x = -3 * (1 - healthPercent);
    
    if (this.planetHealth <= 0) {
      this.score++;
      this.credits += 10;
      this.updateUI();
      this.createNewPlanet();
    }
  }

  calculateDamage() {
    let damage = this.shipStats.damage;
    if (Math.random() < this.shipStats.critChance) {
      damage *= 2;
      // Optional: Add visual feedback for crits
      this.flashBullet();
    }
    return damage;
  }

  flashBullet() {
    // Visual feedback for critical hits
    const lastBullet = this.bullets[this.bullets.length - 1];
    if (lastBullet) {
      const originalColor = lastBullet.mesh.material.color.getHex();
      lastBullet.mesh.material.color.setHex(0xff0000);
      setTimeout(() => {
        if (lastBullet.mesh) {
          lastBullet.mesh.material.color.setHex(originalColor);
        }
      }, 100);
    }
  }

  updateShipPosition(time) {
    const radius = 6;
    this.ship.position.x = Math.cos(time * 0.001) * radius;
    this.ship.position.y = Math.sin(time * 0.001) * radius;
    this.ship.lookAt(0, 0, 0);
  }

  initShop() {
    // Generate initial shop chips
    for (let i = 0; i < 30; i++) {
      const chip = new Chip(
        Math.random() * 10,
        Math.random() * 5,
        Math.random() * 0.2
      );
      chip.name = this.nextChipNumber++;
      this.chips.push(chip);
    }

    const shopBtn = document.getElementById('shop-btn');
    const shop = document.getElementById('shop');
    const closeShop = document.getElementById('close-shop');

    shopBtn.onclick = () => shop.style.display = 'block';
    closeShop.onclick = () => shop.style.display = 'none';
    
    this.updateShopDisplay();
  }

  initInventory() {
    const inventoryBtn = document.getElementById('inventory-btn');
    const inventory = document.getElementById('inventory');
    const closeInventory = document.getElementById('close-inventory');
    const mergeBtn = document.getElementById('merge-btn');

    inventoryBtn.onclick = () => inventory.style.display = 'block';
    closeInventory.onclick = () => inventory.style.display = 'none';
    mergeBtn.onclick = () => this.mergeChips();
    
    this.updateInventoryDisplay();
  }

  updateShopDisplay() {
    const container = document.getElementById('chip-container');
    container.innerHTML = '';
    
    this.chips.forEach(chip => {
      const chipElement = this.createChipElement(chip);
      chipElement.innerHTML += `<button onclick="game.buyChip('${chip.id}')">Buy (10 credits)</button>`;
      container.appendChild(chipElement);
    });
  }

  updateInventoryDisplay() {
    const container = document.getElementById('inventory-chips');
    const mergeArea = document.getElementById('merge-area');
    const equippedArea = document.getElementById('equipped-chip');
    
    container.innerHTML = '';
    mergeArea.innerHTML = '';
    equippedArea.innerHTML = '';
    
    // Show equipped chip
    if (this.equippedChip) {
      const equippedElement = this.createChipElement(this.equippedChip);
      equippedElement.onclick = () => {
        this.equippedChip = null;
        this.updateShipStats();
        this.updateInventoryDisplay();
      };
      equippedArea.appendChild(equippedElement);
    }

    // Show inventory chips
    this.inventory.forEach(chip => {
      const chipElement = this.createChipElement(chip);
      const equipBtn = document.createElement('button');
      equipBtn.className = 'button secondary';
      equipBtn.textContent = this.equippedChip === chip ? 'Unequip' : 'Equip';
      equipBtn.onclick = (e) => {
        e.stopPropagation(); // Prevent chip click event
        if (this.equippedChip === chip) {
          this.equippedChip = null;
        } else {
          this.equippedChip = chip;
        }
        this.updateShipStats();
        this.updateInventoryDisplay();
        this.updateUI();
      };
      chipElement.appendChild(equipBtn);
      chipElement.onclick = () => {
        if (this.mergeSlots.includes(chip)) return;
        
        if (this.mergeSlots.length < 2) {
          this.mergeSlots.push(chip);
          if (this.mergeSlots.length === 2) {
            document.getElementById('merge-btn').style.display = 'block';
          }
        } 
        this.updateInventoryDisplay();
      };
      container.appendChild(chipElement);
    });

    // Show merge slots
    this.mergeSlots.forEach(chip => {
      const chipElement = this.createChipElement(chip);
      chipElement.onclick = () => {
        this.mergeSlots = this.mergeSlots.filter(c => c !== chip);
        document.getElementById('merge-btn').style.display = 'none';
        this.updateInventoryDisplay();
      };
      mergeArea.appendChild(chipElement);
    });
  }

  createChipElement(chip) {
    const element = document.createElement('div');
    element.className = 'chip';
    if (this.equippedChip === chip) {
      element.className += ' equipped';
    }
    element.innerHTML = `
      <div class="name">Chip #${chip.name}</div>
      <div class="stat">Damage <span class="stat-value">${chip.damage.toFixed(1)}</span></div>
      <div class="stat">Fire Rate <span class="stat-value">${chip.fireRate.toFixed(1)}</span></div>
      <div class="stat">Crit Chance <span class="stat-value">${(chip.critChance * 100).toFixed(1)}%</span></div>
    `;
    return element;
  }

  mergeChips() {
    if (this.mergeSlots.length !== 2) return;
    
    const [chip1, chip2] = this.mergeSlots;
    
    // Remove old chips
    this.inventory = this.inventory.filter(c => !this.mergeSlots.includes(c));
    
    // Create new merged chip with possible worse stats
    const randomFactor = () => 0.5 + Math.random(); 
    const newChip = new Chip(
      (chip1.damage + chip2.damage) * randomFactor() * 0.7,
      (chip1.fireRate + chip2.fireRate) * randomFactor() * 0.7,
      (chip1.critChance + chip2.critChance) * randomFactor() * 0.7
    );
    
    // Assign the next sequential number
    newChip.name = this.nextChipNumber++;
    
    // Small chance (10%) for significant boost
    if (Math.random() < 0.1) {
      const stat = Math.floor(Math.random() * 3);
      const boost = 1.5 + Math.random();
      if (stat === 0) newChip.damage *= boost;
      else if (stat === 1) newChip.fireRate *= boost;
      else newChip.critChance *= boost;
    }
    
    this.inventory.push(newChip);
    this.mergeSlots = [];
    document.getElementById('merge-btn').style.display = 'none';
    this.updateInventoryDisplay();
    
    if (this.equippedChip === chip1 || this.equippedChip === chip2) {
      this.equippedChip = null;
    }
    this.updateShipStats();
  }

  buyChip(chipId) {
    if (this.credits < 10) return;
    
    const chip = this.chips.find(c => c.id === chipId);
    if (!chip) return;
    
    this.credits -= 10;
    // Create a copy of the chip with same name/number
    const chipCopy = new Chip(chip.damage, chip.fireRate, chip.critChance);
    chipCopy.name = chip.name;
    this.inventory.push(chipCopy);
    
    this.updateUI();
    this.updateShopDisplay();
    this.updateInventoryDisplay();
  }

  updateUI() {
    document.getElementById('score').textContent = this.score;
    document.getElementById('credits').textContent = this.credits;
    
    // Update ship stats display
    const statsDisplay = document.getElementById('ship-stats');
    statsDisplay.innerHTML = `
      <div class="stat">Damage: ${this.shipStats.damage.toFixed(1)}</div>
      <div class="stat">Fire Rate: ${this.shipStats.fireRate.toFixed(1)}</div>
      <div class="stat">Crit Chance: ${(this.shipStats.critChance * 100).toFixed(1)}%</div>
    `;

    // Update equipped chip display
    const equippedDisplay = document.getElementById('equipped-display');
    if (this.equippedChip) {
      equippedDisplay.innerHTML = `
        <div class="chip equipped">
          <div class="name">Equipped: Chip #${this.equippedChip.name}</div>
          <div class="stat">Damage: ${this.equippedChip.damage.toFixed(1)}</div>
          <div class="stat">Fire Rate: ${this.equippedChip.fireRate.toFixed(1)}</div>
          <div class="stat">Crit Chance: ${(this.equippedChip.critChance * 100).toFixed(1)}%</div>
        </div>
      `;
    } else {
      equippedDisplay.innerHTML = '<div class="no-chip">No chip equipped</div>';
    }
  }

  updateShipStats() {
    // Reset to base stats
    this.shipStats = {
      damage: 1,
      fireRate: 1,
      critChance: 0.05
    };
    
    if (this.equippedChip) {
      this.shipStats.damage = 1 + this.equippedChip.damage;
      this.shipStats.fireRate = 1 + this.equippedChip.fireRate;
      this.shipStats.critChance = 0.05 + this.equippedChip.critChance;
    }

    // Update shooting interval when stats change
    this.updateShootingInterval();
  }

  updateShootingInterval() {
    // Clear existing interval
    if (this.shootingInterval) {
      clearInterval(this.shootingInterval);
    }
    // Create new interval based on current fire rate
    this.shootingInterval = setInterval(() => this.shoot(), 1000 / this.shipStats.fireRate);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    const time = Date.now();
    this.updateShipPosition(time);
    
    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.mesh.position.add(bullet.velocity);
      
      // Remove bullets that hit the planet or go too far
      const distanceToCenter = bullet.mesh.position.length();
      if (distanceToCenter < 3 || distanceToCenter > 20) {
        this.scene.remove(bullet.mesh);
        this.bullets.splice(i, 1);
      }
    }
    
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});