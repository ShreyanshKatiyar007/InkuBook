document.addEventListener("DOMContentLoaded", () => {
	// Initialize all components
	initNetworkAnimation();
	initCustomCursor();
	initScrollReveal();
	initTiltEffect();
	initSmoothScroll();
	initLoginModal();
	initUserAvatar();
	initLogoutModal();
});

// Network animation
function initNetworkAnimation() {
	const canvas = document.getElementById("network-canvas");
	if (!canvas) return;

	const ctx = canvas.getContext("2d");

	// Set canvas to full window size
	function resizeCanvas() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}

	resizeCanvas();
	window.addEventListener("resize", resizeCanvas);

	// Node class
	class Node {
		constructor(x, y) {
			this.x = x;
			this.y = y;
			this.size = Math.random() * 2 + 2;
			this.speedX = Math.random() * 0.5 - 0.25;
			this.speedY = Math.random() * 0.5 - 0.25;
			this.color = "#6c63ff";
		}

		update() {
			// Move the node
			this.x += this.speedX;
			this.y += this.speedY;

			// Bounce off edges
			if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
			if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
		}

		draw() {
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
			ctx.fillStyle = this.color;
			ctx.fill();
		}
	}

	// Create nodes
	const nodeCount = Math.floor(
		(window.innerWidth * window.innerHeight) / 15000
	);
	const nodes = [];

	for (let i = 0; i < nodeCount; i++) {
		const x = Math.random() * canvas.width;
		const y = Math.random() * canvas.height;
		nodes.push(new Node(x, y));
	}

	// Draw connections between nodes
	function drawConnections() {
		ctx.strokeStyle = "rgba(108, 99, 255, 0.15)";
		ctx.lineWidth = 0.5;

		for (let i = 0; i < nodes.length; i++) {
			for (let j = i + 1; j < nodes.length; j++) {
				const dx = nodes[i].x - nodes[j].x;
				const dy = nodes[i].y - nodes[j].y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				// Only connect nodes that are close enough
				const maxDistance = 150;
				if (distance < maxDistance) {
					// Opacity based on distance
					const opacity = 1 - distance / maxDistance;
					ctx.strokeStyle = `rgba(108, 99, 255, ${opacity * 0.2})`;

					ctx.beginPath();
					ctx.moveTo(nodes[i].x, nodes[i].y);
					ctx.lineTo(nodes[j].x, nodes[j].y);
					ctx.stroke();
				}
			}
		}
	}

	// Interactive node that follows mouse
	let mouseNode = null;

	canvas.addEventListener("mousemove", (e) => {
		if (!mouseNode) {
			mouseNode = new Node(e.clientX, e.clientY);
			mouseNode.size = 0; // Make it invisible
		} else {
			mouseNode.x = e.clientX;
			mouseNode.y = e.clientY;
		}
	});

	// Animation loop
	function animate() {
		// Clear canvas with semi-transparent background for trail effect
		ctx.fillStyle = "rgba(7, 10, 18, 0.1)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Update and draw nodes
		nodes.forEach((node) => {
			node.update();
			node.draw();
		});

		// Draw connections
		drawConnections();

		// Draw connections to mouse node
		if (mouseNode) {
			nodes.forEach((node) => {
				const dx = mouseNode.x - node.x;
				const dy = mouseNode.y - node.y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				const maxDistance = 200;
				if (distance < maxDistance) {
					const opacity = 1 - distance / maxDistance;
					ctx.strokeStyle = `rgba(108, 99, 255, ${opacity * 0.5})`;

					ctx.beginPath();
					ctx.moveTo(mouseNode.x, mouseNode.y);
					ctx.lineTo(node.x, node.y);
					ctx.stroke();
				}
			});
		}

		requestAnimationFrame(animate);
	}

	animate();
}

