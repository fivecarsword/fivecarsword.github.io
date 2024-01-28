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
            game: this,
        });
        this.ui.addChild(this.boxCreationUI);

        this.editorUI = new EditorUI({
            width: 150,
            height: this.height - 100,
            pos: new Point(0, 0),
            game: this,
        });
        this.ui.addChild(this.editorUI);
    }
}

class EditorUI extends PIXI.Graphics {
    constructor({width, height, pos, game}) {
        super();
        this.uiWidth = width;
        this.uiHeight = height;
        this.position = pos;
        this.game = game;

        let div = document.createElement("div");
        let button = document.createElement("button");
        button.setAttribute("style", "position:fixed;display:block");
        let ok = document.createTextNode("확인");

        button.appendChild(ok);
        div.appendChild(button);
        document.body.appendChild(div);

        this.scroll = new PIXI.Container();
        this.scroll.position.set(this.uiWidth / 2, 0);
        this.addChild(this.scroll);

        this.widthText = new PIXI.Text(`Width`, {
            fontSize: 20,
        });
        this.widthText.position.set(0, 20)
        this.addChild(this.widthText);

        this.eventMode = "static";

        this.beginFill(0xbbbbbb);
        this.drawRect(0, 0, this.uiWidth, this.uiHeight);
        this.endFill();
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