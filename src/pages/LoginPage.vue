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
import { ref } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const auth = useAuthStore()
const router = useRouter()
const loading = ref(false)

const form = ref({
  email: 'admin@pos.com',
  password: 'password'
})

const onSubmit = async () => {
  loading.value = true
  try {
    await auth.login(form.value)
    $q.notify({ color: 'positive', message: '¡Bienvenido!', icon: 'check' })
    router.push('/dashboard')
  } catch (error) {
    console.error(error)
    $q.notify({ color: 'negative', message: 'Error de conexión o credenciales', icon: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
