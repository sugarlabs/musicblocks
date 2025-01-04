document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');
    
    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        enableDarkMode();
    }

    darkModeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        if (document.documentElement.classList.contains('dark-mode')) {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
    });

    function enableDarkMode() {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
        darkModeIcon.textContent = 'brightness_7';

        // Update stage background
        if (window.stage) {
            stage.canvas.style.backgroundColor = '#1a1a1a';
            
            // Clear stage and redraw with dark background
            stage.clear();
            const darkBg = new createjs.Shape();
            darkBg.graphics.beginFill('#1a1a1a').drawRect(0, 0, stage.canvas.width, stage.canvas.height);
            stage.addChildAt(darkBg, 0);
            stage.update();
        }

        // Update canvas element
        const canvas = document.getElementById('canvas');
        if (canvas) {
            canvas.style.backgroundColor = '#1a1a1a';
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }

        // Force dark mode on workspace container
        const workspaceContainer = document.querySelector('.canvasHolder');
        if (workspaceContainer) {
            workspaceContainer.style.backgroundColor = '#1a1a1a';
        }
    }

    function disableDarkMode() {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
        darkModeIcon.textContent = 'brightness_4';

        // Restore stage background
        if (window.stage) {
            stage.canvas.style.backgroundColor = '#ffffff';
            stage.clear();
            stage.update();
        }

        // Restore canvas background
        const canvas = document.getElementById('canvas');
        if (canvas) {
            canvas.style.backgroundColor = '#ffffff';
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }
}); 