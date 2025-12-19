import { Component, OnInit, ElementRef, ViewChild, signal, inject, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Level, Position } from '../../../models';
import { BulldozerSprite, CrateSprite, Direction, LevelCompleteSprite } from '../../../sprites';

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
    private currentLevelNumber = 1;
    private cellSize = 60;
    private bulldozerSprite?: BulldozerSprite;
    private crateSprites: CrateSprite[] = [];
    private levelCompleteSprite?: LevelCompleteSprite;
    private animationFrameId?: number;
    private lastFrameTime = 0;
    private isLevelComplete = false;
    private moveCount = 0;

    // Undo functionality
    private lastMove?: {
        bulldozerPos: Position;
        bulldozerDirection: Direction;
        cratePos?: Position;
        crateIndex?: number;
    };

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

        // Load next level when N is pressed (only if level is complete)
        if ((event.key === 'n' || event.key === 'N') && this.isLevelComplete) {
            event.preventDefault();
            this.loadNextLevel();
        }

        // Undo last move when Ctrl+Z is pressed
        if (event.ctrlKey && event.key === 'z') {
            event.preventDefault();
            this.undoLastMove();
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

        // Load saved level from localStorage or start at level 1
        const savedLevel = localStorage.getItem('dozer-duty-current-level');
        if (savedLevel) {
            this.currentLevelNumber = parseInt(savedLevel, 10);
        }

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

    private loadLevel(levelNumber?: number): void {
        if (levelNumber !== undefined) {
            this.currentLevelNumber = levelNumber;
        }

        // Save current level to localStorage
        localStorage.setItem('dozer-duty-current-level', this.currentLevelNumber.toString());

        this.http.get<Level>(`/levels/level-${this.currentLevelNumber}.json`).subscribe({
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
        this.levelCompleteSprite = undefined;
        this.moveCount = 0;

        // Adjust cell size based on level dimensions
        const maxDimension = Math.max(this.level.width, this.level.height);
        if (maxDimension <= 8) {
            this.cellSize = 120; // Double size for small levels
        } else if (maxDimension >= 17) {
            this.cellSize = 30; // Half size for large levels
        } else {
            this.cellSize = 60; // Normal size for medium levels
        }

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

    private loadNextLevel(): void {
        // Load the next level
        this.loadLevel(this.currentLevelNumber + 1);
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

        if (this.levelCompleteSprite) {
            this.levelCompleteSprite.update(deltaTime);
        }
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

        // Draw level complete overlay
        if (this.levelCompleteSprite) {
            this.levelCompleteSprite.render(this.ctx, this.cellSize);
        }

        // Draw move counter at the top
        this.drawMoveCounter();
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

        // Disable movement during level complete state
        if (this.isLevelComplete) return;

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
            this.bulldozerSprite.startPushAttempt(deltaX, deltaY);
            return;
        }

        // Check if target position is a wall
        if (this.isWall(targetPos)) {
            this.bulldozerSprite.startPushAttempt(deltaX, deltaY);
            return;
        }

        // Save current state before move
        const previousBulldozerPos = { ...currentPos };
        const previousBulldozerDirection = this.bulldozerSprite.getDirection();

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
                this.bulldozerSprite.startPushAttempt(deltaX, deltaY);
                return; // Crate would go out of bounds
            }

            if (this.isWall(crateTargetPos)) {
                this.bulldozerSprite.startPushAttempt(deltaX, deltaY);
                return; // Crate would hit a wall
            }

            // Check if another crate is at crate's target position
            const anotherCrate = this.crateSprites.find(crate =>
                crate !== crateAtTarget &&
                Math.round(crate.position.x) === crateTargetPos.x &&
                Math.round(crate.position.y) === crateTargetPos.y
            );

            if (anotherCrate) {
                this.bulldozerSprite.startPushAttempt(deltaX, deltaY);
                return; // Crate would hit another crate
            }

            // Save crate state before move
            const crateIndex = this.crateSprites.indexOf(crateAtTarget);
            const previousCratePos = {
                x: Math.round(crateAtTarget.position.x),
                y: Math.round(crateAtTarget.position.y)
            };

            // Move is valid - push the crate
            crateAtTarget.startMoveTo(crateTargetPos);

            // Save last move with crate
            this.lastMove = {
                bulldozerPos: previousBulldozerPos,
                bulldozerDirection: previousBulldozerDirection,
                cratePos: previousCratePos,
                crateIndex: crateIndex
            };
        } else {
            // Save last move without crate
            this.lastMove = {
                bulldozerPos: previousBulldozerPos,
                bulldozerDirection: previousBulldozerDirection
            };
        }

        // Move bulldozer
        this.bulldozerSprite.startMoveTo(targetPos);

        // Increment move counter
        this.moveCount++;

        // Check for level completion after animations finish
        setTimeout(() => this.checkLevelCompletion(), 250);
    }

    private undoLastMove(): void {
        if (!this.lastMove || !this.bulldozerSprite) return;

        // Check if any animations are running
        if (this.bulldozerSprite.isAnimating()) return;
        if (this.crateSprites.some(crate => crate.isAnimating())) return;

        // Restore bulldozer position and direction
        this.bulldozerSprite.position = { ...this.lastMove.bulldozerPos };
        this.bulldozerSprite.setDirection(this.lastMove.bulldozerDirection);

        // Restore crate position if a crate was moved
        if (this.lastMove.cratePos !== undefined && this.lastMove.crateIndex !== undefined) {
            const crate = this.crateSprites[this.lastMove.crateIndex];
            if (crate) {
                crate.position = { ...this.lastMove.cratePos };
            }
        }

        // Clear the last move so it can't be undone again
        this.lastMove = undefined;

        // Decrement move counter
        if (this.moveCount > 0) {
            this.moveCount--;
        }
    }

    private drawMoveCounter(): void {
        // Draw semi-transparent background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 150, 50);

        // Draw border
        this.ctx.strokeStyle = '#ecf0f1';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(10, 10, 150, 50);

        // Draw text
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`Moves: ${this.moveCount}`, 25, 35);
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

        // Create and show level complete sprite
        this.levelCompleteSprite = new LevelCompleteSprite(
            this.canvasWidth(),
            this.canvasHeight()
        );
    }
}
