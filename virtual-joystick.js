export class VirtualJoystick {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            size: options.size || 150,
            color: options.color || '#FFD700',
            opacity: options.opacity || 0.5,
            ...options
        };

        this.active = false;
        this.position = { x: 0, y: 0 };
        this.direction = { x: 0, y: 0 };

        this.createElements();
        this.bindEvents();
    }

    createElements() {
        // Create joystick container
        this.joystickContainer = document.createElement('div');
        this.joystickContainer.className = 'joystick-container';
        this.joystickContainer.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            width: ${this.options.size}px;
            height: ${this.options.size}px;
            opacity: ${this.options.opacity};
            z-index: 1000;
            touch-action: none;
        `;

        // Create joystick base
        this.joystickBase = document.createElement('div');
        this.joystickBase.className = 'joystick-base';
        this.joystickBase.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            background: ${this.options.color};
            border-radius: 50%;
            opacity: 0.2;
        `;

        // Create joystick handle
        this.joystickHandle = document.createElement('div');
        this.joystickHandle.className = 'joystick-handle';
        this.joystickHandle.style.cssText = `
            position: absolute;
            width: 50%;
            height: 50%;
            background: ${this.options.color};
            border-radius: 50%;
            top: 25%;
            left: 25%;
            transition: transform 0.1s ease-out;
        `;

        this.joystickContainer.appendChild(this.joystickBase);
        this.joystickContainer.appendChild(this.joystickHandle);
        this.container.appendChild(this.joystickContainer);
    }

    bindEvents() {
        this.joystickContainer.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.joystickContainer.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.joystickContainer.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.active = true;
        this.updatePosition(e.touches[0]);
    }

    handleTouchMove(e) {
        if (!this.active) return;
        e.preventDefault();
        this.updatePosition(e.touches[0]);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.active = false;
        this.resetPosition();
    }

    updatePosition(touch) {
        const rect = this.joystickContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = touch.clientX - centerX;
        const deltaY = touch.clientY - centerY;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = this.options.size / 2;
        
        if (distance > maxDistance) {
            const angle = Math.atan2(deltaY, deltaX);
            this.position.x = Math.cos(angle) * maxDistance;
            this.position.y = Math.sin(angle) * maxDistance;
        } else {
            this.position.x = deltaX;
            this.position.y = deltaY;
        }
        
        this.direction.x = this.position.x / maxDistance;
        this.direction.y = this.position.y / maxDistance;
        
        this.updateVisuals();
    }

    resetPosition() {
        this.position = { x: 0, y: 0 };
        this.direction = { x: 0, y: 0 };
        this.updateVisuals();
    }

    updateVisuals() {
        const handleSize = this.options.size / 2;
        const maxDistance = this.options.size / 2;
        
        const x = this.position.x + maxDistance - handleSize / 2;
        const y = this.position.y + maxDistance - handleSize / 2;
        
        this.joystickHandle.style.transform = `translate(${x}px, ${y}px)`;
    }

    getDirection() {
        return this.direction;
    }

    isActive() {
        return this.active;
    }
} 