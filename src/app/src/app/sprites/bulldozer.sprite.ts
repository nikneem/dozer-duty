import { Sprite } from './sprite.interface';
import { Position } from '../models';

/**
 * Direction the bulldozer is facing
 */
export enum Direction {
    Up = 0,
    Right = 90,
    Down = 180,
    Left = 270
}

/**
 * Animated cartoon bulldozer sprite with running engine animation
 */
export class BulldozerSprite implements Sprite {
    public position: Position;
    public width: number = 1;
    public height: number = 1;

    private animationTime: number = 0;
    private engineBobOffset: number = 0;
    private smokeParticles: Array<{ x: number; y: number; life: number; opacity: number }> = [];
    private smokeTimer: number = 0;
    private direction: Direction = Direction.Down;

    // Movement animation properties
    private isMoving: boolean = false;
    private moveProgress: number = 0;
    private moveStartPos: Position = { x: 0, y: 0 };
    private moveEndPos: Position = { x: 0, y: 0 };
    private moveDuration: number = 200; // milliseconds

    constructor(position: Position, direction: Direction = Direction.Down) {
        this.position = { ...position };
        this.direction = direction;
        this.moveStartPos = { ...position };
        this.moveEndPos = { ...position };
    }

    public setDirection(direction: Direction): void {
        this.direction = direction;
    }

    public getDirection(): Direction {
        return this.direction;
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

        // Engine bobbing animation (subtle vibration)
        this.engineBobOffset = Math.sin(this.animationTime * 0.01) * 1.5;

        // Generate smoke particles periodically
        this.smokeTimer += deltaTime;
        if (this.smokeTimer > 200) {
            this.addSmokeParticle();
            this.smokeTimer = 0;
        }

        // Update smoke particles
        this.smokeParticles = this.smokeParticles
            .map(particle => ({
                ...particle,
                y: particle.y - 0.5,
                life: particle.life - deltaTime,
                opacity: Math.max(0, particle.opacity - deltaTime * 0.001)
            }))
            .filter(particle => particle.life > 0);
    }

