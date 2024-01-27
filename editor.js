class Editor extends Game {
    constructor({width, height, laser, goal, boxes} = {}) {
        super({width, height, laser, goal, boxes});

        let creationBoxes = [
            new Box({
                color: 0xffffff,
                lineColor: 0x111111,
                reflection: true
            }),
            new Box({
                color: 0x000000,
                lineColor: 0x111111,
                reflection: false
            }),
        ];

        this.boxCreationUI = new BoxCreationUI({
            width: this.app.screen.width,
            height: 100,
            pos: new Point(0, this.app.screen.height - 100),
            creationBoxes: creationBoxes,
            creationPos: new Point(this.width / 2, this.height / 2),
            game: this,
        });
        this.ui.addChild(this.boxCreationUI);
    }
}

var params = new URLSearchParams(window.location.search)

let loader = new Loader(params);

game = new Editor({
    width: loader.width,
    height: loader.height,
    laser: loader.laser,
    goal: loader.goal,
    boxes: loader.boxes,
});