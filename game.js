// Import necessary classes from other files
import { PacMan, Ghost, GHOST_PERSONALITIES, GHOST_STATES } from './entities.js';
import { Maze } from './maze.js';

// Main Game class that handles the game loop, input, and rendering
class Game {
    constructor() {
        try {
            // Initialize canvas and context
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }
            
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                throw new Error('Could not get 2D context');
            }

            // Initialize score
            this.score = 0;
            this.scoreDisplay = document.getElementById('scoreDisplay');
            if (!this.scoreDisplay) {
                throw new Error('Score display element not found');
            }

            console.log('Canvas initialized:', {
                width: this.canvas.width,
                height: this.canvas.height
            });

            // Game loop timing variables
            this.lastTime = 0;
            this.accumulator = 0;
            this.timestep = 1000/60; // 60 FPS

            // Initialize game objects
            this.maze = new Maze();
            const tileSize = this.maze.getTileSize();
            
            // Initialize Pac-Man at starting position
            this.pacman = new PacMan(tileSize * 1 + tileSize/2, tileSize * 1 + tileSize/2, tileSize/2);

            // Initialize ghosts at their starting positions
            this.ghosts = [
                new Ghost(tileSize * 1 + tileSize/2, tileSize * 1 + tileSize/2, tileSize/2, '#FF0000', GHOST_PERSONALITIES.BLINKY, 'right'),    // Red ghost - Blinky
                new Ghost(tileSize * 18 + tileSize/2, tileSize * 1 + tileSize/2, tileSize/2, '#FFB8DE', GHOST_PERSONALITIES.PINKY, 'left'),   // Pink ghost - Pinky
                new Ghost(tileSize * 1 + tileSize/2, tileSize * 18 + tileSize/2, tileSize/2, '#00FFDE', GHOST_PERSONALITIES.INKY, 'right'),   // Cyan ghost - Inky
                new Ghost(tileSize * 18 + tileSize/2, tileSize * 18 + tileSize/2, tileSize/2, '#FFB847', GHOST_PERSONALITIES.CLYDE, 'left')   // Orange ghost - Clyde
            ];
            
