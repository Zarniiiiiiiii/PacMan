// Maze class that handles the game's maze layout and collision detection
export class Maze {
    constructor() {
        // Size of each tile in pixels
        this.tileSize = 20;
        
        // Maze layout (1 = wall, 0 = path with dot, 2 = path without dot, 4 = special point)
        this.maze = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Top border
            [1,2,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],  // Row 1
            [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],  // Row 2
            [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],  // Row 3
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],  // Row 4
            [1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,1],  // Row 5
            [1,0,0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,0,0,1],  // Row 6
            [1,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,1],  // Row 7
            [1,1,1,1,0,1,0,0,0,0,0,0,0,0,1,0,1,1,1,1],  // Row 8
            [2,0,0,0,0,0,0,1,3,3,3,3,3,0,0,0,0,0,0,2],  // Row 9 (center line with ghost-only path)
            [1,0,1,1,0,1,0,0,0,0,0,0,0,0,1,0,1,1,0,1],  // Row 10
            [1,0,0,1,0,1,1,1,0,1,1,0,1,1,1,0,1,0,0,1],  // Row 11
            [1,1,0,1,0,0,0,0,0,1,1,0,0,0,0,0,1,0,1,1],  // Row 12
            [1,0,0,0,0,1,1,1,0,0,0,0,1,1,1,0,0,0,0,1],  // Row 13
            [1,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,1],  // Row 14
            [1,0,0,0,0,1,1,1,0,1,1,0,1,1,1,0,0,0,0,1],  // Row 15
            [1,0,1,1,0,1,0,0,0,0,0,0,0,0,1,0,1,1,0,1],  // Row 16
            [1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,1],  // Row 17
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],  // Row 18
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]   // Bottom border
        ];

        // Add special points (cherries) in random positions
        this.addSpecialPoints();
    }

    // Add special points to the maze
    addSpecialPoints() {
        // Define the 4 zones of the maze
        const zones = [
            { // Top-left zone
                startX: 1, endX: 9,
                startY: 1, endY: 9
            },
            { // Top-right zone
                startX: 10, endX: 18,
                startY: 1, endY: 9
            },
            { // Bottom-left zone
                startX: 1, endX: 9,
                startY: 10, endY: 18
            },
            { // Bottom-right zone
                startX: 10, endX: 18,
                startY: 10, endY: 18
            }
        ];

        // Add one special point in each zone
        zones.forEach(zone => {
            let pointAdded = false;
            while (!pointAdded) {
                // Generate random coordinates within the zone
                const x = Math.floor(Math.random() * (zone.endX - zone.startX + 1)) + zone.startX;
                const y = Math.floor(Math.random() * (zone.endY - zone.startY + 1)) + zone.startY;

                // Only add special point on empty paths (tile value 0)
                if (this.maze[y][x] === 0) {
                    this.maze[y][x] = 4; // 4 represents a special point
                    pointAdded = true;
                }
            }
        });
    }

    // Draw the maze on the canvas
    draw(ctx) {
        // Remove border drawing
        // ctx.strokeStyle = '#FFFFFF';
        // ctx.lineWidth = 8;  // Overlay with an 8-pixel white line
        // ctx.strokeRect(4, 4, this.maze[0].length * this.tileSize - 8, this.maze.length * this.tileSize - 8);

        // Set line style for walls
        ctx.lineWidth = 2;            // Line width for walls

        // Loop through each tile in the maze
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                const tile = this.maze[y][x];
                const tileX = x * this.tileSize;
                const tileY = y * this.tileSize;
                
                // Draw walls as lines
                if (tile === 1 || tile === 3) {
                    // Set color for walls (blue for ghost-only paths)
                    ctx.strokeStyle = tile === 3 ? '#0000FF' : '#0000FF';

                    // Check adjacent tiles to determine which walls to draw
                    const left = x > 0 ? this.maze[y][x-1] : 1;
                    const right = x < this.maze[y].length - 1 ? this.maze[y][x+1] : 1;
                    const top = y > 0 ? this.maze[y-1][x] : 1;
                    const bottom = y < this.maze.length - 1 ? this.maze[y+1][x] : 1;

                    // Draw top wall if there's no wall above
                    if (top !== 1 && top !== 3) {
                        ctx.beginPath();
                        ctx.moveTo(tileX, tileY + 1);
                        ctx.lineTo(tileX + this.tileSize, tileY + 1);
                        ctx.stroke();
                    }

                    // Draw right wall if there's no wall to the right
                    if (right !== 1 && right !== 3) {
                        ctx.beginPath();
                        ctx.moveTo(tileX + this.tileSize - 1, tileY);
                        ctx.lineTo(tileX + this.tileSize - 1, tileY + this.tileSize);
                        ctx.stroke();
                    }

                    // Draw bottom wall if there's no wall below
                    if (bottom !== 1 && bottom !== 3) {
                        ctx.beginPath();
                        ctx.moveTo(tileX, tileY + this.tileSize - 1);
                        ctx.lineTo(tileX + this.tileSize, tileY + this.tileSize - 1);
                        ctx.stroke();
                    }

                    // Draw left wall if there's no wall to the left
                    if (left !== 1 && left !== 3) {
                        ctx.beginPath();
                        ctx.moveTo(tileX + 1, tileY);
                        ctx.lineTo(tileX + 1, tileY + this.tileSize);
                        ctx.stroke();
                    }
                } 
                // Draw paths with dots
                else if (tile === 0) {
                    // Draw black background for path
                    ctx.fillStyle = '#000';
                    ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                    
                    // Draw white dot
                    ctx.fillStyle = '#FFF';
                    ctx.beginPath();
                    ctx.arc(
                        tileX + this.tileSize/2,  // Center X
                        tileY + this.tileSize/2,  // Center Y
                        2,                        // Dot radius
                        0,                        // Start angle
                        Math.PI * 2              // End angle (full circle)
                    );
                    ctx.fill();
                }
                // Draw special points (cherries)
                else if (tile === 4) {
                    // Draw black background for path
                    ctx.fillStyle = '#000';
                    ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                    
                    // Draw cherry
                    ctx.fillStyle = '#FF0000'; // Red color for cherry
                    ctx.beginPath();
                    ctx.arc(
                        tileX + this.tileSize/2,  // Center X
                        tileY + this.tileSize/2,  // Center Y
                        4,                        // Cherry radius
                        0,                        // Start angle
                        Math.PI * 2              // End angle (full circle)
                    );
                    ctx.fill();
                }
                // Draw paths without dots
                else if (tile === 2) {
                    // Draw black background for path
                    ctx.fillStyle = '#000';
                    ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                }
            }
        }
    }

    // Check if a position collides with a wall
    checkCollision(x, y, size, isGhost = false) {
        // Use a smaller hitbox size and buffer for more precise collision detection
        const hitboxSize = this.tileSize * 0.4; // Reduced from 0.45 to 0.4
        const buffer = 1; // Reduced buffer from 2 to 1
        
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
                const tile = this.maze[tileY][tileX];
                
                // For ghosts, check if the tile is a wall (1) and not part of the ghost house entrance
                if (isGhost) {
                    // Check if this is a ghost house wall (row 9, columns 9-12)
                    const isGhostHouseWall = tileY === 9 && tileX >= 9 && tileX <= 12;
                    if (tile === 1 && !isGhostHouseWall) {
                        return true;
                    }
                }
                // For Pac-Man, both 1s and 3s are walls
                else if (!isGhost && (tile === 1 || tile === 3)) {
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

    // Handle tunnel warping for entities
    handleTunnels(entity) {
        const ROW_FOR_TUNNELS = 9; // Row 9 (0-based index)
        const TUNNEL_ENTRANCE_LEFT = 0;
        const TUNNEL_ENTRANCE_RIGHT = this.maze[ROW_FOR_TUNNELS].length - 1;
        const TUNNEL_LEFT_X = TUNNEL_ENTRANCE_LEFT * this.tileSize + this.tileSize/2;
        const TUNNEL_RIGHT_X = TUNNEL_ENTRANCE_RIGHT * this.tileSize + this.tileSize/2;

        // Check if entity is in the tunnel row
        const entityTileY = Math.floor(entity.y / this.tileSize);
        if (entityTileY === ROW_FOR_TUNNELS) {
            // Warp from left to right
            if (entity.x <= TUNNEL_LEFT_X + this.tileSize/2 && entity.direction === 'left') {
                console.log('Warping from left to right');
                entity.x = TUNNEL_RIGHT_X - this.tileSize/2;
            }
            // Warp from right to left
            else if (entity.x >= TUNNEL_RIGHT_X - this.tileSize/2 && entity.direction === 'right') {
                console.log('Warping from right to left');
                entity.x = TUNNEL_LEFT_X + this.tileSize/2;
            }
        }
    }

    // Count remaining dots in the maze
    getRemainingDots() {
        let count = 0;
        for (let row of this.maze) {
            for (let tile of row) {
                if (tile === 0) {
                    count++;
                }
            }
        }
        return count;
    }
} 