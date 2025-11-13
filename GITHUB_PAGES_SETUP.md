# Configuração do GitHub Pages

Este guia explica como configurar as páginas legais (Política de Privacidade e Termos de Serviço) no GitHub Pages.

## 📋 Pré-requisitos

- Conta no GitHub
- Repositório do projeto no GitHub
- Git configurado no seu computador

## 🚀 Passo a Passo

### 1. Fazer commit e push dos arquivos

```bash
# Adicionar os arquivos da pasta docs
git add docs/

# Fazer commit
git commit -m "Adiciona documentos legais para GitHub Pages"

# Fazer push para o GitHub
git push origin main
```

### 2. Configurar GitHub Pages

1. Acesse seu repositório no GitHub
2. Vá em **Settings** (Configurações)
3. Role até a seção **Pages** no menu lateral esquerdo
4. Em **Source**, selecione:
   - Branch: `main` (ou `master`)
   - Folder: `/docs`
5. Clique em **Save**

### 3. Aguardar publicação

- O GitHub Pages geralmente leva alguns minutos para publicar
- Você receberá uma notificação quando estiver pronto
- A URL será algo como: `https://[seu-usuario].github.io/[nome-do-repo]/`

### 4. Identificar a URL base

A URL base do seu GitHub Pages será:
```
https://[seu-usuario].github.io/[nome-do-repo]/
```

**Exemplos:**
- Se seu usuário é `victoralmeidaj16` e o repositório é `lurdinha-app`:
  - URL base: `https://victoralmeidaj16.github.io/lurdinha-app/`
  - Política de Privacidade: `https://victoralmeidaj16.github.io/lurdinha-app/privacy-policy.html`
  - Termos de Serviço: `https://victoralmeidaj16.github.io/lurdinha-app/terms-of-service.html`

### 5. Atualizar URLs no app

Depois de identificar a URL do GitHub Pages, atualize os arquivos do app:

#### `src/screens/PrivacyPolicyScreen.jsx`

Localize a linha:
```javascript
const PRIVACY_POLICY_URL = 'https://YOUR_GITHUB_PAGES_URL/privacy-policy.html';
```

E substitua por:
```javascript
const PRIVACY_POLICY_URL = 'https://[seu-usuario].github.io/[nome-do-repo]/privacy-policy.html';
```

#### `src/screens/TermsOfServiceScreen.jsx`

Localize a linha:
```javascript
const TERMS_OF_SERVICE_URL = 'https://YOUR_GITHUB_PAGES_URL/terms-of-service.html';
```

E substitua por:
```javascript
const TERMS_OF_SERVICE_URL = 'https://[seu-usuario].github.io/[nome-do-repo]/terms-of-service.html';
```

### 6. Testar no app

1. Execute o app
2. Vá em **Configurações** > **Política de Privacidade**
3. Verifique se a página carrega corretamente
4. Teste também **Termos de Uso**

## 🔍 Verificar se está funcionando

1. Abra um navegador
2. Acesse a URL diretamente: `https://[seu-usuario].github.io/[nome-do-repo]/privacy-policy.html`
3. Se a página carregar corretamente, está tudo funcionando!

## 📝 Notas Importantes

- **HTTPS obrigatório**: O GitHub Pages sempre usa HTTPS, que é seguro para o App Store
- **Atualizações**: Quando você atualizar os arquivos HTML e fizer push, as mudanças serão refletidas automaticamente
- **Custom Domain**: Você pode configurar um domínio personalizado nas configurações do GitHub Pages, se desejar

## 🆘 Problemas Comuns

### Página não carrega no app

- Verifique se a URL está correta (sem barra no final para arquivos específicos)
- Verifique se o GitHub Pages está ativado e publicado
- Verifique a conexão com a internet
- Veja os logs do app para erros do WebView

### Página mostra "404 Not Found"

- Certifique-se de que os arquivos estão na pasta `docs/`
- Verifique se fez push dos arquivos para o GitHub
- Aguarde alguns minutos após configurar o GitHub Pages

### GitHub Pages não está habilitado

- Certifique-se de que a branch `main` existe
- Verifique se a pasta `docs/` contém os arquivos HTML
- Alguns repositórios privados podem ter limitações (verifique seu plano do GitHub)

## 📞 Suporte

Se tiver problemas, entre em contato:
- E-mail: victor.almeida.jeremias@gmail.com
- Telefone: +55 (48) 99614-7527




