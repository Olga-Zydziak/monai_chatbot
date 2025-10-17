import {
  getTabKeys,
  loadTabContentState,
  saveTabContentState,
  loadGradientSettings,
  saveGradientSettings,
  STORAGE_KEYS
} from './content-store.js';

let tabContentState = loadTabContentState();
let gradientState = loadGradientSettings();

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

const applyGradientSettings = () => {
  if (!managerContainer) {
    return;
  }

  const startRgba = hexToRgba(gradientState.start, 0.55);
  const endRgba = hexToRgba(gradientState.end, 0.92);

  if (startRgba) {
    managerContainer.style.setProperty('--manager-gradient-start-rgba', startRgba);
    managerContainer.dataset.gradientStart = gradientState.start;
  }

  if (endRgba) {
    managerContainer.style.setProperty('--manager-gradient-end-rgba', endRgba);
    managerContainer.dataset.gradientEnd = gradientState.end;
  }

  managerContainer.setAttribute('data-gradient-direction', gradientState.direction);
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

const setFormStatus = (message, isError = false) => {
  if (!formStatus) {
    return;
  }
  formStatus.textContent = message;
  formStatus.classList.toggle('manager-form__status--error', Boolean(isError));
};

const renderPreview = (tabKey) => {
  if (!previewBody || !previewTitle) {
    return;
  }

  previewBody.innerHTML = '';

  const content = tabContentState[tabKey];
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
  if (!tabSelect || !titleInput || !paragraphsTextarea || !bulletsTextarea) {
    return;
  }

  const content = tabContentState[tabKey];
  if (!content) {
    titleInput.value = '';
    paragraphsTextarea.value = '';
    bulletsTextarea.value = '';
    renderPreview(tabKey);
    return;
  }

  titleInput.value = content.title || '';
  paragraphsTextarea.value = formatParagraphs(content.paragraphs);
  bulletsTextarea.value = formatBullets(content.bullets);
  renderPreview(tabKey);
};

const refreshTabSelectOptions = () => {
  if (!tabSelect) {
    return;
  }

  const currentValue = tabSelect.value;
  tabSelect.innerHTML = '';

  getTabKeys().forEach((tabKey) => {
    const option = document.createElement('option');
    option.value = tabKey;
    option.textContent = tabContentState[tabKey]?.title || tabKey;
    tabSelect.appendChild(option);
  });

  if (currentValue && tabContentState[currentValue]) {
    tabSelect.value = currentValue;
  }
};

const handleTabChange = (event) => {
  const selectedTabKey = event.target.value;
  populateManagerForm(selectedTabKey);
  setFormStatus('');
};

const handleFormSubmit = (event) => {
  event.preventDefault();

  if (!tabSelect || !titleInput || !paragraphsTextarea || !bulletsTextarea) {
    return;
  }

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

  const saved = saveTabContentState(tabContentState);
  if (!saved) {
    setFormStatus('Unable to store updates locally. Please check your browser settings.', true);
    return;
  }

  refreshTabSelectOptions();
  populateManagerForm(tabKey);
  setFormStatus(`${content.title} tab updated successfully.`);
};

const handleGradientDirectionChange = (event) => {
  const selectedDirection = event.currentTarget.dataset.gradient;
  if (!selectedDirection) {
    return;
  }

  managerControlButtons.forEach((btn) => btn.classList.remove('manager__control-button--active'));
  event.currentTarget.classList.add('manager__control-button--active');

  gradientState.direction = selectedDirection;
  applyGradientSettings();
  saveGradientSettings(gradientState);
};

const handleGradientStartChange = (event) => {
  gradientState.start = event.target.value;
  applyGradientSettings();
  saveGradientSettings(gradientState);
};

const handleGradientEndChange = (event) => {
  gradientState.end = event.target.value;
  applyGradientSettings();
  saveGradientSettings(gradientState);
};

const handleStorageUpdate = (event) => {
  if (!event) {
    return;
  }

  if (event.key === STORAGE_KEYS.tabContent) {
    tabContentState = loadTabContentState();
    refreshTabSelectOptions();
    if (tabSelect && tabSelect.value) {
      populateManagerForm(tabSelect.value);
    }
    setFormStatus('Content updated from another tab.');
  }

  if (event.key === STORAGE_KEYS.gradient) {
    gradientState = loadGradientSettings();
    applyGradientSettings();
    setFormStatus('Gradient updated from another tab.');
  }
};

const updateFooterYear = () => {
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
};

const initialiseManagerPanel = () => {
  if (!managerContainer || !managerForm || !tabSelect) {
    return;
  }

  gradientState = loadGradientSettings();
  applyGradientSettings();
  updateFooterYear();

  if (gradientStartInput) {
    gradientStartInput.value = gradientState.start;
    gradientStartInput.addEventListener('input', handleGradientStartChange);
  }

  if (gradientEndInput) {
    gradientEndInput.value = gradientState.end;
    gradientEndInput.addEventListener('input', handleGradientEndChange);
  }

  managerControlButtons.forEach((button) => {
    if (button.dataset.gradient === gradientState.direction) {
      button.classList.add('manager__control-button--active');
    }
    button.addEventListener('click', handleGradientDirectionChange);
  });

  refreshTabSelectOptions();
  const defaultTabKey = tabSelect.options.length > 0 ? tabSelect.options[0].value : null;
  if (defaultTabKey) {
    tabSelect.value = defaultTabKey;
    populateManagerForm(defaultTabKey);
  }

  tabSelect.addEventListener('change', handleTabChange);
  managerForm.addEventListener('submit', handleFormSubmit);

  [titleInput, paragraphsTextarea, bulletsTextarea].forEach((field) => {
    if (!field) {
      return;
    }
    field.addEventListener('input', () => setFormStatus(''));
  });

  window.addEventListener('storage', handleStorageUpdate);
};

document.addEventListener('DOMContentLoaded', initialiseManagerPanel);
