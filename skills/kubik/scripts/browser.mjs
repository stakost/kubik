// browser.mjs: find a Chromium-family browser on this machine, the same way for every script.
//
//   import { findBrowser, browserArgs, needNode } from './browser.mjs';
//
// `findBrowser(given)` returns the path of the first browser found, or null: the one given
// (`--chrome` or CHROME_PATH) first, then the usual places on macOS, Linux and Windows, then the
// caches Playwright and Puppeteer keep, then anything on PATH. `browserArgs(profile, port)` are the
// flags a headless run needs, with the two a container or root needs. `needNode(major, name)` stops
// with a plain sentence when Node is older than the script needs; exit code 3 means "the check could
// not run here", as distinct from 2 (called wrongly) and 1 (the piece has FAILs).
import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';

export const NO_BROWSER = 3;

export function needNode(major, name) {
  const have = Number(process.versions.node.split('.')[0]);
  if (have >= major) return;
  console.error(`${name} needs Node ${major} or newer; this is ${process.version}. The lint (lint.mjs) still runs here: run it, and open your note with "Unchecked: browser audit, because Node ${process.version} cannot run it".`);
  process.exit(NO_BROWSER);
}

const home = homedir();
const win = process.platform === 'win32';
const env = (k) => process.env[k] || '';

// a glob of one level: dir/<anything matching>/rest…
function under(dir, ...rest) {
  if (!existsSync(dir)) return [];
  let found = [dir];
  for (const part of rest) {
    const next = [];
    for (const base of found) {
      if (part === '*') { try { for (const e of readdirSync(base)) next.push(join(base, e)); } catch {} }
      else next.push(join(base, part));
    }
    found = next.filter((p) => existsSync(p));
  }
  return found.filter((p) => { try { return statSync(p).isFile(); } catch { return false; } });
}

function candidates() {
  const list = [];
  if (process.platform === 'darwin') {
    for (const root of ['/Applications', join(home, 'Applications')]) {
      for (const app of ['Google Chrome', 'Chromium', 'Google Chrome Beta', 'Google Chrome Dev', 'Google Chrome Canary', 'Microsoft Edge', 'Brave Browser', 'Vivaldi', 'Arc', 'Opera']) {
        list.push(join(root, `${app}.app`, 'Contents', 'MacOS', app));
      }
    }
    list.push(...under(join(home, 'Library', 'Caches', 'ms-playwright'), '*', '*', 'chrome-headless-shell'));
    list.push(...under(join(home, 'Library', 'Caches', 'ms-playwright'), '*', '*', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'));
    list.push(...under(join(home, '.cache', 'puppeteer', 'chrome-headless-shell'), '*', '*', 'chrome-headless-shell'));
    list.push(...under(join(home, '.cache', 'puppeteer', 'chrome'), '*', '*', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'));
  } else if (win) {
    const roots = [env('PROGRAMFILES'), env('PROGRAMFILES(X86)'), env('LOCALAPPDATA')].filter(Boolean);
    for (const r of roots) {
      list.push(join(r, 'Google', 'Chrome', 'Application', 'chrome.exe'));
      list.push(join(r, 'Google', 'Chrome Beta', 'Application', 'chrome.exe'));
      list.push(join(r, 'Chromium', 'Application', 'chrome.exe'));
      list.push(join(r, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
      list.push(join(r, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'));
    }
    if (env('LOCALAPPDATA')) {
      list.push(...under(join(env('LOCALAPPDATA'), 'ms-playwright'), '*', '*', 'chrome-headless-shell.exe'));
      list.push(...under(join(env('LOCALAPPDATA'), 'ms-playwright'), '*', '*', 'chrome.exe'));
    }
    list.push(...under(join(home, '.cache', 'puppeteer', 'chrome'), '*', '*', 'chrome.exe'));
  } else {
    for (const dir of ['/usr/bin', '/usr/local/bin', '/snap/bin', '/opt/google/chrome', '/opt/microsoft/msedge', '/opt/brave.com/brave']) {
      for (const name of ['google-chrome', 'google-chrome-stable', 'google-chrome-beta', 'chromium', 'chromium-browser', 'chromium-freeworld', 'chrome', 'microsoft-edge', 'microsoft-edge-stable', 'msedge', 'brave-browser', 'brave']) list.push(join(dir, name));
    }
    list.push(...under(join(home, '.cache', 'ms-playwright'), '*', 'chrome-linux', 'chrome'));
    list.push(...under(join(home, '.cache', 'ms-playwright'), '*', 'chrome-linux', 'headless_shell'));
    list.push(...under(join(home, '.cache', 'puppeteer', 'chrome'), '*', '*', 'chrome'));
  }
  // anything on PATH
  const names = win ? ['chrome.exe', 'msedge.exe', 'chromium.exe', 'brave.exe'] : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome', 'microsoft-edge', 'brave-browser'];
  for (const dir of env('PATH').split(delimiter).filter(Boolean)) for (const n of names) list.push(join(dir, n));
  return list;
}

export function findBrowser(given) {
  if (given) return existsSync(given) ? given : null;
  return candidates().find((p) => existsSync(p)) || null;
}

export function browserArgs(profile, port) {
  const a = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-dev-shm-usage', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, 'about:blank'];
  if (typeof process.getuid === 'function' && process.getuid() === 0) a.unshift('--no-sandbox');   // Chrome refuses to run as root without it
  return a;
}

export function noBrowserMessage(name, given) {
  const why = given ? `no browser at ${given}` : 'no Chrome, Chromium, Edge or Brave found on this machine';
  return `${name}: ${why}. Name one with --chrome <path> or CHROME_PATH if you have one. The lint (lint.mjs) does not need a browser: run it, and open your note with "Unchecked: browser audit, because ${why}".`;
}
