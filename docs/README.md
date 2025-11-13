# GitHub Pages - Documentos Legais

Este diretório contém as páginas HTML dos documentos legais do aplicativo Lurdinha que serão hospedadas no GitHub Pages.

## Arquivos

- `index.html` - Página inicial com links para os documentos
- `privacy-policy.html` - Política de Privacidade completa
- `terms-of-service.html` - Termos de Serviço completos
- `.nojekyll` - Arquivo necessário para garantir que o GitHub Pages não use Jekyll

## Como configurar no GitHub Pages

1. **Faça push dos arquivos para o repositório GitHub:**
   ```bash
   git add docs/
   git commit -m "Adiciona documentos legais para GitHub Pages"
   git push
   ```

2. **Configure o GitHub Pages:**
   - Acesse as configurações do repositório no GitHub
   - Vá para "Pages" na seção "Settings"
   - Em "Source", selecione "Deploy from a branch"
   - Escolha a branch "main" (ou "master")
   - Escolha a pasta `/docs`
   - Clique em "Save"

3. **Aguarde a publicação:**
   - O GitHub Pages geralmente demora alguns minutos para publicar
   - A URL será algo como: `https://[seu-usuario].github.io/[nome-do-repo]/`

4. **URLs dos documentos:**
   - Política de Privacidade: `https://[seu-usuario].github.io/[nome-do-repo]/privacy-policy.html`
   - Termos de Serviço: `https://[seu-usuario].github.io/[nome-do-repo]/terms-of-service.html`
   - Página inicial: `https://[seu-usuario].github.io/[nome-do-repo]/`

## Atualizar URLs no app

Após configurar o GitHub Pages, atualize as URLs nas seguintes telas:
- `src/screens/PrivacyPolicyScreen.jsx`
- `src/screens/TermsOfServiceScreen.jsx`

Substitua `YOUR_GITHUB_PAGES_URL` pela URL real do seu GitHub Pages.

## Contato

Para qualquer dúvida sobre os documentos legais, entre em contato:
- E-mail: victor.almeida.jeremias@gmail.com
- Telefone: +55 (48) 99614-7527




