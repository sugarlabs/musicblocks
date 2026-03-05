// Mobile Enhancements for Music Blocks
// Improves touch interactions and mobile usability

(function() {
    'use strict';
    
    // Detect if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (!isMobile && !isTouch) return; // Skip if not mobile
    
    // Add mobile class to body
    document.addEventListener('DOMContentLoaded', function() {
        document.body.classList.add('mobile-device');
        if (isTouch) document.body.classList.add('touch-device');
        
        initMobileEnhancements();
    });
    
    function initMobileEnhancements() {
        // Prevent double-tap zoom on buttons
        preventDoubleTapZoom();
        
        // Improve touch scrolling
        improveTouchScrolling();
        
        // Handle orientation changes
        handleOrientationChange();
        
        // Optimize canvas for touch
        optimizeCanvasTouch();
        
        // Improve modal behavior on mobile
        improveMobileModals();
    }
    
    function preventDoubleTapZoom() {
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    function improveTouchScrolling() {
        // Add momentum scrolling to scrollable elements
        const scrollables = document.querySelectorAll('.scrollable, #palette, #toolbars');
        scrollables.forEach(function(el) {
            el.style.webkitOverflowScrolling = 'touch';
            el.style.overflowY = 'auto';
        });
    }
    
    function handleOrientationChange() {
        window.addEventListener('orientationchange', function() {
            // Give the browser time to adjust
            setTimeout(function() {
                // Recalculate canvas size
                if (window.onResize) {
                    window.onResize();
                }
                
                // Scroll to top to avoid weird positioning
                window.scrollTo(0, 0);
            }, 100);
        });
    }
    
    function optimizeCanvasTouch() {
        const canvas = document.getElementById('canvas');
        if (!canvas) return;
        
        // Prevent default touch behavior on canvas
        canvas.addEventListener('touchstart', function(e) {
            // Allow pinch zoom
            if (e.touches.length > 1) return;
            
            // Prevent page scroll when touching canvas
            e.preventDefault();
        }, { passive: false });
        
        // Improve touch responsiveness
        canvas.style.touchAction = 'pan-x pan-y pinch-zoom';
    }
    
    function improveMobileModals() {
        // Watch for modals being added
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.classList && node.classList.contains('modal')) {
                        makeModalMobileFriendly(node);
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Handle existing modals
        document.querySelectorAll('.modal').forEach(makeModalMobileFriendly);
    }
    
    function makeModalMobileFriendly(modal) {
        // Prevent body scroll when modal is open
        modal.addEventListener('shown', function() {
            document.body.style.overflow = 'hidden';
        });
        
        modal.addEventListener('hidden', function() {
            document.body.style.overflow = '';
        });
        
        // Make modal scrollable
        modal.style.maxHeight = '90vh';
        modal.style.overflowY = 'auto';
        modal.style.webkitOverflowScrolling = 'touch';
    }
    
    // Handle viewport height changes (mobile keyboard)
    let lastHeight = window.innerHeight;
    window.addEventListener('resize', function() {
        const currentHeight = window.innerHeight;
        
        // Keyboard likely opened
        if (currentHeight < lastHeight) {
            document.body.classList.add('keyboard-open');
        } else {
            document.body.classList.remove('keyboard-open');
        }
        
        lastHeight = currentHeight;
    });
    
    // Improve button tap feedback
    document.addEventListener('touchstart', function(e) {
        const target = e.target.closest('button, .btn, [role="button"]');
        if (target) {
            target.classList.add('tap-active');
        }
    });
    
    document.addEventListener('touchend', function(e) {
        const target = e.target.closest('button, .btn, [role="button"]');
        if (target) {
            setTimeout(function() {
                target.classList.remove('tap-active');
            }, 150);
        }
    });
    
    // Add visual feedback for taps
    const style = document.createElement('style');
    style.textContent = `
        .tap-active {
            opacity: 0.7;
            transform: scale(0.98);
            transition: all 0.1s ease;
        }
        
        .keyboard-open {
            /* Adjust layout when keyboard is open */
        }
    `;
    document.head.appendChild(style);
    
})();
