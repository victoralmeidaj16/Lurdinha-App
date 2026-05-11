👵🏻

# **Lurdinha Brand & Design System**

Documento de referência para designers, engenheiros e criadores de conteúdo.

Este sistema foi reconstruído a partir do app, assets, telas, tema e materiais de marketing existentes.

## **1. Fundamentos da Marca**

Lurdinha é um **hub mobile de jogos sociais para jogar em grupo no celular**.

A experiência combina duas camadas principais:

* **Quiz assíncrono em grupos**: palpites sociais, ranking, histórico e competição contínua.
* **Salas ao vivo**: partidas rápidas em tempo real com múltiplos modos sociais.

Os grupos são a base persistente do app. É neles que ficam os membros, quizzes, rankings, histórico e vínculos sociais. As salas são o espaço de jogo ao vivo, onde o grupo entra junto, alterna modos e compete em rodadas rápidas.

Essência: transformar convivência em jogo, provocar comparação social leve e fazer o grupo competir para descobrir quem lê melhor as pessoas, os padrões e as escolhas da própria turma.

### **Arquitetura do Produto**

O Lurdinha funciona em três camadas:

* **Grupos**: espaços sociais contínuos com quiz, ranking, histórico e membros.
* **Salas**: partidas ao vivo criadas para jogar com o grupo em tempo real.
* **Rodadas**: sequência de jogos dentro de uma sala, com resultado e pontuação.

Exemplo de fluxo:

Grupo criado → sala iniciada → rodada de Lurdinha → rodada de Desenho → resultado da sala → pontuação salva no histórico.

### **Quiz Assíncrono em Grupos**

O Quiz é a camada assíncrona do Lurdinha. Ele mantém o grupo ativo ao longo do tempo, mesmo quando ninguém está em uma sala ao vivo.

Você cria ou entra em grupos com amigos e participa de grupos de quiz: conjuntos de perguntas com alternativas sobre pessoas do círculo social do grupo e situações reais. Cada pessoa vota, os resultados aparecem para o grupo e o app transforma isso em competição contínua com acertos, pontos, ranking, histórico e streak.

O foco não é trivia ou conhecimento factual. O valor está em escolher um palpite, comparar percepções e disputar posição no ranking.

Exemplos:

* “Que camisa o chefe vai usar amanhã?”
* “O que o tio vai falar quando chegar?”
* “Quem a tia vai cumprimentar primeiro?”

O grupo vota → a situação acontece → a resposta correta é registrada → o ranking é atualizado.

### **Tipos de Quiz**

* **Tipo 1 — Palpite Aberto**: a resposta correta ainda não existe no momento da criação. O grupo escolhe o que acha que vai acontecer e, depois do evento real, alguém registra qual alternativa se confirmou.
* **Tipo 2 — Resultado Definido**: a resposta correta já existe, mas os jogadores ainda não sabem qual é. O grupo tenta descobrir a alternativa certa.

### **Modos do Quiz**

* **Normal**: o grupo vê sinais sociais do voto, favorecendo transparência e provocação.
* **Ghost**: cada pessoa responde sem ver o que os outros já votaram, evitando influência social durante a resposta.
* **Surpresa**: todos respondem normalmente, mas o resultado fica oculto até o prazo terminar.
* **Desafios**: o grupo se divide em times para duelar dentro do quiz.

### **Jogos Sociais ao Vivo**

As salas ao vivo são o núcleo social em tempo real do Lurdinha. Elas concentram jogos rápidos para o grupo responder, votar, desenhar, adivinhar, blefar e competir junto.

Modos disponíveis:

* **Sessão Completa**: playlist automática de minigames sociais. Mistura Lurdinha, Desenho, Quem é mais provável? e Na Minha Cabeça Era Óbvio em sequência.
* **Lurdinha**: cada rodada tem uma pergunta e vence quem responde como a maioria do grupo.
* **Quem é mais provável?**: o grupo vota em quem mais combina com a pergunta e revela a percepção coletiva.
* **Na Minha Cabeça Era Óbvio**: uma pessoa responde em segredo e o resto tenta pensar igual ao alvo da rodada.
* **Desenho**: um jogador desenha ao vivo enquanto os outros tentam adivinhar a palavra.
* **Telefone Sem Fio**: uma frase vira desenho, depois interpretação, depois desenho de novo, até a revelação final da cadeia.
* **Impostor**: jogo local no mesmo aparelho, com papéis secretos, blefe, debate e dedução.
* **Quiz**: previsão social assíncrona dentro dos grupos, com ranking contínuo.

### **Impostor**

Impostor é o modo offline/local do hub. As pessoas jogam no mesmo aparelho, presencialmente. Cada jogador vê sua carta secreta sem deixar os outros espiarem: quase todos recebem a mesma palavra, enquanto o impostor precisa blefar sem saber exatamente o tema.

* **Loop**: entrar no lobby → iniciar partida → cada pessoa vê sua carta → discussão e dedução → revelação do impostor.
* **Clima**: blefe, tensão curta, suspeita, revelação e risada.

## **2. Fundamentos da Marca Lurdinha**

### **Missão**

Transformar convivência em jogo social: ajudar grupos a jogar, votar, desenhar, adivinhar, blefar, comparar palpites e competir de forma divertida, leve e compartilhável.

### **Posicionamento**

Lurdinha é um party game social mobile com hub de jogos, salas ao vivo e quiz contínuo em grupo.

Não é uma plataforma de conhecimento factual.

Não é apenas um quiz ou trivia.

