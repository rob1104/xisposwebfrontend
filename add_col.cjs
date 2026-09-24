const fs = require('fs');
let code = fs.readFileSync('d:/Escritorio/XisPOS 3.0/xisposfrontend/src/components/Pos/TurnoHistorial.vue', 'utf8');

const replacement = `$1\n      { name: 'sucursal', label: 'SUCURSAL', field: row => row.sucursal?.nombre || '---', align: 'left', sortable: true },`;
code = code.replace(/({ name: 'user', [^\}]+ },)/, replacement);

fs.writeFileSync('d:/Escritorio/XisPOS 3.0/xisposfrontend/src/components/Pos/TurnoHistorial.vue', code);
