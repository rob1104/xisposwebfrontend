<template>
  <q-layout view="lHh Lpr lFf" class="bg-auth">
    <q-page-container>
      <q-page class="flex flex-center q-pa-md">

        <q-card class="login-card shadow-24">
          <div class="top-line"></div>

          <q-card-section class="text-center q-pt-xl">
            <q-avatar size="120px" font-size="80px" class="q-mb-md shadow-5 bg-white border-logo">
              <q-img src="~assets/logo-nacional.png" />
            </q-avatar>

            <div class="text-h4 text-bold text-primary ls-2">LA NACIONAL</div>
            <div class="text-subtitle1 text-grey-8 text-weight-light">Gestión de Punto de Venta</div>
          </q-card-section>

          <q-card-section class="q-px-xl q-pb-xl">
            <q-form @submit="onSubmit" class="q-gutter-lg">

              <q-input
                ref="emailInput"
                v-model="form.email"
                label="Correo Electrónico"
                stack-label
                outlined
                color="primary"
                type="email"
                :rules="[val => !!val || 'El correo es obligatorio']"
              >
                <template v-slot:prepend>
                  <q-icon name="person_outline" color="primary" />
                </template>
              </q-input>

              <q-input
                v-model="form.password"
                label="Contraseña"
                stack-label
                outlined
                color="primary"
                type="password"
                :rules="[val => !!val || 'La contraseña es obligatoria']"
              >
                <template v-slot:prepend>
                  <q-icon name="lock_open" color="primary" />
                </template>
              </q-input>

              <div class="q-mt-xl">
                <q-btn
                  label="Iniciar Sesión"
                  type="submit"
                  color="primary"
                  class="full-width custom-btn shadow-3"
                  size="lg"
                  :loading="loading"
                  unelevated
                >
                  <template v-slot:loading>
                    <q-spinner-facebook />
                  </template>
                </q-btn>
              </div>
            </q-form>
          </q-card-section>
        </q-card>

      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const auth = useAuthStore()
const router = useRouter()
const $q = useQuasar()

const loading = ref(false)
const emailInput = ref(null) // Referencia para el autofoco

const form = reactive({
  email: '',
  password: ''
})

// Lógica de Autofoco al montar la página
onMounted(() => {
  setTimeout(() => {
    emailInput.value?.focus()
  }, 300)
})

const onSubmit = async () => {
  loading.value = true
  try {
    await auth.login(form)
    if (auth.user) {
      $q.notify({
        color: 'positive',
        message: `Bienvenido, ${auth.user.name}`,
        icon: 'verified_user',
        position: 'top-right'
      })
      router.push('/dashboard')
    }
  } catch (error) {
    /*const errorMsg = error.response?.data?.message || 'Error de acceso'
    $q.notify({
      color: 'negative',
      message: errorMsg,
      icon: 'lock',
      position: 'bottom'
    })*/
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
  // Paleta de colores personalizada para La Nacional
  .bg-auth {
    background: linear-gradient(135deg, #2c3e50 0%, #bdc3c7 100%);
    // Si prefieres el rojo de La Nacional como base:
    // background: linear-gradient(135deg, #8e0000 0%, #2b0000 100%);
  }

  .login-card {
    width: 100%;
    max-width: 450px;
    border-radius: 20px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
  }

  .top-line {
    height: 8px;
    background: var(--q-primary);
  }

  .border-logo {
    border: 4px solid var(--q-primary);
  }

  .ls-2 {
    letter-spacing: 3px;
  }

  .custom-btn {
    border-radius: 12px;
    font-weight: bold;
    transition: all 0.3s ease;
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    }
  }
</style>
