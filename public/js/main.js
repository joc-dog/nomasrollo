/**
 * MAIN JAVASCRIPT: NO MÁS ROLLO
 * Implements interactive navigation, scroll tracking, reveal animations, and form validation.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. Mobile Navigation Menu Toggle
  // ==========================================
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking on any navigation link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }


  // ==========================================
  // 2. Header Scroll Effect & Scroll Progress Bar
  // ==========================================
  const header = document.getElementById('header');
  const progressBar = document.getElementById('scroll-progress');

  const handleScrollEffects = () => {
    // Header background change on scroll
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Progress bar width calculation
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (windowHeight > 0) {
      const scrolledPercent = (window.scrollY / windowHeight) * 100;
      progressBar.style.width = `${scrolledPercent}%`;
    }
  };

  window.addEventListener('scroll', handleScrollEffects);
  handleScrollEffects(); // Run once on startup


  // ==========================================
  // 3. ScrollSpy: Highlight active link in nav menu
  // ==========================================
  const sections = document.querySelectorAll('section[id]');
  
  const scrollSpy = () => {
    const scrollPosition = window.scrollY + 120; // Offset for header height and margin

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', scrollSpy);
  scrollSpy(); // Run once on startup


  // ==========================================
  // 4. Scroll Reveal (Fade-in animations on scroll)
  // ==========================================
  const revealElements = document.querySelectorAll('.scroll-reveal');
  
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // Once revealed, we don't need to observe it anymore
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15, // Trigger when 15% of the element is visible
      rootMargin: '0px 0px -50px 0px' // Slightly negative margin to prevent immediate triggers at the bottom
    });

    revealElements.forEach(element => {
      revealObserver.observe(element);
    });
  } else {
    // Fallback if IntersectionObserver is not supported
    revealElements.forEach(element => {
      element.classList.add('revealed');
    });
  }


  // ==========================================
  // 5. Contact Lead Form Submission (Simulated Node.js API client)
  // ==========================================
  const leadForm = document.getElementById('lead-form');
  const formMsg = document.getElementById('form-msg');

  if (leadForm) {
    leadForm.addEventListener('submit', (e) => {
      e.preventDefault(); // Prevent standard page reload

      // Form data recovery
      const name = document.getElementById('form-name').value.trim();
      const email = document.getElementById('form-email').value.trim();
      const service = document.getElementById('form-service').value;
      const message = document.getElementById('form-message').value.trim();

      // UI visual feedback - Loading state
      const submitBtn = leadForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.textContent = 'Enviando...';
      submitBtn.disabled = true;
      formMsg.className = 'form-response-msg';
      formMsg.textContent = '';

      // Simulate a real POST request to backend server API
      // Since this is served by Express, we could implement a POST handler in the future.
      setTimeout(() => {
        // Simple success simulation
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
        
        formMsg.classList.add('success');
        formMsg.textContent = `¡Gracias, ${name}! Hemos recibido tu solicitud. Te contactaremos en menos de 24 horas laborables sin rodeos.`;

        // Clear the form fields
        leadForm.reset();
      }, 1500);
    });
  }
});
