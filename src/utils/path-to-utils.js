export const readXMLFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const xmlString = event.target.result;
      resolve(xmlString);
    };
    reader.onerror = () => {
      reject(new Error("Error al leer el archivo XML"));
    };
    reader.readAsText(file);
  });
};
