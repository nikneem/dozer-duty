import { Sprite } from './sprite.interface';
import { Position } from '../models';

/**
 * Animated "Level Complete" message sprite
 */
export class LevelCompleteSprite implements Sprite {
    public position: Position = { x: 0, y: 0 };
    public width: number = 1;
    public height: number = 1;

    private animationTime: number = 0;
    private scaleAnimation: number = 0;
    private pulseAnimation: number = 0;
    private starPositions: Array<{ x: number; y: number; speed: number; rotation: number }> = [];
    private canvasWidth: number;
    private canvasHeight: number;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // Generate star particles
        for (let i = 0; i < 20; i++) {
            this.starPositions.push({
                x: Math.random() * canvasWidth,
                y: Math.random() * canvasHeight,
                speed: Math.random() * 0.5 + 0.2,
                rotation: Math.random() * Math.PI * 2
            });
        }
    }

    public update(deltaTime: number): void {
        this.animationTime += deltaTime;

        // Scale animation (ease in)
        if (this.scaleAnimation < 1) {
            this.scaleAnimation += deltaTime * 0.003;
            if (this.scaleAnimation > 1) {
                this.scaleAnimation = 1;
            }
        }

        // Pulse animation
        this.pulseAnimation = Math.sin(this.animationTime * 0.003) * 0.1 + 1;

        // Update stars
        this.starPositions.forEach(star => {
            star.rotation += deltaTime * 0.001;
            star.y -= star.speed;

            // Reset star when it goes off screen
            if (star.y < -10) {
                star.y = this.canvasHeight + 10;
                star.x = Math.random() * this.canvasWidth;
            }
        });
    }

    public render(ctx: CanvasRenderingContext2D, cellSize: number): void {
        ctx.save();

        // Draw semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Draw animated stars
        this.drawStars(ctx);

        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;

        // Apply scale animation
        const scale = this.easeOutElastic(this.scaleAnimation);

        ctx.translate(centerX, centerY);
        ctx.scale(scale * this.pulseAnimation, scale * this.pulseAnimation);
        ctx.translate(-centerX, -centerY);

        // Draw glow effect
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 30;

        // Main title - "Level Complete!"
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Level Complete!', centerX, centerY - 30);

        // Reset shadow for subtitle
        ctx.shadowBlur = 10;

        // Subtitle with wave animation
        const waveOffset = Math.sin(this.animationTime * 0.005) * 5;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '28px Arial';
        ctx.fillText('Press R to restart', centerX, centerY + 40 + waveOffset);

        // Draw sparkles around the text
        if (this.scaleAnimation >= 1) {
            this.drawSparkles(ctx, centerX, centerY - 30);
        }

        ctx.restore();
    }

    private drawStars(ctx: CanvasRenderingContext2D): void {
        this.starPositions.forEach(star => {
            ctx.save();
            ctx.translate(star.x, star.y);
            ctx.rotate(star.rotation);

            // Draw 4-pointed star
            ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
            ctx.beginPath();

            const outerRadius = 3;
            const innerRadius = 1.5;
            const points = 4;

            for (let i = 0; i < points * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI / points) * i;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
    }

    private drawSparkles(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
        const sparkleCount = 8;
        const radius = 200;

        for (let i = 0; i < sparkleCount; i++) {
            const angle = (Math.PI * 2 / sparkleCount) * i + this.animationTime * 0.001;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(this.animationTime * 0.002);

            // Draw sparkle
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(0, -4);
            ctx.lineTo(1, -1);
            ctx.lineTo(4, 0);
            ctx.lineTo(1, 1);
            ctx.lineTo(0, 4);
            ctx.lineTo(-1, 1);
            ctx.lineTo(-4, 0);
            ctx.lineTo(-1, -1);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }

    private easeOutElastic(t: number): number {
        const c4 = (2 * Math.PI) / 3;

        return t === 0
            ? 0
            : t === 1
                ? 1
                : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
}
