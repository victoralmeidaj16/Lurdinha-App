import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen({ onFinish }) {
    return (
        <View style={styles.container}>
            {/* Background Hero Image */}
            <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop' }} 
                style={styles.heroImage} 
                resizeMode="cover"
            />
            
            {/* Scrim Gradient */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', '#000000']}
                locations={[0.3, 0.55, 0.75, 1]}
                style={styles.gradientOverlay}
            />

            <View style={styles.content}>
                {/* Floating Brand Anchor */}
                <View style={styles.logoAnchor}>
                   <Image source={require('../../assets/logo.png')} style={styles.logo} />
                   <Text style={styles.brandName}>lurdinha <Text style={styles.brandEmoji}>💛</Text></Text>
                   <Text style={styles.brandSubtitle}>A party no seu bolso</Text>
                </View>

                {/* Auth Buttons Stack */}
                <View style={styles.authStack}>
                    <TouchableOpacity 
                        style={styles.primaryButton}
                        activeOpacity={0.85}
                        onPress={() => onFinish({ isLogin: false })}
                    >
                        <Text style={styles.primaryButtonText}>Criar nova conta</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.ghostButton}
                        activeOpacity={0.85}
                        onPress={() => onFinish({ isLogin: true })}
                    >
                        <Text style={styles.ghostButtonText}>Fazer login</Text>
                    </TouchableOpacity>
                </View>

                {/* Legal Links (Minimal) */}
                <View style={styles.legalLinks}>
                    <Text style={styles.legalText}>
                        Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    heroImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    },
    logoAnchor: {
        alignItems: 'center',
        marginBottom: 56,
    },
    logo: {
        width: 140,
        height: 140,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    brandName: {
        fontSize: 38,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.5,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 8,
    },
    brandEmoji: {
        fontSize: 32,
    },
    brandSubtitle: {
        marginTop: 6,
        fontSize: 14,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    authStack: {
        gap: 16,
        marginBottom: 32,
    },
    primaryButton: {
        backgroundColor: colors.primary, // Roxo
        borderRadius: 18,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
    },
    ghostButton: {
        backgroundColor: 'transparent',
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ghostButtonText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 15,
        fontWeight: '600',
    },
    legalLinks: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    legalText: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        lineHeight: 18,
    },
});
