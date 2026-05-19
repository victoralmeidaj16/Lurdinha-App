# Lurdinha — Design System

Documento operacional de design. É a ponte entre a identidade da marca (`Lurdinha_essencia.md`) e a implementação em código (`src/theme.js`).

Toda decisão visual nova deve ser verificada aqui primeiro.

---

## 1. Princípio Central

O app não é um utilitário. É um **ecossistema de jogos sociais premium**.

O objetivo de cada tela não é apenas informar — é fazer o usuário sentir:

> "Quero ver o que acontece a seguir."

A interface deve parecer **viva, social e emocionalmente reativa**.

Nunca deve parecer: corporativa, fria, SaaS, ou emocionalmente plana.

---

## 2. Sistema de Cores

### Primárias

| Token | Valor | Uso |
|---|---|---|
| `primary` | `#8B5CF6` | CTAs, estados ativos, destaques principais |
| `primaryLight` | `#A78BFA` | Hover, gradientes, glow leve |
| `primaryDark` | `#7C3AED` | Pressed, gradientes escuros |
| `deepPurple` | `#2A1748` | Fundos de gradiente premium, deep backgrounds |

### Superfícies (do mais escuro ao mais elevado)

| Token | Valor | Uso |
|---|---|---|
| `background` | `#08080C` | Fundo raiz do app |
| `backgroundSecondary` | `#111116` | Fundo de telas secundárias |
| `backgroundElevated` | `#181821` | Seções elevadas, cabeçalhos |
| `surface` | `#1E1B2A` | Cards base, fundo de seções |
| `surfaceSecondary` | `#17171B` | Cards alternativos |
| `surfaceElevated` | `#22202C` | Cards de destaque, selecionado |
| `surfaceGlass` | `rgba(30,27,42,0.82)` | Bottom sheets com blur, overlays translúcidos |

### Bordas

| Token | Valor | Uso |
|---|---|---|
| `border` | `#2E2938` | Bordas sólidas de separação |
| `borderSoft` | `rgba(255,255,255,0.06)` | Bordas sutis de card (padrão) |
| `borderStrong` | `rgba(139,92,246,0.28)` | Bordas de destaque, cards selecionados |

### Hierarquia de texto

| Token | Valor | Uso |
|---|---|---|
| `textPrimary` | `#FFFFFF` | Títulos, CTAs, conteúdo principal |
| `textSecondary` | `#B8B5C4` | Subtítulos, labels de seção |
| `textMuted` | `#7D7989` | Texto auxiliar, descrições |
| `textDim` | `#5F5B6B` | Placeholders, timestamps, microcopy |

### Accents

| Token | Valor | Uso |
|---|---|---|
| `orange` | `#FF6B35` | Badges, streaks, troféus, urgência |
| `pink` | `#E91E63` | Notificações especiais, badges de evento |
| `gold` | `#FFC107` | Ranking 1º lugar, coroas, conquistas |

### Feedback semântico

| Token | Valor | Uso |
|---|---|---|
| `success` | `#4ADE80` | Acerto, streak, confirmação positiva |
| `warning` | `#FFC107` | Aviso, tempo quase esgotado |
| `error` | `#F44336` | Erro, ação destrutiva |
| `info` | `#38BDF8` | Informação, dica |

### Estados de gameplay

| Token | Valor | Uso |
|---|---|---|
| `online` | `#4ADE80` | Indicador de jogador online |
| `activeVote` | `#8B5CF6` | Opção sendo votada |
| `revealGlow` | `#C4B5FD` | Glow em momento de revelação |
| `streak` | `#FF6B35` | Indicador de sequência |
| `crown` | `#FFC107` | Coroa do vencedor |

### Overlays / Atmosfera

| Token | Valor | Uso |
|---|---|---|
| `overlayDark` | `rgba(8,8,12,0.72)` | Backdrop de modal |
| `overlayStrong` | `rgba(0,0,0,0.82)` | Backdrop de bottom sheet |
| `glassOverlay` | `rgba(255,255,255,0.04)` | Superfície glass sutil |

