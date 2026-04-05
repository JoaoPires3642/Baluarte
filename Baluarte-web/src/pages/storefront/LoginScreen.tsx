import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import styles from "../../App.styles";
import type { LoginScreenProps } from "./types";

export function LoginScreen({
  initialMode = "login",
  onBack,
  onStartEmailLogin,
  onVerifyEmailOtp,
  onLoginWithSocial,
  onRegister
}: LoginScreenProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError("");
    setInfo("");
    setOtpSent(false);
    setOtpCode("");
  }, [initialMode]);

  const isRegister = mode === "register";

  const switchMode = (nextMode: "login" | "register") => {
    setMode(nextMode);
    setError("");
    setInfo("");
    setOtpSent(false);
    setOtpCode("");
  };

  const handleSubmit = async () => {
    setError("");
    setInfo("");

    const sanitizedEmail = email.trim().toLowerCase();
    if (!sanitizedEmail || !sanitizedEmail.includes("@")) {
      setError("Informe um email valido");
      return;
    }

    setLoading(true);

    if (isRegister) {
      if (!firstName.trim() || !lastName.trim()) {
        setLoading(false);
        setError("Informe nome e sobrenome");
        return;
      }

      const result = await onRegister(firstName, lastName, sanitizedEmail);
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
      }
      return;
    }

    if (!otpSent) {
      const start = await onStartEmailLogin(sanitizedEmail);
      setLoading(false);
      if (!start.ok) {
        setError(start.error);
        return;
      }

      setOtpSent(true);
      setInfo("Codigo enviado no seu email. Digite abaixo para entrar.");
      return;
    }

    if (!otpCode.trim()) {
      setLoading(false);
      setError("Digite o codigo recebido");
      return;
    }

    const verify = await onVerifyEmailOtp(otpCode.trim());
    setLoading(false);
    if (!verify.ok) {
      setError(verify.error);
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setError("");
    setInfo("");
    setLoading(true);

    const result = await onLoginWithSocial(provider);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setInfo(`Abrindo ${provider === "google" ? "Google" : "Apple"}...`);
  };

  return (
    <View style={styles.authScreen}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>Voltar</Text>
      </Pressable>

      <View style={styles.authCard}>
        <Text style={styles.authTitle}>{isRegister ? "Criar conta" : "Welcome back"}</Text>
        <Text style={styles.authSubtitle}>
          {isRegister ? "Cadastro rapido: nome, sobrenome e email." : "Entre com email e confirme o codigo enviado."}
        </Text>

        <View style={styles.authTabRow}>
          <Pressable
            onPress={() => switchMode("login")}
            style={[styles.authTabButton, mode === "login" ? styles.authTabButtonActive : null]}
          >
            <Text style={[styles.authTabButtonText, mode === "login" ? styles.authTabButtonTextActive : null]}>Entrar</Text>
          </Pressable>
          <Pressable
            onPress={() => switchMode("register")}
            style={[styles.authTabButton, mode === "register" ? styles.authTabButtonActive : null]}
          >
            <Text style={[styles.authTabButtonText, mode === "register" ? styles.authTabButtonTextActive : null]}>Cadastrar</Text>
          </Pressable>
        </View>

        <View style={styles.authForm}>
          {isRegister ? (
            <>
              <TextInput
                style={styles.authInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Nome"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
              />
              <TextInput
                style={styles.authInput}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Sobrenome"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
              />
            </>
          ) : null}

          <TextInput
            style={styles.authInput}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (!isRegister) {
                setOtpSent(false);
                setOtpCode("");
              }
            }}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {!isRegister && otpSent ? (
            <TextInput
              style={styles.authInput}
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="Codigo de verificacao"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="number-pad"
            />
          ) : null}


          {info ? <Text style={styles.authInfo}>{info}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable style={styles.authSubmitButton} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.authSubmitButtonText}>
              {loading
                ? "Processando..."
                : isRegister
                  ? "Criar conta"
                  : otpSent
                    ? "Validar codigo"
                    : "Enviar codigo"}
            </Text>
          </Pressable>

          {!isRegister ? (
            <View style={styles.authSocialButtonsWrap}>
              <Pressable style={styles.authSocialButtonApple} onPress={() => void handleSocialLogin("apple")} disabled={loading}>
                <Text style={styles.authSocialButtonAppleText}>Entrar com Apple</Text>
              </Pressable>
              <Pressable style={styles.authSocialButtonGoogle} onPress={() => void handleSocialLogin("google")} disabled={loading}>
                <Text style={styles.authSocialButtonGoogleText}>Entrar com Google</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <Pressable onPress={() => switchMode(isRegister ? "login" : "register")}>
          <Text style={styles.authSwitchLabel}>
            {isRegister ? "Ja tem conta? " : "Nao tem conta? "}
            <Text style={styles.authSwitchLink}>{isRegister ? "Entrar" : "Cadastrar"}</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
