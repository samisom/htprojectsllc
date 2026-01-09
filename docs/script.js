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

// === Apps Script endpoint (must end with /exec) ===
const endpoint = 'https://script.google.com/macros/s/AKfycby6l6s3-Qa0t4Yqjg6ad8UqrY6K2ctrjyACvUud7zbsCwVRiqekoddfcambaRD312XB/exec';

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

  // Normalize field names to match the Apps Script expectations (lowercase + header keys).
  function normalizePayload(raw) {
    const type = (raw.type || (modeInput ? modeInput.value : 'inquiry')).toLowerCase();
    const typeLabel = type === 'estimate' ? 'Estimate' : 'Inquiry';
    const message = raw.message || raw.details || '';
    const preferred = raw.contactMethod || raw.preferred || '';
    const zipValue = raw.zip || '';
    const sourcePath = window.location.pathname;

    return {
      type,
      Type: typeLabel,
      name: raw.name || '',
      Name: raw.name || '',
      email: raw.email || '',
      Email: raw.email || '',
      phone: raw.phone || '',
      Phone: raw.phone || '',
      address: raw.address || '',
      Address: raw.address || '',
      zip: zipValue,
      ZIP: zipValue,
      contactMethod: preferred,
      PreferredContact: preferred,
      service: raw.service || '',
      Service: raw.service || '',
      timeline: raw.timeline || '',
      Timeline: raw.timeline || '',
      budget: raw.budget || '',
      Budget: raw.budget || '',
      message,
      Message: message,
      source: sourcePath,
      SourcePage: sourcePath,
    };
  }

  function showStatus(messageText, color = 'green') {
    if (statusMsg) {
      statusMsg.textContent = messageText;
      statusMsg.style.color = color;
    }
  }

  async function sendToSheet(payload) {

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('Contact form response:', response.status, responseText);

    let data = {};
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (err) {
        throw new Error(`Invalid JSON response: ${responseText.slice(0, 200)}`);
      }
    }

        if (!response.ok || !data.ok) {
      throw new Error(data.error || `Request failed (${response.status})`);
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
      const submittedMode = (raw.type || (modeInput ? modeInput.value : 'inquiry')).toLowerCase();

      try {
        if (btnSubmit) btnSubmit.disabled = true;
        showStatus('');
        await sendToSheet(payload);
        showStatus('Thanks! We received your request.');
        if (form) form.reset();
        setMode(submittedMode);
      } catch (err) {
        console.error(err);
        const message = err && err.message ? err.message : '';
        if (message.includes('Failed to fetch')) {
          showStatus('Network error. Confirm your Apps Script is deployed and the URL ends with /exec.', 'red');
          return;
        }
        showStatus(message || 'Sorry, something went wrong. Please try again.', 'red');
      } finally {
        if (btnSubmit) btnSubmit.disabled = false;
      }
    });
  }


  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prefillFromURL);
  } else {
    prefillFromURL();
  }
})();