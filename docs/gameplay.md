# DozerDuty - Gameplay Documentation

## Overview

DozerDuty is a puzzle game where players control a bulldozer to push crates across a grid-based field to their designated end positions. The game combines strategic thinking with careful planning to solve increasingly complex puzzles.

## Game Objective

The primary goal is to push all colored crates to their matching colored end positions. A level is completed when every colored crate is positioned on an end position of the same color.

## Game Elements

### The Bulldozer
- The player-controlled character that moves across the field
- Moves one square at a time in four directions: up, down, left, and right
- Can push crates but cannot pull them
- Cannot move through walls or crates

### Crates

#### Colored Crates
- Crates marked with a colored dot
- Must be pushed to an end position with a matching colored dot
- Multiple crates can share the same color
- When multiple crates of the same color exist, an equal number of matching end positions are available
- Any crate of a specific color can be placed on any end position of that same color

#### Neutral Crates
- Crates without colored dots
- Can be moved around the field
- Do not need to reach any specific end position
- Can be used strategically to create pathways or block certain routes
- Should not occupy colored end positions

### End Positions
- Marked locations on the field indicated by colored dots
- Each colored end position must receive a crate with a matching color
- The number of end positions for each color matches the number of crates of that color

### Walls
- Immovable obstacles that define boundaries and create challenges
- Surround the entire playing field (perimeter walls)
- Can appear within the field as internal obstacles
- Crates cannot be pushed through or into walls
- The bulldozer cannot move through walls

### The Field
- Grid-based playing area composed of squares
- Each element (bulldozer, crate, wall) occupies exactly one square
- The bulldozer moves from square to square

## Game Mechanics

### Movement Rules

1. **Basic Movement**: The bulldozer moves one square at a time in cardinal directions (up, down, left, right)

2. **Pushing Crates**: 
   - When the bulldozer moves into a square occupied by a crate, it pushes that crate
   - The crate moves one square in the same direction as the bulldozer
   - Only one crate can be pushed at a time

3. **Invalid Moves**:
   - A move is invalid if it would push a crate into a wall
   - A move is invalid if it would push a crate into another crate
   - A move is invalid if the bulldozer would move into a wall
   - A move is invalid if it would push a crate off the field

### Winning Condition

A level is won when:
- All colored crates are positioned on end positions with matching colors
- Each colored end position has a colored crate on it
- The specific pairing doesn't matter as long as colors match

### Strategic Considerations

- **Planning Ahead**: Consider the order in which crates need to be moved
- **Dead Ends**: Be careful not to push crates into corners or positions where they cannot be retrieved
- **Neutral Crates**: Use neutral crates strategically to create temporary pathways or obstacles
- **Undo Moves**: Some moves may need to be reversed if they lead to unsolvable situations
- **Color Management**: When multiple crates of the same color exist, plan which crate should go to which end position based on the field layout

## Puzzle Complexity

The game's difficulty increases through:
- Larger playing fields
- More crates to manage
- Multiple colors requiring careful coordination
- Complex wall configurations creating maze-like challenges
- Limited space requiring precise movement sequences
- Neutral crates that must be managed without blocking critical paths

## Tips for Players

1. **Survey the Field**: Before making any moves, analyze the entire field layout
2. **Identify Critical Paths**: Determine which crates need to move first to avoid blocking others
3. **Work Backwards**: Sometimes it helps to think about the final position and work backwards
4. **Test Moves**: Don't be afraid to experiment, but be prepared to restart if necessary
5. **Corner Awareness**: Avoid pushing crates into corners unless that corner is the destination
6. **Neutral Crate Strategy**: Use neutral crates to your advantage, but keep them away from colored end positions

## Game Flow

1. Level starts with all elements in their initial positions
2. Player moves the bulldozer using directional controls
3. Bulldozer pushes crates as it moves
4. Continue until all colored crates reach matching colored end positions
5. Level completes and player advances to the next challenge

## Victory and Completion

When all colored crates are correctly positioned:
- The level is marked as complete
- Player can proceed to the next level
- Optional: Statistics may be tracked (moves made, time taken, etc.)
