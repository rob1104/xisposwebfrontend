<template>
  <q-dialog v-model="isOpen" persistent backdrop-filter="blur(4px)">
    <q-card style="min-width: 450px; max-width: 80vw; border-radius: 12px;" class="bg-grey-10 text-white">
      <q-card-section class="bg-primary row items-center q-pb-sm">
        <div class="text-h6 text-bold text-white">Modificadores: {{ producto?.nombre }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup class="text-white" />
      </q-card-section>

      <q-card-section class="q-pt-md scroll" style="max-height: 60vh;">
        <div v-for="grupo in producto?.modificadores" :key="grupo.id" class="q-mb-md">
          <div class="row items-center q-mb-sm">
            <div class="text-subtitle1 text-bold text-cyan-3">{{ grupo.nombre }}</div>
            <q-space />
            <q-badge color="grey-8" v-if="grupo.max_selecciones > 0">
              Mín: {{ grupo.min_selecciones }} | Máx: {{ grupo.max_selecciones }}
            </q-badge>
          </div>

          <div v-if="grupo.tipo === 'opcion_unica'">
            <q-option-group
              v-model="selecciones[grupo.id]"
              :options="formatearOpciones(grupo.opciones)"
              color="primary"
              dark
            />
          </div>
          
          <div v-else>
            <q-option-group
              v-model="selecciones[grupo.id]"
              :options="formatearOpciones(grupo.opciones)"
              type="checkbox"
              color="primary"
              dark
            />
          </div>
        </div>

        <!-- Opcional: Cantidad y Notas -->
        <div v-if="permitirCantidad" class="row items-center justify-center q-mt-lg q-mb-md">
          <q-btn
            push round color="grey-8" icon="remove" size="md"
            @click="cantidadLocal > 1 ? cantidadLocal-- : null"
          />
          <div class="text-h4 text-bold text-white q-mx-lg" style="min-width: 40px; text-align: center;">
            {{ cantidadLocal }}
          </div>
          <q-btn
            push round color="amber" text-color="black" icon="add" size="md"
            @click="cantidadLocal++"
          />
        </div>

        <div v-if="permitirNotas" class="bg-dark-input rounded-borders q-pa-sm q-mt-md">
          <div class="text-caption text-grey-5 q-mb-xs q-ml-xs">Notas de preparación:</div>
          <q-input
            v-model="notasLocal"
            dark borderless dense
            type="textarea"
            rows="2"
            placeholder="Ej: Sin cebolla, salsa aparte..."
            class="text-body1"
          />
        </div>

      </q-card-section>

      <q-card-actions align="right" class="q-pa-md bg-blue-grey-10">
        <q-btn flat label="Cancelar" color="white" v-close-popup />
        <q-btn unelevated label="Agregar al Carrito" color="positive" @click="confirmarSeleccion" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: Boolean,
  producto: Object,
  permitirNotas: { type: Boolean, default: false },
  permitirCantidad: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'confirm'])
const $q = useQuasar()

const isOpen = ref(false)
const selecciones = ref({})
const cantidadLocal = ref(1)
const notasLocal = ref('')

watch(() => props.modelValue, (val) => {
  isOpen.value = val
  if (val && props.producto) {
    cantidadLocal.value = 1
    notasLocal.value = ''
    inicializarSelecciones()
  }
})

watch(isOpen, (val) => {
  emit('update:modelValue', val)
})

const inicializarSelecciones = () => {
  selecciones.value = {}
  props.producto.modificadores?.forEach(grupo => {
    if (grupo.tipo === 'opcion_unica') {
      selecciones.value[grupo.id] = null
    } else {
      selecciones.value[grupo.id] = []
    }
  })
}

const formatearOpciones = (opciones) => {
  return opciones.map(op => ({
    label: `${op.nombre} ${Number(op.precio_adicional) > 0 ? '(+$' + Number(op.precio_adicional).toFixed(2) + ')' : ''}`,
    value: op.id
  }))
}

const confirmarSeleccion = () => {
  // Validaciones
  for (const grupo of props.producto.modificadores || []) {
    const seleccion = selecciones.value[grupo.id]
    let conteo = 0
    if (Array.isArray(seleccion)) {
      conteo = seleccion.length
    } else {
      conteo = seleccion ? 1 : 0
    }

    if (conteo < grupo.min_selecciones) {
      $q.notify({
        message: `Faltan selecciones en: ${grupo.nombre}`,
        caption: `Mínimo requerido: ${grupo.min_selecciones}`,
        color: 'warning'
      })
      return
    }
    
    if (grupo.max_selecciones > 0 && conteo > grupo.max_selecciones) {
      $q.notify({
        message: `Demasiadas selecciones en: ${grupo.nombre}`,
        caption: `Máximo permitido: ${grupo.max_selecciones}`,
        color: 'warning'
      })
      return
    }
  }

  // Recopilar opciones seleccionadas con todos sus datos (precio, id, etc.)
  let opcionesCompletas = []
  props.producto.modificadores?.forEach(grupo => {
    const seleccion = selecciones.value[grupo.id]
    if (Array.isArray(seleccion)) {
      seleccion.forEach(val => {
        const op = grupo.opciones.find(o => o.id === val)
        if (op) opcionesCompletas.push(op)
      })
    } else if (seleccion) {
      const op = grupo.opciones.find(o => o.id === seleccion)
      if (op) opcionesCompletas.push(op)
    }
  })

  emit('confirm', { 
    producto: props.producto, 
    opciones: opcionesCompletas,
    cantidad: cantidadLocal.value,
    notas: notasLocal.value
  })
  isOpen.value = false
}
</script>
