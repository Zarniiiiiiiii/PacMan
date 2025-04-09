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
    update() {
        // Toggle mouth animation
        this.mouthOpen = !this.mouthOpen;
    }
}

// Define ghost states
const GHOST_STATES = {
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
    constructor(x, y, size, color, personality, direction) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.personality = personality;
        this.direction = direction;
        this.speed = 2;
        this.visualSize = size * 0.6;
        this.state = GHOST_STATES.SCATTER;
        this.stateTimer = 0;
        this.scatterTarget = this.getScatterTarget();
        this.lastDirection = null;
        this.maze = null; // Will be set when updating
    }

    getScatterTarget() {
        // Define scatter targets for each ghost
        const targets = {
            [GHOST_PERSONALITIES.BLINKY]: { x: 18, y: 0 },   // Top-right corner
            [GHOST_PERSONALITIES.PINKY]: { x: 0, y: 0 },     // Top-left corner
            [GHOST_PERSONALITIES.INKY]: { x: 18, y: 18 },    // Bottom-right corner
            [GHOST_PERSONALITIES.CLYDE]: { x: 0, y: 18 }     // Bottom-left corner
        };
        return targets[this.personality];
    }

    getTarget(pacman, blinky = null) {
        if (!this.maze) return this.scatterTarget; // Return scatter target if maze not set
        const tileSize = this.maze.getTileSize();
        const pacmanTileX = Math.floor(pacman.x / tileSize);
        const pacmanTileY = Math.floor(pacman.y / tileSize);

        if (this.state === GHOST_STATES.SCATTER) {
            return this.scatterTarget;
        }

        if (this.state === GHOST_STATES.FRIGHTENED) {
            // Run away from Pac-Man
            return {
                x: (pacmanTileX - 4) * tileSize + tileSize/2,
                y: (pacmanTileY - 4) * tileSize + tileSize/2
            };
        }

        // Different targeting based on personality
        switch(this.personality) {
            case GHOST_PERSONALITIES.BLINKY: // Red - Direct pursuit
                return {
                    x: pacman.x,
                    y: pacman.y
                };

            case GHOST_PERSONALITIES.PINKY: // Pink - Ambush (4 tiles ahead)
                let targetX = pacmanTileX;
                let targetY = pacmanTileY;
                switch(pacman.direction) {
                    case 'up': targetY -= 4; break;
                    case 'down': targetY += 4; break;
                    case 'left': targetX -= 4; break;
                    case 'right': targetX += 4; break;
                }
                return {
                    x: targetX * tileSize + tileSize/2,
                    y: targetY * tileSize + tileSize/2
                };

            case GHOST_PERSONALITIES.INKY: // Cyan - Unpredictable
                if (!blinky) return this.scatterTarget;
                const blinkyTileX = Math.floor(blinky.x / tileSize);
                const blinkyTileY = Math.floor(blinky.y / tileSize);
                const vectorX = pacmanTileX - blinkyTileX;
                const vectorY = pacmanTileY - blinkyTileY;
                return {
                    x: (pacmanTileX + vectorX) * tileSize + tileSize/2,
                    y: (pacmanTileY + vectorY) * tileSize + tileSize/2
                };

            case GHOST_PERSONALITIES.CLYDE: // Orange - Defensive
                const distance = Math.hypot(
                    this.x - pacman.x,
                    this.y - pacman.y
                );
                if (distance > 8 * tileSize) {
                    return { x: pacman.x, y: pacman.y };
                }
                return this.scatterTarget;
        }
    }

    chooseDirection(target, maze) {
        const tileSize = maze.getTileSize();
        const currentTileX = Math.floor(this.x / tileSize);
        const currentTileY = Math.floor(this.y / tileSize);
        
        const possibleDirections = [
            { dir: 'right', x: 1, y: 0 },
            { dir: 'left', x: -1, y: 0 },
            { dir: 'down', y: 1, x: 0 },
            { dir: 'up', y: -1, x: 0 }
        ].filter(dir => {
            // Check if direction is valid (no wall)
            const nextX = currentTileX + dir.x;
            const nextY = currentTileY + dir.y;
            return !maze.checkCollision(
                nextX * tileSize + tileSize/2,
                nextY * tileSize + tileSize/2,
                this.size
            );
        });

        // In frightened mode, choose random direction
        if (this.state === GHOST_STATES.FRIGHTENED) {
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
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        return opposites[dir];
    }

    update(maze, pacman, blinky = null) {
        this.maze = maze; // Store maze reference
        // Update state timer
        this.stateTimer++;
        if (this.stateTimer >= 700) { // 7 seconds in scatter mode
            this.state = GHOST_STATES.CHASE;
            this.stateTimer = 0;
        } else if (this.stateTimer >= 2000) { // 20 seconds in chase mode
            this.state = GHOST_STATES.SCATTER;
            this.stateTimer = 0;
        }

        const tileSize = maze.getTileSize();
        const tileX = Math.floor(this.x / tileSize);
        const tileY = Math.floor(this.y / tileSize);
        const tileCenterX = tileX * tileSize + tileSize/2;
        const tileCenterY = tileY * tileSize + tileSize/2;

        // Check if ghost is near the center of a tile
        const isNearCenter = Math.abs(this.x - tileCenterX) < tileSize * 0.2 && 
                            Math.abs(this.y - tileCenterY) < tileSize * 0.2;

        if (isNearCenter) {
            const target = this.getTarget(pacman, blinky);
            this.direction = this.chooseDirection(target, maze);
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

        if (!maze.checkCollision(nextX, nextY, this.size)) {
            this.x = nextX;
            this.y = nextY;
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Move origin to ghost's position
        ctx.translate(this.x, this.y);
        
        // Set color based on state
        if (this.state === GHOST_STATES.FRIGHTENED) {
            ctx.fillStyle = '#0000FF'; // Blue when frightened
        } else {
            ctx.fillStyle = this.color;
        }

        // Draw ghost body
        ctx.beginPath();
        ctx.arc(0, 0, this.visualSize, Math.PI, 0, false);
        ctx.lineTo(this.visualSize, this.visualSize);
        ctx.lineTo(-this.visualSize, this.visualSize);
        ctx.closePath();
        ctx.fill();

        // Draw eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-this.visualSize/3, -this.visualSize/3, this.visualSize/4, 0, Math.PI * 2);
        ctx.arc(this.visualSize/3, -this.visualSize/3, this.visualSize/4, 0, Math.PI * 2);
        ctx.fill();

        // Draw pupils
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(-this.visualSize/3, -this.visualSize/3, this.visualSize/8, 0, Math.PI * 2);
        ctx.arc(this.visualSize/3, -this.visualSize/3, this.visualSize/8, 0, Math.PI * 2);
        ctx.fill();

        // Draw bottom wavy part
        ctx.beginPath();
        ctx.moveTo(-this.visualSize, this.visualSize);
        for (let i = 0; i < 3; i++) {
            ctx.quadraticCurveTo(
                -this.visualSize + (i * this.visualSize/1.5) + this.visualSize/3,
                this.visualSize + this.visualSize/4,
                -this.visualSize + (i * this.visualSize/1.5) + this.visualSize/1.5,
                this.visualSize
            );
        }
        ctx.lineTo(this.visualSize, this.visualSize);
        ctx.fill();

        ctx.restore();
    }
} 