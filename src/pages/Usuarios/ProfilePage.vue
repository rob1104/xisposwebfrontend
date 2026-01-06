<template>
  <q-page class="q-pa-xl bg-grey-2">
    <div class="row q-col-gutter-lg items-center q-mb-xl">
      <div class="col-12 col-md-auto">
        <q-avatar size="120px" class="bg-primary text-white shadow-10 border-white-4">
          {{ auth.user?.name?.charAt(0).toUpperCase() }}
        </q-avatar>
      </div>
      <div class="col-12 col-md">
        <div class="text-h4 text-bold text-blue-grey-10 ls-1">{{ auth.user?.name }}</div>
        <div class="text-subtitle1 text-grey-7">{{ auth.user?.email }}</div>
        <q-chip color="blue-grey-10" text-color="white" icon="verified_user" class="q-mt-sm">
          {{ auth.roles[0] || 'Usuario' }}
        </q-chip>
      </div>
    </div>

    <div class="row q-col-gutter-xl">
      <div class="col-12 col-md-7 q-gutter-y-lg">

        <q-card flat bordered class="menu-radius shadow-2">
          <q-card-section class="q-pa-lg">
            <div class="text-h6 text-bold q-mb-md">
              <q-icon name="manage_accounts" color="primary" class="q-mr-sm" />
              Información de Cuenta
            </div>
            <q-form @submit="updateProfile" class="row q-col-gutter-md">
              <div class="col-12">
                <q-input v-model="formName.name" label="Nombre Completo" outlined stack-label />
              </div>
              <div class="col-12">
                <q-input :model-value="auth.user?.email" label="Correo (No editable)" outlined stack-label readonly bg-color="grey-1" />
              </div>
              <div class="col-12 text-right">
                <q-btn label="Actualizar Nombre" color="primary" type="submit" unelevated :loading="loadingName" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="menu-radius shadow-2">
          <q-card-section class="q-pa-lg">
            <div class="text-h6 text-bold q-mb-md text-negative">
              <q-icon name="lock" class="q-mr-sm" />
              Cambiar Contraseña
            </div>
            <q-form @submit="updatePassword" class="row q-col-gutter-md">
              <div class="col-12">
                <q-input v-model="formPass.current_password" type="password" label="Contraseña Actual" outlined stack-label />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="formPass.password" type="password" label="Nueva Contraseña" outlined stack-label />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="formPass.password_confirmation" type="password" label="Confirmar Nueva" outlined stack-label />
              </div>
              <div class="col-12 text-right">
                <q-btn label="Cambiar Contraseña" color="negative" type="submit" flat class="text-bold" :loading="loadingPass" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-5 q-gutter-y-lg">

        <q-card flat bordered class="menu-radius shadow-1">
           <q-card-section>
            <q-list separator v-if="auth.sucursales.length > 0">
              <q-item v-for="sucursal in auth.sucursales" :key="sucursal.id">
                <q-item-section avatar>
                  <q-icon name="location_on" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-bold">{{ sucursal.nombre }}</q-item-label>
                  <q-item-label caption>{{ sucursal.address || 'Sin dirección' }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge :color="auth.sucursalSeleccionada?.id === sucursal.id ? 'positive' : 'grey-7'">
                    {{ auth.sucursalSeleccionada?.id === sucursal.id ? 'Activa' : 'Disponible' }}
                  </q-badge>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-center q-pa-md text-grey">
              No tienes sucursales asignadas.
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="menu-radius shadow-1">
          <q-card-section class="q-pa-lg">
            <div class="text-subtitle1 text-bold q-mb-md">Permisos del Sistema</div>
            <div class="row q-gutter-xs">
              <q-badge v-for="perm in auth.permissions" :key="perm.id" color="purple" class="q-pa-xs">
                {{ perm.replace('_', ' ') }}
              </q-badge>
              <div v-if="!auth.permissions?.length" class="text-caption text-blue-grey-3">Permisos heredados de administrador global.</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
  import { reactive, ref } from 'vue'
  import { useAuthStore } from 'src/stores/auth'
  import { api } from 'src/boot/axios'
  import { useQuasar } from 'quasar'

  const auth = useAuthStore()
  const $q = useQuasar()


  const loadingName = ref(false)
  const loadingPass = ref(false)

  const formName = reactive({ name: auth.user?.name })
  const formPass = reactive({
    current_password: '',
    password: '',
    password_confirmation: ''
  })

  const updateProfile = async () => {
    loadingName.value = true
    try {
      await api.post('/api/perfil/update-name', formName)
      auth.user.name = formName.name // Actualización reactiva inmediata
      $q.notify({ color: 'positive', message: 'Nombre actualizado' })
    } catch (e) {
      $q.notify({ color: 'negative', message: 'Error al actualizar nombre' })
    } finally {
      loadingName.value = false
    }
  }

  const updatePassword = async () => {
    if (formPass.password !== formPass.password_confirmation) {
      return $q.notify({ color: 'warning', message: 'Las contraseñas no coinciden' })
    }
    loadingPass.value = true
    try {
      await api.post('/api/perfil/update-password', formPass)
      $q.notify({ color: 'positive', message: 'Contraseña cambiada exitosamente' })
      formPass.current_password = ''; formPass.password = ''; formPass.password_confirmation = ''
    } catch (e) {
      const msg = e.response?.data?.message || 'Error de validación'
      $q.notify({ color: 'negative', message: msg })
    } finally {
      loadingPass.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .border-white-4 { border: 4px solid white; }
  .ls-1 { letter-spacing: 1px; }
  .shadow-10 { box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; }
</style>
