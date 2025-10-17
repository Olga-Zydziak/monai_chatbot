const TAB_CONTENT = {
  publishing: {
    title: 'Publishing House',
    body: [
      'Celebrate your publishing heritage with a concise mission statement that speaks to your editorial vision and the authors you champion.',
      'Share recent milestones such as award-winning releases, international rights deals, or community initiatives that distinguish your house.',
      {
        type: 'list',
        items: [
          "Core genres: literary fiction, narrative nonfiction, children's literature",
          'Flagship imprints focused on debut voices and translated works',
          'Collaborations with cultural institutions and festival partners'
        ]
      }
    ]
  },
  authors: {
    title: 'For Authors',
    body: [
      'Outline how prospective authors can submit manuscripts, including response timelines and what to expect after hitting send.',
      'Explain the editorial partnership — from developmental edits to cover design — that helps storytellers feel supported at every step.',
      {
        type: 'list',
        items: [
          'Downloadable submission checklist',
          'Monthly virtual pitch sessions hosted by senior editors',
          'Author mentorship program pairing debut writers with alumni'
        ]
      }
    ]
  },
  selfPublishing: {
    title: 'Self-publishing',
    body: [
      'Empower independent creators with transparent packages that combine print-on-demand, distribution, and marketing coaching.',
      'Clarify which services are à la carte so authors can tailor support to their publishing goals and budget.',
      {
        type: 'list',
        items: [
          'Production suite: editing, layout, ISBN registration',
          'Distribution reach: global eBook platforms and boutique bookstores',
          'Launch toolkit: press release templates and social media calendars'
        ]
      }
    ]
  },
  bookstore: {
    title: 'Bookstore',
    body: [
      'Spotlight your curated collections with seasonal displays, staff picks, and themed bundles designed to delight avid readers.',
      'Promote events hosted in-store or online — from author signings to book club roundtables — that build community around the written word.',
      {
        type: 'list',
        items: [
          'Signature collections refreshed monthly',
          'Exclusive signed editions for loyalty members',
          'Personalized recommendations via concierge service'
        ]
      }
    ]
  },
  contact: {
    title: 'Contact',
    body: [
      'Provide tailored contact pathways for media, rights inquiries, partnership proposals, and aspiring authors.',
      {
        type: 'form',
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
    ]
  }
};

const TOPIC_RECIPIENTS = {
  general: 'hello@yourpublishinghouse.com',
  media: 'press@yourpublishinghouse.com',
  authors: 'authors@yourpublishinghouse.com'
};

const tabButtons = document.querySelectorAll('.tabs__button');
const tabPanel = document.getElementById('tab-panel');
const tabPanelTitle = document.getElementById('tab-panel-title');
const tabPanelBody = document.getElementById('tab-panel-body');

const renderTabContent = (tabKey, trigger, { focusPanel = true } = {}) => {
  const content = TAB_CONTENT[tabKey];
  if (!content) {
    return;
  }

  tabPanelTitle.textContent = content.title;
  tabPanelBody.innerHTML = '';

  content.body.forEach((entry) => {
    if (typeof entry === 'string') {
      const paragraphElement = document.createElement('p');
      paragraphElement.className = 'panels__text';
      paragraphElement.textContent = entry;
      tabPanelBody.appendChild(paragraphElement);
      return;
    }

    if (entry.type === 'list' && Array.isArray(entry.items)) {
      const listElement = document.createElement('ul');
      listElement.className = 'panels__list';
      entry.items.forEach((itemText) => {
        const listItem = document.createElement('li');
        listItem.className = 'panels__list-item';
        listItem.textContent = itemText;
        listElement.appendChild(listItem);
      });
      tabPanelBody.appendChild(listElement);
      return;
    }

    if (entry.type === 'form' && Array.isArray(entry.fields)) {
      const formElement = document.createElement('form');
      formElement.className = 'contact-form';
      formElement.id = entry.id || 'contact-form';
      formElement.noValidate = true;

      const formStatus = document.createElement('p');
      formStatus.className = 'contact-form__status';
      formStatus.id = `${formElement.id}-status`;
      formStatus.setAttribute('role', 'status');
      formStatus.setAttribute('aria-live', 'polite');

      entry.fields.forEach((field) => {
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
      submitButton.textContent = entry.submitText || 'Submit';

      formElement.appendChild(submitButton);
      formElement.setAttribute('aria-describedby', formStatus.id);

      const onSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(formElement);
        const requiredFields = entry.fields.filter((field) => field.required);
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

        let mailClientOpened = false;

        try {
          const mailtoWindow = window.open(mailtoUrl, '_blank', 'noopener');
          if (mailtoWindow) {
            mailClientOpened = true;
            mailtoWindow.opener = null;
          }
        } catch (error) {
          // Intentionally ignored — we fall back to a location change below.
        }

        if (!mailClientOpened && navigator.clipboard) {
          navigator.clipboard
            .writeText(`To: ${recipient}\nSubject: Publishing inquiry (${topic})\n\n${message}`)
            .catch(() => {});
        }

        if (!mailClientOpened) {
          window.location.assign(mailtoUrl);
        }

        formElement.reset();
        formStatus.textContent =
          entry.successMessage ||
          'Thank you for your message. We will respond shortly. If your mail app did not open, the details have been copied to your clipboard.';
      };

      formElement.addEventListener('submit', onSubmit);

      tabPanelBody.appendChild(formElement);
      tabPanelBody.appendChild(formStatus);
    }
  });

  tabPanel.setAttribute('aria-labelledby', trigger.id);
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

  if (!managerContainer || !managerControlButtons.length) {
    return;
  }

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
