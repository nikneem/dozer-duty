import { Sprite } from './sprite.interface';
import { Position } from '../models';

/**
 * Animated crate sprite that can be colored or neutral
 */
export class CrateSprite implements Sprite {
    public position: Position;
    public width: number = 1;
    public height: number = 1;

    private color: string | null;
    private animationTime: number = 0;
    private pulseOffset: number = 0;

    // Movement animation properties
    private isMoving: boolean = false;
    private moveProgress: number = 0;
    private moveStartPos: Position = { x: 0, y: 0 };
    private moveEndPos: Position = { x: 0, y: 0 };
    private moveDuration: number = 200; // milliseconds

    // Texture image
    private static crateImage: HTMLImageElement | null = null;
    private static imageLoaded: boolean = false;

    constructor(position: Position, color: string | null = null) {
        this.position = { ...position };
        this.color = color;
        this.moveStartPos = { ...position };
        this.moveEndPos = { ...position };

        // Load texture image if not already loaded
        if (!CrateSprite.crateImage) {
            CrateSprite.crateImage = new Image();
            CrateSprite.crateImage.onload = () => {
                CrateSprite.imageLoaded = true;
            };
            CrateSprite.crateImage.src = '/textures/crate.png';
        }
    }

    public getColor(): string | null {
        return this.color;
    }

    public startMoveTo(targetPosition: Position): void {
        if (!this.isMoving) {
            this.isMoving = true;
            this.moveProgress = 0;
            this.moveStartPos = { ...this.position };
            this.moveEndPos = { ...targetPosition };
        }
    }

    public isAnimating(): boolean {
        return this.isMoving;
    }

    public update(deltaTime: number): void {
        this.animationTime += deltaTime;

        // Update movement animation
        if (this.isMoving) {
            this.moveProgress += deltaTime / this.moveDuration;

            if (this.moveProgress >= 1) {
                this.moveProgress = 1;
                this.isMoving = false;
                this.position = { ...this.moveEndPos };
            } else {
                // Smooth interpolation using ease-in-out
                const t = this.easeInOutQuad(this.moveProgress);
                this.position.x = this.moveStartPos.x + (this.moveEndPos.x - this.moveStartPos.x) * t;
                this.position.y = this.moveStartPos.y + (this.moveEndPos.y - this.moveStartPos.y) * t;
            }
        }

        // Subtle pulse animation for colored crates
        if (this.color) {
            this.pulseOffset = Math.sin(this.animationTime * 0.003) * 2;
        }
    }

    public render(ctx: CanvasRenderingContext2D, cellSize: number): void {
        const x = this.position.x * cellSize;
        const y = this.position.y * cellSize;
        const padding = cellSize * 0.1;
        const crateSize = cellSize - (padding * 2);

        ctx.save();

        // Draw crate texture if loaded, otherwise draw fallback
        if (CrateSprite.imageLoaded && CrateSprite.crateImage) {
            ctx.drawImage(
                CrateSprite.crateImage,
                x + padding,
                y + padding,
                crateSize,
                crateSize
            );
        } else {
            // Fallback: Draw wooden crate body
            ctx.fillStyle = '#8B4513'; // Saddle brown
            ctx.strokeStyle = '#654321'; // Dark brown
            ctx.lineWidth = 2;

            ctx.fillRect(x + padding, y + padding, crateSize, crateSize);
            ctx.strokeRect(x + padding, y + padding, crateSize, crateSize);
        }

        // Draw colored dot if crate has a color
        if (this.color) {
            const dotRadius = cellSize * 0.2 + this.pulseOffset;
            const centerX = x + cellSize / 2;
            const centerY = y + cellSize / 2;

            // Outer glow
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, dotRadius * 1.5
            );
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(0.7, this.color + '80'); // Add transparency
            gradient.addColorStop(1, this.color + '00'); // Fully transparent

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, dotRadius * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Main colored circle
            ctx.fillStyle = this.color;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, dotRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    }

    private easeInOutQuad(t: number): number {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
}
