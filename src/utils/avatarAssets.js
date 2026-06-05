// Local avatar assets bundled with the app.
// Stored in Firestore as the string key (e.g. "lurdinha_avatar_3").
// Use resolveAvatarSource() everywhere you render an avatar image.

export const AVATAR_ASSET_MAP = {
    lurdinha_avatar_1:  require('../../assets/avatars/1.png'),
    lurdinha_avatar_2:  require('../../assets/avatars/2.png'),
    lurdinha_avatar_3:  require('../../assets/avatars/3.png'),
    lurdinha_avatar_4:  require('../../assets/avatars/4.png'),
    lurdinha_avatar_5:  require('../../assets/avatars/5.png'),
    lurdinha_avatar_6:  require('../../assets/avatars/6.png'),
    lurdinha_avatar_7:  require('../../assets/avatars/7.png'),
    lurdinha_avatar_8:  require('../../assets/avatars/8.png'),
    lurdinha_avatar_9:  require('../../assets/avatars/9.png'),
    lurdinha_avatar_10: require('../../assets/avatars/10.png'),
};

export const AVATAR_IDS = Object.keys(AVATAR_ASSET_MAP);

export const AVATAR_NAMES = {
    lurdinha_avatar_1:  'Lurdinha',
    lurdinha_avatar_2:  'Bolinha',
    lurdinha_avatar_3:  'Pipoca',
    lurdinha_avatar_4:  'Zinha',
    lurdinha_avatar_5:  'Turbo',
    lurdinha_avatar_6:  'Fofucha',
    lurdinha_avatar_7:  'Rubi',
    lurdinha_avatar_8:  'Neon',
    lurdinha_avatar_9:  'Cosmo',
    lurdinha_avatar_10: 'Estrela',
};

export const isLocalAvatar = (url) =>
    typeof url === 'string' && url.startsWith('lurdinha_avatar_');

export const resolveAvatarSource = (photoURL) => {
    if (isLocalAvatar(photoURL)) {
        return AVATAR_ASSET_MAP[photoURL] ?? null;
    }
    if (photoURL && !photoURL.includes('pravatar')) {
        return { uri: photoURL };
    }
    return null;
};