É uma plataforma de jogos sociais onde grupos respondem, desenham, votam, adivinham, blefam e competem ao longo do tempo.

O diferencial está em transformar situações sociais em jogo: o grupo tenta antecipar comportamentos, perceber consensos, identificar quem combina com cada pergunta, ler a cabeça dos amigos e comparar palpites em rankings.

### **Tipos de Jogo**

* **Sessão Completa** — playlist automática de minigames sociais.
* **Lurdinha** — pensar como a maioria.
* **Quem é mais provável?** — votar em quem mais combina com a pergunta.
* **Na Minha Cabeça Era Óbvio** — adivinhar a resposta secreta de alguém.
* **Desenho** — desenhar e adivinhar ao vivo.
* **Telefone Sem Fio** — transformar frase, desenho e interpretação em cadeia.
* **Impostor** — descobrir quem está blefando no mesmo aparelho.
* **Quiz** — previsão social assíncrona dentro dos grupos.

### **Personalidade**

* Divertida  
* Sagaz  
* Levemente provocadora  
* Afetiva  
* Social  
* Competitiva sem agressividade  
* Popular, acessível e brasileira

### **Arquétipo**

Arquétipo principal: **Bobo da Corte (Jester)**

Arquétipo secundário: **Sábio (Sage)**

O lado Jester aparece na brincadeira, no ranking, nos modos de jogo e no humor.

O lado Sage aparece na figura da “Lurdinha” como alguém que observa, entende pessoas e “já sabia”.

### **Tom emocional**

* Curiosidade social  
* Diversão em grupo  
* Intimidade  
* Surpresa  
* Tensão leve de competição  
* Sensação de pertencimento

### **Público-alvo**

* Famílias  
* Grupos de amigos  
* Casais e círculos próximos  
* Equipes de trabalho em contexto casual  
* Usuários mobile que gostam de jogos sociais, rankings e interação em tempo real

### **Como a identidade visual sustenta isso**

* O fundo escuro cria clima de jogo, foco e intensidade.  
* O violeta posiciona a marca como moderna, lúdica e noturna.  
* O laranja aquece a experiência e evita que a marca fique fria ou excessivamente “tech”.  
* A mascote humaniza a marca e cria reconhecimento imediato.  
* Cards arredondados, glow, blur e badges reforçam uma experiência de entretenimento, não de utilitário.

---

## **3. Identidade Visual**

### **3.1 Sistema de Cores**

### **Cores primárias**

* Primary / Violet 500 \#8B5CF6  
* Primary Light \#A78BFA  
* Primary Dark \#7C3AED  
* Primary Muted \#9061F9

### **Cores secundárias**

* Orange Accent \#FF6B35  
* Pink Accent \#E91E63  
* Info Blue \#2196F3  
* Success Green \#4CAF50  
* Warning Yellow \#FFC107  
* Error Red \#F44336

### **Fundos e superfícies**

* Background \#000000  
* Surface \#111111  
* Surface Elevated \#1A1A2E  
* Card Dark \#17171B  
* Background Alt \#0E0E10

### **Hierarquia de texto**

* Text Primary \#FFFFFF  
* Text Secondary \#D1D5DB  
* Text Muted \#9CA3AF  
* Text Dim \#71717A

### **Transparências utilitárias**

* Primary Alpha 08 rgba(139, 92, 246, 0.08)  
* Primary Alpha 12 rgba(139, 92, 246, 0.12)  
* Primary Alpha 20 rgba(139, 92, 246, 0.20)  
* White Alpha 10 rgba(255,255,255,0.10)  
* White Alpha 20 rgba(255,255,255,0.20)

### **Cores legadas a normalizar**

* Legacy Purple \#8A4F9E  
* Legacy Orange \#FF7A59

Regra: novos layouts devem usar \#8B5CF6 como violeta principal e manter \#8A4F9E apenas em peças legadas ou transição.

---

## **4. Tipografia**

### **Diretriz de família tipográfica**

* Headings: **Poppins**  
* Corpo e UI: **Inter**  
* Fallback técnico: fonte do sistema quando necessário no app

### **Pesos**

* Regular 400  
* Medium 500  
* Semibold 600  
* Bold 700  
* ExtraBold 800

### **Escala tipográfica**

* XS 10px  
* SM 12px  
* MD 14px  
* LG 16px  
* XL 18px  
* XXL 20px  
* Title 24px  
* Hero 28px  
* Display 32px

### **Uso recomendado**

* Display/Hero: headlines principais, ranking hero, título de modos especiais  
* Title: títulos de tela e cards prioritários  
* XL/LG: CTAs, subtítulos, labels de seção  
* MD/SM: corpo, apoio, status, metadados  
* XS: timestamps, microcopy técnica, indicadores auxiliares

### **Regras de hierarquia**

* Headline sempre forte e curta  
* Texto de apoio sempre claro, com contraste menor  
* Microcopy deve ser funcional e rápida  
* Evitar blocos longos; a marca fala em frases curtas e orientadas à ação

---

## **5. Iconografia**

### **Estilo**

* Outline icons  
* Geometria limpa  
* Cantos suaves  
* Visual contemporâneo e neutro

### **Biblioteca-base**

* Lucide React Native

### **Espessura**

* Stroke padrão: **2px**  
* Tamanhos recorrentes: 14, 16, 18, 20, 24

### **Princípios**

* Ícones devem apoiar a ação, não decorar excessivamente  
* Usar violeta para estados ativos e destaque  
* Usar cinza claro para estados neutros  
* Usar cores semânticas apenas para feedback claro  
* Emojis são parte do sistema em contextos sociais, badges e modos de jogo

