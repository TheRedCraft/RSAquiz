# Verwenden Sie ein Node.js-Image als Basis
FROM node:14

# Erstellen Sie ein Verzeichnis für die Anwendung
WORKDIR /server

# Kopieren Sie package.json und package-lock.json
COPY package*.json ./

# Installieren Sie die Abhängigkeiten
RUN npm install

# Kopieren Sie den Rest des Anwendungsquellcodes
COPY . .

# Exponieren Sie den Port, auf dem die Anwendung läuft
EXPOSE 3000

# Starten Sie die Anwendung
CMD ["node", "server.js"]