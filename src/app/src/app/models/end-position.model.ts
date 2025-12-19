import { Position } from './position.model';

/**
 * Represents an end position (goal) where a colored crate should be placed
 */
export interface EndPosition {
    /** Location of the end position on the field */
    position: Position;

    /** Color that matches the required crate color (hex color string, e.g., '#FF0000' for red) */
    color: string;
}
