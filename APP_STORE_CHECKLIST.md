# Checklist de Verificação para App Store

Este documento contém o checklist completo para verificar se o app está pronto para submissão à App Store da Apple.

## ✅ Status de Verificação

### 1. Configurações Técnicas

#### app.json
- ✅ Bundle Identifier: `com.lurdinha.app` (correto)
- ✅ Versão: `1.0.0` (definida)
- ✅ iOS Icon: `./assets/app-store-icon-1024.png` (configurado)
- ✅ Permissões declaradas:
  - ✅ `NSCameraUsageDescription` - "Precisamos acessar sua câmera para você tirar fotos de perfil."
  - ✅ `NSPhotoLibraryUsageDescription` - "Precisamos acessar suas fotos para você escolher uma foto de perfil."
  - ✅ `NSPhotoLibraryAddUsageDescription` - "Precisamos salvar fotos de perfil na sua biblioteca de fotos."
- ✅ Plugins configurados:
  - ✅ `@react-native-google-signin/google-signin`
  - ✅ `expo-apple-authentication`

#### eas.json
- ✅ Profile `production` configurado
- ✅ `autoIncrement` habilitado

### 2. URLs Obrigatórias

#### URLs no Código (verificadas)
- ✅ Suporte: `https://victoralmeidaj16.github.io/Lurdinha-App/support.html`
  - Arquivo: `src/screens/SupportScreen.jsx`
- ✅ Marketing: `https://victoralmeidaj16.github.io/Lurdinha-App/marketing.html`
  - Arquivo: `src/screens/MarketingScreen.jsx`
- ✅ Política de Privacidade: `https://victoralmeidaj16.github.io/Lurdinha-App/privacy-policy.html`
  - Arquivo: `src/screens/PrivacyPolicyScreen.jsx`
- ✅ Termos de Serviço: `https://victoralmeidaj16.github.io/Lurdinha-App/terms-of-service.html`
  - Arquivo: `src/screens/TermsOfServiceScreen.jsx`

#### URLs no App Store Connect (verificar manualmente)
- [ ] URL de Suporte configurada no App Store Connect
- [ ] URL de Marketing configurada no App Store Connect
- [ ] URL de Política de Privacidade configurada no App Store Connect

**Importante**: Certifique-se de que todas as URLs estão funcionando e acessíveis antes de submeter.

### 3. Funcionalidades Obrigatórias

#### Exclusão de Conta
- ✅ Implementada em `src/screens/DeleteAccountScreen.jsx`
- ✅ Reautenticação obrigatória antes de deletar
- ✅ Deleta todos os dados do usuário (perfil, grupos, votos)
- ✅ Acessível em: Configurações > Excluir conta

#### Exportação de Dados (LGPD)
- ✅ Implementada em `src/screens/ExportDataScreen.jsx`
- ✅ Exporta todos os dados do usuário em formato JSON:
  - Informações da conta
  - Estatísticas e histórico
  - Grupos
  - Quiz groups
  - Votos em quizzes
- ✅ Acessível em: Configurações > Exportar Dados

#### Acesso às Políticas
- ✅ Política de Privacidade acessível no app
- ✅ Termos de Serviço acessíveis no app
- ✅ Suporte acessível no app
- ✅ Marketing/Sobre o App acessível no app

### 4. Analytics e Rastreamento

#### Firebase Analytics
- ✅ **Confirmado**: Firebase Analytics NÃO está ativo em React Native
- ✅ Código em `src/firebase.js` mostra que analytics só inicializa em ambiente web (`typeof window !== 'undefined'`)
- ✅ Em React Native, `analytics` permanece `null`

**Declaração para App Privacy Report**:
- Analytics: **NÃO** (não há analytics ativo)
- Rastreamento: **NÃO** (não há rastreamento de terceiros)

### 5. App Privacy Report - Configuração

#### Tipos de Dados Coletados