---

## **6. Ilustração, Imagem e Linguagem Visual**

### **Estilo principal**

* Mascote central com estética AI portrait  
* Enquadramento circular  
* Halo violeta  
* Expressão amigável, observadora e memorável

### **Papel da mascote**

A Lurdinha não é só um logo. Ela é a personificação da marca: alguém que conhece gente, percebe padrões e valida o jogo social.

### **Estilo de imagem permitido**

* Retratos com calor humano  
* Avatares e fotos de perfil  
* Emojis como linguagem social  
* Cenas de grupo espontâneas  
* Ilustrações com glow, círculo, aura ou destaque radial

### **Estilo a evitar**

* Banco de imagens corporativo frio  
* 3D genérico futurista  
* Estética enterprise  
* Colagens excessivamente tecnológicas  
* Visual sci-fi abstrato sem conexão humana

### **Metáforas visuais recomendadas**

* Grupo  
* Voto  
* Descoberta  
* Palpite  
* Ranking  
* Coroa  
* Badge  
* Tempo restante  
* Revelação

---

## **7. Princípios de UX/UI**

### **Filosofia**

A interface deve sempre aproximar o usuário da próxima ação social relevante.

### **Regras de produto**

* Priorizar quizzes ativos, grupos e ranking  
* Exibir status em tempo real sempre que possível  
* Reduzir fricção entre entrar, responder e compartilhar  
* Reforçar feedback com badges, tempo, streak e posição  
* Manter a experiência escaneável e mobile-first

### **Padrões visuais recorrentes**

* Cards escuros com borda sutil  
* Cantos arredondados de 12 a 24  
* CTA primário em violeta sólido ou gradiente violeta  
* CTA secundário com contorno ou superfície translúcida  
* Bottom nav com blur/glass  
* Destaques com glow ou alpha do violeta  
* Uso de avatares e badges para humanizar dados

### **Motion**

* Entradas suaves  
* Fade \+ slide \+ spring leve  
* Microinterações curtas  
* Movimento deve reforçar hierarquia, não chamar mais atenção que o conteúdo

---

## **8. Branding Guidelines**

### **8.1 Visuais de marketing**

* Usar fundo escuro ou gradiente dark com profundidade  
* Violeta deve ser a cor dominante de marca  
* Laranja entra como contraste emocional e destaque pontual  
* Sempre privilegiar narrativa social: amigos, família, grupo, disputa, ranking  
* A mascote pode aparecer como selo, hero visual ou assinatura

### **8.2 Screenshots do app**

* Mostrar telas com densidade social: ranking, quiz ativo, grupo, resultados  
* Preferir screenshots com badges, avatares e tempo restante visíveis  
* Evitar telas vazias como material principal  
* Manter consistência de idioma e nomenclatura  
* Dar preferência a composições com 1 tela hero ou 2 a 3 telas em sequência de jornada

### **8.3 Criativos para redes sociais**

* Headline curta e provocativa  
* Uma ideia por peça  
* Misturar pergunta \+ consequência social  
* Exemplos de estrutura:  
* Sempre incluir contraste forte e CTA simples

### **8.4 Landing pages**

* Hero com promessa clara  
* Benefícios em cards  
* Explicação do fluxo em passos  
* Prova visual com ranking, grupos, modos e tempo real  
* CTA acima da dobra e repetido no fechamento

---

## **9. Regras de Consistência**

### **Background usage**

* Fundo principal sempre escuro  
* Não usar fundo branco como base principal da marca  
* Gradientes devem ficar entre preto, grafite e violeta profundo

### **Accent color usage**

* Violeta \= ação, foco, navegação ativa, destaque  
* Laranja \= calor, urgência leve, badges especiais, troféus  
* Verde \= sucesso, streak, confirmação  
* Vermelho \= erro e revelações críticas

### **Hierarquia tipográfica**

* 1 headline forte  
* 1 bloco de apoio  
* 1 CTA principal  
* Não competir com múltiplos títulos grandes na mesma dobra

### **Storytelling visual**

* A marca deve sempre parecer social antes de parecer técnica  
* Mostrar pessoas, grupos, escolhas e consequências  
* O valor está na leitura humana do grupo, não na complexidade da tecnologia

---

## **10. Sistema Canônico para o Futuro**

### **O que preservar**

* Mascote como ativo central  
* Dark mode como assinatura  
* Violeta como cor-mãe  
* Competição leve e afetuosa  
* Mistura de UI moderna com calor humano

### **O que padronizar**

* Consolidar o violeta principal em \#8B5CF6  
* Consolidar o laranja principal em \#FF6B35  
* Aplicar Poppins \+ Inter de forma consistente  
* Reduzir variações paralelas de cards e tokens  
* Formalizar componentes-base: card, badge, button, nav, ranking row, poll card

# **Metáforas Visuais Oficiais**

## **Metáforas Visuais da Marca**

* votos convergindo  
* avatares em grupo  
* coroas  
* badges  
* revelação de resposta  
* contagem regressiva  
* ranking

Isso ajuda designers e IA.

---

## **Resumo da Marca**

**Lurdinha** é uma marca de hub mobile de jogos sociais baseada em percepção humana, convivência e competição leve em grupo.

Seu sistema visual combina **mistério leve, humor, competitividade e afeto**, com uma estética **dark, violeta, arredondada e centrada em grupo**.

O produto é:

curiosidade  
\+  
palpite  
\+  
voto  
\+  
jogo ao vivo  
\+  
evento real  
\+  
revelação

