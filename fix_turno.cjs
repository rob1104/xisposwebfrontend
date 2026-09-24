const fs = require('fs');
let code = fs.readFileSync('d:/Escritorio/XisPOS 3.0/xisposfrontend/src/components/Pos/TurnoHistorial.vue', 'utf8');

const searchStr = `      else {
        if(props.sucursalId) {
          params.sucursal_id = props.sucursalId
        }
      }`;

const replaceStr = `      else {
        const sid = props.sucursalId || auth.sucursalSeleccionada?.id;
        if(sid) {
          params.sucursal_id = sid;
        }
      }`;

code = code.replace(searchStr, replaceStr);
fs.writeFileSync('d:/Escritorio/XisPOS 3.0/xisposfrontend/src/components/Pos/TurnoHistorial.vue', code);
