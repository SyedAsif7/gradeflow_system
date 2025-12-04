const decode = (str) => {
  try { return decodeURIComponent(str); } catch { return str; }
};

export const parse = (str = '') => {
  const obj = {};
  const pairs = str.split(';');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].trim();
    if (!pair) continue;
    const eqIdx = pair.indexOf('=');
    const key = eqIdx > -1 ? pair.slice(0, eqIdx) : pair;
    const val = eqIdx > -1 ? pair.slice(eqIdx + 1) : '';
    if (!key) continue;
    const k = decode(key);
    if (obj[k] === undefined) obj[k] = decode(val);
  }
  return obj;
};

export const serialize = (name, val, opts = {}) => {
  const enc = (v) => encodeURIComponent(v);
  let str = `${enc(name)}=${enc(val)}`;
  if (opts.maxAge != null) str += `; Max-Age=${Math.floor(opts.maxAge)}`;
  if (opts.domain) str += `; Domain=${opts.domain}`;
  if (opts.path) str += `; Path=${opts.path}`;
  if (opts.expires) str += `; Expires=${opts.expires.toUTCString()}`;
  if (opts.httpOnly) str += `; HttpOnly`;
  if (opts.secure) str += `; Secure`;
  if (opts.sameSite) {
    const ss = typeof opts.sameSite === 'string' ? opts.sameSite : (opts.sameSite === true ? 'Strict' : 'Lax');
    str += `; SameSite=${ss}`;
  }
  return str;
};
