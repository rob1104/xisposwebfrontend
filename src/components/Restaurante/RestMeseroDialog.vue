<template>
  <q-dialog
    v-model="show"
    persistent
    transition-show="scale"
    transition-hide="scale"
    backdrop-filter="blur(5px)"
  >
    <q-card style="width: 700px; max-width: 95vw;" class="bg-dark-surface text-white shadow-24 border-gold">

      <q-card-section class="row items-center q-pb-none bg-header">
        <div class="text-h6 text-bold text-uppercase row items-center">
          <q-icon name="badge" color="amber" class="q-mr-sm" />
          ¿Quién atiende esta mesa?
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup color="grey-5" />
      </q-card-section>

      <q-card-section class="q-py-sm" v-if="usuarios.length > 6">
        <q-input
          dark dense outlined
          v-model="filtro"
          placeholder="Buscar mesero..."
          class="bg-dark-input rounded-borders"
        >
          <template v-slot:prepend><q-icon name="search" color="grey" /></template>
        </q-input>
      </q-card-section>

      <q-card-section class="q-pa-md scroll" style="max-height: 60vh;">

        <div v-if="loading" class="row justify-center q-pa-xl">
          <q-spinner-dots color="amber" size="3em" />
        </div>

        <div v-else-if="usuariosFiltrados.length === 0" class="text-center text-grey q-pa-lg">
          <q-icon name="person_off" size="3em" />
          <div class="q-mt-sm">No se encontraron meseros disponibles.</div>
        </div>

        <div v-else class="row q-col-gutter-md">
          <div
            v-for="user in usuariosFiltrados"
            :key="user.id"
            class="col-6 col-sm-4"
          >
            <q-card
              v-ripple
              class="user-card column flex-center cursor-pointer relative-position"
              @click="seleccionarUsuario(user)"
            >
              <q-avatar size="70px" class="shadow-3 q-mb-sm" :style="{ backgroundColor: stringToColor(user.name) }">
                <img v-if="user.avatar_url" :src="user.avatar_url" />
                <span v-else class="text-h4 text-white text-bold">{{ getIniciales(user.name) }}</span>
              </q-avatar>

              <div class="text-subtitle1 text-bold text-center ellipsis full-width q-px-sm">
                {{ user.name }}
              </div>
              <div class="text-caption text-grey-4">
                ID: {{ String(user.id).padStart(3, '0') }}
              </div>

              <div class="absolute-full flex flex-center hover-overlay">
                <q-icon name="touch_app" color="white" size="lg" />
              </div>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="bg-header q-pa-md">
        <q-btn flat label="Cancelar" color="grey-5" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { api } from 'src/boot/axios'

  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue', 'confirmar'])

  const usuarios = ref([])
  const loading = ref(false)
  const filtro = ref('')

  const show = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const usuariosFiltrados = computed(() => {
    if (!filtro.value) return usuarios.value
    const val = filtro.value.toLowerCase()
    return usuarios.value.filter(u => u.name.toLowerCase().includes(val))
  })

  // Cargar usuarios cuando se abre el modal
  watch(show, (val) => {
    if (val && usuarios.value.length === 0) {
      cargarUsuarios()
    }
  })

  const cargarUsuarios = async () => {
    loading.value = true
    try {
      const { data } = await api.get('/api/restaurante/meseros')
      usuarios.value = data
    } catch (e) {
      console.error('Error cargando meseros', e)
    } finally {
      loading.value = false
    }
  }

  const seleccionarUsuario = (user) => {
    // Aquí podrías agregar un paso intermedio para pedir PIN si quisieras
    emit('confirmar', user)
  }

  // Utilería visual: Obtener iniciales (ej: "Juan Perez" -> "JP")
  const getIniciales = (nombre) => {
    return nombre
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  // Utilería visual: Generar color consistente basado en el nombre
  const stringToColor = (str) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase()
    return '#' + '00000'.substring(0, 6 - c.length) + c
  }

  onMounted(() => {

  })
</script>

<style scoped>
  .bg-dark-surface {
    background: #1e1e1e;
  }
  .bg-header {
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  .border-gold {
    border: 1px solid rgba(255, 193, 7, 0.3);
    border-radius: 16px;
  }
  .bg-dark-input {
    background: rgba(0,0,0,0.3);
  }

  .user-card {
    height: 140px;
    background: #2c2c2c;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.05);
    transition: all 0.2s ease;
    overflow: hidden;
  }

  .user-card:active {
    transform: scale(0.96);
    background: #3a3a3a;
  }

  .hover-overlay {
    background: rgba(255, 193, 7, 0.8); /* Amber con transparencia */
    opacity: 0;
    transition: opacity 0.2s;
  }

  /* En Desktop, mostramos el overlay al pasar el mouse */
  @media (min-width: 1024px) {
    .user-card:hover .hover-overlay {
      opacity: 1;
    }
  }
</style>
