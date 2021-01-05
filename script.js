"use strict"
document.addEventListener('contextmenu', event => event.preventDefault());

//
// ░█████╗░░█████╗░███╗░░██╗░██████╗████████╗░██████╗
// ██╔══██╗██╔══██╗████╗░██║██╔════╝╚══██╔══╝██╔════╝
// ██║░░╚═╝██║░░██║██╔██╗██║╚█████╗░░░░██║░░░╚█████╗░
// ██║░░██╗██║░░██║██║╚████║░╚═══██╗░░░██║░░░░╚═══██╗
// ╚█████╔╝╚█████╔╝██║░╚███║██████╔╝░░░██║░░░██████╔╝
// ░╚════╝░░╚════╝░╚═╝░░╚══╝╚═════╝░░░░╚═╝░░░╚═════╝░
//

let root = getComputedStyle(document.documentElement);

const PLAYER_SIZE  = Number(root.getPropertyValue('--player-size') .replace('px', ''));
const SWORD_WIDTH  = Number(root.getPropertyValue('--sword-width') .replace('px', ''));
const SWORD_HEIGHT = Number(root.getPropertyValue('--sword-height').replace('px', ''));

const SWORD_GAB   = document.createElement('div');
SWORD_GAB.classList.add('sword-gab');
const SPIN_MOVE   = document.createElement('div');
SPIN_MOVE.classList.add('spin-move');
const SWORD_SLASH = document.createElement('div');
SWORD_SLASH.classList.add('sword-slash');

//
// ██╗░░██╗██╗████████╗██████╗░░█████╗░██╗░░██╗
// ██║░░██║██║╚══██╔══╝██╔══██╗██╔══██╗╚██╗██╔╝
// ███████║██║░░░██║░░░██████╦╝██║░░██║░╚███╔╝░
// ██╔══██║██║░░░██║░░░██╔══██╗██║░░██║░██╔██╗░
// ██║░░██║██║░░░██║░░░██████╦╝╚█████╔╝██╔╝╚██╗
// ╚═╝░░╚═╝╚═╝░░░╚═╝░░░╚═════╝░░╚════╝░╚═╝░░╚═╝
//

class HitBox {
    constructor (topLeft, topRight, bottomRight, bottomLeft, angle) {
        this.points = [topLeft, topRight, bottomRight, bottomLeft];
        this.AdjustAngle(angle)
    } 

    FindEq (p1, p2) {
        let slope  = (p2[1] - p1[1]) / (p2[0] - p1[0]),
            yInter = p1[1] - slope * p1[0];
        return [slope, yInter]
    }

    AdjustAngle (angle) {
        for (let point of this.points) {
            point[0] *= Math.cos(angle);
            point[1] *= Math.sin(angle);
        }
        this.slopes = [
            [this.FindEq(this.points[0], this.points[1]), 'less'],
            [this.FindEq(this.points[1], this.points[2]), 'less'],
            [this.FindEq(this.points[2], this.points[3]), 'more'],
            [this.FindEq(this.points[3], this.points[0]), 'more']
        ]
    }

    CheckWithinBounds (point) {
        let withinBounds = true;
        for (let s of this.slopes) {
            if (s[1] === 'less') {
                if (s[0][0] * point[0] + s[0][1] < point[1]) withinBounds = false; break;
            } else {
                if (s[0][0] * point[0] + s[0][1] > point[1]) withinBounds = false; break;
            }
        }

        if (withinBounds) return true;
        else return false;
    }

    ReturnPoints () {
        return this.points
    }
}

//
// ██████╗░██╗░░░░░░█████╗░██╗░░░██╗███████╗██████╗░
// ██╔══██╗██║░░░░░██╔══██╗╚██╗░██╔╝██╔════╝██╔══██╗
// ██████╔╝██║░░░░░███████║░╚████╔╝░█████╗░░██████╔╝
// ██╔═══╝░██║░░░░░██╔══██║░░╚██╔╝░░██╔══╝░░██╔══██╗
// ██║░░░░░███████╗██║░░██║░░░██║░░░███████╗██║░░██║
// ╚═╝░░░░░╚══════╝╚═╝░░╚═╝░░░╚═╝░░░╚══════╝╚═╝░░╚═╝
//

