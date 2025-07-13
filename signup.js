// Particle background
particlesJS("particles-js", {
	particles: {
		number: { value: 80 },
		color: { value: "#6C63FF" },
		shape: { type: "circle" },
		opacity: { value: 0.5 },
		size: { value: 3 },
		move: {
			enable: true,
			speed: 2,
			direction: "none",
			random: false,
			straight: false,
			out_mode: "out",
			bounce: false,
		},
	},
	interactivity: {
		detect_on: "canvas",
		events: {
			onhover: { enable: true, mode: "repulse" },
			onclick: { enable: true, mode: "push" },
		},
		modes: {
			repulse: { distance: 100, duration: 0.4 },
			push: { particles_nb: 4 },
		},
	},
});

// Custom cursor
const cursor = document.querySelector(".cursor");
const cursorDot = document.querySelector(".cursor-dot");

document.addEventListener("mousemove", (e) => {
	cursor.style.left = e.clientX + "px";
	cursor.style.top = e.clientY + "px";
	cursorDot.style.left = e.clientX + "px";
	cursorDot.style.top = e.clientY + "px";
});

// Hover effects
const interactiveElements = document.querySelectorAll("a, button");
interactiveElements.forEach((el) => {
	el.addEventListener("mouseenter", () => {
		cursor.style.transform = "scale(1.5)";
		cursorDot.style.transform = "scale(1.5)";
	});
	el.addEventListener("mouseleave", () => {
		cursor.style.transform = "scale(1)";
		cursorDot.style.transform = "scale(1)";
	});
});

// Form validation
document.getElementById("signup-form").addEventListener("submit", function (e) {
	e.preventDefault();

	const username = document.getElementById("username").value.trim();
	const email = document.getElementById("email").value.trim();
	const password = document.getElementById("password").value;
	const confirmPassword = document.getElementById("confirm-password").value;

// Particle background
particlesJS("particles-js", {
	particles: {
		number: { value: 80 },
		color: { value: "#6C63FF" },
		shape: { type: "circle" },
		opacity: { value: 0.5 },
		size: { value: 3 },
		move: {
			enable: true,
			speed: 2,
			direction: "none",
			random: false,
			straight: false,
			out_mode: "out",
			bounce: false,
		},
	},
	interactivity: {
		detect_on: "canvas",
		events: {
			onhover: { enable: true, mode: "repulse" },
			onclick: { enable: true, mode: "push" },
		},
		modes: {
			repulse: { distance: 100, duration: 0.4 },
			push: { particles_nb: 4 },
		},
	},
});

// Custom cursor
const cursor = document.querySelector(".cursor");
const cursorDot = document.querySelector(".cursor-dot");

document.addEventListener("mousemove", (e) => {
	cursor.style.left = e.clientX + "px";
	cursor.style.top = e.clientY + "px";
	cursorDot.style.left = e.clientX + "px";
	cursorDot.style.top = e.clientY + "px";
});

// Hover effects
const interactiveElements = document.querySelectorAll("a, button");
interactiveElements.forEach((el) => {
	el.addEventListener("mouseenter", () => {
		cursor.style.transform = "scale(1.5)";
		cursorDot.style.transform = "scale(1.5)";
	});
	el.addEventListener("mouseleave", () => {
		cursor.style.transform = "scale(1)";
		cursorDot.style.transform = "scale(1)";
	});
});


document.getElementById("signup-form").addEventListener("submit", function (e) {
	e.preventDefault();

	const username = document.getElementById("username").value.trim();
	const email = document.getElementById("email").value.trim();
	const password = document.getElementById("password").value;
	const confirmPassword = document.getElementById("confirm-password").value;

	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

	if (!passwordRegex.test(password)) {
		alert("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.");
		return;
	}

	if (password !== confirmPassword) {
		alert("Passwords do not match!");
		return;
	}

	let users = JSON.parse(localStorage.getItem("users")) || [];

	const userExists = users.some((user) => user.email === email);
	if (userExists) {
		alert("An account with this email already exists.");
		return;
	}

	const newUser = {
		username: username,
		email: email,
		password: password,
	};

	users.push(newUser);
	localStorage.setItem("users", JSON.stringify(users));

	const successBox = document.getElementById("signup-success-box");
	successBox.style.display = "block";

	setTimeout(() => {
		window.location.href = "login.html";
	}, 2000);
});
