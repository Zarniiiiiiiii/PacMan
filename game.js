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

            // Initialize game state
            this.gameWon = false;
            this.gameStarted = false;

            // Initialize buttons
            this.startButton = document.getElementById('startButton');
            this.resetButton = document.getElementById('resetButton');
            this.devButton = document.getElementById('devButton');

            // Add button event listeners
            this.startButton.addEventListener('click', () => this.startGame());
            this.resetButton.addEventListener('click', () => this.resetGame());
            this.devButton.addEventListener('click', () => this.collectAllDots());

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

            // Create ghosts in the correct order with their specific properties
            this.ghosts = [
                { // Red ghost (Blinky) - exits first
                    ghost: new Ghost(9 * tileSize + tileSize/2, 9 * tileSize + tileSize/2, '#FF0000', 'chase'),
                    exitDelay: 0
                },
                { // Pink ghost (Pinky) - exits second
                    ghost: new Ghost(10 * tileSize + tileSize/2, 9 * tileSize + tileSize/2, '#FFB8DE', 'ambush'),
                    exitDelay: 1.5
                },
                { // Cyan ghost (Inky) - exits third
                    ghost: new Ghost(11 * tileSize + tileSize/2, 9 * tileSize + tileSize/2, '#00FFDE', 'patrol'),
                    exitDelay: 3.0
                },
                { // Orange ghost (Clyde) - exits last
                    ghost: new Ghost(12 * tileSize + tileSize/2, 9 * tileSize + tileSize/2, '#FFB847', 'random'),
                    exitDelay: 4.5
                }
            ];

            // Set exit delays for each ghost
            this.ghosts.forEach(ghostData => {
                ghostData.ghost.exitDelay = ghostData.exitDelay;
            });

            // Extract just the ghost objects for easier access
            this.ghosts = this.ghosts.map(data => data.ghost);

            this.gameTime = 0;  // Add game time tracking

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

            // Draw initial state
            this.draw();
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
                { // Red ghost (Blinky) - exits first
                    ghost: new Ghost(9 * newTileSize + newTileSize/2, 9 * newTileSize + newTileSize/2, '#FF0000', 'chase'),
                    exitDelay: 0
                },
                { // Pink ghost (Pinky) - exits second
                    ghost: new Ghost(10 * newTileSize + newTileSize/2, 9 * newTileSize + newTileSize/2, '#FFB8DE', 'ambush'),
                    exitDelay: 1.5
                },
                { // Cyan ghost (Inky) - exits third
                    ghost: new Ghost(11 * newTileSize + newTileSize/2, 9 * newTileSize + newTileSize/2, '#00FFDE', 'patrol'),
                    exitDelay: 3.0
                },
                { // Orange ghost (Clyde) - exits last
                    ghost: new Ghost(12 * newTileSize + newTileSize/2, 9 * newTileSize + newTileSize/2, '#FFB847', 'random'),
                    exitDelay: 4.5
                }
            ];
            
            // Set exit delays for each ghost
            this.ghosts.forEach(ghostData => {
                ghostData.ghost.exitDelay = ghostData.exitDelay;
            });
            
            // Extract just the ghost objects for easier access
            this.ghosts = this.ghosts.map(data => data.ghost);
            
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
        if (this.gameWon) {
            this.scoreDisplay.innerHTML = '<span class="win-text">YOU WIN!</span><br>Final Score: ' + this.score;
        } else {
            this.scoreDisplay.textContent = this.score;
        }
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

    // Check for win condition
    checkWinCondition() {
        if (!this.gameWon && this.maze.getRemainingDots() === 0) {
            this.gameWon = true;
            this.updateScore(0); // Update display to show win message
        }
    }

    // Start the game
    startGame() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.gameWon = false;
            this.score = 0;
            this.updateScore(0);
            requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }
    }

    // Reset the game
    resetGame() {
        // Reset game state
        this.gameStarted = false;
        this.gameWon = false;
        this.score = 0;
        this.updateScore(0);

        // Reset maze
        this.maze = new Maze();
        const tileSize = this.maze.getTileSize();

        // Reset Pac-Man
        this.pacman = new PacMan(tileSize * 1 + tileSize/2, tileSize * 1 + tileSize/2, tileSize/2);

        // Reset ghosts with proper exit delays
        this.ghosts = [
            { // Red ghost (Blinky) - exits first
                ghost: new Ghost(9 * tileSize + tileSize/2, 9 * tileSize + tileSize/2, '#FF0000', 'chase'),
                exitDelay: 0
            },
            { // Pink ghost (Pinky) - exits second
                ghost: new Ghost(10 * tileSize + tileSize/2, 9 * tileSize + tileSize/2, '#FFB8DE', 'ambush'),
                exitDelay: 1.5
            },
            { // Cyan ghost (Inky) - exits third
                ghost: new Ghost(11 * tileSize + tileSize/2, 9 * tileSize + tileSize/2, '#00FFDE', 'patrol'),
                exitDelay: 3.0
            },
            { // Orange ghost (Clyde) - exits last
                ghost: new Ghost(12 * tileSize + tileSize/2, 9 * tileSize + tileSize/2, '#FFB847', 'random'),
                exitDelay: 4.5
            }
        ];

        // Set exit delays for each ghost
        this.ghosts.forEach(ghostData => {
            ghostData.ghost.exitDelay = ghostData.exitDelay;
            ghostData.ghost.canExit = false; // Reset exit state
            ghostData.ghost.state = 'normal'; // Reset ghost state
        });

        // Extract just the ghost objects for easier access
        this.ghosts = this.ghosts.map(data => data.ghost);

        // Reset game time
        this.gameTime = 0;

        // Resize canvas to proper dimensions
        this.resizeCanvas();

        // Redraw the initial state
        this.draw();
    }

    // Development function to collect all dots
    collectAllDots() {
        if (!this.gameStarted) {
            this.startGame();
        }
        
        // Collect all dots
        for (let y = 0; y < this.maze.maze.length; y++) {
            for (let x = 0; x < this.maze.maze[y].length; x++) {
                if (this.maze.maze[y][x] === 0) {
                    this.maze.maze[y][x] = 2;
                    this.updateScore(10);
                }
            }
        }
        
        // Check win condition
        this.checkWinCondition();
    }

    // Update game state
    update() {
        // Update game time
        this.gameTime += 1/60; // Assuming 60 FPS

        // Handle input for Pac-Man movement
        this.handleInput();

        // Update Pac-Man
        this.pacman.update(this.maze);

        // Check for dot collection
        this.checkDotCollection();

        // Update ghosts in the correct order
        this.ghosts.forEach(ghost => {
            ghost.update(this.maze, this.pacman, this.gameTime);
        });

        // Check for collisions
        this.checkCollisions();
    }

    // Check for collisions between Pac-Man and ghosts
    checkCollisions() {
        const pacmanSize = this.pacman.size;
        const ghostSize = 15; // Ghost size is 15 pixels

        this.ghosts.forEach(ghost => {
            // Calculate distance between Pac-Man and ghost
            const dx = this.pacman.x - ghost.x;
            const dy = this.pacman.y - ghost.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Check if collision occurred (using size/2 as radius)
            if (distance < (pacmanSize/2 + ghostSize/2)) {
                if (ghost.state === 'frightened') {
                    // Ghost is eaten
                    ghost.state = 'eaten';
                    ghost.x = 9 * this.maze.tileSize + this.maze.tileSize/2; // Reset to ghost house
                    ghost.y = 9 * this.maze.tileSize + this.maze.tileSize/2;
                    ghost.canExit = false; // Prevent immediate exit
                    this.score += 200;
                    this.updateScore(this.score);
                } else if (ghost.state !== 'eaten') {
                    // Pac-Man is caught
                    this.resetGame();
                }
            }
        });
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