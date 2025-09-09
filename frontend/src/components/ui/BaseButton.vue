<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
    v-bind="$attrs"
  >
    <span v-if="loading" class="button-spinner">
      <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </span>

    <Icon v-if="icon && !loading" :name="icon" :class="iconClasses" />

    <span v-if="$slots.default" :class="{ 'ml-2': icon && !loading, 'ml-2': loading }">
      <slot />
    </span>

    <Icon v-if="iconRight && !loading" :name="iconRight" :class="iconRightClasses" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  icon?: string
  iconRight?: string
  rounded?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  rounded: false,
  block: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}

const buttonClasses = computed(() => {
  const classes = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2'
  ]

  // Size classes
  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base'
  }
  classes.push(sizeClasses[props.size])

  // Variant classes
  if (props.variant === 'primary') {
    classes.push(
      'bg-primary-600',
      'text-white',
      'hover:bg-primary-700',
      'focus:ring-primary-500',
      'disabled:bg-primary-300',
      'disabled:cursor-not-allowed'
    )
  } else if (props.variant === 'secondary') {
    classes.push(
      'bg-gray-200',
      'text-gray-900',
      'hover:bg-gray-300',
      'focus:ring-gray-500',
      'disabled:bg-gray-100',
      'disabled:text-gray-400',
      'disabled:cursor-not-allowed',
      'dark:bg-gray-700',
      'dark:text-gray-100',
      'dark:hover:bg-gray-600',
      'dark:disabled:bg-gray-800',
      'dark:disabled:text-gray-500'
    )
  } else if (props.variant === 'outline') {
    classes.push(
      'bg-transparent',
      'border',
      'border-gray-300',
      'text-gray-700',
      'hover:bg-gray-50',
      'focus:ring-gray-500',
      'disabled:border-gray-200',
      'disabled:text-gray-400',
      'disabled:cursor-not-allowed',
      'dark:border-gray-600',
      'dark:text-gray-300',
      'dark:hover:bg-gray-800',
      'dark:disabled:border-gray-700',
      'dark:disabled:text-gray-500'
    )
  } else if (props.variant === 'ghost') {
    classes.push(
      'bg-transparent',
      'text-gray-600',
      'hover:bg-gray-100',
      'hover:text-gray-900',
      'focus:ring-gray-500',
      'disabled:text-gray-400',
      'disabled:cursor-not-allowed',
      'dark:text-gray-400',
      'dark:hover:bg-gray-800',
      'dark:hover:text-gray-100',
      'dark:disabled:text-gray-600'
    )
  } else if (props.variant === 'danger') {
    classes.push(
      'bg-red-600',
      'text-white',
      'hover:bg-red-700',
      'focus:ring-red-500',
      'disabled:bg-red-300',
      'disabled:cursor-not-allowed'
    )
  } else if (props.variant === 'success') {
    classes.push(
      'bg-green-600',
      'text-white',
      'hover:bg-green-700',
      'focus:ring-green-500',
      'disabled:bg-green-300',
      'disabled:cursor-not-allowed'
    )
  } else if (props.variant === 'warning') {
    classes.push(
      'bg-yellow-600',
      'text-white',
      'hover:bg-yellow-700',
      'focus:ring-yellow-500',
      'disabled:bg-yellow-300',
      'disabled:cursor-not-allowed'
    )
  }

  // Border radius
  if (props.rounded) {
    classes.push('rounded-full')
  } else {
    classes.push('rounded-lg')
  }

  // Block width
  if (props.block) {
    classes.push('w-full')
  }

  // Loading state
  if (props.loading) {
    classes.push('cursor-wait')
  }

  return classes
})

const iconClasses = computed(() => {
  const classes = ['flex-shrink-0']

  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-5 w-5'
  }
  classes.push(sizeClasses[props.size])

  return classes
})

const iconRightClasses = computed(() => {
  const classes = ['flex-shrink-0', 'ml-2']

  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-5 w-5'
  }
  classes.push(sizeClasses[props.size])

  return classes
})
</script>

<style scoped>
.button-spinner {
  @apply flex items-center justify-center;
}

/* Custom focus styles for better accessibility */
button:focus-visible {
  @apply ring-2 ring-offset-2;
}

/* Remove focus outline for mouse users */
button:focus:not(:focus-visible) {
  @apply ring-0 ring-offset-0;
}
</style>
