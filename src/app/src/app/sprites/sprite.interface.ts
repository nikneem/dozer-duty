import { Position } from '../models';

/**
 * Base interface for all game sprites
 */
export interface Sprite {
    /** Current position of the sprite */
    position: Position;

    /** Width of the sprite in pixels */
    width: number;

    /** Height of the sprite in pixels */
    height: number;

    /**
     * Renders the sprite on the canvas
     * @param ctx Canvas rendering context
     * @param cellSize Size of one grid cell in pixels
     */
    render(ctx: CanvasRenderingContext2D, cellSize: number): void;

    /**
     * Updates the sprite animation state
     * @param deltaTime Time elapsed since last update in milliseconds
     */
    update(deltaTime: number): void;
}
