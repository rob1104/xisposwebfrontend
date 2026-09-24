<template>
  <q-page class="q-pa-xl bg-grey-2">
    <div class="row q-col-gutter-lg justify-center">
      <div class="col-12 col-md-8">
        <div class="text-h6 q-mb-md">Ajustes del Sistema</div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold">Mantenimiento de Inventarios</div>
        <div class="text-caption text-grey-7">
          Esta herramienta busca productos que no existan en las tablas de stock de las sucursales y los agrega con valor cero.
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          label="Sincronizar Stock en Ceros"
          icon="sync"
          color="primary"
          :loading="loadingSync"
          @click="confirmarSincronizacion"
        />
      </q-card-actions>
    </q-card>
        <q-card flat bordered class="shadow-2 menu-radius overflow-hidden">
          <q-card-section class="bg-blue-grey-10 text-white q-pa-lg">
            <div class="text-h5 text-bold uppercase tracking-widest">Identidad Visual</div>
            <div class="text-caption text-blue-grey-3">Personalice el nombre y logotipo de su sistema</div>
          </q-card-section>

          <q-form @submit="saveSettings" class="q-pa-xl">
            <div class="row q-col-gutter-xl">
              <div class="col-12 col-md-6">
                <div class="text-subtitle1 text-bold q-mb-md">Información General</div>
                <q-input
                  v-model="form.nombre_tienda"
                  label="Nombre de la Tienda *"
                  outlined
                  stack-label
                  class="q-mb-md"
                  :rules="[val => !!val || 'El nombre es obligatorio']"
                />
                <q-banner dense class="bg-blue-1 text-primary rounded-borders q-pa-md">
                  <q-icon name="info" class="q-mr-sm" />
                  Este nombre aparecerá en el Sidebar, Header y Tickets de venta.
                </q-banner>
              </div>

              <div class="col-12 col-md-6 text-center">
                <div class="text-subtitle1 text-bold q-mb-md">Logotipo del Sistema</div>

                <q-avatar size="150px" class="q-mb-md shadow-5 bg-white border-primary q-pa-sm">
                  <q-img
                    :src="previewLogo || configStore.logoUrl || 'assets/no-logo.png'"
                    fit="contain"
                    spinner-color="primary"
                  >
                    <template v-slot:error>
                      <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
                        Logo no encontrado
                      </div>
                    </template>
                  </q-img>
                </q-avatar>

                <q-file
                  v-model="form.logo_file"
                  label="Seleccionar Nuevo Logo"
                  outlined
                  dense
                  accept=".png, .jpg, .jpeg"
                  @update:model-value="onLogoSelected"
                >
                  <template v-slot:prepend><q-icon name="cloud_upload" /></template>
                </q-file>
              </div>
            </div>

            <q-separator class="q-my-xl" />

            <div class="row q-col-gutter-xl">
              <div class="col-12">
                <div class="text-subtitle1 text-bold q-mb-md">Servidores de Impresin (XisPOS Bridge) por Sucursal</div>
                <div class="text-caption text-grey-7 q-mb-md">
                  Rutas donde el sistema enviar los comandos de impresin para cada sucursal. 
                  Si dejas esto en blanco o como "http://127.0.0.1:5000", se imprimir en la computadora actual. 
                  Si usas tablets, pon la IP local de la caja (Ej: http://192.168.1.10:5000).
                </div>
              </div>
              
              <div v-for="sucursal in sucursales" :key="sucursal.id" class="col-12 row q-col-gutter-md q-pb-md" style="border-bottom: 1px dashed #ccc;">
                <div class="col-12 text-subtitle2 text-primary">{{ sucursal.nombre }}</div>
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="sucursal.impresora_general_url"
                    label="URL Servidor General (Tickets) *"
                    outlined
                    stack-label
                    placeholder="Ej: http://127.0.0.1:5000"
                  >
                    <template v-slot:prepend><q-icon name="receipt_long" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="sucursal.impresora_cocina_url"
                    label="URL Servidor Cocina (Comandas) *"
                    outlined
                    stack-label
                    placeholder="Ej: http://127.0.0.1:5001"
                  >
                    <template v-slot:prepend><q-icon name="restaurant_menu" /></template>
                  </q-input>
                </div>
              </div>
            </div>

            <q-separator class="q-my-xl" />

            <div class="row justify-end">
              <q-btn
                label="Guardar Configuración"
                color="primary"
                type="submit"
                size="lg"
                unelevated
                class="q-px-xl text-bold"
                :loading="saving"
              />
            </div>
          </q-form>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
  import { ref, watch, reactive, onMounted } from 'vue'
  import { api } from 'src/boot/axios'
  import { useQuasar } from 'quasar'
  import { useConfigStore } from 'src/stores/config'

  const $q = useQuasar()
  const configStore = useConfigStore()
  const saving = ref(false)
  const previewLogo = ref(null)
  const loadingSync = ref(false)

  const confirmarSincronizacion = () => {
    $q.dialog({
      title: 'Confirmar Acción',
      message: '¿Deseas inicializar los registros faltantes de inventario en todas las sucursales?',
      cancel: true,
      persistent: true
    }).onOk(() => {
      ejecutarSincronizacion()
    })
  }

  const ejecutarSincronizacion = async () => {
    loadingSync.value = true
    try {
      const { data } = await api.post('/api/config/sincronizar-inventarios')
      $q.notify({
        type: 'positive',
        message: data.message,
        icon: 'done'
      })
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Error al sincronizar inventarios'
      })
    } finally {
      loadingSync.value = false
    }
  }

  const sucursales = ref([])

  const cargarSucursales = async () => {
    try {
      const { data } = await api.get('/api/sucursales')
      data.forEach(s => {
        if (!s.impresora_general_url) s.impresora_general_url = 'http://127.0.0.1:5000'
        if (!s.impresora_cocina_url) s.impresora_cocina_url = 'http://127.0.0.1:5001'
      })
      sucursales.value = data
    } catch (error) {
      console.error('Error cargando sucursales', error)
    }
  }

  const form = reactive({
    nombre_tienda: '',
    logo_file: null,
    impresora_general_url: 'http://127.0.0.1:5000',
    impresora_cocina_url: 'http://127.0.0.1:5000'
  })

  watch(() => configStore, (store) => {
    if (store.nombreTienda && store.nombreTienda !== 'Cargando...') {
      form.nombre_tienda = store.nombreTienda
    }
    if (store.impresoraGeneralUrl) {
      form.impresora_general_url = store.impresoraGeneralUrl
    }
    if (store.impresoraCocinaUrl) {
      form.impresora_cocina_url = store.impresoraCocinaUrl
    }
  }, { deep: true, immediate: true })

  const onLogoSelected = (file) => {
    if (file) previewLogo.value = URL.createObjectURL(file)
  }

  const saveSettings = async () => {
    saving.value = true
    try {
      const formData = new FormData()
      formData.append('nombre_tienda', form.nombre_tienda)
      
      if (form.logo_file) formData.append('logo', form.logo_file)

      await api.post('/api/config/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (sucursales.value.length > 0) {
        await api.post('/api/sucursales/impresoras', { sucursales: sucursales.value })
      }

      // Actualizar el store global de inmediato
      await configStore.loadConfig()

      $q.notify({ color: 'positive', message: 'Cambios aplicados con éxito', icon: 'check' })
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Error al actualizar configuración: ' + e.message })
    } finally {
      saving.value = false
    }



    onMounted(async () => {
      if (configStore.nombreTienda === 'Cargando...') {
        await configStore.fetchConfig()
      }
      await cargarSucursales()
    })
  }

</script>