class Player {
    constructor (html, weaponHtml, class_) {
        this.html          = html;
        this.weapon        = {html: weaponHtml, pos: {x: 0, y: 0}}
        this.class         = class_;
        
        this.pos           = {x: 0, y: 0}
        this.mouse         = {x: 0, y: 0, angle: 0}
        
        this.pressed       = [];
        this.click         = -1
        
        this.acceleration  = .005;
        this.accelSlowMult = 1.5;

        this.maxSpeed      = .30;
        this.baseMaxSpeed  = .30;
        this.velocity      = {w: 0, a: 0, s: 0, d: 0};
        
        this.slowed        = false;
        this.slowDiv       = 2;

        this.charge        = {left: 0, right: 0};
        this.maxCharge     = {left: 1, right: 1};
        this.chargeRate    = {left: 0.005, right: 0.005};

        this.Events();
        this.Animate();
    }

    Events () {
        window.addEventListener('keydown', (e) => {
            let key = e.key
            if (!this.pressed.includes(key)) this.pressed.push(key);
        })

        window.addEventListener('keyup', (e) => {
            this.pressed.splice(this.pressed.indexOf(e.key), 1);
        })

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;

            this.MouseAngle()
        })

        window.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            this.click     = e.button;
        })

        window.addEventListener('mouseup', (e) => {
            this.mouseDown = false;
            this.click     = -1
        })
    }

    MouseAngle () {
        this.mouse.angle  = Math.atan2(this.mouse.y - this.pos.y, this.mouse.x - this.pos.x)
        this.weapon.pos.x = Math.cos(this.mouse.angle) * (PLAYER_SIZE + SWORD_HEIGHT / 2) ;
        this.weapon.pos.y = Math.sin(this.mouse.angle) * (PLAYER_SIZE + SWORD_HEIGHT / 2) ;
        this.weapon.html.style.transform = `translate(${this.weapon.pos.x}px, ${this.weapon.pos.y}px) rotate(${this.mouse.angle}rad)`
    }

    Animate () {
        setInterval(() => {
            this.Update()
        }, 1);
    }

    Update () {
        this.Move();
        this.MouseAngle();
        this.Attack(); 
        this.html.style.transform = `translate(${this.pos.x - PLAYER_SIZE / 2}px, ${this.pos.y - PLAYER_SIZE / 2}px)`
    }

    Move () {
        if (this.pressed.includes('w')) {
            if (this.velocity.w < this.maxSpeed) this.velocity.w += this.acceleration;
            this.pos.y -= 1 * this.velocity.w; 
        } else {
            if (this.velocity.w > 0) {
                this.velocity.w -= 1 * this.acceleration * this.accelSlowMult;
                this.pos.y -= 1 * this.velocity.w; 
            }
        }

        if (this.pressed.includes('a')) {
            if (this.velocity.a < this.maxSpeed) this.velocity.a += this.acceleration;
            this.pos.x -= 1 * this.velocity.a; 
        } else {
            if (this.velocity.a > 0) {
                this.velocity.a -= 1 * this.acceleration * this.accelSlowMult;
                this.pos.x -= 1 * this.velocity.a; 
            } 
        }

        if (this.pressed.includes('s')) {
            if (this.velocity.s < this.maxSpeed) this.velocity.s += this.acceleration;
            this.pos.y += 1 * this.velocity.s; 
        } else {
            if (this.velocity.s > 0) {
                this.velocity.s -= 1 * this.acceleration * this.accelSlowMult;
                this.pos.y += 1 * this.velocity.s; 
            } 
        }

        if (this.pressed.includes('d')) {
            if (this.velocity.d < this.maxSpeed) this.velocity.d += this.acceleration;
            this.pos.x += 1 * this.velocity.d; 
        } else {
            if (this.velocity.d > 0) {
                this.velocity.d -= 1 * this.acceleration * this.accelSlowMult;
                this.pos.x += 1 * this.velocity.d; 
            }
        }
    }

    Attack () {
        if (this.click === 2) {
            if (this.charge.right < this.maxCharge.right) this.charge.right += this.chargeRate.right;
            if (!(this.slowed)) {
                this.maxSpeed /= this.slowDiv;
                this.velocity = {w: this.maxSpeed, a: this.maxSpeed, s: this.maxSpeed, d: this.maxSpeed};
                this.slowed = true;
            }
        } 

        else if (this.click === 0) {
            if (this.charge.left < this.maxCharge.left) this.charge.left += this.chargeRate.left;
            if (!(this.slowed)) {
                this.velocity = {w: this.velocity.w / 2, a: this.velocity.a / 2, s: this.velocity.s / 2, d: this.velocity.d / 2};
                this.maxSpeed /= this.slowDiv;
                this.slowed = true;
            }
        } 
        
        else {
            if (this.charge.right >= this.maxCharge.right) {
                let proj = SPIN_MOVE.cloneNode(true)
                let projProp = getComputedStyle(proj);
                document.body.appendChild(proj);
                new Projectile (proj, 0, this.pos.x - projProp.getPropertyValue('width').replace('px', '') / 2, this.pos.y - projProp.getPropertyValue('height').replace('px', '') / 2, 0, [0, this.mouse.angle], 500)
            } else if (this.charge.left >= this.maxCharge.left / 2) {
                let proj = SWORD_SLASH.cloneNode(true);
                let projProp = getComputedStyle(proj);
                document.body.appendChild(proj);
                new Projectile (proj, 0, this.pos.x - projProp.getPropertyValue('width').replace('px', '') / 2, this.pos.y - projProp.getPropertyValue('height').replace('px', '') / 2, 25, [0.1, this.mouse.angle], 350)
            } else if (this.charge.left >= 0.01) {
                let proj = SWORD_GAB.cloneNode(true)
                let projProp = getComputedStyle(proj);
                document.body.appendChild(proj);
                new Projectile (proj, 0, this.pos.x - projProp.getPropertyValue('width').replace('px', '') / 2, this.pos.y - projProp.getPropertyValue('height').replace('px', '') / 2, 25, [0.15, this.mouse.angle], 250)
            }
            this.charge   = {left: 0, right: 0};
            this.maxSpeed = this.baseMaxSpeed
            this.slowed   = false;
        }
    }
}

