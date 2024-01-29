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
  
    let buffer = 0.001;
  
    if (d1+d2 >= lineLen-buffer && d1+d2 <= lineLen+buffer) {
        return true;
    }
    return false;
}

function lineCircle(x1, y1, x2, y2, cx, cy, r) {
    // is either end INSIDE the circle?
    // if so, return true immediately
    // let inside1 = pointCircle(x1,y1, cx,cy,r);
    // let inside2 = pointCircle(x2,y2, cx,cy,r);
    // if (inside1 || inside2) return true;

    // get length of the line
    let distX = x1 - x2;
    let distY = y1 - y2;
    let len = Math.sqrt( (distX*distX) + (distY*distY) );
  
    // get dot product of the line and circle
    let dot = ( ((cx-x1)*(x2-x1)) + ((cy-y1)*(y2-y1)) ) / Math.pow(len,2);
  
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
    let distance = Math.sqrt( (distX*distX) + (distY*distY) );
  
    if (distance <= r) {
      return new Point(closestX, closestY);
    }

    return null;
}

function addParameter(url, key, value) {
    return `${url}&${key}=${value}`;
}

class Game {
    constructor({width, height, laser, goal, boxes = undefined} = {}) {
        this.app = new PIXI.Application({
            background: "#57d9a9",
            resizeTo: window,
            antialiasing: true,
        });

        this.stage = this.app.stage;
        this.touch = new PIXI.Container();
        this.world = new PIXI.Container();
        this.ui = new PIXI.Container();
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

        this.world.position = new Point(this.app.screen.width / 2 - this.width / 2, this.app.screen.height / 2 - this.height / 2);
        
        this.laser = laser;
        this.goal = goal;
        this.boxes = boxes;

        this.app.ticker.maxFPS = 30;

        let div = document.createElement("div");
        div.appendChild(this.app.view);

        document.body.appendChild(div);

        this.touch.eventMode = "static";

        let area = this.app.screen.clone();
        this.touch.hitArea = area;

        this.app.ticker.add(this.tick.bind(this));
        this.touch.on("pointerdown", this.pointerDown.bind(this));
        this.touch.on("pointerup", this.pointerUp.bind(this));
        this.touch.on("pointerupoutside", this.pointerUpOutside.bind(this));

        this.move = this.pointerMove.bind(this);

        this.isObjectMoving = false;
        this.movingTaget = null;
        this.rotateLeft = false;
        this.rotateRight = false;

        this.deleteButton = new ImageButton({
            imagePath: "delete.png",
            width: 50,
            height: 50,
            pos: new Point(this.app.screen.width - 60, this.app.screen.height - 150),
            onpointerdown: () => {
                
            },
            onpointerup: () => {
                this.deleteGameobject(this.movingTaget);
            }
        });

        this.rightButton = new ImageButton({
            imagePath: "rotateRight.png",
            width: 50,
            height: 50,
            pos: new Point(this.app.screen.width - 120, this.app.screen.height - 150),
            onpointerdown: () => {
                this.rotateRight = true;
            },
            onpointerup: () => {
                this.rotateRight = false;
            }
        });

        this.leftButton = new ImageButton({
            imagePath: "rotateLeft.png",
            width: 50,
            height: 50,
            pos: new Point(this.app.screen.width - 180, this.app.screen.height - 150),
            onpointerdown: () => {
                this.rotateLeft = true;
            },
            onpointerup: () => {
                this.rotateLeft = false;
            }
        });

        this.zoominButton = new ImageButton({
            imagePath: "zoomIn.png",
            width: 50,
            height: 50,
            pos: new Point(this.app.screen.width - 240, this.app.screen.height - 150),
            onpointerdown: () => {
                
            },
            onpointerup: () => {
                let beforeScale = this.world.scale.x;
                let afterScale = Math.min(beforeScale * 1.2, 2);

                let beforePos = new Point(this.app.screen.width / 2 - this.world.x, this.app.screen.height / 2 - this.world.y);
                let afterPos = new Point(afterScale * beforePos.x / beforeScale, afterScale * beforePos.y / beforeScale);

                this.world.scale.set(afterScale, afterScale);
                this.world.x += beforePos.x - afterPos.x;
                this.world.y += beforePos.y - afterPos.y;
            }
        });

        this.zoomoutButton = new ImageButton({
            imagePath: "zoomOut.png",
            width: 50,
            height: 50,
            pos: new Point(this.app.screen.width - 300, this.app.screen.height - 150),
            onpointerdown: () => {
                
            },
            onpointerup: () => {
                let beforeScale = this.world.scale.x;
                let afterScale = Math.max(beforeScale * 0.8, 0.2);

                let beforePos = new Point(this.app.screen.width / 2 - this.world.x, this.app.screen.height / 2 - this.world.y);
                let afterPos = new Point(afterScale * beforePos.x / beforeScale, afterScale * beforePos.y / beforeScale);

                this.world.scale.set(afterScale, afterScale);
                this.world.x += beforePos.x - afterPos.x;
                this.world.y += beforePos.y - afterPos.y;
            }
        });

        this.ui.addChild(this.leftButton);
        this.ui.addChild(this.rightButton);
        this.ui.addChild(this.deleteButton);
        this.ui.addChild(this.zoominButton);
        this.ui.addChild(this.zoomoutButton);

        this.a = PIXI.Sprite.from('a.png');
        this.a.alpha = 0;
        this.world.addChild(this.a);

        if (this.boxes === undefined) {
            this.boxes = [];
            // for (let i = 0; i < 7; i++) {
            //     let x = Math.random() * this.width;
            //     let y = Math.random() * this.height;
            //     let radian = Math.random() * Math.PI * 2;
            //     let reflection = Boolean(Math.round(Math.random()));
            //     let mirror = new Box({
            //         color: 0xffffff,
            //         game: this,
            //         pos: new Point(x, y),
            //         radian: radian,
            //         movable: true,
            //         reflection: reflection
            //     });
            //     this.boxes.push(mirror);
            // }
        }

        this.outline = new Box({
            fillAlpha: 0,
            vertices: [
                new Point(0, 0),
                new Point(this.width, 0),
                new Point(this.width, this.height),
                new Point(0, this.height)
            ],
            movable: false,
            reflection: true,
        });
        this.boxes.push(this.outline);

        for (let box of this.boxes) {
            box.game = this;
            this.addGameobject(box);
        }

        if (this.laser === undefined) {
            this.laser = new Laser({
                boxes: this.boxes,
                pos: new Point(this.width / 2, this.height / 2),
                radian: 0,
                laserLength: Math.sqrt(this.width * this.width + this.height * this.height) + 10,
                reflectCount: 5,
                game: this,
                movable: true,
            });
        } else {
            this.laser.boxes = this.boxes;
            this.laser.laserLength = Math.sqrt(this.width * this.width + this.height * this.height) + 10;
            this.laser.game = this;
        }

        if (this.goal === undefined) {
            this.goal = new Goal({
                radius: 15,
                pos: new Point(this.width / 3, this.height / 3),
                game: this,
                movable: true,
            });
        } else {
            this.goal.game = this;
        }

        this.addGameobject(this.laser);
        this.addGameobject(this.goal);

        this.g = new PIXI.Graphics();

        this.world.addChild(this.g);
        this.world.addChild(this.fixed);
        this.world.addChild(this.movable);

        this.touch.addChild(this.world);

        this.stage.addChild(this.touch);
        this.stage.addChild(this.ui);

        this.keyboard = new Keyboard(["a", "s", "d", "w", "q", "e", " "]);

        this.keyboard.setKeyDownEvent(" ", () => {
            this.a.alpha = (this.a.alpha + 1) % 2;
        });
    }