**Identificadores:**
- User ID: **SIM** - Vinculado ao usuário
- Device ID: **NÃO** (não coletado)

**Informações de Contato:**
- Nome (displayName): **SIM** - Vinculado ao usuário
- Email: **SIM** - Vinculado ao usuário

**Conteúdo do Usuário:**
- Fotos ou vídeos (foto de perfil): **SIM** - Vinculado ao usuário
- Outro conteúdo do usuário (grupos, quizzes, votos): **SIM** - Vinculado ao usuário

**Dados de Uso:**
- Interações com o produto: **SIM** - Vinculado ao usuário
- Outros dados de uso (estatísticas): **SIM** - Vinculado ao usuário

#### Finalidades

- **Funcionalidade do app**: **SIM** (todos os dados coletados são usados para funcionalidade do app)
- **Analytics**: **NÃO**
- **Publicidade**: **NÃO**
- **Rastreamento**: **NÃO**

#### Vinculação e Rastreamento

- Dados vinculados ao usuário: **SIM**
- Dados usados para rastreamento: **NÃO**

### 6. Build e Submissão

#### Preparação do Build
- ✅ `app-store-icon-1024.png` existe em `assets/`
- ✅ Dependências instaladas
- ✅ Sem erros de lint

#### Comandos para Build

```bash
# 1. Criar build de produção
eas build --platform ios --profile production

# 2. Aguardar conclusão (pode levar 15-30 minutos)

# 3. Submeter para App Store Connect
eas submit --platform ios
```

#### Verificações Pós-Build
- [ ] Build concluído com sucesso
- [ ] Build processado no App Store Connect (pode levar 1-2 horas)
- [ ] Build selecionado na versão do app no App Store Connect

### 7. App Store Connect - Configuração Manual

#### Informações Básicas
- [ ] Descrição do app preenchida (até 4000 caracteres)
- [ ] Palavras-chave preenchidas (até 100 caracteres)
- [ ] Categoria primária selecionada
- [ ] Categoria secundária selecionada (opcional)
- [ ] Informações de contato: `victor.almeida.jeremias@gmail.com`
- [ ] Preço: Gratuito

#### App Privacy Report
- [ ] Acessar App Privacy na seção do app
- [ ] Declarar tipos de dados coletados (conforme seção 5 acima)
- [ ] Declarar finalidades (apenas "Funcionalidade do app")
- [ ] Declarar que dados são vinculados ao usuário: **SIM**
- [ ] Declarar que dados são usados para rastreamento: **NÃO**

#### Screenshots e Assets
- [ ] Screenshots para iPhone 6.7" (iPhone 14 Pro Max, etc.)
- [ ] Screenshots para iPhone 6.5" (iPhone 11 Pro Max, etc.)
- [ ] Screenshots para iPhone 5.5" (iPhone 8 Plus, etc.)
- [ ] App Icon (1024x1024px) configurado
- [ ] Classificação etária configurada

#### Informações para Revisão
- [ ] Contas de teste fornecidas (se necessário)
- [ ] Instruções de demonstração fornecidas
- [ ] URLs de suporte, marketing e privacidade configuradas

**Modelo de Informações para Revisão:**

