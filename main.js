'use strict';
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

// Win7 + black screen fix
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors,VizDisplayCompositor');

// Data next to .exe (not AppData)
function getDataDir() {
  return path.join(app.isPackaged ? path.dirname(process.execPath) : __dirname, 'mizan-data');
}
const DATA_DIR   = getDataDir();
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE    = path.join(DATA_DIR, 'db.json');

function ensureDirs() {
  [DATA_DIR, BACKUP_DIR].forEach(d => {
    try { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); } catch(e) {}
  });
}

let win = null;

function createWindow() {
  ensureDirs();
  win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 800, minHeight: 500,
    title: 'ميزان POS',
    icon: path.join(__dirname, 'icon.ico'),
    backgroundColor: '#07090f',
    show: false,
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      sandbox: false, webSecurity: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  Menu.setApplicationMenu(null);
  const htmlFile = path.join(__dirname, 'src', 'index.html');
  if (!fs.existsSync(htmlFile)) {
    dialog.showErrorBox('خطأ', 'الملف غير موجود:\n' + htmlFile);
    app.quit(); return;
  }
  win.loadFile(htmlFile);
  win.once('ready-to-show', () => { win.show(); win.focus(); });
  setTimeout(() => { if (win && !win.isVisible()) win.show(); }, 3000);
  win.on('closed', () => { win = null; });
  win.webContents.on('did-fail-load', (e, code, desc, url) => {
    dialog.showErrorBox('فشل التحميل', `${code}: ${desc}\n${htmlFile}`);
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!win) createWindow(); });

// IPC
ipcMain.handle('db:save', async (_, data) => {
  try {
    ensureDirs();
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, data, 'utf8');
    if (fs.existsSync(DB_FILE)) fs.renameSync(DB_FILE, DB_FILE + '.bak');
    fs.renameSync(tmp, DB_FILE);
    return { ok: true };
  } catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('db:load', async () => {
  try {
    if (fs.existsSync(DB_FILE)) return { ok: true, data: fs.readFileSync(DB_FILE, 'utf8') };
    const bak = DB_FILE + '.bak';
    if (fs.existsSync(bak)) return { ok: true, data: fs.readFileSync(bak, 'utf8') };
    return { ok: true, data: null };
  } catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('dialog:save', async (_, filename, data) => {
  try {
    const desk = path.join(os.homedir(), 'Desktop');
    const { filePath } = await dialog.showSaveDialog(win, {
      defaultPath: path.join(fs.existsSync(desk) ? desk : os.homedir(), filename || 'backup.json'),
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!filePath) return { ok: false };
    fs.writeFileSync(filePath, data, 'utf8');
    return { ok: true, path: filePath };
  } catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('dialog:open', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog(win, {
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
    });
    if (!filePaths?.length) return { ok: false };
    return { ok: true, data: fs.readFileSync(filePaths[0], 'utf8'), path: filePaths[0] };
  } catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('backup:auto', async (_, data) => {
  try {
    ensureDirs();
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const file = path.join(BACKUP_DIR, 'backup-' + ts + '.json');
    fs.writeFileSync(file, data, 'utf8');
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json')).sort().reverse();
    files.slice(50).forEach(f => { try { fs.unlinkSync(path.join(BACKUP_DIR, f)); } catch(e) {} });
    return { ok: true, path: file };
  } catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('app:info', () => ({
  version: app.getVersion(), dataDir: DATA_DIR,
  backupDir: BACKUP_DIR, dbFile: DB_FILE,
  platform: process.platform, arch: process.arch,
  isElectron: true, isPackaged: app.isPackaged,
}));

ipcMain.on('win:minimize', () => win?.minimize());
ipcMain.on('win:maximize', () => win?.isMaximized() ? win.unmaximize() : win.maximize());
ipcMain.on('win:close',    () => win?.close());
