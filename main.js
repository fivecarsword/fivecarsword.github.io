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

function addParameter(url, key, value) {
    return `${url}&${key}=${value}`;
}

class Game {
    constructor({width, height, laserPos, laserRadian = 0, laserReflectCount = 5, boxes = undefined} = {}) {
        this.app = new PIXI.Application({
            background: "#1088bb",
            resizeTo: window,
            antialiasing: true,
        });

        this.stage = this.app.stage;
        this.movable = new PIXI.Container();
        this.fixed = new PIXI.Container();

        if (width === undefined) {
            this.width = this.app.screen.width;
        } else {
            this.width = width;
        }
        if (height === undefined) {
            this.height = this.app.screen.height;
        } else {
            this.height = height;
        }

        this.stage.position = new Point(this.app.screen.width / 2 - this.width / 2, this.app.screen.height / 2 - this.height / 2);

        if (laserPos === undefined) {
            laserPos = new Point(this.width / 2, this.height / 2);
        }

        this.boxes = boxes;

        this.app.ticker.maxFPS = 30;

        document.body.appendChild(this.app.view);

        this.stage.eventMode = 'static';

        this.app.ticker.add((delta) => this.tick(delta));
        this.stage.on('pointermove', this.pointerMove.bind(this));

        this.stage.on("pointerdown", this.pointerDown.bind(this));
        this.stage.on("pointerup", this.pointerUp.bind(this));
        this.stage.on("pointerupoutside", this.pointerUpOutside.bind(this));

        this.isObjectMoving = false;
        this.movingTaget = null;

        this.move = ((event) => {
            if (!this.isObjectMoving) {
                this.stage.x += event.movementX;
                this.stage.y += event.movementY;
            } else {
                this.movingTaget.x += event.movementX;
                this.movingTaget.y += event.movementY;
            }

        }).bind(this);

        this.a = PIXI.Sprite.from('a.png');
        this.a.alpha = 0;
        this.stage.addChild(this.a);

        if (this.boxes === undefined) {
            this.boxes = [];
            for (let i = 0; i < 7; i++) {
                let x = Math.random() * this.width;
                let y = Math.random() * this.height;
                let radian = Math.random() * Math.PI * 2;
                let mirror = new Mirror({game: this, pos: new Point(x, y), radian: radian, movable: true});
                this.movable.addChild(mirror);

                this.boxes.push(mirror);
            }
        } else {
            for (let box of this.boxes) {
                if (box.movable) {
                    this.movable.addChild(box);
                } else {
                    this.fixed.addChild(box);
                }
                box.game = this;
            }
        }

        this.outline = new Box({
            vertices: [
                new Point(0, 0),
                new Point(this.width, 0),
                new Point(this.width, this.height),
                new Point(0, this.height)
            ],
        });
        this.fixed.addChild(this.outline);
        this.boxes.push(this.outline);

        this.laser = new Laser({
            boxes: this.boxes,
            pos: laserPos,
            radian: laserRadian,
            laserLength: Math.sqrt(this.width * this.width + this.height * this.height) + 10,
            reflectCount: laserReflectCount,
        });

        this.goal = new Goal();

        this.g = new PIXI.Graphics();

        this.stage.addChild(this.g);
        this.stage.addChild(this.laser);
        this.stage.addChild(this.goal);
        this.stage.addChild(this.fixed);
        this.stage.addChild(this.movable);

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
        this.laser.radian = (this.laser.radian - delta * 0.01) % (2 * Math.PI);
        this.laser.update();
    }

    pointerDown(event) {
        this.stage.on("pointermove", this.move);
    }

    pointerUp(event) {
        this.stage.off("pointermove", this.move);
    }

    pointerUpOutside(event) {
        this.stage.off("pointermove", this.move);
    }

    pointerMove(event) {
        // let p = this.app.stage.toLocal(event.global).subtract(this.laser.position);
        // this.laser.radian = Math.atan2(p.y, p.x);
    }

