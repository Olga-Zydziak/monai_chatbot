const TAB_INITIAL_CONTENT = {
  publishing: {
    title: 'Publishing House',
    paragraphs: [
      'Celebrate your publishing heritage with a concise mission statement that speaks to your editorial vision and the authors you champion.',
      'Share recent milestones such as award-winning releases, international rights deals, or community initiatives that distinguish your house.'
    ],
    bullets: [
      "Core genres: literary fiction, narrative nonfiction, children's literature",
      'Flagship imprints focused on debut voices and translated works',
      'Collaborations with cultural institutions and festival partners'
    ]
  },
  authors: {
    title: 'For Authors',
    paragraphs: [
      'Outline how prospective authors can submit manuscripts, including response timelines and what to expect after hitting send.',
      'Explain the editorial partnership — from developmental edits to cover design — that helps storytellers feel supported at every step.'
    ],
    bullets: [
      'Downloadable submission checklist',
      'Monthly virtual pitch sessions hosted by senior editors',
      'Author mentorship program pairing debut writers with alumni'
    ]
  },
  selfPublishing: {
    title: 'Self-publishing',
    paragraphs: [
      'Empower independent creators with transparent packages that combine print-on-demand, distribution, and marketing coaching.',
      'Clarify which services are à la carte so authors can tailor support to their publishing goals and budget.'
    ],
    bullets: [
      'Production suite: editing, layout, ISBN registration',
      'Distribution reach: global eBook platforms and boutique bookstores',
      'Launch toolkit: press release templates and social media calendars'
    ]
  },
  bookstore: {
    title: 'Bookstore',
    paragraphs: [
      'Spotlight your curated collections with seasonal displays, staff picks, and themed bundles designed to delight avid readers.',
      'Promote events hosted in-store or online — from author signings to book club roundtables — that build community around the written word.'
    ],
    bullets: [
      'Signature collections refreshed monthly',
      'Exclusive signed editions for loyalty members',
      'Personalized recommendations via concierge service'
    ]
  },
  contact: {
    title: 'Contact',
    paragraphs: [
      'Provide tailored contact pathways for media, rights inquiries, partnership proposals, and aspiring authors.'
    ],
    form: {
      id: 'contact-form',
      successMessage: 'Your message has been queued. We will be in touch shortly.',
      submitText: 'Send message',
      fields: [
        {
          label: 'Full name',
          name: 'name',
          type: 'text',
          autocomplete: 'name',
          required: true
        },
        {
          label: 'Email address',
          name: 'email',
          type: 'email',
          autocomplete: 'email',
          required: true
        },
        {
          label: 'Topic',
          name: 'topic',
          type: 'select',
          options: [
            { value: 'general', label: 'General inquiry' },
            { value: 'media', label: 'Media & publicity' },
            { value: 'authors', label: 'Author relations' }
          ],
          required: true
        },
        {
          label: 'Message',
          name: 'message',
          type: 'textarea',
          required: true,
          rows: 6
        }
      ]
    }
  }
};

const tabContentState = JSON.parse(JSON.stringify(TAB_INITIAL_CONTENT));

const TOPIC_RECIPIENTS = {
  general: 'hello@yourpublishinghouse.com',
  media: 'press@yourpublishinghouse.com',
  authors: 'authors@yourpublishinghouse.com'
};

const CONTACT_ENDPOINT_BASE = 'https://formsubmit.co/ajax';

const tabButtons = document.querySelectorAll('.tabs__button');
const tabPanel = document.getElementById('tab-panel');
const tabPanelTitle = document.getElementById('tab-panel-title');
const tabPanelBody = document.getElementById('tab-panel-body');

