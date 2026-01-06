<template>
  <q-page class="q-pa-xl bg-grey-2">
    <div class="row q-col-gutter-lg justify-center">
      <div class="col-12 col-md-8">
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


  console.log('configStore:', configStore.logoUrl)

  const form = reactive({
    nombre_tienda: '',
    logo_file: null
  })

  watch(() => configStore.nombreTienda, (nuevoNombre) => {
    if (nuevoNombre && nuevoNombre !== 'Cargando...') {
      form.nombre_tienda = nuevoNombre
    }
  }, { immediate: true })

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
        })
  }
</script>
