// Reveal service boxes with subtle slide-in effect
window.addEventListener("scroll", () => {
    const boxes = document.querySelectorAll(".service-box");
    boxes.forEach((box, i) => {
      const boxTop = box.getBoundingClientRect().top;
      const triggerPoint = window.innerHeight - 50;
      if (boxTop < triggerPoint) {
        setTimeout(() => {
          box.style.opacity = "1";
          box.style.transform = "translateY(0)";
        }, i * 100); // Slight stagger
      }
    });
  });
  function showDetails(serviceBox) {
    var details = serviceBox.querySelector('.service-details');
    details.style.display = 'block';  // Show the details when hovering
}

function hideDetails(serviceBox) {
    var details = serviceBox.querySelector('.service-details');
    details.style.display = 'none';  // Hide the details when not hovering
}