### Transparências do primary

```js
primaryAlpha04  → rgba(139,92,246,0.04)  // hover muito sutil
primaryAlpha08  → rgba(139,92,246,0.08)  // fundo de badge
primaryAlpha12  → rgba(139,92,246,0.12)  // fundo de chip/tag
primaryAlpha16  → rgba(139,92,246,0.16)  // fundo de card de revelação
primaryAlpha20  → rgba(139,92,246,0.20)  // hover de card
primaryAlpha30  → rgba(139,92,246,0.30)  // glow de bordas
```

### Transparências do branco

```js
whiteAlpha04 → rgba(255,255,255,0.04)  // glass overlay
whiteAlpha08 → rgba(255,255,255,0.08)  // bordas de card (padrão)
whiteAlpha12 → rgba(255,255,255,0.12)  // bordas de input
whiteAlpha20 → rgba(255,255,255,0.20)  // bordas de input ativo
```

### Gradientes prontos

```js
gradients.primary  → ['#7C3AED', '#8B5CF6']  // CTA principal
gradients.premium  → ['#2A1748', '#8B5CF6']  // Hero, cards premium
gradients.reward   → ['#FF6B35', '#FFC107']  // Badges, conquistas
gradients.dark     → ['#08080C', '#111116']  // Fundos de tela
gradients.elevated → ['#181821', '#1E1B2A']  // Cards elevados
gradients.reveal   → ['#8B5CF6', '#C4B5FD']  // Momento de revelação
```

### Regra de uso da cor

- **Violeta** = ação, foco, navegação ativa, destaque principal
- **Laranja** = calor, urgência leve, badges, troféus, conquistas
- **Ouro** = 1º lugar, coroa, melhor resultado
- **Verde** = sucesso, streak, confirmação positiva
- **Vermelho** = erro e revelações críticas
- **Rosa** = notificações especiais, badges de evento

---

## 3. Tipografia

### Famílias

| Família | Uso |
|---|---|
| **Poppins** | Headings, títulos de tela, hero sections, score highlights, reveal moments |
| **Inter** | Corpo, UI labels, botões, cards, menus, metadados sociais |

### Escala

| Token | Tamanho | Uso típico |
|---|---|---|
| `xs` | 10px | Timestamps, microcopy, indicadores auxiliares |
| `sm` | 12px | Legendas, labels secundários, subtextos de card |
| `md` | 14px | Corpo de texto, descrições, apoio |
| `lg` | 16px | Labels de seção, itens de lista, subtítulos |
| `xl` | 18px | CTAs, subtítulos de tela |
| `xxl` | 20px | Títulos de card, subtítulos fortes |
| `title` | 24px | Títulos de tela |
| `hero` | 32px | Hero sections, títulos de modos, scores |
| `display` | 40px | Reveal moments, ranking hero, números grandes |

### Pesos (Inter — UI/Body)

```js
regular   → Inter_400Regular   // corpo, texto longo
medium    → Inter_500Medium    // labels, cards
semibold  → Inter_600SemiBold  // subtítulos, botões secundários
bold      → Inter_700Bold      // botões primários, labels fortes
extrabold → Inter_800ExtraBold // destaques de UI
```

### Pesos (Poppins — Headings/Hero)

```js
headingSemibold  → Poppins_600SemiBold  // títulos de seção
headingBold      → Poppins_700Bold      // títulos de tela
headingExtrabold → Poppins_800ExtraBold // hero, reveal, ranking
```

### Regras

- Headline sempre curta e forte — **máximo 1 linha** quando possível
- Poppins em headings de tela, Inter em tudo dentro de cards e componentes
- Texto de apoio sempre com contraste menor (`textMuted` ou `textSecondary`)
- Nunca usar blocos longos de texto — frases curtas, orientadas à ação

---

## 4. Espaçamento

