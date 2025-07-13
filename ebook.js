document.addEventListener("DOMContentLoaded", () => {
	initNetworkBackground();
	initCustomCursor();
	initTiltEffect();
	initSmoothScroll();
	initAnimations();
	initCounterAnimation();
	initLoginModal();
	initUserAvatar(); // Added user avatar/login UI initialization
	initGetStartedButton();
});

// User avatar and login button display logic
function handleLogout() {
	localStorage.removeItem("currentUser");
	window.location.reload(); // refresh the page after logout
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

		// Add click event to avatar for logout
		avatar.onclick = () => {
			document.getElementById("logout-modal").style.display = "block";
		};
	} else {
		loginBtn.style.display = "inline-block";
		avatar.style.display = "none";
	}
}

// Network Background Animation
function initNetworkBackground() {
	const canvas = document.getElementById("networkCanvas");
	const ctx = canvas.getContext("2d");

	function resizeCanvas() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}

	resizeCanvas();
	window.addEventListener("resize", resizeCanvas);

	class Particle {
		constructor() {
			this.x = Math.random() * canvas.width;
			this.y = Math.random() * canvas.height;
			this.size = Math.random() * 2 + 2; // Size between 2-4
			this.speedX = (Math.random() - 0.5) * 0.5;
			this.speedY = (Math.random() - 0.5) * 0.5;
			this.color = "#6C63FF"; // Purple color matching the image
		}

		update() {
			this.x += this.speedX;
			this.y += this.speedY;
			if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
			if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
		}

		draw() {
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
			ctx.fillStyle = this.color;
			ctx.fill();
		}
	}

	const particleCount = 50;
	const particles = [];

	for (let i = 0; i < particleCount; i++) {
		particles.push(new Particle());
	}

	function connectParticles() {
		const maxDistance = 150;
		for (let i = 0; i < particles.length; i++) {
			for (let j = i + 1; j < particles.length; j++) {
				const dx = particles[i].x - particles[j].x;
				const dy = particles[i].y - particles[j].y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance < maxDistance) {
					const opacity = 1 - distance / maxDistance;
					ctx.beginPath();
					ctx.moveTo(particles[i].x, particles[i].y);
					ctx.lineTo(particles[j].x, particles[j].y);
					ctx.strokeStyle = `rgba(200, 200, 200, ${opacity * 0.5})`;
					ctx.lineWidth = 0.5;
					ctx.stroke();
				}
			}
		}
	}

	function animate() {
		ctx.fillStyle = "rgba(10, 14, 23, 0.1)"; 
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		for (let i = 0; i < particles.length; i++) {
			particles[i].update();
			particles[i].draw();
		}

		connectParticles();
		requestAnimationFrame(animate);
	}

	animate();

	let mouse = {
		x: null,
		y: null,
		radius: 150,
	};

	window.addEventListener("mousemove", (event) => {
		mouse.x = event.x;
		mouse.y = event.y;
	});

	const mouseParticles = [];
	const mouseParticleCount = 3;

	for (let i = 0; i < mouseParticleCount; i++) {
		const particle = new Particle();
		particle.size = 3;
		particle.color = "#4CAF50";
		mouseParticles.push(particle);
	}

	function updateMouseParticles() {
		for (let i = 0; i < mouseParticles.length; i++) {
			if (mouse.x && mouse.y) {
				const dx = mouse.x - mouseParticles[i].x;
				const dy = mouse.y - mouseParticles[i].y;
				mouseParticles[i].x += dx * 0.05;
				mouseParticles[i].y += dy * 0.05;

				ctx.beginPath();
				ctx.arc(
					mouseParticles[i].x,
					mouseParticles[i].y,
					mouseParticles[i].size,
					0,
					Math.PI * 2
				);
				ctx.fillStyle = mouseParticles[i].color;
				ctx.fill();

				for (let j = 0; j < particles.length; j++) {
					const dx = mouseParticles[i].x - particles[j].x;
					const dy = mouseParticles[i].y - particles[j].y;
					const distance = Math.sqrt(dx * dx + dy * dy);

					if (distance < mouse.radius) {
						const opacity = 1 - distance / mouse.radius;
						ctx.beginPath();
						ctx.moveTo(mouseParticles[i].x, mouseParticles[i].y);
						ctx.lineTo(particles[j].x, particles[j].y);
						ctx.strokeStyle = `rgba(200, 200, 200, ${opacity * 0.7})`;
						ctx.lineWidth = 0.8;
						ctx.stroke();
					}
				}
			}
		}
	}

	// Extend animate to update mouse particles
	const originalAnimate = animate;
	animate = function () {
		originalAnimate();
		updateMouseParticles();
	};
}

