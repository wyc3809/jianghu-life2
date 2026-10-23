/** 將既有服務錯誤轉為書面語；相容尚未更新的後端提示。 */
const previousMessages: Record<string, string> = {
  '搵唔到呢位江湖玩家。': '找不到此江湖玩家。',
  '未學識或武學類型不符。': '尚未習得此武學，或武學類型不符。',
  '同一指令編號唔可以改內容。': '同一指令編號不可變更內容。',
  '搵唔到呢個試場，請核對邀請連結。': '找不到此試場，請核對邀請連結。',
  '呢個二人試場已滿。': '此二人試場已滿。',
  '你唔係呢個試場嘅玩家。': '你並非此試場的玩家。',
  '開啟咗太多試場分頁，請先關閉其他分頁。': '開啟的試場分頁過多，請先關閉其他分頁。',
  '呢個試場已達封測操作上限。': '此試場已達封測操作上限。',
  '搵唔到呢個操作。': '找不到此操作。',
  '呢個網址未開放試場。': '此網址尚未開放試場。',
  '不支援嘅原型資料版本': '不支援的原型資料版本',
};

const authMessages: Record<string, string> = {
  email_address_invalid: '電郵格式不正確。',
  email_address_not_authorized: '此電郵地址目前無法使用，請使用其他地址。',
  over_email_send_rate_limit: '確認信寄送過於頻繁，請稍後再試。',
  over_request_rate_limit: '操作過於頻繁，請稍後再試。',
  email_exists: '此電郵已綁定其他帳戶，請改用登入。',
  user_already_exists: '此帳戶已存在，請改用登入。',
  otp_expired: '登入連結已失效，請重新寄送。',
  signup_disabled: '目前未開放建立帳戶。',
  email_not_confirmed: '電郵尚未確認，請先開啟確認信中的連結。',
};

/** 保留已知服務錯誤的具體原因；未知或英文錯誤顯示可操作的中文提示。 */
export function onlineErrorCopy(message: unknown, status?: number): string {
  if (typeof message === 'string') {
    if (Object.hasOwn(previousMessages, message)) return previousMessages[message]!;
    if (/[\u3400-\u9fff]/.test(message) && !/[唔嘅咗喺佢揀畀俾嚟咁冇啲嗰乜咩睇攞拎撳搵嘢]/.test(message)) return message;
  }
  if (status === 401 || status === 403) return '身份驗證失效，請重新登入。';
  if (status === 429) return '操作過於頻繁，請稍後再試。';
  return '江湖服務暫時無法處理此操作，請稍後再試。';
}

/** 根據認證錯誤代碼提供提示，不向玩家顯示英文SDK錯誤。 */
export function authErrorCopy(error: { code?: string; status?: number } | null | undefined): string {
  if (error?.code && Object.hasOwn(authMessages, error.code)) return authMessages[error.code]!;
  if (error?.status === 429) return '操作過於頻繁，請稍後再試。';
  return '帳戶操作未完成，請檢查網絡後重試。';
}
