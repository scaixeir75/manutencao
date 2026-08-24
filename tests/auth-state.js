const path = require('path');

function authStatePathFor(appUrl) {
  return path.join(__dirname, '..', '.auth', `pmp-auth-${authOriginKey(appUrl)}.json`);
}

function authProfileDirFor(appUrl) {
  return path.join(__dirname, '..', '.auth', 'profiles', authOriginKey(appUrl));
}

function authOriginKey(appUrl) {
  try {
    const url = new URL(appUrl);
    return `${url.protocol}//${url.host}`.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  } catch (_) {
    return 'default';
  }
}

function sameOrigin(firstUrl, secondUrl) {
  try {
    return new URL(firstUrl).origin === new URL(secondUrl).origin;
  } catch (_) {
    return false;
  }
}

module.exports = { authStatePathFor, authProfileDirFor, sameOrigin };