    addGameobject(gameobject) {
        if (gameobject.movable) {
            this.movable.addChild(gameobject);
        } else {
            this.fixed.addChild(gameobject);
        }  
    }

    deleteGameobject(gameobject) {
        if (gameobject instanceof Box) {
            this.boxes.splice(this.boxes.indexOf(gameobject), 1);
            gameobject.destroy();
            this.movingTaget = null;
        }
    }

    updateOutline() {
        this.outline.vertices = [
            new Point(0, 0),
            new Point(this.width, 0),
            new Point(this.width, this.height),
            new Point(0, this.height)
        ];
        this.outline.draw();

        this.laser.laserLength = Math.sqrt(this.width * this.width + this.height * this.height) + 10;
    }

    update(delta) {
        if (this.movingTaget !== null) {
            if (this.movingTaget == this.laser) {
                if (this.rotateLeft) {
                    this.laser.radian = (this.laser.radian - delta * 0.01) % (2 * Math.PI);
                }
                if (this.rotateRight) {
                    this.laser.radian = (this.laser.radian + delta * 0.01) % (2 * Math.PI);
                }
            } else {
                if (this.rotateLeft) {
                    this.movingTaget.rotation = (this.movingTaget.rotation - delta * 0.01) % (2 * Math.PI);
                }
                if (this.rotateRight) {
                    this.movingTaget.rotation = (this.movingTaget.rotation + delta * 0.01) % (2 * Math.PI);
                }
            }
        }
    }

