document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleAuthBtn = document.getElementById('toggleAuthBtn');
    const switchText = document.getElementById('switchText');
    const authBox = document.getElementById('authBox');
    const toastElem = document.getElementById('toast');
    
    let isLogin = false;

    // Toast Notification System
    function showToast(message, isError = false) {
        toastElem.textContent = message;
        if (isError) {
            toastElem.classList.add('error');
        } else {
            toastElem.classList.remove('error');
        }
        toastElem.classList.add('show');
        setTimeout(() => toastElem.classList.remove('show'), 3000);
    }

    // Toggle Form Animation using GSAP
    function handleToggle() {
        isLogin = !isLogin;
        
        // Disable pointer events during animation
        authBox.style.pointerEvents = 'none';
        
        gsap.to(authBox, {
            rotationY: 90,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
                if (isLogin) {
                    registerForm.style.display = 'none';
                    loginForm.style.display = 'block';
                    switchText.innerHTML = `New user? <a id="toggleAuthBtn">Register here</a>`;
                    document.querySelector('.auth-header h1').innerText = 'MediMind AI';
                    document.querySelector('.auth-header p').innerText = 'Intelligent Healthcare Companion';
                } else {
                    loginForm.style.display = 'none';
                    registerForm.style.display = 'block';
                    switchText.innerHTML = `Already have an account? <a id="toggleAuthBtn">Login here</a>`;
                    document.querySelector('.auth-header h1').innerText = 'Create Profile';
                    document.querySelector('.auth-header p').innerText = 'Join the MediMind Network';
                }
                
                // Re-bind the dynamically changed toggle button
                document.getElementById('toggleAuthBtn').addEventListener('click', handleToggle);

                gsap.to(authBox, {
                    rotationY: 0,
                    duration: 0.4,
                    ease: "back.out(1.5)",
                    onComplete: () => {
                        authBox.style.pointerEvents = 'auto';
                    }
                });
            }
        });
    }

    toggleAuthBtn.addEventListener('click', handleToggle);

    // Handle Authentication Logic via LocalStorage
    function getUsers() {
        const users = localStorage.getItem('medimind_users');
        return users ? JSON.parse(users) : {};
    }
    
    function saveUsers(users) {
        localStorage.setItem('medimind_users', JSON.stringify(users));
    }

    // Register
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('reg-username').value.trim();
        const pass = document.getElementById('reg-password').value;
        const loader = document.getElementById('regLoader');
        
        if(user.length < 3 || pass.length < 6) {
            showToast("Username min 3, Password min 6 chars", true);
            return;
        }

        loader.style.display = 'inline-block';
        
        // Simulating network request
        setTimeout(() => {
            const users = getUsers();
            if(users[user]) {
                showToast("Username already exists", true);
            } else {
                users[user] = { password: pass, history: [] };
                saveUsers(users);
                showToast("Account created successfully!");
                // Auto switch to login
                document.getElementById('toggleAuthBtn').click();
            }
            loader.style.display = 'none';
        }, 800);
    });

    // Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('login-username').value.trim();
        const pass = document.getElementById('login-password').value;
        const loader = document.getElementById('loginLoader');

        loader.style.display = 'inline-block';

        // Simulating network request
        setTimeout(() => {
            const users = getUsers();
            if(users[user] && users[user].password === pass) {
                // Successful login
                localStorage.setItem('medimind_active_user', user);
                showToast("Login Successful! Initializing AI...");
                
                // Animate out
                gsap.to(authBox, {
                    scale: 0.8,
                    opacity: 0,
                    duration: 0.5,
                    onComplete: () => {
                        window.location.href = 'index.html'; // Navigate to chat
                    }
                });
            } else {
                showToast("Invalid Credentials", true);
            }
            loader.style.display = 'none';
        }, 800);
    });

    const splashScreen = document.getElementById('splashScreen');

    // Run Intro Splash Animation
    if (splashScreen) {
        // Hide auth box initially
        gsap.set(authBox, { opacity: 0, scale: 0.8, y: 50 });
        
        const tl = gsap.timeline({
            onComplete: () => {
                // If logged in, redirect AFTER animation finishes
                if(localStorage.getItem('medimind_active_user')) {
                    window.location.href = 'index.html';
                    return;
                }
                
                // Otherwise reveal the auth box
                splashScreen.style.display = 'none';
                gsap.to(authBox, {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    duration: 1.2,
                    ease: "elastic.out(1, 0.5)",
                    pointerEvents: "auto"
                });
            }
        });

        // 1. Text reveals with a 3D tilt
        tl.to('.splash-title', { opacity: 1, rotationX: 0, duration: 1.5, ease: "power3.out" })
          // 2. Center glow line expands
          .to('.splash-line', { width: '80%', opacity: 1, duration: 1, ease: "power2.inOut" }, "-=0.8")
          // 3. Subtitle fades in typing
          .to('.splash-subtitle', { opacity: 1, y: -10, duration: 1, ease: "power2.out" }, "-=0.5")
          // 4. Hold for drama
          .to({}, { duration: 1 })
          // 5. Epic slide out
          .to('.splash-title', { y: -50, opacity: 0, duration: 0.8, ease: "power2.in" })
          .to('.splash-line', { width: '0%', opacity: 0, duration: 0.5, ease: "power2.in" }, "<")
          .to('.splash-subtitle', { y: 20, opacity: 0, duration: 0.5, ease: "power2.in" }, "<")
          // 6. Fade the actual overlay wrapper away to reveal True 3D background behind
          .to(splashScreen, { opacity: 0, duration: 1, ease: "power2.inOut" }, "-=0.2");
          
    } else {
        // Fallback check
        if(localStorage.getItem('medimind_active_user')) {
            window.location.href = 'index.html';
        }
    }

    // Google Auth Mock Handler
    window.handleGoogleAuth = function() {
        showToast("Connecting with Google...");
        setTimeout(() => {
            const googleUser = "GoogleUser_" + Math.floor(Math.random() * 1000);
            const users = getUsers();
            if(!users[googleUser]) {
                users[googleUser] = { password: 'oauth', history: [] };
                saveUsers(users);
            }
            localStorage.setItem('medimind_active_user', googleUser);
            showToast("Google Login Successful! Initializing AI...");
            
            gsap.to(authBox, {
                scale: 0.8,
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    window.location.href = 'index.html';
                }
            });
        }, 1500);
    };
});
