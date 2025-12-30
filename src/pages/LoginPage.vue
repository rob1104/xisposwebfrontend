<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="bg-secondary flex flex-center">
        <q-card style="width: 400px; max-width: 90vw;" class="q-pa-lg shadow-15">
          <q-card-section class="text-center">
            <div class="text-h5 text-bold text-primary text-uppercase">La Nacional</div>
            <div class="text-subtitle2 text-grey-7">Punto de Venta Web</div>
          </q-card-section>

          <q-card-section>
            <q-form @submit="onSubmit" class="q-gutter-md">
              <q-input
                v-model="form.email"
                label="Correo Electrónico"
                filled
                type="email"
                required
              >
                <template v-slot:prepend><q-icon name="email" /></template>
              </q-input>

              <q-input
                v-model="form.password"
                label="Contraseña"
                filled
                type="password"
                required
              >
                <template v-slot:prepend><q-icon name="lock" /></template>
              </q-input>

              <div class="q-mt-xl">
                <q-btn
                  label="Entrar"
                  type="submit"
                  color="primary"
                  class="full-width"
                  size="lg"
                  :loading="loading"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const auth = useAuthStore()
const router = useRouter()
const $q = useQuasar()

const loading = ref(false)
const form = reactive({
  email: '',
  password: '',
  remember: false
})

const onSubmit = async () => {
  loading.value = true
  try {
    // 1. Ejecutamos el login y esperamos a que el Store actualice el token y el user
    await auth.login(form)

    // 2. Verificamos que los datos del usuario estén disponibles antes de mostrar el mensaje
    if (auth.user) {
      $q.notify({
        color: 'positive',
        message: `¡Bienvenido de nuevo, ${auth.user.name}!`,
        icon: 'verified_user',
        position: 'top'
      })

      // 3. Realizamos la redirección al dashboard
      await router.push('/dashboard')
    }

  } catch (error) {
    // 4. Manejo robusto de errores de Laravel
    let errorMsg = 'No se pudo conectar con el servidor'

    if (error.response) {
      // Error 422: Validación fallida o usuario inactivo
      if (error.response.status === 422) {
        const errors = error.response.data.errors
        errorMsg = errors ? Object.values(errors).flat()[0] : error.response.data.message
      }
      // Error 401: Credenciales incorrectas
      else if (error.response.status === 401) {
        errorMsg = 'El correo o la contraseña son incorrectos'
      }
      else {
        errorMsg = error.response.data.message || errorMsg
      }
    }

    $q.notify({
      color: 'negative',
      message: errorMsg,
      icon: 'lock',
      position: 'bottom',
      actions: [{ label: 'Cerrar', color: 'white' }]
    })
  } finally {
    loading.value = false
  }
}
</script>
