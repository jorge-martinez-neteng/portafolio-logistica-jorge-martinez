# Despliegue del Sistema Central YGO en Windows Server 2019

1. Instale Python 3.12 x64, Node.js LTS y Microsoft ODBC Driver 18 for SQL Server.
2. Copie el proyecto al servidor `10.0.0.1` y cree el entorno Python desde la raiz:

   ```powershell
   py -3.12 -m venv .venv
   .\.venv\Scripts\python.exe -m pip install --upgrade pip
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   ```

3. Copie manualmente el archivo `.env` privado a la raiz del proyecto. No lo agregue a Git. Configure ahi `SIMPLIROUTE_TOKEN` o `SIMPLIROUTE_API_KEY`.
4. Instale las dependencias del frontend:

   ```powershell
   cd portafolio-frontend-jorge-martinez
   npm ci
   cd ..
   ```

5. Permita los puertos TCP `8000` (FastAPI) y `4173` (frontend) en el Firewall de Windows para las redes autorizadas.
6. Revise que SQL Server sea accesible en `10.0.0.1\COMPAC` y ejecute `iniciar_produccion.bat` desde la raiz. El script inicia FastAPI y compila e inicia la vista previa de React.

El endpoint del frontend usa `http://10.0.0.1:8000` por defecto. El acceso temporal de pruebas queda deshabilitado en el script de produccion.
