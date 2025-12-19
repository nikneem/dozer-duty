import { Component, OnInit, ElementRef, ViewChild, signal, inject, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Level, Position } from '../../../models';
import { BulldozerSprite, CrateSprite, Direction } from '../../../sprites';

@Component({
    selector: 'dd-level',
    imports: [],
    templateUrl: './level.component.html',
    styleUrl: './level.component.scss'
})
export class LevelComponent implements OnInit {
    @ViewChild('levelCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

    private http = inject(HttpClient);
    private ctx!: CanvasRenderingContext2D;
    private level?: Level;
    private cellSize = 60;
    private bulldozerSprite?: BulldozerSprite;
    private crateSprites: CrateSprite[] = [];
    private animationFrameId?: number;
    private lastFrameTime = 0;
    private isLevelComplete = false;

    // Texture images
    private wallImage?: HTMLImageElement;
    private wallImageLoaded = false;
    private floorImage?: HTMLImageElement;
    private floorImageLoaded = false;

    protected readonly canvasWidth = signal(800);
    protected readonly canvasHeight = signal(600);

    @HostListener('window:keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent): void {
        // Prevent default scrolling behavior for arrow keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
            this.handleMovement(event.key);
        }

        // Reload level when R is pressed
        if (event.key === 'r' || event.key === 'R') {
            event.preventDefault();
            this.reloadLevel();
        }
    }

    ngOnInit(): void {
        const canvas = this.canvasRef.nativeElement;
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Failed to get 2D context from canvas');
        }

