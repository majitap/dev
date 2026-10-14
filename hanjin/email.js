'use strict';

// Web3Forms access keys are public form identifiers, not mail credentials.
async function sendHanjinInquiry(accessKey, payload, fetchRequest = fetch, timeoutMs = 20000) {
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(accessKey || '')) {
    throw new Error('문의 전송 연결을 준비 중입니다. 전화 상담을 이용해 주세요.');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchRequest('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, access_key: accessKey }),
      signal: controller.signal
    });
    const result = await response.json().catch(() => null);
    if (response.ok && result?.success === true) return;
    if (response.ok) {
      throw new Error('접수 결과를 확인하지 못했습니다. 중복 접수를 피하려면 먼저 전화로 접수 여부를 확인해 주세요. 입력 내용은 유지했습니다.');
    }
    if (response.status === 429) {
      throw new Error('문의 접수가 일시적으로 제한되었습니다. 잠시 후 다시 시도하거나 전화로 문의해 주세요.');
    }
    if (response.status === 400 || response.status === 422) {
      throw new Error('문의 내용을 확인해 주세요. 접수가 계속되지 않으면 전화 상담을 이용해 주세요.');
    }
    throw new Error('문의가 접수되지 않았습니다. 입력 내용을 유지했으니 잠시 후 다시 시도하거나 내용을 복사해 전화로 문의해 주세요.');
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('접수 결과를 확인하지 못했습니다. 중복 접수를 피하려면 먼저 전화로 접수 여부를 확인해 주세요. 입력 내용은 보관하고 있습니다.');
    }
    if (error instanceof TypeError) {
      throw new Error('연결이 끊겨 접수 결과를 확인하지 못했습니다. 먼저 전화로 접수 여부를 확인해 주세요. 입력 내용은 유지했습니다.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
globalThis.HanjinMail = Object.freeze({ send: sendHanjinInquiry });
