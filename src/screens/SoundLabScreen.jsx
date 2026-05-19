import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ExternalLink, Play, Sparkles, Volume2 } from 'lucide-react-native';
import Header from '../components/Header';
import { colors } from '../theme';
import { triggerImpact } from '../utils/haptics';

const SOUND_LAB_URLS = [
  'http://192.168.1.177:4173/docs/sound-lab.html',
  'http://127.0.0.1:4173/docs/sound-lab.html',
];

const SOUND_GROUPS = [
  {
    title: 'UI básica',
    sounds: [
      ['ui_tap_soft', 'UI Tap Soft', 'Botões secundários'],
      ['ui_tap_primary', 'UI Tap Primary', 'Responder, Continuar, Próximo'],
      ['ui_back', 'UI Back', 'Voltar e fechar'],
      ['ui_disabled', 'UI Disabled', 'Ação bloqueada'],
      ['ui_toggle', 'UI Toggle', 'Switches e seleções'],
    ],
  },
  {
    title: 'Resposta e voto',
    sounds: [
      ['option_select', 'Option Select', 'Escolher alternativa'],
      ['answer_submit', 'Answer Submit', 'Enviar resposta'],
      ['answer_success', 'Answer Success', 'Acerto ou resposta salva'],
      ['answer_error', 'Answer Error', 'Erro ou validação'],
    ],
  },
  {
    title: 'Rodada e resultado',
    sounds: [
      ['next_round', 'Next Round', 'Próxima rodada'],
      ['reveal', 'Reveal', 'Revelar resultado'],
      ['countdown_tick', 'Countdown Tick', 'Contagem 3, 2, 1'],
      ['winner', 'Winner', 'Vencedor ou ranking'],
      ['notification_in_app', 'Notification In App', 'Aviso dentro do app'],
    ],
  },
];

export default function SoundLabScreen({ navigation }) {
  const openSoundLab = async () => {
    triggerImpact('medium');

    for (const url of SOUND_LAB_URLS) {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        Linking.openURL(url);
        return;
      }
    }

    Linking.openURL(SOUND_LAB_URLS[0]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#111118', '#181124', '#0f0f13']} style={StyleSheet.absoluteFill} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header
          title="Laboratório de sons"
          subtitle="Abra a página de teste para ouvir"
          onBack={() => navigation.goBack()}
          transparent
        />

        <View style={styles.heroPanel}>
          <View style={styles.heroIcon}>
            <Sparkles size={24} color="#FDE68A" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Sons candidatos</Text>
            <Text style={styles.heroText}>
              Este dev client ainda não tem o módulo nativo de áudio. Use a página local para ouvir os sons sem reinstalar o app.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.openButton} onPress={openSoundLab} activeOpacity={0.84}>
          <ExternalLink size={20} color="#FFFFFF" />
          <Text style={styles.openButtonText}>Abrir teste de sons</Text>
        </TouchableOpacity>

        {SOUND_GROUPS.map((group) => (
          <View key={group.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{group.title}</Text>
            <View style={styles.soundList}>
              {group.sounds.map(([id, name, use]) => (
                <View key={id} style={styles.soundRow}>
                  <View style={styles.playButton}>
                    <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                  <View style={styles.soundInfo}>
                    <Text style={styles.soundName}>{name}</Text>
                    <Text style={styles.soundUse}>{use}</Text>
                  </View>
                  <Volume2 size={18} color="rgba(255,255,255,0.38)" />
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f13',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroPanel: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.18)',
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(253,230,138,0.14)',
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textLight,
    marginBottom: 4,
  },
  heroText: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.62)',
  },
  openButton: {
    marginHorizontal: 16,
    marginBottom: 26,
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 26,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.46)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  soundList: {
    gap: 10,
  },
  soundRow: {
    minHeight: 72,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.76)',
  },
  soundInfo: {
    flex: 1,
  },
  soundName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textLight,
    marginBottom: 3,
  },
  soundUse: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.56)',
  },
});
