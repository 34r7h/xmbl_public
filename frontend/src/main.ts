import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/styles/main.css'

// Firebase initialization
import { initializeFirebase } from './services/firebase'

// Global components
import BaseButton from './components/ui/BaseButton.vue'
import BaseInput from './components/ui/BaseInput.vue'
import BaseModal from './components/ui/BaseModal.vue'
import BaseSpinner from './components/ui/BaseSpinner.vue'
import BaseTooltip from './components/ui/BaseTooltip.vue'

// Toast notifications
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// Toast configuration
const toastOptions = {
  position: 'top-right',
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false
}

// Create Vue app
const app = createApp(App)

// Use Pinia for state management
app.use(createPinia())

// Use Vue Router
app.use(router)

// Use Toast notifications
app.use(Toast, toastOptions)

// Register global components
app.component('BaseButton', BaseButton)
app.component('BaseInput', BaseInput)
app.component('BaseModal', BaseModal)
app.component('BaseSpinner', BaseSpinner)
app.component('BaseTooltip', BaseTooltip)

// Initialize Firebase
initializeFirebase()

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err)
  console.error('Component:', vm)
  console.error('Info:', info)
}

// Development tools
if (import.meta.env.DEV) {
  app.config.devtools = true
}

// Mount the app
app.mount('#app')
