(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const menuButton = $("#menuButton");
  const navigation = $("#navigation");
  const themeButton = $("#themeButton");
  const soundButton = $("#soundButton");
  const progress = $("#scrollProgress");
  const backToTop = $("#backToTop");
  let soundEnabled = false;
  let audioContext = null;

  // Mobile navigation
  menuButton.addEventListener("click", () => {
    const open = navigation.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    playTone(520, 0.035);
  });
  navigation.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.innerHTML = '<i class="fa-solid fa-bars"></i>';
  }));

  // Small Web Audio interface sounds (off by default)
  function playTone(frequency = 560, duration = 0.045) {
    if (!soundEnabled) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.035, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
    } catch (_) { /* Audio is an optional enhancement. */ }
  }
  soundButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundButton.innerHTML = soundEnabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
    soundButton.setAttribute("aria-label", soundEnabled ? "Turn sounds off" : "Turn sounds on");
    if (soundEnabled) playTone(740, 0.08);
  });

  // Switch between three accent palettes
  const themes = ["default", "violet", "blue"];
  let themeIndex = 0;
  themeButton.addEventListener("click", () => {
    themeIndex = (themeIndex + 1) % themes.length;
    if (themeIndex === 0) document.documentElement.removeAttribute("data-theme");
    else document.documentElement.dataset.theme = themes[themeIndex];
    playTone(630, 0.05);
  });

  // Typewriter role text
  const roleNode = $("#typedRole");
  const roles = ["Student Developer", "Web Explorer", "Creative Learner", "Future Software Engineer"];
  let roleIndex = 0, charIndex = 0, deleting = false;
  function typeRole() {
    const word = roles[roleIndex];
    roleNode.textContent = word.slice(0, charIndex);
    if (!deleting && charIndex < word.length) { charIndex++; setTimeout(typeRole, 82); }
    else if (!deleting) { deleting = true; setTimeout(typeRole, 1350); }
    else if (charIndex > 0) { charIndex--; setTimeout(typeRole, 38); }
    else { deleting = false; roleIndex = (roleIndex + 1) % roles.length; setTimeout(typeRole, 300); }
  }
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setTimeout(typeRole, 450);

  // Scroll reveal
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(item => observer.observe(item));
  } else revealItems.forEach(item => item.classList.add("revealed"));

  // Scroll progress, active navigation and back-to-top
  const sectionLinks = [...navigation.querySelectorAll('a[href^="#"]')];
  const sections = sectionLinks.map(link => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    backToTop.classList.toggle("visible", window.scrollY > 550);
    let current = "";
    sections.forEach(section => { if (window.scrollY >= section.offsetTop - 150) current = section.id; });
    sectionLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${current}`));
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // Resume notice: no fake PDF is linked until a real resume is added.
  const resumeModal = $("#resumeModal");
  function closeResume() { resumeModal.classList.remove("open"); resumeModal.setAttribute("aria-hidden", "true"); }
  $("#closeModal").addEventListener("click", closeResume);
  $("#modalOkay").addEventListener("click", closeResume);
  resumeModal.addEventListener("click", event => { if (event.target === resumeModal) closeResume(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeResume(); });

  // Message form prepares a draft in the visitor's email app; no data is stored.
  $("#feedbackForm").addEventListener("submit", event => {
    event.preventDefault();
    const name = $("#visitorName").value.trim();
    const message = $("#visitorMessage").value.trim();
    if (!name || !message) return;
    const subject = encodeURIComponent(`Portfolio message from ${name}`);
    const body = encodeURIComponent(`Hi Kartik,\n\n${message}\n\n— ${name}`);
    $("#formNote").textContent = "Your email app should open with the message draft. You can review it before sending.";
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  });

  // Lightweight Canvas 2D particles, responsive and reduced-motion aware.
  const canvas = $("#particleCanvas");
  const ctx = canvas.getContext("2d");
  let particles = [], width = 0, height = 0, animationFrame = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = Math.floor(width * ratio); canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.min(48, Math.floor(width / 26));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
      radius: Math.random() * 1.3 + .4
    }));
    if (reducedMotion) drawParticles(true);
  }
  function drawParticles(staticFrame = false) {
    ctx.clearRect(0, 0, width, height);
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#00e5c0";
    particles.forEach((p, index) => {
      if (!staticFrame) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = accent; ctx.globalAlpha = .42; ctx.fill(); ctx.globalAlpha = 1;
      for (let j = index + 1; j < particles.length; j++) {
        const q = particles[j], dx = p.x - q.x, dy = p.y - q.y, distance = Math.hypot(dx, dy);
        if (distance < 105) {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = accent; ctx.globalAlpha = (1 - distance / 105) * .11;
          ctx.lineWidth = .6; ctx.stroke(); ctx.globalAlpha = 1;
        }
      }
    });
    if (!staticFrame && !document.hidden) animationFrame = requestAnimationFrame(drawParticles);
  }
  resizeCanvas();
  if (!reducedMotion) drawParticles();
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { cancelAnimationFrame(animationFrame); resizeCanvas(); if (!reducedMotion) drawParticles(); }, 120);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(animationFrame);
    else if (!reducedMotion) drawParticles();
  });

  $("#currentYear").textContent = new Date().getFullYear();
})();
