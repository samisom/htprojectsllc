alert('script.js loaded');           // temporary
console.log('JS alive');             // should appear in Console

// === Apps Script endpoint (must end with /exec) ===
const endpoint = 'https://script.google.com/macros/s/AKfycbwJAUHbDMbGxEMwOSPRn5ZsauEE9a5z7NWJOcPJZf2SzKVzNe4pnVnBvdCShvJXxRVY/exec';
console.log('Endpoint:', endpoint);

// === Reveal service boxes with subtle slide-in effect ===
window.addEventListener('scroll', () => {
  const boxes = document.querySelectorAll('.service-box');
  boxes.forEach((box, i) => {
    const boxTop = box.getBoundingClientRect().top;
    const triggerPoint = window.innerHeight - 50;
    if (boxTop < triggerPoint) {
      setTimeout(() => {
        box.style.opacity = '1';
        box.style.transform = 'translateY(0)';
      }, i * 100); // Slight stagger
    }
  });
});

// === Hover details helpers ===
function showDetails(serviceBox) {
  const details = serviceBox.querySelector('.service-details');
  if (details) details.style.display = 'block';
}
function hideDetails(serviceBox) {
  const details = serviceBox.querySelector('.service-details');
  if (details) details.style.display = 'none';
}

// --- helper: normalize field names so your sheet gets consistent columns ---
function normalizePayload(raw, type) {
  const p = { ...raw };

  // preferred contact: accept either `preferred` or `contactMethod`
  if (!p.preferred && p.contactMethod) p.preferred = p.contactMethod;

  // message/details: inquiry uses `message`, estimate uses `details`
  if (type === 'inquiry') {
    if (!p.message && p.details) p.message = p.details;
  } else if (type === 'estimate') {
    if (!p.details && p.message) p.details = p.message;
  }

  p.type = type;
  p.source = window.location.pathname;
  return p;
}

// --- shared sender ---
async function sendToSheet(payload, msgEl, btn) {
  try {
    if (btn) btn.disabled = true;
    if (msgEl) msgEl.textContent = '';

    // NOTE: no-cors ⇒ response is opaque; treat as success if no exception.
    await fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (msgEl) {
      msgEl.textContent = 'Thanks! We received your request.';
      msgEl.style.color = 'green';
    }
  } catch (err) {
    console.error(err);
    if (msgEl) {
      msgEl.textContent = 'Sorry, something went wrong. Please try again or email us.';
      msgEl.style.color = 'red';
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

// === Wire up both forms ===
(function () {
  if (!window.fetch) return;

  // --- General Inquiry ---
  const inquiryForm = document.getElementById('inquiry-form');
  if (inquiryForm) {
    const msg = document.getElementById('inquiry-msg');
    const btn = document.getElementById('inquiry-submit');

    inquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const raw = Object.fromEntries(new FormData(inquiryForm).entries());
      if ((raw._hp || '').trim() !== '') return; // honeypot
      const payload = normalizePayload(raw, 'inquiry');
      console.log('Submitting inquiry:', payload);
      await sendToSheet(payload, msg, btn);
      inquiryForm.reset();
    });
  }

  // --- Request Estimate ---
  const estimateForm = document.getElementById('estimate-form');
  if (estimateForm) {
    const msg = document.getElementById('estimate-msg');
    const btn = document.getElementById('estimate-submit');

    estimateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const raw = Object.fromEntries(new FormData(estimateForm).entries());
      if ((raw._hp || '').trim() !== '') return; // honeypot
      const payload = normalizePayload(raw, 'estimate');
      console.log('Submitting estimate:', payload);
      await sendToSheet(payload, msg, btn);
      estimateForm.reset();
    });
  }
})();