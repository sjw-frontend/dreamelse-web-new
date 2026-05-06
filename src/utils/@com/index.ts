// @ts-nocheck
import ExpoConstants from 'expo-constants';

import type { AppTypes } from '$/types';

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const expoConfig = ExpoConstants.expoConfig as AppTypes.ExpoConfig;

export const AppName = expoConfig.slug;
