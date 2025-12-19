import { Position } from './position.model';

/**
 * Represents a crate in the game
 * Crates can be colored (must reach matching end position) or neutral (no specific destination)
 */
export interface Crate {
    /** Current position of the crate on the field */
    position: Position;

    /** 
     * Color of the crate (hex color string, e.g., '#FF0000' for red)
     * When null, the crate is neutral and doesn't need a specific end position
     */
    color: string | null;
}
