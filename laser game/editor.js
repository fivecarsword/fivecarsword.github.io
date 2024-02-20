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
            height: this.app.screen.height - 100,
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

        this.div = document.createElement("div");
        document.body.appendChild(this.div);

        this.scroll = new PIXI.Container();
        this.scroll.position.set(this.uiWidth / 2, 0);
        this.addChild(this.scroll);

        this.createInput(new Point(0, 20), "Width", this.game.width, (input) => {
            this.game.width = Math.min(Math.max(Number(input.value), 100), 10000);
            if (isNaN(this.game.width)) {
                this.game.width = 500;
            }
            input.value = this.game.width;
            this.game.updateOutline();
        });

        this.createInput(new Point(0, 70), "Height", this.game.height, (input) => {
            this.game.height = Math.min(Math.max(Number(input.value), 100), 10000);
            if (isNaN(this.game.height)) {
                this.game.height = 500;
                input.value = 500;
            }
            input.value = this.game.height;
            this.game.updateOutline();
        });

        this.createInput(new Point(0, 120), "Reflect", this.game.laser.reflectCount, (input) => {
            this.game.laser.reflectCount = Math.min(Math.max(Number(input.value), 0), 10000);
            if (isNaN(this.game.laser.reflectCount)) {
                this.game.laser.reflectCount = 5;
                input.value = 5;
            }
            input.value = this.game.laser.reflectCount;
        });

        this.createInput(new Point(0, 170), "Goal R", this.game.goal.radius, (input) => {
            this.game.goal.radius = Math.min(Math.max(Number(input.value), 1), 100);
            if (isNaN(this.game.goal.radius)) {
                this.game.goal.radius = 500;
                input.value = 500;
            }
            input.value = this.game.goal.radius;
            this.game.goal.draw();
        });

        this.saveButton = new TextButton({
            text: "Save",
            width: 120,
            height: 30,
            pos: new Point(15, 220),
            textStyle: {
                fontSize: 22,
            },
            onpointerup: () => {
                window.navigator.clipboard.writeText("https://fivecarsword.github.io/editor?" + this.game.createEditorUrlParam()).then(() => {
                    alert("복사 완료");
                });
            },
        });

        this.exportButton = new TextButton({
            text: "Export",
            width: 120,
            height: 30,
            pos: new Point(15, 280),
            textStyle: {
                fontSize: 22,
            },
            onpointerup: () => {
                window.navigator.clipboard.writeText("https://fivecarsword.github.io/play?" + this.game.createPlayUrlParam()).then(() => {
                    alert("복사 완료");
                });
            },
        });

        this.addChild(this.saveButton);
        this.addChild(this.exportButton);

        this.eventMode = "static";

        this.beginFill(0xbbbbbb);
        this.drawRect(0, 0, this.uiWidth, this.uiHeight);
        this.endFill();
    }

    createInput(pos, name, value, command) {
        let text = new PIXI.Text(name, {fontSize: 20});
        text.position = pos;
        let input = document.createElement("input");
        input.value = value;
        input.setAttribute("style", `position:absolute; left:${pos.x + text.width + 10}px; top:${pos.y + 1}px; width:60px;`);
        input.addEventListener("focusout", () => {
            command(input);
        });
        this.addChild(text);
        this.div.appendChild(input);
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