    tick(delta) {
        this.update(delta);
        this.laser.shoot();
    }

    pointerDown(event) {
        this.touch.on("pointermove", this.move);
    }

    pointerUp(event) {
        this.touch.off("pointermove", this.move);
    }

    pointerUpOutside(event) {
        this.touch.off("pointermove", this.move);
    }

    pointerMove(event) {
        let p = this.world.toLocal(event.global).subtract(this.laser.position);
        // this.laser.radian = Math.atan2(p.y, p.x);

        if (!this.isObjectMoving) {
            this.world.x += event.movementX;
            this.world.y += event.movementY;
        } else {
            this.movingTaget.x += event.movementX / this.world.scale.x;
            this.movingTaget.y += event.movementY / this.world.scale.y;
        }
    }

    createUrlParam() {
        let params = "";

        params = addParameter(params, "size", `${this.width},${this.height}`);

        params = addParameter(params, "laser", `${this.laser.x},${this.laser.y},${this.laser.radian},${this.laser.reflectCount},${this.laser.movable}`);
        
        params = addParameter(params, "goal", `${this.goal.x},${this.goal.y},${this.goal.radius},${this.goal.movable}`);

        for (let box of this.boxes) {
            if (box === this.outline) {
                console.log(box);
                continue;
            }
            let vertices = ""
            for (let pos of box.vertices) {
                vertices += `${pos.x},${pos.y},`;
            }
            vertices = vertices.slice(0, -1);

            params = addParameter(params, "box", `${box.color},${box.lineColor},${box.fillAlpha},${box.x},${box.y},${box.rotation},${false},${box.reflection},${vertices}`);
        }

        return params;
    }

    createPlayUrlParam() {
        let params = "";

        params = addParameter(params, "size", `${this.width},${this.height}`);

        params = addParameter(params, "laser", `${this.laser.x},${this.laser.y},${this.laser.radian},${this.laser.reflectCount},${false}`);
        
        params = addParameter(params, "goal", `${this.goal.x},${this.goal.y},${this.goal.radius},${false}`);

        for (let box of this.boxes) {
            if (box === this.outline) {
                console.log(box);
                continue;
            }
            let vertices = ""
            for (let pos of box.vertices) {
                vertices += `${pos.x},${pos.y},`;
            }
            vertices = vertices.slice(0, -1);

            params = addParameter(params, "box", `${box.color},${box.lineColor},${box.fillAlpha},${box.x},${box.y},${box.rotation},${false},${box.reflection},${vertices}`);
        }

        return params;
    }