Esse é o motor.

\</aside\>

## **prompts de gerações de imagens da marca a ser considerado o modelo, design, branding, estilo de prompts:**

Create a high-impact Instagram promotional image for the social mobile game app "Lurdinha".

FORMAT  
Vertical 4:5 composition  
Designed for Instagram feed  
Mobile-first layout.

VISUAL STRUCTURE

The composition is split into two main areas.

TOP AREA

Four young friends using their smartphones and smiling while interacting.

They appear in angled panels separated by glowing violet lines.

Each person looks engaged, reacting to something funny happening on their phone.

This represents friends participating in a social guessing game.

Above or near each person appears a floating UI label representing game actions:

VOTE  
GUESS  
COMPARE  
REVEAL

These labels appear in rounded UI pills with violet glow.

BACKGROUND

Dark gradient background transitioning between:

\#000000  
\#0E0E10

With a strong violet glow atmosphere using the brand color:

\#8B5CF6

Subtle neon streaks of violet light moving through the background.

LEFT SIDE TEXT BLOCK

Large bold headline area.

Example text:

"VOCÊ CONHECE  
MESMO  
SUA GALERA?"

Below the headline, smaller supporting text:

"Vote, compare e descubra  
quem entende o grupo."

Typography style:

bold rounded sans-serif  
clean modern mobile readability.

RIGHT SIDE HERO ELEMENT

A large smartphone mockup displaying the Lurdinha app interface.

The screen shows a social question card.

Example:

Pergunta:  
"Quem do grupo demora mais para responder?"

Below it appear vote results with avatars:

Ana → Pedro  
Lucas → Pedro  
Carol → Pedro  
Pedro → Lucas

A crown icon reveals the result.

Pedro 👑

UI STYLE

