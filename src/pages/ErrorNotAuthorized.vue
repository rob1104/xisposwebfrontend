<template>
  <div class="fullscreen bg-auth flex flex-center q-pa-md">
    <q-card class="error-card shadow-24 text-center overflow-hidden">
      <div class="top-accent"></div>

      <q-card-section class="q-pt-xl q-pb-none">
        <div class="relative-position q-mb-xl">
          <q-icon name="explore_off" color="primary" size="200px" class="absolute-center opacity-1" />

          <div class="text-h1 text-weight-bolder text-primary text-404">
            403
          </div>
        </div>
      </q-card-section>

      <q-card-section class="q-px-xl">
        <div class="text-h4 text-bold text-grey-9 q-mb-sm ls-1">ACCESO NO AUTORIZADO</div>
        <div class="text-subtitle1 text-grey-7 q-mb-lg lh-lg">
          Lo sentimos, la ruta solicitada no se encuentra disponible <br>
          o ha sido restringida por el sistema de seguridad.
        </div>
      </q-card-section>

      <q-card-actions align="center" class="q-pb-xl q-gutter-md">
        <q-btn
          outline
          color="primary"
          icon="arrow_back"
          label="Regresar"
          @click="$router.back()"
          class="q-px-lg custom-btn"
        />
        <q-btn
          unelevated
          color="primary"
          icon="dashboard"
          to="/dashboard"
          label="Ir al Inicio"
          class="q-px-lg shadow-5 custom-btn text-bold"
        />
      </q-card-actions>

      <div class="bg-grey-2 q-pa-sm">
        <div class="text-caption text-grey-6 text-uppercase ls-2">
          La Nacional - Gestión de Punto de Venta
        </div>
      </div>
    </q-card>
  </div>
</template>

<script setup>
// Lógica mínima para una página de error profesional
</script>

<style lang="scss" scoped>
  // Fondo con degradado institucional (combinando con el Login)
  .bg-auth {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  }

  .error-card {
    width: 100%;
    max-width: 600px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .top-accent {
    height: 6px;
    background: var(--q-primary);
  }

  .text-404 {
    font-size: 10rem;
    line-height: 1;
    letter-spacing: -5px;
    text-shadow: 4px 4px 0px rgba(0, 0, 0, 0.05);
    z-index: 1;
  }

  .opacity-1 {
    opacity: 0.08;
  }

  .ls-1 { letter-spacing: 1px; }
  .ls-2 { letter-spacing: 2px; }
  .lh-lg { line-height: 1.6; }

  .custom-btn {
    border-radius: 12px;
    padding: 12px 24px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
  }

  // Animación sutil para el 404
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }

  .text-404 {
    animation: float 4s ease-in-out infinite;
  }
</style>
