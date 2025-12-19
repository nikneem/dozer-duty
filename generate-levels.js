const fs = require('fs');
const path = require('path');

// Color palette
const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'];

// Helper to create perimeter walls
function createPerimeterWalls(width, height) {
    const walls = [];
    for (let x = 0; x < width; x++) {
        walls.push({ x, y: 0 });
        walls.push({ x, y: height - 1 });
    }
    for (let y = 1; y < height - 1; y++) {
        walls.push({ x: 0, y });
        walls.push({ x: width - 1, y });
    }
    return walls;
}

// Helper to check if position is occupied
function isOccupied(x, y, walls, crates, player, endPos) {
    if (walls.some(w => w.x === x && w.y === y)) return true;
    if (crates.some(c => c.position.x === x && c.position.y === y)) return true;
    if (player.x === x && player.y === y) return true;
    if (endPos.some(e => e.position.x === x && e.position.y === y)) return true;
    return false;
}

const levelsDir = path.join(__dirname, 'src', 'app', 'public', 'levels');

// Generate levels 2-99
for (let levelNum = 2; levelNum <= 99; levelNum++) {
    let width, height, numCrates, numColors, hasObstacles;

    // Progressive difficulty
    if (levelNum <= 10) {
        // Easy: small levels, 1-2 crates, 1-2 colors
        width = 6 + Math.floor(levelNum / 3);
        height = 6 + Math.floor(levelNum / 3);
        numCrates = 1 + Math.floor(levelNum / 6);
        numColors = 1 + Math.floor(levelNum / 6);
        hasObstacles = levelNum > 5;
    } else if (levelNum <= 30) {
        // Medium: growing complexity
        width = 8 + Math.floor((levelNum - 10) / 3);
        height = 8 + Math.floor((levelNum - 10) / 3);
        numCrates = 2 + Math.floor((levelNum - 10) / 5);
        numColors = 2 + Math.floor((levelNum - 10) / 8);
        hasObstacles = true;
    } else if (levelNum <= 60) {
        // Hard: larger levels, more crates
        width = 12 + Math.floor((levelNum - 30) / 5);
        height = 12 + Math.floor((levelNum - 30) / 5);
        numCrates = 4 + Math.floor((levelNum - 30) / 6);
        numColors = 3 + Math.floor((levelNum - 30) / 10);
        hasObstacles = true;
    } else if (levelNum <= 80) {
        // Very hard: mix of small dense and large sparse
        if (levelNum % 3 === 0) {
            // Small but very hard
            width = 7 + Math.floor(Math.random() * 3);
            height = 7 + Math.floor(Math.random() * 3);
            numCrates = 4 + Math.floor(Math.random() * 3);
        } else {
            width = 14 + Math.floor((levelNum - 60) / 4);
            height = 14 + Math.floor((levelNum - 60) / 4);
            numCrates = 5 + Math.floor((levelNum - 60) / 5);
        }
        numColors = 4 + Math.floor((levelNum - 60) / 8);
        hasObstacles = true;
    } else {
        // Expert: 80-99
        if (levelNum % 2 === 0) {
            // Compact challenges
            width = 8 + Math.floor(Math.random() * 4);
            height = 8 + Math.floor(Math.random() * 4);
            numCrates = 5 + Math.floor(Math.random() * 4);
        } else {
            width = 16 + Math.floor((levelNum - 80) / 3);
            height = 16 + Math.floor((levelNum - 80) / 3);
            numCrates = 6 + Math.floor((levelNum - 80) / 4);
        }
        numColors = Math.min(5 + Math.floor((levelNum - 80) / 5), 8);
        hasObstacles = true;
    }

    // Ensure minimum playable area
    width = Math.max(6, Math.min(width, 24));
    height = Math.max(6, Math.min(height, 24));
    numCrates = Math.min(numCrates, Math.floor((width - 2) * (height - 2) / 8));
    numColors = Math.min(numColors, numCrates, 8);

    const walls = createPerimeterWalls(width, height);

    // Add interior obstacles
    if (hasObstacles) {
        const numObstacles = Math.floor((levelNum / 15)) + Math.floor(Math.random() * 3);
        for (let i = 0; i < numObstacles; i++) {
            const obsType = Math.floor(Math.random() * 3);
            const cx = 2 + Math.floor(Math.random() * (width - 4));
            const cy = 2 + Math.floor(Math.random() * (height - 4));

            if (obsType === 0) {
                // Vertical wall
                for (let dy = 0; dy < 2 + Math.floor(Math.random() * 3); dy++) {
                    if (cy + dy < height - 1) walls.push({ x: cx, y: cy + dy });
                }
            } else if (obsType === 1) {
                // Horizontal wall
                for (let dx = 0; dx < 2 + Math.floor(Math.random() * 3); dx++) {
                    if (cx + dx < width - 1) walls.push({ x: cx + dx, y: cy });
                }
            } else {
                // Single block
                walls.push({ x: cx, y: cy });
            }
        }
    }

    // Place player
    let playerX, playerY;
    do {
        playerX = 1 + Math.floor(Math.random() * (width - 2));
        playerY = 1 + Math.floor(Math.random() * (height - 2));
    } while (isOccupied(playerX, playerY, walls, [], { x: -1, y: -1 }, []));

    const playerStart = { x: playerX, y: playerY };

    // Decide if this level has same-color crates
    const sameColor = levelNum % 7 === 0 && numCrates >= 3;

    // Place crates
    const crates = [];
    const crateColors = [];

    if (sameColor) {
        // All crates same color
        const color = colors[Math.floor(Math.random() * Math.min(numColors, colors.length))];
        for (let i = 0; i < numCrates; i++) {
            crateColors.push(color);
        }
    } else {
        // Mix of colored and neutral
        const numNeutral = Math.floor(numCrates * 0.2);
        for (let i = 0; i < numCrates - numNeutral; i++) {
            crateColors.push(colors[i % numColors]);
        }
        for (let i = 0; i < numNeutral; i++) {
            crateColors.push(null);
        }
    }

    // Shuffle crate colors
    for (let i = crateColors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [crateColors[i], crateColors[j]] = [crateColors[j], crateColors[i]];
    }

    for (let i = 0; i < numCrates; i++) {
        let cx, cy;
        do {
            cx = 1 + Math.floor(Math.random() * (width - 2));
            cy = 1 + Math.floor(Math.random() * (height - 2));
        } while (isOccupied(cx, cy, walls, crates, playerStart, []));

        crates.push({
            position: { x: cx, y: cy },
            color: crateColors[i]
        });
    }

    // Place end positions (only for colored crates)
    const endPositions = [];
    const coloredCrates = crateColors.filter(c => c !== null);
    const uniqueColors = [...new Set(coloredCrates)];

    for (const color of uniqueColors) {
        let ex, ey;
        do {
            ex = 1 + Math.floor(Math.random() * (width - 2));
            ey = 1 + Math.floor(Math.random() * (height - 2));
        } while (isOccupied(ex, ey, walls, crates, playerStart, endPositions));

        endPositions.push({
            position: { x: ex, y: ey },
            color: color
        });
    }

    const level = {
        number: levelNum,
        width,
        height,
        walls,
        crates,
        playerStartPosition: playerStart,
        endPositions
    };

    const filePath = path.join(levelsDir, `level-${levelNum}.json`);
    fs.writeFileSync(filePath, JSON.stringify(level, null, 2));
    console.log(`Generated level ${levelNum}: ${width}x${height}, ${numCrates} crates, ${uniqueColors.length} colors`);
}

console.log('Generated levels 2-99');
