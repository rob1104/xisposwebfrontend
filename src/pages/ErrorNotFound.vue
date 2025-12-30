<template>
  <div class="fullscreen bg-grey-1 flex flex-center">
    <div class="text-center q-pa-lg">
      <div class="relative-position q-mb-xl">
        <q-icon name="search_off" color="grey-4" size="250px" class="absolute-center" />
        <div class="text-h1 text-weight-bolder text-primary relative-position" style="font-size: 12rem; opacity: 0.9;">
          404
        </div>
      </div>

      <div class="text-h4 text-weight-bold text-grey-9 q-mt-lg">
        Página no encontrada
      </div>

      <div class="text-subtitle1 text-grey-7 q-mt-sm q-mb-xl">
        Lo sentimos, la ruta a la que intentas acceder no existe o ha sido movida.
      </div>

      <div class="row justify-center q-gutter-md">
        <q-btn
          outline
          color="primary"
          icon="arrow_back"
          label="Regresar"
          @click="$router.back()"
          class="q-px-lg"
        />
        <q-btn
          unelevated
          color="primary"
          icon="dashboard"
          to="/dashboard"
          label="Ir al Dashboard"
          class="q-px-lg shadow-2"
        />
      </div>

      <div class="fixed-bottom q-mb-md">
        <div class="text-caption text-grey-5 text-uppercase ls-2">
          La Nacional - Sistema de Gestión Global
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// No se requiere lógica adicional, solo navegación estándar
</script>

<style lang="scss" scoped>
  .ls-2 {
    letter-spacing: 2px;
  }

  // Animación sutil para el icono de fondo
  .q-icon {
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05) rotate(-5deg);
    }
  }
</style>

