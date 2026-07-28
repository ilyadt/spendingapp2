import {useState} from "react";

export default function useTableGroupMode() {
  const [enabled, setEnabled] = useState<boolean>(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(() => new Set())

  return {
    enabled: enabled,

    disable() {
      setEnabled(false)
    },

    enable() {
      if (enabled) {
        return
      }

      setSelectedItems(new Set())
      setEnabled(true)
    },

    toggleItem(item: string) {
      setSelectedItems(prev => {
        const next = new Set(prev)

        if (next.has(item)) {
          next.delete(item)
        } else {
          next.add(item)
        }

        return next
      })
    },

    selectedItems,
  }
}
