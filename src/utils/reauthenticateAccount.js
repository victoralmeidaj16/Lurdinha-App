import { EmailAuthProvider, OAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

export const usesAppleAuthentication = (user) => (
  user?.providerData?.some((provider) => provider.providerId === 'apple.com') === true
);

export async function reauthenticateAccount(user, password) {
  if (!user) throw new Error('Usuário não autenticado.');

  if (usesAppleAuthentication(user)) {
    if (!(await AppleAuthentication.isAvailableAsync())) {
      throw new Error('Confirme sua identidade em um dispositivo com login Apple disponível.');
    }
    const rawNonce = Crypto.randomUUID();
    const nonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
    const apple = await AppleAuthentication.signInAsync({ nonce });
    if (!apple.identityToken) throw new Error('Não foi possível confirmar sua identidade com a Apple.');
    const credential = new OAuthProvider('apple.com').credential({
      idToken: apple.identityToken,
      rawNonce,
    });
    // Reautentica o usuário existente; não troca a sessão por outra conta Apple.
    await reauthenticateWithCredential(user, credential);
    return;
  }

  if (!user.providerData?.some((provider) => provider.providerId === 'password')) {
    throw new Error('Este método de login ainda não permite confirmar a exclusão pelo app.');
  }
  if (!user.email || !password) throw new Error('Digite sua senha para confirmar a exclusão.');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
}
