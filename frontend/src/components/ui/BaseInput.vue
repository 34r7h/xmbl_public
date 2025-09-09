<template>
  <div class="base-input">
    <label v-if="label" :for="inputId" :class="labelClasses">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <div class="relative" :class="{ 'mt-1': label }">
      <!-- Input field -->
      <input
        v-if="!multiline"
        :id="inputId"
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :class="inputClasses"
        :aria-invalid="hasError"
        :aria-describedby="hasError ? `${inputId}-error` : undefined"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        v-bind="$attrs"
      />

      <!-- Textarea -->
      <textarea
        v-else
        :id="inputId"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :rows="rows"
        :class="inputClasses"
        :aria-invalid="hasError"
        :aria-describedby="hasError ? `${inputId}-error` : undefined"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        v-bind="$attrs"
      />

      <!-- Left icon -->
      <div v-if="iconLeft" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon :name="iconLeft" :class="iconClasses" />
      </div>

      <!-- Right icon -->
      <div v-if="iconRight" class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <Icon :name="iconRight" :class="iconClasses" />
      </div>

      <!-- Password toggle -->
      <button
        v-if="type === 'password'"
        type="button"
        class="absolute inset-y-0 right-0 pr-3 flex items-center"
        @click="togglePasswordVisibility"
      >
        <Icon
          :name="showPassword ? 'eye-slash' : 'eye'"
          class="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        />
      </button>

      <!-- Clear button -->
      <button
        v-if="clearable && modelValue && !disabled && !readonly"
        type="button"
        class="absolute inset-y-0 right-0 pr-3 flex items-center"
        @click="clearInput"
      >
        <Icon name="x" class="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
      </button>

      <!-- Loading spinner -->
      <div v-if="loading" class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <svg class="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>

    <!-- Help text -->
    <p v-if="helpText && !hasError" :class="helpTextClasses">
      {{ helpText }}
    </p>

    <!-- Error message -->
    <p v-if="hasError" :id="`${inputId}-error`" :class="errorClasses">
      {{ errorMessage }}
    </p>

    <!-- Character count -->
    <div v-if="showCharCount" class="flex justify-between items-center mt-1">
      <div></div>
      <span :class="charCountClasses">
        {{ characterCount }} / {{ maxLength }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import Icon from './Icon.vue'

export interface InputProps {
  modelValue?: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  label?: string
  placeholder?: string
  helpText?: string
  errorMessage?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  multiline?: boolean
  rows?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'flushed' | 'unstyled'
  iconLeft?: string
  iconRight?: string
  clearable?: boolean
  loading?: boolean
  maxLength?: number
  showCharCount?: boolean
}

const props = withDefaults(defineProps<InputProps>(), {
  type: 'text',
  size: 'md',
  variant: 'default',
  rows: 3,
  disabled: false,
  readonly: false,
  required: false,
  multiline: false,
  clearable: false,
  loading: false,
  showCharCount: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  input: [event: Event]
  clear: []
}>()

// Generate unique ID for accessibility
const inputId = computed(() => `input-${Math.random().toString(36).substr(2, 9)}`)

// Password visibility toggle
const showPassword = ref(false)
const inputType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type
})

// Validation state
const hasError = computed(() => !!props.errorMessage)

// Character count
const characterCount = computed(() => {
  return String(props.modelValue || '').length
})

