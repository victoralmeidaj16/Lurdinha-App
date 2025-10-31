# Lurdinha App - React Native (Expo)

Aplicativo de enquetes e votação social desenvolvido com React Native e Expo.

## 🚀 Funcionalidades

### Autenticação
- ✅ Login/Registro com email e senha
- ✅ Login com Google (configuração necessária)
- ✅ Persistência de sessão

### Grupos
- ✅ Criar grupos públicos ou privados
- ✅ Buscar e entrar em grupos públicos
- ✅ Gerenciar solicitações de entrada
- ✅ Visualizar membros e estatísticas do grupo

### Grupos de Quiz
- ✅ Criar grupos de quiz com múltiplas enquetes
- ✅ Dois tipos de quiz:
  - **Tipo 1**: Sem resposta definida (para eventos futuros)
  - **Tipo 2**: Com resposta pré-definida
- ✅ Quatro modos de privacidade:
  - **Normal**: Todos veem quem votou (avatares nos cards)
  - **Ghost**: Votos anônimos (só criador vê)
  - **Surpresa**: Resultados revelados após deadline
  - **Desafios**: Divisão em times (manual ou aleatória)
- ✅ Sistema de votação com avatares em tempo real
- ✅ Marcação de resposta correta (criador ou todos, conforme config)
- ✅ Ranking automático (individual ou por times)
- ✅ Prazo limite configurável
- ✅ Link de compartilhamento

### Perfil e Estatísticas
- ✅ Tela inicial com estatísticas do usuário
- ✅ Perfil com ranking, streak e conquistas
- ✅ Sistema de pontos e níveis

## 📱 Como executar

### Pré-requisitos

- Node.js 18+ (recomendado 20+)
- npm ou yarn
- Expo CLI: `npm install -g @expo/cli`
- Expo Go app no seu celular (para testar)

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/victoralmeidaj16/Lurdinha-App.git
   cd Lurdinha-App
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o Firebase**
   - Siga as instruções em `FIREBASE_SETUP.md`
   - Substitua as credenciais em `src/firebase.js`
   - Configure as regras de segurança do Firestore

4. **Configure o Google Sign-In**
   - Siga as instruções em `GOOGLE_SIGNIN_SETUP.md`
   - Atualize o `webClientId` em `src/contexts/AuthContext.jsx`

5. **Execute o projeto**
   ```bash
   npx expo start
   ```

### Testando no dispositivo

- **Web**: Pressione `w` no terminal
- **Mobile**: Instale o Expo Go e escaneie o QR code
- **iOS Simulator**: Pressione `i` (requer Xcode)
- **Android Emulator**: Pressione `a` (requer Android Studio)

## 🔧 Configuração

### Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative Authentication (Email/Password e Google)
3. Ative Firestore Database
4. Configure as regras de segurança (ver `FIREBASE_SETUP.md`)
5. Copie as credenciais para `src/firebase.js`

### Google Sign-In

1. Configure o Google Sign-In no Firebase Console
2. Copie o Web Client ID
3. Atualize em `src/contexts/AuthContext.jsx`

## 📁 Estrutura do projeto

```
src/
├── components/                  # Componentes reutilizáveis
│   ├── LoginScreen.jsx         # Tela de login
│   ├── Navigation.jsx          # Navegação principal
│   ├── OptionCard.jsx          # Card de alternativa com avatares
│   └── AvatarCircle.jsx        # Avatar circular reutilizável
├── contexts/                   # Contextos React
│   └── AuthContext.jsx         # Contexto de autenticação
├── hooks/                      # Hooks customizados
│   ├── useUserData.js          # Hook para dados do usuário
│   └── useGroups.js            # Hook para operações de grupos e quizzes
├── screens/                    # Telas da aplicação
│   ├── HomeScreen.jsx          # Tela inicial
│   ├── ProfileScreen.jsx       # Tela de perfil
│   ├── GroupsScreen.jsx        # Lista de grupos
│   ├── CreateGroupScreen.jsx   # Criar grupo
│   ├── SearchGroupsScreen.jsx  # Buscar grupos
│   ├── GroupDetailScreen.jsx   # Detalhes do grupo
│   ├── CreateQuizGroupStep1Screen.jsx  # Step 1: Tipo e modo
│   ├── CreateQuizGroupStep2Screen.jsx  # Step 2: Criar enquetes
│   ├── QuizGroupDetailScreen.jsx       # Detalhes do grupo de quiz
│   ├── QuizScreen.jsx          # Tela de quiz individual
│   └── CreateQuizScreen.jsx    # Criar quiz simples
└── firebase.js                 # Configuração do Firebase
```

## 🛠️ Tecnologias utilizadas

- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **Firebase** - Backend, autenticação e banco de dados
- **Firestore** - Banco de dados NoSQL
- **Google Sign-In** - Login social
- **Lucide React Native** - Ícones
- **React Context API** - Gerenciamento de estado global

## 🎨 Design

### Paleta de Cores

- Fundo: `#121212`
- Cards: `#1E1E1E`
- Destaque (Roxo): `#8A4F9E`
- Acorde (Laranja): `#FF6B35`
- Verde (Sucesso): `#4CAF50`
- Vermelho (Erro): `#E53935`

### Tipografia

- Títulos: Poppins (Bold)
- Corpo: Inter
- Microcópias: Inter (Light)

## 📝 Funcionalidades Implementadas

### Sistema de Grupos de Quiz

- [x] Criação de grupos de quiz com configurações
- [x] Múltiplas enquetes por grupo de quiz
- [x] Sistema de votação com avatares em tempo real
- [x] Marcação de resposta correta
- [x] Cálculo automático de ranking
- [x] Modo Desafios com divisão de times
- [x] Compartilhamento via link
- [x] Edição e deleção de grupos de quiz
- [x] Listeners em tempo real do Firestore

### Sistema de Grupos

- [x] Criar grupos públicos/privados
- [x] Buscar grupos públicos
- [x] Solicitar entrada em grupos
- [x] Gerenciar membros e admins
- [x] Visualizar estatísticas

## 🐛 Problemas conhecidos

- Requer Node.js 20+ para melhor compatibilidade
- Google Sign-In precisa ser configurado para funcionar
- Firebase precisa ser configurado com credenciais reais
- Regras de segurança do Firestore precisam ser configuradas

## 📞 Suporte

Para dúvidas ou problemas, verifique:
1. Se o Firebase está configurado corretamente
2. Se o Google Sign-In está configurado
3. Se todas as dependências estão instaladas
4. Se está usando a versão correta do Node.js
5. Se as regras de segurança do Firestore estão corretas

## 📄 Licença

Este projeto está sob desenvolvimento.
