import { describe, expect, it } from 'vitest';
import { authErrorCopy, onlineErrorCopy } from '../src/ui/serviceErrorCopy';

describe('服務錯誤書面語及舊後端相容', () => {
  it('test_copy_舊後端口語_保留錯誤原因', () => {
    expect(onlineErrorCopy('同一指令編號唔可以改內容。', 409)).toBe('同一指令編號不可變更內容。');
    expect(onlineErrorCopy('搵唔到呢位江湖玩家。', 404)).toBe('找不到此江湖玩家。');
    expect(onlineErrorCopy('未學識或武學類型不符。', 400)).toBe('尚未習得此武學，或武學類型不符。');
  });
  it('test_copy_既有書面語_保留具體保護原因', () => {
    expect(onlineErrorCopy('對手正受戰敗保護。', 409)).toBe('對手正受戰敗保護。');
    expect(onlineErrorCopy('交戰期間不能調整武學。', 409)).toBe('交戰期間不能調整武學。');
  });
  it('test_copy_英文及無效錯誤_依狀態提示而非顯示技術訊息', () => {
    expect(onlineErrorCopy('JWT expired', 401)).toBe('身份驗證失效，請重新登入。');
    expect(onlineErrorCopy({ message: 'internal' }, 429)).toBe('操作過於頻繁，請稍後再試。');
    expect(onlineErrorCopy('__proto__', 500)).toBe('江湖服務暫時無法處理此操作，請稍後再試。');
  });
  it('test_copy_認證錯誤_提供重新寄送及等待指引', () => {
    expect(authErrorCopy({ code: 'otp_expired' })).toBe('登入連結已失效，請重新寄送。');
    expect(authErrorCopy({ code: 'over_email_send_rate_limit' })).toBe('確認信寄送過於頻繁，請稍後再試。');
    expect(authErrorCopy({ code: 'email_address_invalid' })).toBe('電郵格式不正確。');
  });
  it('test_copy_未知認證錯誤_安全顯示中文後備提示', () => {
    expect(authErrorCopy({ code: '__proto__' })).toBe('帳戶操作未完成，請檢查網絡後重試。');
    expect(authErrorCopy(null)).toBe('帳戶操作未完成，請檢查網絡後重試。');
  });
});
