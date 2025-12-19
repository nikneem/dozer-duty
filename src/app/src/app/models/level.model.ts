import { Position } from './position.model';
import { Crate } from './crate.model';
import { EndPosition } from './end-position.model';

/**
 * Represents a game level with all its components
 */
export interface Level {
    /** Level number/identifier */
    number: number;

    /** Width of the playing field (1-32) */
    width: number;

    /** Height of the playing field (1-32) */
    height: number;

    /** Positions of walls on the field */
    walls: Position[];

    /** All crates in the level (both colored and neutral) */
    crates: Crate[];

    /** Starting position of the bulldozer/player */
    playerStartPosition: Position;

    /** 
     * End positions where colored crates must be placed
     * The number of end positions must equal the number of colored crates
     */
    endPositions: EndPosition[];
}

/**
 * Validates that a level configuration is correct
 * @param level The level to validate
 * @returns true if valid, throws an error if invalid
 */
export function validateLevel(level: Level): boolean {
    // Check field size constraints
    if (level.width < 1 || level.width > 32) {
        throw new Error(`Invalid level width: ${level.width}. Must be between 1 and 32.`);
    }

    if (level.height < 1 || level.height > 32) {
        throw new Error(`Invalid level height: ${level.height}. Must be between 1 and 32.`);
    }

    // Count colored crates
    const coloredCrates = level.crates.filter(crate => crate.color !== null);

    // Validate that number of end positions equals number of colored crates
    if (level.endPositions.length !== coloredCrates.length) {
        throw new Error(
            `Invalid level ${level.number}: Number of end positions (${level.endPositions.length}) ` +
            `must equal number of colored crates (${coloredCrates.length}).`
        );
    }

    // Validate that each end position color has a matching crate color
    const crateColors = coloredCrates.map(c => c.color).sort();
    const endPositionColors = level.endPositions.map(e => e.color).sort();

    if (JSON.stringify(crateColors) !== JSON.stringify(endPositionColors)) {
        throw new Error(
            `Invalid level ${level.number}: End position colors must match crate colors. ` +
            `Crate colors: [${crateColors.join(', ')}], End position colors: [${endPositionColors.join(', ')}]`
        );
    }

    // Validate that positions are within bounds
    const validatePosition = (pos: Position, name: string) => {
        if (pos.x < 0 || pos.x >= level.width || pos.y < 0 || pos.y >= level.height) {
            throw new Error(
                `Invalid ${name} position (${pos.x}, ${pos.y}) in level ${level.number}. ` +
                `Must be within field bounds (0-${level.width - 1}, 0-${level.height - 1}).`
            );
        }
    };

    validatePosition(level.playerStartPosition, 'player start');
    level.walls.forEach((wall, i) => validatePosition(wall, `wall ${i}`));
    level.crates.forEach((crate, i) => validatePosition(crate.position, `crate ${i}`));
    level.endPositions.forEach((end, i) => validatePosition(end.position, `end position ${i}`));

    return true;
}
