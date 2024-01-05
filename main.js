class Game {
    constructor() {
        this.app = new PIXI.Application({
            background: "#1088bb",
            resizeTo: window,
        });

        document.body.appendChild(this.app.view);

        this.app.ticker.add((delta) => this.tick(delta));

        this.graphics = new PIXI.Graphics();
        this.a = PIXI.Sprite.from('a.png');

        this.app.stage.addChild(this.graphics);
        this.app.stage.addChild(this.a);
    }

    test() {
        this.graphics.clear();
        this.graphics.beginFill(0xDE3249);
        this.graphics.drawRect(50, 50, 100, 100);
        this.graphics.endFill();
    }

    tick(delta) {
        this.test()
        this.graphics.x += delta
    }
}

class Mirror extends PIXI.Graphics{
    constructor() {

    }
}

var params = new URLSearchParams(window.location.search)

for (const i of params.values()) {
    console.log(i)
}

game = new Game()