    public render(ctx: CanvasRenderingContext2D, cellSize: number): void {
        const x = this.position.x * cellSize;
        const y = this.position.y * cellSize;
        const centerX = x + cellSize / 2;
        const centerY = y + cellSize / 2;

        ctx.save();

        // Apply rotation based on direction
        ctx.translate(centerX, centerY);
        ctx.rotate((this.direction * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);

        // Apply engine bobbing effect
        ctx.translate(0, this.engineBobOffset);

        // Render smoke particles first (behind bulldozer)
        this.renderSmoke(ctx, x, y, cellSize);

        // Draw bulldozer body
        this.drawBody(ctx, x, y, cellSize);

        // Draw tracks/treads
        this.drawTracks(ctx, x, y, cellSize);

        // Draw blade
        this.drawBlade(ctx, x, y, cellSize);

        // Draw cabin
        this.drawCabin(ctx, x, y, cellSize);

        // Draw exhaust pipe
        this.drawExhaust(ctx, x, y, cellSize);

        // Draw details
        this.drawDetails(ctx, x, y, cellSize);

        ctx.restore();
    }

    private drawBody(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number): void {
        const bodyWidth = cellSize * 0.7;
        const bodyHeight = cellSize * 0.5;
        const bodyX = x + (cellSize - bodyWidth) / 2;
        const bodyY = y + cellSize * 0.3;

        // Main body
        ctx.fillStyle = '#FFD700'; // Golden yellow
        ctx.strokeStyle = '#DAA520'; // Darker gold outline
        ctx.lineWidth = 2;

        this.roundRect(ctx, bodyX, bodyY, bodyWidth, bodyHeight, 4);
        ctx.fill();
        ctx.stroke();
    }

    private drawTracks(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number): void {
        const trackWidth = cellSize * 0.15;
        const trackHeight = cellSize * 0.6;

        // Left track
        ctx.fillStyle = '#333333';
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;

        const leftTrackX = x + cellSize * 0.15;
        const trackY = y + cellSize * 0.25;

        this.roundRect(ctx, leftTrackX, trackY, trackWidth, trackHeight, 3);
        ctx.fill();
        ctx.stroke();

        // Right track
        const rightTrackX = x + cellSize * 0.7;
        this.roundRect(ctx, rightTrackX, trackY, trackWidth, trackHeight, 3);
        ctx.fill();
        ctx.stroke();

        // Track details (animated treads)
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 2;
        const treadOffset = (this.animationTime * 0.05) % 8;

        for (let i = 0; i < trackHeight; i += 8) {
            const offsetI = (i + treadOffset) % trackHeight;
            // Left track treads
            ctx.beginPath();
            ctx.moveTo(leftTrackX + 2, trackY + offsetI);
            ctx.lineTo(leftTrackX + trackWidth - 2, trackY + offsetI);
            ctx.stroke();

            // Right track treads
            ctx.beginPath();
            ctx.moveTo(rightTrackX + 2, trackY + offsetI);
            ctx.lineTo(rightTrackX + trackWidth - 2, trackY + offsetI);
            ctx.stroke();
        }
    }

    private drawBlade(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number): void {
        const bladeWidth = cellSize * 0.8;
        const bladeHeight = cellSize * 0.15;
        const bladeX = x + (cellSize - bladeWidth) / 2;
        const bladeY = y + cellSize * 0.08;

        // Blade
        ctx.fillStyle = '#C0C0C0'; // Silver
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 2;

        this.roundRect(ctx, bladeX, bladeY, bladeWidth, bladeHeight, 2);
        ctx.fill();
        ctx.stroke();

        // Blade support arms
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bladeX + bladeWidth * 0.2, bladeY + bladeHeight);
        ctx.lineTo(x + cellSize * 0.25, y + cellSize * 0.3);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bladeX + bladeWidth * 0.8, bladeY + bladeHeight);
        ctx.lineTo(x + cellSize * 0.75, y + cellSize * 0.3);
        ctx.stroke();
    }

    private drawCabin(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number): void {
        const cabinWidth = cellSize * 0.45;
        const cabinHeight = cellSize * 0.35;
        const cabinX = x + (cellSize - cabinWidth) / 2;
        const cabinY = y + cellSize * 0.35;

        // Cabin
        ctx.fillStyle = '#FFA500'; // Orange
        ctx.strokeStyle = '#FF8C00'; // Darker orange
        ctx.lineWidth = 2;

        this.roundRect(ctx, cabinX, cabinY, cabinWidth, cabinHeight, 3);
        ctx.fill();
        ctx.stroke();

        // Windows
        const windowWidth = cabinWidth * 0.35;
        const windowHeight = cabinHeight * 0.4;
        const windowX = cabinX + (cabinWidth - windowWidth) / 2;
        const windowY = cabinY + cabinHeight * 0.15;

        ctx.fillStyle = '#87CEEB'; // Sky blue
        ctx.strokeStyle = '#4682B4';
        ctx.lineWidth = 1;

        this.roundRect(ctx, windowX, windowY, windowWidth, windowHeight, 2);
        ctx.fill();
        ctx.stroke();
    }

    private drawExhaust(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number): void {
        const exhaustX = x + cellSize * 0.75;
        const exhaustY = y + cellSize * 0.4;
        const exhaustWidth = cellSize * 0.08;
        const exhaustHeight = cellSize * 0.25;

        // Exhaust pipe
        ctx.fillStyle = '#4a4a4a';
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;

        ctx.fillRect(exhaustX, exhaustY, exhaustWidth, exhaustHeight);
        ctx.strokeRect(exhaustX, exhaustY, exhaustWidth, exhaustHeight);

        // Exhaust top cap
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.ellipse(
            exhaustX + exhaustWidth / 2,
            exhaustY,
            exhaustWidth * 0.7,
            exhaustWidth * 0.4,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
    }

    private drawDetails(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number): void {
        // Add some rivets/bolts
        ctx.fillStyle = '#8B4513'; // Brown
        const rivetSize = 2;

        // Body rivets
        const rivets = [
            { x: x + cellSize * 0.25, y: y + cellSize * 0.35 },
            { x: x + cellSize * 0.75, y: y + cellSize * 0.35 },
            { x: x + cellSize * 0.25, y: y + cellSize * 0.75 },
            { x: x + cellSize * 0.75, y: y + cellSize * 0.75 }
        ];

        rivets.forEach(rivet => {
            ctx.beginPath();
            ctx.arc(rivet.x, rivet.y, rivetSize, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    private renderSmoke(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number): void {
        this.smokeParticles.forEach(particle => {
            ctx.fillStyle = `rgba(120, 120, 120, ${particle.opacity})`;
            ctx.beginPath();
            ctx.arc(
                x + cellSize * 0.79 + particle.x,
                y + cellSize * 0.4 + particle.y,
                3 + (1 - particle.opacity) * 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        });
    }

    private addSmokeParticle(): void {
        this.smokeParticles.push({
            x: Math.random() * 4 - 2,
            y: 0,
            life: 1000,
            opacity: 0.6
        });
    }

    private easeInOutQuad(t: number): number {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    private roundRect(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
    ): void {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}
