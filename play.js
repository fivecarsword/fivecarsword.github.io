function timeFormat(time) {
    let m = Math.floor(time / 60000);
    time %= 60000;
    let s = Math.floor(time / 1000);
    time %= 1000;
    return `${m.toString().padStart(2, 0)}:${s.toString().padStart(2, 0)}:${time.toString().padEnd(3, 0)}`;
}

class Play extends Game {
    constructor({width, height, laser, goal, boxes} = {}) {
        super({width, height, laser, goal, boxes});

        let creationBoxes = [
            new Box({
                color: 0xffffff,
                lineColor: 0xaaaaaa,
                reflection: true,
            }),
            new Box({
                color: 0x000000,
                lineColor: 0xaaaaaa,
                reflection: false,
            }),
        ];

        this.boxCreationUI = new BoxCreationUI({
            width: this.app.screen.width,
            height: 100,
            pos: new Point(0, this.app.screen.height - 100),
            creationBoxes: creationBoxes,
            game: this,
        });
        this.ui.addChild(this.boxCreationUI);

        this.shootButton = new TextButton({
            text: "Shoot",
            width: 120,
            height: 30,
            pos: new Point(this.app.screen.width - 135, this.app.screen.height - 195),
            textStyle: {
                fontSize: 22
            },
            onpointerdown: () => {},
            onpointerup: () => {
                this.laser.shoot();
                
                if (this.goal.isActive) {
                    this.end();
                }
            }
        });
        this.ui.addChild(this.shootButton);

        let popupSize = Math.min(this.app.screen.width, this.app.screen.height) / 2

        this.startPopup = new StartPopup({
            width: popupSize,
            height: popupSize,
            game: this
        });
        this.ui.addChild(this.startPopup);

        this.clearPopup = new ClearPopup({
            width: popupSize,
            height: popupSize,
            game: this
        });
        this.clearPopup.visible = false;
        this.ui.addChild(this.clearPopup);

        this.isStart = false;

        this.startTime = 0;
        this.endTime = 0;

        this.gameInfoText = new PIXI.Text("", {
            fontFamily: "Consolas",
            fontWeight: "bold"
        });
        this.gameInfoText.position.set(20, 20);
        this.ui.addChild(this.gameInfoText);

        this.deleteButton.onpointerdown = () => {
            this.laser.wait();
        };

        this.laser.wait();

        this.score = 0;
    }

    update(delta) {
        super.update(delta);
        
        if (this.isObjectMoving || this.rotateLeft || this.rotateRight) {
            this.laser.wait();
        }
        
        if (this.isStart) {
            let curTime = Date.now();
            this.gameInfoText.text = `${timeFormat(curTime - this.startTime)}`;
        }
    }

    tick(delta) {
        this.update(delta);
    }

    start() {
        this.isStart = true;
        this.startTime = Date.now();
        this.startPopup.visible = false;
    }

    end() {
        this.isStart = false;
        this.endTime = Date.now();
        this.score = 1000 - Math.floor((this.endTime - this.startTime) / 1000) * 5 - this.movable.children.length * 50;
        this.gameInfoText.text = timeFormat(this.endTime - this.startTime);
        
        this.clearPopup.updateText();
        this.clearPopup.visible = true;
    }

    reset() {
        this.isStart = false;
        this.movingTaget = null;

        for (let i = 0; i < this.boxes.length; i++) {
            if (this.boxes[i].movable) {
                this.boxes[i].destroy();
                this.boxes.splice(i, 1);
                i--;
            }
        }

        this.world.scale.set(1);
        this.world.position = new Point(this.app.screen.width / 2 - this.width / 2, this.app.screen.height / 2 - this.height / 2);

        this.laser.wait();

        this.startPopup.visible = true;
        this.clearPopup.visible = false;
    }
}

class StartPopup extends Popup {
    constructor({width, height, game}) {
        super({width, height, game});

        let fontStyle = {
            fontSize: Math.min(this.uiWidth, this.uiHeight) / 10,
            fontWeight: "bold",
            fontFamily: "Consolas",
            align: "center",
        };

        this.text = new PIXI.Text(
            `\n\nReflection ${this.game.laser.reflectCount}\n\nObject     ${this.game.fixed.children.length - 1}`, fontStyle);
        this.text.position.set(0, -this.uiHeight / 2);
        this.text.anchor.set(0.5, 0);
        this.container.addChild(this.text);

        this.startButton = new TextButton({
            text: "Start",
            textStyle: fontStyle,
            width: this.uiWidth / 3,
            height: fontStyle.fontSize * 1.5,
            pos: new Point(0, this.uiHeight / 2 - 20),
            onpointerdown: () => {},
            onpointerup: () => {
                this.game.start();
            }
        });
        this.startButton.pivot.set(this.startButton.uiWidth / 2, this.startButton.uiHeight);
        this.container.addChild(this.startButton);
    }
}

class ClearPopup extends Popup {
    constructor({width, height, game}) {
        super({width, height, game});

        let fontStyle = {
            fontSize: Math.min(this.uiWidth, this.uiHeight) / 10,
            fontWeight: "bold",
            fontFamily: "Consolas",
            align: "center",
        };

        this.text = new PIXI.Text("", fontStyle);
        this.text.position.set(0, -this.uiHeight / 2);
        this.text.anchor.set(0.5, 0);
        this.container.addChild(this.text);

        this.resetButton = new TextButton({
            text: "Again",
            textStyle: fontStyle,
            width: this.uiWidth / 3,
            height: fontStyle.fontSize * 1.5,
            pos: new Point(-10, this.uiHeight / 2 - 20),
            onpointerdown: () => {},
            onpointerup: () => {
                this.game.reset();
            }
        });
        this.resetButton.pivot.set(this.resetButton.uiWidth, this.resetButton.uiHeight);
        this.container.addChild(this.resetButton);

        this.backButton = new TextButton({
            text: "Back",
            textStyle: fontStyle,
            width: this.uiWidth / 3,
            height: fontStyle.fontSize * 1.5,
            pos: new Point(10, this.uiHeight / 2 - 20),
            onpointerdown: () => {},
            onpointerup: () => {
                location.href = "https://fivecarsword.github.io"
            }
        });
        this.backButton.pivot.set(0, this.backButton.uiHeight);
        this.container.addChild(this.backButton);
    }

    updateText() {
        this.text.text = `\n\n${timeFormat(this.game.endTime - this.game.startTime)}\n\nScore ${this.game.score}`;
    }
}

class A {
    aing

    constructor() {

    }
}

var params = new URLSearchParams(window.location.search)

let loader = new Loader(params);

game = new Play({
    width: loader.width,
    height: loader.height,
    laser: loader.laser,
    goal: loader.goal,
    boxes: loader.boxes,
});