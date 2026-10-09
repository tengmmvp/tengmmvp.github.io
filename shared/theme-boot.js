/* theme-boot.js — 首帧应用已存主题避免闪色；存储键须与 tmm.js 一致 */
try {
  const saved = JSON.parse(localStorage.getItem('tmm:theme'));
  if (saved === 'light' || saved === 'dark') document.documentElement.style.colorScheme = saved;
} catch { /* 忽略，跟随系统 */ }
