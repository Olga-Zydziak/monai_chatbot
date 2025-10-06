(() => {
  const DEFAULT_CONTENT = window.PUBLISHING_TAB_CONTENT || {};

  const loadOverrides = () => {
    try {
      const storedValue = window.localStorage?.getItem('publishingTabContent');
      return storedValue ? JSON.parse(storedValue) : {};
    } catch (error) {
      console.warn('Unable to load stored overrides.', error);
      return {};
    }
  };

  const saveOverrides = (content) => {
    try {
      window.localStorage?.setItem('publishingTabContent', JSON.stringify(content));
      return true;
    } catch (error) {
      console.warn('Unable to persist overrides.', error);
      return false;
    }
  };

  const clearOverrides = () => {
    try {
      window.localStorage?.removeItem('publishingTabContent');
      return true;
    } catch (error) {
      console.warn('Unable to clear stored overrides.', error);
      return false;
    }
  };

  const storedOverrides = loadOverrides();
  const originalContent = { ...DEFAULT_CONTENT };
  Object.entries(storedOverrides).forEach(([key, value]) => {
    originalContent[key] = value;
  });

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
  const clearButton = document.getElementById('manager-clear');

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
      if (saveOverrides(workingCopy)) {
        originalContent[tabKey] = JSON.parse(JSON.stringify(workingCopy[tabKey] || {}));
        statusOutput.textContent = 'Preview updated. Refresh the home page to see your changes. They are stored only in this browser.';
      } else {
        statusOutput.textContent = 'Preview updated locally, but changes could not be saved for reuse in this browser.';
      }
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

  clearButton?.addEventListener('click', () => {
    if (clearOverrides()) {
      Object.keys(workingCopy).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(DEFAULT_CONTENT, key)) {
          workingCopy[key] = JSON.parse(JSON.stringify(DEFAULT_CONTENT[key] || {}));
        } else {
          delete workingCopy[key];
        }
      });

      Object.keys(originalContent).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(DEFAULT_CONTENT, key)) {
          originalContent[key] = JSON.parse(JSON.stringify(DEFAULT_CONTENT[key] || {}));
        } else {
          delete originalContent[key];
        }
      });

      Object.keys(DEFAULT_CONTENT).forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(workingCopy, key)) {
          workingCopy[key] = JSON.parse(JSON.stringify(DEFAULT_CONTENT[key] || {}));
        }
        if (!Object.prototype.hasOwnProperty.call(originalContent, key)) {
          originalContent[key] = JSON.parse(JSON.stringify(DEFAULT_CONTENT[key] || {}));
        }
      });
      syncForm(tabSelect.value);
      statusOutput.textContent = 'Stored changes removed. The manager now reflects the default configuration.';
    } else {
      statusOutput.textContent = 'Unable to clear stored changes. Please check your browser permissions.';
    }
    renderOutput();
  });

  if (tabSelect) {
    syncForm(tabSelect.value);
  }

  renderOutput();
})();
