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

document.querySelectorAll('[data-service], [data-inquiry]').forEach(button => {
  button.addEventListener('click', () => {
    dialogTrigger = button;
    if (button.dataset.service) form.elements.service.value = button.dataset.service;
    status.textContent = '';
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
    `작업 시간 및 추가 요청: ${values.get('notes').trim() || '없음'}`,
    '', '공급 가능 여부와 상담 안내를 부탁드립니다.'
  ].join('\n');
}
form.addEventListener('submit', event => {
  event.preventDefault();
  const body = inquiryText();
  const subject = `현장 인력 문의 | ${form.elements.service.value}`;
  window.location.href = `mailto:daebaq54@naver.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  status.textContent = '이메일 앱에서 내용을 확인한 뒤 보내주세요. 앱이 열리지 않으면 ‘내용 복사’를 이용해 주세요.';
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
