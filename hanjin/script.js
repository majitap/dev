'use strict';

const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', '메뉴 열기');
  mobileNav.hidden = true;
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  mobileNav.hidden = !open;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileNav.hidden) {
    closeMenu();
    menuToggle.focus();
  }
});
window.matchMedia('(min-width: 901px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

const dialog = document.querySelector('#inquiry-dialog');
const form = document.querySelector('#inquiry-form');
const status = document.querySelector('#form-status');
const fallback = document.querySelector('#copy-fallback');
let dialogTrigger;
let sending = false;
let clearStatusOnNextOpen = false;
const submitButton = form.querySelector('[type="submit"]');
const submitLabel = submitButton.querySelector('.submit-label');

document.querySelectorAll('[data-service], [data-inquiry]').forEach(button => {
  button.addEventListener('click', () => {
    dialogTrigger = button;
    if (button.dataset.service && !sending) form.elements.service.value = button.dataset.service;
    if (!sending && clearStatusOnNextOpen) {
      status.textContent = '';
      status.removeAttribute('data-state');
      clearStatusOnNextOpen = false;
    }
    fallback.hidden = true;
    closeMenu();
    document.body.classList.add('dialog-open');
    dialog.showModal();
  });
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  dialogTrigger?.focus();
});

const now = new Date();
const dateInput = form.elements.date;
dateInput.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
document.querySelector('#year').textContent = now.getFullYear();

function inquiryText() {
  const values = new FormData(form);
  return [
    '한진개발 현장 인력 공급 문의', '',
    `작업 분야: ${values.get('service')}`,
    `현장 위치: ${values.get('location').trim()}`,
    `투입 희망 날짜: ${values.get('date')}`,
    `필요 인원: ${values.get('count')}명`,
    `담당자 연락처: ${values.get('contact').trim()}`,
    `요청 내용: ${values.get('notes').trim() || '없음'}`,
    '', '공급 가능 여부와 상담 안내를 부탁드립니다.'
  ].join('\n');
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (sending) return;
  for (const name of ['location', 'contact']) {
    const field = form.elements[name];
    field.value = field.value.trim();
  }
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const payload = {
    from_name: '한진개발 홈페이지 문의',
    subject: `한진개발 현장 인력 문의 | ${values.get('service')}`,
    '작업 분야': values.get('service'),
    '현장 위치': values.get('location'),
    '투입 희망 날짜': values.get('date'),
    '필요 인원': `${values.get('count')}명`,
    '담당자 연락처': values.get('contact'),
    '요청 내용': values.get('notes').trim() || '없음',
    botcheck: Boolean(values.get('botcheck'))
  };
  const controls = [...form.querySelectorAll('input, select, textarea, button')];
  const disabledBefore = controls.map(control => control.disabled);
  sending = true;
  clearStatusOnNextOpen = false;
  form.setAttribute('aria-busy', 'true');
  controls.forEach(control => { control.disabled = true; });
  submitLabel.textContent = '전송 중…';
  status.dataset.state = 'sending';
  status.textContent = '문의 내용을 보내고 있습니다. 잠시만 기다려 주세요.';
  try {
    await HanjinMail.send(form.dataset.accessKey, payload);
    form.reset();
    fallback.hidden = true;
    document.querySelector('#inquiry-preview').value = '';
    status.dataset.state = 'success';
    status.textContent = '문의가 접수되었습니다. 확인 후 안내해 드리겠습니다.';
    clearStatusOnNextOpen = true;
  } catch (error) {
    status.dataset.state = 'error';
    status.textContent = error.message;
  } finally {
    sending = false;
    form.removeAttribute('aria-busy');
    controls.forEach((control, index) => { control.disabled = disabledBefore[index]; });
    submitLabel.textContent = '문의 보내기';
  }
});
document.querySelector('#copy-inquiry').addEventListener('click', async () => {
  if (!form.reportValidity()) return;
  const text = inquiryText();
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = '문의 내용을 복사했습니다. 이메일이나 상담 시 활용해 주세요.';
    fallback.hidden = true;
  } catch {
    fallback.hidden = false;
    const preview = document.querySelector('#inquiry-preview');
    preview.value = text;
    preview.focus();
    preview.select();
    status.textContent = '아래 문의 내용을 선택해 복사해 주세요.';
  }
});
