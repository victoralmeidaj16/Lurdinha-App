import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Plus, ArrowRight, Play } from 'lucide-react-native';
import Header from '../../components/Header';

const { width } = Dimensions.get('window');

export default function GameHomeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Header title="Lurdinha" transparent />

            <LinearGradient
                colors={['#4c1d95', '#2e1065']}
                style={styles.background}
            />

            <View style={styles.content}>
                <View style={styles.heroSection}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.heroEmoji}>😈</Text>
                    </View>
                    <Text style={styles.title}>Lurdinha</Text>
                    <Text style={styles.subtitle}>
                        Pense como o grupo ou leve uma Lurdinha.
                        O jogo onde ser "do contra" é o seu fim.
                    </Text>
                </View>

                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('CreateRoom')}
                    >
                        <LinearGradient
                            colors={['#8b5cf6', '#7c3aed']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <View style={styles.buttonContent}>
                                <View style={styles.iconWrapper}>
                                    <Plus size={24} color="#fff" />
                                </View>
                                <View style={styles.textWrapper}>
                                    <Text style={styles.buttonTitle}>Criar Sala</Text>
                                    <Text style={styles.buttonSubtitle}>Seja o host e defina as regras</Text>
                                </View>
                                <ArrowRight size={20} color="#fff" style={{ opacity: 0.5 }} />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('JoinRoom')}
                    >
                        <View style={styles.buttonContent}>
                            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                <Users size={24} color="#fff" />
                            </View>
                            <View style={styles.textWrapper}>
                                <Text style={styles.buttonTitle}>Entrar em Sala</Text>
                                <Text style={styles.buttonSubtitle}>Tenho um código de acesso</Text>
                            </View>
                            <ArrowRight size={20} color="#fff" style={{ opacity: 0.5 }} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Como jogar: Responda igual à maioria para se salvar.
                        Quem foge do padrão ganha pontos negativos.
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2e1065',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        marginTop: 60,
    },
    iconContainer: {
        width: 100,
        height: 100,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    heroEmoji: {
        fontSize: 50,
    },
    title: {
        fontSize: 40,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 12,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: '#e9d5ff',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: '80%',
    },
    actionsContainer: {
        gap: 16,
    },
    primaryButton: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#8b5cf6',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    gradientButton: {
        padding: 4,
    },
    secondaryButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textWrapper: {
        flex: 1,
    },
    buttonTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    buttonSubtitle: {
        fontSize: 14,
        color: '#e9d5ff',
    },
    footer: {
        marginTop: 20,
    },
    footerText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        lineHeight: 18,
    },
});
