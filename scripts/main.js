(() => {
  const DEFAULT_TAB_CONTENT = window.PUBLISHING_TAB_CONTENT || {};

  const loadOverrides = () => {
    try {
      const storedValue = window.localStorage?.getItem('publishingTabContent');
      return storedValue ? JSON.parse(storedValue) : {};
    } catch (error) {
      console.warn('Unable to load stored tab content overrides.', error);
      return {};
    }
  };

  const mergeContent = (base, overrides) => {
    const merged = { ...base };
    Object.entries(overrides || {}).forEach(([key, value]) => {
      if (value == null) {
        return;
      }

      const baseValue = base[key];

      if (Array.isArray(value)) {
        merged[key] = value.slice();
        return;
      }

      if (typeof value === 'object') {
        const nextValue = { ...(typeof baseValue === 'object' && !Array.isArray(baseValue) ? baseValue : {}), ...value };

        if (Array.isArray(value.body)) {
          nextValue.body = value.body.slice();
        }

        if (value.contactDetails || baseValue?.contactDetails) {
          nextValue.contactDetails = {
            ...(baseValue?.contactDetails || {}),
            ...(value.contactDetails || {})
          };
        }

        merged[key] = nextValue;
        return;
      }

      merged[key] = value;
    });
    return merged;
  };

  const TAB_CONTENT = mergeContent(DEFAULT_TAB_CONTENT, loadOverrides());

  const tabButtons = document.querySelectorAll('.tabs__button');
  const tabPanel = document.getElementById('tab-panel');
  const tabPanelTitle = document.getElementById('tab-panel-title');
  const tabPanelBody = document.getElementById('tab-panel-body');

  const createParagraph = (text) => {
    const paragraphElement = document.createElement('p');
    paragraphElement.className = 'panels__text';
    paragraphElement.textContent = text;
    return paragraphElement;
  };

  const createList = (items) => {
    const listElement = document.createElement('ul');
    listElement.className = 'panels__list';
    items.forEach((itemText) => {
      const listItem = document.createElement('li');
      listItem.className = 'panels__list-item';
      listItem.textContent = itemText;
      listElement.appendChild(listItem);
    });
    return listElement;
  };

  const scriptCache = new Map();

  const loadExternalScript = (url) => {
    if (!url) {
      return Promise.reject(new Error('Script URL missing.'));
    }

    if (scriptCache.has(url)) {
      return scriptCache.get(url);
    }

    const existing = document.querySelector(`script[src="${url}"]`);

    if (existing) {
      if (existing.dataset.loaded === 'true' || existing.readyState === 'complete') {
        const resolved = Promise.resolve();
        scriptCache.set(url, resolved);
        return resolved;
      }

      const promise = new Promise((resolve, reject) => {
        existing.addEventListener('load', () => {
          existing.dataset.loaded = 'true';
          resolve();
        });
        existing.addEventListener('error', () => {
          scriptCache.delete(url);
          reject(new Error(`Failed to load script: ${url}`));
        });
      });

      scriptCache.set(url, promise);
      return promise;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.charset = 'utf-8';
    script.dataset.cfasync = 'false';

    const promise = new Promise((resolve, reject) => {
      script.addEventListener('load', () => {
        script.dataset.loaded = 'true';
        resolve();
      });

      script.addEventListener('error', () => {
        scriptCache.delete(url);
        reject(new Error(`Failed to load script: ${url}`));
      });
    });

    document.head.appendChild(script);
    scriptCache.set(url, promise);
    return promise;
  };

  const initialiseSellastic = (args, attempt = 0) => {
    if (typeof window.xProductBrowser === 'function') {
      window.xProductBrowser(...args);
      return Promise.resolve();
    }

    if (attempt > 6) {
      return Promise.reject(new Error('Sellastic initializer unavailable.'));
    }

    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        initialiseSellastic(args, attempt + 1).then(resolve).catch(reject);
      }, 200 * (attempt + 1));
    });
  };

  const createSellasticStore = (config = {}) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'panels__store';

    const containerId = config.containerId || `sellastic-store-${Math.random().toString(36).slice(2, 7)}`;
    const storeFrame = document.createElement('div');
    storeFrame.id = containerId;
    storeFrame.className = 'panels__store-frame';
    wrapper.appendChild(storeFrame);

    const status = document.createElement('p');
    status.className = 'panels__store-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = config.loadingMessage || 'Loading bookstore…';
    wrapper.appendChild(status);

    const args = Array.isArray(config.arguments) ? config.arguments.slice() : [];
    if (!args.some((argument) => typeof argument === 'string' && argument.trim().startsWith('id='))) {
      args.push(`id=${containerId}`);
    }

    const showError = (message) => {
      status.hidden = false;
      status.textContent = message || config.errorMessage || 'Unable to load the bookstore. Please try again later.';
    };

    loadExternalScript(config.scriptUrl)
      .then(() => initialiseSellastic(args))
      .then(() => {
        status.hidden = true;
      })
      .catch(() => {
        showError(config.errorMessage);
      });

    return wrapper;
  };

  const setStatusMessage = (statusElement, state, message) => {
    if (!statusElement) {
      return;
    }

    statusElement.textContent = message;
    statusElement.classList.remove('panels__form-status--success', 'panels__form-status--error');
    if (state === 'success') {
      statusElement.classList.add('panels__form-status--success');
    }
    if (state === 'error') {
      statusElement.classList.add('panels__form-status--error');
    }
  };

  const buildEndpoint = (details = {}) => {
    const emailTarget = details.formRecipient || details.emailAddress;

    if (details.formEndpoint) {
      if (!emailTarget) {
        return details.formEndpoint;
      }
      const expectedSegment = encodeURIComponent(emailTarget);
      if (details.formEndpoint.includes(expectedSegment)) {
        return details.formEndpoint;
      }
    }

    if (!emailTarget) {
      return '';
    }

    return `https://formsubmit.co/ajax/${encodeURIComponent(emailTarget)}`;
  };

  const normaliseContactDetails = (details = {}) => {
    const emailAddress = (details.emailAddress || details.formRecipient || '').trim();
    const phoneNumber = details.phoneNumber?.trim() || '';
    const submittingMessage = details.submittingMessage || 'Sending your message…';
    const successMessage = details.successMessage || 'Thank you! We will be in touch shortly.';
    const errorMessage = details.errorMessage || 'Sorry, something went wrong. Please try again later.';

    if (!emailAddress && !phoneNumber) {
      return null;
    }

    return {
      phoneLabel: details.phoneLabel || 'Phone',
      phoneNumber,
      emailLabel: details.emailLabel || 'Email',
      emailAddress,
      formRecipient: emailAddress,
      formEndpoint: buildEndpoint({ ...details, emailAddress }),
      submittingMessage,
      successMessage,
      errorMessage
    };
  };

  const buildContactSection = (details = {}) => {
    const contactWrapper = document.createElement('div');
    contactWrapper.className = 'panels__contact';

    const contactList = document.createElement('dl');
    contactList.className = 'panels__contact-list';

    if (details.phoneLabel && details.phoneNumber) {
      const phoneTerm = document.createElement('dt');
      phoneTerm.className = 'panels__contact-term';
      phoneTerm.textContent = details.phoneLabel;

      const phoneDefinition = document.createElement('dd');
      phoneDefinition.className = 'panels__contact-definition';
      const phoneLink = document.createElement('a');
      phoneLink.className = 'panels__contact-link';
      const sanitizedNumber = details.phoneNumber.replace(/[^+\d]/g, '');
      phoneLink.href = sanitizedNumber ? `tel:${sanitizedNumber}` : '#';
      phoneLink.textContent = details.phoneNumber;
      phoneDefinition.appendChild(phoneLink);

      contactList.appendChild(phoneTerm);
      contactList.appendChild(phoneDefinition);
    }

    if (details.emailLabel && details.emailAddress) {
      const emailTerm = document.createElement('dt');
      emailTerm.className = 'panels__contact-term';
      emailTerm.textContent = details.emailLabel;

      const emailDefinition = document.createElement('dd');
      emailDefinition.className = 'panels__contact-definition';
      const emailLink = document.createElement('a');
      emailLink.className = 'panels__contact-link';
      emailLink.href = `mailto:${details.emailAddress}`;
      emailLink.textContent = details.emailAddress;
      emailDefinition.appendChild(emailLink);

      contactList.appendChild(emailTerm);
      contactList.appendChild(emailDefinition);
    }

    if (contactList.childElementCount) {
      contactWrapper.appendChild(contactList);
    }

    const contactForm = document.createElement('form');
    contactForm.className = 'panels__form';
    contactForm.noValidate = true;

    const formIdSuffix = Math.random().toString(36).slice(2, 7);
    const nameFieldId = `contact-name-${formIdSuffix}`;
    const emailFieldId = `contact-email-${formIdSuffix}`;
    const messageFieldId = `contact-message-${formIdSuffix}`;
    const statusFieldId = `contact-status-${formIdSuffix}`;

    const fieldsWrapper = document.createElement('div');
    fieldsWrapper.className = 'panels__form-fields';

    const createInputField = ({ id, name, label, type, placeholder, required }) => {
      const field = document.createElement('div');
      field.className = 'panels__form-field';

      const fieldLabel = document.createElement('label');
      fieldLabel.className = 'panels__form-label';
      fieldLabel.setAttribute('for', id);
      fieldLabel.textContent = label;

      const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
      input.className = type === 'textarea' ? 'panels__form-textarea' : 'panels__form-input';
      input.id = id;
      input.name = name || id;
      input.placeholder = placeholder;
      if (required) {
        input.required = true;
      }
      if (type && type !== 'textarea') {
        input.type = type;
      }
      if (type === 'textarea') {
        input.rows = 5;
      }

      field.appendChild(fieldLabel);
      field.appendChild(input);
      return { field, input };
    };

    const nameField = createInputField({
      id: nameFieldId,
      name: 'name',
      label: 'Your name',
      type: 'text',
      placeholder: 'Jane Doe',
      required: true
    });
    const emailField = createInputField({
      id: emailFieldId,
      name: 'email',
      label: 'Your email',
      type: 'email',
      placeholder: 'you@example.com',
      required: true
    });
    const messageField = createInputField({
      id: messageFieldId,
      name: 'message',
      label: 'Message',
      type: 'textarea',
      placeholder: 'Tell us more about your project…',
      required: true
    });
    messageField.field.classList.add('panels__form-field--wide');

    fieldsWrapper.append(nameField.field, emailField.field, messageField.field);

    const actionsWrapper = document.createElement('div');
    actionsWrapper.className = 'panels__form-actions';

    const submitButton = document.createElement('button');
    submitButton.className = 'panels__form-button';
    submitButton.type = 'submit';
    submitButton.textContent = 'Send message';
    actionsWrapper.appendChild(submitButton);

    const statusMessage = document.createElement('p');
    statusMessage.className = 'panels__form-status';
    statusMessage.id = statusFieldId;
    statusMessage.setAttribute('role', 'status');
    statusMessage.setAttribute('aria-live', 'polite');

    contactForm.append(fieldsWrapper, actionsWrapper, statusMessage);

    const getPayload = () => ({
      name: nameField.input.value.trim(),
      email: emailField.input.value.trim(),
      message: messageField.input.value.trim(),
      recipient: details.formRecipient || details.emailAddress || ''
    });

    const validatePayload = (payload) => {
      if (!payload.name || !payload.email || !payload.message) {
        return false;
      }
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailPattern.test(payload.email);
    };

    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = getPayload();

      if (!validatePayload(payload)) {
        setStatusMessage(statusMessage, 'error', 'Please provide a valid name, email address, and message.');
        return;
      }

      const endpoint = buildEndpoint(details);
      setStatusMessage(statusMessage, null, details.submittingMessage || 'Sending your message…');
      submitButton.disabled = true;

      const sendRequest = async () => {
        if (!endpoint) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          return { ok: true };
        }

        try {
          const formData = new FormData();
          formData.append('name', payload.name);
          formData.append('email', payload.email);
          formData.append('message', payload.message);
          formData.append('_replyto', payload.email);
          if (payload.recipient) {
            formData.append('_to', payload.recipient);
          }

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              Accept: 'application/json'
            },
            body: formData
          });

          if (!response.ok) {
            throw new Error('Request failed');
          }

          const result = await response.json().catch(() => null);
          if (result && result.success === 'false') {
            throw new Error('Request failed');
          }

          return response;
        } catch (error) {
          throw new Error('Network request failed');
        }
      };

      try {
        await sendRequest();
        contactForm.reset();
        setStatusMessage(statusMessage, 'success', details.successMessage || 'Thank you! We will be in touch shortly.');
      } catch (error) {
        setStatusMessage(statusMessage, 'error', details.errorMessage || 'Sorry, something went wrong. Please try again later.');
      } finally {
        submitButton.disabled = false;
      }
    });

    contactWrapper.appendChild(contactForm);
    return contactWrapper;
  };

  const renderTabContent = (tabKey, trigger, { focusPanel = true } = {}) => {
    const content = TAB_CONTENT[tabKey];
    if (!content) {
      return;
    }

    tabPanelTitle.textContent = content.title;
    tabPanelBody.innerHTML = '';

    content.body?.forEach((entry) => {
      if (typeof entry === 'string') {
        tabPanelBody.appendChild(createParagraph(entry));
        return;
      }

      if (entry?.type === 'list' && Array.isArray(entry.items)) {
        tabPanelBody.appendChild(createList(entry.items));
      }
    });

    if (content.store?.type === 'sellastic') {
      tabPanelBody.appendChild(createSellasticStore(content.store));
    }

    if (content.contactDetails) {
      const contactDetails = normaliseContactDetails(content.contactDetails);
      if (contactDetails) {
        content.contactDetails = contactDetails;
        tabPanelBody.appendChild(buildContactSection(contactDetails));
      }
    }

    tabPanel.setAttribute('aria-labelledby', trigger.id);
    if (focusPanel) {
      tabPanel.focus({ preventScroll: true });
    }
  };

  tabButtons.forEach((button) => {
    const content = TAB_CONTENT[button.dataset.tab];
    if (content?.title) {
      button.textContent = content.title;
    }

    button.addEventListener('click', () => {
      if (button.getAttribute('aria-selected') === 'true') {
        return;
      }

      tabButtons.forEach((btn) => {
        btn.classList.remove('tabs__button--active');
        btn.setAttribute('aria-selected', 'false');
      });

      button.classList.add('tabs__button--active');
      button.setAttribute('aria-selected', 'true');

      renderTabContent(button.dataset.tab, button);
    });
  });

  const activeTab = document.querySelector('.tabs__button[aria-selected="true"]') || tabButtons[0];
  if (activeTab) {
    renderTabContent(activeTab.dataset.tab, activeTab, { focusPanel: false });
  }

  const yearTarget = document.getElementById('current-year');
  if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear();
  }
})();
