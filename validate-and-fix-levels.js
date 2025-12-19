const fs = require('fs');
const path = require('path');

const levelsDir = path.join(__dirname, 'src', 'app', 'public', 'levels');

function isWall(x, y, walls) {
    return walls.some(w => w.x === x && w.y === y);
}

function isCrateStuck(cratePos, walls, width, height) {
    const x = cratePos.x;
    const y = cratePos.y;

    // Check if crate is in a corner or against two perpendicular walls
    const hasWallLeft = x === 0 || isWall(x - 1, y, walls);
    const hasWallRight = x === width - 1 || isWall(x + 1, y, walls);
    const hasWallUp = y === 0 || isWall(x, y - 1, walls);
    const hasWallDown = y === height - 1 || isWall(x, y + 1, walls);

    // If blocked on two perpendicular sides, it's stuck
    if ((hasWallLeft || hasWallRight) && (hasWallUp || hasWallDown)) {
        // Check if it's actually in a corner/deadlock
        if ((hasWallLeft && hasWallUp) || (hasWallLeft && hasWallDown) ||
            (hasWallRight && hasWallUp) || (hasWallRight && hasWallDown)) {
            return true;
        }
    }

    return false;
}

function findSafePosition(width, height, walls, occupiedPositions, minDistFromWall = 2) {
    const maxAttempts = 100;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const x = minDistFromWall + Math.floor(Math.random() * (width - 2 * minDistFromWall));
        const y = minDistFromWall + Math.floor(Math.random() * (height - 2 * minDistFromWall));

        // Check if position is occupied
        if (isWall(x, y, walls)) continue;
        if (occupiedPositions.some(p => p.x === x && p.y === y)) continue;

        // Check if it's not stuck
        if (isCrateStuck({ x, y }, walls, width, height)) continue;

        return { x, y };
    }

    // Fallback: find any non-wall, non-occupied position
    for (let y = 2; y < height - 2; y++) {
        for (let x = 2; x < width - 2; x++) {
            if (!isWall(x, y, walls) &&
                !occupiedPositions.some(p => p.x === x && p.y === y) &&
                !isCrateStuck({ x, y }, walls, width, height)) {
                return { x, y };
            }
        }
    }

    return null;
}

let fixedCount = 0;
let errorCount = 0;

for (let levelNum = 1; levelNum <= 100; levelNum++) {
    const filePath = path.join(levelsDir, `level-${levelNum}.json`);

    if (!fs.existsSync(filePath)) {
        continue;
    }

    const level = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = false;

    // Check each crate
    for (let i = 0; i < level.crates.length; i++) {
        const crate = level.crates[i];

        if (isCrateStuck(crate.position, level.walls, level.width, level.height)) {
            console.log(`Level ${levelNum}: Crate ${i} at (${crate.position.x}, ${crate.position.y}) is stuck!`);

            // Find a safe position
            const occupiedPositions = [
                level.playerStartPosition,
                ...level.crates.map(c => c.position),
                ...level.endPositions.map(e => e.position)
            ];

            const newPos = findSafePosition(level.width, level.height, level.walls, occupiedPositions);

            if (newPos) {
                console.log(`  -> Moved to (${newPos.x}, ${newPos.y})`);
                crate.position = newPos;
                modified = true;
                fixedCount++;
            } else {
                console.log(`  -> ERROR: Could not find safe position!`);
                errorCount++;
            }
        }
    }

    // Check if player is on a wall
    if (isWall(level.playerStartPosition.x, level.playerStartPosition.y, level.walls)) {
        console.log(`Level ${levelNum}: Player starts on a wall!`);
        const occupiedPositions = [
            ...level.crates.map(c => c.position),
            ...level.endPositions.map(e => e.position)
        ];
        const newPos = findSafePosition(level.width, level.height, level.walls, occupiedPositions, 1);
        if (newPos) {
            level.playerStartPosition = newPos;
            console.log(`  -> Moved player to (${newPos.x}, ${newPos.y})`);
            modified = true;
            fixedCount++;
        }
    }

    // Check if end positions are on walls
    for (let i = 0; i < level.endPositions.length; i++) {
        const endPos = level.endPositions[i];
        if (isWall(endPos.position.x, endPos.position.y, level.walls)) {
            console.log(`Level ${levelNum}: End position ${i} is on a wall!`);
            const occupiedPositions = [
                level.playerStartPosition,
                ...level.crates.map(c => c.position),
                ...level.endPositions.map(e => e.position)
            ];
            const newPos = findSafePosition(level.width, level.height, level.walls, occupiedPositions);
            if (newPos) {
                endPos.position = newPos;
                console.log(`  -> Moved to (${newPos.x}, ${newPos.y})`);
                modified = true;
                fixedCount++;
            }
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, JSON.stringify(level, null, 2));
        console.log(`Level ${levelNum} fixed and saved.\n`);
    }
}

console.log(`\nValidation complete!`);
console.log(`Fixed issues: ${fixedCount}`);
console.log(`Errors remaining: ${errorCount}`);