//
// ██████╗░██████╗░░█████╗░░░░░░██╗███████╗░█████╗░████████╗██╗██╗░░░░░███████╗
// ██╔══██╗██╔══██╗██╔══██╗░░░░░██║██╔════╝██╔══██╗╚══██╔══╝██║██║░░░░░██╔════╝
// ██████╔╝██████╔╝██║░░██║░░░░░██║█████╗░░██║░░╚═╝░░░██║░░░██║██║░░░░░█████╗░░
// ██╔═══╝░██╔══██╗██║░░██║██╗░░██║██╔══╝░░██║░░██╗░░░██║░░░██║██║░░░░░██╔══╝░░
// ██║░░░░░██║░░██║╚█████╔╝╚█████╔╝███████╗╚█████╔╝░░░██║░░░██║███████╗███████╗
// ╚═╝░░░░░╚═╝░░╚═╝░╚════╝░░╚════╝░╚══════╝░╚════╝░░░░╚═╝░░░╚═╝╚══════╝╚══════╝
//

class Projectile {
    constructor (html, hitbox, startx, starty, forward, velocity, lifespan) {
        this.html     = html;
        this.hitbox   = hitbox;
        this.velocity = velocity;
        this.pos      = {
            x: startx + Math.cos(this.velocity[1]) * forward, 
            y: starty + Math.sin(this.velocity[1]) * forward
        };
        this.timeStart = Date.now()
        this.lifespan  = lifespan;

        this.html.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px) rotate(${this.velocity[1]}rad)`
        this.Animate();
    }

    Animate () {
        setInterval(() => {
            this.Update()
        }, 1);
    }

    Update () {
        this.Move();
        if (Date.now() > this.timeStart + this.lifespan) {
            this.Delete()
        } 
    }

    Move () {
        this.pos.x += Math.cos(this.velocity[1]) * this.velocity[0];
        this.pos.y += Math.sin(this.velocity[1]) * this.velocity[0];
        this.html.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px) rotate(${this.velocity[1]}rad)`
    }

    Delete () {
        this.html.remove();
    }
}

let player = new Player(document.getElementById('player'), document.getElementById('sword'), 'swordsman');