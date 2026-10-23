import { AppRegistry } from 'react-native';

import {
  FatalErrorScreen,
  installFatalErrorCapture,
  reportFatalError,
  withFatalErrorScreen,
} from './src/utils/fatalErrorCapture';

// Installed before expo and App load so errors thrown while importing them are caught too.
installFatalErrorCapture();

let registerRootComponent;
try {
  ({ registerRootComponent } = require('expo'));
} catch (error) {
  reportFatalError(error);
  registerRootComponent = (Component) => AppRegistry.registerComponent('main', () => Component);
}

let App;
try {
  App = require('./App').default;
} catch (error) {
  reportFatalError(error);
  App = FatalErrorScreen;
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(withFatalErrorScreen(App));
