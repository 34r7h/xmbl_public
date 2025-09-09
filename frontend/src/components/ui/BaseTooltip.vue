<template>
  <div class="relative inline-block" ref="triggerRef">
    <!-- Trigger element -->
    <div
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @focus="handleFocus"
      @blur="handleBlur"
      @click="handleClick"
    >
      <slot />
    </div>

    <!-- Tooltip -->
    <Teleport to="body">
      <Transition name="tooltip" appear>
        <div
          v-if="isVisible"
          ref="tooltipRef"
          :class="tooltipClasses"
          :style="tooltipStyles"
          role="tooltip"
          :id="tooltipId"
        >
          <!-- Arrow -->
          <div v-if="showArrow" :class="arrowClasses" :style="arrowStyles" />

          <!-- Content -->
          <div class="relative z-10">
            <slot name="content">
              {{ content }}
            </slot>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { computePosition, flip, shift, offset, arrow, autoUpdate } from '@floating-ui/dom'

export interface TooltipProps {
  content?: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end'
  trigger?: 'hover' | 'click' | 'focus' | 'manual'
  delay?: number | { show: number; hide: number }
  disabled?: boolean
  showArrow?: boolean
  offset?: number
  theme?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
  maxWidth?: string | number
}

const props = withDefaults(defineProps<TooltipProps>(), {
  placement: 'top',
  trigger: 'hover',
  delay: 100,
  disabled: false,
  showArrow: true,
  offset: 8,
  theme: 'dark',
  size: 'md',
  maxWidth: '200px'
})

const emit = defineEmits<{
  show: []
  hide: []
}>()

// Template refs
const triggerRef = ref<HTMLElement>()
const tooltipRef = ref<HTMLElement>()

// State
const isVisible = ref(false)
const currentPlacement = ref(props.placement)
const tooltipId = computed(() => `tooltip-${Math.random().toString(36).substr(2, 9)}`)

// Timers for delay
let showTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null
let cleanup: (() => void) | null = null

// Position state
const x = ref(0)
const y = ref(0)
const arrowX = ref(0)
const arrowY = ref(0)

// Computed properties
const showDelay = computed(() => {
  if (typeof props.delay === 'number') {
    return props.delay
  }
  return props.delay.show || 0
})

const hideDelay = computed(() => {
  if (typeof props.delay === 'number') {
    return props.delay
  }
  return props.delay.hide || 0
})

const tooltipClasses = computed(() => {
  const classes = [
    'absolute',
    'z-50',
    'px-3',
    'py-2',
    'text-sm',
    'font-medium',
    'rounded-lg',
    'shadow-lg',
    'pointer-events-none',
    'whitespace-nowrap',
    'max-w-none'
  ]

  // Theme classes
  if (props.theme === 'dark') {
    classes.push(
      'bg-gray-900',
      'text-white',
      'dark:bg-gray-700',
      'dark:text-gray-100'
    )
  } else {
    classes.push(
      'bg-white',
      'text-gray-900',
      'border',
      'border-gray-200',
      'dark:bg-gray-800',
      'dark:text-gray-100',
      'dark:border-gray-600'
    )
  }

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  // Replace default padding with size-specific padding
  const sizeClass = sizeClasses[props.size]
  classes.splice(classes.indexOf('px-3'), 1)
  classes.splice(classes.indexOf('py-2'), 1)
  classes.splice(classes.indexOf('text-sm'), 1)
  classes.push(...sizeClass.split(' '))

  return classes
})

const tooltipStyles = computed(() => {
  const styles: Record<string, string> = {
    left: `${x.value}px`,
    top: `${y.value}px`
  }

  // Max width
  if (props.maxWidth) {
    if (typeof props.maxWidth === 'number') {
      styles.maxWidth = `${props.maxWidth}px`
    } else {
      styles.maxWidth = props.maxWidth
    }
    styles.whiteSpace = 'normal'
  }

  return styles
})

const arrowClasses = computed(() => {
  const classes = ['absolute', 'w-2', 'h-2', 'rotate-45']

  if (props.theme === 'dark') {
    classes.push('bg-gray-900', 'dark:bg-gray-700')
  } else {
    classes.push('bg-white', 'border', 'border-gray-200', 'dark:bg-gray-800', 'dark:border-gray-600')
  }

  return classes
})

