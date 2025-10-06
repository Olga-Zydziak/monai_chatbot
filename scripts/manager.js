(() => {
  const originalContent = window.PUBLISHING_TAB_CONTENT || {};
  const workingCopy = JSON.parse(JSON.stringify(originalContent));

  const tabSelect = document.getElementById('manager-tab');
  const titleInput = document.getElementById('manager-title');
  const bodyInput = document.getElementById('manager-body');
  const statusOutput = document.getElementById('manager-status');
  const resetButton = document.getElementById('manager-reset');
  const contactFieldset = document.querySelector('[data-manager-contact]');
  const phoneInput = document.getElementById('manager-phone');
  const emailInput = document.getElementById('manager-email');
  const recipientInput = document.getElementById('manager-recipient');
  const endpointInput = document.getElementById('manager-endpoint');
  const submittingInput = document.getElementById('manager-submitting');
  const successInput = document.getElementById('manager-success');
  const errorInput = document.getElementById('manager-error');
  const outputTarget = document.getElementById('manager-output');
  const formElement = document.getElementById('content-manager-form');

  const formatBodyForInput = (body = []) =>
    body
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry;
        }

        if (entry?.type === 'list' && Array.isArray(entry.items)) {
          return entry.items.map((item) => `- ${item}`).join('\n');
        }

        return '';
      })
      .filter(Boolean)
      .join('\n\n');

  const parseInputToBody = (value) => {
    const segments = value
      .split(/\n\s*\n/g)
      .map((segment) => segment.trim())
      .filter(Boolean);

    return segments.map((segment) => {
      const lines = segment
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const listItems = lines
        .filter((line) => /^[-•]/.test(line))
        .map((line) => line.replace(/^[-•]\s*/, '').trim())
        .filter(Boolean);

      if (listItems.length && listItems.length === lines.length) {
        return { type: 'list', items: listItems };
      }

      return lines.join(' ');
    });
  };

  const renderOutput = () => {
    outputTarget.textContent = `window.PUBLISHING_TAB_CONTENT = ${JSON.stringify(workingCopy, null, 2)};`;
  };

  const syncForm = (tabKey) => {
    const content = workingCopy[tabKey];
    if (!content) {
      titleInput.value = '';
      bodyInput.value = '';
      if (contactFieldset) {
        contactFieldset.hidden = true;
      }
      return;
    }

    titleInput.value = content.title || '';
    bodyInput.value = formatBodyForInput(content.body || []);

    if (contactFieldset) {
      const isContact = tabKey === 'contact';
      contactFieldset.hidden = !isContact;

      if (isContact) {
        const details = content.contactDetails || {};
        phoneInput.value = details.phoneNumber || '';
        emailInput.value = details.emailAddress || '';
        recipientInput.value = details.formRecipient || '';
        endpointInput.value = details.formEndpoint || '';
        submittingInput.value = details.submittingMessage || '';
        successInput.value = details.successMessage || '';
        errorInput.value = details.errorMessage || '';
      }
    }

    statusOutput.textContent = '';
  };

  const updateWorkingCopy = (tabKey) => {
    const titleValue = titleInput.value.trim();
    const bodyValue = bodyInput.value.trim();

    if (!titleValue || !bodyValue) {
      statusOutput.textContent = 'Please complete the title and body before updating the configuration.';
      return false;
    }

    const nextContent = {
      title: titleValue,
      body: parseInputToBody(bodyValue)
    };

    if (tabKey === 'contact') {
      const phoneValue = phoneInput.value.trim();
      const displayEmail = emailInput.value.trim();
      const recipientValue = recipientInput.value.trim();
      const endpointValue = endpointInput.value.trim();

      if (!phoneValue || !displayEmail || !recipientValue) {
        statusOutput.textContent = 'Please provide the phone number, displayed email, and recipient email for the contact section.';
        return false;
      }

      nextContent.contactDetails = {
        phoneLabel: 'Phone',
        phoneNumber: phoneValue,
        emailLabel: 'Email',
        emailAddress: displayEmail,
        formRecipient: recipientValue,
        formEndpoint: endpointValue,
        submittingMessage: submittingInput.value.trim() || 'Sending your message…',
        successMessage: successInput.value.trim() || 'Thank you! We will reply shortly.',
        errorMessage: errorInput.value.trim() || 'Sorry, something went wrong. Please try again later.'
      };
    }

    workingCopy[tabKey] = nextContent;
    return true;
  };

  tabSelect?.addEventListener('change', () => {
    syncForm(tabSelect.value);
  });

  formElement?.addEventListener('submit', (event) => {
    event.preventDefault();
    const tabKey = tabSelect.value;

    if (updateWorkingCopy(tabKey)) {
      statusOutput.textContent = 'Configuration updated. Copy the code below into scripts/tab-content.js.';
      renderOutput();
    }
  });

  resetButton?.addEventListener('click', () => {
    const tabKey = tabSelect.value;
    workingCopy[tabKey] = JSON.parse(JSON.stringify(originalContent[tabKey] || {}));
    syncForm(tabKey);
    statusOutput.textContent = 'Form reset to the saved configuration.';
    renderOutput();
  });

  if (tabSelect) {
    syncForm(tabSelect.value);
  }

  renderOutput();
})();
