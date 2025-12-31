// (optional) remove after confirming once
console.log('JS alive');

// === Apps Script endpoint (must end with /exec) ===
const endpoint = 'https://script.google.com/macros/s/AKfycbzAfQA0U5vK3E3wgVUIqAcelddup7h3iiR5bpwIWNryFT0w9wtMm40Xzjg9zqxo3zn9/exec';
console.log('Endpoint:', endpoint);

// === Reveal service boxes with subtle slide-in effect (kept from your code) ===
window.addEventListener('scroll', () => {
  const boxes = document.querySelectorAll('.service-box');
  boxes.forEach((box, i) => {
    const boxTop = box.getBoundingClientRect().top;
    const triggerPoint = window.innerHeight - 50;
    if (boxTop < triggerPoint) {
      setTimeout(() => {
        box.style.opacity = '1';
        box.style.transform = 'translateY(0)';
      }, i * 100);
    }
  });
});

// === Hover details helpers (kept from your code) ===
function showDetails(serviceBox) {
  const details = serviceBox.querySelector('.service-details');
  if (details) details.style.display = 'block';
}
function hideDetails(serviceBox) {
  const details = serviceBox.querySelector('.service-details');
  if (details) details.style.display = 'none';
}

// ===== One-form wiring to match your contact.html =====
(function () {
  if (!window.fetch) return;

  const $ = (id) => document.getElementById(id);

  // Elements from your contact.html
  const form         = $('contactForm');
  const btnSubmit    = $('submitBtn');
  const statusMsg    = $('form-msg');          // <p id="form-msg">
  const btnInquiry   = $('btn-inquiry');
  const btnEstimate  = $('btn-estimate');
  const modeInput    = $('mode');              // <input id="mode" name="type" value="inquiry">

  const estimateFields = $('estimateFields');  // container to show/hide
  const serviceField   = $('serviceField');

  const messageLabel = $('messageLabel');
  const message      = $('message');
  const formNote     = $('formNote');
  const serviceSelect= $('service');

  // Normalize field names so the Sheet columns are consistent
  function normalizePayload(raw) {
    const p = { ...raw };

    // Ensure we send a type that is either 'inquiry' or 'estimate'
    p.type = (p.type || (modeInput ? modeInput.value : 'inquiry')).toLowerCase();

    // preferred contact: accept either `preferred` or `contactMethod`
    if (!p.preferred && p.contactMethod) p.preferred = p.contactMethod;

    // Map message/details depending on mode
    if (p.type === 'estimate') {
      if (!p.details && p.message) p.details = p.message;
    } else {
      if (!p.message && p.details) p.message = p.details;
    }

    // Add source path for context
    p.source = window.location.pathname;
    return p;
  }

  async function sendToSheet(payload) {
    try {
      if (btnSubmit) btnSubmit.disabled = true;
      if (statusMsg) statusMsg.textContent = '';

      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors', // opaque; treat as success if no exception
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (statusMsg) {
        statusMsg.textContent = 'Thanks! We received your request.';
        statusMsg.style.color = 'green';
      }

      if (form) form.reset();
      // preserve current mode value after reset
      if (modeInput && payload.type) modeInput.value = payload.type;

    } catch (err) {
      console.error(err);
      if (statusMsg) {
        statusMsg.textContent = 'Sorry, something went wrong. Please try again.';
        statusMsg.style.color = 'red';
      }
    } finally {
      if (btnSubmit) btnSubmit.disabled = false;
    }
  }

  // Mode UI toggles
  function setMode(mode) {
    if (modeInput) modeInput.value = mode;

    const isEstimate = mode === 'estimate';
    if (btnEstimate) btnEstimate.classList.toggle('active', isEstimate);
    if (btnInquiry)  btnInquiry.classList.toggle('active', !isEstimate);

    if (estimateFields) estimateFields.classList.toggle('hidden', !isEstimate);
    if (serviceField)   serviceField.classList.toggle('hidden', !isEstimate);

    if (messageLabel) messageLabel.textContent = isEstimate ? 'Project Details' : 'Message';
    if (message) {
      message.placeholder = isEstimate
        ? 'Tell us about your project scope and any details we should know.'
        : 'How can we help?';
    }
    if (btnSubmit) btnSubmit.textContent = isEstimate ? 'Request Estimate' : 'Send Message';
    if (formNote) {
      formNote.textContent = isEstimate
        ? 'We’ll follow up to confirm any details for your estimate.'
        : 'We typically reply within 1 business day.';
    }
  }

  // Initialize mode from URL (?mode=estimate&service=...)
  function prefillFromURL() {
    let startMode = 'inquiry';
    const params = new URLSearchParams(window.location.search);

    const urlMode = (params.get('mode') || '').toLowerCase();
    if (urlMode === 'estimate') startMode = 'estimate';

    const svc = params.get('service');
    if (svc && serviceSelect) {
      const options = Array.from(serviceSelect.options).map(o => o.value.toLowerCase());
      if (!options.includes(svc.toLowerCase())) {
        const opt = document.createElement('option');
        opt.value = svc; opt.textContent = svc;
        serviceSelect.appendChild(opt);
      }
      serviceSelect.value = svc;
      startMode = 'estimate';
    }

    setMode(startMode);
  }

  // Wire buttons
  if (btnInquiry)  btnInquiry.addEventListener('click', () => setMode('inquiry'));
  if (btnEstimate) btnEstimate.addEventListener('click', () => setMode('estimate'));

  // Submit handler for the single form
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const raw = Object.fromEntries(new FormData(form).entries());

      // Honeypot: bots fill this; humans shouldn't
      if ((raw._hp || '').trim() !== '') return;

      const payload = normalizePayload(raw);
      console.log('Submitting:', payload);
      await sendToSheet(payload);
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prefillFromURL);
  } else {
    prefillFromURL();
  }
})();