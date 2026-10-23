// Cada aparelho logado guarda seu token em `expoPushTokens`. `expoPushToken` é o
// campo antigo (um aparelho só) e continua sendo lido para contas que ainda não
// abriram a versão nova do app.
export const getUserPushTokens = (userData = {}) => [...new Set([
    ...(Array.isArray(userData.expoPushTokens) ? userData.expoPushTokens : []),
    userData.expoPushToken,
].filter((token) => typeof token === 'string' && token.startsWith('ExponentPushToken')))];
