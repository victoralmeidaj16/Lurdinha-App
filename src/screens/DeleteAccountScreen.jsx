import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AlertTriangle, Trash2 } from 'lucide-react-native';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { deleteAccountData } from '../utils/deleteAccount';
import { reauthenticateAccount, usesAppleAuthentication } from '../utils/reauthenticateAccount';

export default function DeleteAccountScreen({ navigation }) {
  const { currentUser } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const usesApple = usesAppleAuthentication(currentUser);
  const requiredText = 'DELETAR';
  const isConfirmValid = confirmText === requiredText;

  const handleDeleteAccount = async () => {
    if (loading) return;
    if (!isConfirmValid) {
      Alert.alert('Erro', `Digite "${requiredText}" para confirmar`);
      return;
    }

    Alert.alert(
      'Confirmar Exclusão',
      'Esta ação é IRREVERSÍVEL. Serão excluídos:\n\n' +
      '• Sua conta e perfil\n' +
      '• Sua participação nos grupos\n' +
      '• Seus votos em enquetes\n' +
      '• Todas as suas estatísticas\n\n' +
      'Grupos compartilhados serão mantidos e a administração será transferida quando houver outros membros. Deseja continuar?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sim, Deletar Conta',
          style: 'destructive',
          onPress: async () => {
            if (!usesApple && !showPasswordInput) {
              setShowPasswordInput(true);
              return;
            }
            if (!usesApple && !password) {
              Alert.alert('Erro', 'Digite sua senha para confirmar a exclusão.');
              return;
            }

            setLoading(true);
            try {
              await reauthenticateAccount(currentUser, password);
              await deleteAccountData(currentUser);
              Alert.alert('Conta Excluída', 'Sua conta foi excluída com sucesso.');
            } catch (error) {
              if (error.code === 'ERR_REQUEST_CANCELED' || error.code === 'ERR_CANCELED' || error.code === 'auth/user-cancelled') return;
              console.error('Error deleting account:', error);
              let message = 'Não foi possível concluir a exclusão. Tente novamente para continuar a limpeza dos dados.';
              if (['auth/wrong-password', 'auth/invalid-credential'].includes(error.code)) {
                message = 'Não foi possível confirmar sua identidade. Confira sua senha ou conta Apple.';
              } else if (error.code === 'auth/user-mismatch') {
                message = 'Use a mesma conta Apple com a qual você entrou no app.';
              } else if (error.code === 'auth/too-many-requests') {
                message = 'Muitas tentativas. Aguarde um pouco e tente novamente.';
              } else if (error.code === 'auth/requires-recent-login') {
                message = 'Sua confirmação expirou. Tente novamente para confirmar sua identidade.';
              } else if (error.code === 'permission-denied') {
                message = 'Não foi possível remover seus dados por uma falha de permissão. Tente novamente mais tarde ou entre em contato com o suporte.';
              } else if (!error.code && error.message) {
                message = error.message;
              }
              Alert.alert('Erro', message);
              setPassword('');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Header
          title="Excluir Conta"
          onBack={() => navigation.goBack()}
        />

        <View style={styles.content}>
          <View style={styles.warningCard}>
            <AlertTriangle size={32} color="#F44336" />
            <Text style={styles.warningTitle}>Atenção: Esta ação é irreversível</Text>
            <Text style={styles.warningText}>
              Ao excluir sua conta, serão removidos:
            </Text>
            <View style={styles.warningList}>
              <Text style={styles.warningItem}>• Seu perfil e informações pessoais</Text>
              <Text style={styles.warningItem}>• Todas as suas estatísticas e progresso</Text>
              <Text style={styles.warningItem}>• Seus votos em enquetes</Text>
              <Text style={styles.warningItem}>• Sua participação em grupos</Text>
              <Text style={styles.warningItem}>• Grupos compartilhados serão mantidos, com transferência de administração</Text>
            </View>
          </View>

          <View style={styles.confirmSection}>
            <Text style={styles.confirmLabel}>
              Para confirmar, digite <Text style={styles.confirmRequired}>DELETAR</Text> abaixo:
            </Text>
            <TextInput
              style={[
                styles.confirmInput,
                confirmText.length > 0 && !isConfirmValid && styles.confirmInputError,
              ]}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="Digite DELETAR"
              placeholderTextColor="#71717a"
              autoCapitalize="characters"
            />
            {confirmText.length > 0 && !isConfirmValid && (
              <Text style={styles.errorText}>
                O texto deve ser exatamente "{requiredText}"
              </Text>
            )}

            {!usesApple && showPasswordInput && (
              <View style={styles.passwordSection}>
                <Text style={styles.passwordLabel}>
                  Por segurança, digite sua senha para confirmar:
                </Text>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Digite sua senha"
                  placeholderTextColor="#71717a"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.passwordHint}>
                  Esta é uma medida de segurança para proteger sua conta.
                </Text>
              </View>
            )}
            {usesApple && (
              <Text style={styles.passwordHint}>Você confirmará sua identidade com a Apple antes da exclusão.</Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              (!isConfirmValid || (!usesApple && showPasswordInput && !password) || loading) && styles.deleteButtonDisabled,
            ]}
            onPress={handleDeleteAccount}
            disabled={!isConfirmValid || (!usesApple && showPasswordInput && !password) || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Trash2 size={20} color="#FFFFFF" />
                <Text style={styles.deleteButtonText}>Excluir Minha Conta Permanentemente</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Se você tiver dúvidas ou precisar de ajuda, entre em contato conosco através 
            das configurações do aplicativo antes de excluir sua conta.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  warningCard: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 2,
    borderColor: '#F44336',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  warningList: {
    alignSelf: 'stretch',
    gap: 8,
  },
  warningItem: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  confirmSection: {
    marginBottom: 24,
  },
  confirmLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  confirmRequired: {
    fontWeight: '700',
    color: '#F44336',
  },
  confirmInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3f3f46',
  },
  confirmInputError: {
    borderColor: '#F44336',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  deleteButtonDisabled: {
    backgroundColor: '#71717a',
    opacity: 0.5,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  helpText: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 20,
  },
  passwordSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  passwordLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  passwordInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3f3f46',
    marginBottom: 8,
  },
  passwordHint: {
    fontSize: 12,
    color: '#71717a',
    fontStyle: 'italic',
  },
});

