import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    useWindowDimensions,
    Image,
    TouchableOpacity,
    Animated
} from 'react-native';
import { ArrowRight, Check } from 'lucide-react-native';

const slides = [
    {
        id: '1',
        title: 'Bem-vindo ao Lurdinha',
        description: 'A sua comunidade de palpites e diversão. Junte-se a nós e mostre que você entende tudo!',
        image: require('../../assets/logo.png'), // Using the logo as requested
        isLogo: true,
    },
    {
        id: '2',
        title: 'Crie e Participe de Grupos',
        description: 'Reúna seus amigos, crie grupos personalizados e divirta-se com enquetes exclusivas.',
        icon: '👥',
    },
    {
        id: '3',
        title: 'Suba no Ranking',
        description: 'Acerte os palpites, ganhe pontos e conquiste o topo do ranking da sua galera.',
        icon: '🏆',
    },
];

function Paginator({ data, scrollX }) {
    const { width } = useWindowDimensions();

    return (
        <View style={styles.paginatorContainer}>
            {data.map((_, i) => {
                const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [10, 20, 10],
                    extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                });

                return (
                    <Animated.View
                        key={i.toString()}
                        style={[styles.dot, { width: dotWidth, opacity }]}
                    />
                );
            })}
        </View>
    );
}

function OnboardingItem({ item, width }) {
    return (
        <View style={[styles.itemContainer, { width }]}>
            <View style={styles.imageContainer}>
                {item.isLogo ? (
                    <Image
                        source={item.image}
                        style={[styles.image, { width: width * 0.7, resizeMode: 'contain' }]}
                    />
                ) : (
                    <Text style={styles.iconEmoji}>{item.icon}</Text>
                )}
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
            </View>
        </View>
    );
}

export default function OnboardingScreen({ onFinish }) {
    const { width } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef(null);

    const viewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const scrollToNext = () => {
        if (currentIndex < slides.length - 1) {
            slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
        } else {
            onFinish();
        }
    };

    return (
        <View style={styles.container}>
            <View style={{ flex: 3 }}>
                <FlatList
                    data={slides}
                    renderItem={({ item }) => <OnboardingItem item={item} width={width} />}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                        useNativeDriver: false,
                    })}
                    scrollEventThrottle={32}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    ref={slidesRef}
                />
            </View>

            <View style={styles.footer}>
                <Paginator data={slides} scrollX={scrollX} />

                <TouchableOpacity
                    style={styles.button}
                    onPress={scrollToNext}
                    activeOpacity={0.8}
                >
                    {currentIndex === slides.length - 1 ? (
                        <>
                            <Text style={styles.buttonText}>Começar</Text>
                            <Check size={20} color="#ffffff" />
                        </>
                    ) : (
                        <>
                            <Text style={styles.buttonText}>Próximo</Text>
                            <ArrowRight size={20} color="#ffffff" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    imageContainer: {
        flex: 0.6,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    image: {
        height: '100%',
    },
    iconEmoji: {
        fontSize: 120,
    },
    textContainer: {
        flex: 0.4,
        alignItems: 'center',
    },
    title: {
        fontWeight: '800',
        fontSize: 28,
        marginBottom: 16,
        color: '#ffffff',
        textAlign: 'center',
    },
    description: {
        fontWeight: '400',
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 24,
    },
    footer: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 50,
        width: '100%',
    },
    paginatorContainer: {
        flexDirection: 'row',
        height: 64,
    },
    dot: {
        height: 10,
        borderRadius: 5,
        backgroundColor: '#8b5cf6',
        marginHorizontal: 8,
    },
    button: {
        flexDirection: 'row',
        backgroundColor: '#8b5cf6',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '80%',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
