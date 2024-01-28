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
                this.laser.shoot()
            }
        });
        this.ui.addChild(this.shootButton);

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
    }

    tick(delta) {
        this.update(delta);
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