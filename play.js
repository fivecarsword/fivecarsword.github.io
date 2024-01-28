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
            pos: new Point(15, this.app.screen.height - 145),
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

        this.popup = new PopupUI({
            width: this.app.screen.height / 3,
            height: this.app.screen.height / 3,
            game: this
        });
        // this.ui.addChild(this.popup);

        this.isStart = false;

        this.startTime = 0;
        this.endTime = 0;

        this.playTimeText = new PIXI.Text("", {
            fontWeight: "bold"
        });
        this.playTimeText.position.set(20, 20);
        this.ui.addChild(this.playTimeText);

        this.deleteButton.onpointerdown = () => {
            this.laser.wait();
        };

        this.laser.wait();
    }

    update(delta) {
        super.update(delta);
        
        if (this.isObjectMoving || this.rotateLeft || this.rotateRight) {
            this.laser.wait();
        }
        
        if (this.isStart) {
            this.playTimeText.text = timeFormat(Date.now() - this.startTime);
        }
    }

    tick(delta) {
        this.update(delta);
    }

    start() {
        this.isStart = true;
        this.startTime = Date.now();
    }

    end() {
        this.isStart = false;
        this.endTime = Date.now();
        this.playTimeText.text = timeFormat(this.endTime - this.startTime);
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