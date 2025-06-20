const galaxy = document.getElementById('galaxy-bg');

  const generateStars = (count) => {
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'star';

      const size = Math.random() * 2 + 1; // 1px to 3px
      const duration = Math.random() * 5 + 5; // 5s to 10s
      const top = Math.random() * 100;
      const left = Math.random() * 100;

      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.top = `${top}vh`;
      star.style.left = `${left}vw`;
      star.style.animationDuration = `${duration}s`;

      galaxy.appendChild(star);
    }
  };

  const screenWidth = window.innerWidth;
  const starCount = screenWidth < 768 ? 50 : 150; // Responsive count
  generateStars(starCount);