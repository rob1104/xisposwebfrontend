<template>
  <q-dialog v-model="internalValue" persistent backdrop-filter="blur(8px) brightness(30%)">
    <q-card style="width: 450px; border-radius: 24px;" class="bg-blue-grey-10 text-white shadow-24 overflow-hidden">

      <q-card-section class="q-pa-md bg-blue-grey-9 row items-center">
        <q-icon
          :name="step === 'auth' ? 'security' : 'edit_notifications'"
          :color="step === 'auth' ? 'orange-5' : 'cyan'"
          size="md"
          class="q-mr-sm"
        />
        <div>
          <div class="text-h6 text-bold">
            {{ step === 'auth' ? 'Autorización Requerida' : 'Ajustar Precio' }}
          </div>
          <div class="text-caption text-grey-4 text-uppercase letter-spacing-1">
            {{ item?.nombre }}
          </div>
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup color="grey-6" />
      </q-card-section>

      <q-separator dark />

      <q-tab-panels v-model="step" animated class="bg-transparent">
        <q-tab-panel name="auth" class="q-pa-lg">
          <div class="text-center q-mb-lg">
            <q-avatar size="100px" font-size="52px" color="blue-grey-8" text-color="orange-5" icon="lock_person" class="shadow-10" />
            <p class="q-mt-md text-grey-4">Seleccione su usuario y autorice la operación</p>
          </div>

          <div class="q-gutter-y-md">
            <q-select
              v-model="gerenteSeleccionado"
              :options="listaGerentes"
              option-label="name"
              label="Seleccione Gerente / Administrador"
              dark filled color="orange-5"
              bg-color="blue-grey-9"
              class="premium-input"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps" class="text-white">
                  <q-item-section avatar>
                    <q-icon name="account_circle" color="orange-5" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.name }}</q-item-label>
                    <q-item-label caption class="text-grey-5">{{ scope.opt.email }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-input
              v-model="password"
              type="password"
              label="Contraseña de autorización"
              dark filled color="orange-5"
              bg-color="blue-grey-9"
              @keyup.enter="validarGerente"
              class="premium-input"
            >
              <template v-slot:prepend>
                <q-icon name="key" />
              </template>
            </q-input>

            <q-btn
              label="VALIDAR IDENTIDAD"
              color="orange-9"
              class="full-width q-py-md text-bold shadow-5"
              unelevated
              :loading="loading"
              @click="validarGerente"
              style="border-radius: 12px;"
            />
          </div>
        </q-tab-panel>

        <q-tab-panel name="form" class="q-pa-lg column q-gutter-y-md">

          <div class="text-overline text-cyan text-bold q-ml-xs">Listas de Precios Sugeridas</div>

          <q-list bordered separator dark class="rounded-borders bg-blue-grey-9 shadow-5">
            <q-item
              v-for="p in listaPrecios" :key="p.id"
              clickable v-ripple
              @click="nuevoPrecio = p.precio"
              :active="nuevoPrecio === p.precio"
              active-class="bg-cyan-10 text-white text-bold"
              class="q-py-md"
            >
              <q-item-section>
                <q-item-label>{{ p.nombre_lista }}</q-item-label>
              </q-item-section>
              <q-item-section side class="text-h6 text-white text-bold">
                $ {{ Number(p.precio).toFixed(2) }}
              </q-item-section>
            </q-item>

            <div v-if="listaPrecios.length === 0" class="q-pa-md text-center text-grey-5 italic">
              No hay precios alternos configurados
            </div>
          </q-list>

          <div class="row q-col-gutter-sm items-end">
            <div class="col-12">
              <q-input
                v-model.number="nuevoPrecio"
                label="Precio Final a Aplicar"
                prefix="$"
                dark filled type="number"
                color="cyan"
                bg-color="blue-grey-9"
                input-class="text-h4 text-bold text-yellow glow-text"
                class="premium-input"
              />
            </div>
          </div>

          <div class="q-gutter-y-sm">
            <div class="text-overline text-grey-5 q-ml-xs">Justificación del ajuste</div>
            <q-select
              v-model="motivo"
              :options="opcionesMotivo"
              label="Seleccione un motivo"
              dark filled color="cyan"
              bg-color="blue-grey-9"
            />
            <q-input
              v-if="motivo === 'Otro'"
              v-model="motivoDetalle"
              label="Especifique la razón..."
              dark filled dense color="cyan"
              bg-color="blue-grey-9"
            />
          </div>

          <q-btn
            label="CONFIRMAR CAMBIO"
            color="positive"
            class="full-width q-py-md text-bold text-h6 shadow-10"
            unelevated
            icon="check_circle"
            :disable="!nuevoPrecio || !motivo || (motivo === 'Otro' && !motivoDetalle)"
            @click="confirmarCambio"
            style="border-radius: 15px;"
          />
        </q-tab-panel>
      </q-tab-panels>

      <q-card-section class="q-pa-md text-center">
        <q-btn flat label="Cancelar operación" color="grey-6" v-close-popup class="text-bold" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { api } from 'src/boot/axios'
import { useQuasar } from 'quasar'

const props = defineProps(['modelValue', 'item'])
const emit = defineEmits(['update:modelValue', 'change'])

const $q = useQuasar()
const step = ref('auth') // auth | form
const password = ref('')
const loading = ref(false)

const listaGerentes = ref([])
const gerenteSeleccionado = ref(null)

const nuevoPrecio = ref(0)
const motivo = ref('')
const motivoDetalle = ref('')
const listaPrecios = ref([])
const opcionesMotivo = ['Promoción especial', 'Error en etiqueta', 'Ajuste por volumen', 'Cliente VIP', 'Otro']

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Resetear y cargar datos al abrir
watch(internalValue, (val) => {
  if (val) {
    step.value = 'auth'
    password.value = ''
    motivo.value = ''
    motivoDetalle.value = ''
    gerenteSeleccionado.value = null
    nuevoPrecio.value = Number(props.item?.precio || 0)
    cargarGerentes()
    cargarListasDePrecios()
  }
})

const cargarGerentes = async () => {
  try {
    const { data } = await api.get('/api/auth/gerentes')
    listaGerentes.value = data
  } catch (e) {
    $q.notify({ color: 'negative', message: 'Error al cargar lista de gerentes', icon: 'error' })
  }
}

const cargarListasDePrecios = async () => {
  if (!props.item?.id) return
  try {
    const { data } = await api.get(`/api/productos/${props.item.id}/precios`)
    listaPrecios.value = data
  } catch (e) {
    console.error("Error cargando precios alternos")
  }
}

const validarGerente = async () => {
  if (!gerenteSeleccionado.value || !password.value) {
    $q.notify({ message: 'Seleccione un gerente e ingrese la clave', color: 'warning', icon: 'priority_high' })
    return
  }

  loading.value = true
  try {
    await api.post('/api/auth/verificar-gerente', {
      user_id: gerenteSeleccionado.value.id,
      password: password.value
    })
    $q.notify({ color: 'positive', message: `Bienvenido ${gerenteSeleccionado.value.name}`, icon: 'verified_user', timeout: 800 })
    step.value = 'form'
  } catch (e) {
    const msg = e.response?.data?.message || 'Credenciales inválidas'
    $q.notify({ color: 'negative', message: msg, position: 'bottom', icon: 'lock_reset' })
  } finally {
    loading.value = false
  }
}

const confirmarCambio = () => {
  const finalMotivo = motivo.value === 'Otro' ? motivoDetalle.value : motivo.value
  console.log(gerenteSeleccionado.value)
  emit('change', {
    precio: Number(nuevoPrecio.value),
    motivo: finalMotivo,
    autorizado_por: gerenteSeleccionado.value?.name
  })
  internalValue.value = false
}
</script>

<style lang="scss" scoped>
  .letter-spacing-1 { letter-spacing: 1.5px; }

  .premium-input :deep(.q-field__control) {
    border-radius: 12px;
    background: rgba(0,0,0,0.1) !important;
  }

  .glow-text {
    text-shadow: 0 0 15px rgba(255, 235, 59, 0.3);
  }

  .shadow-24 {
    box-shadow: 0 24px 48px rgba(0,0,0,0.5) !important;
  }
</style>
