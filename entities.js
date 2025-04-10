// Pac-Man class that handles the player character
export class PacMan {
    constructor(x, y, size) {
        // Position and size properties
        this.x = x;          // X coordinate
        this.y = y;          // Y coordinate
        this.size = size;    // This is the collision size
        this.speed = 3;      // Movement speed in pixels per frame
        this.direction = 'right';  // Current movement direction
        this.nextDirection = 'right';  // Next queued direction
        this.visualSize = size * 0.8; // Visual size is 80% of collision size
        this.mouthOpen = true;  // Animation state for mouth
        this.mouthAngle = 0.2;  // Angle of mouth opening
        this.mouthChangeSpeed = 0.1;
    }

    // Draw Pac-Man on the canvas
    draw(ctx) {
        ctx.save();  // Save current canvas state
        
        // Move origin to Pac-Man's position
        ctx.translate(this.x, this.y);
        
        // Rotate based on current direction
        switch(this.direction) {
            case 'up': ctx.rotate(-Math.PI/2); break;    // Rotate 90° counter-clockwise
            case 'down': ctx.rotate(Math.PI/2); break;   // Rotate 90° clockwise
            case 'left': ctx.rotate(Math.PI); break;     // Rotate 180°
            case 'right': break;
        }

        // Draw Pac-Man's body
        ctx.beginPath();
        ctx.fillStyle = '#FFFF00';
        ctx.arc(0, 0, this.visualSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();  // Restore canvas state
    }

    // Update Pac-Man's state
    update(maze) {
        // Toggle mouth animation
        this.mouthOpen = !this.mouthOpen;
        
        const tileSize = maze.getTileSize();
        const tileX = Math.floor(this.x / tileSize);
        const tileY = Math.floor(this.y / tileSize);
        const tileCenterX = tileX * tileSize + tileSize/2;
        const tileCenterY = tileY * tileSize + tileSize/2;

        // Check if Pac-Man is near the center of a tile
        const isNearCenter = Math.abs(this.x - tileCenterX) < tileSize * 0.2 && 
                            Math.abs(this.y - tileCenterY) < tileSize * 0.2;

        // If near center of tile, check if we can change direction
        if (isNearCenter) {
            // Check if the next direction is valid
            if (this.nextDirection !== this.direction) {
                let nextX = tileX;
                let nextY = tileY;
                
                switch(this.nextDirection) {
                    case 'up': nextY--; break;
                    case 'down': nextY++; break;
                    case 'left': nextX--; break;
                    case 'right': nextX++; break;
                }

                // If the next direction is valid, change direction
                if (!maze.checkCollision(
                    nextX * tileSize + tileSize/2,
                    nextY * tileSize + tileSize/2,
                    this.size
                )) {
                    this.direction = this.nextDirection;
                }
            }
        }

        // Move in current direction
        let nextX = this.x;
        let nextY = this.y;

        switch(this.direction) {
            case 'up':
                nextY -= this.speed;
                nextX = tileCenterX;
                break;
            case 'down':
                nextY += this.speed;
                nextX = tileCenterX;
                break;
            case 'left':
                nextX -= this.speed;
                nextY = tileCenterY;
                break;
            case 'right':
                nextX += this.speed;
                nextY = tileCenterY;
                break;
        }

        // Check for collision before moving
        if (!maze.checkCollision(nextX, nextY, this.size)) {
            this.x = nextX;
            this.y = nextY;
        }
        
        // Handle tunnel warping
        maze.handleTunnels(this);
    }
}

// Define ghost states
export const GHOST_STATES = {
    SCATTER: 0,    // Moves to corner
    CHASE: 1,      // Targets Pac-Man
    FRIGHTENED: 2, // Runs away (blue)
    EATEN: 3       // Returns to base
};

// Define ghost personalities
export const GHOST_PERSONALITIES = {
    BLINKY: 0,  // Red - Aggressive
    PINKY: 1,   // Pink - Ambush
    INKY: 2,    // Cyan - Unpredictable
    CLYDE: 3    // Orange - Defensive
};

// Ghost class for enemy characters
export class Ghost {
    constructor(x, y, color, personality) {
        this.x = x;
        this.y = y;
        this.size = 15;  // Reduced from 20 to 15
        this.speed = 2;
        this.color = color;
        this.personality = personality;
        this.state = 'chase';  // chase, scatter, frightened, eaten
        this.target = { x: 9, y: 9 };  // Initial target at ghost house center
        this.direction = 'up';
        this.nextDirection = null;
        this.frightenedTimer = 0;
        this.scatterTimer = 0;
        this.scatterPhase = 0;
        this.scatterTargets = [
            { x: 0, y: 0 },      // Top-left
            { x: 19, y: 0 },     // Top-right
            { x: 19, y: 19 },    // Bottom-right
            { x: 0, y: 19 }      // Bottom-left
        ];
        this.returningHome = false;
        this.homePosition = { x: 9, y: 9 };  // Center of the ghost house
        this.initialPosition = { x: 9, y: 9 };  // Center of the ghost house
        this.maze = null;  // Will be set when updating
        this.canExit = false;  // New property to control ghost exit
        this.exitDelay = 0;    // New property to track exit delay
        this.scatterStartTime = null;
    }

