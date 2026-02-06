<template>
  <div class="row fit full-height bg-dark-surface">

    <div class="col-12 col-md-8 col-lg-8 column full-height relative-position border-right-dark">

      <div class="row items-center q-pa-md bg-header shadow-1" style="height: 70px;">

        <div class="col-auto q-mr-md">
        <q-btn
            push
            color="grey-9"
            text-color="white"
            icon="arrow_back"
            label="MESAS"
            class="text-bold border-white"
            @click="$emit('finalizar')"
        />
        </div>

        <div v-if="categoriaSeleccionada || busqueda" class="col-auto q-mr-md animate-pop">
          <q-btn
            push color="deep-orange" icon="arrow_back" label="MENÚ PRINCIPAL"
            class="text-bold" size="md"
            @click="limpiarNavegacion"
          />
        </div>

        <div class="col text-h6 text-white text-bold text-uppercase ellipsis">
          <q-icon name="restaurant_menu" color="amber" class="q-mr-sm" />
          {{ tituloActual }}
        </div>

        <div class="col-4">
          <q-input
            dark dense outlined rounded
            v-model="busqueda"
            placeholder="Buscar producto..."
            class="bg-dark-input"
          >
            <template v-slot:append><q-icon name="search" color="grey" /></template>
          </q-input>
        </div>
      </div>

      <q-scroll-area class="col q-pa-md">

        <div v-if="!categoriaSeleccionada && !busqueda" class="row q-col-gutter-lg">
          <div
            v-for="cat in categorias"
            :key="cat.id"
            class="col-xs-6 col-sm-4 col-md-3"
          >
            <q-card
              v-ripple
              class="category-card column flex-center cursor-pointer shadow-3"
              @click="entrarCategoria(cat)"
            >
              <q-icon :name="cat.icono || 'lunch_dining'" size="3.5em" color="white" class="q-mb-sm opacity-80" />
              <div class="text-h6 text-bold text-center text-white text-uppercase leading-tight q-px-sm">
                {{ cat.nombre }}
              </div>
              <div class="text-caption text-amber q-mt-xs">{{ contarProductos(cat.id) }} items</div>
            </q-card>
          </div>
        </div>

        <div v-else class="row q-col-gutter-md animate-fade">

          <div v-if="productosVisibles.length === 0" class="col-12 text-center text-grey q-mt-xl">
            <q-icon name="no_food" size="4em" />
            <div class="text-h6">No hay productos aquí</div>
          </div>

          <div
            v-for="prod in productosVisibles"
            :key="prod.id"
            class="col-xs-6 col-sm-4 col-md-3"
          >
            <q-card
              class="product-card column full-height cursor-pointer"
              v-ripple
              @click="abrirModalProducto(prod)"
            >
              <q-img
                :src="prod.imagen || 'placeholder_food.png'"
                :ratio="4/3"
                class="bg-grey-9"
              >
                <template v-slot:error>
                   <div class="absolute-full flex flex-center bg-grey-9 text-grey-8 column">
                     <q-icon name="restaurant" size="md" />
                   </div>
                </template>

                <div class="absolute-bottom-right text-subtitle1 text-bold bg-amber text-black q-px-sm" style="border-top-left-radius: 8px;">
                   $ {{ parseFloat(prod.precio).toFixed(2) }}
                </div>
              </q-img>

              <q-card-section class="q-pa-sm text-center col flex flex-center bg-card-body">
                <div class="text-subtitle2 text-white text-uppercase leading-tight">
                  {{ prod.nombre }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-scroll-area>
    </div>

    <div class="col-12 col-md-4 col-lg-4 bg-ticket column shadow-left">

      <div class="q-pa-md bg-dark-header text-white border-bottom-dark">
        <div class="row justify-between items-center">
          <div class="text-h5 text-bold text-amber">{{ mesa ? mesa.nombre : 'PARA LLEVAR' }}</div>
          <q-badge color="blue-grey" class="q-py-xs">{{ mesero?.name || 'S/A' }}</q-badge>
        </div>
        <div class="text-caption text-grey-4" v-if="clienteNombre">
          <q-icon name="person" /> {{ clienteNombre }}
        </div>
      </div>

      <q-scroll-area class="col q-pa-sm bg-ticket-body">
        <q-list separator dark>

          <div v-if="carritoNuevos.length > 0" class="q-mb-md">
            <q-item-label header class="text-amber text-bold text-uppercase q-pl-none">
              <q-icon name="edit_note" /> Por Enviar
            </q-item-label>

            <transition-group name="list">
              <q-item v-for="(item, idx) in carritoNuevos" :key="'new-'+item.uniqueId" class="bg-item-new q-mb-xs rounded-borders">
                <q-item-section>
                  <q-item-label class="text-white text-bold">{{ item.nombre }}</q-item-label>
                  <q-item-label caption class="text-orange-3" v-if="item.notas">
                    <q-icon name="comment" size="xs" /> {{ item.notas }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="row items-center bg-dark-transparent rounded-borders">
                    <q-btn flat round dense icon="remove" color="grey-4" size="sm" @click="restarCantidad(idx)" />
                    <span class="q-mx-sm text-bold text-white">{{ item.cantidad }}</span>
                    <q-btn flat round dense icon="add" color="amber" size="sm" @click="sumarCantidad(idx)" />
                  </div>
                </q-item-section>

                <q-item-section side>
                   <div class="text-white text-bold">$ {{ (item.precio * item.cantidad).toFixed(2) }}</div>
                </q-item-section>

                <q-menu context-menu>
                  <q-list style="min-width: 100px" class="bg-dark text-white">
                    <q-item clickable v-close-popup @click="eliminarItem(idx)">
                      <q-item-section>Borrar</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-item>
            </transition-group>
          </div>

          <div v-if="carritoEnviados.length > 0">
             <q-separator color="grey-8" class="q-mb-sm" />
             <q-item-label header class="text-green text-bold text-uppercase q-pl-none">
               <q-icon name="soup_kitchen" /> En Cocina
             </q-item-label>

             <q-item v-for="item in carritoEnviados" :key="'sent-'+item.id" class="opacity-60">
               <q-item-section>
                 <q-item-label class="text-white">{{ item.cantidad }} x {{ item.producto.nombre }}</q-item-label>
                 <q-item-label caption class="text-grey-5" v-if="item.notas">Nota: {{ item.notas }}</q-item-label>
               </q-item-section>
               <q-item-section side>
                 <div class="text-grey-5">$ {{ (item.precio * item.cantidad).toFixed(2) }}</div>
               </q-item-section>
             </q-item>
          </div>

        </q-list>
      </q-scroll-area>

      <div class="q-pa-md bg-dark-header border-top-dark">
        <div class="row justify-between text-h4 text-bold text-white q-mb-lg">
          <span class="text-h6 self-end text-grey">TOTAL:</span>
          <span class="text-amber">$ {{ granTotal.toFixed(2) }}</span>
        </div>

        <div class="row q-gutter-md">
          <q-btn
            class="col-6"
            push color="deep-orange"
            size="lg"
            icon="soup_kitchen"
            label="COCINA"
            :disable="carritoNuevos.length === 0"
            @click="enviarACocina"
            :loading="enviando"
          />
          <q-btn
            class="col"
            push color="positive"
            size="lg"
            icon="receipt"
            label="CUENTA"
            @click="pedirCuenta"
            :disable="granTotal <= 0"
          />
        </div>
      </div>
    </div>

    <q-dialog v-model="showProductDialog" persistent transition-show="scale" transition-hide="scale">
      <q-card style="width: 500px; max-width: 90vw;" class="bg-dark-surface text-white border-amber">

        <q-card-section class="bg-amber text-black row items-center">
          <div class="text-h6 text-bold">{{ tempProducto?.nombre }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup color="black" />
        </q-card-section>

        <q-card-section class="q-pt-lg">
          <div class="row justify-center items-center q-mb-lg">
             <q-btn round color="grey-8" icon="remove" size="lg" @click="tempCantidad > 1 ? tempCantidad-- : null" />
             <div class="text-h2 text-bold q-mx-lg text-amber">{{ tempCantidad }}</div>
             <q-btn round color="amber" text-color="black" icon="add" size="lg" @click="tempCantidad++" />
          </div>

          <div class="text-subtitle2 text-grey-4 q-mb-xs">Notas de preparación (Opcional):</div>
          <q-input
            v-model="tempNotas"
            filled dark
            type="textarea"
            rows="3"
            placeholder="Ej: Sin cebolla, Salsa aparte..."
            class="text-h6"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-dark-header">
           <div class="text-h5 text-bold q-mr-md text-grey">
             Sub: $ {{ ((tempProducto?.precio || 0) * tempCantidad).toFixed(2) }}
           </div>
           <q-btn label="AGREGAR A ORDEN" color="positive" size="lg" icon="check" @click="confirmarAgregarProducto" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { api } from 'src/boot/axios'
  import { useQuasar } from 'quasar'

  const props = defineProps(['mesa', 'ordenId', 'mesero'])
  const emit = defineEmits(['finalizar'])
  const $q = useQuasar()

  // --- DATA ---
  const categorias = ref([])
  const productos = ref([])
  const carritoNuevos = ref([])
  const carritoEnviados = ref([])
  const ordenActualId = ref(props.ordenId)
  const clienteNombre = ref('')

  // --- UI STATE ---
  const categoriaSeleccionada = ref(null) // Si es null, muestra grid categorías
  const busqueda = ref('')
  const enviando = ref(false)

  // --- MODAL PRODUCTO ---
  const showProductDialog = ref(false)
  const tempProducto = ref(null)
  const tempCantidad = ref(1)
  const tempNotas = ref('')

  // --- COMPUTED ---
  const tituloActual = computed(() => {
    if (busqueda.value) return `Resultados: "${busqueda.value}"`
    if (categoriaSeleccionada.value) return categoriaSeleccionada.value.nombre
    return 'Menú Principal'
  })

  const productosVisibles = computed(() => {
    let lista = productos.value

    // 1. Filtro por búsqueda global
    if (busqueda.value) {
      const q = busqueda.value.toLowerCase()
      return lista.filter(p => p.nombre.toLowerCase().includes(q) || p.codigo_barras.includes(q))
    }

    // 2. Filtro por categoría seleccionada
    if (categoriaSeleccionada.value) {
      return lista.filter(p => p.categoria_id === categoriaSeleccionada.value.id)
    }

    return [] // Si estamos en menú principal, no mostramos productos sueltos
  })

  const granTotal = computed(() => {
    const totalNuevos = carritoNuevos.value.reduce((acc, i) => acc + (i.precio * i.cantidad), 0)
    const totalEnviados = carritoEnviados.value.reduce((acc, i) => acc + (parseFloat(i.precio) * parseFloat(i.cantidad)), 0)
    return totalNuevos + totalEnviados
  })

  // --- METHODS NAVEGACIÓN ---
  const contarProductos = (catId) => {
    return productos.value.filter(p => p.categoria_id === catId).length
  }

  const entrarCategoria = (cat) => {
    categoriaSeleccionada.value = cat
    busqueda.value = '' // Limpiar búsqueda al navegar
  }

  const limpiarNavegacion = () => {
    categoriaSeleccionada.value = null
    busqueda.value = ''
  }

  // --- METHODS CARRITO & MODAL ---

  // Paso 1: Abrir Modal
  const abrirModalProducto = (prod) => {
    tempProducto.value = prod
    tempCantidad.value = 1
    tempNotas.value = ''
    showProductDialog.value = true
  }

  // Paso 2: Confirmar del Modal
  const confirmarAgregarProducto = async() => {
    if (!tempProducto.value) return

    // Buscar si ya existe EXACTAMENTE el mismo producto con las MISMAS notas
    const existe = carritoNuevos.value.find(i =>
      i.id === tempProducto.value.id &&
      i.notas.trim() === tempNotas.value.trim()
    )

    if (existe) {
      existe.cantidad += tempCantidad.value
    } else {
      carritoNuevos.value.push({
        id: tempProducto.value.id,
        nombre: tempProducto.value.nombre,
        precio: parseFloat(tempProducto.value.precios?.[0]?.precio || 0),
        cantidad: tempCantidad.value,
        uniqueId: Date.now(),
        notas: tempNotas.value
      })
    }

    if (!ordenActualId.value) {
       const { data } = await api.post('/api/restaurante/abrir-orden', {
          mesa_id: props.mesa?.id || null,
          nombre_cliente: clienteNombre.value
       })
       ordenActualId.value = data.id
    }

    showProductDialog.value = false

    await sincronizarBorrador()


    // Opcional: Feedback visual o sonido
    $q.notify({
      message: 'Agregado',
      color: 'positive',
      position: 'center',
      timeout: 500,
      icon: 'check'
    })
  }

  // Operaciones en lista
  const sumarCantidad = (idx) => {
    carritoNuevos.value[idx].cantidad++
    sincronizarBorrador() // <--- Guardar cambio
  }

  const restarCantidad = (idx) => {
    if (carritoNuevos.value[idx].cantidad > 1) {
        carritoNuevos.value[idx].cantidad--
    } else {
        eliminarItem(idx)
        return // eliminarItem ya llama a sincronizar
    }
    sincronizarBorrador() // <--- Guardar cambio
  }

  const eliminarItem = (idx) => {
      carritoNuevos.value.splice(idx, 1)
      sincronizarBorrador() // <--- Guardar cambio (esto borrará el item de la BD)
  }

  // --- LOGICA BACKEND (Igual que antes) ---
  const enviarACocina = async () => {
      enviando.value = true
      try {
        // 1. Si no existe orden, crearla primero
        if (!ordenActualId.value) {
          const { data } = await api.post('/api/restaurante/abrir-orden', {
            mesa_id: props.mesa?.id || null,
            nombre_cliente: clienteNombre.value
          })
          ordenActualId.value = data.id
        }

        // 2. Guardar items nuevos
        const itemsPayload = carritoNuevos.value.map(i => ({
          id: i.id,
          cantidad: i.cantidad,
          precio: i.precio,
          notas: i.notas // ENVIAMOS LAS NOTAS
        }))

        await api.post(`/api/restaurante/orden/${ordenActualId.value}/actualizar`, { items: itemsPayload })

        // 3. Disparar impresión a cocina
        await api.post(`/api/restaurante/orden/${ordenActualId.value}/enviar-cocina`)

        $q.notify({ message: 'Enviado a cocina', color: 'positive', icon: 'check' })

        await cargarOrdenActual()
        carritoNuevos.value = []

      } catch (e) {
        $q.notify({ message: 'Error enviando orden', color: 'negative' })
      } finally {
        enviando.value = false
      }
    }

    const pedirCuenta = async () => {
      if (carritoNuevos.value.length > 0) {
        $q.dialog({ title: 'Items sin enviar', message: 'Tienes items sin enviar a cocina. ¿Enviarlos primero?', cancel: true })
          .onOk(() => enviarACocina().then(cerrarCuentaReal))
      } else {
        cerrarCuentaReal()
      }
    }

    const cerrarCuentaReal = async () => {
      try {
        const { data } = await api.post(`/api/restaurante/orden/${ordenActualId.value}/cerrar`)
        $q.dialog({
          title: 'Cuenta Cerrada',
          message: `<div class="text-center">Ticket Generado:<br><strong class="text-h4 text-primary">${data.codigo}</strong></div>`,
          html: true,
          ok: 'Entendido'
        }).onDismiss(() => {
          emit('finalizar')
        })
      } catch (e) {
        console.error(e)
      }
    }

    const cargarOrdenActual = async () => {
      if (!ordenActualId.value) return

      try {
        const { data } = await api.get(`/api/restaurante/orden/${ordenActualId.value}`)

        // 1. Limpiamos ambas listas para evitar duplicados al recargar
        carritoEnviados.value = []
        carritoNuevos.value = []

        // 2. Separamos lo que ya se cocinó de lo pendiente
        // Los detalles con impreso_cocina = 1 van directos a la lista de lectura (Verde)
        carritoEnviados.value = data.detalles.filter(d => d.impreso_cocina == 1)

        // 3. Los detalles con impreso_cocina = 0 los recuperamos como "Nuevos" (Amarillo)
        // Necesitamos mapearlos para que tengan la estructura que usa el carrito frontend (uniqueId, etc)
        const pendientes = data.detalles.filter(d => d.impreso_cocina == 0)

        pendientes.forEach(det => {
            carritoNuevos.value.push({
                id: det.producto.id,      // ID del Producto Real
                nombre: det.producto.nombre,
                precio: parseFloat(det.precio),
                cantidad: parseFloat(det.cantidad),
                notas: det.notas || '',
                uniqueId: Date.now() + Math.random() // Generamos un ID temporal para que Vue lo maneje
            })
        })

        clienteNombre.value = data.nombre_cliente

      } catch (e) {
        console.error("Error cargando la orden", e)
        $q.notify({ message: 'Error al recuperar el detalle de la mesa', color: 'negative' })
      }
    }

    const sincronizarBorrador = async () => {
      // Si no hay orden creada aún, no hacemos nada (se creará al primer agregar)
      if (!ordenActualId.value) return

      try {
        const itemsPayload = carritoNuevos.value.map(i => ({
            id: i.id,
            cantidad: i.cantidad,
            precio: i.precio,
            notas: i.notas
        }))

        // Llamamos al backend pero SIN esperar respuesta visual (sin loading) para que sea fluido
        await api.post(`/api/restaurante/orden/${ordenActualId.value}/actualizar`, { items: itemsPayload })

      } catch (e) {
        console.error("Error sincronizando borrador", e)
      }
    }

    onMounted(async () => {
      // Carga de datos inicial
      const [resCat, resProd] = await Promise.all([
        api.get('/api/catalogos/categorias'),
        api.get('/api/pos/buscar-filtro?q=%')
      ])
      categorias.value = resCat.data.filter(c => c.en_restaurante)
      productos.value = resProd.data.map(p => {
        const precioEncontrado = p.precios?.find(pr => pr.nombre_lista === 'PRECIO PUBLICO')?.precio
                                || p.precios?.[0]?.precio
                                || 0;

        return {
          ...p,
          precio: parseFloat(precioEncontrado) // Creamos la propiedad .precio directa
        }
      })

      if (props.ordenId) await cargarOrdenActual()
      else if (!props.mesa) {
        $q.dialog({ title: 'Cliente', message: 'Nombre (Para Llevar):', prompt: { model: '', type: 'text' } })
          .onOk(data => clienteNombre.value = data)
          .onCancel(() => emit('finalizar'))
      }
    })

  </script>

  <style scoped>
  /* COLORES & FONDOS */
  .bg-dark-surface { background: #121212; }
  .bg-header { background: #1e1e1e; border-bottom: 1px solid #333; }
  .bg-dark-input { background: #2c2c2c; }
  .bg-ticket { background: #181818; }
  .bg-ticket-body { background: #121212; }
  .bg-dark-header { background: #222; }
  .bg-item-new { background: rgba(255, 193, 7, 0.1); border-left: 3px solid #ffc107; }
  .bg-dark-transparent { background: rgba(255,255,255,0.05); }

  /* BORDES */
  .border-right-dark { border-right: 1px solid #333; }
  .border-bottom-dark { border-bottom: 1px solid #333; }
  .border-top-dark { border-top: 1px solid #333; }
  .border-amber { border: 2px solid #ffc107; }

  /* TARJETAS */
  .category-card {
    height: 140px;
    border-radius: 16px;
    background: linear-gradient(145deg, #2c3e50, #1f2a36); /* Azul oscuro elegante */
    transition: transform 0.1s;
    border: 1px solid rgba(255,255,255,0.05);
  }
  .category-card:active { transform: scale(0.96); }

  .product-card {
    height: 180px;
    border-radius: 12px;
    overflow: hidden;
    background: #252525;
    transition: transform 0.1s;
    border: 1px solid rgba(255,255,255,0.05);
  }
  .product-card:active { transform: scale(0.96); }
  .bg-card-body { background: #252525; }

  /* UTILIDADES */
  .opacity-80 { opacity: 0.8; }
  .opacity-60 { opacity: 0.6; }
  .leading-tight { line-height: 1.1; }

  /* ANIMACIONES */
  .animate-pop { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
  @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  .animate-fade { animation: fadeIn 0.4s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
