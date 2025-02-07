const config = {
    type: Phaser.AUTO, // Автоматический выбор рендера (Canvas или WebGL)
    scale: {
        mode: Phaser.Scale.FIT, // Автоматическое масштабирование под экран
        autoCenter: Phaser.Scale.CENTER_BOTH, // Центрирование по горизонтали и вертикали
        width: window.innerWidth, // Базовая ширина
        height: window.innerHeight, // Базовая высота
        parent: 'game-container', // Контейнер для игры (опционально)
    },
    scene: {
        preload: preload, // Функция для загрузки ресурсов
        create: create,   // Функция для создания объектов
        update: update    // Функция для обновления игры
    }
};

const game = new Phaser.Game(config);

let background;
let goat;
let hunger = 100;
let happiness = 100;
let energy = 100;
let gameOver = false;

function preload() {
    // Загрузка изображений
    this.load.image('button', 'assets/images/btn.png'); // Placeholder for feed button
    this.load.image('background', 'assets/images/background.png'); // Placeholder for feed background
    this.load.spritesheet('goat', 'assets/images/idle.png', {frameWidth: 256, frameHeight: 256});
    this.load.on('loaderror', (file) => {
        console.error('Ошибка загрузки файла:', file.src);
    });
}

function create() {
    background = this.add.image(0, 0, 'background').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);
    // Создание козы
    goat = this.add.sprite(this.scale.width / 2, this.scale.height / 2, 'idle').setScale(2);
    // создание idle анимации
    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('goat', {start: 0, end: 3}),
        frameRate: 4,
        repeat: -1
    });

    goat.anims.play('idle', true)

    // Текст для статистики
    this.hungerText = this.add.text(10, 10, `Сытость: ${hunger}`, {font: '20px Arial', fill: '#ffffff'});
    this.happinessText = this.add.text(10, 40, `Счастье: ${happiness}`, {font: '20px Arial', fill: '#ffffff'});
    this.energyText = this.add.text(10, 70, `Энергия: ${energy}`, {font: '20px Arial', fill: '#ffffff'});

    // Кнопки

    const buttonStyle = {
        font: '24px Arial',
        fill: '#fff',
        backgroundColor: '#007bff',
        padding: {x: 20, y: 10},
        fixedWidth: 200
    };

    this.feedButton = this.add.text(this.scale.width / 2 - 100, this.scale.height - 150, 'Покормить', buttonStyle, {
        font: '24px Arial',
        fill: '#fff',
        backgroundColor: '#007bff'
    })
        .setInteractive({useHandCursor: true})
        .on('pointerdown', () => feedGoat());

    this.playButton = this.add.text(this.scale.width / 2 - 100, this.scale.height - 100, 'Поиграть', buttonStyle, {
        font: '24px Arial',
        fill: '#fff',
        backgroundColor: '#28a745'
    })
        .setInteractive({useHandCursor: true})
        .on('pointerdown', () => playWithGoat());

    this.sleepButton = this.add.text(this.scale.width / 2 - 100, this.scale.height - 50, 'Уложить спать', buttonStyle, {
        font: '24px Arial',
        fill: '#fff',
        backgroundColor: '#ffc107'
    })
        .setInteractive({useHandCursor: true})
        .on('pointerdown', () => putToSleep());
}

function update() {
    if (gameOver) return;


//    // Уменьшение статистики со временем
//    hunger = Math.max(hunger - 0.01, 0);
//    happiness = Math.max(happiness - 0.01, 0);
//    energy = Math.max(energy - 0.01, 0);

    decreaseRandomStat()

    this.hungerText.setText(`Сытость: ${Math.round(hunger)}`);
    this.happinessText.setText(`Счастье: ${Math.round(happiness)}`);
    this.energyText.setText(`Энергия: ${Math.round(energy)}`);

    // Проверка на конец игры
    if (hunger <= 0 || happiness <= 0 || energy <= 0) {
        gameOver = true;
        this.add.text(this.scale.width / 2 - 150, this.scale.height / 2, 'Игра окончена!', {
            font: '48px Arial',
            fill: '#ff0000'
        });
    }
}


function decreaseRandomStat() {
    // Выбираем случайный показатель для уменьшения
    const random = Math.random();

    if (random < 0.33 && hunger > 0) {
        hunger -= 0.1; // Уменьшаем сытость
    } else if (random < 0.66 && happiness > 0) {
        happiness -= 0.1; // Уменьшаем счастье
    } else if (energy > 0) {
        energy -= 0.1; // Уменьшаем энергию
    }
}

function feedGoat() {
    if (gameOver) return;
    hunger = Math.min(hunger + 20, 100);
}

function playWithGoat() {
    if (gameOver) return;
    happiness = Math.min(happiness + 20, 100);
    energy = Math.max(energy - 10, 0);
}

function putToSleep() {
    if (gameOver) return;
    energy = Math.min(energy + 30, 100);
    hunger = Math.max(hunger - 10, 0);
}