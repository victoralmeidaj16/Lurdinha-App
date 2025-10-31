# Configuração do Firebase

## 1. Criar projeto no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Digite o nome do projeto (ex: "lurdinha-app")
4. Ative o Google Analytics (opcional)
5. Clique em "Criar projeto"

## 2. Configurar Authentication

1. No painel lateral, clique em "Authentication"
2. Clique em "Começar"
3. Vá para a aba "Sign-in method"
4. Ative "Email/Password"
5. Ative "Google" (opcional)

## 3. Configurar Firestore Database

1. No painel lateral, clique em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha "Começar no modo de teste" (para desenvolvimento)
4. Escolha uma localização (ex: "us-central1")

## 4. Obter credenciais do projeto

1. No painel lateral, clique em "Configurações do projeto" (ícone de engrenagem)
2. Role para baixo até "Seus aplicativos"
3. Clique em "Web" (ícone </>)
4. Digite um nome para o app (ex: "lurdinha-web")
5. Clique em "Registrar app"
6. Copie as credenciais que aparecem

## 5. Atualizar firebase.js

Substitua as credenciais no arquivo `src/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "sua-api-key-aqui",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id"
};
```

## 6. Regras do Firestore (opcional)

Para desenvolvimento, você pode usar estas regras no Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 7. Testar a configuração

Após configurar, teste se a conexão está funcionando executando o app.
