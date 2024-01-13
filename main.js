Point = PIXI.Point;
sin = Math.sin;
cos = Math.cos;

const EPS = Number.EPSILON * 10

function lineline(x1, y1, x2, y2, x3, y3, x4, y4) {
    let uA;
    let uB;

    try {
        uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
    } catch (e) {
        uA = 2;
    }
    try {
        uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
    } catch (e) {
        uB = 2;
    }

    if (uA > EPS && uA < 1 - EPS && uB > EPS && uB < 1 - EPS) {
        return new Point(x1 + (uA * (x2-x1)), y1 + (uA * (y2-y1)));
    }
    
    return null;
}

class Game {
    constructor() {
        this.app = new PIXI.Application({
            background: "#1088bb",
            resizeTo: window,
            antialiasing: true,
        });

        this.app.ticker.maxFPS = 30;

        this.width = this.app.screen.width;
        this.height = this.app.screen.height;

        document.body.appendChild(this.app.view);

        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = this.app.screen;

        this.app.ticker.add((delta) => this.tick(delta));
        this.app.stage.on('pointermove', this.pointerMove.bind(this));

        this.a = PIXI.Sprite.from('a.png');
        this.a.alpha = 0;
        this.app.stage.addChild(this.a);

        this.mirrors = [];

        this.mirror = new Mirror();
        this.mirror.x = 300;
        this.mirror.y = 300;
        this.mirror.angle = 70
        this.app.stage.addChild(this.mirror);

        this.mirrors.push(this.mirror);

        for (let i = 0; i < 5; i++) {
            let mirror = new Mirror();
            mirror.x = Math.random() * this.width;
            mirror.y = Math.random() * this.height;
            mirror.angle = Math.random() * 360;
            this.app.stage.addChild(mirror);

            this.mirrors.push(mirror);
        }

        this.laser = new Laser(this.mirrors);
        this.laser.x = this.width / 2;
        this.laser.y = this.height / 2;
        this.app.stage.addChild(this.laser);

        this.g = new PIXI.Graphics();
        this.app.stage.addChild(this.g);

        this.keyboard = new Keyboard(["a", "s", "d", "w", "q", "e", "space"]);

        this.text = new PIXI.Text("move : A, S, D, W\nrotate : Q, E");
        this.app.stage.addChild(this.text);
    }

    tick(delta) {
        // this.laser.rad = (this.laser.rad - delta * 0.01) % (2 * Math.PI);
        this.laser.update();
        this.laser.draw();

        if (this.keyboard.isPressed("a")) {
            this.mirror.x -= delta;
        }
        if (this.keyboard.isPressed("d")) {
            this.mirror.x += delta;
        }
        if (this.keyboard.isPressed("w")) {
            this.mirror.y -= delta;
        }
        if (this.keyboard.isPressed("s")) {
            this.mirror.y += delta;
        }
        if (this.keyboard.isPressed("q")) {
            this.mirror.angle -= delta;
        }
        if (this.keyboard.isPressed("e")) {
            this.mirror.angle += delta;
        }
    }

    pointerMove(event) {
        let p = event.global.subtract(this.laser.position);
        this.laser.rad = Math.atan2(p.y, p.x);
    }
}

class Keyboard {
    constructor(activeKeys) {
        this.activeKeys = activeKeys;
        this.keys = {};

        for (let key of activeKeys) {
            this.keys[key] = {};
            this.keys[key].pressed = false;
            this.keys[key].down = undefined;
            this.keys[key].up = undefined;
        }

        window.addEventListener("keydown", this.keyDown.bind(this));
        window.addEventListener("keyup", this.keyUp.bind(this));
    }

    setKeyDownEvent(key, func) {
        if (this.activeKeys.includes(key)) {
            this.keys[key].down = func;
        } 
    }

    setKeyUpEvent(key, func) {
        if (this.activeKeys.includes(key)) {
            this.keys[key].up = func;
        } 
    }

    keyDown(event) {
        if (this.activeKeys.includes(event.key)) {
            let key = this.keys[event.key];
            if (!key.pressed && key.down) {
                key.down();
            }
            key.pressed = true;
        }
    }

