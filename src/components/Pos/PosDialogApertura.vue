<template>
  <q-dialog v-model="internalValue" persistent backdrop-filter="blur(10px)">
    <q-card style="width: 500px; border-radius: 20px;" class="bg-blue-grey-10 text-white shadow-24 overflow-hidden">

      <q-card-section class="bg-gradient-primary q-pa-lg text-center relative-position">
        <div class="absolute-top-right q-pa-md">
          <q-icon name="security" size="sm" color="white" class="opacity-50" />
        </div>
        <q-icon name="meeting_room" size="xl" class="shadow-2 border-radius-50 q-pa-sm bg-white-10" />
        <div class="text-h5 text-bold q-mt-sm tracking-wide">APERTURA DE CAJA</div>
        <div class="text-caption text-blue-grey-2">Requiere autorización de gerente</div>
      </q-card-section>

      <q-card-section class="q-pa-lg q-gutter-y-md">

        <div class="row q-col-gutter-md">
          <div class="col-6">
            <div class="text-overline text-grey-5 q-mb-xs">Fondo Inicial</div>
            <q-input
              v-model.number="form.fondo_apertura"
              type="number"
              dark filled dense
              prefix="$"
              class="text-h6 input-premium"
              autofocus
              @focus="$event.target.select()"
            />
          </div>
          <div class="col-6">
            <div class="text-overline text-grey-5 q-mb-xs">Tipo Cambio (USD)</div>
            <q-input
              v-model.number="form.tipo_cambio"
              type="number"
              dark filled dense
              prefix="$"
              class="text-h6 input-premium"
            />
          </div>
        </div>

        <q-separator dark class="q-my-md opacity-20" />

        <div class="bg-blue-grey-9 q-pa-md rounded-borders border-dashed-white">
          <div class="text-subtitle2 text-yellow-8 q-mb-md flex items-center">
            <q-icon name="lock" class="q-mr-xs" /> AUTORIZACIÓN GERENCIAL
          </div>

          <q-select
            v-model="supervisorSeleccionado"
            :options="listaSupervisores"
            option-label="name"
            option-value="email"
            label="Seleccionar Supervisor"
            dark filled dense
            color="yellow-8"
            class="q-mb-md"
            :rules="[val => !!val || 'Requerido']"
          >
            <template v-slot:prepend><q-icon name="supervisor_account" /></template>
          </q-select>

          <q-input
            v-model="form.supervisor_password"
            type="password"
            label="Contraseña de Supervisor"
            dark filled dense
            color="yellow-8"
            @keyup.enter="abrirCaja"
          >
            <template v-slot:prepend><q-icon name="vpn_key" /></template>
          </q-input>
        </div>

      </q-card-section>

      <q-card-actions class="q-pa-lg bg-blue-grey-10100">
        <q-btn
          label="Cancelar"
          flat
          color="grey-5"
          class="q-px-md"
          v-close-popup
        />
        <q-space />
        <q-btn
          label="Autorizar y Abrir"
          color="positive"
          class="q-px-lg shadow-3"
          icon="verified_user"
          unelevated
          :loading="cargando"
          @click="abrirCaja"
          :disable="!form.fondo_apertura || !supervisorSeleccionado || !form.supervisor_password"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { usePosStore } from 'src/stores/pos'
  import { useQuasar } from 'quasar'
  import { api } from 'src/boot/axios'

  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])
  const posStore = usePosStore()
  const $q = useQuasar()

  const form = ref({
    fondo_apertura: 0,
    tipo_cambio: 1.00,
    supervisor_password: ''
  })

  const supervisorSeleccionado = ref(null)
  const listaSupervisores = ref([])
  const cargando = ref(false)

  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })


  const cargarSupervisores = async () => {
    try {
      const { data } = await api.get('/api/users')
      listaSupervisores.value = data.filter(usuario =>
        usuario.role === 'Administrador' || usuario.role === 'Gerente'
      )
    } catch (e) {
      console.error("Error cargando usuarios")
    }
  }

  const abrirCaja = async () => {
    if (form.value.tipo_cambio <= 0) {
      $q.notify({ color: 'warning', message: 'Verifique el tipo de cambio' })
      return
    }

    if (!supervisorSeleccionado.value || !form.value.supervisor_password) {
      $q.notify({ color: 'negative', message: 'Faltan credenciales de autorización' })
      return
    }

    cargando.value = true
    try {
      const payload = {
        fondo_apertura: form.value.fondo_apertura,
        tipo_cambio: form.value.tipo_cambio,

        supervisor_email: supervisorSeleccionado.value.email,
        supervisor_password: form.value.supervisor_password
      }

      await posStore.abrirTurno(payload)

      internalValue.value = false
      $q.notify({
        color: 'positive',
        message: 'TURNO AUTORIZADO Y ABIERTO',
        icon: 'admin_panel_settings',
        position: 'top'
      })
      form.value.supervisor_password = ''
      supervisorSeleccionado.value = null

    } catch (e) {
      const msg = e.response?.data?.message || 'Error al abrir caja'
      $q.notify({ color: 'negative', message: msg, icon: 'security' })
    } finally {
      cargando.value = false
    }
  }

  onMounted(async() => {
    await cargarSupervisores()
    try {
      const { data } = await api.get('/api/pos/sugerencia-apertura')
      form.value.tipo_cambio = Number(data.tipo_cambio)
    } catch (e) {}
  })

</script>

<style scoped>
  .bg-gradient-primary {
    background: linear-gradient(135deg, var(--q-primary) 0%, #0d47a1 100%);
  }
  .bg-white-10 { background: rgba(255,255,255,0.1); }
  .border-dashed-white { border: 1px dashed rgba(255,255,255,0.3); }
  .input-premium :deep(.q-field__control) {
    background: rgba(0,0,0,0.2) !important;
  }
</style>