Dark UI cards (\#17171B)  
Rounded corners (16–20px)  
Soft violet glow borders.

BRAND ELEMENT

Include the Lurdinha mascot in a circular portrait with a violet halo somewhere near the phone UI.

She has a playful, knowing expression.

COLORS

Primary violet  
\#8B5CF6

Accent orange  
\#FF6B35

Supporting accents  
\#FFC107  
\#E91E63

Text  
\#FFFFFF

MOOD

social  
playful  
competitive but friendly  
youthful.

QUALITY

ultra detailed  
8k render  
sharp focus  
modern mobile app advertising style.

NEGATIVE PROMPT

no corporate stock photos  
no white backgrounds  
no futuristic sci-fi tech  
no crypto elements  
no financial UI

Create a cinematic 3D promotional image for the social mobile game app "Lurdinha".

FORMAT  
Vertical 4:5  
Instagram feed composition  
Mobile-first design

VISUAL STYLE

Premium stylized 3D character render  
Soft rounded shapes  
Modern Apple-style illustration  
Dark atmospheric lighting  
Strong screen light illuminating the face

Inspired by cinematic tech advertising and modern mobile app marketing visuals.

SCENE

A young person holding a smartphone at night.

The camera angle is slightly low and centered, similar to a portrait taken from the front while the person looks at the phone.

The smartphone screen is just below the face, illuminating the character with soft violet and blue light.

The character has a \*\*happy and amused expression\*\*, smiling as if something funny just happened in the group chat game.

BACKGROUND

Very dark gradient background

\#000000 → \#0E0E10

Subtle violet glow atmosphere using the Lurdinha brand color:

\#8B5CF6

Soft light particles floating in the background.

CHARACTER

Stylized modern 3D character.

Friendly expression.  
Eyes reflecting the phone screen light.

The glow from the phone slightly lights the face and glasses.

EMOTION

The person just saw a funny result in the game and looks entertained.

FLOATING GAME ELEMENTS

Around the character and phone float several glowing 3D elements from the Lurdinha game system:

• avatar circles  
• voting arrows  
• quiz cards  
• crown icon 👑  
• ranking badge  
• small reaction emojis

These elements float around the character like holographic UI pieces emerging from the phone.

Some elements glow with violet edges.

MASCOT

Include the Lurdinha mascot inside a circular badge with violet halo floating near the phone UI.

COPY (VISIBLE TEXT IN DESIGN)

Headline:

"NO QUE VOCÊ  
ACHA QUE  
VAI DAR?"

Subtext:

"Vote, compare e descubra  
quem prevê melhor."

COLORS

Primary violet  
\#8B5CF6

Accent orange  
\#FF6B35

Dark UI cards  
\#17171B

Text  
\#FFFFFF

MOOD

social    
playful    
night-time mobile interaction    
friends predicting outcomes    
light competitive fun

QUALITY

ultra detailed  
8k render  
cinematic lighting  
soft shadows  
modern mobile advertising aesthetic

NEGATIVE PROMPT

no corporate stock photos  
no bright white backgrounds  
no crypto symbols  
no futuristic sci-fi tech  
no finance UI

Create a high-impact Instagram promotional image for the social mobile game app \*\*"Lurdinha"\*\*.

FORMAT  
Vertical 4:5 composition  
Instagram feed layout  
Mobile-first design

\---

VISUAL STYLE

Modern social-game advertising aesthetic.

Dark background  
Violet glow accents  
Soft cinematic lighting  
Rounded UI elements  
Clean composition

Inspired by premium mobile app campaigns and modern social gaming visuals.

\---

SCENE

A young person sitting casually at night holding a smartphone.

The phone screen is the main light source illuminating the face.

The person has a \*\*curious and amused expression\*\*, reacting to something surprising that just happened in the game.

The lighting from the phone reflects violet tones on the face.

\---

CAMERA

Medium close-up portrait.

The camera is slightly angled from the front, creating depth and intimacy.

The smartphone is visible near the bottom of the frame.

\---

FLOATING SOCIAL ELEMENTS

Above the phone, floating holographic UI elements represent the Lurdinha gameplay:

• avatar circles connected by glowing lines  
• vote icons pointing toward options  
• poll cards  
• crown badge 👑  
• ranking badge  
• timer icon

Some of the vote arrows visually \*\*converge toward one avatar\*\*, symbolizing the group's prediction.

One avatar lights up slightly stronger, representing the \*\*revealed result\*\*.

\---

SMARTPHONE SCREEN

The phone screen shows the Lurdinha interface.

Example question:

"Quem vai chegar primeiro na festa?"

Votes appear:

Ana → João  
Lucas → João  
Carol → Pedro  
Pedro → João

Result revealed:

João 👑

\---

BACKGROUND

Dark gradient background:

\#000000 → \#0E0E10

Subtle violet atmosphere using brand color:

\#8B5CF6

Soft floating particles and light streaks.

\---

COPY (VISIBLE TEXT)

Headline:

"TODO MUNDO  
TEM UM  
PALPITE."

Subtext:

"Compare com o grupo  
e veja quem prevê melhor."

\---

BRAND ELEMENT

Include the \*\*Lurdinha mascot\*\* in a circular portrait with a violet halo floating near the UI elements.

She appears observant and amused.

\---

COLORS

Primary violet  
\#8B5CF6

Accent orange  
\#FF6B35

UI cards  
\#17171B

Text  
\#FFFFFF

\---

MOOD

social  
playful  
curious  
competitive but friendly  
group interaction

\---

QUALITY

ultra detailed  
8k render  
cinematic lighting  
sharp focus  
modern mobile advertising style

\---

NEGATIVE PROMPT

no corporate stock photo look  
no white backgrounds  
no crypto elements  
no finance UI  
no futuristic sci-fi technology

Create a high-conversion \*\*App Store screenshot\*\* for the social mobile game \*\*Lurdinha\*\*. FORMAT 1242 × 2688 resolution (iPhone 6.5" App Store screenshot) Vertical composition \--- VISUAL STYLE Premium mobile game marketing design. Dark background Strong violet glow accents Rounded UI cards Clean, high-contrast layout Focus on clarity and readability Inspired by top-performing social game App Store screenshots. \--- BACKGROUND Dark gradient: \#000000 → \#0E0E10 Soft radial violet glow (\#8B5CF6) centered behind the main phone. Subtle floating particles. \--- MAIN STRUCTURE A \*\*large central iPhone mockup\*\*, slightly tilted for depth. This is the main focus of the image. No clutter. \--- FLOATING UI ELEMENTS Around the phone, minimal but clear elements: • vote arrows pointing to selected option • avatar circles • small reaction emojis • subtle glow lines connecting avatars to choices These elements should be clean and not overpower the UI. \--- BACKGROUND CHARACTERS (IMPORTANT) Behind the phone, slightly blurred, show \*\*two friends reacting while using their phones\*\*. Friend 1 (female) Black cropped top Oversized light denim jacket Hair loose and wavy She is smiling while looking at her phone. \--- Friend 2 (male) Dark hoodie Neutral t-shirt underneath Short hair He is slightly laughing and looking at his screen. \--- Their faces are softly illuminated by \*\*phone light with a violet tint\*\*. They represent the \*\*social nature of the game\*\*. \--- TEXT AREA (TOP) Large bold headline: \*\*"VOTE NO QUE ACHA QUE VAI ACONTECER"\*\* Typography: Poppins Bold White (\#FFFFFF) High contrast \--- SUBTEXT Below headline: \*\*"Escolha seu palpite em segundos."\*\* Font: Inter Medium Color \#D1D5DB \--- BRAND ELEMENT Include the \*\*Lurdinha mascot portrait\*\* in a circular badge with violet halo near the phone. Expression: playful, observant. \--- COLOR SYSTEM Primary violet \#8B5CF6 Accent orange \#FF6B35 UI cards \#17171B Text \#FFFFFF \--- MOOD simple social intuitive playful fast interaction \--- QUALITY ultra detailed 8k render sharp focus premium App Store screenshot aesthetic \--- NEGATIVE PROMPT no white backgrounds no cluttered UI no corporate stock photos no crypto elements no futuristic sci-fi tech no complex interface

Create a high-impact promotional image for the social mobile game app \*\*"Lurdinha"\*\*.

FORMAT  
Vertical 4:5 composition  
Instagram feed  
Mobile-first layout

\---

VISUAL STYLE

Premium 3D \+ UI hybrid composition.

Clean advertising layout  
Strong central object  
Dark immersive background  
Modern mobile app marketing aesthetic

Inspired by high-end educational / product ads but adapted for social gaming.

\---

BACKGROUND

Dark gradient background:

\#000000 → \#0E0E10

Subtle violet glow atmosphere using brand color:

\#8B5CF6

Soft radial light behind the main object.

\---

MAIN HERO ELEMENT

A large \*\*smartphone floating at the center\*\* of the composition.

The phone is slightly angled and elevated.

IMPORTANT:  
The screen displays a \*\*real screenshot of the Lurdinha app UI\*\* (provided by the user).

Soft glow coming from the screen.

\---

AROUND THE PHONE

Floating game elements:

• avatar circles  
• vote arrows pointing to one option  
• crown icon 👑  
• ranking badge  
• timer icon

Some elements are slightly blurred to create depth.

\---

TOP BRAND AREA

Small logo or mascot badge at the top.

\---

MAIN HEADLINE (BIG AND BOLD)

\*\*"NO QUE  
VOCÊ ACHA  
QUE VAI DAR?"\*\*

Typography:

Poppins ExtraBold  
White (\#FFFFFF)

Large, left-aligned.

\---

SECONDARY TEXT (SUPPORT)

"Seu grupo já tem um palpite.  
Agora é sua vez."

\---

FEATURE LINE (replacing institutional info)

Instead of date/info blocks, use gameplay hooks:

• Vote com seus amigos  
• Compare respostas  
• Descubra quem acertou

\---

SOCIAL PROOF / MICRO ELEMENTS

Small UI-style text blocks:

"Resultado em tempo real"  
"Ranking do grupo"  
"Modo surpresa"

\---

CTA (BOTTOM)

\*\*"BAIXE AGORA"\*\*

or

\*\*"JOGAR COM AMIGOS"\*\*

\---

BRAND ELEMENT

Include the Lurdinha mascot in a circular badge with violet glow near the phone.

Expression:

playful and observant.

\---

COLOR SYSTEM

Primary violet  
\#8B5CF6

Accent orange  
\#FF6B35

Dark UI  
\#17171B

Text  
\#FFFFFF

\---

MOOD

social  
curious  
playful  
competitive  
group interaction

\---

QUALITY

ultra detailed  
8k render  
cinematic lighting  
sharp focus  
premium mobile advertising aesthetic

\---

NEGATIVE PROMPT

no corporate layout  
no institutional design  
no academic tone  
no financial symbols  
no empty UI  
no generic stock look

Create an \*\*App Store screenshot\*\* for the social mobile game \*\*Lurdinha\*\*. FORMAT 1242 × 2688 resolution (iPhone 6.5" App Store screenshot) Vertical composition. \--- VISUAL STYLE Premium mobile game App Store marketing visual. Dark background Violet glow accents Rounded UI cards Soft depth shadows Modern social game aesthetic. Inspired by successful social mobile game App Store pages. \--- BACKGROUND Dark gradient background: \#000000 → \#0E0E10 Soft radial violet glow using brand color: \#8B5CF6 Subtle floating particles and light streaks. \--- MAIN ELEMENT A large \*\*iPhone mockup centered in the composition\*\* displaying the Lurdinha ranking screen. The screen shows a \*\*group leaderboard\*\*. \--- SMARTPHONE SCREEN CONTENT Ranking title: "Ranking do Grupo" Leaderboard list: 1️⃣ Lucas 👑 2️⃣ Ana 3️⃣ Pedro 4️⃣ Carol 5️⃣ Rafael The \*\*first position glows slightly with violet and orange highlight\*\*. A crown icon appears above the first player. \--- FLOATING GAME ELEMENTS Around the phone float game symbols representing competition: • crown icon 👑 • ranking badges • avatar circles • score icons • small trophy icons • streak flame 🔥 These elements glow subtly with violet edges. \--- BACKGROUND CHARACTERS Behind the phone, slightly blurred, show \*\*three friends reacting to the ranking\*\*. Friend 1 (female) Oversized purple hoodie Black jeans Long straight hair She is smiling and showing the ranking on her phone. \--- Friend 2 (male) Dark bomber jacket Gray t-shirt Light denim jeans He laughs and points at the screen. \--- Friend 3 (female) Orange knit sweater Loose hair She reacts playfully as if teasing the friend who is losing. Their phone screens cast soft violet-blue light on their faces. \--- TEXT AREA (TOP) Large bold headline: \*\*"QUEM ACERTA MAIS NO GRUPO?"\*\* Typography: Poppins Bold White text (\#FFFFFF) \--- SUBTEXT Below headline: \*\*"Suba no ranking e prove quem prevê melhor."\*\* Font: Inter Medium Color \#D1D5DB \--- BRAND ELEMENT Include the \*\*Lurdinha mascot portrait\*\* inside a circular badge with violet halo near the phone. Expression: playful, slightly knowing. \--- COLOR SYSTEM Primary violet \#8B5CF6 Accent orange \#FF6B35 UI cards \#17171B Text \#FFFFFF \--- MOOD social competitive but friendly playful group interaction celebration and teasing between friends. \--- QUALITY ultra detailed 8k render sharp focus premium App Store screenshot style. \--- NEGATIVE PROMPT no corporate stock photos no white backgrounds no finance UI no crypto elements no futuristic sci-fi tech

\*\*Here is high-performance social media prompts designed for the "Lurdinha" app.\*\*

The Social Circle (Social Proof)  
\*\*Concept:\*\* Visualizing the collective energy of the group voting moment.

1\.  \*\*Style:\*\* High-end candid lifestyle photography with integrated 3D UI elements.  
2\.  \*\*Scene:\*\* Top-down bird's-eye view of a dark, textured wooden table in a dimly lit, trendy bar. Four to five friends are seated around it, drinks and casual appetizers scattered naturally.  
3\.  \*\*Composition:\*\* Centralized focus on the circle of hands holding smartphones. The phones act as the light source.  
4\.  \*\*Lighting:\*\* Moody ambient bar lighting (warm/dim) contrasted by the cool, vibrant Violet (\#8B5CF6) glow emanating from the phone screens onto the users' hands.  
5\.  \*\*Color Palette:\*\* Deep blacks, warm wood tones, electric Violet (\#8B5CF6) highlights, and pops of Orange (\#FF6B35) in the UI elements.  
6\.  \*\*Camera:\*\* 35mm lens, high angle (flat lay), sharp focus on the screens and hands.  
7\.  \*\*Mood:\*\* Anticipation, connection, modern social gaming.  
8\.  \*\*Visual Elements:\*\*  
    \*   \*\*UI:\*\* Screens clearly show the "Lurdinha" voting interface with dark cards.  
    \*   \*\*AR Overlay:\*\* A subtle, glowing network of violet lines connecting the phones to a central point above the table.  
    \*   \*\*Mascot:\*\* The 3D "Lurdinha" character (older woman) appears in a circular badge with a violet halo in the top right corner, looking approvingly.  
    \*   \*\*Mechanics:\*\* Floating "Vote" arrows pointing from phones toward the center.  
9\.  \*\*Headline:\*\* "O GRUPO VOTA. O TEMPO REVELA."  
10\. \*\*Subtext:\*\* "Descubra o que seus amigos realmente pensam."

Style:  
High-end mobile app advertising, cinematic social gaming aesthetic, dark UI with strong violet glow, premium product marketing composition, ultra detailed, modern social app visual language.

Scene:  
A smartphone held in hand (slightly angled) showing the Lurdinha app GROUP LIST / LOBBY screen.

The environment is a night social setting (house party or casual hangout), blurred in the background.  
Multiple friends are visible behind, using their phones, laughing, reacting.

This reinforces: people are actively playing together right now.

Composition:

Phone centered or slightly right (hero element)

Background friends blurred (depth of field)

Floating UI elements subtly expanding beyond the phone (to break the screen boundary)

Smartphone Screen (VERY IMPORTANT):  
Display a rich, alive group list with strong social density.

Show:

• multiple active groups (5–7 visible)  
• each group with custom names (ex: "Churrasco do Zé", "Família caos", "Apê sexta", "Galera do trampo")  
• avatars for each member (small circular profile images)  
• activity indicators (ex: “3 votaram agora”, “resultado em breve”, “nova pergunta”)  
• timestamps (ex: “agora”, “2 min”)  
• subtle badges (🔥 streak, 👑 leader, ⏳ tempo restante)

One group should be visually highlighted (active selection state).

Floating Social Elements (outside the phone):  
• avatar bubbles  
• glowing connection lines between avatars  
• vote icons  
• small reaction emojis  
• subtle crown icon 👑  
These elements should radiate from the phone, reinforcing network/social energy.

Lighting:

Dark environment (\#000000 → \#0E0E10)

Strong violet glow (\#8B5CF6) coming from the phone

Soft light hitting faces in background

Slight orange accents (\#FF6B35) for warmth and contrast

Color Palette:  
Primary violet \#8B5CF6  
Dark UI \#17171B  
Black background \#000000  
Accent orange \#FF6B35  
Text white \#FFFFFF

Mood:  
social  
alive  
connected  
playful  
group energy  
FOMO  
“people are playing right now”

Headline (in image):  
"PERFEITO PRA JOGAR COM AMIGOS"

Subtext:  
"Entre nos grupos e veja o que estão prevendo agora."

Brand Element:  
Include Lurdinha mascot in circular badge with violet glow, floating near the UI.

Camera:  
50mm lens  
shallow depth of field  
focus on phone  
background softly blurred

Quality:  
ultra detailed  
8k  
cinematic lighting  
sharp focus  
premium mobile app advertising

Negative Prompt:  
no empty UI  
no white background  
no corporate layout  
no settings screen  
no static interface  
no futuristic sci-fi  
no financial/crypto elements

# **Frases muito mais alinhadas com o conceito do Lurdinha**

### **Grupo 1 — previsão social**

(simples e fortes)

**“NO QUE VOCÊ ACHA QUE VAI DAR?”**

**“QUAL É O SEU PALPITE?”**

**“O QUE VOCÊ ACHA QUE VAI ACONTECER?”**

**“ANTES DE ACONTECER… QUAL SEU PALPITE?”**

---

# **Grupo 2 — evento real**

(ótimas para posts)

**“A VIDA REAL VIROU JOGO.”**

**“TRANSFORME SITUAÇÕES REAIS EM PALPITES.”**

**“O GRUPO APOSTA. A VIDA RESPONDE.”**

**“PALPITES HOJE. RESPOSTA DEPOIS.”**

---

# **Grupo 3 — revelação**

(ótimas para carrossel ou criativo)

**“QUEM ACERTOU?”**

**“QUEM PREVIU CERTO?”**

**“A RESPOSTA VEM DEPOIS.”**

**“QUEM CHEGOU MAIS PERTO?”**

---

# **Grupo 4 — provocação social**

(engajamento alto)

**“TODO MUNDO TEM UM PALPITE.”**

**“O GRUPO VOTA. O TEMPO REVELA.”**

**“VAMOS VER QUEM ACERTA.”**

**“SEU PALPITE FOI QUAL?”**

---

# **Grupo 5 — ranking / competição**

(boa para produto)

**“QUEM PREVÊ MELHOR?”**

**“QUEM ACERTA MAIS NO GRUPO?”**

**“SUBA NO RANKING.”**

**“ACERTE. SUBA. PROVOQUE.”**

---

[https://docs.google.com/document/d/1vTSbiPpO7Z7YchRLaU6FtftoXyaQnBEnh4I377HJwN4/edit?tab=t.0](https://docs.google.com/document/d/1vTSbiPpO7Z7YchRLaU6FtftoXyaQnBEnh4I377HJwN4/edit?tab=t.0)

* descrições das telas para fazer e colocar na app store

   **1️⃣ NO QUE VOCÊ ACHA QUE VAI DAR? OK**

   👉 **Tela ideal: QUIZ ATIVO (pergunta aberta)**

   **Mostrar:**

  4. pergunta clara  
  5. opções grandes  
  6. avatares já votando  
  7. UI com densidade social  
* **Por quê:**

   Essa é a primeira prova do produto:

   “isso é um jogo de prever situações”

   ❌ NÃO usar:

  4. home vazia  
  5. lista de grupos  
  6. onboarding  
* ---

   **2️⃣ VOTE NO QUE ACHA QUE VAI ACONTECER ok**

   👉 **Tela ideal: ESTADO DE VOTO (interação acontecendo)**

   **Mostrar:**

  4. botão sendo selecionado  
  5. highlight violeta forte  
  6. avatares conectados à opção  
  7. feedback visual de toque  
* **Por quê:**

   Aqui você responde:

   “como joga?”

   Tem que ser **absurdamente óbvio**.

   ❌ NÃO usar:

  4. tela estática sem ação  
  5. resultado já revelado  
* ---

   **3️⃣ A VIDA ACONTECE ok**

   👉 **Tela ideal: QUIZ \+ CONTEXTO REAL (semi-revelação)**

   **Mostrar:**

  4. mesma pergunta do quiz  
  5. mas com contexto real no fundo (ex: pessoa chegando com bebida)  
  6. UI ainda visível  
* **Por quê:**

   Esse é o diferencial do Lurdinha:

   jogo \+ vida real

   Se essa tela falhar, seu app vira “quiz genérico”.

   ❌ NÃO usar:

  4. apenas UI  
  5. apenas pessoas sem conexão com o quiz  
* ---

   **4️⃣ QUEM PREVIU CERTO? ok**

   👉 **Tela ideal: RESULTADO REVELADO**

   **Mostrar:**

  4. alternativa correta destacada  
  5. coroa 👑  
  6. avatares certos brilhando  
  7. feedback visual forte  
* **Por quê:**

   Esse é o **momento de dopamina**.

   Tem que ser visualmente óbvio em 0.5s.

   ❌ NÃO usar:

  4. ranking aqui  
  5. tela neutra  
* ---

   **5️⃣ QUEM ACERTA MAIS NO GRUPO? ok**

   👉 **Tela ideal: RANKING**

   **Mostrar:**

  4. leaderboard completo  
  5. posição 1 destacada  
  6. streak / badges  
  7. avatares  
* **Por quê:**

   Isso vende retenção:

   “vou querer ganhar dos meus amigos”

   ❌ NÃO usar:

  4. resultado isolado  
  5. tela de perfil  
* ---

   **6️⃣ PERFEITO PARA AMIGOS**

   👉 **Tela ideal: LISTA DE GRUPOS ou LOBBY**

   **Mostrar:**

  4. vários grupos ativos  
  5. nomes personalizados  
  6. atividade recente  
  7. avatares  
* OU

   👉 **Lobby do modo ao vivo**

   **Por quê:**

   Fecha o loop com:

   “isso é pra jogar com outras pessoas”

   ❌ NÃO usar:

  4. tela técnica  
  5. configurações  
  6. telas vazias  
* ideias brainstorm, para implementar que ainda nao esta no app:

  4. COMPLEMENT → "Completar cenário"  
* Primeiro jogador cria: "Victor em um restaurante"

   Cada próximo adiciona:

   detalhe novo obrigatório

   Ex:

   restaurante restaurante pegando fogo restaurante pegando fogo com Victor preso bombeiros chegam Victor vira suspeito

   Final vira narrativa absurda

  4. ICEBREAKER → "Pergunta evolutiva"  
* Cada jogador transforma a frase em pergunta.

   Ex: "Victor compra um barco" → "por que Victor comprou um barco?" → "Victor sabe pilotar?" → "O barco afundou?" → "Quem estava com ele?"

   Isso vira: narrativa investigativa.

   Muito diferente.

  4. Secret com impostor  
* 1 jogador recebe: "Você deve destruir a história"

   Grupo tenta identificar quem foi.

   Perfeito pro Lurdinha:

   encaixa com votação encaixa com ranking encaixa com social

  4. Secret competitivo (melhor de todos)  
* Objetivos conflitantes:

   metade quer distorcer metade quer manter fiel

   Ninguém sabe quem é quem.

   Isso cria:

   jogo mental leitura social estratégia

   Muito superior.

  4. Secret com impostor  
* 1 jogador recebe: "Você deve destruir a história"

   Grupo tenta identificar quem foi.

   Perfeito pro Lurdinha:

   encaixa com votação encaixa com ranking encaixa com social

  4. STORY → "História Distorcida Social"  
* Cada jogador continua a história sobre alguém real do grupo.

   Ex:

   "Victor vai comprar um cachorro" "Victor comprou um cachorro e perdeu ele" "Victor perdeu o cachorro no shopping" "Victor foi expulso do shopping com o cachorro"

   Final:

   votação: qual é mais provável acontecer? depois: vida real decide

   Isso conecta com seu DNA (previsão social).

  4. SECRET → "Interpretação às cegas"  
* Ninguém vê o histórico.

   Cada jogador só vê:

   última frase

   Isso cria:

   ruído extremo caos rápido revelação muito forte

   Perfeito pra rodadas curtas.