// Custom cursor
function initCustomCursor() {
	const cursor = document.querySelector(".cursor");
	const cursorDot = document.querySelector(".cursor-dot");

	document.addEventListener("mousemove", (e) => {
		cursor.style.left = e.clientX + "px";
		cursor.style.top = e.clientY + "px";
		cursorDot.style.left = e.clientX + "px";
		cursorDot.style.top = e.clientY + "px";
	});
}

// Tilt effect for feature cards
function initTiltEffect() {
	document.querySelectorAll(".feature-card").forEach((card) => {
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

// Smooth scroll
function initSmoothScroll() {
	document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
		anchor.addEventListener("click", function (e) {
			e.preventDefault();
			document.querySelector(this.getAttribute("href")).scrollIntoView({
				behavior: "smooth",
			});
		});
	});
}

// Intersection Observer for animations
function initAnimations() {
	const observerOptions = {
		threshold: 0.1,
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				entry.target.style.opacity = "1";
				entry.target.style.transform = "translateY(0)";
			}
		});
	}, observerOptions);

	document.querySelectorAll(".feature-card, .stat-item").forEach((el) => {
		el.style.opacity = "0";
		el.style.transform = "translateY(30px)";
		observer.observe(el);
	});
}

// Counter animation for stats
function initCounterAnimation() {
	const counters = document.querySelectorAll(".counter");
	const speed = 200;

	counters.forEach((counter) => {
		const updateCount = () => {
			const target = +counter.getAttribute("data-target");
			const count = +counter.innerText;
			const inc = target / speed;

			if (count < target) {
				counter.innerText = Math.ceil(count + inc);
				setTimeout(updateCount, 1);
			} else {
				counter.innerText = target;
			}
		};

		updateCount();
	});
}

// Login modal functionality
function initLoginModal() {
	const modal = document.getElementById("login-modal");
	const loginBtn = document.getElementById("login-btn");
	const closeBtn = document.getElementsByClassName("close")[0];

	loginBtn.onclick = function () {
		modal.style.display = "block";
	};

	closeBtn.onclick = function () {
		modal.style.display = "none";
	};

	window.onclick = function (event) {
		if (event.target == modal) {
			modal.style.display = "none";
		}
	};

	// Login form submission
	document
		.getElementById("login-form")
		.addEventListener("submit", function (e) {
			e.preventDefault();
			// Add your login logic here
			console.log("Login form submitted");
			modal.style.display = "none";
		});

	// Logout modal handlers
	document.getElementById("confirm-logout").onclick = () => {
		localStorage.removeItem("currentUser");
		location.reload();
	};

	document.getElementById("cancel-logout").onclick = () => {
		document.getElementById("logout-modal").style.display = "none";
	};

	// Close when clicking outside the modal
	window.addEventListener("click", function (event) {
		const logoutModal = document.getElementById("logout-modal");
		if (event.target === logoutModal) {
			logoutModal.style.display = "none";
		}
	});
}

function initGetStartedButton() {
	const getStartedBtn = document.getElementById("get-started-btn");

	getStartedBtn.addEventListener("click", (e) => {
		e.preventDefault();

		const currentUser = JSON.parse(localStorage.getItem("currentUser"));

		if (currentUser) {
			// Open getstarted.html in a new tab
			window.open("getstarted.html", "_blank");
		} else {
			alert("Please log in to start creating your eBook.");
			window.location.href = "/Login/login.html";
		}
	});
}

