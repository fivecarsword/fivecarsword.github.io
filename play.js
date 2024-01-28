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