<template>
  <div :class="spinnerClasses" :style="spinnerStyles">
    <svg
      :class="svgClasses"
      :width="actualSize"
      :height="actualSize"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Spinner variants -->
      <template v-if="variant === 'default'">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </template>

      <template v-else-if="variant === 'dots'">
        <circle class="animate-pulse" cx="4" cy="12" r="2" fill="currentColor">
          <animate attributeName="opacity" values="0;1;0" dur="1.4s" repeatCount="indefinite" begin="0s" />
        </circle>
        <circle class="animate-pulse" cx="12" cy="12" r="2" fill="currentColor">
          <animate attributeName="opacity" values="0;1;0" dur="1.4s" repeatCount="indefinite" begin="0.2s" />
        </circle>
        <circle class="animate-pulse" cx="20" cy="12" r="2" fill="currentColor">
          <animate attributeName="opacity" values="0;1;0" dur="1.4s" repeatCount="indefinite" begin="0.4s" />
        </circle>
      </template>

      <template v-else-if="variant === 'ring'">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
          stroke-dasharray="31.416"
          stroke-dashoffset="31.416"
          fill="none"
          stroke-linecap="round"
        >
          <animate
            attributeName="stroke-dasharray"
            dur="2s"
            values="0 31.416;15.708 15.708;0 31.416;0 31.416"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-dashoffset"
            dur="2s"
            values="0;-15.708;-31.416;-31.416"
            repeatCount="indefinite"
          />
        </circle>
      </template>

      <template v-else-if="variant === 'pulse'">
        <circle
          cx="12"
          cy="12"
          r="0"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
        >
          <animate
            attributeName="r"
            values="0;8;0"
            dur="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="1;0.2;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      </template>
    </svg>

    <!-- Optional text -->
    <span v-if="text" :class="textClasses">
      {{ text }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string
  variant?: 'default' | 'dots' | 'ring' | 'pulse'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'gray' | 'white'
  text?: string
  centered?: boolean
  inline?: boolean
  speed?: 'slow' | 'normal' | 'fast'
}

const props = withDefaults(defineProps<SpinnerProps>(), {
  size: 'md',
  variant: 'default',
  color: 'primary',
  centered: false,
  inline: false,
  speed: 'normal'
})

// Size mapping
const sizeMap = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48
}

const actualSize = computed(() => {
  if (typeof props.size === 'number') {
    return props.size
  }

  if (typeof props.size === 'string' && !isNaN(Number(props.size))) {
    return Number(props.size)
  }

  return sizeMap[props.size as keyof typeof sizeMap] || sizeMap.md
})

const spinnerClasses = computed(() => {
  const classes = []

  if (props.inline) {
    classes.push('inline-flex', 'items-center')
  } else {
    classes.push('flex', 'flex-col', 'items-center')
  }

  if (props.centered && !props.inline) {
    classes.push('justify-center', 'min-h-[100px]')
  }

  if (props.text && !props.inline) {
    classes.push('space-y-2')
  } else if (props.text && props.inline) {
    classes.push('space-x-2')
  }

  return classes
})

const svgClasses = computed(() => {
  const classes = ['flex-shrink-0']

  // Add animation class for default variant
  if (props.variant === 'default') {
    const speedClass = {
      slow: 'animate-spin-slow',
      normal: 'animate-spin',
      fast: 'animate-spin-fast'
    }[props.speed]

    classes.push(speedClass)
  }

  // Add color classes
  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    gray: 'text-gray-600',
    white: 'text-white'
  }[props.color]

  classes.push(colorClasses)

  return classes
})

const textClasses = computed(() => {
  const classes = ['text-sm', 'font-medium']

  // Text color based on spinner color
  const textColorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    gray: 'text-gray-600',
    white: 'text-white'
  }[props.color]

  classes.push(textColorClasses)

  return classes
})

const spinnerStyles = computed(() => {
  const styles: Record<string, string> = {}

  // Custom animation duration for non-default variants
  if (props.variant !== 'default' && props.speed !== 'normal') {
    const duration = {
      slow: '2s',
      normal: '1.5s',
      fast: '1s'
    }[props.speed]

    styles['--animation-duration'] = duration
  }

  return styles
})
</script>

<style scoped>
/* Custom animation speeds */
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spin-fast {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 2s linear infinite;
}

.animate-spin-fast {
  animation: spin-fast 0.5s linear infinite;
}

/* Custom properties for animation duration */
svg[style*="--animation-duration"] animate {
  animation-duration: var(--animation-duration);
}

/* Accessibility: Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .animate-spin,
  .animate-spin-slow,
  .animate-spin-fast,
  .animate-pulse {
    animation: none;
  }

  svg animate {
    animation: none;
  }
}
</style>
