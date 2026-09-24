const fs = require('fs');
let code = fs.readFileSync('d:/Escritorio/XisPOS 3.0/xisposfrontend/src/components/Pos/TurnoHistorial.vue', 'utf8');

const searchStr = `    watch(() => props.sucursalId, () =>{
      cargarTurnos()
    })`;

const replaceStr = `    watch(() => props.sucursalId, () =>{
      cargarTurnos()
    })

    watch(() => auth.sucursalSeleccionada, () =>{
      cargarTurnos()
    }, { deep: true })`;

code = code.replace(searchStr, replaceStr);
fs.writeFileSync('d:/Escritorio/XisPOS 3.0/xisposfrontend/src/components/Pos/TurnoHistorial.vue', code);