        this.ctx = context;
        this.loadTextures();
        this.loadLevel();
    }

    ngOnDestroy(): void {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    private loadTextures(): void {
        // Load wall texture
        this.wallImage = new Image();
        this.wallImage.onload = () => {
            this.wallImageLoaded = true;
        };
        this.wallImage.src = '/textures/wall.png';

        // Load floor texture
        this.floorImage = new Image();
        this.floorImage.onload = () => {
            this.floorImageLoaded = true;
        };
        this.floorImage.src = '/textures/floor.png';
    }

    private loadLevel(): void {
        this.http.get<Level>('/levels/level-1.json').subscribe({
            next: (level) => {
                this.level = level;
                this.initializeLevel();

                // Only start game loop if not already running
                if (!this.animationFrameId) {
                    this.startGameLoop();
                }
            },
            error: (error) => {
                console.error('Failed to load level:', error);
            }
        });
    }

    private initializeLevel(): void {
        if (!this.level) return;

        // Reset level state
        this.isLevelComplete = false;

        // Adjust canvas size based on level dimensions
        const width = this.level.width * this.cellSize;
        const height = this.level.height * this.cellSize;
        this.canvasWidth.set(width);
        this.canvasHeight.set(height);

        // Initialize bulldozer sprite
        this.bulldozerSprite = new BulldozerSprite(
            this.level.playerStartPosition,
            Direction.Down
        );

        // Initialize crate sprites
        this.crateSprites = this.level.crates.map(crate =>
            new CrateSprite(crate.position, crate.color)
        );
    }

    private reloadLevel(): void {
        // Reset the level to initial state from JSON
        this.loadLevel();
    }

    private startGameLoop(): void {
        const gameLoop = (timestamp: number) => {
            const deltaTime = timestamp - this.lastFrameTime;
            this.lastFrameTime = timestamp;

            this.update(deltaTime);
            this.render();

            this.animationFrameId = requestAnimationFrame(gameLoop);
        };

        this.animationFrameId = requestAnimationFrame(gameLoop);
    }

    private update(deltaTime: number): void {
        if (this.bulldozerSprite) {
            this.bulldozerSprite.update(deltaTime);
        }

        this.crateSprites.forEach(crate => crate.update(deltaTime));
    }

    private render(): void {
        if (!this.level) return;

        // Clear canvas
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvasWidth(), this.canvasHeight());

        // Draw grid (gray squares for each position)
        this.drawGrid();

        // Draw end positions
        this.drawEndPositions();

        // Draw walls
        this.drawWalls();

        // Draw crates
        this.crateSprites.forEach(crate => crate.render(this.ctx, this.cellSize));

        // Draw bulldozer
        if (this.bulldozerSprite) {
            this.bulldozerSprite.render(this.ctx, this.cellSize);
        }
    }

    private drawGrid(): void {
        if (!this.level) return;

        for (let y = 0; y < this.level.height; y++) {
            for (let x = 0; x < this.level.width; x++) {
                const posX = x * this.cellSize;
                const posY = y * this.cellSize;

                // Only draw if not a wall
                if (!this.isWall({ x, y })) {
                    if (this.floorImageLoaded && this.floorImage) {
                        // Draw floor texture
                        this.ctx.drawImage(
                            this.floorImage,
                            posX,
                            posY,
                            this.cellSize,
                            this.cellSize
                        );
                    } else {
                        // Fallback: Draw gray square
                        this.ctx.fillStyle = '#95a5a6';
                        this.ctx.strokeStyle = '#7f8c8d';
                        this.ctx.lineWidth = 1;
                        this.ctx.fillRect(posX, posY, this.cellSize, this.cellSize);
                        this.ctx.strokeRect(posX, posY, this.cellSize, this.cellSize);
                    }
                }
            }
        }
    }

    private drawWalls(): void {
        if (!this.level) return;

        this.level.walls.forEach(wall => {
            const x = wall.x * this.cellSize;
            const y = wall.y * this.cellSize;

            // Draw wall texture if loaded, otherwise draw fallback
            if (this.wallImageLoaded && this.wallImage) {
                this.ctx.drawImage(
                    this.wallImage,
                    x,
                    y,
                    this.cellSize,
                    this.cellSize
                );
            } else {
                // Fallback: Draw stone texture
                this.ctx.fillStyle = '#7f5539';
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);

                // Draw stone red outline
                this.ctx.strokeStyle = '#c0392b';
                this.ctx.lineWidth = 4;
                this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
            }
        });
    }

    private drawEndPositions(): void {
        if (!this.level) return;

        this.level.endPositions.forEach(endPos => {
            const x = endPos.position.x * this.cellSize;
            const y = endPos.position.y * this.cellSize;
            const centerX = x + this.cellSize / 2;
            const centerY = y + this.cellSize / 2;
            const radius = this.cellSize * 0.3;

            // Draw target circle with color
            this.ctx.strokeStyle = endPos.color;
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.stroke();

            // Draw inner circle
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
            this.ctx.stroke();

            // Draw crosshair
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - radius * 0.4, centerY);
            this.ctx.lineTo(centerX + radius * 0.4, centerY);
            this.ctx.moveTo(centerX, centerY - radius * 0.4);
            this.ctx.lineTo(centerX, centerY + radius * 0.4);
            this.ctx.stroke();
        });
    }

    private isWall(position: Position): boolean {
        return this.level?.walls.some(wall =>
            wall.x === position.x && wall.y === position.y
        ) ?? false;
    }

    private handleMovement(key: string): void {
        if (!this.bulldozerSprite || !this.level) return;

        // Check if bulldozer is still animating
        if (this.bulldozerSprite.isAnimating()) return;

        // Check if any crate is still animating
        if (this.crateSprites.some(crate => crate.isAnimating())) return;

        let direction: Direction;
        let deltaX = 0;
        let deltaY = 0;

        switch (key) {
            case 'ArrowUp':
                direction = Direction.Up;
                deltaY = -1;
                break;
            case 'ArrowDown':
                direction = Direction.Down;
                deltaY = 1;
                break;
            case 'ArrowLeft':
                direction = Direction.Left;
                deltaX = -1;
                break;
            case 'ArrowRight':
                direction = Direction.Right;
                deltaX = 1;
                break;
            default:
                return;
        }

        // Update bulldozer direction
        this.bulldozerSprite.setDirection(direction);

        // Calculate target position for bulldozer
        const currentPos = {
            x: Math.round(this.bulldozerSprite.position.x),
            y: Math.round(this.bulldozerSprite.position.y)
        };
        const targetPos: Position = {
            x: currentPos.x + deltaX,
            y: currentPos.y + deltaY
        };

        // Check if target position is within bounds
        if (targetPos.x < 0 || targetPos.x >= this.level.width ||
            targetPos.y < 0 || targetPos.y >= this.level.height) {
            return;
        }

        // Check if target position is a wall
        if (this.isWall(targetPos)) {
            return;
        }

        // Check if there's a crate at target position
        const crateAtTarget = this.crateSprites.find(crate =>
            Math.round(crate.position.x) === targetPos.x &&
            Math.round(crate.position.y) === targetPos.y
        );

        if (crateAtTarget) {
            // Calculate crate's target position
            const crateTargetPos: Position = {
                x: targetPos.x + deltaX,
                y: targetPos.y + deltaY
            };

            // Check if crate's target position is valid
            if (crateTargetPos.x < 0 || crateTargetPos.x >= this.level.width ||
                crateTargetPos.y < 0 || crateTargetPos.y >= this.level.height) {
                return; // Crate would go out of bounds
            }

            if (this.isWall(crateTargetPos)) {
                return; // Crate would hit a wall
            }

            // Check if another crate is at crate's target position
            const anotherCrate = this.crateSprites.find(crate =>
                crate !== crateAtTarget &&
                Math.round(crate.position.x) === crateTargetPos.x &&
                Math.round(crate.position.y) === crateTargetPos.y
            );

            if (anotherCrate) {
                return; // Crate would hit another crate
            }

            // Move is valid - push the crate
            crateAtTarget.startMoveTo(crateTargetPos);
        }

        // Move bulldozer
        this.bulldozerSprite.startMoveTo(targetPos);

        // Check for level completion after animations finish
        setTimeout(() => this.checkLevelCompletion(), 250);
    }

    private checkLevelCompletion(): void {
        if (!this.level || this.isLevelComplete) return;

        // Check if every end position has a crate with matching color
        const allEndPositionsFilled = this.level.endPositions.every(endPos => {
            // Find if there's a crate sprite at this end position
            const crateAtPosition = this.crateSprites.find(sprite =>
                Math.round(sprite.position.x) === endPos.position.x &&
                Math.round(sprite.position.y) === endPos.position.y
            );

            if (!crateAtPosition) return false;

            // Check if the crate color matches the end position color
            return crateAtPosition.getColor() === endPos.color;
        });

        if (allEndPositionsFilled) {
            this.isLevelComplete = true;
            this.onLevelComplete();
        }
    }

    private onLevelComplete(): void {
        console.log('Level Complete!');

        // Draw completion message on canvas
        this.ctx.save();

        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvasWidth(), this.canvasHeight());

        // Completion text
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            'Level Complete!',
            this.canvasWidth() / 2,
            this.canvasHeight() / 2
        );

        // Instruction text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(
            'Press R to restart',
            this.canvasWidth() / 2,
            this.canvasHeight() / 2 + 50
        );

        this.ctx.restore();
    }
}