    keyUp(event) {
        if (this.activeKeys.includes(event.key)) {
            let key = this.keys[event.key];
            if (key.pressed && key.up) {
                key.up();
            }
            key.pressed = false;
        }
    }

    isPressed(key) {
        return this.keys[key].pressed;
    }
}

class Mirror extends PIXI.Graphics {
    constructor() {
        super();
        this.vertices = [new Point(-50, -50), new Point(-50, 50), new Point(50, 50), new Point(50, -50)];
        this.draw();
        this.eventMode = "static";
        
        this.cursor = "pointer";
        this.on("pointerdown", this.click.bind(this));
    }

    getRealVertices() {
        const radian = this.rotation;
        return this.vertices.map((point) => (new Point(this.x + cos(radian) * point.x - sin(radian) * point.y, this.y + sin(radian) * point.x + cos(radian) * point.y)));
    }

    checkLineCollision(start, end) {
        let collisionInfos = [];

        let real_vertices = this.getRealVertices();

        for (let i = 0; i < real_vertices.length; i++) {
            let j = i + 1;
            if (j == real_vertices.length) {
                j = 0;
            }

            let current = real_vertices[i];
            let next = real_vertices[j];

            let pos = lineline(start.x, start.y, end.x, end.y, current.x, current.y, next.x, next.y);

            if (pos != null) {
                collisionInfos.push(new CollisionInfo(pos, next.subtract(current)));
            }
        }

        return collisionInfos;
    }

    draw() {
        this.clear();
        this.beginFill(0xffffff, 0.4);
        this.lineStyle(3, 0x7a7a7a, 1)
        this.drawPolygon(this.vertices);
        this.endFill();
    }

    click() {
        console.log("click");
        this.x += 10;
    }
}

class CollisionInfo {
    constructor(pos, edgeV) {
        this.pos = pos;
        this.edgeV = edgeV;
    }
}

class Laser extends PIXI.Graphics {
    constructor(mirrors) {
        super();
        this.mirrors = mirrors
        this.lineWay = [];
        this.rad = 0;
        this.reflectCount = 50
        this.laserLength = 3000

        this.update();
        this.draw();
    }

    update() {
        this.lineWay.length = 0;

        this.lineWay.push(new Point(0, 0));
        this.lineWay.push(new Point(this.laserLength * cos(this.rad), this.laserLength * sin(this.rad)));

        for (let i = 0; i < this.reflectCount + 1; i++) {
            let start = this.lineWay[i].add(this.position);
            let end = this.lineWay[i + 1].add(this.position);

            let closestPos = null;
            let closestDis = Number.POSITIVE_INFINITY;
            let edgeV;

            let infos = [];

            for (let mirror of this.mirrors) {
                infos.push(...mirror.checkLineCollision(start, end));
            }

            for (let info of infos) {
                let distance = info.pos.subtract(start).magnitude();

                if (distance < closestDis) {
                    closestPos = info.pos;
                    closestDis = distance;
                    edgeV = info.edgeV;
                }
            }
            
            if (closestPos != null) {
                this.lineWay[i + 1].copyFrom(closestPos.subtract(this.position));

                let lineV = end.subtract(start);

                lineV = lineV.reflect(new Point(edgeV.y, - edgeV.x).normalize());

                this.lineWay.push(this.lineWay[i + 1].add(lineV));
            } else {
                break;
            }
        }

        if (this.lineWay.length == this.reflectCount + 3) {
            this.lineWay.pop();
        }
    }

    draw() {
        this.clear();
        this.beginFill(0xff0000, 1);
        this.drawCircle(0, 0, 10);
        this.endFill();

        this.lineStyle(4, 0xff0000, 1);
        this.moveTo(this.lineWay[0].x, this.lineWay[0].y);

        for (let i = 1; i < this.lineWay.length; i++) {
            this.lineTo(this.lineWay[i].x, this.lineWay[i].y);
        }

        this.endFill();
    }
}

var params = new URLSearchParams(window.location.search)

for (const i of params.keys()) {
    console.log(i);
    console.log(params.get(i));
}

console.log(params);

game = new Game()
