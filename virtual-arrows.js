// Virtual arrow pad implementation for touchscreens
class VirtualArrows {
    constructor() {
        this.keys = {};
        this.container = null;
        this.arrows = {
            up: null,
            down: null,
            left: null,
            right: null
        };

        // Create the virtual arrow pad immediately
        this.createArrowPad();
        
        // Add touch event listeners
        this.setupTouchEvents();
    }

    createArrowPad() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'virtual-arrows-container';
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 150px;
            height: 150px;
            z-index: 1000;
            display: none;
            touch-action: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        `;

        // Create arrow buttons
        this.arrows.up = this.createArrowButton('up', '↑');
        this.arrows.down = this.createArrowButton('down', '↓');
        this.arrows.left = this.createArrowButton('left', '←');
        this.arrows.right = this.createArrowButton('right', '→');

        // Position arrows
        this.arrows.up.style.top = '0';
        this.arrows.up.style.left = '50%';
        this.arrows.up.style.transform = 'translateX(-50%)';

        this.arrows.down.style.bottom = '0';
        this.arrows.down.style.left = '50%';
        this.arrows.down.style.transform = 'translateX(-50%)';

        this.arrows.left.style.left = '0';
        this.arrows.left.style.top = '50%';
        this.arrows.left.style.transform = 'translateY(-50%)';

        this.arrows.right.style.right = '0';
        this.arrows.right.style.top = '50%';
        this.arrows.right.style.transform = 'translateY(-50%)';

        // Append arrows to container
        Object.values(this.arrows).forEach(arrow => {
            this.container.appendChild(arrow);
        });

        // Add container to body
        document.body.appendChild(this.container);

        // Add media query for non-touch devices
        const style = document.createElement('style');
        style.textContent = `
            @media (hover: hover) {
                .virtual-arrows-container {
                    display: none !important;
                }
            }
            @media (hover: none) {
                .virtual-arrows-container {
                    display: block !important;
                }
            }
            .arrow-button {
                position: absolute;
                width: 40px;
                height: 40px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                color: white;
                border: 2px solid rgba(255, 255, 255, 0.3);
                backdrop-filter: blur(5px);
                transition: all 0.1s ease;
                user-select: none;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                touch-action: none;
            }
            .arrow-button:active {
                background: rgba(255, 255, 255, 0.4);
                transform: scale(0.95);
            }
        `;
        document.head.appendChild(style);
    }

    createArrowButton(direction, symbol) {
        const button = document.createElement('div');
        button.className = 'arrow-button';
        button.textContent = symbol;
        button.dataset.direction = direction;
        return button;
    }

    setupTouchEvents() {
        // Handle touch start
        Object.entries(this.arrows).forEach(([direction, button]) => {
            const keyName = `Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
            
            // Use pointer events instead of touch events
            button.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                this.keys[keyName] = true;
                button.style.background = 'rgba(255, 255, 255, 0.4)';
            });

            button.addEventListener('pointerup', (e) => {
                e.preventDefault();
                this.keys[keyName] = false;
                button.style.background = 'rgba(255, 255, 255, 0.2)';
            });

            button.addEventListener('pointerleave', (e) => {
                e.preventDefault();
                this.keys[keyName] = false;
                button.style.background = 'rgba(255, 255, 255, 0.2)';
            });
        });
    }
}

// Create and export the virtual arrows instance
export const virtualArrows = new VirtualArrows(); 