// Custom cursor implementation
function initCustomCursor() {
	const cursor = document.querySelector(".cursor");
	const cursorDot = document.querySelector(".cursor-dot");

	if (!cursor || !cursorDot) return;

	// Set initial position to center of screen to avoid jumps
	cursor.style.top = "50%";
	cursor.style.left = "50%";
	cursorDot.style.top = "50%";
	cursorDot.style.left = "50%";

	// Track if mouse is on page
	let isMouseOnPage = false;

	// Update cursor position with requestAnimationFrame for smoother movement
	let mouseX = 0,
		mouseY = 0;
	let cursorX = 0,
		cursorY = 0;
	let cursorDotX = 0,
		cursorDotY = 0;

	document.addEventListener("mousemove", (e) => {
		isMouseOnPage = true;
		mouseX = e.clientX;
		mouseY = e.clientY;
	});

	document.addEventListener("mouseenter", () => {
		isMouseOnPage = true;
		cursor.style.opacity = "1";
		cursorDot.style.opacity = "1";
	});

	document.addEventListener("mouseleave", () => {
		isMouseOnPage = false;
		cursor.style.opacity = "0";
		cursorDot.style.opacity = "0";
	});

	// Handle cursor effects on interactive elements
	const interactiveElements = document.querySelectorAll(
		"a, button, input, .about-feature-card"
	);

	interactiveElements.forEach((el) => {
		el.addEventListener("mouseenter", () => {
			cursor.style.width = "40px";
			cursor.style.height = "40px";
			cursor.style.borderColor = "var(--secondary)";
		});

		el.addEventListener("mouseleave", () => {
			cursor.style.width = "20px";
			cursor.style.height = "20px";
			cursor.style.borderColor = "var(--primary)";
		});
	});

	// Smooth cursor animation
	function updateCursor() {
		if (!isMouseOnPage) return requestAnimationFrame(updateCursor);

		// Smooth follow for main cursor (slower)
		cursorX += (mouseX - cursorX) * 0.1;
		cursorY += (mouseY - cursorY) * 0.1;

		// Faster follow for cursor dot
		cursorDotX += (mouseX - cursorDotX) * 0.5;
		cursorDotY += (mouseY - cursorDotY) * 0.5;

		cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
		cursorDot.style.transform = `translate(${cursorDotX}px, ${cursorDotY}px)`;

		requestAnimationFrame(updateCursor);
	}

	updateCursor();
}

// Scroll reveal animation
function initScrollReveal() {
	const observerOptions = {
		threshold: 0.1,
		rootMargin: "0px 0px -50px 0px",
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				entry.target.classList.add("revealed");
				observer.unobserve(entry.target);
			}
		});
	}, observerOptions);

	// Apply initial styles and observe elements
	const revealElements = document.querySelectorAll(
		".about-feature-card, .mission-content"
	);
	revealElements.forEach((el) => {
		el.style.opacity = "0";
		el.style.transform = "translateY(30px)";
		el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
		observer.observe(el);
	});

	// Add CSS class for revealed elements
	document.head.insertAdjacentHTML(
		"beforeend",
		`<style>
        .revealed {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      </style>`
	);
}

// 3D tilt effect for feature cards
function initTiltEffect() {
	document.querySelectorAll(".about-feature-card").forEach((card) => {
		card.addEventListener("mousemove", (e) => {
			const rect = card.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			const centerX = rect.width / 2;
			const centerY = rect.height / 2;

			const rotateX = (y - centerY) / 10;
			const rotateY = (centerX - x) / 10;

			card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
		});

		card.addEventListener("mouseleave", () => {
			card.style.transform = "perspective(1000px) rotateX(0) rotateY(0)";
		});
	});
}

// Smooth scroll for anchor links
function initSmoothScroll() {
	document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
		anchor.addEventListener("click", function (e) {
			const targetId = this.getAttribute("href");
			if (targetId === "#") return;

			const targetElement = document.querySelector(targetId);
			if (targetElement) {
				e.preventDefault();
				targetElement.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}
		});
	});
}

// Login modal functionality
function initLoginModal() {
	const modal = document.getElementById("login-modal");
	const loginBtn = document.getElementById("login-btn");
	const closeBtn = document.getElementsByClassName("close")[0];

	if (!modal || !loginBtn || !closeBtn) return;

	loginBtn.addEventListener("click", () => {
		modal.style.display = "block";
	});

	closeBtn.addEventListener("click", () => {
		modal.style.display = "none";
	});

	window.addEventListener("click", (event) => {
		if (event.target === modal) {
			modal.style.display = "none";
		}
	});

	// Login form submission
	const loginForm = document.getElementById("login-form");
	if (loginForm) {
		loginForm.addEventListener("submit", (e) => {
			e.preventDefault();
			// Add your login logic here
			console.log("Login form submitted");
			modal.style.display = "none";
		});
	}
}

function initUserAvatar() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const avatar = document.getElementById("user-avatar");
    const loginBtn = document.getElementById("login-btn");

    if (currentUser) {
        loginBtn.style.display = "none";
        const emailInitial = currentUser.email.charAt(0).toUpperCase();
        avatar.textContent = emailInitial;
        avatar.style.display = "flex";

        // Show logout modal on click
        avatar.onclick = () => {
            document.getElementById("logout-modal").style.display = "block";
        };
    } else {
        loginBtn.style.display = "inline-block";
        avatar.style.display = "none";
    }
}

function initLogoutModal() {
    const confirmBtn = document.getElementById("confirm-logout");
    const cancelBtn = document.getElementById("cancel-logout");
    const logoutModal = document.getElementById("logout-modal");

    if (!confirmBtn || !cancelBtn || !logoutModal) return;

    confirmBtn.onclick = () => {
        localStorage.removeItem("currentUser");
        location.reload();
    };

    cancelBtn.onclick = () => {
        logoutModal.style.display = "none";
    };

    window.onclick = (event) => {
        if (event.target === logoutModal) {
            logoutModal.style.display = "none";
        }
    };
}

