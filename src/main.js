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

let cloud;
let background;
let goat;
let hunger = 100;
let happiness = 100;
let energy = 100;
let gameOver = false;

// Порог для тряски
const SHAKE_THRESHOLD = 15; // Чувствительность тряски
let lastShakeTime = 0; // Время последней тряски
let discoEffectActive = false; // Флаг для дискотечного эффекта
let discoTween; // Твин для дискотечного эффекта
let music; // Музыка


function preload() {
    // Загрузка изображений
//    this.load.image('button', 'assets/images/btn.png'); // Placeholder for feed button
    this.load.image('background', 'assets/images/background_glacial_mountains.png'); // Placeholder for feed background
    this.load.spritesheet('goat', 'assets/images/idle.png', {frameWidth: 256, frameHeight: 256});
    this.load.image('cloud', 'assets/images/cloud.png');

    this.load.audio('disco', 'assets/sounds/disco.mp3')
    this.load.on('loaderror', (file) => {
        console.error('Ошибка загрузки файла:', file.src);
    });
}

function create() {


    background = this.add.image(0, 0, 'background').setOrigin(0, 0);
    background.displayWidth = this.scale.width;
    background.displayHeight = this.scale.height;


    goat = this.add.sprite(this.scale.width / 2, this.scale.height / 2, 'idle').setScale(2);
    cloud = this.add.sprite(goat.x, goat.y + 215, 'cloud').setScale(1);

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

    this.decreaseTimer = this.time.addEvent({
        delay: 2000, // Раз в 2 секунды
        callback: decreaseRandomStat,
        callbackScope: this,
        loop: true // Повторять бесконечно
    });

    // Анимация покачивания облака
    this.tweens.add({
        targets: cloud,
        y: cloud.y + 20, // Покачивание вверх-вниз
        duration: 2000, // Продолжительность одного цикла
        yoyo: true, // Возврат в исходное положение
        repeat: -1 // Бесконечное повторение
    });

    // Связываем козу с облаком
    this.tweens.add({
        targets: goat,
        y: goat.y + 20, // Коза движется вместе с облаком
        duration: 2000, // Продолжительность одного цикла
        yoyo: true, // Возврат в исходное положение
        repeat: -1 // Бесконечное повторение
    });

    // Добавление обработчика тряски
    if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', handleShake.bind(this));
    } else {
        console.warn('DeviceMotionEvent не поддерживается в этом браузере.');
    }

    music = this.sound.add('disco');
}

function handleShake(event) {
    const currentTime = Date.now();
    const acceleration = event.accelerationIncludingGravity;

    // Вычисляем силу тряски
    const force = Math.abs(acceleration.x) + Math.abs(acceleration.y) + Math.abs(acceleration.z);

    // Если сила превышает порог и прошло достаточно времени с последней тряски
    if (force > SHAKE_THRESHOLD && currentTime - lastShakeTime > 1000) {
        lastShakeTime = currentTime;

        // Реакция на тряску
        happiness = Math.min(happiness + 10, 100); // Увеличиваем счастье

        // Увеличиваем амплитуду движения козы и облака
        this.tweens.add({
            targets: [cloud, goat],
            y: '-=50', // Увеличиваем амплитуду
            angle: '+=' + (Math.random() < 0.5 ? 10 : -10), // Наклоняем облако и козу
            duration: 500,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                cloud.angle = 0; // Возвращаем в исходное положение
                goat.angle = 0;
            }
        });

        // Включаем музыку
        if (!music.isPlaying) {
            music.play({loop: true});
        }

        // Дискотечный эффект
        if (!discoEffectActive) {
            discoEffectActive = true;
            discoTween = this.tweens.addCounter({
                from: 0,
                to: 360,
                duration: 100,
                repeat: -1,
                onUpdate: (tween) => {
                    const value = Math.floor(tween.getValue());
                    this.cameras.main.setBackgroundColor(Phaser.Display.Color.HSVToRGB(value / 360, 1, 1));
                }
            });

            // Останавливаем дискотечный эффект через 53 секунды
            this.time.delayedCall(53000, () => {
                discoEffectActive = false;
                discoTween.stop();
                this.cameras.main.setBackgroundColor('#ffffff'); // Возвращаем фон
            });
        }
    }
}


function update() {
    if (gameOver) return;

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
        hunger -= 1; // Уменьшаем сытость
    } else if (random < 0.66 && happiness > 0) {
        happiness -= 1; // Уменьшаем счастье
    } else if (energy > 0) {
        energy -= 1; // Уменьшаем энергию
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