    createURL() {
        let url = "https://fivecarsword.github.io/game?";

        url = addParameter(url, "size", `${this.width},${this.height}`);

        url = addParameter(url, "laser", `${this.laser.x},${this.laser.y},${this.laser.radian},${this.laser.reflectCount}`);

        for (let box of this.boxes) {
            console.log(box, this.outline);
            if (box === this.outline) {
                console.log(box);
                continue;
            }
            let vertices = ""
            for (let pos of box.vertices) {
                vertices += `${pos.x},${pos.y},`;
            }
            vertices = vertices.slice(0, -1);

            url = addParameter(url, "box", `${box.constructor.name},${box.x},${box.y},${box.rotation},${box.movable},${vertices}`);
        }

        return url;
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
    constructor({
        vertices = [new Point(-50, -50), new Point(-50, 50), new Point(50, 50), new Point(50, -50)],
        pos = new Point(0, 0),
        radian = 0,
        movable = false,
        game,
        } = {}) {
        super();
        this.vertices = vertices;
        this.position = pos;
        this.rotation = radian;
        this.movable = movable;
        this.game = game;

        if (movable) {
            this.cursor = "pointer";
            this.on("pointerdown", this.pointerDown.bind(this));
            this.on("pointerup", this.pointerUp.bind(this));
            this.on("pointerupoutside", this.pointerUpOutside.bind(this));
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
        this.beginFill(0xffffff, 0.000001);
        this.lineStyle(3, 0x7a7a7a, 1)
        this.drawPolygon(this.vertices);
        this.endFill();
    }

    pointerDown(event) {
        this.game.isObjectMoving = true;
        this.game.movingTaget = this;
    }

    pointerUp(event) {
        this.game.isObjectMoving = false;
    }

    pointerUpOutside(event) {
        this.game.isObjectMoving = false;
    }

    pointerMove(event) {
        this.x += event.movementX;
        this.y += event.movementY;
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

class CollisionInfo {
    constructor(pos, edgeV) {
        this.pos = pos;
        this.edgeV = edgeV;
    }
}

class Laser extends PIXI.Graphics {
    constructor({boxes = [], pos = new Point(0, 0), radian = 0, reflectCount = 5, laserLength = 3000} = {}) {
        super();
        this.boxes = boxes;

        this.position = pos;

        this.radian = radian;
        this.reflectCount = reflectCount;
        this.laserLength = laserLength;

        this.lineWay = [];  

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

        this.lineStyle({width: 4, color: 0xff0000, join: PIXI.LINE_CAP.ROUND});
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

        for (let mirror of this.boxes) {
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

class Loader {
    constructor() {
        this.width = undefined;
        this.height = undefined;

        this.laserPos = undefined;
        this.laserRadian = undefined;
        this.laserReflectCount = undefined;

        this.boxes = undefined;
    }

    load(pair) {
        let [k, txt]= pair;

        if (k === "size") {
            this.loadSize(txt);
        } else if (k === "laser") {
            this.loadLaser(txt);
        } else if (k === "box") {
            this.loadBox(txt);
        }
    }

    // width,height
    loadSize(txt) {
        [this.width, this.height] = txt.split(",").map(Number);
    }

    // x,y,radian,reflectCount
    loadLaser(txt) {
        let [x, y, radian, reflectCount] = txt.split(",").map(Number);

        this.laserPos = new Point(x, y);
        this.laserRadian = radian;
        this.laserReflectCount = reflectCount
    }

    // class,x,y,radian,movable,*vertices
    loadBox(txt) {
        if (this.boxes === undefined) {
            this.boxes = [];
        }

        let arr = txt.split(",");
        let cls = arr[0]
        let x = Number(arr[1]);
        let y = Number(arr[2]);
        let radian = Number(arr[3]);
        let movable = arr[4] === "true";
        let vertices = [];

        for (let i = 0; 5 + i * 2 + 1 < arr.length; i++) {
            vertices.push(new Point(Number(arr[5 + i * 2]), Number(arr[5 + i * 2 + 1])));
        }

        let options = {
            vertices: vertices,
            pos: new Point(x, y),
            radian: radian,
            movable: movable,
        }

        let box;

        if (cls === "Box") {
            box = new Box(options);
        } else if (cls === "Mirror") {
            box = new Mirror(options);
        }

        this.boxes.push(box);
    }
}

var params = new URLSearchParams(window.location.search)

let loader = new Loader();

for (let i of params) {
    console.log(i);
    loader.load(i);
}

console.log(params);

game = new Game({
    width: loader.width,
    height: loader.height,
    laserPos: loader.laserPos,
    laserRadian: loader.laserRadian,
    laserReflectCount: loader.laserReflectCount,
    boxes: loader.boxes,
});
