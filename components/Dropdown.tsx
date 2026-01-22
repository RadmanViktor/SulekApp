import { View, Text, Pressable, Modal, FlatList, StyleSheet } from "react-native";
import { useState, useMemo, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";

export type DropItem = { data: string };

type Props = {
  placeholder: string;
  items: DropItem[];
  label: string;
  singleSelect?: boolean;

  // nya props för controlled mode
  value?: string[];                         // aktuell selection från parent
  defaultValue?: string[];                  // initial selection om du vill
  onChange?: (next: string[]) => void;      // callback till parent
};

export default function Dropdown({
  placeholder,
  items,
  label,
  singleSelect = false,
  value,
  defaultValue,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(defaultValue ?? []);

  useEffect(() => {
    if (value) setSelected(value);
  }, [value]);

  const displayText = useMemo(() => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) return selected[0];
    return `Valda: ${selected.length}`;
  }, [selected, placeholder]);

  function toggleItem(item: string) {
    if (singleSelect) {
      setBoth(selected.includes(item) ? [] : [item]);
      return;
    }

    setBoth(selected.includes(item) ? selected.filter(x => x !== item) : [...selected, item]);
  }

  function setBoth(next: string[]) {
    setSelected(next);
    onChange?.(next); // meddela parent
  }

  function removeChip(item: string) {
    if (singleSelect) {
      setBoth([]);
      return;
    }

    setBoth(selected.includes(item) ? selected.filter(x => x !== item) : [...selected, item]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* Knappen */}
      <Pressable style={styles.button} onPress={() => setOpen(true)}>
        <Text style={styles.text}>{displayText}</Text>
      </Pressable>

      {/* Gradient-chips */}
      <View style={styles.chips}>
        {selected.map(item => (
          <View
            key={item}
            style={styles.chip}
          >
            <Text style={styles.chipText}>{item}</Text>
            <Pressable onPress={() => removeChip(item)}>
              <Text style={styles.chipRemove}>✕</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.dropdown}>
            <FlatList
              data={items}
              keyExtractor={(item) => item.data}
              renderItem={({ item }) => {
                const isActive = selected.includes(item.data);
                return (
                  <Pressable onPress={() => toggleItem(item.data)} style={{ marginVertical: 2 }}>
                    {isActive ? (
                      <View
                        style={styles.itemGradient}
                      >
                        <View style={styles.itemRow}>
                          <Text style={styles.itemTextSelected}>{item.data}</Text>
                          <Text style={styles.check}>✓</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.item}>
                        <Text style={styles.itemText}>{item.data}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  label: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    fontWeight: '600',
    color: '#111827c2',
    marginBottom: 6,
    marginLeft: 4,
  },
  button: {
    fontFamily: 'Poppins_400Regular',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#111827',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 1,
  }, 
  text: {
    color: '#9ca3af',
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  },

  /** CHIPS **/
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  chip: {
    fontFamily: 'Poppins_400Regular',
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    elevation: 3, // lite skugga på Android
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    backgroundColor: '#14B8A6', 
  },
  chipText: { fontSize: 14, color: "white", fontWeight: "600" },
  chipRemove: {
    marginLeft: 8,
    fontWeight: "700",
    color: "white",
    opacity: 0.9,
  },

  /** DROPDOWN **/
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdown: {
    backgroundColor: "white",
    width: "80%",
    maxHeight: "60%",
    borderRadius: 10,
    paddingVertical: 8,
    elevation: 5,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemGradient: {
    backgroundColor: '#14B8A6', 
    borderRadius: 6,
    marginHorizontal: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemText: { fontSize: 16, color: "#111" },
  itemTextSelected: { fontSize: 16, color: "white", fontWeight: "600" },
  check: { color: "white", fontSize: 18, fontWeight: "bold" },
});
