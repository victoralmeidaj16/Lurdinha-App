import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// Em produção, um erro JS fatal faz o React Native lançar uma NSException fora
// da thread JS, o que corrompe o Hermes e fecha o app sem mensagem. Aqui o erro
// é interceptado antes disso e mostrado na tela, para sabermos qual é.

let capturedError = null;
const listeners = new Set();

export const reportFatalError = (error) => {
    capturedError = error instanceof Error ? error : new Error(String(error));
    listeners.forEach((listener) => listener(capturedError));
};

export const installFatalErrorCapture = () => {
    if (__DEV__ || !global.ErrorUtils) return;

    const previousHandler = global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        if (!isFatal) {
            previousHandler?.(error, isFatal);
            return;
        }
        reportFatalError(error);
    });
};

// Usa só componentes básicos do React Native: se o erro vier de uma
// dependência do app, esta tela não pode depender dela.
export function FatalErrorScreen({ error }) {
    const stack = String(error?.stack || '').split('\n').slice(0, 12).join('\n');

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Algo deu errado</Text>
                <Text style={styles.subtitle}>
                    Tire um print desta tela e envie para o suporte.
                </Text>
                <Text selectable style={styles.message}>
                    {error?.name}: {error?.message}
                </Text>
                <Text selectable style={styles.stack}>{stack}</Text>
            </ScrollView>
        </View>
    );
}

export const withFatalErrorScreen = (App) => function FatalErrorRoot(props) {
    const [error, setError] = useState(capturedError);

    useEffect(() => {
        listeners.add(setError);
        return () => listeners.delete(setError);
    }, []);

    return error ? <FatalErrorScreen error={error} /> : <App {...props} />;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 40,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 8,
    },
    subtitle: {
        color: '#AAAAAA',
        fontSize: 15,
        marginBottom: 24,
    },
    message: {
        color: '#FF6B6B',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 16,
    },
    stack: {
        color: '#CCCCCC',
        fontSize: 11,
        fontFamily: 'Courier',
    },
});
