import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import styles from "../../App.styles";
import type { LoginScreenProps } from "./types";

export function LoginScreen({ initialMode = "login", onBack, onLogin, onRegister }: LoginScreenProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("joao@email.com");
  const [password, setPassword] = useState("123456");
  const [confirmPassword, setConfirmPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError("");
  }, [initialMode]);

  const isRegister = mode === "register";

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    // Sanitize email: trim + lowercase
    const sanitizedEmail = email.trim().toLowerCase();

    if (isRegister) {
      if (password !== confirmPassword) {
        setLoading(false);
        setError("As senhas nao conferem");
        return;
      }
      const result = await onRegister(name, sanitizedEmail, password);
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
      }
      return;
    }

    const ok = await onLogin(sanitizedEmail, password);
    setLoading(false);
    if (!ok) {
      setError("Email ou senha invalidos");
    }
  };

  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>Voltar</Text>
      </Pressable>
      <Text style={styles.screenTitle}>{isRegister ? "Criar conta" : "Entrar"}</Text>
      <Text style={styles.screenDescription}>Voce pode navegar e adicionar ao carrinho sem conta. O login e exigido so na finalizacao.</Text>

      <View style={styles.couponSuggestions}>
        <Pressable onPress={() => { setMode("login"); setError(""); }}>
          <Text style={styles.backLink}>Entrar</Text>
        </Pressable>
        <Pressable onPress={() => { setMode("register"); setError(""); setEmail(""); setPassword(""); setConfirmPassword(""); }}>
          <Text style={styles.backLink}>Cadastrar</Text>
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{isRegister ? "Dados do cadastro" : "Acesse sua conta"}</Text>

        {!isRegister ? (
          <View style={styles.couponSuggestions}>
            <Pressable onPress={() => { setEmail("joao@email.com"); setPassword("123456"); }}>
              <Text style={styles.backLink}>Demo cliente</Text>
            </Pressable>
            <Pressable onPress={() => { setEmail("admin@loja.com"); setPassword("admin123"); }}>
              <Text style={styles.backLink}>Demo admin</Text>
            </Pressable>
          </View>
        ) : null}

        {isRegister ? (
          <TextInput
            style={styles.formInput}
            value={name}
            onChangeText={setName}
            placeholder="Nome completo"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
          />
        ) : null}

        <TextInput
          style={styles.formInput}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.formInput}
          value={password}
          onChangeText={setPassword}
          placeholder="Senha"
          placeholderTextColor="#9ca3af"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <Pressable onPress={() => setShowPassword(!showPassword)} style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: "#2563eb", fontWeight: "600" }}>
            {showPassword ? "👁️ Ocultar senha" : "👁️ Mostrar senha"}
          </Text>
        </Pressable>

        {isRegister ? (
          <>
            <TextInput
              style={styles.formInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmar senha"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: "#2563eb", fontWeight: "600" }}>
                {showConfirmPassword ? "👁️ Ocultar senha" : "👁️ Mostrar senha"}
              </Text>
            </Pressable>
          </>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={styles.primaryActionButton} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.primaryActionButtonText}>
            {loading ? "Processando..." : isRegister ? "Criar conta" : "Entrar"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