    createEditorUrlParam() {
        let params = "";

        params = addParameter(params, "size", `${this.width},${this.height}`);

        params = addParameter(params, "laser", `${this.laser.x},${this.laser.y},${this.laser.radian},${this.laser.reflectCount},${true}`);
        
        params = addParameter(params, "goal", `${this.goal.x},${this.goal.y},${this.goal.radius},${true}`);

        for (let box of this.boxes) {
            if (box === this.outline) {
                console.log(box);
                continue;
            }
            let vertices = ""
            for (let pos of box.vertices) {
                vertices += `${pos.x},${pos.y},`;
            }
            vertices = vertices.slice(0, -1);

            params = addParameter(params, "box", `${box.color},${box.lineColor},${box.fillAlpha},${box.x},${box.y},${box.rotation},${true},${box.reflection},${vertices}`);
        }

        return params;
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

class Button extends PIXI.Container {
    constructor({width, height, pos, onpointerdown, onpointerup}) {
        super();
        
        this.uiWidth = width;
        this.uiHeight = height;
        this.position = pos;

        this.hitArea = new PIXI.Rectangle(0, 0, this.uiWidth, this.uiHeight);

        this.onpointerdown = () => onpointerdown();
        this.onpointerup = () => onpointerup();
        this.onpointerupoutside = () => onpointerup();

        this.eventMode = "static";
        this.cursor = "pointer";

        try {
            this.draw();
        } catch {

        }
    }

    draw() {
        this.g = new PIXI.Graphics();
        this.addChild(this.g);

        this.g.beginFill(0x00ff00);
        this.g.drawRect(0, 0, this.uiWidth, this.uiHeight);
        this.g.endFill();
    }
}

class TextButton extends Button {
    constructor({text, width, height, pos, textStyle, onpointerdown, onpointerup}) {
        super({width, height, pos, onpointerdown, onpointerup});

        this.text = text;
        this.textStyle = textStyle;
        this.draw();
    }

    draw() {
        this.g = new PIXI.Graphics();
        this.addChild(this.g);

        this.g.beginFill(0xffffff);
        this.g.drawRect(0, 0, this.uiWidth, this.uiHeight);
        this.g.endFill();

        this.pText = new PIXI.Text(this.text, this.textStyle);
        this.pText.anchor.set(0.5);
        this.pText.position.set(this.uiWidth / 2, this.uiHeight / 2);
        this.addChild(this.pText);
    }
}

class ImageButton extends Button {
    constructor({imagePath, width, height, pos, onpointerdown, onpointerup}) {
        super({width, height, pos, onpointerdown, onpointerup});

        this.imagePath = imagePath;

        this.draw();
    }
    draw() {
        this.image = PIXI.Sprite.from(this.imagePath);
        this.addChild(this.image);
    }
}

class Gameobject extends PIXI.Graphics {
    constructor(game, movable = true) {
        super();

        this.eventMode = "static";
        this.game = game;
        this.movable = movable;

        if (movable) {
            this.cursor = "pointer";
            this.on("pointerdown", this.pointerDown.bind(this));
            this.on("pointerup", this.pointerUp.bind(this));
            this.on("pointerupoutside", this.pointerUpOutside.bind(this));
        }
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

class Box extends Gameobject {
    constructor({
        color = 0xffffff,
        lineColor = 0x7a7a7a,
        fillAlpha = 0.3,
        vertices = [new Point(-50, -50), new Point(-50, 50), new Point(50, 50), new Point(50, -50)],
        pos = new Point(0, 0),
        radian = 0,
        movable = false,
        reflection = true,
        game,
        } = {}) {
        super(game, movable);

        this.color = color;
        this.lineColor = lineColor;
        this.fillAlpha = fillAlpha;

        this.vertices = vertices;
        this.position = pos;
        this.rotation = radian;
        this.reflection = reflection;

        this.draw();
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
                collisionInfos.push(new CollisionInfo(this, pos, next.subtract(current)));
            }
        }

        return collisionInfos;
    }

    draw() {
        this.clear();
        this.beginFill(this.color, this.fillAlpha);
        this.lineStyle(4, this.lineColor);
        this.drawPolygon(this.vertices);
        this.endFill();
    }
}

class Mirror extends Box {
    draw() {
        this.clear();
        this.beginFill(0xffffff, 0.1);
        this.lineStyle(4, 0x7a7a7a, 1);
        this.drawPolygon(this.vertices);
        this.endFill();
    }
}

class CollisionInfo {
    constructor(box, pos, edgeV) {
        this.box = box;
        this.pos = pos;
        this.edgeV = edgeV;
    }
}

class Laser extends Gameobject {
    constructor({boxes = [], pos = new Point(0, 0), radian = 0, reflectCount = 5, laserLength = 3000, game, movable = false} = {}) {
        super(game, movable);

        this.boxes = boxes;
        this.position = pos;
        this.radian = radian;
        this.reflectCount = reflectCount;
        this.laserLength = laserLength;

        this.lineWay = [];
    }

    shoot() {
        this.game.goal.isActive = false;
        
        this.lineWay.length = 0;

        this.lineWay.push(new Point(0, 0));
        this.lineWay.push(new Point(this.laserLength * cos(this.radian), this.laserLength * sin(this.radian)));

        for (let i = 0; i < this.reflectCount; i++) {
            let start = this.lineWay[i].add(this.position);
            let end = this.lineWay[i + 1].add(this.position);

            let goalPos = this.game.goal.checkLineCollision(start, end);

            let info = this.collisionMirror(start, end);

            if (goalPos !== null && info !== null && goalPos.subtract(start).magnitude() < info.pos.subtract(start).magnitude()) {
                this.game.goal.isActive = true;
                this.lineWay[i + 1].copyFrom(goalPos.subtract(this.position));
                break;
            }
            
            if (info !== null && info.box.reflection) {
                this.lineWay[i + 1].copyFrom(info.pos.subtract(this.position));

                let lineV = end.subtract(start);

                lineV = lineV.reflect(new Point(info.edgeV.y, - info.edgeV.x).normalize());

                this.lineWay.push(this.lineWay[i + 1].add(lineV));
            } else {
                break;
            }
        }

        let start = this.lineWay[this.lineWay.length - 2].add(this.position);
        let end = this.lineWay[this.lineWay.length - 1].add(this.position);

        let info = this.collisionMirror(start, end);

        if (info != null) {
            this.lineWay[this.lineWay.length - 1].copyFrom(info.pos.subtract(this.position));
        }

        let goalPos = this.game.goal.checkLineCollision(start, this.lineWay[this.lineWay.length - 1].add(this.position));

        if (goalPos != null) {
            this.game.goal.isActive = true;
            this.lineWay[this.lineWay.length - 1].copyFrom(goalPos.subtract(this.position));
        }
        
        this.draw();
    }

    wait() {
        this.lineWay.length = 0;

        this.lineWay.push(new Point(0, 0));
        this.lineWay.push(new Point(50 * cos(this.radian), 50 * sin(this.radian)));

        this.draw();
    }

    draw() {
        let end = this.lineWay[this.lineWay.length - 1];

        this.clear();
        this.beginFill(0xff0000, 1);
        this.drawCircle(0, 0, 10);
        // this.beginFill(0xffff00, 1);
        // this.drawCircle(end.x, end.y, 5)
        this.endFill();

        this.lineStyle({width: 4, color: 0xff0000, join: PIXI.LINE_CAP.ROUND});
        this.moveTo(this.lineWay[0].x, this.lineWay[0].y);

        for (let i = 1; i < this.lineWay.length; i++) {
            this.lineTo(this.lineWay[i].x, this.lineWay[i].y);
        }
    }

    collisionMirror(start, end) {
        let closestDis = Number.POSITIVE_INFINITY;

        let closestCollision = null;

        let infos = [];

        for (let box of this.boxes) {
            infos.push(...box.checkLineCollision(start, end));
        }

        for (let info of infos) {
            let distance = info.pos.subtract(start).magnitude();

            if (distance < closestDis) {
                closestDis = distance;

                closestCollision = info;
            }
        }

        return closestCollision;
    }
}

class Goal extends Gameobject {
    constructor({radius = 10, pos = new Point(0, 0), game, movable = false} = {}) {
        super(game, movable);

        this.radius = radius;

        if (pos !== undefined) {
            this.position = pos;
        }

        this.isActive = false;

        this.draw();
    }

    draw() {
        this.clear();
        this.beginFill(0x0000ee);
        this.drawCircle(0, 0, this.radius);
    }

    checkLineCollision(start, end) {
        return lineCircle(start.x, start.y, end.x, end.y, this.x, this.y, this.radius);
    }
}

class BoxCreationUI extends PIXI.Graphics {
    constructor({width, height, pos, creationBoxes, game}) {
        super();
        this.uiWidth = width;
        this.uiHeight = height;
        this.position = pos;
        this.creationBoxes = creationBoxes;
        this.game = game;

        this.scroll = new PIXI.Container();
        this.scroll.position.set(0, this.uiHeight / 2);
        this.scroll.setParent(this);

        const gap = 20;
        
        for (let i = 0, right = gap; i < this.creationBoxes.length; i++) {
            let box = this.creationBoxes[i];
            box.game = this.game;
            let bound = box.getBounds();

            let scale = this.uiHeight / (bound.height + gap);
            box.scale = new Point(scale, scale);

            let x = right + bound.width / 2;
            box.position.set(x, 0);

            right = right + bound.width + gap;

            box.cursor = "pointer";

            box.on("pointerup", this.create.bind(box));

            box.setParent(this.scroll);
        }

        this.eventMode = "static";

        this.beginFill(0xeeeeee);
        this.drawRect(0, 0, this.uiWidth, this.uiHeight);
        this.endFill();
    }

    create(event) {
        let newBox = new Box({
            color: this.color,
            lineColor: this.lineColor,
            fillAlpha: this.fillAlpha,
            pos: this.game.movable.toLocal(new Point(this.game.app.screen.width / 2, this.game.app.screen.height / 2)),
            radian: this.radian,
            movable: true,
            reflection: this.reflection,
            game: this.game,
        });

        this.game.movable.addChild(newBox);
        this.game.boxes.push(newBox);
    }
}

class Popup extends PIXI.Graphics {
    constructor({width, height, game}) {
        super();

        this.uiWidth = width;
        this.uiHeight = height;
        this.game = game;

        this.container = new PIXI.Container();
        this.container.position.set(this.game.app.screen.width / 2, this.game.app.screen.height / 2);
        this.addChild(this.container);

        this.eventMode = "static";

        this.draw();
    }

    draw() {
        let screen = this.game.app.screen;
        this.beginFill(0x000000, 0.5);
        this.drawRect(0, 0, screen.width, screen.height);
        this.beginFill(0xcccccc, 1);
        this.drawRect(screen.width / 2 - this.uiWidth / 2, screen.height / 2 - this.uiHeight / 2, this.uiWidth, this.uiHeight);
    }
}

class Loader {
    constructor(params) {
        this.width = undefined;
        this.height = undefined;

        this.laser = undefined;

        this.boxes = undefined;

        for (let i of params) {
            this.load(i);
        }
    }

    load(pair) {
        let [k, txt]= pair;

        if (k === "size") {
            this.loadSize(txt);
        } else if (k === "laser") {
            this.loadLaser(txt);
        } else if (k === "goal") {
            this.loadGoal(txt);
        } else if (k === "box") {
            this.loadBox(txt);
        }
    }

    // width,height
    loadSize(txt) {
        [this.width, this.height] = txt.split(",").map(Number);
    }

    // x,y,radian,reflectCount,movable
    loadLaser(txt) {
        let arr = txt.split(",");
        let x = Number(arr[0]);
        let y = Number(arr[1]);
        let radian = Number(arr[2]);
        let reflectCount = Number(arr[3]);
        let movable = arr[4] === "true";

        this.laser = new Laser({
            pos: new Point(x, y),
            radian: radian,
            reflectCount: reflectCount,
            movable: movable,
        });
    }

    // x,y,radius,movable
    loadGoal(txt) {
        let arr = txt.split(",");
        let x = Number(arr[0]);
        let y = Number(arr[1]);
        let radius = Number(arr[2]);
        let movable = arr[3] === "true";

        this.goal = new Goal({
            pos: new Point(x, y),
            radius: radius,
            movable: movable,
        });
    }

    // color,lineColor,fillAlpha,x,y,radian,movable,*vertices
    loadBox(txt) {
        if (this.boxes === undefined) {
            this.boxes = [];
        }
        
        let arr = txt.split(",");
        let color = Number(arr[0]);
        let lineColor = Number(arr[1]);
        let fillAlpha = Number(arr[2]);
        let x = Number(arr[3]);
        let y = Number(arr[4]);
        let radian = Number(arr[5]);
        let movable = arr[6] === "true";
        let reflection = arr[7] === "true";
        let vertices = [];

        const offset = 8;

        for (let i = 0; offset + i * 2 + 1 < arr.length; i++) {
            vertices.push(new Point(Number(arr[offset + i * 2]), Number(arr[offset + i * 2 + 1])));
        }

        let options = {
            color: color,
            lineColor: lineColor,
            fillAlpha: fillAlpha,
            vertices: vertices,
            pos: new Point(x, y),
            radian: radian,
            movable: movable,
            reflection: reflection,
        }

        let box;

        box = new Box(options);

        this.boxes.push(box);
    }
}