import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

export default function App() {
  const [cargando, setCargando] = useState(false);
  const [prediccion, setPrediccion] = useState(null);

  // ⚡ FUNCIÓN MÓVIL: Sincroniza por Wi-Fi con el Micro-Backend de Python
  const ejecutarPrediccionMovil = async () => {
    setCargando(true);
    try {
      // ⚙️ CONFIGURACIÓN DE IP MÓVIL (Producción Windows Server 2019)
      const respuesta = await fetch("http://10.0.0.1:8000/api/prediccion");
      const resultado = await respuesta.json();
      if (resultado.status === "success") {
        setPrediccion(resultado.resultado);
      }
    } catch (error) {
      alert("Error de conexión con el servidor de la planta.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Estación Logística Móvil</Text>
        <Text style={styles.subtitle}>Operador: YGO</Text>

        {/* 🔘 BOTÓN INTERACTIVO NATIVO MÓVIL */}
        <TouchableOpacity
          style={styles.button}
          onPress={ejecutarPrediccionMovil}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>🤖 Calcular Stock Futuro (IA)</Text>
          )}
        </TouchableOpacity>

        {/* 📊 DESPLIEGUE VISUAL SEGURO EN SMARTPHONE (Usando View en lugar de div) */}
        {prediccion && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Pronóstico de Inventario</Text>
            <Text style={styles.resultText}>
              • Proyección: {prediccion.proyeccion_mes_siguiente} pzas
            </Text>
            <Text style={styles.resultText}>
              • Confianza: {prediccion.confianza_algoritmo}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// 🎨 ESTILOS MÓVILES RESPONSIVOS: Controlan el diseño visual en la pantalla del celular
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#8b5cf6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  resultContainer: {
    backgroundColor: "#f5f3ff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd6fe",
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#581c87",
    marginBottom: 6,
  },
  resultText: { fontSize: 13, color: "#6d28d9", marginVertical: 2 },
});
