(() => {
  const TAB_CONTENT = window.PUBLISHING_TAB_CONTENT || {};

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
      recipient: details.formRecipient || ''
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

      const submissionPayload = {
        name: payload.name,
        email: payload.email,
        message: payload.message
      };

      if (details.formRecipient) {
        submissionPayload.recipient = details.formRecipient;
      }

      const endpoint = details.formEndpoint || '';
      setStatusMessage(statusMessage, null, details.submittingMessage || 'Sending your message…');
      submitButton.disabled = true;

      const sendRequest = async () => {
        if (!endpoint) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          return { ok: true };
        }

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify(submissionPayload)
          });

          if (!response.ok) {
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

    if (content.contactDetails) {
      tabPanelBody.appendChild(buildContactSection(content.contactDetails));
    }

    tabPanel.setAttribute('aria-labelledby', trigger.id);
    if (focusPanel) {
      tabPanel.focus({ preventScroll: true });
    }
  };

  tabButtons.forEach((button) => {
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
