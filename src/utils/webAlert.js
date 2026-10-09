import { Alert, Platform } from 'react-native';

// No react-native-web `Alert.alert` é uma função vazia: sucessos, erros e
// confirmações sumiam em silêncio. No web usamos alert/confirm do navegador.
export default function installWebAlert() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  Alert.alert = (title, message, buttons) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    const list = buttons?.length ? buttons : [{ text: 'OK' }];

    if (list.length === 1) {
      window.alert(text);
      list[0].onPress?.();
      return;
    }

    // confirm() só tem OK/Cancelar: OK dispara a última ação que não é cancelamento.
    const cancel = list.find((button) => button.style === 'cancel');
    const actions = list.filter((button) => button !== cancel);
    if (window.confirm(text)) {
      actions[actions.length - 1]?.onPress?.();
    } else {
      cancel?.onPress?.();
    }
  };
}
