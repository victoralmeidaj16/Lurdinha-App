# Abrir o Lurdinha no iOS Simulator

Este guia abre o app local no simulador iOS usando o Expo Dev Client.

## Pre-requisitos

- macOS com Xcode instalado.
- Simulador iOS instalado pelo Xcode.
- Node.js 20 ou versao compativel com o projeto.
- Dependencias instaladas com `npm install`.
- Arquivo `.env` configurado com as chaves do Firebase.

## 1. Abrir o projeto

```bash
cd /Users/victoralmeidaj16/Downloads/Lurdinha-App
```

Se for a primeira vez nessa maquina, instale as dependencias:

```bash
npm install
```

## 2. Abrir ou iniciar o simulador

Opção pelo Xcode:

```bash
open -a Simulator
```

Opção por terminal, usando um simulador ja instalado:

```bash
xcrun simctl list devices available
xcrun simctl boot "iPhone 16 Pro"
open -a Simulator
```

Se o device ja estiver ligado, o comando `boot` pode avisar que ele ja esta bootado. Isso e normal.

## 3. Iniciar o Metro

Em um terminal, rode:

```bash
npx expo start --dev-client --port 8081
```

Deixe esse terminal aberto. Ele entrega o bundle JavaScript para o app no simulador.

## 4. Instalar e abrir o app no iOS Simulator

Em outro terminal, rode:

```bash
npx expo run:ios --port 8081
```

Esse comando compila o projeto iOS, instala o app `Lurdinha` no simulador e abre o app.

## 5. Recarregar o app depois de alterar codigo

Com o Metro aberto, pressione:

```text
r
```

Tambem da para usar o menu do simulador:

```text
Device > Shake
```

Depois selecione a opcao de recarregar, se o menu de desenvolvimento aparecer.

## 6. Abrir o app ja instalado

Se o app ja foi instalado no simulador e o Metro esta rodando, voce pode abrir pelo icone `Lurdinha` no proprio simulador.

Tambem pode abrir via terminal:

```bash
xcrun simctl launch booted com.lurdinha.app
```

## 7. Problemas comuns

### Porta 8081 ocupada

Encontre o processo usando a porta:

```bash
lsof -i :8081
```

Finalize o processo ou rode o Metro em outra porta:

```bash
npx expo start --dev-client --port 8082
npx expo run:ios --port 8082
```

### App abre tela vermelha ou nao conecta ao Metro

1. Confirme que o Metro esta rodando.
2. Recarregue com `r` no terminal do Metro.
3. Feche e abra o app no simulador.
4. Se continuar, rode novamente:

```bash
npx expo run:ios --port 8081
```

### Build iOS falha depois de atualizar dependencias

Limpe e gere novamente:

```bash
npx expo prebuild --clean --platform ios
npx expo run:ios --port 8081
```

Use `prebuild --clean` com cuidado, porque ele regenera a pasta `ios`.