```
=== CONTAS DE TESTE ===

Para testar o app, você pode criar uma conta usando qualquer um dos métodos de login disponíveis:
- Email/Senha
- Google Sign-In
- Apple Sign-In

OU use esta conta de teste pré-configurada:
- Email: [seu-email-de-teste@exemplo.com]
- Senha: [senha-de-teste]

=== INSTRUÇÕES DE DEMONSTRAÇÃO ===

1. LOGIN:
   - Abra o app e escolha um método de login (Email, Google ou Apple)
   - Se criar nova conta, preencha nome, email e senha

2. FUNCIONALIDADES PRINCIPAIS:
   - Criar Grupo: Aba "Grupos" > "Criar grupo" > Preencha informações
   - Criar Quiz: Aba "Quiz" > "Criar grupo de quiz" > Selecione grupo > Crie perguntas
   - Votar: Acesse um quiz ativo e selecione uma resposta
   - Rankings: Visualize rankings em qualquer grupo

3. FUNCIONALIDADES DE PRIVACIDADE:
   - Exportar Dados: Configurações > Exportar Dados (gera JSON com todos os dados)
   - Excluir Conta: Configurações > Excluir conta (requer senha para confirmar)

=== INFORMAÇÕES TÉCNICAS ===

- Requisitos: iOS 13.0+
- Backend: Firebase (requer conexão com internet)
- Permissões: Câmera e Fotos (apenas para foto de perfil, opcional)

=== RECURSOS ===

- Política de Privacidade: https://victoralmeidaj16.github.io/Lurdinha-App/privacy-policy.html
- Termos de Serviço: https://victoralmeidaj16.github.io/Lurdinha-App/terms-of-service.html
- Suporte: https://victoralmeidaj16.github.io/Lurdinha-App/support.html
- Email: victor.almeida.jeremias@gmail.com

=== OBSERVAÇÕES ===

- App gratuito, sem compras in-app
- Sem publicidade
- Todos os dados podem ser exportados pelo usuário
- Exclusão de conta remove permanentemente todos os dados
```

### 8. Verificações Finais de Código

#### Console Logs
- ⚠️ Encontrados 37 console.log/warn/error em 17 arquivos
- **Recomendação**: Manter apenas logs de erro críticos, remover logs de debug

#### Qualidade do Código
- ✅ Sem erros de lint
- ✅ Todas as telas implementadas
- ✅ Navegação funcionando

### 9. Testes Finais Recomendados

Antes de submeter, teste:

- [ ] Login com Email/Senha
- [ ] Login com Google (em build customizado)
- [ ] Login com Apple (iOS)
- [ ] Criação de grupos
- [ ] Criação de quizzes
- [ ] Votação em quizzes
- [ ] Visualização de rankings
- [ ] Exclusão de conta (com reautenticação)
- [ ] Exportação de dados
- [ ] Acesso a todas as URLs (suporte, marketing, privacidade, termos)
- [ ] Todas as telas de configurações

## 📋 Resumo de Ações Necessárias

### Antes do Build
1. ✅ Verificar configurações técnicas (app.json, eas.json)
2. ✅ Verificar URLs no código
3. ✅ Verificar funcionalidades obrigatórias
4. ⚠️ Considerar remover console.logs desnecessários (opcional)

### No App Store Connect
1. [ ] Preencher informações básicas (descrição, palavras-chave, categorias)
2. [ ] Configurar App Privacy Report (conforme seção 5)
3. [ ] Adicionar screenshots
4. [ ] Configurar classificação etária
5. [ ] Adicionar informações para revisão
6. [ ] Configurar URLs (suporte, marketing, privacidade)

### Após Build
1. [ ] Criar build: `eas build --platform ios --profile production`
2. [ ] Aguardar processamento
3. [ ] Submeter: `eas submit --platform ios`
4. [ ] Selecionar build na versão do app
5. [ ] Preencher "O que há de novo nesta versão"
6. [ ] Submeter para revisão

## 🆘 Troubleshooting

### Build falha
- Verificar se todas as dependências estão instaladas
- Verificar se o Bundle ID está correto
- Verificar se as credenciais do EAS estão configuradas

### URLs não carregam
- Verificar se o GitHub Pages está ativado
- Verificar se os arquivos estão na pasta `docs/`
- Verificar se a branch está correta

### App Privacy Report rejeitado
- Verificar se todos os tipos de dados estão declarados
- Verificar se as finalidades estão corretas
- Verificar se rastreamento está marcado como NÃO

## 📞 Contato

Para dúvidas sobre este checklist:
- Email: victor.almeida.jeremias@gmail.com

---

**Última atualização**: 2024
**Versão do App**: 1.0.0
**Bundle ID**: com.lurdinha.app