    getTarget(pacman) {
        if (this.state === 'scatter') {
            return this.scatterTargets[this.scatterPhase % 4];
        }
        if (this.state === 'frightened') {
            // Run away from Pac-Man
            return {
                x: Math.random() * 19,
                y: Math.random() * 19
            };
        }
        if (this.state === 'eaten') {
            return this.homePosition;
        }
        
        // Chase behavior based on personality
        switch(this.personality) {
            case 'chase':
                return { x: pacman.x, y: pacman.y };
            case 'ambush':
                // Target 4 tiles ahead of Pac-Man
                let targetX = pacman.x;
                let targetY = pacman.y;
                switch(pacman.direction) {
                    case 'up': targetY -= 4; break;
                    case 'down': targetY += 4; break;
                    case 'left': targetX -= 4; break;
                    case 'right': targetX += 4; break;
                }
                return { x: targetX, y: targetY };
            case 'patrol':
                // Patrol around the maze
                return this.scatterTargets[Math.floor(Math.random() * 4)];
            case 'random':
                // Random movement
                return {
                    x: Math.random() * 19,
                    y: Math.random() * 19
                };
            default:
                return { x: pacman.x, y: pacman.y };
        }
    }

    chooseDirection(target, maze) {
        if (!maze || !target) return this.direction;
        
        const tileSize = maze.getTileSize();
        const currentTileX = Math.floor(this.x / tileSize);
        const currentTileY = Math.floor(this.y / tileSize);
        
        const possibleDirections = [
            { dir: 'right', x: 1, y: 0 },
            { dir: 'left', x: -1, y: 0 },
            { dir: 'down', y: 1, x: 0 },
            { dir: 'up', y: -1, x: 0 }
        ].filter(dir => {
            const nextX = currentTileX + dir.x;
            const nextY = currentTileY + dir.y;
            return !maze.checkCollision(
                nextX * tileSize + tileSize/2,
                nextY * tileSize + tileSize/2,
                this.size,
                true  // isGhost = true
            );
        });

        if (possibleDirections.length === 0) return this.direction;

        // In frightened mode, choose random direction
        if (this.state === 'frightened') {
            const validDirections = possibleDirections.filter(dir => 
                dir.dir !== this.getOppositeDirection(this.direction)
            );
            if (validDirections.length > 0) {
                return validDirections[Math.floor(Math.random() * validDirections.length)].dir;
            }
            return possibleDirections[Math.floor(Math.random() * possibleDirections.length)].dir;
        }

        // Find direction that minimizes distance to target
        let bestDirection = null;
        let minDistance = Infinity;

        for (const dir of possibleDirections) {
            // Don't allow 180-degree turns unless necessary
            if (dir.dir === this.getOppositeDirection(this.direction) && possibleDirections.length > 1) {
                continue;
            }

            const nextX = (currentTileX + dir.x) * tileSize + tileSize/2;
            const nextY = (currentTileY + dir.y) * tileSize + tileSize/2;
            const distance = Math.hypot(nextX - target.x, nextY - target.y);

            if (distance < minDistance) {
                minDistance = distance;
                bestDirection = dir.dir;
            }
        }

        return bestDirection || this.direction;
    }

    getOppositeDirection(dir) {
        switch(dir) {
            case 'up': return 'down';
            case 'down': return 'up';
            case 'left': return 'right';
            case 'right': return 'left';
        }
    }

    getPossibleDirections(maze) {
        const tileX = Math.floor(this.x / maze.tileSize);
        const tileY = Math.floor(this.y / maze.tileSize);
        const possibleDirections = [];

        // Check each direction for possible movement
        if (maze.maze[tileY - 1][tileX] !== 1) possibleDirections.push('up');
        if (maze.maze[tileY + 1][tileX] !== 1) possibleDirections.push('down');
        if (maze.maze[tileY][tileX - 1] !== 1) possibleDirections.push('left');
        if (maze.maze[tileY][tileX + 1] !== 1) possibleDirections.push('right');

        // Remove the opposite direction to prevent 180-degree turns
        const oppositeDir = this.getOppositeDirection(this.direction);
        const index = possibleDirections.indexOf(oppositeDir);
        if (index !== -1 && possibleDirections.length > 1) {
            possibleDirections.splice(index, 1);
        }

        return possibleDirections;
    }

