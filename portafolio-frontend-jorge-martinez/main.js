const { app, BrowserWindow } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");

let mainWindow;

function createWindow() {
  // 💻 1. Configuramos las propiedades físicas de tu ventana en Windows
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 600,
    title: "Sistema Logístico Central - Planta TI",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 📡 2. Evaluamos el entorno:
  // Si estamos programando en tu laptop, jala el puerto vivo de Vite.
  // Si ya es para los operarios del almacén, lee los archivos estáticos compilados.
  mainWindow.loadURL(
    isDev
      ? "http://localhost:5173"
      : `file://${path.join(__dirname, "../dist/index.html")}`,
  );

  // Ocultamos la barra de menús antigua de Windows para dar un diseño limpio tipo app moderna
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// 🧼 3. Ciclo de vida de la aplicación de escritorio
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
