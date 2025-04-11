// Touch device speed adjustment
class TouchSpeed {
    constructor() {
        this.isTouchDevice = false;
        this.speedMultiplier = 1;
        
        // Create a test element to check for touch device
        this.testElement = document.createElement('div');
        this.testElement.className = 'touch-speed-test';
        this.testElement.style.cssText = `
            position: fixed;
            pointer-events: none;
            opacity: 0;
            width: 1px;
            height: 1px;
        `;
        document.body.appendChild(this.testElement);
        
        // Add media query for touch detection
        const style = document.createElement('style');
        style.textContent = `
            @media (hover: none) {
                .touch-speed-test {
                    display: block !important;
                }
            }
            @media (hover: hover) {
                .touch-speed-test {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);
        
        this.checkTouchDevice();
        
        // Add event listeners for various events that might affect touch detection
        window.addEventListener('visibilitychange', () => this.checkTouchDevice());
        window.addEventListener('resize', () => this.checkTouchDevice());
        window.addEventListener('load', () => this.checkTouchDevice());
        
        // Check periodically to ensure touch state stays accurate
        setInterval(() => this.checkTouchDevice(), 1000);
    }

    checkTouchDevice() {
        // Check if the test element is visible (which means it's a touch device)
        const isTouchDevice = window.getComputedStyle(this.testElement).display === 'block';
        
        if (isTouchDevice) {
            this.isTouchDevice = true;
            this.speedMultiplier = 0.75; // Reduce speed by 25% on touch devices
            console.log('Touch device detected, applying 25% speed reduction');
        } else {
            this.isTouchDevice = false;
            this.speedMultiplier = 1.0;
            console.log('Non-touch device detected, using normal speed');
        }
    }

    getSpeedMultiplier() {
        // Recheck device type before returning multiplier
        this.checkTouchDevice();
        console.log('Current speed multiplier:', this.speedMultiplier);
        return this.speedMultiplier;
    }
}

// Create and export the touch speed instance
export const touchSpeed = new TouchSpeed(); 