```js
xs      → 4px   // gap interno mínimo
sm      → 8px   // gap entre ícone e label
md      → 12px  // gap interno de card compacto
lg      → 16px  // padding padrão de card
xl      → 20px  // padding horizontal de tela
xxl     → 24px  // gap entre seções
xxxl    → 32px  // espaçamento entre blocos maiores
section → 40px  // separação de seções distintas
screen  → 48px  // padding de tela com safe area
```

---

## 5. Border Radius

```js
xs    → 8px   // chips, tags, badges pequenos
sm    → 12px  // botões compactos, inputs
md    → 16px  // botões padrão, cards compactos
lg    → 20px  // cards médios
xl    → 24px  // cards principais
xxl   → 32px  // cards grandes, bottom sheets
card  → 28px  // cards de jogo (padrão de card)
modal → 36px  // modais e bottom sheets principais
full  → 999px // pills, avatares, ícones circulares
```

Regra: cantos arredondados são assinatura visual da marca. **Nunca usar cantos retos** em componentes visíveis.

---

## 6. Sombras / Profundidade

```js
// Glow violeta — botões CTA, cards de destaque
primaryGlow: shadowColor #8B5CF6, offset (0,8), opacity 0.28, radius 18

// Card padrão — cards de feed, listas
card: shadowColor #000, offset (0,6), opacity 0.28, radius 12

// Painel elevado — modais, bottom sheets
elevated: shadowColor #000, offset (0,12), opacity 0.34, radius 22

// Sutil — separadores, elementos secundários
subtle: shadowColor #000, offset (0,2), opacity 0.14, radius 6
```

---

## 7. Sistema de Cards

Cards são a linguagem visual central do produto.

### Níveis de elevação

| Nível | Background | Border | Sombra | Uso |
|---|---|---|---|---|
| Base | `surface` `#1E1B2A` | `borderSoft` | `subtle` | Cards de feed |
| Elevado | `surfaceSecondary` `#17171B` | `whiteAlpha08` | `card` | Cards de jogo |
| Destaque | `surfaceElevated` `#22202C` | `borderStrong` | `card` | Cards selecionados |
| Hero | `gradients.premium` | `borderStrong` | `primaryGlow` | Ranking 1º, resultado |

### Características obrigatórias

- `borderRadius: card (28px)` para cards principais
- `borderWidth: 1` com border sutil (nunca sem border)
- `overflow: hidden` para conter gradientes internos
- Sombra sempre direcionada para baixo

---

## 8. Sistema de Botões

### Primário (CTA principal)

```
Background: gradients.primary ['#7C3AED', '#8B5CF6']
Border: none
Border Radius: 16–18px
Padding: 18px vertical
Font: Inter Bold 17–18px
Shadow: primaryGlow
```

### Secundário

```
Background: primaryAlpha12
Border: 1px borderStrong
Border Radius: sm (12px)–md (16px)
Font: Inter SemiBold 15–16px
```

### Ghost / Outline

```
Background: transparent
Border: 1px borderSoft
Font: Inter Medium 14–15px
```

### Regras de CTA

- **Máximo 1 CTA primário por tela**
- CTAs primários fixos no rodapé com `overlayStrong` de fundo
- Texto orientado à ação social: "Criar Sala", "Entrar", "Ver Resultado"

---

## 9. Motion Tokens

Animação é feedback emocional, não decoração.

### Durações

```js
fast   → 120ms  // micro-feedbacks, haptics
normal → 220ms  // transições de estado
smooth → 320ms  // entradas de tela, cards
slow   → 450ms  // reveals, transições especiais
```

### Escala de interação

```js
pressed → 0.97  // press de botão/card
hover   → 1.02  // hover/focus sutil
reveal  → 1.04  // animação de revelação
```

### Spring padrão

```js
damping: 14, stiffness: 180
```

### Configurações AnimatedPressable

```js
pressIn:  { damping: 18, stiffness: 420, mass: 0.4 }  // rápido
pressOut: { damping: 20, stiffness: 360, mass: 0.5 }  // suave
```

