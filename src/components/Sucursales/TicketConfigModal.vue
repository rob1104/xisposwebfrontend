<template>
  <q-dialog
    v-model="show"
    full-width
    persistent
  >
    <q-card class="bg-grey-1 shadow-24" style="max-width: 1100px; width: 90vw; border-radius: 20px;">

      <q-card-section class="row items-center q-py-md bg-primary text-white">
        <div class="text-h5 text-bold flex items-center">
          <q-icon name="settings_suggest" size="md" class="q-mr-sm" />
          Configuración de Ticket: <span class="q-ml-sm text-weight-light">{{ sucursal?.nombre }}</span>
        </div>
        <q-space />

      </q-card-section>

      <q-card-section class="row q-col-gutter-xl q-pa-xl">

        <div class="col-12 col-md-6 q-gutter-y-lg">

          <div class="config-card">
            <div class="row items-center q-mb-md">
              <q-avatar icon="vertical_align_top" color="cyan-1" text-color="cyan-9" size="md" />
              <div class="text-subtitle1 text-bold q-ml-sm text-blue-grey-9">Encabezado del Ticket</div>
            </div>

            <div v-for="(linea, index) in config.header_lines" :key="'h'+index" class="row q-mb-sm items-center q-gutter-x-sm">
              <q-input
                v-model="config.header_lines[index]"
                outlined
                dense
                class="col"
                bg-color="white"
                color="primary"
                placeholder="Escribe un mensaje de bienvenida..."
              />
              <q-btn icon="delete_outline" color="negative" flat round @click="config.header_lines.splice(index, 1)" />
            </div>

            <q-btn
              label="Nueva Línea Superior"
              icon="add"
              outline
              color="primary"
              class="full-width q-mt-sm border-dashed"
              @click="config.header_lines.push('')"
            />
          </div>

          <div class="config-card">
            <div class="row items-center q-mb-md">
              <q-avatar icon="vertical_align_bottom" color="cyan-1" text-color="cyan-9" size="md" />
              <div class="text-subtitle1 text-bold q-ml-sm text-blue-grey-9">Pie de Página</div>
            </div>

            <div v-for="(linea, index) in config.footer_lines" :key="'f'+index" class="row q-mb-sm items-center q-gutter-x-sm">
              <q-input
                v-model="config.footer_lines[index]"
                outlined
                dense
                class="col"
                bg-color="white"
                color="primary"
                placeholder="Ej: Políticas de devolución..."
              />
              <q-btn icon="delete_outline" color="negative" flat round @click="config.footer_lines.splice(index, 1)" />
            </div>

            <q-btn
              label="Nueva Línea Inferior"
              icon="add"
              outline
              color="primary"
              class="full-width q-mt-sm border-dashed"
              @click="config.footer_lines.push('')"
            />
          </div>
        </div>

        <div class="col-12 col-md-6 flex flex-center bg-grey-3 rounded-borders relative-position overflow-hidden">
          <div class="preview-badge">VISTA PREVIA EN TIEMPO REAL</div>

          <div class="ticket-container shadow-10">
            <div class="ticket-content">

              <div class="text-center q-mb-md">
                <span class="text-primary text-bold" style="font-size: 32px;">[LOGO]</span>

              </div>

              <div class="text-center q-mb-md">
                <div v-for="(linea, i) in config.header_lines" :key="'ph'+i" class="thermal-text">
                  {{ linea || ' ' }}
                </div>
              </div>

              <div class="thermal-divider"></div>

              <div class="q-py-sm">
                <div class="row justify-between thermal-text-sm">
                  <span>1x ARTICULO DE PRUEBA</span>
                  <span>$100.00</span>
                </div>
                <div class="row justify-between thermal-text-sm text-bold q-mt-xs">
                  <span>TOTAL:</span>
                  <span>$100.00</span>
                </div>
              </div>

              <div class="thermal-divider"></div>

              <div class="text-center q-mt-md">
                <div v-for="(linea, i) in config.footer_lines" :key="'pf'+i" class="thermal-text italic">
                  {{ linea || ' ' }}
                </div>
              </div>

              <div class="text-center q-mt-lg text-grey-5" style="font-size: 10px; border-top: 1px solid #eee; padding-top: 10px;">
                Corte de Ticket <br> XisPOS System
              </div>

            </div>
          </div>
        </div>

      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md bg-white">
        <q-btn label="Descartar Cambios" flat color="grey-7" v-close-popup class="q-px-md" />
        <q-btn
          label="Guardar Cambios"
          color="primary"
          unelevated
          class="q-px-xl text-bold"
          @click="saveConfig"
          :loading="saving"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: Boolean,
  sucursal: Object
})

const emit = defineEmits(['update:modelValue'])

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const saving = ref(false)
const $q = useQuasar()

const config = ref({
  header_lines: [''],
  footer_lines: ['']
})

// Sincronizar con el backend
watch(() => props.modelValue, async (val) => {
  if (val && props.sucursal) {
    try {
      const { data } = await api.get(`/api/sucursales/${props.sucursal.id}/ticket-config`)
      if (data) config.value = data
    } catch (e) {
      config.value = { header_lines: ['BIENVENIDO'], footer_lines: ['GRACIAS POR SU COMPRA'] }
    }
  }
})

const saveConfig = async () => {
  saving.value = true
  try {
    await api.post(`/api/sucursales/${props.sucursal.id}/ticket-config`, config.value)
    $q.notify({ color: 'positive', message: 'Diseño actualizado', icon: 'done' })
    show.value = false
  } catch (e) {
    $q.notify({ color: 'negative', message: 'No se pudo guardar la configuración' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.config-card {
  background: white;
  border: 1px solid #ececec;
  border-radius: 12px;
  padding: 20px;
}

.border-dashed {
  border: 2px dashed #e0e0e0;
}

.ticket-container {
  width: 280px;
  background: white;
  padding: 25px 15px;
  min-height: 400px;
  position: relative;
  /* Efecto de sombra para que resalte en el fondo gris */
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);

  &::after {
    content: '';
    position: absolute;
    bottom: -10px; left: 0; right: 0;
    height: 10px;
    background: linear-gradient(-45deg, transparent 5px, white 5px), linear-gradient(45deg, transparent 5px, white 5px);
    background-size: 10px 10px;
  }
}

.thermal-text {
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  color: #333;
  line-height: 1.2;
  text-transform: uppercase;
}

.thermal-text-sm {
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  color: #444;
}

.thermal-divider {
  border-top: 1px dashed #ccc;
  margin: 15px 0;
}

.preview-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  background: -q-primary;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: bold;
}

.italic { font-style: italic; }
</style>
