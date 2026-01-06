<template>
  <q-page class="q-pa-md bg-grey-3">
    <div class="row q-col-gutter-md">

      <div class="col-12">
        <div class="text-h4 text-bold text-secondary q-mb-md text-uppercase">
          <span class="text-primary">panel principal</span>
        </div>
        <q-separator color="primary" size="3px" class="q-mb-lg" style="width: 100px" />
      </div>

      <div class="col-12 col-md-4">
        <q-card class="shadow-5 full-height">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6"><q-icon name="person" /> Datos del Usuario</div>
          </q-card-section>

          <q-card-section>
            <q-list dense>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Nombre completo</q-item-label>
                  <q-item-label class="text-bold">{{ auth.user?.name }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Correo electrónico</q-item-label>
                  <q-item-label class="text-bold">{{ auth.user?.email }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card class="shadow-5 full-height">
          <q-card-section class="bg-secondary text-white">
            <div class="text-h6"><q-icon name="admin_panel_settings" /> Roles del Sistema</div>
          </q-card-section>

          <q-card-section class="q-gutter-xs">
            <div v-if="auth.roles.length > 0">
              <q-chip
                v-for="role in auth.roles"
                :key="role"
                color="primary"
                text-color="white"
                icon="verified"
                class="text-uppercase text-bold"
              >
                {{ role }}
              </q-chip>
            </div>
            <div v-else class="text-grey italic">No hay roles asignados</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card class="shadow-5 full-height">
          <q-card-section class="bg-grey-9 text-white">
            <div class="text-h6"><q-icon name="store" /> Sucursales con Acceso</div>
          </q-card-section>

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
      </div>
      <div>
        <q-btn
          color="deep-purple"
          icon="settings_remote"
          label="Probar QZ Tray"
          push
          @click="probrarImpresion"
        />

      </div>
    </div>
  </q-page>
</template>

<script setup>
  import { ref } from 'vue'
  import { useQuasar } from 'quasar'
  import { useAuthStore } from 'stores/auth'
  import { PrintService } from 'src/services/PrintService'


  const $q = useQuasar()
  const auth = useAuthStore()

  const probrarImpresion = async () => {
  try {
    await PrintService.imprimirTicketPruebaPython()
    $q.notify({
      color: 'positive',
      message: 'Ticket de prueba enviado con éxito',
      icon: 'print'
    })
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message,
      icon: 'warning'
    })
  }
}

</script>
