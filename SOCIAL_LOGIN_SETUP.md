# Configuração de Login Social (Google e Apple)

## 📋 Pré-requisitos

- Projeto Firebase configurado
- Apple Developer Account (para Apple Sign-In)
- Google Cloud Console configurado (para Google Sign-In)

---

## 🔵 Google Sign-In

### 1. Configurar no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá para **Authentication** > **Sign-in method**
4. Ative **Google** como método de login
5. Configure o nome do projeto e email de suporte
6. Salve as configurações

### 2. Obter Web Client ID

1. No Firebase Console, vá para **Authentication** > **Sign-in method**
2. Clique em **Google**
3. Copie o **Web client ID** (não o Android client ID)
   - Formato: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

### 3. Configurar no App

**Opção A: Usando variável de ambiente (recomendado)**

1. Crie um arquivo `.env` na raiz do projeto:
   ```env
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=seu-web-client-id-aqui
   ```

2. O código já está configurado para ler de `process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

**Opção B: Hardcoded (não recomendado para produção)**

1. Edite `src/contexts/AuthContext.jsx`:
   ```javascript
   GoogleSignin.configure({
     webClientId: 'SEU_WEB_CLIENT_ID_AQUI', // Substitua pelo seu Web Client ID
     offlineAccess: true,
   });
   ```

### 4. Configurar Firebase Authentication

No Firebase Console, certifique-se de que:
- ✅ Google está habilitado como método de login
- ✅ O domínio autorizado está configurado (se necessário)

---

## 🍎 Apple Sign-In

### 1. Requisitos

- ✅ Apple Developer Account (pago)
- ✅ App registrado no Apple Developer Portal
- ✅ Bundle ID configurado: `com.lurdinha.app`

### 2. Configurar no Apple Developer Portal

1. Acesse [Apple Developer Portal](https://developer.apple.com/)
2. Vá para **Certificates, Identifiers & Profiles**
3. Selecione **Identifiers** > **App IDs**
4. Encontre ou crie o App ID: `com.lurdinha.app`
5. Ative **Sign In with Apple** capability
6. Salve as alterações

### 3. Configurar no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá para **Authentication** > **Sign-in method**
3. Ative **Apple** como método de login
4. Configure os seguintes campos:

#### 📋 Resumo Rápido (valores para o seu app):

- **Apple Services ID**: `com.lurdinha.app`
- **Apple Team ID**: `NT62CSCP9D`
- **Key ID**: (deixe em branco - opcional)
- **Private Key**: (deixe em branco - opcional)

> **Nota**: Key ID e Private Key são opcionais e só são necessários se você quiser habilitar refresh tokens. Para a maioria dos apps, não é necessário configurá-los.

#### Onde encontrar cada campo:

**1. Apple Services ID:**
   - **O que é**: Geralmente é o mesmo que o Bundle ID (`com.lurdinha.app`)
   - **Onde encontrar**: 
     - No Apple Developer Portal, vá para **Certificates, Identifiers & Profiles** > **Identifiers**
     - Selecione seu App ID (`com.lurdinha.app`)
     - O Services ID é o mesmo valor do Bundle ID
   - **Para o seu app**: `com.lurdinha.app`

**2. Apple Team ID:**
   - **O que é**: Identificador único da sua conta de desenvolvedor Apple
   - **Onde encontrar**:
     - Acesse [Apple Developer Portal](https://developer.apple.com/account/)
     - Vá para **Membership** (no menu lateral)
     - O Team ID aparece no topo da página (formato: `XXXXXXXXXX`)
     - **Alternativa**: No App ID que você configurou, o Team ID aparece como "App ID Prefix"
   - **Para o seu app**: `NT62CSCP9D` (conforme visto na configuração do App ID)

**3. Key ID e Private Key (OPCIONAL):**
   - **O que são**: Usados apenas se você quiser habilitar refresh tokens (permite que o Firebase renove tokens automaticamente)
   - **Quando usar**: Apenas se você precisar de refresh tokens. Para a maioria dos apps, não é necessário.
   - **Onde encontrar** (se necessário):
     1. No Apple Developer Portal, vá para **Certificates, Identifiers & Profiles** > **Keys**
     2. Clique no botão **"+"** para criar uma nova chave
     3. Dê um nome à chave (ex: "Firebase Apple Sign-In Key")
     4. Marque a opção **"Sign In with Apple"**
     5. Clique em **Continue** e depois em **Register**
     6. **IMPORTANTE**: Baixe a chave (.p8) imediatamente - você só pode baixá-la uma vez!
     7. O **Key ID** aparece na lista de chaves após criar
     8. O **Private Key** é o conteúdo do arquivo .p8 que você baixou
   - **Nota**: Se você não configurar Key ID e Private Key, o Apple Sign-In ainda funcionará, mas sem refresh tokens automáticos

### 4. Configurar no Xcode (para builds nativos)

Se estiver fazendo build nativo:

1. Abra o projeto no Xcode
2. Selecione o target do app
3. Vá para **Signing & Capabilities**
4. Adicione a capability **Sign In with Apple**

### 5. Configurar no app.json

O plugin já está configurado no `app.json`:
```json
{
  "plugins": [
    "@react-native-google-signin/google-signin",
    "expo-apple-authentication"
  ]
}
```

---

## ✅ Verificação

### Testar Google Sign-In

1. Execute o app: `npx expo start`
2. Na tela de login, clique em **"Continuar com Google"**
3. Selecione uma conta Google
4. O login deve funcionar

### Testar Apple Sign-In

1. Execute o app em um dispositivo iOS físico ou simulador
2. Na tela de login, o botão **"Sign in with Apple"** deve aparecer
3. Clique no botão
4. Use Face ID, Touch ID ou senha da Apple
5. O login deve funcionar

---

## 🐛 Troubleshooting

### Google Sign-In não funciona

- ✅ Verifique se o Web Client ID está correto
- ✅ Verifique se o Google está habilitado no Firebase
- ✅ Verifique se o domínio está autorizado no Firebase
- ✅ Para Android: Verifique se o Google Play Services está instalado

### Apple Sign-In não aparece

- ✅ Verifique se está testando em iOS (não aparece no Android)
- ✅ Verifique se o dispositivo suporta Apple Sign-In (iOS 13+)
- ✅ Verifique se a capability está habilitada no Apple Developer Portal
- ✅ Verifique se o Bundle ID está correto

### Erro: "Apple Sign-In não está disponível"

- ✅ Certifique-se de estar testando em um dispositivo iOS real ou simulador
- ✅ Verifique se o iOS é 13.0 ou superior
- ✅ Verifique se o app está configurado corretamente no Apple Developer Portal

---

## 📝 Notas Importantes

1. **Apple Sign-In é obrigatório** para apps que oferecem login social na App Store (desde 2020)
2. **Google Sign-In** funciona em iOS e Android
3. **Apple Sign-In** funciona apenas em iOS
4. Para produção, sempre use variáveis de ambiente para credenciais sensíveis
5. Teste ambos os métodos antes de fazer o build de produção

---

## 🔗 Links Úteis

- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Google Sign-In Documentation](https://developers.google.com/identity/sign-in/ios)
- [Apple Sign-In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)


