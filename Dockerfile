# Utiliza la imagen oficial de Node.js como base
FROM node:18-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencias al contenedor
COPY package*.json ./

# Instala TODAS las dependencias, incluidas las devDependencies
RUN npm install

# Copia el resto de los archivos del proyecto
COPY . .

# Construye la aplicación para producción
RUN npm run build

# Expone el puerto 5173 (Vite)
EXPOSE 5173

# Comando para iniciar el servidor en modo preview con el puerto 5173
CMD ["npm", "run", "preview", "--", "--host", "--port", "5173"]