### Haptics

| Ação | Intensidade |
|---|---|
| CTA principal | `medium` |
| Cards de jogo, seleção | `medium` |
| Navegação, opções, ícones | `light` |
| Erro / feedback negativo | `heavy` |

---

## 10. Tokens de Gameplay

```js
// Timer
timer.urgent    → orange (#FF6B35)   // < 5s restantes
timer.active    → primary (#8B5CF6)  // tempo correndo
timer.background → surfaceElevated   // fundo do timer

// Ranking
ranking.first  → gold (#FFC107)    // 🥇
ranking.second → #C0C0C0           // 🥈
ranking.third  → #CD7F32           // 🥉

// Reveal
reveal.glow       → revealGlow (#C4B5FD)
reveal.background → primaryAlpha16
```

---

## 11. Iluminação e Atmosfera

### Padrão de fundo

```js
// Telas de jogo
LinearGradient: gradients.dark = ['#08080C', '#111116']

// Com acento do modo
colors: [`${modeAccent}28`, 'transparent'], height: 280–320px, position: absolute top
```

### Ambient orbs (profundidade)

```js
backgroundColor: primaryAlpha12–primaryAlpha16
width/height: 200–240px, borderRadius: full
position: absolute, pointerEvents: "none"
```

---

## 12. Padrões por Tipo de Tela

### Lista / Feed

```
background: #08080C
paddingHorizontal: xl (20px)
gap entre cards: 12–14px
```

### Configuração / Formulário

```
background: gradients.dark + accent wash no topo
hero: emoji + título + subtítulo
seções: borderTop borderSoft
footer fixo: CTA + overlayStrong
```

### Jogo ao vivo

```
background: atmosférico + glow do modo
timer: visível, urgent quando < 5s
conteúdo: card hero dominante
feedback: imediato (haptic + animação)
```

### Resultado / Reveal

```
background: gradients.premium + glow forte
reveal: spring + escala (motion.scale.reveal)
winner: crown + glow + tamanho maior
```

### Modal / Bottom Sheet

```
backdrop: overlayStrong rgba(0,0,0,0.82)
card: borderRadius modal (36px)
background: surfaceSecondary #17171B
borderTop: borderStrong
padding: xl (20px)
```

---

## 13. Densidade Social

A interface deve constantemente lembrar que **pessoas reais estão participando**.

### Obrigatório em telas de jogo

- Avatares dos participantes visíveis
- Contagem de quem já respondeu / votou
- Indicador de tempo restante
- Nome dos jogadores (não apenas ícones)
- Estado `online` com cor `#4ADE80` quando aplicável

---

## 14. Regras de Consistência

### Sempre fazer

- `AnimatedPressable` em vez de `TouchableOpacity`
- Cores de `src/theme.js`, nunca hardcode
- Poppins em headings de tela, Inter no restante
- Background sempre escuro e atmosférico
- `borderWidth: 1` com `borderSoft` em todo card
- `overflow: hidden` em cards com gradiente interno
- 1 CTA primário por tela

### Nunca fazer

- Fundo branco, cinza claro ou neutro
- Múltiplos CTAs primários na mesma tela
- Texto longo corrido — frases curtas orientadas à ação
- Gradientes baratos sem relação com a paleta
- Ícones sharp/enterprise — Lucide stroke 2px
- Estética esports, cyberpunk, casino ou sci-fi
- `shadowOpacity > 0.40` fora de `elevated`

---

## 15. Referências de Código

| Recurso | Arquivo |
|---|---|
| Tokens de design | `src/theme.js` |
| Pressable animado + haptic | `src/components/AnimatedPressable.jsx` |
| Header padrão | `src/components/Header.jsx` |
| Card de opção | `src/components/OptionCard.jsx` |
| Identidade da marca | `Lurdinha_essencia.md` |
| Princípios de produto | `docs/design-system.md` (este arquivo) |
