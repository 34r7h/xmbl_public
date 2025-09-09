<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div
        v-if="show"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
        @click="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />

        <!-- Modal container -->
        <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <Transition name="modal-content" appear>
            <div
              v-if="show"
              ref="modalRef"
              :class="modalClasses"
              @click.stop
            >
              <!-- Header -->
              <div v-if="!hideHeader" class="modal-header">
                <div class="flex items-center justify-between">
                  <h3
                    v-if="title"
                    id="modal-title"
                    class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    {{ title }}
                  </h3>
                  <div v-else class="flex-1">
                    <slot name="title" />
                  </div>

                  <button
                    v-if="closable"
                    type="button"
                    class="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-gray-500 dark:hover:text-gray-300"
                    @click="handleClose"
                  >
                    <span class="sr-only">Close</span>
                    <Icon name="x" class="h-6 w-6" />
                  </button>
                </div>
              </div>

              <!-- Body -->
              <div :class="bodyClasses">
                <slot />
              </div>

              <!-- Footer -->
              <div v-if="!hideFooter && ($slots.footer || showDefaultFooter)" class="modal-footer">
                <slot name="footer">
                  <div v-if="showDefaultFooter" class="flex justify-end space-x-3">
                    <BaseButton
                      v-if="cancelable"
                      variant="outline"
                      @click="handleCancel"
                    >
                      {{ cancelText }}
                    </BaseButton>
                    <BaseButton
                      :variant="confirmVariant"
                      :loading="loading"
                      @click="handleConfirm"
                    >
                      {{ confirmText }}
                    </BaseButton>
                  </div>
                </slot>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import BaseButton from './BaseButton.vue'
import Icon from './Icon.vue'

export interface ModalProps {
  show: boolean
  title?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  persistent?: boolean
  closable?: boolean
  hideHeader?: boolean
  hideFooter?: boolean
  showDefaultFooter?: boolean
  cancelable?: boolean
  cancelText?: string
  confirmText?: string
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
  loading?: boolean
  scrollable?: boolean
  centered?: boolean
}

const props = withDefaults(defineProps<ModalProps>(), {
  size: 'md',
  persistent: false,
  closable: true,
  hideHeader: false,
  hideFooter: false,
  showDefaultFooter: false,
  cancelable: true,
  cancelText: 'Cancel',
  confirmText: 'Confirm',
  confirmVariant: 'primary',
  loading: false,
  scrollable: false,
  centered: true
})

const emit = defineEmits<{
  'update:show': [value: boolean]
  close: []
  cancel: []
  confirm: []
  opened: []
  closed: []
}>()

const modalRef = ref<HTMLDivElement>()

// Handle close actions
const handleClose = () => {
  if (!props.persistent) {
    emit('update:show', false)
    emit('close')
  }
}

const handleCancel = () => {
  emit('cancel')
  if (!props.persistent) {
    emit('update:show', false)
  }
}

const handleConfirm = () => {
  emit('confirm')
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget && !props.persistent) {
    handleClose()
  }
}

// Keyboard event handler
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.show && props.closable && !props.persistent) {
    handleClose()
  }
}

// Body scroll lock
const lockBodyScroll = () => {
  document.body.style.overflow = 'hidden'
  document.body.style.paddingRight = `${getScrollbarWidth()}px`
}

const unlockBodyScroll = () => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
}

const getScrollbarWidth = () => {
  const scrollDiv = document.createElement('div')
  scrollDiv.style.cssText = 'width:99px;height:99px;overflow:scroll;position:absolute;top:-9999px;'
  document.body.appendChild(scrollDiv)
  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
  document.body.removeChild(scrollDiv)
  return scrollbarWidth
}

// Focus management
const focusableElements = [
  'button',
  '[href]',
  'input',
  'select',
  'textarea',
  '[tabindex]:not([tabindex="-1"])'
]

const trapFocus = () => {
  if (!modalRef.value) return

  const focusable = modalRef.value.querySelectorAll(focusableElements.join(','))
  const firstFocusable = focusable[0] as HTMLElement
  const lastFocusable = focusable[focusable.length - 1] as HTMLElement

  const handleTabKey = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable?.focus()
        event.preventDefault()
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable?.focus()
        event.preventDefault()
      }
    }
  }

  document.addEventListener('keydown', handleTabKey)
  firstFocusable?.focus()

  return () => {
    document.removeEventListener('keydown', handleTabKey)
  }
}

// Computed classes
const modalClasses = computed(() => {
  const classes = [
    'relative',
    'transform',
    'overflow-hidden',
    'rounded-lg',
    'bg-white',
    'text-left',
    'shadow-xl',
    'transition-all',
    'dark:bg-gray-800'
  ]

  // Size classes
  const sizeClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-none w-full h-full'
  }
  classes.push(sizeClasses[props.size])

  // Full size handling
  if (props.size === 'full') {
    classes.push('m-0', 'rounded-none')
  } else {
    classes.push('mx-auto', 'my-8', 'w-full')
  }

  // Scrollable
  if (props.scrollable && props.size !== 'full') {
    classes.push('max-h-96', 'overflow-y-auto')
  }

  return classes
})

const bodyClasses = computed(() => {
  const classes = ['modal-body']

  if (props.scrollable) {
    classes.push('overflow-y-auto')
  }

  return classes
})

// Watch for show changes
watch(() => props.show, async (newShow) => {
  if (newShow) {
    lockBodyScroll()
    await nextTick()
    trapFocus()
    emit('opened')
  } else {
    unlockBodyScroll()
    emit('closed')
  }
})

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  if (props.show) {
    lockBodyScroll()
    nextTick(() => {
      trapFocus()
      emit('opened')
    })
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  unlockBodyScroll()
})
</script>

<style scoped>
/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-content-enter-active,
.modal-content-leave-active {
  transition: all 0.3s ease;
}

.modal-content-enter-from,
.modal-content-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-10px);
}

/* Modal layout */
.modal-header {
  @apply px-6 py-4 border-b border-gray-200 dark:border-gray-700;
}

.modal-body {
  @apply px-6 py-4;
}

.modal-footer {
  @apply px-6 py-4 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-750;
}

/* Custom scrollbar for scrollable modals */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.modal-body::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.300');
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background-color: theme('colors.gray.400');
}

.dark .modal-body::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.600');
}

.dark .modal-body::-webkit-scrollbar-thumb:hover {
  background-color: theme('colors.gray.500');
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .modal-header,
  .modal-body,
  .modal-footer {
    @apply px-4 py-3;
  }
}
</style>
