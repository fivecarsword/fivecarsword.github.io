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

function linePoint(x1, y1, x2, y2, px, py) {
    let d1 = Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    let d2 = Math.sqrt((px - x2) * (px - x2) + (py - y2) * (py - y2));
  
    let lineLen = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  
    let buffer = EPS;
  
    if (d1+d2 >= lineLen-buffer && d1+d2 <= lineLen+buffer) {
        return true;
    }
    return false;
}

function lineCircle(x1, y1, x2, y2, cx, cy, r) {
    // is either end INSIDE the circle?
    // if so, return true immediately
    let inside1 = pointCircle(x1,y1, cx,cy,r);
    let inside2 = pointCircle(x2,y2, cx,cy,r);
    if (inside1 || inside2) return true;

    // get length of the line
    let distX = x1 - x2;
    let distY = y1 - y2;
    let len = sqrt( (distX*distX) + (distY*distY) );
  
    // get dot product of the line and circle
    let dot = ( ((cx-x1)*(x2-x1)) + ((cy-y1)*(y2-y1)) ) / pow(len,2);
  
    // find the closest point on the line
    let closestX = x1 + (dot * (x2-x1));
    let closestY = y1 + (dot * (y2-y1));
  
    // is this point actually on the line segment?
    // if so keep going, but if not, return false
    let onSegment = linePoint(x1,y1,x2,y2, closestX,closestY);
    if (!onSegment) return null;
  
    // get distance to closest point
    distX = closestX - cx;
    distY = closestY - cy;
    let distance = sqrt( (distX*distX) + (distY*distY) );
  
    if (distance <= r) {
      return new Point(closestX, closestY);
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

        this.app.ticker.add((delta) => this.tick(delta));
        this.app.stage.on('pointermove', this.pointerMove.bind(this));

        this.app.stage.x = 100;

        this.a = PIXI.Sprite.from('a.png');
        this.a.alpha = 0;
        this.app.stage.addChild(this.a);

        this.boxs = [];

        let outline = new Box();
        outline.vertices[0] = new Point(0, 0);
        outline.vertices[1] = new Point(this.width, 0);
        outline.vertices[2] = new Point(this.width, this.height);
        outline.vertices[3] = new Point(0, this.height);
        outline.draw();
        this.app.stage.addChild(outline);
        this.boxs.push(outline);

        for (let i = 0; i < 7; i++) {
            let mirror = new MovableMirror();
            mirror.x = Math.random() * this.width;
            mirror.y = Math.random() * this.height;
            mirror.angle = Math.random() * 360;
            this.app.stage.addChild(mirror);

            this.boxs.push(mirror);
        }

        this.laser = new Laser(this.boxs);
        this.laser.x = this.width / 2;
        this.laser.y = this.height / 2;
        this.app.stage.addChild(this.laser);

        this.goal = new Goal();
        this.app.stage.addChild(this.goal);

        this.g = new PIXI.Graphics();
        this.app.stage.addChild(this.g);

        this.keyboard = new Keyboard(["a", "s", "d", "w", "q", "e", " "]);

        this.keyboard.setKeyDownEvent(" ", () => {
            this.a.alpha = (this.a.alpha + 1) % 2;
        });
    }

    tick(delta) {
        let area = this.app.screen.clone();
        area.x = -this.app.stage.x;
        area.y = -this.app.stage.y;
        this.app.stage.hitArea = area;
        // this.laser.rad = (this.laser.rad - delta * 0.01) % (2 * Math.PI);
        this.laser.update();
    }

    pointerMove(event) {
        let p = this.app.stage.toLocal(event.global).subtract(this.laser.position);
        this.laser.radian = Math.atan2(p.y, p.x);
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

class Box extends PIXI.Graphics {
    constructor(vertices, pos, rad) {
        super();
        this.vertices = [new Point(-50, -50), new Point(-50, 50), new Point(50, 50), new Point(50, -50)];

        if (vertices !== undefined) {
            this.vertices = vertices;
        }
        if (pos !== undefined) {
            this.position = pos;
        }
        if (rad !== undefined) {
            this.rotation = rad;
        }

        this.draw();
        this.eventMode = "static";
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
        this.beginFill(0xffffff, 0);
        this.lineStyle(3, 0x7a7a7a, 1)
        this.drawPolygon(this.vertices);
        this.endFill();
    }
}

class Mirror extends Box {
    draw() {
        this.clear();
        this.beginFill(0xffffff, 0.1);
        this.lineStyle(3, 0x7a7a7a, 1)
        this.drawPolygon(this.vertices);
        this.endFill();
    }
}

class MovableMirror extends Mirror {
    constructor(vertices, pos, rad) {
        super(vertices, pos, rad);

        this.isDown = false;

        this.cursor = "pointer";
        this.on("pointerdown", this.pointerDown.bind(this));
        this.on("pointerup", this.pointerUp.bind(this));
        this.on("pointerupoutside", this.pointerUpOutside.bind(this));

        this.move = this.pointerMove.bind(this);
    }

    pointerDown(event) {
        this.parent.on("pointermove", this.move);
    }

    pointerUp(event) {
        this.parent.off("pointermove", this.move);
    }

    pointerUpOutside(event) {
        this.parent.off("pointermove", this.move);
    }

    pointerMove(event) {
        this.x += event.movementX;
        this.y += event.movementY;
        
    }
}

class CollisionInfo {
    constructor(pos, edgeV) {
        this.pos = pos;
        this.edgeV = edgeV;
    }
}

class Laser extends PIXI.Graphics {
    constructor(boxs, pos, rad) {
        super();
        this.boxs = boxs;

        this.radian = 0;

        if (pos !== undefined) {
            this.position = pos;
        }
        if (rad !== undefined) {
            this.radian = rad;
        }

        this.lineWay = [];
        this.reflectCount = 5;
        this.laserLength = 3000;    

        this.update();
    }

    update() {
        this.lineWay.length = 0;

        this.lineWay.push(new Point(0, 0));
        this.lineWay.push(new Point(this.laserLength * cos(this.radian), this.laserLength * sin(this.radian)));

        for (let i = 0; i < this.reflectCount; i++) {
            let start = this.lineWay[i].add(this.position);
            let end = this.lineWay[i + 1].add(this.position);

            let [closestPos, edgeV] = this.collisionMirror(start, end);
            
            if (closestPos != null) {
                this.lineWay[i + 1].copyFrom(closestPos.subtract(this.position));

                let lineV = end.subtract(start);

                lineV = lineV.reflect(new Point(edgeV.y, - edgeV.x).normalize());

                this.lineWay.push(this.lineWay[i + 1].add(lineV));
            } else {
                break;
            }
        }

        let start = this.lineWay[this.lineWay.length - 2].add(this.position);
        let end = this.lineWay[this.lineWay.length - 1].add(this.position);

        let [closestPos, _] = this.collisionMirror(start, end);

        if (closestPos != null) {
            this.lineWay[this.lineWay.length - 1].copyFrom(closestPos.subtract(this.position));
        }
        
        this.draw();
    }

    draw() {
        let end = this.lineWay[this.lineWay.length - 1];

        this.clear();
        this.beginFill(0xff0000, 1);
        this.drawCircle(0, 0, 10);
        this.beginFill(0xffff00, 1);
        this.drawCircle(end.x, end.y, 5)
        this.endFill();

        this.lineStyle(4, 0xff0000, 1);
        this.moveTo(this.lineWay[0].x, this.lineWay[0].y);

        for (let i = 1; i < this.lineWay.length; i++) {
            this.lineTo(this.lineWay[i].x, this.lineWay[i].y);
        }
    }

    collisionMirror(start, end) {
        let closestPos = null;
        let closestDis = Number.POSITIVE_INFINITY;
        let edgeV;

        let infos = [];

        for (let mirror of this.boxs) {
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

        return [closestPos, edgeV];
    }
}

class Goal extends PIXI.Graphics {
    constructor(radius, pos) {
        super();

        this.radius = radius;

        if (pos !== undefined) {
            this.position = pos;
        }

        this.draw();
    }

    draw() {
        this.beginFill(0xee0000);
        this.drawCircle(0, 0, this.radius);
    }

    checkLineCollision(start, end) {
        return lineCircle(start.x, start.y, end.x, end.y, this.x, this.y, this.radius);
    }
}

var params = new URLSearchParams(window.location.search)

for (const i of params.keys()) {
    console.log(i);
    console.log(params.get(i));
}

console.log(params);

game = new Game()