            // Set up event listeners
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());

            // Initialize keyboard input tracking
            this.keys = {};
            window.addEventListener('keydown', (e) => {
                this.keys[e.key] = true;
                console.log('Key pressed:', e.key); // Debug log
            });
            window.addEventListener('keyup', (e) => {
                this.keys[e.key] = false;
                console.log('Key released:', e.key); // Debug log
            });

            // Start the game loop
            requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        } catch (error) {
            console.error('Game initialization error:', error);
        }
    }
    
    // Handle canvas resizing
    resizeCanvas() {
        try {
            const container = this.canvas.parentElement;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            // Calculate maze dimensions
            const mazeWidth = this.maze.maze[0].length;  // Number of columns
            const mazeHeight = this.maze.maze.length;    // Number of rows
            const tileSize = this.maze.getTileSize();
            
            // Calculate the maximum size that maintains aspect ratio
            const mazeAspectRatio = mazeWidth / mazeHeight;
            const containerAspectRatio = containerWidth / containerHeight;
            
            let canvasWidth, canvasHeight;
            
            if (containerAspectRatio > mazeAspectRatio) {
                // Container is wider than maze
                canvasHeight = containerHeight;
                canvasWidth = canvasHeight * mazeAspectRatio;
            } else {
                // Container is taller than maze
                canvasWidth = containerWidth;
                canvasHeight = canvasWidth / mazeAspectRatio;
            }
            
            // Set canvas size
            this.canvas.width = canvasWidth;
            this.canvas.height = canvasHeight;
            
            // Update tile size to match new canvas dimensions
            this.maze.tileSize = Math.min(
                canvasWidth / mazeWidth,
                canvasHeight / mazeHeight
            );
            
            // Reinitialize entities with new tile size
            const newTileSize = this.maze.tileSize;
            this.pacman = new PacMan(newTileSize * 1 + newTileSize/2, newTileSize * 1 + newTileSize/2, newTileSize/2);
            this.ghosts = [
                new Ghost(newTileSize * 1 + newTileSize/2, newTileSize * 1 + newTileSize/2, newTileSize/2, '#FF0000', GHOST_PERSONALITIES.BLINKY, 'right'),    // Red ghost - Blinky
                new Ghost(newTileSize * 18 + newTileSize/2, newTileSize * 1 + newTileSize/2, newTileSize/2, '#FFB8DE', GHOST_PERSONALITIES.PINKY, 'left'),   // Pink ghost - Pinky
                new Ghost(newTileSize * 1 + newTileSize/2, newTileSize * 18 + newTileSize/2, newTileSize/2, '#00FFDE', GHOST_PERSONALITIES.INKY, 'right'),   // Cyan ghost - Inky
                new Ghost(newTileSize * 18 + newTileSize/2, newTileSize * 18 + newTileSize/2, newTileSize/2, '#FFB847', GHOST_PERSONALITIES.CLYDE, 'left')   // Orange ghost - Clyde
            ];
            
            console.log('Canvas resized:', {
                width: this.canvas.width,
                height: this.canvas.height,
                tileSize: this.maze.tileSize
            });
        } catch (error) {
            console.error('Canvas resize error:', error);
        }
    }

    // Handle keyboard input for Pac-Man movement
    handleInput() {
        // Set next direction based on key presses
        if (this.keys['ArrowUp'] || this.keys['w']) this.pacman.nextDirection = 'up';
        if (this.keys['ArrowDown'] || this.keys['s']) this.pacman.nextDirection = 'down';
        if (this.keys['ArrowLeft'] || this.keys['a']) this.pacman.nextDirection = 'left';
        if (this.keys['ArrowRight'] || this.keys['d']) this.pacman.nextDirection = 'right';
    }

    // Check if a tile is an intersection (has paths in multiple directions)
    isIntersectionTile(tileX, tileY) {
        // Get the maze array
        const maze = this.maze.maze;
        
        // Check if the tile is a path (not a wall)
        if (maze[tileY][tileX] !== 0) return false;
        
        // Count how many adjacent tiles are paths (not walls)
        let pathCount = 0;
        
        // Check up
        if (tileY > 0 && maze[tileY - 1][tileX] === 0) pathCount++;
        // Check down
        if (tileY < maze.length - 1 && maze[tileY + 1][tileX] === 0) pathCount++;
        // Check left
        if (tileX > 0 && maze[tileY][tileX - 1] === 0) pathCount++;
        // Check right
        if (tileX < maze[0].length - 1 && maze[tileY][tileX + 1] === 0) pathCount++;
        
        // Return true if there are paths in at least 3 directions (including current tile)
        return pathCount >= 2;
    }

    // Update score and display
    updateScore(points) {
        this.score += points;
        this.scoreDisplay.textContent = this.score;
    }

    // Check for dot collection
    checkDotCollection() {
        const tileSize = this.maze.getTileSize();
        const pacmanTileX = Math.floor(this.pacman.x / tileSize);
        const pacmanTileY = Math.floor(this.pacman.y / tileSize);

        // Check if Pac-Man is on a dot (value 0 in maze array)
        if (this.maze.maze[pacmanTileY][pacmanTileX] === 0) {
            // Change the dot to an empty path (value 2)
            this.maze.maze[pacmanTileY][pacmanTileX] = 2;
            // Add points for collecting a dot
            this.updateScore(10);
        }
    }

    // Update game state
    update(deltaTime) {
        // Handle input and movement
        this.handleInput();

        // Check for dot collection
        this.checkDotCollection();

        // Update Pac-Man with maze reference
        this.pacman.update(this.maze);

        // Update ghosts with maze reference and Pac-Man position
        const blinky = this.ghosts[0]; // Blinky is needed for Inky's targeting
        this.ghosts.forEach(ghost => ghost.update(this.maze, this.pacman, blinky));
    }

    // Draw everything on the canvas
    draw() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw the maze
        this.maze.draw(this.ctx);
        
        // Draw Pac-Man
        this.pacman.draw(this.ctx);
        
        // Draw ghosts
        this.ghosts.forEach(ghost => ghost.draw(this.ctx));
    }

    // Main game loop
    gameLoop(timestamp) {
        // Calculate time since last frame
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Accumulate time for fixed timestep updates
        this.accumulator += deltaTime;

        // Update game state at fixed intervals
        while (this.accumulator >= this.timestep) {
            this.update(this.timestep);
            this.accumulator -= this.timestep;
        }

        // Draw everything
        this.draw();
        
        // Request next frame
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
}

// Start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    new Game();
}); 