const arrowStyles = computed(() => {
  const styles: Record<string, string> = {
    left: `${arrowX.value}px`,
    top: `${arrowY.value}px`
  }

  // Hide specific borders based on placement
  if (currentPlacement.value.startsWith('top')) {
    styles.borderBottomColor = 'transparent'
    styles.borderRightColor = 'transparent'
  } else if (currentPlacement.value.startsWith('bottom')) {
    styles.borderTopColor = 'transparent'
    styles.borderLeftColor = 'transparent'
  } else if (currentPlacement.value.startsWith('left')) {
    styles.borderTopColor = 'transparent'
    styles.borderRightColor = 'transparent'
  } else if (currentPlacement.value.startsWith('right')) {
    styles.borderBottomColor = 'transparent'
    styles.borderLeftColor = 'transparent'
  }

  return styles
})

// Methods
const show = () => {
  if (props.disabled || isVisible.value) return

  clearTimeout(hideTimer!)

  if (showDelay.value > 0) {
    showTimer = setTimeout(() => {
      isVisible.value = true
      emit('show')
      nextTick(() => {
        updatePosition()
      })
    }, showDelay.value)
  } else {
    isVisible.value = true
    emit('show')
    nextTick(() => {
      updatePosition()
    })
  }
}

const hide = () => {
  if (!isVisible.value) return

  clearTimeout(showTimer!)

  if (hideDelay.value > 0) {
    hideTimer = setTimeout(() => {
      isVisible.value = false
      emit('hide')
      if (cleanup) {
        cleanup()
        cleanup = null
      }
    }, hideDelay.value)
  } else {
    isVisible.value = false
    emit('hide')
    if (cleanup) {
      cleanup()
      cleanup = null
    }
  }
}

const updatePosition = async () => {
  if (!triggerRef.value || !tooltipRef.value) return

  const arrowElement = tooltipRef.value.querySelector('.absolute.w-2.h-2') as HTMLElement

  const middleware = [
    offset(props.offset),
    flip(),
    shift({ padding: 8 })
  ]

  if (props.showArrow && arrowElement) {
    middleware.push(arrow({ element: arrowElement }))
  }

  try {
    const { x: newX, y: newY, placement, middlewareData } = await computePosition(
      triggerRef.value,
      tooltipRef.value,
      {
        placement: props.placement,
        middleware
      }
    )

    x.value = newX
    y.value = newY
    currentPlacement.value = placement

    // Update arrow position
    if (props.showArrow && middlewareData.arrow) {
      const { x: arrowXPos, y: arrowYPos } = middlewareData.arrow

      if (arrowXPos != null) {
        arrowX.value = arrowXPos
      }
      if (arrowYPos != null) {
        arrowY.value = arrowYPos
      }
    }

    // Set up auto-update
    if (cleanup) {
      cleanup()
    }

    cleanup = autoUpdate(triggerRef.value, tooltipRef.value, updatePosition)
  } catch (error) {
    console.warn('Tooltip positioning failed:', error)
  }
}

// Event handlers
const handleMouseEnter = () => {
  if (props.trigger === 'hover') {
    show()
  }
}

const handleMouseLeave = () => {
  if (props.trigger === 'hover') {
    hide()
  }
}

const handleFocus = () => {
  if (props.trigger === 'focus') {
    show()
  }
}

const handleBlur = () => {
  if (props.trigger === 'focus') {
    hide()
  }
}

const handleClick = () => {
  if (props.trigger === 'click') {
    if (isVisible.value) {
      hide()
    } else {
      show()
    }
  }
}

// Public methods for manual control
const showTooltip = () => {
  show()
}

const hideTooltip = () => {
  hide()
}

const toggleTooltip = () => {
  if (isVisible.value) {
    hide()
  } else {
    show()
  }
}

// Watch for content changes
watch(() => props.content, () => {
  if (isVisible.value) {
    nextTick(() => {
      updatePosition()
    })
  }
})

// Cleanup on unmount
onUnmounted(() => {
  clearTimeout(showTimer!)
  clearTimeout(hideTimer!)
  if (cleanup) {
    cleanup()
  }
})

// Expose public methods
defineExpose({
  show: showTooltip,
  hide: hideTooltip,
  toggle: toggleTooltip
})
</script>

<style scoped>
/* Tooltip transitions */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Ensure tooltip is above other elements */
.tooltip-enter-to,
.tooltip-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* Accessibility: High contrast support */
@media (prefers-contrast: high) {
  .tooltip-dark {
    @apply border border-white;
  }

  .tooltip-light {
    @apply border-2 border-black;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .tooltip-enter-active,
  .tooltip-leave-active {
    transition: none;
  }
}
</style>
