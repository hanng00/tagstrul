import { useState, useRef, useEffect } from "react"
import { searchStations, type Station } from "@/lib/stations"

interface StationInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  label?: string
  disabled?: boolean
}

export function StationInput({
  value,
  onChange,
  placeholder = "Sök station...",
  autoFocus = false,
  label,
  disabled = false,
}: StationInputProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<Station[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (query && isOpen) {
      setResults(searchStations(query))
      setHighlightedIndex(0)
    } else {
      setResults([])
    }
  }, [query, isOpen])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value
    setQuery(newValue)
    setIsOpen(true)
    if (!newValue) {
      onChange("")
    }
  }

  function handleSelect(station: Station) {
    setQuery(station.name)
    onChange(station.name)
    setIsOpen(false)
    setResults([])
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex((i) => Math.min(i + 1, results.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex((i) => Math.max(i - 1, 0))
        break
      case "Enter":
        e.preventDefault()
        if (results[highlightedIndex]) {
          handleSelect(results[highlightedIndex])
        }
        break
      case "Escape":
        setIsOpen(false)
        break
    }
  }

  function handleBlur() {
    setTimeout(() => {
      setIsOpen(false)
      if (query && !results.some((r) => r.name === query)) {
        const match = results[0]
        if (match) {
          setQuery(match.name)
          onChange(match.name)
        }
      }
    }, 150)
  }

  return (
    <div className="relative">
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        disabled={disabled}
        className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground disabled:opacity-50"
      />

      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-border bg-card shadow-lg"
        >
          {results.map((station, index) => (
            <li key={station.name}>
              <button
                type="button"
                onMouseDown={() => handleSelect(station)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex w-full items-center px-4 py-3 text-left text-sm transition-colors ${
                  index === highlightedIndex
                    ? "bg-muted text-foreground"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="font-medium">{station.name}</span>
                {station.shortName !== station.name && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {station.shortName}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && query && results.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground shadow-lg">
          Ingen station hittades
        </div>
      )}
    </div>
  )
}
