import { loadTabContentState, STORAGE_KEYS } from './content-store.js';

const TOPIC_RECIPIENTS = {
  general: 'hello@yourpublishinghouse.com',
  media: 'press@yourpublishinghouse.com',
  authors: 'authors@yourpublishinghouse.com'
};

const CONTACT_ENDPOINT_BASE = 'https://formsubmit.co/ajax';

let tabContentState = loadTabContentState();

const tabButtons = document.querySelectorAll('.tabs__button');
const tabPanel = document.getElementById('tab-panel');
const tabPanelTitle = document.getElementById('tab-panel-title');
const tabPanelBody = document.getElementById('tab-panel-body');

const renderParagraphs = (container, paragraphs) => {
  if (!Array.isArray(paragraphs)) {
    return;
  }

  paragraphs.forEach((paragraphText) => {
    const paragraphElement = document.createElement('p');
    paragraphElement.className = 'panels__text';
    paragraphElement.textContent = paragraphText;
    container.appendChild(paragraphElement);
  });
};

const renderBullets = (container, bullets) => {
  if (!Array.isArray(bullets) || bullets.length === 0) {
    return;
  }

  const listElement = document.createElement('ul');
  listElement.className = 'panels__list';

  bullets.forEach((itemText) => {
    const listItem = document.createElement('li');
    listItem.className = 'panels__list-item';
    listItem.textContent = itemText;
    listElement.appendChild(listItem);
  });

  container.appendChild(listElement);
};

const attemptDirectDelivery = async (recipient, payload) => {
  if (!window.fetch) {
    return false;
  }

  try {
    const response = await fetch(`${CONTACT_ENDPOINT_BASE}/${encodeURIComponent(recipient)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
    });

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

const registerContactForm = (formElement, formConfig) => {
  if (!formElement || !formConfig) {
    return;
  }

  const submitButton = formElement.querySelector('[type="submit"]');
  const formStatus = document.getElementById(`${formElement.id}-status`);

  if (!submitButton || !formStatus) {
    return;
  }

  const setSubmitting = (submitting) => {
    submitButton.disabled = submitting;
    submitButton.setAttribute('aria-busy', submitting ? 'true' : 'false');
    submitButton.textContent = submitting ? 'Sending…' : formConfig.submitText || 'Submit';
  };

  formElement.addEventListener('submit', async (event) => {
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
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${emailValue}\nTopic: ${topic}\n\n${message}`);
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
        formConfig.successMessage || 'Thank you for your message. We will respond shortly.';

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
  });
};

const renderContactForm = (container, formConfig) => {
  const formElement = document.createElement('form');
  formElement.className = 'contact-form';
  formElement.id = formConfig.id || 'contact-form';
  formElement.noValidate = true;

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

  const formStatus = document.createElement('p');
  formStatus.className = 'contact-form__status';
  formStatus.id = `${formElement.id}-status`;
  formStatus.setAttribute('role', 'status');
  formStatus.setAttribute('aria-live', 'polite');

  formElement.setAttribute('aria-describedby', formStatus.id);

  container.appendChild(formElement);
  container.appendChild(formStatus);

  registerContactForm(formElement, formConfig);
};

const renderTabContent = (tabKey, trigger, { focusPanel = true } = {}) => {
  if (!tabContentState || !tabPanel || !tabPanelTitle || !tabPanelBody) {
    return;
  }

  const content = tabContentState[tabKey];
  if (!content) {
    return;
  }

  tabPanelTitle.textContent = content.title;
  tabPanelBody.innerHTML = '';

  renderParagraphs(tabPanelBody, content.paragraphs);
  renderBullets(tabPanelBody, content.bullets);

  if (content.form && Array.isArray(content.form.fields)) {
    renderContactForm(tabPanelBody, content.form);
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

const initializeFooter = () => {
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
};

const handleStorageUpdate = (event) => {
  if (!event || event.key !== STORAGE_KEYS.tabContent) {
    return;
  }

  tabContentState = loadTabContentState();
  const activeTab = document.querySelector('.tabs__button[aria-selected="true"]');
  if (activeTab) {
    renderTabContent(activeTab.dataset.tab, activeTab, { focusPanel: false });
  }
};

const initializePage = () => {
  tabContentState = loadTabContentState();
  initializeTabs();
  initializeFooter();
  window.addEventListener('storage', handleStorageUpdate);
};

document.addEventListener('DOMContentLoaded', initializePage);