const renderTabContent = (tabKey, trigger, { focusPanel = true } = {}) => {
  const content = tabContentState[tabKey];
  if (!content) {
    return;
  }

  tabPanelTitle.textContent = content.title;
  tabPanelBody.innerHTML = '';

  if (Array.isArray(content.paragraphs)) {
    content.paragraphs.forEach((paragraphText) => {
      const paragraphElement = document.createElement('p');
      paragraphElement.className = 'panels__text';
      paragraphElement.textContent = paragraphText;
      tabPanelBody.appendChild(paragraphElement);
    });
  }

  if (Array.isArray(content.bullets) && content.bullets.length > 0) {
    const listElement = document.createElement('ul');
    listElement.className = 'panels__list';
    content.bullets.forEach((itemText) => {
      const listItem = document.createElement('li');
      listItem.className = 'panels__list-item';
      listItem.textContent = itemText;
      listElement.appendChild(listItem);
    });
    tabPanelBody.appendChild(listElement);
  }

  if (content.form && Array.isArray(content.form.fields)) {
    const formConfig = content.form;
    const formElement = document.createElement('form');
    formElement.className = 'contact-form';
    formElement.id = formConfig.id || 'contact-form';
    formElement.noValidate = true;

    const formStatus = document.createElement('p');
    formStatus.className = 'contact-form__status';
    formStatus.id = `${formElement.id}-status`;
    formStatus.setAttribute('role', 'status');
    formStatus.setAttribute('aria-live', 'polite');

    formConfig.fields.forEach((field) => {
      const fieldWrapper = document.createElement('div');
      fieldWrapper.className = 'contact-form__field';

      const label = document.createElement('label');
      const fieldId = `${formElement.id}-${field.name}`;
      label.className = 'contact-form__label';
      label.setAttribute('for', fieldId);
      label.textContent = field.label;

      let input;
      if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = field.rows || 4;
      } else if (field.type === 'select' && Array.isArray(field.options)) {
        input = document.createElement('select');
        field.options.forEach((option) => {
          const optionElement = document.createElement('option');
          optionElement.value = option.value;
          optionElement.textContent = option.label;
          input.appendChild(optionElement);
        });
      } else {
        input = document.createElement('input');
        input.type = field.type || 'text';
      }

      input.id = fieldId;
      input.name = field.name;
      input.className = 'contact-form__control';
      input.required = Boolean(field.required);
      if (field.autocomplete) {
        input.autocomplete = field.autocomplete;
      }

      fieldWrapper.appendChild(label);
      fieldWrapper.appendChild(input);
      formElement.appendChild(fieldWrapper);
    });

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'contact-form__submit';
    submitButton.textContent = formConfig.submitText || 'Submit';

    formElement.appendChild(submitButton);
    formElement.setAttribute('aria-describedby', formStatus.id);

    const setSubmitting = (submitting) => {
      submitButton.disabled = submitting;
      submitButton.setAttribute('aria-busy', submitting ? 'true' : 'false');
      submitButton.textContent = submitting ? 'Sending…' : formConfig.submitText || 'Submit';
    };

    const attemptDirectDelivery = async (recipient, payload) => {
      if (!window.fetch) {
        return false;
      }

      try {
        const response = await fetch(
          `${CONTACT_ENDPOINT_BASE}/${encodeURIComponent(recipient)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify(payload)
          }
        );

        if (!response.ok) {
          return false;
        }

        const data = await response.json();
        return Boolean(data.success);
      } catch (error) {
        return false;
      }
    };

    const openMailClientFallback = (mailtoUrl) => {
      const temporaryLink = document.createElement('a');
      temporaryLink.href = mailtoUrl;
      temporaryLink.rel = 'noopener noreferrer';
      temporaryLink.dataset.autoMailto = 'true';
      document.body.appendChild(temporaryLink);
      temporaryLink.click();
      requestAnimationFrame(() => {
        if (temporaryLink.parentNode) {
          temporaryLink.parentNode.removeChild(temporaryLink);
        }
      });
    };

    const onSubmit = async (event) => {
      event.preventDefault();
      const formData = new FormData(formElement);
      const requiredFields = formConfig.fields.filter((field) => field.required);
      let hasError = false;

      formStatus.textContent = '';
      formStatus.classList.remove('contact-form__status--error');

      requiredFields.forEach((field) => {
        const value = (formData.get(field.name) || '').toString().trim();
        if (!value) {
          hasError = true;
        }
      });

      const email = formData.get('email');
      if (email && typeof email === 'string') {
        const emailPattern = /^(?:[^\s@]+@[^\s@]+\.[^\s@]+)$/;
        if (!emailPattern.test(email.trim())) {
          hasError = true;
        }
      }

      if (hasError) {
        formStatus.textContent = 'Please fill in all required fields with valid information.';
        formStatus.classList.add('contact-form__status--error');
        return;
      }

      setSubmitting(true);

      const name = (formData.get('name') || '').toString().trim();
      const topic = (formData.get('topic') || 'general').toString();
      const emailValue = (formData.get('email') || '').toString().trim();
      const message = (formData.get('message') || '').toString().trim();
      const recipient = TOPIC_RECIPIENTS[topic] || TOPIC_RECIPIENTS.general;

      const subject = encodeURIComponent(`Publishing inquiry (${topic})`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${emailValue}\nTopic: ${topic}\n\n${message}`
      );
      const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${body}`;

      const payload = {
        name,
        email: emailValue,
        topic,
        message,
        _subject: `Publishing inquiry (${topic})`,
        _replyto: emailValue
      };

      try {
        const delivered = await attemptDirectDelivery(recipient, payload);
        let statusMessage =
          formConfig.successMessage ||
          'Thank you for your message. We will respond shortly.';

        formStatus.classList.remove('contact-form__status--error');

        if (!delivered) {
          if (navigator.clipboard) {
            navigator.clipboard
              .writeText(`To: ${recipient}\nSubject: Publishing inquiry (${topic})\n\n${message}`)
              .catch(() => {});
          }

          openMailClientFallback(mailtoUrl);
          statusMessage =
            'Your default mail application has been prompted. If it does not appear, paste the copied details into any email client.';
        } else {
          statusMessage =
            formConfig.successMessage ||
            'Thank you for your message. Our team will get back to you shortly.';
        }

        formElement.reset();
        formStatus.textContent = statusMessage;
      } catch (error) {
        formStatus.classList.add('contact-form__status--error');
        formStatus.textContent =
          'We were unable to submit your message automatically. Please try again or contact hello@yourpublishinghouse.com directly.';
        openMailClientFallback(mailtoUrl);
      } finally {
        setSubmitting(false);
      }
    };

    formElement.addEventListener('submit', onSubmit);

    tabPanelBody.appendChild(formElement);
    tabPanelBody.appendChild(formStatus);
  }

  if (trigger) {
    tabPanel.setAttribute('aria-labelledby', trigger.id);
  }
  if (focusPanel) {
    tabPanel.focus({ preventScroll: true });
  }
};

const initializeTabs = () => {
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
};

const initializeManagerPanel = () => {
  const managerContainer = document.querySelector('.manager__container');
  const managerControlButtons = document.querySelectorAll('.manager__control-button');
  const gradientStartInput = document.getElementById('manager-gradient-start');
  const gradientEndInput = document.getElementById('manager-gradient-end');
  const managerForm = document.getElementById('manager-form');
  const tabSelect = document.getElementById('manager-tab-select');
  const titleInput = document.getElementById('manager-tab-title');
  const paragraphsTextarea = document.getElementById('manager-tab-paragraphs');
  const bulletsTextarea = document.getElementById('manager-tab-bullets');
  const formStatus = document.getElementById('manager-form-status');
  const previewTitle = document.getElementById('manager-preview-title');
  const previewBody = document.getElementById('manager-preview-body');

  if (
    !managerContainer ||
    !managerControlButtons.length ||
    !managerForm ||
    !tabSelect ||
    !titleInput ||
    !paragraphsTextarea ||
    !bulletsTextarea ||
    !formStatus ||
    !previewTitle ||
    !previewBody
  ) {
    return;
  }

  const hexToRgba = (hex, alpha) => {
    if (typeof hex !== 'string') {
      return null;
    }

    const normalisedHex = hex.replace('#', '').trim();
    if (![3, 6].includes(normalisedHex.length)) {
      return null;
    }

    const expandedHex =
      normalisedHex.length === 3
        ? normalisedHex
            .split('')
            .map((char) => char + char)
            .join('')
        : normalisedHex;

    const r = parseInt(expandedHex.slice(0, 2), 16);
    const g = parseInt(expandedHex.slice(2, 4), 16);
    const b = parseInt(expandedHex.slice(4, 6), 16);

    if ([r, g, b].some((value) => Number.isNaN(value))) {
      return null;
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const setGradientColors = (startHex, endHex) => {
    const startRgba = hexToRgba(startHex, 0.55);
    const endRgba = hexToRgba(endHex, 0.92);

    if (startRgba) {
      managerContainer.style.setProperty('--manager-gradient-start-rgba', startRgba);
      managerContainer.dataset.gradientStart = startHex;
    }

    if (endRgba) {
      managerContainer.style.setProperty('--manager-gradient-end-rgba', endRgba);
      managerContainer.dataset.gradientEnd = endHex;
    }
  };

  const parseParagraphs = (value) =>
    value
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

  const parseBullets = (value) =>
    value
      .split(/\n+/)
      .map((item) => item.replace(/^[-*]\s*/, '').trim())
      .filter((item) => item.length > 0);

  const formatParagraphs = (paragraphs) => (Array.isArray(paragraphs) ? paragraphs.join('\n\n') : '');
  const formatBullets = (bullets) =>
    Array.isArray(bullets) && bullets.length > 0 ? bullets.map((item) => `- ${item}`).join('\n') : '';

  const getActiveTabKey = () => {
    const activeButton = document.querySelector('.tabs__button[aria-selected="true"]');
    return activeButton ? activeButton.dataset.tab : null;
  };

  const renderPreview = (tabKey) => {
    const content = tabContentState[tabKey];
    previewBody.innerHTML = '';

    if (!content) {
      previewTitle.textContent = '';
      return;
    }

    previewTitle.textContent = content.title;

    if (Array.isArray(content.paragraphs) && content.paragraphs.length > 0) {
      content.paragraphs.forEach((text) => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        previewBody.appendChild(paragraph);
      });
    }

    if (Array.isArray(content.bullets) && content.bullets.length > 0) {
      const list = document.createElement('ul');
      content.bullets.forEach((item) => {
        const listItem = document.createElement('li');
        listItem.textContent = item;
        list.appendChild(listItem);
      });
      previewBody.appendChild(list);
    }

    if (content.form) {
      const note = document.createElement('p');
      note.className = 'manager__preview-note';
      note.textContent = 'The contact form remains visible beneath this copy for visitors.';
      previewBody.appendChild(note);
    }
  };

  const populateManagerForm = (tabKey) => {
    const content = tabContentState[tabKey];
    if (!content) {
      return;
    }

    titleInput.value = content.title || '';
    paragraphsTextarea.value = formatParagraphs(content.paragraphs);
    bulletsTextarea.value = formatBullets(content.bullets);
    renderPreview(tabKey);
  };

  const refreshTabSelectOptions = () => {
    Array.from(tabSelect.options).forEach((option) => {
      const state = tabContentState[option.value];
      if (state) {
        option.textContent = state.title;
      }
    });
  };

  const setFormStatus = (message, isError = false) => {
    if (!formStatus) {
      return;
    }

    formStatus.textContent = message;
    formStatus.classList.toggle('manager-form__status--error', isError);
  };

  managerControlButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedDirection = button.dataset.gradient;
      if (!selectedDirection) {
        return;
      }

      managerControlButtons.forEach((btn) => btn.classList.remove('manager__control-button--active'));
      button.classList.add('manager__control-button--active');
      managerContainer.setAttribute('data-gradient-direction', selectedDirection);
    });
  });

  const initialStart = managerContainer.dataset.gradientStart || '#5a8dee';
  const initialEnd = managerContainer.dataset.gradientEnd || '#0f1117';
  setGradientColors(initialStart, initialEnd);

  if (gradientStartInput) {
    gradientStartInput.value = initialStart;
    gradientStartInput.addEventListener('input', (event) => {
      setGradientColors(event.target.value, managerContainer.dataset.gradientEnd || initialEnd);
    });
  }

  if (gradientEndInput) {
    gradientEndInput.value = initialEnd;
    gradientEndInput.addEventListener('input', (event) => {
      setGradientColors(managerContainer.dataset.gradientStart || initialStart, event.target.value);
    });
  }

  Object.keys(tabContentState).forEach((tabKey) => {
    const option = document.createElement('option');
    option.value = tabKey;
    option.textContent = tabContentState[tabKey].title;
    tabSelect.appendChild(option);
  });

  const defaultTabKey = tabSelect.options.length > 0 ? tabSelect.options[0].value : null;
  if (defaultTabKey) {
    tabSelect.value = defaultTabKey;
    populateManagerForm(defaultTabKey);
  }

  tabSelect.addEventListener('change', (event) => {
    const selectedTabKey = event.target.value;
    populateManagerForm(selectedTabKey);
    setFormStatus('');
  });

  managerForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const tabKey = tabSelect.value;
    const content = tabContentState[tabKey];
    if (!content) {
      setFormStatus('Select a valid tab to update.', true);
      return;
    }

    const nextTitle = titleInput.value.trim();
    const nextParagraphs = parseParagraphs(paragraphsTextarea.value);
    const nextBullets = parseBullets(bulletsTextarea.value);

    if (!nextTitle) {
      setFormStatus('Tab title cannot be empty.', true);
      titleInput.focus();
      return;
    }

    if (nextParagraphs.length === 0) {
      setFormStatus('Please provide at least one paragraph for the tab.', true);
      paragraphsTextarea.focus();
      return;
    }

    content.title = nextTitle;
    content.paragraphs = nextParagraphs;
    content.bullets = nextBullets;

    refreshTabSelectOptions();
    populateManagerForm(tabKey);

    const activeTabKey = getActiveTabKey();
    if (activeTabKey === tabKey) {
      const activeButton = document.querySelector(`.tabs__button[data-tab="${tabKey}"]`);
      renderTabContent(tabKey, activeButton, { focusPanel: false });
    }

    setFormStatus(`${content.title} tab updated successfully.`);
  });

  [titleInput, paragraphsTextarea, bulletsTextarea].forEach((field) => {
    field.addEventListener('input', () => {
      setFormStatus('');
    });
  });

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (!tabSelect) {
        return;
      }

      tabSelect.value = button.dataset.tab;
      populateManagerForm(button.dataset.tab);
      setFormStatus('');
    });
  });
};

const initializeFooter = () => {
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
};

const initializePage = () => {
  initializeTabs();
  initializeManagerPanel();
  initializeFooter();
};

document.addEventListener('DOMContentLoaded', initializePage);
