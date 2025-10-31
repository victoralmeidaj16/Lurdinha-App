# Configuração do Google Sign-In

## 1. Configurar no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá para "Authentication" > "Sign-in method"
4. Ative "Google" como método de login
5. Configure o nome do projeto e email de suporte

## 2. Obter Web Client ID

1. No Firebase Console, vá para "Authentication" > "Sign-in method"
2. Clique em "Google"
3. Copie o "Web client ID" (não o Android client ID)

## 3. Atualizar AuthContext

No arquivo `src/contexts/AuthContext.jsx`, substitua:

```javascript
GoogleSignin.configure({
  webClientId: 'SEU_WEB_CLIENT_ID_AQUI', // Substitua pelo seu Web Client ID
  offlineAccess: true,
});
```

Pelo seu Web Client ID real do Firebase.

## 4. Configurar app.json (Expo)

Adicione as configurações do Google Sign-In no `app.json`:

```json
{
  "expo": {
    "name": "lurdinha-app",
    "slug": "lurdinha-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.seudominio.lurdinhaapp"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.seudominio.lurdinhaapp",
      "googleServicesFile": "./google-services.json"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "@react-native-google-signin/google-signin"
    ]
  }
}
```

## 5. Para Android (Opcional - se quiser build nativo)

1. Baixe o arquivo `google-services.json` do Firebase Console
2. Coloque na raiz do projeto
3. Configure o `package` no `app.json` com o mesmo nome do arquivo

## 6. Para iOS (Opcional - se quiser build nativo)

1. Baixe o arquivo `GoogleService-Info.plist` do Firebase Console
2. Adicione ao projeto iOS
3. Configure o `bundleIdentifier` no `app.json`

## 7. Testar

Após configurar, teste o login com Google no app.
