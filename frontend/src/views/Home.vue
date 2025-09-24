<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <!-- Hero Section -->
    <section class="relative px-6 pt-20 pb-16 mx-auto max-w-7xl lg:px-8">
      <!-- Background decoration -->
      <div class="absolute inset-0 -z-10">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-primary-400/20 to-secondary-400/20 rounded-full blur-3xl" />
      </div>

      <div class="text-center">
        <!-- Logo/Brand -->
        <div class="flex justify-center mb-8">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
              <Icon name="code" class="w-6 h-6 text-white" />
            </div>
            <h1 class="text-3xl font-bold gradient-text">XMBL</h1>
          </div>
        </div>

        <!-- Hero headline -->
        <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl">
          Build Apps
          <span class="gradient-text">Visually</span>
        </h1>

        <p class="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Create powerful web applications with our intuitive visual builder. No coding required.
          Drag, drop, and deploy professional apps in minutes.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <BaseButton
            size="lg"
            class="px-8 py-4 text-lg"
            @click="handleGetStarted"
          >
            Get Started Free
            <Icon name="chevron-right" class="ml-2 w-5 h-5" />
          </BaseButton>

          <BaseButton
            variant="outline"
            size="lg"
            class="px-8 py-4 text-lg"
            @click="handleWatchDemo"
          >
            <Icon name="play" class="mr-2 w-5 h-5" />
            Watch Demo
          </BaseButton>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-900 dark:text-white">10K+</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Apps Created</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-900 dark:text-white">500+</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Components</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-900 dark:text-white">99.9%</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-900 dark:text-white">24/7</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Support</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-24 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      <div class="max-w-7xl mx-auto px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Everything you need to build amazing apps
          </h2>
          <p class="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Powerful features that make app development accessible to everyone
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div class="group p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Icon name="palette" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Visual Builder
            </h3>
            <p class="text-gray-600 dark:text-gray-300">
              Drag and drop components to create stunning interfaces without writing a single line of code.
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="group p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div class="w-12 h-12 bg-secondary-100 dark:bg-secondary-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Icon name="template" class="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Rich Templates
            </h3>
            <p class="text-gray-600 dark:text-gray-300">
              Start with professionally designed templates and customize them to match your brand.
            </p>
          </div>

          <!-- Feature 3 -->
          <div class="group p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Icon name="code" class="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Custom Functions
            </h3>
            <p class="text-gray-600 dark:text-gray-300">
              Add custom JavaScript functions and event handlers to create interactive experiences.
            </p>
          </div>

          <!-- Feature 4 -->
          <div class="group p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Icon name="analytics" class="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Real-time Analytics
            </h3>
            <p class="text-gray-600 dark:text-gray-300">
              Monitor your app's performance with built-in analytics and user insights.
            </p>
          </div>

          <!-- Feature 5 -->
          <div class="group p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Icon name="upload" class="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              One-Click Deploy
            </h3>
            <p class="text-gray-600 dark:text-gray-300">
              Deploy your apps instantly to global CDN with custom domains and SSL certificates.
            </p>
          </div>

          <!-- Feature 6 -->
          <div class="group p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Icon name="user" class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              User Management
            </h3>
            <p class="text-gray-600 dark:text-gray-300">
              Built-in user authentication and management with role-based access control.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24 bg-gradient-to-r from-primary-600 to-secondary-600">
      <div class="max-w-4xl mx-auto text-center px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-white sm:text-4xl">
          Ready to build your next app?
        </h2>
        <p class="mt-4 text-xl text-primary-100">
          Join thousands of creators who are building amazing apps with XMBL
        </p>
        <div class="mt-8">
          <BaseButton
            variant="secondary"
            size="lg"
            class="px-8 py-4 text-lg bg-white text-gray-900 hover:bg-gray-100"
            @click="handleGetStarted"
          >
            Start Building Now
            <Icon name="chevron-right" class="ml-2 w-5 h-5" />
          </BaseButton>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import BaseButton from '@/components/ui/BaseButton.vue'
import Icon from '@/components/ui/Icon.vue'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

const handleGetStarted = () => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  } else {
    router.push('/register')
  }
}

const handleWatchDemo = () => {
  // In a real app, this would open a video modal or navigate to a demo page
  uiStore.showInfo('Demo coming soon!', 'We\'re preparing an awesome demo video for you.')
}
</script>

<style scoped>
/* Additional animations */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

.float {
  animation: float 6s ease-in-out infinite;
}
</style>
