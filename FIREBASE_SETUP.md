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

## 6. Configurar Regras de Segurança do Firestore

⚠️ **IMPORTANTE**: Configure as regras de segurança para o app funcionar corretamente!

1. No Firebase Console, vá para **Firestore Database** → **Regras**
2. Substitua as regras padrão pelas seguintes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários - ler/escrever próprio documento
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Grupos - ler se membro ou público, escrever se membro/admin
    match /groups/{groupId} {
      allow read: if request.auth != null && (
        resource.data.members.hasAny([request.auth.uid]) ||
        resource.data.isPublic == true
      );
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.admins.hasAny([request.auth.uid]);
    }
    
    // Quiz Groups
    match /quizGroups/{quizGroupId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.createdBy == request.auth.uid;
    }
    
    // Quizzes
    match /quizzes/{quizId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

3. Clique em **Publicar**

> **Nota**: Para desenvolvimento rápido, você pode usar regras menos restritivas temporariamente:
> ```javascript
> match /{document=**} {
>   allow read, write: if request.auth != null;
> }
> ```
> Mas **NÃO** use isso em produção!

## 7. Firebase Admin SDK (Opcional - para funções server-side)

O Admin SDK é usado para operações administrativas em servidores/Cloud Functions. Para o app React Native, não é necessário, mas você pode configurá-lo se precisar de funções server-side no futuro.

1. No Firebase Console → **Configurações do projeto** → **Contas de serviço**
2. Clique em **Gerar nova chave privada**
3. Baixe o arquivo JSON (guarde em local seguro, **nunca commite no git!**)
4. Use no seu código server-side:

```javascript
var admin = require("firebase-admin");
var serviceAccount = require("path/to/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

> ⚠️ **ATENÇÃO**: O arquivo `serviceAccountKey.json` contém credenciais sensíveis. 
> **NUNCA** faça commit deste arquivo no Git! Adicione ao `.gitignore`.

## 8. Credenciais Atuais Configuradas

O app já está configurado com as seguintes credenciais:

- **Project ID**: `lurdinha-1451d`
- **API Key**: Configurada em `src/firebase.js`
- **Auth Domain**: `lurdinha-1451d.firebaseapp.com`

Para verificar ou atualizar, edite o arquivo `src/firebase.js`.

## 9. Testar a configuração

Após configurar as regras de segurança, teste se a conexão está funcionando:

1. Execute o app: `npx expo start`
2. Tente fazer login/cadastro
3. Verifique se os dados são salvos no Firestore
4. Verifique os logs do terminal - não deve aparecer erros de "Missing or insufficient permissions"

### Problemas Comuns

- ❌ **Erro "Missing or insufficient permissions"**: Configure as regras de segurança do Firestore (seção 6)
- ❌ **Erro de autenticação**: Verifique se Email/Password está habilitado no Firebase Console
- ❌ **Dados não aparecem**: Verifique se o Firestore Database foi criado e está no modo de teste
