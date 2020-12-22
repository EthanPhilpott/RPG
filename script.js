"use strict"

//
// ░█████╗░░█████╗░███╗░░██╗░██████╗████████╗░██████╗
// ██╔══██╗██╔══██╗████╗░██║██╔════╝╚══██╔══╝██╔════╝
// ██║░░╚═╝██║░░██║██╔██╗██║╚█████╗░░░░██║░░░╚█████╗░
// ██║░░██╗██║░░██║██║╚████║░╚═══██╗░░░██║░░░░╚═══██╗
// ╚█████╔╝╚█████╔╝██║░╚███║██████╔╝░░░██║░░░██████╔╝
// ░╚════╝░░╚════╝░╚═╝░░╚══╝╚═════╝░░░░╚═╝░░░╚═════╝░
//

let root = getComputedStyle(document.documentElement);

const PLAYER_SIZE = Number(root.getPropertyValue('--player-size').replace('px', ''));
const SWORD_SIZE  = Number(root.getPropertyValue('--sword-size') .replace('px', ''));

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
    constructor (html, weaponHtml) {
        this.html         = html;
        this.weapon       = {html: weaponHtml, pos: {x: 0, y: 0}}
        this.pos          = {x: 0, y: 0}
        this.mouse        = {x: 0, y: 0, angle: 0}
        this.pressed      = [];
        this.maxSpeed     = .30;
        this.acceleration = .005;
        this.velocity     = {w: 0, a: 0, s: 0, d: 0};
        this.slowMult     = 1.5;

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

        window.addEventListener('click', (e) => {
            let div = document.createElement('div')
            div.style.width  = '5px'
            div.style.height = '5px'
            div.style.backgroundColor = 'purple'
            div.style.position = 'absolute'
            div.style.transform = `translate(${this.weapon.pos.x}px, ${this.weapon.pos.y}px) rotate(${this.mouse.angle}rad)`
            this.html.appendChild(div)
        })
    }

    MouseAngle () {
        this.mouse.angle  = Math.atan2(this.mouse.y - this.pos.y, this.mouse.x - this.pos.x)
        this.weapon.pos.x = Math.cos(this.mouse.angle) * PLAYER_SIZE;
        this.weapon.pos.y = Math.sin(this.mouse.angle) * PLAYER_SIZE;
        this.weapon.html.style.transform = `translate(${this.weapon.pos.x}px, ${this.weapon.pos.y}px) rotate(${this.mouse.angle}rad)`
    }

    Animate () {
        setInterval(() => {
            this.Update()
        }, 1);
    }

    Update () {
        this.Move()
        this.MouseAngle() 
        this.html.style.transform = `translate(${this.pos.x - PLAYER_SIZE / 2}px, ${this.pos.y - PLAYER_SIZE / 2}px)`
    }

    Move () {
        if (this.pressed.includes('w')) {
            if (this.velocity.w < this.maxSpeed) this.velocity.w += this.acceleration;
            this.pos.y -= 1 * this.velocity.w; 
        } else {
            if (this.velocity.w > 0) {
                this.velocity.w -= 1 * this.acceleration * this.slowMult;
                this.pos.y -= 1 * this.velocity.w; 
            }
        }

        if (this.pressed.includes('a')) {
            if (this.velocity.a < this.maxSpeed) this.velocity.a += this.acceleration;
            this.pos.x -= 1 * this.velocity.a; 
        } else {
            if (this.velocity.a > 0) {
                this.velocity.a -= 1 * this.acceleration * this.slowMult;
                this.pos.x -= 1 * this.velocity.a; 
            } 
        }

        if (this.pressed.includes('s')) {
            if (this.velocity.s < this.maxSpeed) this.velocity.s += this.acceleration;
            this.pos.y += 1 * this.velocity.s; 
        } else {
            if (this.velocity.s > 0) {
                this.velocity.s -= 1 * this.acceleration * this.slowMult;
                this.pos.y += 1 * this.velocity.s; 
            } 
        }

        if (this.pressed.includes('d')) {
            if (this.velocity.d < this.maxSpeed) this.velocity.d += this.acceleration;
            this.pos.x += 1 * this.velocity.d; 
        } else {
            if (this.velocity.d > 0) {
                this.velocity.d -= 1 * this.acceleration * this.slowMult;
                this.pos.x += 1 * this.velocity.d; 
            }
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
    constructor (html, hitbox, startx, starty, velocity) {
        this.html     = html;
        this.pos      = {x: startx, y: starty};
        this.velocity = velocity;
        this.displace = 1;

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
    }

    Move () {
        this.displace += this.velocity[0];
        this.pos.x = Math.cos(this.velocity[1]) * this.displace;
        this.pos.y = Math.sin(this.velocity[1]) * this.displace;
        this.html.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px) rotate(${this.velocity[1]}rad)`
    }
}

let projAngle = Math.PI / 4;
let testProjHitBox = new HitBox([0, 0], [10, 0], [10, 30], [0, 30], projAngle)
console.log(testProjHitBox.ReturnPoints())
let testProj = new Projectile(document.getElementById('proj'), testProjHitBox, 100, 100, [1, projAngle]) 

let player = new Player(document.getElementById('player'), document.getElementById('sword'));