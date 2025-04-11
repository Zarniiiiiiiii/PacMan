// Standalone joystick implementation for touchscreens
class Joystick {
    constructor() {
        this.joystick = null;
        this.joystickBase = null;
        this.joystickHandle = null;
        this.isActive = false;
        this.currentDirection = null;
        this.touchId = null;
        this.centerX = 0;
        this.centerY = 0;
        this.maxDistance = 50;
        this.pacman = null;
        this.maze = null;
        this.keys = {};  // Add keys object to match game's input system

        // Create joystick elements immediately
        this.createJoystickElements();
        
        // Add touch event listeners
        this.joystickHandle.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // Start the joystick update loop
        this.updateLoop();
    }

    setPacman(pacman, maze) {
        this.pacman = pacman;
        this.maze = maze;
    }

    updateLoop() {
        if (this.isActive && this.pacman && this.maze) {
            // Update keys based on current direction
            this.updateKeys();
        } else {
            // Clear all keys when not active
            this.keys = {};
        }
        requestAnimationFrame(() => this.updateLoop());
    }

    updateKeys() {
        // Clear previous keys
        this.keys = {};
        
        // Set the appropriate key based on current direction
        switch(this.currentDirection) {
            case 'up':
                this.keys['ArrowUp'] = true;
                break;
            case 'down':
                this.keys['ArrowDown'] = true;
                break;
            case 'left':
                this.keys['ArrowLeft'] = true;
                break;
            case 'right':
                this.keys['ArrowRight'] = true;
                break;
        }
    }

    createJoystickElements() {
        // Create joystick container
        this.joystick = document.createElement('div');
        this.joystick.className = 'joystick-container';
        this.joystick.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 100px;
            height: 100px;
            z-index: 1000;
            display: block;
            touch-action: none;
        `;

        // Create joystick base
        this.joystickBase = document.createElement('div');
        this.joystickBase.className = 'joystick-base';
        this.joystickBase.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            backdrop-filter: blur(5px);
            border: 2px solid rgba(255, 255, 255, 0.3);
        `;

        // Create joystick handle
        this.joystickHandle = document.createElement('div');
        this.joystickHandle.className = 'joystick-handle';
        this.joystickHandle.style.cssText = `
            position: absolute;
            width: 50%;
            height: 50%;
            background: rgba(255, 255, 255, 0.4);
            border-radius: 50%;
            top: 25%;
            left: 25%;
            transition: transform 0.1s ease;
            border: 2px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        `;

        // Append elements
        this.joystick.appendChild(this.joystickBase);
        this.joystick.appendChild(this.joystickHandle);
        document.body.appendChild(this.joystick);

        // Add media query for non-touch devices
        const style = document.createElement('style');
        style.textContent = `
            @media (hover: hover) {
                .joystick-container {
                    display: none !important;
                }
            }
            @media (hover: none) {
                .joystick-container {
                    display: block !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (this.isActive) return;

        const touch = e.touches[0];
        this.touchId = touch.identifier;
        this.isActive = true;
        
        // Get joystick center position
        const rect = this.joystick.getBoundingClientRect();
        this.centerX = rect.left + rect.width / 2;
        this.centerY = rect.top + rect.height / 2;

        // Initialize direction immediately on touch start
        const dx = touch.clientX - this.centerX;
        const dy = touch.clientY - this.centerY;
        const angle = Math.atan2(dy, dx);
        this.updateDirection(angle);
    }

    handleTouchMove(e) {
        if (!this.isActive) return;

        // Find the correct touch
        const touch = Array.from(e.touches).find(t => t.identifier === this.touchId);
        if (!touch) return;

        e.preventDefault();

        // Calculate distance and angle
        const dx = touch.clientX - this.centerX;
        const dy = touch.clientY - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Limit joystick movement
        const limitedDistance = Math.min(distance, this.maxDistance);
        const limitedX = Math.cos(angle) * limitedDistance;
        const limitedY = Math.sin(angle) * limitedDistance;

        // Update joystick handle position
        this.joystickHandle.style.transform = `translate(${limitedX}px, ${limitedY}px)`;

        // Determine direction based on angle
        this.updateDirection(angle);
    }

    handleTouchEnd(e) {
        if (!this.isActive) return;

        // Check if the ended touch is our active touch
        const touch = Array.from(e.changedTouches).find(t => t.identifier === this.touchId);
        if (!touch) return;

        e.preventDefault();

        this.isActive = false;
        this.currentDirection = null;
        this.touchId = null;
        this.keys = {};  // Clear keys when touch ends
        
        // Reset joystick handle position
        this.joystickHandle.style.transform = 'translate(0, 0)';
    }

    updateDirection(angle) {
        // Convert angle to direction
        const angleDeg = (angle * 180) / Math.PI;
        
        if (angleDeg >= -45 && angleDeg < 45) {
            this.currentDirection = 'right';
        } else if (angleDeg >= 45 && angleDeg < 135) {
            this.currentDirection = 'down';
        } else if (angleDeg >= 135 || angleDeg < -135) {
            this.currentDirection = 'left';
        } else {
            this.currentDirection = 'up';
        }
    }
}

// Create and export the joystick instance
export const joystick = new Joystick(); 