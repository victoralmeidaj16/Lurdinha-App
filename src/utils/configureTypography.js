import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { typography } from '../theme';

const INTER_FONTS = new Set(Object.values(typography.fonts));

function resolveFontFamily(fontWeight) {
  switch (`${fontWeight || '400'}`) {
    case '500':
      return typography.fonts.medium;
    case '600':
      return typography.fonts.semibold;
    case '700':
    case 'bold':
      return typography.fonts.bold;
    case '800':
    case '900':
      return typography.fonts.extrabold;
    default:
      return typography.fonts.regular;
  }
}

function shouldPreserveFontFamily(fontFamily) {
  return !!fontFamily && fontFamily !== 'System' && !INTER_FONTS.has(fontFamily);
}

function withInterFont(style) {
  const flattenedStyle = StyleSheet.flatten(style) || {};

  if (shouldPreserveFontFamily(flattenedStyle.fontFamily)) {
    return style;
  }

  return [
    style,
    {
      fontFamily: resolveFontFamily(flattenedStyle.fontWeight),
      fontWeight: 'normal',
    },
  ];
}

function patchComponent(Component) {
  if (!Component?.render || Component.__interPatched) {
    return;
  }

  const originalRender = Component.render;

  Component.render = function patchedRender(...args) {
    const origin = originalRender.call(this, ...args);

    if (!origin?.props) {
      return origin;
    }

    return React.cloneElement(origin, {
      style: withInterFont(origin.props.style),
    });
  };

  Object.defineProperty(Component, '__interPatched', {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false,
  });
}

export default function configureTypography() {
  patchComponent(Text);
  patchComponent(TextInput);
}
