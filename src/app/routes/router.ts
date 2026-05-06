import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { RootLayout } from './root-layout';
import { setRouterInstance } from '$/services/router.web';

// Pages — Batch 1
import { SplashPage } from '$/pages/splash/splash-ui';
import { LoginPage } from '$/pages/login/login-ui';

// Pages — Batch 2
import { HomePage } from '$/pages/home/home-ui';
import { MePage } from '$/pages/me/me-ui';

// Pages — Batch 3
import { CharacterListPage } from '$/pages/character-list/character-list-ui';
import { CharacterCreatePage } from '$/pages/character-create/character-create-ui';
import { CharacterDetailsPage } from '$/pages/character-details/character-details-ui';
import { CharacterInteractionPage } from '$/pages/character-interaction/character-interaction-ui';
import { CharacterSchedulePage } from '$/pages/character-schedule/character-schedule-ui';
import { CharacterStatsPage } from '$/pages/character-stats/character-stats-ui';
import { CharacterRelationshipsPage } from '$/pages/character-relationships/character-relationships-ui';
import { CharacterTimbreListPage } from '$/pages/character-timbre-list/character-timbre-list-ui';

// Pages — Batch 4
import { ScriptPreparePlayPage } from '$/pages/script-prepare-play/script-prepare-play-ui';
import { PlayScriptOpeningPage } from '$/pages/play-script-opening/play-script-opening-ui';
import { PlayScriptPage } from '$/pages/play-script/play-script-ui';
import { PlayScriptHistoryPage } from '$/pages/play-script-history/play-script-history-ui';
import { PlayCharacterOpeningPage } from '$/pages/play-character-opening/play-character-opening-ui';
import { ScriptEditPage } from '$/pages/script-edit/script-edit-ui';
import { ScriptDraftPage } from '$/pages/script-draft/script-draft-ui';

// Pages — Theater
import { TheaterPage } from '$/pages/theater/theater-ui';
import { TheaterCharacterCreatedPage } from '$/pages/theater-character-created/theater-character-created-ui';

// Pages — Batch 5
import { UserSettingsPage } from '$/pages/user-settings/user-settings-ui';
import { AboutPage } from '$/pages/about/about-ui';
import { CancelAccountPage } from '$/pages/cancel-account/cancel-account-ui';
import { PDFPage } from '$/pages/pdf/pdf-ui';
import { PermissionDeniedPage } from '$/pages/permission-denied/permission-denied-ui';
import { WebPage } from '$/pages/web/web-ui';

const rootRoute = createRootRoute({ component: RootLayout });

const splashRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: SplashPage });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage });
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/home', component: HomePage });
const meRoute = createRoute({ getParentRoute: () => rootRoute, path: '/me', component: MePage });
const characterListRoute = createRoute({ getParentRoute: () => rootRoute, path: '/characters', component: CharacterListPage });
const characterCreateRoute = createRoute({ getParentRoute: () => rootRoute, path: '/characters/create', component: CharacterCreatePage });
const characterDetailsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/characters/$characterId', component: CharacterDetailsPage });
const characterInteractionRoute = createRoute({ getParentRoute: () => rootRoute, path: '/characters/$characterId/interaction', component: CharacterInteractionPage });
const characterScheduleRoute = createRoute({ getParentRoute: () => rootRoute, path: '/characters/$characterId/schedule', component: CharacterSchedulePage });
const characterStatsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/characters/$characterId/stats', component: CharacterStatsPage });
const characterRelationshipsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/characters/$characterId/relationships', component: CharacterRelationshipsPage });
const characterTimbreListRoute = createRoute({ getParentRoute: () => rootRoute, path: '/characters/$characterId/timbre', component: CharacterTimbreListPage });
const scriptPreparePlayRoute = createRoute({ getParentRoute: () => rootRoute, path: '/scripts/$scriptId/prepare', component: ScriptPreparePlayPage });
const scriptEditRoute = createRoute({ getParentRoute: () => rootRoute, path: '/scripts/$scriptId/edit', component: ScriptEditPage });
const scriptDraftRoute = createRoute({ getParentRoute: () => rootRoute, path: '/scripts/draft', component: ScriptDraftPage });
const playScriptOpeningRoute = createRoute({ getParentRoute: () => rootRoute, path: '/play/$playId/opening', component: PlayScriptOpeningPage });
const playScriptRoute = createRoute({ getParentRoute: () => rootRoute, path: '/play/$playId', component: PlayScriptPage });
const playScriptHistoryRoute = createRoute({ getParentRoute: () => rootRoute, path: '/play/$playId/history', component: PlayScriptHistoryPage });
const playCharacterOpeningRoute = createRoute({ getParentRoute: () => rootRoute, path: '/play/character/$characterId/opening', component: PlayCharacterOpeningPage });
const theaterRoute = createRoute({ getParentRoute: () => rootRoute, path: '/theater', component: TheaterPage });
const theaterCharacterCreatedRoute = createRoute({ getParentRoute: () => rootRoute, path: '/theater/character-created', component: TheaterCharacterCreatedPage });
const userSettingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/me/settings', component: UserSettingsPage });
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/me/about', component: AboutPage });
const cancelAccountRoute = createRoute({ getParentRoute: () => rootRoute, path: '/me/cancel', component: CancelAccountPage });
const pdfRoute = createRoute({ getParentRoute: () => rootRoute, path: '/pdf', component: PDFPage });
const permissionDeniedRoute = createRoute({ getParentRoute: () => rootRoute, path: '/permission-denied', component: PermissionDeniedPage });
const webRoute = createRoute({ getParentRoute: () => rootRoute, path: '/webview', component: WebPage });

const routeTree = rootRoute.addChildren([
    splashRoute,
    loginRoute,
    homeRoute,
    meRoute,
    characterListRoute,
    characterCreateRoute,
    characterDetailsRoute,
    characterInteractionRoute,
    characterScheduleRoute,
    characterStatsRoute,
    characterRelationshipsRoute,
    characterTimbreListRoute,
    scriptPreparePlayRoute,
    scriptEditRoute,
    scriptDraftRoute,
    playScriptOpeningRoute,
    playScriptRoute,
    playScriptHistoryRoute,
    playCharacterOpeningRoute,
    theaterRoute,
    theaterCharacterCreatedRoute,
    userSettingsRoute,
    aboutRoute,
    cancelAccountRoute,
    pdfRoute,
    permissionDeniedRoute,
    webRoute,
]);

export const router = createRouter({ routeTree });

// Register router instance for RouterService
setRouterInstance(router);

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
