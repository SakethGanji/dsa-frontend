"use client"

import { useState, useRef, type KeyboardEvent, type ChangeEvent } from "react"
import { X } from "lucide-react"

export interface TagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  maxTags?: number
  maxChars?: number
  placeholder?: string
  disabled?: boolean
  className?: string
  onExceedMaxTags?: () => void
  onExceedMaxChars?: () => void
}

export function TagInput({
  value = [],
  onChange,
  maxTags = 10,
  maxChars = 20,
  placeholder = "Add a tag...",
  disabled = false,
  className = "",
  onExceedMaxTags,
  onExceedMaxChars,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    if (newValue.length > maxChars) {
      setError(`Tag cannot exceed ${maxChars} characters`)
      onExceedMaxChars?.()
    } else {
      setError(null)
    }

    setInputValue(newValue)
  }

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()

    if (!trimmedTag) return

    if (trimmedTag.length > maxChars) {
      setError(`Tag cannot exceed ${maxChars} characters`)
      onExceedMaxChars?.()
      return
    }

    if (value.length >= maxTags) {
      setError(`Maximum of ${maxTags} tags allowed`)
      onExceedMaxTags?.()
      return
    }

    if (!value.includes(trimmedTag)) {
      onChange([...value, trimmedTag])
      setInputValue("")
      setError(null)
    } else {
      setError("Tag already exists")
    }
  }

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove))
    setError(null)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue) {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value.length - 1)
    } else if (e.key === "Escape") {
      setInputValue("")
      setError(null)
      inputRef.current?.blur()
    }
  }

  const handleContainerClick = () => {
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className={`flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 ${
          error ? "border-destructive" : "border-input"
        } ${disabled ? "bg-muted opacity-50" : "bg-background"} ${className}`}
        aria-describedby={error ? "tag-input-error" : undefined}
      >
        {value.map((tag, index) => (
          <div key={`${tag}-${index}`} className="flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-muted">
            <span className="max-w-[200px] truncate">{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(index)}
                aria-label={`Remove tag ${tag}`}
                className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled || value.length >= maxTags}
          className="flex-grow min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground"
          aria-invalid={!!error}
          aria-label="Add a tag"
        />
      </div>
      {error && (
        <p id="tag-input-error" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {value.length} of {maxTags} tags
        </span>
        <span>
          {inputValue.length} of {maxChars} characters
        </span>
      </div>
    </div>
  )
}