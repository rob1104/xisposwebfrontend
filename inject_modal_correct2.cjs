const fs = require('fs');
let code = fs.readFileSync('d:/Escritorio/XisPOS 3.0/xisposfrontend/src/components/Sucursales/TicketConfigModal.vue', 'utf8');

const printConfig = `
          <div class="config-card">
            <div class="row items-center q-mb-md">
              <q-avatar icon="print" color="cyan-1" text-color="cyan-9" size="md" />
              <div class="text-subtitle1 text-bold q-ml-sm text-blue-grey-9">Servidores de Impresión</div>
            </div>

            <div class="q-mb-md">
              <q-input
                v-model="config.impresora_general_url"
                label="IP Servidor General (Tickets)"
                outlined
                dense
                bg-color="white"
                color="primary"
                placeholder="Ej: http://127.0.0.1:5000"
              >
                <template v-slot:prepend><q-icon name="receipt_long" size="sm"/></template>
              </q-input>
            </div>

            <div>
              <q-input
                v-model="config.impresora_cocina_url"
                label="IP Servidor Cocina (Comandas)"
                outlined
                dense
                bg-color="white"
                color="primary"
                placeholder="Ej: http://127.0.0.1:5001"
              >
                <template v-slot:prepend><q-icon name="restaurant_menu" size="sm"/></template>
              </q-input>
            </div>
          </div>
`;

const regexFooterBtn = /(<q-btn[\s\S]*?label="Nueva L.nea Inferior"[\s\S]*?\/>\s*<\/div>)/;
code = code.replace(regexFooterBtn, '$1\n' + printConfig);

fs.writeFileSync('d:/Escritorio/XisPOS 3.0/xisposfrontend/src/components/Sucursales/TicketConfigModal.vue', code);
