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

            // Initialize canvas persistence
            this.initCanvasPersistence();

            // Initialize resize handler
            this.resizeTimeout = null;
            this.initResizeHandler();

            // Initialize DevTools detection
            this.initDevToolsDetection();

            // Initialize score
            this.score = 0;
            this.scoreDisplay = document.getElementById('scoreDisplay');
            this.scoreTitle = document.querySelector('.score-container h2');  // Add reference to score title
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

            // Initialize debug mode
            this.debugMode = false;
            
            // Add debug key listener
            window.addEventListener('keydown', (e) => {
                if (e.key === 'd') {
                    this.debugMode = !this.debugMode;
                    this.ghosts.forEach(ghost => ghost.debug = this.debugMode);
                    console.log('Debug mode:', this.debugMode ? 'ON' : 'OFF');
                }
                if (e.key === 'r' && this.debugMode) {
                    // Force respawn all eaten ghosts
                    this.ghosts.forEach(ghost => {
                        if (ghost.state === 'eaten') {
                            ghost.respawnGhost();
                        }
                    });
                }
            });

            // Initialize lives and game over state
            this.lives = 3;
            this.isGameOver = false;
            this.pacmanInvulnerable = false;

            // Create lives display
            this.livesContainer = document.createElement('div');
            this.livesContainer.className = 'lives-container';
            document.body.appendChild(this.livesContainer);
            this.updateLivesDisplay();

            // Add debug overlay
            this.debugOverlay = document.createElement('div');
            this.debugOverlay.className = 'debug-overlay';
            document.body.appendChild(this.debugOverlay);

            // Add developer mode flag
            this.developerMode = false;

            // Add keyboard event listener for developer mode
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'v') {
                    this.developerMode = !this.developerMode;
                    console.log('Developer mode:', this.developerMode ? 'ON' : 'OFF');
                }
            });

            // Draw initial state once, but don't start the game loop
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
        if (this.keys['ArrowUp'] || this.keys['w']) {
            this.pacman.nextDirection = 'up';
            if (!this.pacman.direction) {
                this.pacman.direction = 'up';
            }
        }
        if (this.keys['ArrowDown'] || this.keys['s']) {
            this.pacman.nextDirection = 'down';
            if (!this.pacman.direction) {
                this.pacman.direction = 'down';
            }
        }
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.pacman.nextDirection = 'left';
            if (!this.pacman.direction) {
                this.pacman.direction = 'left';
            }
        }
        if (this.keys['ArrowRight'] || this.keys['d']) {
            this.pacman.nextDirection = 'right';
            if (!this.pacman.direction) {
                this.pacman.direction = 'right';
            }
        }
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
            this.scoreTitle.style.display = 'none';  // Hide score title when game is won
        } else {
            this.scoreDisplay.textContent = this.score;
            this.scoreTitle.style.display = 'block';  // Show score title when game is not won
        }
    }

    // Check for dot collection
    checkDotCollection() {
        const tileSize = this.maze.getTileSize();
        const pacmanTileX = Math.floor(this.pacman.x / tileSize);
        const pacmanTileY = Math.floor(this.pacman.y / tileSize);

        // Check if Pac-Man is on a dot or special point
        const tile = this.maze.maze[pacmanTileY][pacmanTileX];
        if (tile === 0) {
            // Change the dot to an empty path (value 2)
            this.maze.maze[pacmanTileY][pacmanTileX] = 2;
            // Add points for collecting a dot
            this.updateScore(10);
            
            // Check if all dots are collected
            if (this.maze.getRemainingDots() === 0) {
                this.gameWon = true;
                this.gameStarted = false;
                this.showWinBanner();
                console.log('All dots collected! Showing win banner...');
            }
        } else if (tile === 4) {
            // Change the special point to an empty path (value 2)
            this.maze.maze[pacmanTileY][pacmanTileX] = 2;
            // Add points for collecting a special point
            this.updateScore(100);
            // Make only ghosts outside the ghost house frightened
            this.ghosts.forEach(ghost => {
                // Check if ghost is outside the ghost house (y < 9 or y > 9)
                const ghostTileY = Math.floor(ghost.y / tileSize);
                if (ghost.state !== 'eaten' && ghostTileY !== 9) {
                    ghost.state = 'frightened';
                    ghost.frightenedTimer = 0;  // Reset the frightened timer
                }
            });
        }
    }

    // Check for win condition
    checkWinCondition() {
        if (this.maze.getRemainingDots() === 0) {
            this.gameWon = true;
            this.gameStarted = false;
            this.showWinBanner();
            console.log('Game won! Showing win banner...');
        }
    }

    showWinBanner() {
        // Remove any existing overlays first
        const existingOverlay = document.querySelector('.win-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Try to find the game container
        const gameContainer = document.querySelector('.game-container');
        if (!gameContainer) {
            console.error('Game container not found!');
            return;
        }

        console.log('Creating win banner...');
        const overlay = document.createElement('div');
        overlay.className = 'win-overlay';
        
        const winText = document.createElement('div');
        winText.className = 'win-text';
        winText.textContent = 'YOU WIN!';
        
        const restartButton = document.createElement('button');
        restartButton.className = 'restart-button';
        restartButton.textContent = 'Play Again';
        restartButton.onclick = () => {
            this.resetGame();
            overlay.remove();
        };
        
        overlay.appendChild(winText);
        overlay.appendChild(restartButton);
        gameContainer.appendChild(overlay);
        
        console.log('Win banner added to game container');
    }

    // Start the game
    startGame() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.gameWon = false;
            this.score = 0;
            this.updateScore(0);
            this.lastTime = performance.now(); // Initialize lastTime when game starts
            requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }
    }

    // Reset the game
    resetGame() {
        // Reset game state
        this.lives = 3;
        this.isGameOver = false;
        this.pacmanInvulnerable = false;
        this.score = 0;
        this.updateScore(0);
        this.updateLivesDisplay();
        this.developerMode = false; // Reset developer mode

        // Reset positions
        this.resetPositions();

        // Reset maze
        this.maze = new Maze();

        // Reset game time
        this.gameTime = 0;

        // Clear any pending timers
        this.ghosts.forEach(ghost => {
            if (ghost.respawnTimer) {
                clearTimeout(ghost.respawnTimer);
            }
        });

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
        
        console.log('Starting to collect all dots...');
        let dotsCollected = 0;
        
        // Collect all dots
        for (let y = 0; y < this.maze.maze.length; y++) {
            for (let x = 0; x < this.maze.maze[y].length; x++) {
                if (this.maze.maze[y][x] === 0) {
                    this.maze.maze[y][x] = 2;
                    this.updateScore(10);
                    dotsCollected++;
                }
            }
        }
        
        console.log(`Collected ${dotsCollected} dots`);
        console.log('Remaining dots:', this.maze.getRemainingDots());
        
        // Force win condition
        this.gameWon = true;
        this.gameStarted = false;
        
        // Remove any existing overlays
        const existingOverlay = document.querySelector('.win-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Create and show win banner
        const gameContainer = document.querySelector('.game-container');
        if (!gameContainer) {
            console.error('Game container not found!');
            return;
        }
        
        console.log('Creating win banner...');
        const overlay = document.createElement('div');
        overlay.className = 'win-overlay';
        
        const winText = document.createElement('div');
        winText.className = 'win-text';
        winText.textContent = 'YOU WIN!';
        
        const restartButton = document.createElement('button');
        restartButton.className = 'restart-button';
        restartButton.textContent = 'Play Again';
        restartButton.onclick = () => {
            this.resetGame();
            overlay.remove();
        };
        
        overlay.appendChild(winText);
        overlay.appendChild(restartButton);
        gameContainer.appendChild(overlay);
        
        console.log('Win banner added to game container');
        console.log('Game container children:', gameContainer.children);
    }

    // Update game state
    update() {
        if (this.isGameOver) return;

        // Update game time
        this.gameTime += 1/60;

        // Handle input for Pac-Man movement
        this.handleInput();

        // Update Pac-Man
        this.pacman.update(this.maze);

        // Check for dot collection
        this.checkDotCollection();

        // Only update ghosts if the game has started
        if (this.gameStarted) {
            this.ghosts.forEach((ghost, index) => {
                // If ghost hasn't reached its exit delay, keep it in its initial position
                if (this.gameTime < ghost.exitDelay) {
                    const tileSize = this.maze.getTileSize();
                    ghost.x = (9 + index) * tileSize + tileSize/2;  // Maintain position in ghost house
                    ghost.y = 9 * tileSize + tileSize/2;
                    ghost.state = 'normal';
                    ghost.canExit = false;
                } else {
            ghost.update(this.maze, this.pacman, this.gameTime);
                }
        });
        }

        // Check for collisions
        this.checkCollisions();

        // Update debug overlay
        this.updateDebugOverlay();
    }

    // Check for collisions between Pac-Man and ghosts
    checkCollisions() {
        if (this.isGameOver || !this.gameStarted) return;

        const pacmanSize = this.pacman.size;
        const ghostSize = 15;

        this.ghosts.forEach(ghost => {
            const dx = this.pacman.x - ghost.x;
            const dy = this.pacman.y - ghost.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < (pacmanSize/2 + ghostSize/2)) {
                if (ghost.state === 'frightened') {
                    // Ghost is eaten
                    ghost.state = 'eaten';
                    ghost.isEaten = true;
                    ghost.respawnStartTime = this.gameTime;
                    ghost.respawnTimer = setTimeout(() => {
                        ghost.respawnGhost();
                    }, ghost.respawnDelay);
                    this.score += 200;
                    this.updateScore(this.score);
                    console.log(`Ghost ${ghost.color} eaten, respawning in 3s`);
                } else if (ghost.state !== 'eaten' && !this.pacmanInvulnerable && !this.developerMode) {
                    // Pac-Man is caught (only if not in developer mode)
                    this.handleDeath();
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
        this.ghosts.forEach(ghost => {
            // Draw ghost target lines in developer mode
            if (this.developerMode) {
                const target = ghost.determineTarget(this.pacman);
                this.ctx.beginPath();
                this.ctx.moveTo(ghost.x, ghost.y);
                this.ctx.lineTo(target.x, target.y);
                this.ctx.strokeStyle = ghost.color;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // Draw target point
                this.ctx.beginPath();
                this.ctx.arc(target.x, target.y, 3, 0, Math.PI * 2);
                this.ctx.fillStyle = ghost.color;
                this.ctx.fill();
            }
            
            ghost.draw(this.ctx);
        });
        
        // Draw score
        this.drawScore();
        
        // Draw lives
        this.drawLives();
        
        // Draw game over overlay if game is over
        if (this.isGameOver) {
            this.drawGameOver();
        }
        
        // Draw start overlay if game hasn't started
        if (!this.gameStarted) {
            this.drawStartOverlay();
        }
    }

    // Main game loop
    gameLoop(timestamp) {
        // Only run the game loop if the game has started
        if (!this.gameStarted) {
            // Just draw the initial state without updating
            this.draw();
            return;
        }

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

    updateLivesDisplay() {
        this.livesContainer.innerHTML = '';
        for (let i = 0; i < this.lives; i++) {
            const lifeIcon = document.createElement('div');
            lifeIcon.className = 'life-icon';
            this.livesContainer.appendChild(lifeIcon);
        }
    }

    updateDebugOverlay() {
        if (this.debugMode) {
            this.debugOverlay.innerHTML = `
                Lives: ${this.lives}<br>
                Game Over: ${this.isGameOver}<br>
                Invulnerable: ${this.pacmanInvulnerable}<br>
                Score: ${this.score}
            `;
            this.debugOverlay.style.display = 'block';
        } else {
            this.debugOverlay.style.display = 'none';
        }
    }

    handleDeath() {
        if (this.pacmanInvulnerable) return;

        this.lives--;
        this.updateLivesDisplay();
        console.log(`Pac-Man died! Lives remaining: ${this.lives}`);

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.resetPositions();
            this.pacmanInvulnerable = true;
            setTimeout(() => {
                this.pacmanInvulnerable = false;
            }, 2000);
        }
    }

    resetPositions() {
        const tileSize = this.maze.getTileSize();
        
        // Reset Pac-Man position
        this.pacman.x = tileSize * 1 + tileSize/2;
        this.pacman.y = tileSize * 1 + tileSize/2;
        this.pacman.direction = null;
        this.pacman.nextDirection = null;

        // Reset ghosts to their initial positions
        this.ghosts[0].x = 9 * tileSize + tileSize/2;  // Blinky
        this.ghosts[0].y = 9 * tileSize + tileSize/2;
        this.ghosts[0].state = 'normal';
        this.ghosts[0].canExit = false;
        this.ghosts[0].exitDelay = 0;

        this.ghosts[1].x = 10 * tileSize + tileSize/2;  // Pinky
        this.ghosts[1].y = 9 * tileSize + tileSize/2;
        this.ghosts[1].state = 'normal';
        this.ghosts[1].canExit = false;
        this.ghosts[1].exitDelay = 1.5;

        this.ghosts[2].x = 11 * tileSize + tileSize/2;  // Inky
        this.ghosts[2].y = 9 * tileSize + tileSize/2;
        this.ghosts[2].state = 'normal';
        this.ghosts[2].canExit = false;
        this.ghosts[2].exitDelay = 3.0;

        this.ghosts[3].x = 12 * tileSize + tileSize/2;  // Clyde
        this.ghosts[3].y = 9 * tileSize + tileSize/2;
        this.ghosts[3].state = 'normal';
        this.ghosts[3].canExit = false;
        this.ghosts[3].exitDelay = 4.5;

        // Clear any pending timers
        this.ghosts.forEach(ghost => {
            if (ghost.respawnTimer) {
                clearTimeout(ghost.respawnTimer);
            }
        });
    }

    gameOver() {
        this.isGameOver = true;
        console.log('Game Over! Final Score:', this.score);

        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <h1 class="game-over-text">GAME OVER</h1>
            <div class="final-score">Final Score: ${this.score}</div>
            <button class="restart-button" id="restart-btn">PLAY AGAIN</button>
        `;
        document.body.appendChild(overlay);

        const restartBtn = document.getElementById('restart-btn');
        restartBtn.addEventListener('click', () => {
            this.resetGame();
            overlay.remove();
        });

        // Make button keyboard accessible
        restartBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                this.resetGame();
                overlay.remove();
            }
        });
    }

    // Add new methods for canvas persistence and stability
    initCanvasPersistence() {
        // Handle context loss
        this.canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('Canvas context lost - attempting recovery');
            setTimeout(() => this.resetRenderer(), 500);
        });

        // Handle context restoration
        this.canvas.addEventListener('webglcontextrestored', () => {
            console.log('Canvas context restored');
            this.resetRenderer();
        });

        // Add visual debug mode with black outline
        this.canvas.style.outline = '2px solid rgba(0,0,0,0.5)';
    }

    initResizeHandler() {
        // Debounced resize handler
        window.addEventListener('resize', () => {
            if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.resizeCanvas();
                this.redrawMaze();
            }, 200);
        });
    }

    initDevToolsDetection() {
        // Check for DevTools
        const checkDevTools = () => {
            const widthThreshold = 100;
            const heightThreshold = 100;
            
            if (window.outerWidth - window.innerWidth > widthThreshold || 
                window.outerHeight - window.innerHeight > heightThreshold) {
                console.log('DevTools detected - enforcing render stability');
                if (!this.forceRenderInterval) {
                    this.forceRenderInterval = setInterval(() => this.draw(), 1000/60);
                }
            } else {
                if (this.forceRenderInterval) {
                    clearInterval(this.forceRenderInterval);
                    this.forceRenderInterval = null;
                }
            }
        };

        // Check periodically for DevTools
        setInterval(checkDevTools, 1000);
        checkDevTools(); // Initial check
    }

    resetRenderer() {
        console.log('Resetting renderer');
        this.resizeCanvas();
        this.redrawMaze();
    }

    redrawMaze() {
        if (this.ctx) {
            this.draw();
        }
    }

    drawScore() {
        // Implementation of drawScore method
    }

    drawLives() {
        // Implementation of drawLives method
    }

    drawGameOver() {
        // Implementation of drawGameOver method
    }

    drawStartOverlay() {
        // Implementation of drawStartOverlay method
    }
}

// Start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    new Game();
}); 