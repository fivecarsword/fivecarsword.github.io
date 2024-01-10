Point = PIXI.Point

class Game {
    constructor() {
        this.app = new PIXI.Application({
            background: "#1088bb",
            resizeTo: window,
        });

        document.body.appendChild(this.app.view);

        this.app.ticker.add((delta) => this.tick(delta));

        this.a = PIXI.Sprite.from('a.png');

        // this.app.stage.addChild(this.a);

        this.mirror = new Mirror();
        this.mirror.x = 300
        this.mirror.y = 300
        this.app.stage.addChild(this.mirror);
    }

    test() {
    }

    tick(delta) {
        this.test()
        this.mirror.angle += delta
    }
}

class Mirror extends PIXI.Graphics {
    constructor() {
        super();
        this.vertices = [new Point(-100, -100), new Point(-100, 100), new Point(100, 100), new Point(100, -100)];
        this.draw();
        this.eventMode = "static";
        
        this.cursor = "point";
        this.on("pointdown", this.click);
    }

    draw() {
        this.clear();
        this.beginFill(0x7a7a7a);
        this.drawPolygon(this.vertices);
        this.endFill();
    }

    click() {
        console.log("click");
    }
}

class Raser extends PIXI.Graphics {
    constructor(mirrors) {
        this.Mirrors = mirrors
    }
}

var params = new URLSearchParams(window.location.search)

for (const i of params.values()) {
    console.log(i)
}

game = new Game()
