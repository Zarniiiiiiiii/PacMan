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

// Ghost class for enemy characters
export class Ghost {
    constructor(x, y, size, color, direction) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.direction = direction;
        this.speed = 2;
        this.visualSize = size * 0.6; // Reduced from 0.8 to 0.6 to make ghosts smaller
    }

    draw(ctx) {
        ctx.save();
        
        // Move origin to ghost's position
        ctx.translate(this.x, this.y);
        
        // Draw ghost body
        ctx.fillStyle = this.color;
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

    update(maze) {
        const tileSize = maze.getTileSize();
        const tileX = Math.floor(this.x / tileSize);
        const tileY = Math.floor(this.y / tileSize);
        
        // Simple movement based on current direction
        let nextX = this.x;
        let nextY = this.y;
        
        switch(this.direction) {
            case 'up':
                nextY -= this.speed;
                break;
            case 'down':
                nextY += this.speed;
                break;
            case 'left':
                nextX -= this.speed;
                break;
            case 'right':
                nextX += this.speed;
                break;
        }
        
        // Check if next position is valid
        if (!maze.checkCollision(nextX, nextY, this.size)) {
            this.x = nextX;
            this.y = nextY;
        } else {
            // If we hit a wall, change direction randomly
            const directions = ['up', 'down', 'left', 'right'];
            this.direction = directions[Math.floor(Math.random() * directions.length)];
        }
    }
} 