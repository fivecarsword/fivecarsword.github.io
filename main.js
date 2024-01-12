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
        });

        this.width = this.app.screen.width;
        this.height = this.app.screen.height;

        document.body.appendChild(this.app.view);

        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = this.app.screen;

        this.app.ticker.add((delta) => this.tick(delta));
        this.app.stage.on('pointermove', this.pointerMove, this);

        this.a = PIXI.Sprite.from('a.png');
        this.app.stage.addChild(this.a);

        this.mirrors = [];

        this.mirror = new Mirror();
        this.mirror.x = 300;
        this.mirror.y = 300;
        this.mirror.angle = 70
        this.app.stage.addChild(this.mirror);

        this.mirrors.push(this.mirror);

        this.laser = new Laser(this.mirrors);
        this.laser.x = 10;
        this.laser.y = 30;
        this.app.stage.addChild(this.laser);

        this.g = new PIXI.Graphics();
        this.app.stage.addChild(this.g);
    }

    tick(delta) {
        // this.laser.rad = (this.laser.rad - delta * 0.01) % (2 * Math.PI);
        this.laser.update();
        this.laser.draw();

        this.mirror.angle += delta
    }

    pointerMove(event) {
        let p = event.global.subtract(this.laser.position);
        this.laser.rad = Math.atan2(p.y, p.x);
    }
}

class Mirror extends PIXI.Graphics {
    constructor() {
        super();
        this.vertices = [new Point(-100, -100), new Point(-100, 100), new Point(100, 100), new Point(100, -100)];
        this.draw();
        this.eventMode = "static";
        
        this.cursor = "pointer";
        this.on("pointerdown", this.click);
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
        this.beginFill(0x7a7a7a);
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
        this.reflectCount = 5
        this.laserLength = 3000

        this.update();
        this.draw();
    }

    update() {
        this.lineWay.length = 0;

        this.lineWay.push(new Point(0, 0));
        this.lineWay.push(new Point(this.laserLength * cos(this.rad), this.laserLength * sin(this.rad)));

        for (let i = 0; i < this.reflectCount; i++) {
            let start = this.lineWay[i].add(this.position);
            let end = this.lineWay[i + 1].add(this.position);

            let closestPos = null;
            let closestDis = 1000000;
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
                let lineV = end.subtract(start);

                lineV = lineV.reflect(new Point(edgeV.y, - edgeV.x).normalize());

                this.lineWay[i + 1].copyFrom(closestPos.subtract(this.position));

                this.lineWay.push(this.lineWay[i + 1].add(lineV));
            } else {
                break;
            }
        }
    }

    draw() {
        this.clear();
        this.beginFill(0xff0000, 0);
        this.drawCircle(0, 0, 10);
        this.lineStyle(4, 0xff0000, 1);
        this.moveTo(this.lineWay[0].x, this.lineWay[0].y);

        for (let i = 1; i < this.lineWay.length; i++) {
            this.lineTo(this.lineWay[i].x, this.lineWay[i].y);
        }
        
        // this.closePath();
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
