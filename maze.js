// Maze class that handles the game's maze layout and collision detection
export class Maze {
    constructor() {
        // Size of each tile in pixels
        this.tileSize = 20;
        
        // Maze layout (1 = wall, 0 = path with dot, 2 = path without dot)
        this.maze = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Top border
            [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],  // Row 1
            [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],  // Row 2
            [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],  // Row 3
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],  // Row 4
            [1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,1],  // Row 5
            [1,0,0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,0,0,1],  // Row 6
            [1,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,1],  // Row 7
            [1,1,1,1,0,1,0,0,0,0,0,0,0,0,1,0,1,1,1,1],  // Row 8
            [1,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,1],  // Row 9 (center line without dots)
            [1,0,1,1,0,1,0,0,0,0,0,0,0,0,1,0,1,1,0,1],  // Row 10
            [1,0,0,1,0,1,1,1,0,1,1,0,1,1,1,0,1,0,0,1],  // Row 11
            [1,1,0,1,0,0,0,0,0,1,1,0,0,0,0,0,1,0,1,1],  // Row 12
            [1,0,0,0,0,1,1,1,0,0,0,0,1,1,1,0,0,0,0,1],  // Row 13
            [1,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,1],  // Row 14
            [1,0,0,0,0,1,1,1,0,1,1,0,1,1,1,0,0,0,0,1],  // Row 15
            [1,1,1,1,0,1,0,0,0,0,0,0,0,0,1,0,1,1,1,1],  // Row 16
            [1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,1,1],  // Row 17
            [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],  // Row 18
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]   // Bottom border
        ];
    }

    // Draw the maze on the canvas
    draw(ctx) {
        // Loop through each tile in the maze
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                const tile = this.maze[y][x];
                
                // Draw walls
                if (tile === 1) {
                    ctx.fillStyle = '#0000FF';  // Blue walls
                    ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                } 
                // Draw paths with dots
                else if (tile === 0) {
                    // Draw black background for path
                    ctx.fillStyle = '#000';
                    ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    
                    // Draw white dot
                    ctx.fillStyle = '#FFF';
                    ctx.beginPath();
                    ctx.arc(
                        x * this.tileSize + this.tileSize/2,  // Center X
                        y * this.tileSize + this.tileSize/2,  // Center Y
                        2,                                    // Dot radius
                        0,                                    // Start angle
                        Math.PI * 2                          // End angle (full circle)
                    );
                    ctx.fill();
                }
                // Draw paths without dots
                else if (tile === 2) {
                    // Draw black background for path
                    ctx.fillStyle = '#000';
                    ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }
    }

    // Check if a position collides with a wall
    checkCollision(x, y, size) {
        // Use a fixed hitbox size based on tile size with a small buffer
        const hitboxSize = this.tileSize * 0.45; // Increased from 0.42 to 0.45
        const buffer = 2; // Increased buffer to prevent any clipping
        
        // Calculate the edges of Pac-Man's hitbox
        const left = x - hitboxSize + buffer;
        const right = x + hitboxSize - buffer;
        const top = y - hitboxSize + buffer;
        const bottom = y + hitboxSize - buffer;
        
        // Convert edges to tile coordinates
        const leftTile = Math.floor(left / this.tileSize);
        const rightTile = Math.floor(right / this.tileSize);
        const topTile = Math.floor(top / this.tileSize);
        const bottomTile = Math.floor(bottom / this.tileSize);
        
        // Check if any edge is outside maze bounds
        if (leftTile < 0 || rightTile >= this.maze[0].length || 
            topTile < 0 || bottomTile >= this.maze.length) {
            return true;
        }
        
        // Check the tiles that Pac-Man overlaps with
        for (let tileY = topTile; tileY <= bottomTile; tileY++) {
            for (let tileX = leftTile; tileX <= rightTile; tileX++) {
                if (this.maze[tileY][tileX] === 1) {
                    return true;
                }
            }
        }
        
        return false;
    }

    // Get the size of each tile
    getTileSize() {
        return this.tileSize;
    }
} 