const fs = require('fs');
let code = fs.readFileSync('d:/Escritorio/XisPOS 3.0/xisposfrontend/src/pages/Configuracion/ConfiguracionPage.vue', 'utf8');

const regex = /<div class="row q-col-gutter-xl">\s*<div class="col-12">\s*<div class="text-subtitle1 text-bold q-mb-md">Servidores de Impresin[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

code = code.replace(regex, '');

// Clean up script logic
code = code.replace(/const sucursales = ref\(\[\]\)\s*const cargarSucursales = async \(\) => {[\s\S]*?}\n\n/g, '');
code = code.replace(/if \(sucursales\.value\.length > 0\) {\s*await api\.post\('\/api\/sucursales\/impresoras', { sucursales: sucursales\.value }\)\s*}\n/g, '');
code = code.replace(/await cargarSucursales\(\)/g, '');

fs.writeFileSync('d:/Escritorio/XisPOS 3.0/xisposfrontend/src/pages/Configuracion/ConfiguracionPage.vue', code);
