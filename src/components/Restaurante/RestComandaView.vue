<template>
  <div class="row fit full-height bg-dark-surface">

    <!-- Panel de Productos (Izquierda en Desktop, Full en Mobile) -->
    <div class="col-12 col-md-8 col-lg-8 column full-height relative-position border-right-dark">

      <!-- Header con controles adaptables -->
      <div class="row items-center q-pa-sm q-pa-md-md bg-header shadow-1 header-container">



        <!-- Botón volver a menú principal - adaptable -->
        <div v-if="categoriaSeleccionada || busqueda" class="col-auto q-mr-xs q-mr-md-md animate-pop">
          <q-btn
            push
            color="deep-orange"
            icon="arrow_back"
            :label="$q.screen.gt.sm ? 'MENÚ PRINCIPAL' : $q.screen.gt.xs ? 'MENÚ' : ''"
            class="text-bold"
            :size="$q.screen.gt.xs ? 'md' : 'sm'"
            @click="limpiarNavegacion"
          />
        </div>

        <!-- Título - oculto en pantallas muy pequeñas cuando hay búsqueda -->
        <div
          class="col text-subtitle1 text-md-h6 text-white text-bold text-uppercase ellipsis"
          :class="{ 'gt-xs': busqueda }"
        >
          <q-icon name="restaurant_menu" color="amber" class="q-mr-sm" />
          <span class="gt-xs">{{ tituloActual }}</span>
        </div>

        <!-- Buscador - adaptable -->
        <div class="col-12 col-sm-5 col-md-4 q-mt-sm q-mt-sm-none">
          <q-input
            dark dense outlined rounded
            v-model="busqueda"
            placeholder="Buscar..."
            class="bg-dark-input"
          >
            <template v-slot:append><q-icon name="search" color="grey" /></template>
          </q-input>
        </div>
      </div>

      <!-- Área de scroll con productos/categorías -->
      <q-scroll-area class="col q-pa-sm q-pa-md-md">

        <!-- Vista de Categorías -->
        <div v-if="!categoriaSeleccionada && !busqueda" class="row q-col-gutter-sm q-col-gutter-md-lg">
          <div
            v-for="cat in categorias"
            :key="cat.id"
            class="col-6 col-sm-4 col-md-3"
          >
            <q-card
              v-ripple
              class="category-card column cursor-pointer shadow-3 overflow-hidden relative-position"
              @click="entrarCategoria(cat)"
            >
              <q-img
                v-if="cat.imagen"
                :src="cat.imagen"
                class="fit"
                style="transition: transform 0.3s;"
              >
                <div class="absolute-full column flex-center bg-dimmed">
                  <div class="text-subtitle1 text-md-h5 text-bold text-center text-white text-uppercase leading-tight text-shadow">
                    {{ cat.nombre }}
                  </div>
                  <div class="text-caption text-amber q-mt-xs">{{ contarProductos(cat.id) }} productos</div>
                </div>

                <template v-slot:error>
                   <div class="absolute-full column flex-center bg-gradient-default">
                      <q-icon :name="cat.icono || 'lunch_dining'" size="3em" color="white" class="opacity-80" />
                      <div class="text-subtitle2 text-bold text-center text-white q-mt-sm">{{ cat.nombre }}</div>
                   </div>
                </template>
              </q-img>

              <div v-else class="column flex-center fit bg-gradient-default">
                <q-icon :name="cat.icono || 'lunch_dining'" :size="$q.screen.gt.xs ? '3.5em' : '2.5em'" color="white" class="q-mb-sm opacity-80" />
                <div class="text-subtitle2 text-md-h6 text-bold text-center text-white text-uppercase leading-tight q-px-sm">
                  {{ cat.nombre }}
                </div>
                <div class="text-caption text-amber q-mt-xs">{{ contarProductos(cat.id) }} productos</div>
              </div>
            </q-card>
          </div>
        </div>

        <!-- Vista de Productos -->
        <div v-else class="row q-col-gutter-sm q-col-gutter-md-md animate-fade">

          <div v-if="productosVisibles.length === 0" class="col-12 text-center text-grey q-mt-xl">
            <q-icon name="no_food" size="4em" />
            <div class="text-h6">No hay productos aquí</div>
          </div>

          <div
            v-for="prod in productosVisibles"
            :key="prod.id"
            class="col-6 col-sm-4 col-md-3"
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

                <div class="absolute-bottom-right text-caption text-md-subtitle1 text-bold bg-amber text-black q-px-sm product-price">
                   $ {{ parseFloat(prod.precio).toFixed(2) }}
                </div>
              </q-img>

              <q-card-section class="q-pa-xs q-pa-sm-sm text-center col flex flex-center bg-card-body">
                <div class="text-caption text-md-subtitle2 text-white text-uppercase leading-tight">
                  {{ prod.nombre }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-scroll-area>
    </div>

    <!-- Panel de Ticket (Derecha en Desktop, Drawer en Mobile) -->
    <div
      class="col-12 col-md-4 col-lg-4 bg-ticket column shadow-left ticket-panel"
      :class="{ 'mobile-ticket': $q.screen.lt.md }"
    >

      <div class="q-pa-sm q-pa-md-md bg-dark-header text-white border-bottom-dark">
        <div class="row justify-between items-center">
          <div class="text-subtitle1 text-md-h5 text-bold text-amber">{{ mesa ? mesa.nombre : 'PARA LLEVAR' }}</div>
          <q-badge color="blue-grey" class="q-py-xs text-caption">{{ mesero?.name || 'S/A' }}</q-badge>
        </div>
        <div class="text-caption text-grey-4" v-if="clienteNombre">
          <q-icon name="person" /> {{ clienteNombre }}
        </div>
      </div>

      <!-- Área de items del carrito -->
      <q-scroll-area class="col q-pa-xs q-pa-sm-sm bg-ticket-body">
        <q-list separator dark>

          <!-- Items nuevos (por enviar) -->
          <div v-if="carritoNuevos.length > 0" class="q-mb-md">
            <q-item-label header class="text-amber text-bold text-uppercase q-pl-none text-caption text-md-body2">
              <q-icon name="edit_note" /> Por Enviar
            </q-item-label>

            <transition-group name="list">
              <q-item
                v-for="(item, idx) in carritoNuevos"
                :key="'new-'+item.uniqueId"
                class="bg-item-new q-mb-xs rounded-borders q-pa-xs q-pa-sm-sm"
              >
                <q-item-section>
                  <q-item-label class="text-white text-bold text-caption text-md-body2">{{ item.nombre }}</q-item-label>
                  <q-item-label caption class="text-orange-3" v-if="item.notas">
                    <q-icon name="comment" size="xs" /> {{ item.notas }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="row items-center bg-dark-transparent rounded-borders q-pa-xs">
                    <q-btn
                      flat round dense
                      icon="remove"
                      color="grey-4"
                      :size="$q.screen.gt.xs ? 'sm' : 'xs'"
                      @click="restarCantidad(idx)"
                    />
                    <span class="q-mx-xs q-mx-sm-sm text-bold text-white text-caption text-md-body2">{{ item.cantidad }}</span>
                    <q-btn
                      flat round dense
                      icon="add"
                      color="amber"
                      :size="$q.screen.gt.xs ? 'sm' : 'xs'"
                      @click="sumarCantidad(idx)"
                    />
                  </div>
                </q-item-section>

                <q-item-section side>
                   <div class="text-white text-bold text-caption text-md-body2">$ {{ (item.precio * item.cantidad).toFixed(2) }}</div>
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

          <!-- Items enviados (en cocina) -->
          <div v-if="carritoEnviados.length > 0">
             <q-separator color="grey-8" class="q-mb-sm" />
             <q-item-label header class="text-green text-bold text-uppercase q-pl-none text-caption text-md-body2">
               <q-icon name="soup_kitchen" /> En Cocina
             </q-item-label>

             <q-item
               v-for="item in carritoEnviados"
               :key="'sent-'+item.id"
               class="opacity-60 q-pa-xs q-pa-sm-sm"
             >
               <q-item-section>
                 <q-item-label class="text-white text-caption text-md-body2">{{ item.cantidad }} x {{ item.producto.nombre }}</q-item-label>
                 <q-item-label caption class="text-grey-5" v-if="item.notas">Nota: {{ item.notas }}</q-item-label>
               </q-item-section>
               <q-item-section side>
                 <div class="text-grey-5 text-caption text-md-body2">$ {{ (item.precio * item.cantidad).toFixed(2) }}</div>
               </q-item-section>
             </q-item>
          </div>

        </q-list>
      </q-scroll-area>

      <!-- Footer con total y botones -->
      <div class="q-pa-sm q-pa-md-md bg-dark-header border-top-dark">
        <div class="row justify-between text-bold text-white q-mb-sm q-mb-md-lg items-end">
          <span class="text-caption text-md-h6 text-grey">TOTAL:</span>
          <span class="text-h6 text-md-h4 text-amber">$ {{ granTotal.toFixed(2) }}</span>
        </div>

        <div class="row q-gutter-xs q-gutter-md-md">
          <q-btn
            class="col"
            push color="deep-orange"
            :size="$q.screen.gt.xs ? 'lg' : 'md'"
            icon="soup_kitchen"
            :label="$q.screen.gt.sm ? 'COCINA' : 'ENVIAR'"
            :disable="carritoNuevos.length === 0"
            @click="enviarACocina"
            :loading="enviando"
          />
          <q-btn
            class="col"
            push color="positive"
            :size="$q.screen.gt.xs ? 'lg' : 'md'"
            icon="receipt"
            label="CUENTA"
            @click="pedirCuenta"
            :disable="granTotal <= 0"
          />
        </div>
      </div>
    </div>

    <!-- Modal de producto -->
    <q-dialog v-model="showProductDialog" persistent transition-show="slide-up" transition-hide="slide-down">
      <q-card style="width: 500px; max-width: 95vw;" class="bg-dark-surface text-white border-amber shadow-24 overflow-hidden">

        <q-img
          v-if="productoActual?.imagen"
          :src="productoActual.imagen"
          style="height: 220px;"
          class="bg-grey-9"
        >
          <div class="absolute-top-right q-pa-sm">
            <q-btn round dense color="black" text-color="white" icon="close" v-close-popup style="opacity: 0.7;" />
          </div>

          <div class="absolute-bottom column q-pa-md bg-gradient-modal">
            <div class="text-h5 text-bold text-white text-shadow leading-tight">
              {{ productoActual?.nombre }}
            </div>
          </div>
        </q-img>

        <q-card-section v-else class="bg-amber text-black row items-center q-pa-md">
          <div class="text-h6 text-bold col leading-tight">{{ productoActual?.nombre }}</div>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md">

          <div class="row justify-center items-center q-mb-lg">
             <q-badge color="amber" text-color="black" class="text-h4 text-bold q-py-xs q-px-md shadow-2">
                $ {{ parseFloat(productoActual?.precio || 0).toFixed(2) }}
             </q-badge>
          </div>

          <div class="row items-center justify-center q-mb-lg">
            <q-btn
              push round
              color="grey-8"
              icon="remove"
              size="lg"
              @click="cantidadModal > 1 ? cantidadModal-- : null"
            />
            <div class="text-h3 text-bold text-white q-mx-lg" style="min-width: 60px; text-align: center;">
              {{ cantidadModal }}
            </div>
            <q-btn
              push round
              color="amber"
              text-color="black"
              icon="add"
              size="lg"
              @click="cantidadModal++"
            />
          </div>

          <div class="bg-dark-input rounded-borders q-pa-sm">
            <div class="text-caption text-grey-5 q-mb-xs q-ml-xs">Notas de preparación:</div>
            <q-input
              v-model="notasModal"
              dark borderless dense
              type="textarea"
              rows="2"
              placeholder="Ej: Sin cebolla, salsa aparte..."
              class="text-body1"
            />
          </div>
        </q-card-section>

        <q-card-actions class="q-pa-md bg-dark-header">
          <q-btn
            push
            color="positive"
            icon="add_shopping_cart"
            :label="`AGREGAR  -  $ ${(parseFloat(productoActual?.precio || 0) * cantidadModal).toFixed(2)}`"
            class="full-width text-bold q-py-sm"
            size="lg"
            @click="agregarAlCarrito"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useQuasar } from 'quasar'
  import { api } from 'src/boot/axios'

  const props = defineProps({
    mesa: Object,
    ordenId: Number,
    mesero: Object
  })

  const emit = defineEmits(['finalizar'])
  const $q = useQuasar()

  // State
  const categorias = ref([])
  const productos = ref([])
  const categoriaSeleccionada = ref(null)
  const busqueda = ref('')
  const carritoNuevos = ref([])
  const carritoEnviados = ref([])
  const ordenActualId = ref(props.ordenId || null)
  const clienteNombre = ref('')
  const enviando = ref(false)

  // Modal producto
  const showProductDialog = ref(false)
  const productoActual = ref(null)
  const cantidadModal = ref(1)
  const notasModal = ref('')

  // Computeds
  const tituloActual = computed(() => {
    if (busqueda.value) return 'Resultados de búsqueda'
    if (categoriaSeleccionada.value) return categoriaSeleccionada.value.nombre
    return 'Menú Principal'
  })

  const productosVisibles = computed(() => {
    if (busqueda.value) {
      const q = busqueda.value.toLowerCase()
      return productos.value.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo?.toLowerCase().includes(q)
      )
    }
    if (categoriaSeleccionada.value) {
      return productos.value.filter(p => p.categoria_id === categoriaSeleccionada.value.id)
    }
    return []
  })

  const granTotal = computed(() => {
    const totalNuevos = carritoNuevos.value.reduce((sum, i) => sum + (i.precio * i.cantidad), 0)
    const totalEnviados = carritoEnviados.value.reduce((sum, i) => sum + (i.precio * i.cantidad), 0)
    return totalNuevos + totalEnviados
  })

  // Métodos
  const contarProductos = (catId) => {
    return productos.value.filter(p => p.categoria_id === catId).length
  }

  const entrarCategoria = (cat) => {
    categoriaSeleccionada.value = cat
    busqueda.value = ''
  }

  const limpiarNavegacion = () => {
    categoriaSeleccionada.value = null
    busqueda.value = ''
  }

  const abrirModalProducto = (prod) => {
    productoActual.value = prod
    cantidadModal.value = 1
    notasModal.value = ''
    showProductDialog.value = true
  }

  const agregarAlCarrito = async () => {
    if (!productoActual.value) return

    // Si no hay orden, crearla primero
    if (!ordenActualId.value) {
      try {
        const { data } = await api.post('/api/restaurante/abrir-orden', {
          mesa_id: props.mesa?.id || null,
          nombre_cliente: clienteNombre.value
        })
        ordenActualId.value = data.id
      } catch (e) {
        $q.notify({ message: 'Error al crear orden', color: 'negative' })
        return
      }
    }

    carritoNuevos.value.push({
      id: productoActual.value.id,
      nombre: productoActual.value.nombre,
      precio: productoActual.value.precio,
      cantidad: cantidadModal.value,
      notas: notasModal.value,
      uniqueId: Date.now() + Math.random()
    })

    showProductDialog.value = false
    $q.notify({ message: 'Producto agregado', color: 'positive', position: 'top', timeout: 500 })

    await sincronizarBorrador()
  }

  const sumarCantidad = (idx) => {
    carritoNuevos.value[idx].cantidad++
    sincronizarBorrador()
  }

  const restarCantidad = (idx) => {
    if (carritoNuevos.value[idx].cantidad > 1) {
        carritoNuevos.value[idx].cantidad--
    } else {
        eliminarItem(idx)
        return
    }
    sincronizarBorrador()
  }

  const eliminarItem = (idx) => {
      carritoNuevos.value.splice(idx, 1)
      sincronizarBorrador()
  }

  const enviarACocina = async () => {
      enviando.value = true
      try {
        if (!ordenActualId.value) {
          const { data } = await api.post('/api/restaurante/abrir-orden', {
            mesa_id: props.mesa?.id || null,
            nombre_cliente: clienteNombre.value
          })
          ordenActualId.value = data.id
        }

        const itemsPayload = carritoNuevos.value.map(i => ({
          id: i.id,
          cantidad: i.cantidad,
          precio: i.precio,
          notas: i.notas
        }))

        await api.post(`/api/restaurante/orden/${ordenActualId.value}/actualizar`, { items: itemsPayload })
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

        carritoEnviados.value = []
        carritoNuevos.value = []

        carritoEnviados.value = data.detalles.filter(d => d.impreso_cocina == 1)

        const pendientes = data.detalles.filter(d => d.impreso_cocina == 0)

        pendientes.forEach(det => {
            carritoNuevos.value.push({
                id: det.producto.id,
                nombre: det.producto.nombre,
                precio: parseFloat(det.precio),
                cantidad: parseFloat(det.cantidad),
                notas: det.notas || '',
                uniqueId: Date.now() + Math.random()
            })
        })

        clienteNombre.value = data.nombre_cliente

      } catch (e) {
        console.error("Error cargando la orden", e)
        $q.notify({ message: 'Error al recuperar el detalle de la mesa', color: 'negative' })
      }
    }

    const sincronizarBorrador = async () => {
      if (!ordenActualId.value) return

      try {
        const itemsPayload = carritoNuevos.value.map(i => ({
            id: i.id,
            cantidad: i.cantidad,
            precio: i.precio,
            notas: i.notas
        }))

        await api.post(`/api/restaurante/orden/${ordenActualId.value}/actualizar`, { items: itemsPayload })

      } catch (e) {
        console.error("Error sincronizando borrador", e)
      }
    }

    onMounted(async () => {
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
          precio: parseFloat(precioEncontrado)
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

  /* ADAPTACIONES PARA MÓVIL */
  .header-container {
    min-height: 60px;
  }

  @media (max-width: 599px) {
    .header-container {
      flex-wrap: wrap;
    }
  }

  /* Panel de ticket en móvil */
  @media (max-width: 1023px) {
    .mobile-ticket {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 50vh;
      max-height: 500px;
      z-index: 1000;
      border-top: 2px solid #ffc107;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
    }
  }

  /* TARJETAS */
  .category-card {
    min-height: 120px;
    height: 140px;
    border-radius: 16px;
    background: linear-gradient(145deg, #2c3e50, #1f2a36);
    transition: transform 0.1s;
    border: 1px solid rgba(255,255,255,0.05);
  }

  @media (max-width: 599px) {
    .category-card {
      min-height: 100px;
      height: 110px;
    }
  }

  .category-card:active { transform: scale(0.96); }

  .product-card {
    min-height: 160px;
    height: 180px;
    border-radius: 12px;
    overflow: hidden;
    background: #252525;
    transition: transform 0.1s;
    border: 1px solid rgba(255,255,255,0.05);
  }

  @media (max-width: 599px) {
    .product-card {
      min-height: 140px;
      height: 150px;
    }
  }

  .product-card:active { transform: scale(0.96); }
  .bg-card-body { background: #252525; }

  .product-price {
    border-top-left-radius: 8px;
  }

  /* UTILIDADES */
  .opacity-80 { opacity: 0.8; }
  .opacity-60 { opacity: 0.6; }
  .leading-tight { line-height: 1.1; }

  /* ANIMACIONES */
  .animate-pop { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
  @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  .animate-fade { animation: fadeIn 0.4s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  /* Transiciones de lista */
  .list-enter-active, .list-leave-active {
    transition: all 0.3s ease;
  }
  .list-enter-from {
    opacity: 0;
    transform: translateX(-30px);
  }
  .list-leave-to {
    opacity: 0;
    transform: translateX(30px);
  }

  .bg-gradient-modal {
    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, transparent 100%);
  }

  .text-shadow {
    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
  }
</style>
