<template>
  <q-page class="q-pa-xl bg-slate-50">
    <div class="row q-col-gutter-lg q-mb-xl">
      <div class="col-12 col-md-3" v-for="kpi in kpis" :key="kpi.label">
        <q-card class="kpi-card-premium shadow-subtle border-radius-15">
          <q-card-section class="row items-center no-wrap q-pa-lg">
            <q-btn round unelevated :icon="kpi.icon" :color="kpi.color" class="shadow-3" />
            <div class="q-ml-lg">
              <div class="text-caption text-uppercase text-weight-bolder text-grey-6 letter-spacing-1">
                {{ kpi.label }}
              </div>
              <div class="text-h5 text-weight-bold text-slate-800">{{ kpi.value }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card class="shadow-20 border-radius-20 overflow-hidden bg-white">
      <q-table
        :rows="facturas"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :filter="filter"
        flat
        class="premium-facturas-table"
      >
        <template v-slot:top>
          <div class="row full-width items-center q-pa-sm">
            <div class="col-12 col-md-4">
              <div class="text-h5 text-weight-bolder text-slate-900 flex items-center">
                <q-icon name="receipt_long" color="primary" size="md" class="q-mr-sm" />
                Facturación
              </div>
              <div class="text-caption text-grey-6 q-ml-md">Gestión y control de comprobantes fiscales</div>
            </div>

            <q-space />

            <div class="col-12 col-md-7 row q-gutter-sm justify-end">
              <q-select
                v-if="auth.isAdmin"
                v-model="sucursalFiltro"
                :options="sucursales"
                label="Filtrar por Sucursal"
                outlined dense
                bg-color="white"
                class="col-4 shadow-sm"
                option-value="id"
                option-label="nombre"
                emit-value map-options
                @update:model-value="loadFacturas"
              />

              <q-input
                v-model="filter"
                placeholder="Buscar cliente, RFC o folio..."
                outlined dense
                bg-color="white"
                class="col-4 shadow-sm"
              >
                <template v-slot:prepend><q-icon name="search" color="grey-6" /></template>
              </q-input>

              <q-btn
                color="indigo-10"
                icon="add"
                label="Emitir CFDI 4.0"
                class="q-px-md text-weight-bold shadow-5"
                unelevated
                @click="nuevaFactura"
              />
            </div>
          </div>
        </template>

        <template v-slot:body-cell-fecha="props">
          <q-td :props="props">
            <div class="text-weight-bold text-slate-800">{{ props.row.fecha_only }}</div>
            <div class="text-caption text-grey-5">{{ props.row.hora_only }}</div>
          </q-td>
        </template>

        <template v-slot:body-cell-cliente="props">
          <q-td :props="props">
            <div class="text-weight-bolder text-indigo-9 text-uppercase letter-spacing-05">
              {{ props.row.cliente.razon_social }}
            </div>
            <div class="text-caption row items-center text-grey-7">
              <q-icon name="fingerprint" size="xs" class="q-mr-xs" />
              {{ props.row.cliente.rfc }}
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-total="props">
          <q-td :props="props">
            <div class="total-badge">
              {{ formatCurrency(props.row.total) }}
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-uuid="props">
          <q-td :props="props">
            <div v-if="props.row.uuid" class="uuid-container cursor-pointer" @click="copyUuid(props.row.uuid)">
              <span class="uuid-text">{{ props.row.uuid }}</span>
              <q-icon name="content_copy" size="xs" class="q-ml-xs text-grey-4 hover-show" />
              <q-tooltip class="bg-indigo-10">Click para copiar UUID completo</q-tooltip>
            </div>
            <div v-else class="text-grey-4 text-italic">Sin timbrar</div>
          </q-td>
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props" class="text-center">
            <q-chip
              :class="`chip-status-${getStatusClass(props.row.status)}`"
              text-color="white"
              size="sm"
              class="text-weight-bolder q-px-md"
            >
              {{ props.row.status }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="text-center">
            <div class="row no-wrap justify-center q-gutter-xs">
              <q-btn v-if="props.row.status === 'Pendiente'" flat round color="amber-9" icon="sync" size="sm" @click="reintentarTimbrado(props.row)">
                <q-tooltip>Reintentar Timbrado</q-tooltip>
              </q-btn>

              <q-btn flat round color="indigo-7" icon="file_download" size="sm">
                <q-menu cover auto-close>
                  <q-list style="min-width: 150px">
                    <q-item v-if="props.row.status === 'Vigente'" clickable @click="downloadPdf(props.row)">
                      <q-item-section avatar><q-icon name="picture_as_pdf" color="red" /></q-item-section>
                      <q-item-section>Descargar PDF</q-item-section>
                    </q-item>
                    <q-item clickable @click="downloadXml(props.row)">
                      <q-item-section avatar><q-icon name="code" color="green" /></q-item-section>
                      <q-item-section>Descargar XML</q-item-section>
                    </q-item>
                    <q-item
                      v-if="props.row.status === 'Cancelado'"
                      clickable
                      @click="downloadAcuse(props.row)"
                    >
                      <q-item-section avatar>
                        <q-icon name="picture_as_pdf" color="negative" />
                      </q-item-section>
                      <q-item-section>Descargar Acuse Cancelación</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>

              <q-btn flat round color="grey-6" icon="more_vert" size="sm">
                <q-menu auto-close>
                  <q-list>
                    <q-item v-if="props.row.status === 'Vigente'" clickable @click="resendEmail(props.row)">
                      <q-item-section avatar><q-icon name="send" /></q-item-section>
                      <q-item-section>Enviar por correo</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item v-if="props.row.status === 'Vigente'" clickable class="text-negative" @click="cancelFactura(props.row)">
                      <q-item-section avatar><q-icon name="delete_sweep" /></q-item-section>
                      <q-item-section>Cancelar Folio</q-item-section>
                    </q-item>
                    <q-item v-if="props.row.status === 'Pendiente'" clickable class="text-negative" @click="borrarCfdi(props.row)">
                      <q-item-section avatar><q-icon name="delete" /></q-item-section>
                      <q-item-section>Borrar Cfdi sin timbrar</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>
    <NuevaFacturaDialog v-model="showNuevaFactura" @saved="loadFacturas" />
    <CancelacionCfdiDialog
      v-model="showCancelacionDialog"
      :cfdi="cfdiACancelar"
      @success="loadFacturas" />
  </q-page>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { api } from 'boot/axios'
  import { useQuasar, copyToClipboard } from 'quasar'
  import { useAuthStore } from 'src/stores/auth'
  import NuevaFacturaDialog from 'src/components/Facturacion/NuevaFacturaDialog.vue'
  import CancelacionCfdiDialog from 'src/components/Facturacion/CancelacionCfdiDialog.vue'


  const $q = useQuasar()
  const auth = useAuthStore()
  const loading = ref(false)
  const filter = ref('')
  const facturas = ref([])
  const sucursales = ref([])
  const sucursalFiltro = ref(auth.sucursalSeleccionada?.id)
  const showNuevaFactura = ref(false)
  const showCancelacionDialog = ref(false)
  const cfdiACancelar = ref(null)

  const nuevaFactura = () => {
    showNuevaFactura.value = true

  }

  const getStatusClass = (status) => {
  const map = {
    'Vigente': 'positive',
    'Cancelado': 'negative',
    'Pendiente': 'orange',
    'ERROR': 'negative'
  }
  return map[status] || 'grey'
}

  const reintentarTimbrado = async (row) => {
    $q.dialog({
      title: 'Confirmar Reintento',
      message: `¿Deseas enviar nuevamente el folio ${row.folio} a timbrar al SAT?`,
      cancel: true,
      persistent: true
    }).onOk(async () => {
      try {
        $q.loading.show({ message: 'Comunicando con Servidor de Timbrado...' })

        const { data } = await api.post(`/api/cfdis/${row.id}/reintentar`)

        $q.notify({
          type: 'positive',
          message: data.message,
          caption: `UUID: ${data.uuid}`
        });

        loadFacturas(); // Recargamos la tabla para ver el estado 'Vigente'
      } catch (e) {
        $q.notify({
          type: 'negative',
          message: e.response?.data?.message || 'Error en el servidor'
        });
      } finally {
        $q.loading.hide()
      }
    })
  }

  const borrarCfdi = (row) => {
    $q.dialog({
      title: '¿Eliminar borrador?',
      message: `Se eliminará permanentemente el folio ${row.folio}. Esta acción no se puede deshacer.`,
      cancel: { color: 'slate-600', flat: true },
      ok: { color: 'negative', label: 'Eliminar' },
      persistent: true
    }).onOk(async () => {
      try {
        $q.loading.show({ message: 'Eliminando registro...' });
        await api.delete(`/api/cfdis/${row.id}`);

        $q.notify({
          type: 'positive',
          message: 'Registro eliminado correctamente',
          icon: 'delete'
        });

        loadFacturas(); // Recargar la tabla
      } catch (e) {
        $q.notify({
          type: 'negative',
          message: e.response?.data?.message || 'Error al eliminar'
        });
      } finally {
        $q.loading.hide()
      }
    })
  }

  const columns = [
    { name: 'fecha', label: 'FECHA DE EMISIÓN', align: 'left', sortable: true },
    { name: 'folio', label: 'SERIE / FOLIO', field: row => `${row.serie}-${row.folio}`, align: 'left', sortable: true },
    { name: 'cliente', label: 'RECEPTOR (RFC)', align: 'left', sortable: true },
    { name: 'total', label: 'MONTO TOTAL', align: 'right', sortable: true },
    { name: 'uuid', label: 'FOLIO FISCAL (UUID)', align: 'left' },
    { name: 'status', label: 'ESTADO CFDI', align: 'center' },
    { name: 'actions', label: 'ACCIONES', align: 'center' }
  ]

  const kpis = computed(() => {
    // Calculamos el total de facturas vigentes del mes
    const vigentes = facturas.value.filter(f => f.status === 'Vigente')
    const totalFacturado = vigentes.reduce((acc, curr) => acc + parseFloat(curr.total), 0)

    return [
      {
        label: 'Facturado Mes',
        value: formatCurrency(totalFacturado),
        color: 'indigo-10',
        icon: 'payments'
      },
      {
        label: 'Timbradas',
        value: vigentes.length.toString(),
        color: 'positive',
        icon: 'verified'
      },
      {
        label: 'Canceladas',
        value: facturas.value.filter(f => f.status === 'Cancelado').length.toString(),
        color: 'negative',
        icon: 'dangerous'
      },
      {
        label: 'Por Timbrar',
        value: facturas.value.filter(f => f.status === 'Pendiente').length.toString(),
        color: 'orange-9',
        icon: 'history'
      }
    ]
  })

  const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)

  const getStatusColor = (status) => {
    const map = { 'Vigente': 'positive', 'Cancelado': 'negative', 'Pendiente': 'orange', 'ERROR': 'black' }
    return map[status] || 'grey'
  }

  const loadSucursales = async () => {
    try {
      const { data } = await api.get('/api/sucursales')
      sucursales.value = data
    } catch (e) {
      console.error("Error al cargar sucursales para el filtro")
    }
  }
  const loadFacturas = async () => {
    if (!sucursalFiltro.value) return

    loading.value = true
    try {
      const { data } = await api.get('/api/cfdis', {
        params: { sucursal_id: sucursalFiltro.value }
      })
      facturas.value = data
    } catch (e) {
      $q.notify({
        color: 'negative',
        message: 'No se pudo conectar con el servidor de facturación',
        icon: 'report_problem'
      })
    } finally {
      loading.value = false
    }
  }

  const downloadPdf = async (row) => {
    try {
      $q.loading.show({ message: 'Generando PDF...' })

      // 1. Primero nos aseguramos de que el PDF esté generado
      await api.post(`/api/cfdis/${row.id}/generar-pdf`)

      // 2. Descargamos el archivo como blob
      const response = await api.get(`/api/cfdis/${row.id}/pdf`, { responseType: 'blob' })

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Factura_${row.folio}.pdf`)
      document.body.appendChild(link)
      link.click()

      link.remove();
      window.URL.revokeObjectURL(url)
    } catch (e) {
      $q.notify({ type: 'negative', message: 'Error al procesar el PDF' })
    } finally {
      $q.loading.hide()
    }
  }

  const downloadXml = async(row) => {
    try {
      $q.loading.show({ message: 'Preparando archivo...' });

      // 1. Petición a la API solicitando un blob (binario)
      const response = await api.get(`/api/cfdis/${row.id}/xml`, {
        responseType: 'blob' // CRÍTICO: Indica que recibiremos un archivo
      });

      // 2. Crear una URL local para el contenido del archivo
      const blob = new Blob([response.data], { type: 'text/xml' });
      const url = window.URL.createObjectURL(blob);

      // 3. Crear un link oculto y simular el clic para descargar
      const link = document.createElement('a');
      link.href = url;

      // Nombre del archivo basado en la respuesta o en la fila
      const nombre = (row.status === 'Vigente') ? `Factura_${row.folio}.xml` : `Borrador_${row.folio}.xml`;
      link.setAttribute('download', nombre);

      document.body.appendChild(link);
      link.click();

      // 4. Limpieza: eliminar el link y liberar la URL de memoria
      link.remove();
      window.URL.revokeObjectURL(url);

      $q.notify({ color: 'positive', message: 'Descarga completada', icon: 'check' });
    } catch (e) {
      console.error(e);
      $q.notify({ color: 'negative', message: 'Error al obtener el archivo del servidor' });
    } finally {
      $q.loading.hide();
    }
  }

  const resendEmail = (row) => {
    // Preguntar confirmación (opcional pero recomendado)
    $q.dialog({
      title: 'Enviar Factura',
      message: `¿Deseas enviar los archivos al correo del cliente (${row.cliente?.email || 'No registrado'})?`,
      cancel: true,
      persistent: true
    }).onOk(async () => {
      try {
        $q.loading.show({ message: 'Adjuntando y enviando correo...' })

        // Llamada a la API que creamos
        const { data } = await api.post(`/api/cfdis/${row.id}/enviar-correo`)

        $q.notify({
          type: 'positive',
          message: data.message,
          icon: 'mark_email_read',
          timeout: 4000
        })

      } catch (e) {
        // Manejo de errores
        $q.notify({
          type: 'negative',
          message: e.response?.data?.message || 'Error al enviar el correo',
          caption: e.response?.data?.error || '',
          icon: 'unsubscribe'
        })
      } finally {
        $q.loading.hide()
      }
    })
  }


  const cancelFactura = (row) => {
    $q.dialog({
      title: 'Confirmar Cancelación',
      message: `¿Estás seguro de cancelar el folio ${row.folio}?`,
      cancel: true,
      persistent: true
    }).onOk(() => {
      showCancelacionDialog.value = true
      cfdiACancelar.value = row
    })
  }

  const downloadAcuse = async (row) => {
    try {
      $q.loading.show({ message: 'Generando Acuse...' })

      // Petición blob para descargar PDF
      const response = await api.get(`/api/cfdis/${row.id}/acuse`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Acuse_${row.uuid}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()

    } catch (e) {
      $q.notify({
        type: 'negative',
        message: 'No se encontró el acuse de cancelación.',
        caption: 'Es posible que esta factura se cancelara antes de implementar el guardado de acuses.'
      })
    } finally {
      $q.loading.hide()
    }
  }

  onMounted(async() => {
    if (auth.isAdmin) {
      await loadSucursales()
    }
    await loadFacturas()
  })

  const copyUuid = (uuid) => {
    copyToClipboard(uuid).then(() => {
      $q.notify({ message: 'UUID copiado al portapapeles', color: 'dark' })
    })
  }
</script>

<style lang="scss" scoped>
.bg-slate-50 { background-color: #f8fafc; }

// Tarjetas KPI con efecto Glassmorphism
.kpi-card-premium {
  border: 1px solid rgba(255,255,255,0.8);
  background: white;
  transition: all 0.3s cubic-bezier(.25,.8,.25,1);
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  }
}

// Estilos de la tabla Premium
.premium-facturas-table {
  background: white;

  :deep(thead tr th) {
    background-color: #f1f5f9;
    color: #475569;
    font-weight: 800;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    padding: 16px;
    border-bottom: 2px solid #e2e8f0;
  }

  :deep(tbody tr) {
    transition: background-color 0.2s;
    &:hover { background-color: #f8fafc; }
  }

  :deep(tbody td) { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
}

// Badge de Total Resaltado
.total-badge {
  background: #eef2ff;
  color: $indigo-10;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 900;
  font-size: 1rem;
  display: inline-block;
  border: 1px solid #c7d2fe;
}

// Contenedor de UUID Técnico
.uuid-container {
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.7rem;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 6px;
  color: #64748b;
  display: flex;
  align-items: center;
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: #e2e8f0;
    .hover-show { color: $primary; }
  }
}

// Colores de Status Pastel
.chip-status-positive { background: #10b981 !important; }
.chip-status-negative { background: #ef4444 !important; }
.chip-status-orange { background: #f59e0b !important; }

.letter-spacing-1 { letter-spacing: 1.5px; }
.border-radius-20 { border-radius: 20px; }
.shadow-20 { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
</style>
