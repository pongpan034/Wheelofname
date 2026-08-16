/**
 * Canvas Confetti Particle Engine
 * สร้างเอฟเฟกต์พลุกระดาษเฉลิมฉลองเมื่อสุ่มได้ผู้ชนะ
 */
class ConfettiEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.isActive = false;
        this.colors = [
            '#0284c7', '#38bdf8', '#3b82f6', '#60a5fa', 
            '#ec4899', '#f43f5e', '#10b981', '#fbbf24', 
            '#8b5cf6', '#a855f7', '#f97316', '#14b8a6'
        ];
    }

    init() {
        if (this.canvas) return;
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'confetti-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '99999';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth * window.devicePixelRatio;
        this.canvas.height = window.innerHeight * window.devicePixelRatio;
        if (this.ctx) {
            this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
    }

    fire(durationMs = 4000) {
        this.init();
        this.resize();
        this.particles = [];
        this.isActive = true;

        const count = 180;
        const width = window.innerWidth;
        const height = window.innerHeight;

        // ปล่อยจาก 2 ฝั่ง ซ้ายและขวา + ตรงกลาง
        for (let i = 0; i < count; i++) {
            const side = i % 3;
            let startX, startY, vx, vy;

            if (side === 0) {
                // จากฝั่งซ้าย
                startX = width * 0.1;
                startY = height * 0.7;
                vx = (Math.random() * 8 + 4);
                vy = -(Math.random() * 12 + 10);
            } else if (side === 1) {
                // จากฝั่งขวา
                startX = width * 0.9;
                startY = height * 0.7;
                vx = -(Math.random() * 8 + 4);
                vy = -(Math.random() * 12 + 10);
            } else {
                // จากตรงกลาง
                startX = width * 0.5;
                startY = height * 0.6;
                vx = (Math.random() - 0.5) * 14;
                vy = -(Math.random() * 15 + 10);
            }

            this.particles.push({
                x: startX,
                y: startY,
                vx: vx,
                vy: vy,
                size: Math.random() * 8 + 6,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 12,
                opacity: 1,
                shape: Math.random() > 0.3 ? 'rect' : 'circle',
                gravity: 0.38,
                drag: 0.985
            });
        }

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.animate();

        setTimeout(() => {
            this.stop();
        }, durationMs);
    }

    animate() {
        if (!this.isActive || !this.ctx) return;

        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        let activeCount = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            p.vx *= p.drag;
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;

            if (p.y > window.innerHeight * 0.6) {
                p.opacity -= 0.015;
            }

            if (p.opacity > 0 && p.y < window.innerHeight + 50) {
                activeCount++;
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate((p.rotation * Math.PI) / 180);
                this.ctx.globalAlpha = Math.max(0, p.opacity);
                this.ctx.fillStyle = p.color;

                if (p.shape === 'rect') {
                    this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                } else {
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }

                this.ctx.restore();
            }
        }

        if (activeCount > 0 && this.isActive) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        }
    }

    stop() {
        this.isActive = false;
        if (this.ctx) {
            this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        }
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

window.confettiCtrl = new ConfettiEngine();