// Event handlers
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  let value: string | number = target.value

  if (props.type === 'number') {
    value = target.valueAsNumber || 0
  }

  emit('update:modelValue', value)
  emit('input', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const clearInput = () => {
  emit('update:modelValue', '')
  emit('clear')
}

// Computed classes
const labelClasses = computed(() => [
  'block',
  'text-sm',
  'font-medium',
  'text-gray-700',
  'dark:text-gray-300',
  {
    'text-gray-400 dark:text-gray-500': props.disabled
  }
])

const inputClasses = computed(() => {
  const baseClasses = [
    'block',
    'w-full',
    'transition-colors',
    'duration-200',
    'focus:ring-2',
    'focus:ring-offset-0',
    'focus:outline-none'
  ]

  // Size classes
  const sizeClasses = {
    sm: props.multiline ? 'px-3 py-2 text-sm' : 'px-3 py-1.5 text-sm',
    md: props.multiline ? 'px-3 py-2.5 text-sm' : 'px-3 py-2 text-sm',
    lg: props.multiline ? 'px-4 py-3 text-base' : 'px-4 py-3 text-base'
  }
  baseClasses.push(sizeClasses[props.size])

  // Variant classes
  if (props.variant === 'default') {
    baseClasses.push(
      'border',
      'rounded-lg',
      'bg-white',
      'dark:bg-gray-800'
    )

    if (hasError.value) {
      baseClasses.push(
        'border-red-300',
        'focus:border-red-500',
        'focus:ring-red-500',
        'dark:border-red-600',
        'dark:focus:border-red-500'
      )
    } else {
      baseClasses.push(
        'border-gray-300',
        'focus:border-primary-500',
        'focus:ring-primary-500',
        'dark:border-gray-600',
        'dark:focus:border-primary-500'
      )
    }
  } else if (props.variant === 'filled') {
    baseClasses.push(
      'border-0',
      'rounded-lg',
      'bg-gray-100',
      'focus:bg-white',
      'dark:bg-gray-700',
      'dark:focus:bg-gray-600'
    )

    if (hasError.value) {
      baseClasses.push(
        'focus:ring-red-500',
        'dark:focus:ring-red-500'
      )
    } else {
      baseClasses.push(
        'focus:ring-primary-500',
        'dark:focus:ring-primary-500'
      )
    }
  } else if (props.variant === 'flushed') {
    baseClasses.push(
      'border-0',
      'border-b-2',
      'rounded-none',
      'bg-transparent',
      'px-0',
      'focus:ring-0'
    )

    if (hasError.value) {
      baseClasses.push(
        'border-red-300',
        'focus:border-red-500',
        'dark:border-red-600'
      )
    } else {
      baseClasses.push(
        'border-gray-300',
        'focus:border-primary-500',
        'dark:border-gray-600'
      )
    }
  } else if (props.variant === 'unstyled') {
    baseClasses.push('border-0', 'bg-transparent', 'p-0', 'focus:ring-0')
  }

  // State classes
  if (props.disabled) {
    baseClasses.push(
      'opacity-50',
      'cursor-not-allowed',
      'bg-gray-50',
      'dark:bg-gray-800'
    )
  }

  if (props.readonly) {
    baseClasses.push('bg-gray-50', 'dark:bg-gray-800')
  }

  // Text color
  baseClasses.push('text-gray-900', 'dark:text-gray-100')

  // Placeholder color
  baseClasses.push('placeholder-gray-400', 'dark:placeholder-gray-500')

  // Icon padding
  if (props.iconLeft) {
    baseClasses.push('pl-10')
  }

  if (props.iconRight || props.clearable || props.loading || props.type === 'password') {
    baseClasses.push('pr-10')
  }

  return baseClasses
})

const iconClasses = computed(() => [
  'h-4',
  'w-4',
  'text-gray-400',
  'dark:text-gray-500',
  {
    'text-gray-300 dark:text-gray-600': props.disabled
  }
])

const helpTextClasses = computed(() => [
  'mt-1',
  'text-sm',
  'text-gray-500',
  'dark:text-gray-400'
])

const errorClasses = computed(() => [
  'mt-1',
  'text-sm',
  'text-red-600',
  'dark:text-red-400'
])

const charCountClasses = computed(() => {
  const baseClasses = ['text-xs']

  if (props.maxLength && characterCount.value > props.maxLength) {
    baseClasses.push('text-red-600', 'dark:text-red-400')
  } else {
    baseClasses.push('text-gray-500', 'dark:text-gray-400')
  }

  return baseClasses
})
</script>

<style scoped>
/* Custom scrollbar for textarea */
textarea {
  scrollbar-width: thin;
  scrollbar-color: theme('colors.gray.300') transparent;
}

textarea::-webkit-scrollbar {
  width: 8px;
}

textarea::-webkit-scrollbar-track {
  background: transparent;
}

textarea::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.300');
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background-color: theme('colors.gray.400');
}

.dark textarea {
  scrollbar-color: theme('colors.gray.600') transparent;
}

.dark textarea::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.600');
}

.dark textarea::-webkit-scrollbar-thumb:hover {
  background-color: theme('colors.gray.500');
}

/* Remove number input arrows */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* Focus styles for better accessibility */
input:focus-visible,
textarea:focus-visible {
  @apply ring-2 ring-offset-2;
}

/* Remove focus outline for mouse users */
input:focus:not(:focus-visible),
textarea:focus:not(:focus-visible) {
  @apply ring-0 ring-offset-0;
}
</style>