    update(maze, pacman, gameTime) {
        // Store maze reference
        this.maze = maze;

        // Handle exit timing
        if (!this.canExit && gameTime >= this.exitDelay) {
            this.canExit = true;
            this.state = 'scatter';  // Enter scatter mode when exiting
            this.scatterStartTime = gameTime;  // Start scatter timer
        }

        // If ghost can't exit yet, stay in ghost house
        if (!this.canExit) {
            this.x = 9 * maze.tileSize + maze.tileSize/2;
            this.y = 9 * maze.tileSize + maze.tileSize/2;
            return;
        }

        // Handle scatter mode timing
        if (this.state === 'scatter') {
            if (gameTime - this.scatterStartTime >= 7) {
                this.state = 'chase';
                this.scatterStartTime = null;
            }
        }

        // Determine target based on personality and state
        let target;
        if (this.state === 'scatter') {
            // Use scatter corners based on personality
            switch (this.personality) {
                case 'chase':
                    target = { x: 19 * maze.tileSize, y: 0 }; // Top right
                    break;
                case 'ambush':
                    target = { x: 0, y: 0 }; // Top left
                    break;
                case 'patrol':
                    target = { x: 0, y: 19 * maze.tileSize }; // Bottom left
                    break;
                case 'random':
                    target = { x: 19 * maze.tileSize, y: 19 * maze.tileSize }; // Bottom right
                    break;
            }
        } else if (this.state === 'frightened') {
            // Random movement when frightened
            target = {
                x: Math.floor(Math.random() * 20) * maze.tileSize,
                y: Math.floor(Math.random() * 20) * maze.tileSize
            };
        } else {
            // Normal targeting based on personality
            target = this.getTarget(pacman);
        }

        // Check if ghost is near center of tile to decide on direction change
        const tileX = Math.floor(this.x / maze.tileSize);
        const tileY = Math.floor(this.y / maze.tileSize);
        const centerX = tileX * maze.tileSize + maze.tileSize/2;
        const centerY = tileY * maze.tileSize + maze.tileSize/2;
        const distanceToCenter = Math.sqrt(
            Math.pow(this.x - centerX, 2) + 
            Math.pow(this.y - centerY, 2)
        );

        if (distanceToCenter < 2) {
            // Choose new direction at intersections
            const possibleDirections = this.getPossibleDirections(maze);
            if (possibleDirections.length > 0) {
                // Choose direction that moves toward target
                let bestDirection = this.direction;
                let minDistance = Infinity;

                for (const dir of possibleDirections) {
                    let nextX = this.x;
                    let nextY = this.y;

                    switch (dir) {
                        case 'up': nextY -= this.speed; break;
                        case 'down': nextY += this.speed; break;
                        case 'left': nextX -= this.speed; break;
                        case 'right': nextX += this.speed; break;
                    }

                    const distance = Math.sqrt(
                        Math.pow(nextX - target.x, 2) + 
                        Math.pow(nextY - target.y, 2)
                    );

                    if (distance < minDistance) {
                        minDistance = distance;
                        bestDirection = dir;
                    }
                }

                this.direction = bestDirection;
            }
        }

        // Move in current direction
        let nextX = this.x;
        let nextY = this.y;

        switch (this.direction) {
            case 'up': nextY -= this.speed; break;
            case 'down': nextY += this.speed; break;
            case 'left': nextX -= this.speed; break;
            case 'right': nextX += this.speed; break;
        }

        // Check for collisions with walls
        const nextTileX = Math.floor(nextX / maze.tileSize);
        const nextTileY = Math.floor(nextY / maze.tileSize);

        if (maze.maze[nextTileY][nextTileX] !== 1) {
            this.x = nextX;
            this.y = nextY;
        }

        // Handle tunnel warping
        if (this.x < 0) this.x = 19 * maze.tileSize;
        if (this.x > 19 * maze.tileSize) this.x = 0;
    }

    draw(ctx) {
        // Save the current context state
        ctx.save();
        
        // Move to ghost's position
        ctx.translate(this.x, this.y);
        
        // Set ghost color based on state
        if (this.state === 'frightened') {
            ctx.fillStyle = '#0000FF'; // Blue when frightened
        } else {
            ctx.fillStyle = this.color;
        }
        
        // Draw ghost body
        const bodyRadius = this.size * 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, bodyRadius, Math.PI, 0, false);
        ctx.lineTo(bodyRadius, bodyRadius);
        ctx.lineTo(-bodyRadius, bodyRadius);
        ctx.closePath();
        ctx.fill();
        
        // Draw ghost eyes
        const eyeRadius = bodyRadius * 0.2;
        const eyeOffsetX = bodyRadius * 0.3;
        const eyeOffsetY = -bodyRadius * 0.2;
        
        // White part of eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.arc(eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = 'black';
        const pupilRadius = eyeRadius * 0.5;
        const pupilOffsetX = eyeOffsetX * 0.5;
        const pupilOffsetY = eyeOffsetY * 0.5;
        
        ctx.beginPath();
        ctx.arc(-pupilOffsetX, pupilOffsetY, pupilRadius, 0, Math.PI * 2);
        ctx.arc(pupilOffsetX, pupilOffsetY, pupilRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Restore the context state
        ctx.restore();
    }
} 